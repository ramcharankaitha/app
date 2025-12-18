import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StockIn = ({ onBack, onNavigate, userRole = 'admin' }) => {
  useEffect(() => {
    // Navigate to products page when component mounts
    if (onNavigate) {
      onNavigate('products');
    }
  }, [onNavigate]);

  return null; // This component doesn't render anything, just redirects
};

export default StockIn;
