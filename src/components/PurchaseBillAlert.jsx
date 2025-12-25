import React from 'react';

const PurchaseBillAlert = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const handleBack = () => {
    if (onNavigate) {
      onNavigate('transactionMenu');
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-main">
        <header className="dashboard-header" style={{ padding: '16px 24px' }}>
          <div className="header-left">
            <button className="sidebar-toggle" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-title">
              <h1>Purchase Bill Alert</h1>
              <p>Monitor purchase bill alerts</p>
            </div>
          </div>
        </header>

        <main className="dashboard-content" style={{ padding: '16px 24px' }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 40px', 
            color: '#666',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <i className="fas fa-bell" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Purchase Bill Alert Module</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>Purchase bill alert monitoring will be available here.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PurchaseBillAlert;

