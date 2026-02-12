import React, { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'error', onClose, duration = 4000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

  return (
    <div className={`toast-notification toast-${type} ${visible ? 'toast-enter' : 'toast-exit'}`}>
      <div className="toast-content">
        <i className={`fas ${icon} toast-icon`}></i>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={() => { setVisible(false); setTimeout(() => onClose && onClose(), 300); }}>
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Toast;
