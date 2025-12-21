/**
 * Mobile-friendly file download utility
 * Works in web browsers and mobile APK/webview contexts
 */

/**
 * Download CSV file with mobile APK compatibility
 * @param {string} csvContent - The CSV content as a string
 * @param {string} filename - The filename for the downloaded file
 */
export const downloadCSV = (csvContent, filename) => {
  try {
    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    const contentWithBOM = BOM + csvContent;
    
    // Check if we're in a mobile/webview context
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isWebView = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    
    // For mobile APK/webview, use data URI approach which is more reliable
    if (isMobile || isWebView) {
      // Convert to base64
      const base64Content = btoa(unescape(encodeURIComponent(contentWithBOM)));
      const dataUri = `data:text/csv;charset=utf-8;base64,${base64Content}`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = filename;
      link.style.display = 'none';
      
      // Append to body (required for iOS)
      document.body.appendChild(link);
      
      // Trigger download
      try {
        link.click();
      } catch (err) {
        console.warn('Link click failed, trying window.open:', err);
        // Fallback: open in new window/tab
        window.open(dataUri, '_blank');
      }
      
      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      return;
    }
    
    // For desktop browsers, use Blob API (more efficient)
    try {
      const blob = new Blob([contentWithBOM], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      link.style.visibility = 'hidden';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (blobError) {
      console.warn('Blob download failed, falling back to data URI:', blobError);
      // Fallback to data URI if Blob fails
      const base64Content = btoa(unescape(encodeURIComponent(contentWithBOM)));
      const dataUri = `data:text/csv;charset=utf-8;base64,${base64Content}`;
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    }
  } catch (error) {
    console.error('Download CSV error:', error);
    // Last resort: try window.open with data URI
    try {
      const BOM = '\uFEFF';
      const contentWithBOM = BOM + csvContent;
      const base64Content = btoa(unescape(encodeURIComponent(contentWithBOM)));
      const dataUri = `data:text/csv;charset=utf-8;base64,${base64Content}`;
      window.open(dataUri, '_blank');
    } catch (fallbackError) {
      console.error('All download methods failed:', fallbackError);
      alert('Download failed. Please copy the data manually or try again.');
    }
  }
};

/**
 * Download file from server endpoint (for server-generated files)
 * @param {string} url - The server endpoint URL
 * @param {string} filename - The filename for the downloaded file
 * @param {object} options - Fetch options (headers, method, etc.)
 */
export const downloadFileFromServer = async (url, filename, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Get the blob data
    const blob = await response.blob();
    
    // Check if we're in mobile/webview
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isWebView = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    
    if (isMobile || isWebView) {
      // For mobile, convert blob to data URI
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result;
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        try {
          link.click();
        } catch (err) {
          console.warn('Link click failed, using window.open:', err);
          window.open(dataUri, '_blank');
        }
        
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      };
      reader.readAsDataURL(blob);
    } else {
      // For desktop, use Blob URL
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
    }
  } catch (error) {
    console.error('Download file from server error:', error);
    throw error;
  }
};

