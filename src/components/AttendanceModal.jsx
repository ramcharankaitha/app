import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

const AttendanceModal = ({ type, onSuccess, onClose, userRole = 'staff' }) => {
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
        ? `${API_BASE_URL}/supervisor-attendance/${type}`
        : `${API_BASE_URL}/attendance/${type}`;

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
              {!cameraStarted ? (
                <div
                  onClick={handleStartCamera}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', cursor: 'pointer', background: '#f5f5f5', borderRadius: '12px', margin: '10px 0' }}
                >
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#dc3545', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <i className="fas fa-camera" style={{ fontSize: '32px', color: '#fff' }}></i>
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: '0 0 4px' }}>Tap to open camera</p>
                  <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>Camera will open for {type === 'checkin' ? 'check in' : 'check out'}</p>
                </div>
              ) : (
                <>
                  <div className="camera-preview">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }}
                    />
                  </div>
                  {!stream && (
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px', color: '#dc3545' }}></i>
                      <p style={{ fontSize: '13px', color: '#888', margin: '8px 0 0' }}>Starting camera...</p>
                    </div>
                  )}
                </>
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
              {isProcessing && (
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

