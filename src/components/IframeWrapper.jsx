import React, { useState, useRef, useEffect } from 'react';

/**
 * IframeWrapper Component
 * A responsive iframe component optimized for mobile APK conversion
 * Can be used to embed external content or wrap content for better mobile compatibility
 */
const IframeWrapper = ({ 
  src, 
  title = 'Embedded Content',
  width = '100%',
  height = '100%',
  allowFullScreen = true,
  sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-presentation',
  className = '',
  style = {},
  onLoad = null,
  showLoader = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current && onLoad) {
      iframeRef.current.addEventListener('load', handleIframeLoad);
      return () => {
        if (iframeRef.current) {
          iframeRef.current.removeEventListener('load', handleIframeLoad);
        }
      };
    }
  }, [onLoad]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    if (onLoad) {
      onLoad();
    }
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load content');
  };

  const containerStyle = {
    position: 'relative',
    width: width,
    height: height,
    minHeight: '400px',
    border: 'none',
    overflow: 'hidden',
    ...style
  };

  const iframeStyle = {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block'
  };

  const loaderStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    zIndex: 1
  };

  return (
    <div className={`iframe-wrapper ${className}`} style={containerStyle}>
      {isLoading && showLoader && (
        <div style={loaderStyle}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #dc3545',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px'
          }}></div>
          <p style={{ color: '#666', fontSize: '14px' }}>Loading content...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {error ? (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#dc3545'
        }}>
          <i className="fas fa-exclamation-circle" style={{ fontSize: '48px', marginBottom: '10px' }}></i>
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              if (iframeRef.current) {
                iframeRef.current.src = iframeRef.current.src;
              }
            }}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          style={iframeStyle}
          allowFullScreen={allowFullScreen}
          sandbox={sandbox}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      )}
    </div>
  );
};

/**
 * MobileIframeContainer Component
 * Wraps the entire app or components in an iframe-friendly container for APK conversion
 */
export const MobileIframeContainer = ({ children, className = '' }) => {
  const containerStyle = {
    width: '100%',
    height: '100vh',
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    position: 'relative',
    backgroundColor: '#fff'
  };

  return (
    <div className={`mobile-iframe-container ${className}`} style={containerStyle}>
      {children}
    </div>
  );
};

export default IframeWrapper;

