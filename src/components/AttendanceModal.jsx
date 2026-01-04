import React, { useState, useRef, useEffect } from 'react';

const AttendanceModal = ({ type, onSuccess, onClose, userRole = 'staff' }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

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

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error accessing camera:', err);
      
      let errorMessage = 'Unable to access camera. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera permissions in your browser settings and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application. Please close other apps using the camera.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage += 'Camera does not support the required settings. Please try again.';
      } else {
        errorMessage += 'Please check your camera permissions and try again.';
      }
      
      setError(errorMessage);
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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      setIsCapturing(true);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsCapturing(false);
  };

  const submitAttendance = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (!userData.username) {
        setError('Username not found. Please log in again.');
        setIsProcessing(false);
        return;
      }

      console.log('Submitting attendance with face recognition...');
      console.log('Username:', userData.username);
      console.log('Type:', type);
      console.log('User Role:', userRole);

      // Use supervisor-attendance routes for supervisors, attendance routes for staff
      const apiEndpoint = userRole === 'supervisor' 
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/supervisor-attendance/${type}`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/attendance/${type}`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: capturedImage,
          timestamp: new Date().toISOString(),
          username: userData.username.trim()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || `Server error: ${response.status}` };
        }
        throw new Error(errorData.error || 'Failed to record attendance');
      }

      const data = await response.json();

      if (data.success) {
        console.log('Attendance recorded successfully with face recognition');
        stopCamera();
        // Pass success message and warning to parent component to display in-app
        setTimeout(() => {
          onSuccess(type, data.attendance.check_in_time || data.attendance.check_out_time, data.message, data.warning);
        }, 500);
      } else {
        setError(data.error || 'Failed to record attendance. Please try again.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Error submitting attendance:', err);
      setError(err.message || 'Network error. Please check your connection and try again.');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="attendance-modal-overlay" onClick={handleClose}>
      <div className="attendance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="attendance-modal-header">
          <h2>{type === 'checkin' ? 'Check In' : 'Check Out'}</h2>
          <button className="close-btn" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="attendance-modal-body">
          {!capturedImage ? (
            <>
              <div className="camera-preview">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }}
                />
              </div>
              {error && (
                <div className="error-message" style={{ marginTop: '15px', padding: '10px', background: '#fee', color: '#c33', borderRadius: '4px' }}>
                  {error}
                </div>
              )}
              <div className="attendance-actions">
                <button className="btn-secondary" onClick={handleClose}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={capturePhoto} disabled={!stream}>
                  <i className="fas fa-camera"></i> Capture Photo
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="captured-image-preview">
                <img src={capturedImage} alt="Captured" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }} />
              </div>
              {error && (
                <div className="error-message" style={{ marginTop: '15px', padding: '10px', background: '#fee', color: '#c33', borderRadius: '4px' }}>
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}
              {isProcessing && !error && (
                <div style={{ 
                  padding: '12px 16px',
                  background: '#d1ecf1',
                  color: '#0c5460',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '14px',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: '500'
                }}>
                  <i className="fas fa-spinner fa-spin"></i> 
                  Verifying face with saved face data...
                </div>
              )}
              <div className="attendance-actions">
                {!isProcessing && (
                  <>
                    <button className="btn-secondary" onClick={retakePhoto}>
                      Retake
                    </button>
                    <button className="btn-primary" onClick={submitAttendance}>
                      <i className="fas fa-check"></i> Confirm {type === 'checkin' ? 'Check In' : 'Check Out'}
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

export default AttendanceModal;

