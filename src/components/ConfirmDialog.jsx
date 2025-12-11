import React from 'react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onCancel}
    >
      <div 
        style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '450px',
          width: '90%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color)',
          animation: 'slideUp 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Title */}
        {title && (
          <h3 style={{
            margin: '0 0 16px 0',
            color: 'var(--text-primary)',
            fontSize: '20px',
            fontWeight: '700',
            transition: 'color 0.3s ease'
          }}>
            {title}
          </h3>
        )}

        {/* Message */}
        <p style={{
          margin: '0 0 24px 0',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          lineHeight: '1.6',
          transition: 'color 0.3s ease'
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--border-color)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--bg-secondary)';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              background: 'var(--accent-color)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              color: '#fff',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--accent-color)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

