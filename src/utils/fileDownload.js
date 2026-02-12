/**
 * Mobile-friendly file download utility
 * Works in web browsers and mobile APK/webview contexts
 */
import { API_BASE_URL } from '../services/api';

/**
 * Download CSV file with mobile APK compatibility
 * For mobile APK/webview, we use server-side download to ensure it works
 * @param {string} csvContent - The CSV content as a string
 * @param {string} filename - The filename for the downloaded file
 */
export const downloadCSV = async (csvContent, filename) => {
  try {
    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    const contentWithBOM = BOM + csvContent;
    
    // Check if we're in a mobile/webview context
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isWebView = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    
    // For mobile APK/webview, use server-side download approach (most reliable)
    if (isMobile || isWebView) {
      try {
        // Send CSV content to server endpoint which will return it as a downloadable file
        const response = await fetch(`${API_BASE_URL}/export/download-csv`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            content: contentWithBOM,
            filename: filename
          })
        });

        if (response.ok) {
          // Get the blob from response
          const blob = await response.blob();
          
          // Create object URL from blob
          const blobUrl = URL.createObjectURL(blob);
          
          // Create a temporary link element
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          link.style.display = 'none';
          link.target = '_self'; // Important for mobile
          
          // Append to body and click
          document.body.appendChild(link);
          
          // Use a small delay to ensure link is ready
          requestAnimationFrame(() => {
            try {
              link.click();
            } catch (clickError) {
              // Alternative: dispatch mouse event
              const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
              });
              link.dispatchEvent(event);
            }
            
            // Clean up after delay
            setTimeout(() => {
              try {
                document.body.removeChild(link);
              } catch (e) {
                // Link might have been removed already
              }
              URL.revokeObjectURL(blobUrl);
            }, 1000);
          });
          
          return;
        } else {
          throw new Error('Server download failed');
        }
      } catch (serverError) {
        console.warn('Server download failed, trying direct blob download:', serverError);
        // Fallback to direct blob download
      }
    }
    
    // For desktop browsers or fallback, use Blob API
    try {
      const blob = new Blob([contentWithBOM], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      link.target = '_self';
      
      document.body.appendChild(link);
      
      // Use requestAnimationFrame for better browser compatibility
      requestAnimationFrame(() => {
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      });
    } catch (blobError) {
      console.error('Blob download failed:', blobError);
      alert('Download failed. Please try again or contact support.');
    }
  } catch (error) {
    console.error('Download CSV error:', error);
    alert('Download failed. Please try again or contact support.');
  }
};

/**
 * Download file from server endpoint (for server-generated files)
 * This works better in mobile APK/webview contexts
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

    // Get the blob data
    const blob = await response.blob();
    
    // Create object URL from blob (works in most contexts)
    const blobUrl = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    link.target = '_self'; // Important for mobile compatibility
    
    // Append to body (required for iOS and webview)
    document.body.appendChild(link);
    
    // Use requestAnimationFrame for better compatibility
    requestAnimationFrame(() => {
      try {
        link.click();
      } catch (clickError) {
        console.warn('Link click failed, trying programmatic approach:', clickError);
        // Alternative: dispatch mouse event
        const event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        link.dispatchEvent(event);
      }
      
      // Clean up after delay
      setTimeout(() => {
        try {
          document.body.removeChild(link);
        } catch (e) {
          // Link might have been removed already
        }
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    });
  } catch (error) {
    console.error('Download file from server error:', error);
    throw error;
  }
};
