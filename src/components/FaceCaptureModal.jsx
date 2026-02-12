import React, { useState, useRef, useEffect } from 'react';
import './faceCaptureModal.css';

const FaceCaptureModal = ({ onSuccess, onClose, userRole, username }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const attachStream = async (mediaStream) => {
    setStream(mediaStream);
    setCameraReady(true);
    // Wait a tick for the video element to render before attaching stream
    await new Promise(resolve => setTimeout(resolve, 50));
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      try {
        await videoRef.current.play();
      } catch (playErr) {
        console.warn('Auto-play failed:', playErr);
      }
    }
    setError('');
  };

  const startCamera = async () => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }

      // Check if we're on HTTPS or localhost (required for camera access)
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isSecure) {
        setError('Camera access requires a secure connection (HTTPS). Please access the site via HTTPS.');
        return;
      }

      // Check permission state first (if supported) to give better error messages
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permResult = await navigator.permissions.query({ name: 'camera' });
          if (permResult.state === 'denied') {
            setError('Camera permission is blocked. Please go to your browser settings, allow camera access for this site, then reload the page.');
            return;
          }
        } catch (permErr) {
          // permissions.query for camera not supported in all browsers — continue normally
        }
      }

      // Try with ideal constraints first
      const constraintsList = [
        { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } },
        { video: { facingMode: 'user' } },
        { video: true }
      ];

      let mediaStream = null;
      let lastErr = null;

      for (const constraints of constraintsList) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastErr = err;
          // If permission denied, don't retry with other constraints
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            break;
          }
          continue;
        }
      }

      if (mediaStream) {
        await attachStream(mediaStream);
        return;
      }

      // All attempts failed — show appropriate error
      const err = lastErr;
      let errorMessage = 'Unable to access camera. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please tap the lock/info icon in your browser\'s address bar, allow Camera access, then reload the page.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application. Please close other apps using the camera and try again.';
      } else if (err.name === 'AbortError') {
        errorMessage += 'Camera access was interrupted. Please try again.';
      } else {
        errorMessage += `Error: ${err.message || 'Unknown error'}. Please check your browser settings and try again.`;
      }
      
      setError(errorMessage);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(`Unable to access camera: ${err.message || 'Unknown error'}. Please check your browser settings.`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Limit image dimensions to reduce size (max 800px width)
      const maxWidth = 800;
      const aspectRatio = video.videoWidth / video.videoHeight;
      canvas.width = Math.min(video.videoWidth, maxWidth);
      canvas.height = canvas.width / aspectRatio;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Use lower quality (0.7) to reduce file size while maintaining acceptable quality
      const imageData = canvas.toDataURL('image/jpeg', 0.7);
      setCapturedImage(imageData);
      setIsCapturing(true);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsCapturing(false);
  };

  const submitFaceData = async () => {
    if (!capturedImage) {
      setError('Please capture your face first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Try to get username from props first, then from localStorage
      let currentUsername = username ? username.trim() : null;
      
      if (!currentUsername) {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            // Only use username field, not name (name is the full name, not the username)
            currentUsername = userData.username || null;
            if (currentUsername) {
              currentUsername = currentUsername.trim();
            }
            
            console.log('Retrieved username from localStorage:', currentUsername);
            console.log('Full userData:', userData);
            
            // If still no username and we have userRole, we might need to fetch it
            if (!currentUsername) {
              console.warn('Username not found in userData:', userData);
            }
          } catch (e) {
            console.error('Error parsing userData:', e);
          }
        }
      }
      
      if (!currentUsername) {
        setError('Username not found. Please log out and log in again to refresh your session.');
        setIsProcessing(false);
        return;
      }
      
      console.log('Final username being sent:', currentUsername);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const endpoint = userRole === 'staff' ? '/staff/face-data' : '/users/face-data';
      
      console.log('Sending face data to:', `${apiUrl}${endpoint}`);
      console.log('Username:', currentUsername);
      console.log('UserRole:', userRole);
      console.log('Image data length:', capturedImage ? capturedImage.length : 0);
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: currentUsername,
          faceImage: capturedImage
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } catch (e) {
          throw new Error(errorText || `Server error: ${response.status}`);
        }
      }

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear any errors and show success
        setError('');
        setIsProcessing(false);
        
        // Show success indicator - keep modal open briefly to show success
        const successMsg = data.message || 'Face captured successfully! You can now use face recognition for check-in and check-out.';
        
        // Wait 2 seconds to show success message, then close modal and show in parent
        setTimeout(() => {
          stopCamera();
          onSuccess(successMsg);
        }, 2000);
      } else {
        setError(data.error || 'Failed to save face data. Please try again.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Error submitting face data:', err);
      console.error('Error details:', err.message, err.stack);
      
      // Check if it's a network error
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Network error: Could not connect to server. Please check if the server is running and try again.');
      } else {
        setError(err.message || 'Failed to save face data. Please try again.');
      }
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="face-capture-modal-overlay" onClick={handleClose}>
      <div className="face-capture-modal" onClick={(e) => e.stopPropagation()}>
        <div className="face-capture-modal-header">
          <h2>Live Capture Face</h2>
          <button className="close-btn" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="face-capture-modal-body">
          <div className="face-capture-instructions">
            <h3>Capture Your Face</h3>
            <p>Position yourself facing the camera directly. Make sure your entire face is clearly visible and well-lit.</p>
          </div>

          {!capturedImage ? (
            <>
              {!cameraReady ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: '20px' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#f8d7da', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-camera" style={{ fontSize: '40px', color: '#dc3545' }}></i>
                    </div>
                    <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', margin: 0 }}>Tap the button below to open your camera</p>
                    {error && (
                      <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i> {error}
                      </div>
                    )}
                    <div className="face-capture-actions">
                      <button className="btn-secondary" onClick={handleClose}>
                        Cancel
                      </button>
                      <button className="btn-primary" onClick={async () => { await startCamera(); }}>
                        <i className="fas fa-video"></i> Open Camera
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="face-capture-preview">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="face-video"
                    />
                    <div className="face-guide-overlay">
                      <div className="face-guide-circle"></div>
                    </div>
                  </div>
                  {error && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i> {error}
                    </div>
                  )}
                  <div className="face-capture-actions">
                    <button className="btn-secondary" onClick={handleClose}>
                      Cancel
                    </button>
                    <button className="btn-primary" onClick={capturePhoto} disabled={!stream}>
                      <i className="fas fa-camera"></i> Capture Face
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="face-capture-result">
                <img src={capturedImage} alt="Captured Face" />
                {!isProcessing && !error && (
                  <div className="capture-checkmark" style={{ background: 'rgba(40, 167, 69, 0.9)' }}>
                    <i className="fas fa-check-circle"></i>
                  </div>
                )}
              </div>
              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}
              {isProcessing && !error && (
                <div style={{ 
                  padding: '12px 16px',
                  background: '#d1ecf1',
                  color: '#0c5460',
                  borderRadius: '8px',
                  width: '100%',
                  maxWidth: '480px',
                  textAlign: 'center',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '16px'
                }}>
                  <i className="fas fa-spinner fa-spin"></i> Saving face data to database...
                </div>
              )}
              {!isProcessing && !error && capturedImage && (
                <div style={{ 
                  padding: '12px 16px',
                  background: '#d4edda',
                  color: '#155724',
                  borderRadius: '8px',
                  width: '100%',
                  maxWidth: '480px',
                  textAlign: 'center',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '16px',
                  fontWeight: '600'
                }}>
                  <i className="fas fa-check-circle"></i> Face saved successfully! Closing...
                </div>
              )}
              <div className="face-capture-actions">
                {!isProcessing && (
                  <>
                    <button className="btn-secondary" onClick={retakePhoto}>
                      <i className="fas fa-redo"></i> Retake
                    </button>
                    <button className="btn-primary" onClick={submitFaceData}>
                      <i className="fas fa-check"></i> Save Face
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default FaceCaptureModal;
