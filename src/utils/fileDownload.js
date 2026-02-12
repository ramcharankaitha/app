/**
 * Mobile-friendly file download utility
 * Works in web browsers and Android APK/WebView contexts
 * 
 * Android WebView cannot handle blob: URLs for downloads.
 * When running inside the APK, we use the AndroidBridge JS interface
 * to pass base64-encoded file data directly to native Android code,
 * which saves it to the Downloads folder via MediaStore / FileOutputStream.
 */

/**
 * Check if the Android native bridge is available (running inside the APK)
 */
const hasAndroidBridge = () =>
  typeof window !== 'undefined' && window.AndroidBridge && typeof window.AndroidBridge.downloadFile === 'function';

/**
 * Convert a string to base64 (handles UTF-8 / BOM correctly)
 */
const stringToBase64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Convert a Blob to base64
 */
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // result is "data:<mime>;base64,XXXX" – strip the prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/**
 * Desktop / normal-browser blob download (fallback)
 */
const downloadViaBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
};

/**
 * Download CSV content as a file.
 * @param {string} csvContent - Raw CSV text
 * @param {string} filename   - e.g. "report_2026-02-12.csv"
 */
export const downloadCSV = async (csvContent, filename) => {
  try {
    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    const contentWithBOM = BOM + csvContent;

    // ---- Android APK path (no blob: URLs) ----
    if (hasAndroidBridge()) {
      const base64 = stringToBase64(contentWithBOM);
      window.AndroidBridge.downloadFile(base64, filename, 'text/csv');
      return;
    }

    // ---- Desktop / normal browser path ----
    const blob = new Blob([contentWithBOM], { type: 'text/csv;charset=utf-8;' });
    downloadViaBlob(blob, filename);
  } catch (error) {
    console.error('Download CSV error:', error);
    alert('Download failed. Please try again or contact support.');
  }
};

/**
 * Download a file that is fetched from a server endpoint.
 * Used for server-generated exports (attendance CSV, etc.)
 * @param {string} url      - Full API endpoint URL
 * @param {string} filename - Desired filename
 * @param {object} options  - Extra fetch options
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

    const blob = await response.blob();

    // ---- Android APK path ----
    if (hasAndroidBridge()) {
      const base64 = await blobToBase64(blob);
      const mimeType = blob.type || 'application/octet-stream';
      window.AndroidBridge.downloadFile(base64, filename, mimeType);
      return;
    }

    // ---- Desktop / normal browser path ----
    downloadViaBlob(blob, filename);
  } catch (error) {
    console.error('Download file from server error:', error);
    throw error;
  }
};
