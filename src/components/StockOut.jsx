import React, { useEffect } from 'react';

const StockOut = ({ onBack, onNavigate, userRole = 'admin' }) => {
  useEffect(() => {
    // Navigate to customers page when component mounts
    if (onNavigate) {
      onNavigate('customers');
    }
  }, [onNavigate]);

  return null; // This component doesn't render anything, just redirects
};

export default StockOut;
