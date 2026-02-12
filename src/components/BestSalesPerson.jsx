import React, { useState, useEffect } from 'react';
import { exportAPI, API_BASE_URL } from '../services/api';
import './BestSalesPerson.css';

const BestSalesPerson = () => {
  const [bestPerson, setBestPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBestSalesPerson();
  }, []);

  const fetchBestSalesPerson = async () => {
    try {
      setLoading(true);
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const response = await exportAPI.getBestSalesPerson(month, year);
      
      if (response.success && response.bestSalesPerson) {
        setBestPerson(response.bestSalesPerson);
      }
    } catch (err) {
      console.error('Error fetching best sales person:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  };

  if (loading) {
    return null;
  }

  if (!bestPerson) {
    return null;
  }

  const monthName = getMonthName(bestPerson.month);

  return (
    <div className="best-sales-person-container">
      <div className="sparkle-wrapper">
        <div className="sparkle sparkle-1"></div>
        <div className="sparkle sparkle-2"></div>
        <div className="sparkle sparkle-3"></div>
        <div className="sparkle sparkle-4"></div>
        <div className="sparkle sparkle-5"></div>
        <div className="sparkle sparkle-6"></div>
      </div>
      
      <div className="best-sales-content">
        <div className="trophy-icon">
          <i className="fas fa-trophy"></i>
        </div>
        
        <div className="best-sales-info">
          <div className="best-sales-label">Best Sales of {monthName} {bestPerson.year}</div>
          <div className="best-sales-name">{bestPerson.name}</div>
          <div className="best-sales-stats">
            <span>{formatCurrency(bestPerson.totalRevenue)}</span>
            <span className="separator">•</span>
            <span>{bestPerson.totalSales} Sales</span>
          </div>
        </div>
        
        <div className="best-sales-photo">
          {bestPerson.photo ? (
            <img 
              src={bestPerson.photo.startsWith('http') ? bestPerson.photo : `${API_BASE_URL.replace('/api', '')}${bestPerson.photo}`} 
              alt={bestPerson.name}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div className="photo-placeholder" style={{ display: bestPerson.photo ? 'none' : 'flex' }}>
            {bestPerson.name ? bestPerson.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'BS'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestSalesPerson;

