import React from 'react';
import './Toast.css';

const Toast = ({ message, type = 'error', onClose }) => {
  if (!message) return null;

  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

  return (
    <div className="toast-popup-overlay" onClick={onClose}>
      <div className={`toast-popup toast-popup-${type}`} onClick={(e) => e.stopPropagation()}>
        <div className={`toast-popup-icon toast-popup-icon-${type}`}>
          <i className={`fas ${icon}`}></i>
        </div>
        <div className="toast-popup-message">{message}</div>
        <button className="toast-popup-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default Toast;
