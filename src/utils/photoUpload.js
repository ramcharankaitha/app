import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

/**
 * Mobile-friendly document/file upload utility (for PDFs, etc.)
 * Falls back to file input since Camera plugin only supports images
 */
export const pickDocument = async (accept = 'image/*,.pdf') => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file size (max 10MB for documents)
        if (file.size > 10 * 1024 * 1024) {
          resolve({
            success: false,
            error: 'File size should be less than 10MB'
          });
          return;
        }

        resolve({
          file,
          success: true
        });
      } else {
        resolve({
          success: false,
          error: 'No file selected'
        });
      }
      
      document.body.removeChild(input);
    };

    input.oncancel = () => {
      resolve({
        success: false,
        cancelled: true
      });
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
};

/**
 * Mobile-friendly photo upload utility
 * Works in both Capacitor apps (APK) and web browsers
 */
export const pickPhoto = async (options = {}) => {
  const isNative = Capacitor.isNativePlatform();
  
  // If running in native app (APK), use Capacitor Camera
  if (isNative) {
    try {
      const image = await Camera.getPhoto({
        quality: options.quality || 80,
        allowEditing: options.allowEditing !== false,
        resultType: 'base64',
        source: options.source || 'PHOTOLIBRARY', // 'PHOTOLIBRARY' or 'CAMERA'
        ...options
      });

      // Convert base64 to data URL
      const imageUrl = `data:image/${image.format || 'jpeg'};base64,${image.base64String}`;
      
      // Create a File-like object for compatibility
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `photo.${image.format || 'jpg'}`, {
        type: `image/${image.format || 'jpeg'}`
      });

      return {
        file,
        preview: imageUrl,
        success: true
      };
    } catch (error) {
      console.error('Camera plugin error:', error);
      // Fall through to file input fallback
    }
  }

  // Fallback: Use file input (works in web and as fallback in mobile)
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          resolve({
            success: false,
            error: 'Photo size should be less than 5MB'
          });
          return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          resolve({
            success: false,
            error: 'Please select a valid image file'
          });
          return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            file,
            preview: reader.result,
            success: true
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve({
          success: false,
          error: 'No file selected'
        });
      }
      
      // Clean up
      document.body.removeChild(input);
    };

    input.oncancel = () => {
      resolve({
        success: false,
        cancelled: true
      });
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
};

/**
 * Show action sheet to choose between camera and photo library (mobile only)
 */
export const pickPhotoWithSource = async (options = {}) => {
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    // In native app, show options
    return new Promise((resolve) => {
      // Create a simple modal to choose source
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;
      
      const content = document.createElement('div');
      content.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 300px;
        width: 90%;
      `;
      
      const title = document.createElement('h3');
      title.textContent = 'Select Photo Source';
      title.style.cssText = 'margin: 0 0 20px 0; font-size: 18px;';
      
      const cameraBtn = document.createElement('button');
      cameraBtn.textContent = '📷 Take Photo';
      cameraBtn.style.cssText = `
        width: 100%;
        padding: 12px;
        margin-bottom: 10px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
      `;
      cameraBtn.onclick = async () => {
        document.body.removeChild(modal);
        const result = await pickPhoto({ ...options, source: 'CAMERA' });
        resolve(result);
      };
      
      const libraryBtn = document.createElement('button');
      libraryBtn.textContent = '🖼️ Choose from Gallery';
      libraryBtn.style.cssText = `
        width: 100%;
        padding: 12px;
        margin-bottom: 10px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
      `;
      libraryBtn.onclick = async () => {
        document.body.removeChild(modal);
        const result = await pickPhoto({ ...options, source: 'PHOTOLIBRARY' });
        resolve(result);
      };
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = `
        width: 100%;
        padding: 12px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
      `;
      cancelBtn.onclick = () => {
        document.body.removeChild(modal);
        resolve({ success: false, cancelled: true });
      };
      
      content.appendChild(title);
      content.appendChild(cameraBtn);
      content.appendChild(libraryBtn);
      content.appendChild(cancelBtn);
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve({ success: false, cancelled: true });
        }
      };
    });
  }
  
  // In web, just use file input
  return pickPhoto(options);
};

