import React, { useEffect } from 'react';
import './SuccessPopup.css';

const SuccessPopup = ({ message, credentials, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="success-popup-overlay" onClick={onClose}>
      <div className="success-popup" onClick={(e) => e.stopPropagation()}>
        <div className="success-popup-icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <div className="success-popup-message">{message}</div>
        {credentials && (
          <div className="success-popup-credentials">
            <div className="credentials-title">Login Credentials:</div>
            <div className="credentials-row">
              <strong>Username:</strong> {credentials.username}
            </div>
            <div className="credentials-row">
              <strong>Password:</strong> {credentials.password}
            </div>
            <div className="credentials-warning">
              <i className="fas fa-exclamation-triangle"></i> Save these credentials
            </div>
          </div>
        )}
        <button className="success-popup-close" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessPopup;
