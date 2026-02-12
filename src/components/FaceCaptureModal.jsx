import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
import './faceCaptureModal.css';

const FaceCaptureModal = ({ onSuccess, onClose, userRole, username }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cameraStarted, setCameraStarted] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const attachStream = async (mediaStream) => {
    setStream(mediaStream);
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

  const handleStartCamera = async () => {
    setCameraStarted(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

      const constraintsList = [
        { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } },
        { video: { facingMode: 'user' } },
        { video: true }
      ];

      for (const constraints of constraintsList) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          await attachStream(mediaStream);
          return;
        } catch (err) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') break;
          continue;
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
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

      const apiUrl = API_BASE_URL;
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
              {!cameraStarted ? (
                <div
                  onClick={handleStartCamera}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', cursor: 'pointer', background: '#f5f5f5', borderRadius: '12px', margin: '10px 0' }}
                >
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#dc3545', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <i className="fas fa-camera" style={{ fontSize: '32px', color: '#fff' }}></i>
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: '0 0 4px' }}>Tap to open camera</p>
                  <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>Position your face clearly for capture</p>
                </div>
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
                  {!stream && (
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px', color: '#dc3545' }}></i>
                      <p style={{ fontSize: '13px', color: '#888', margin: '8px 0 0' }}>Starting camera...</p>
                    </div>
                  )}
                </>
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
