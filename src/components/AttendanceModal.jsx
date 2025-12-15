import React, { useState, useRef, useEffect } from 'react';

const AttendanceModal = ({ type, onSuccess, onClose }) => {
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
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please allow camera permissions.');
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

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/attendance/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: capturedImage,
          timestamp: new Date().toISOString(),
          username: userData.username
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
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
      setError('Network error. Please check your connection and try again.');
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
                  {error}
                </div>
              )}
              <div className="attendance-actions">
                <button className="btn-secondary" onClick={retakePhoto} disabled={isProcessing}>
                  Retake
                </button>
                <button className="btn-primary" onClick={submitAttendance} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i> Confirm {type === 'checkin' ? 'Check In' : 'Check Out'}
                    </>
                  )}
                </button>
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

