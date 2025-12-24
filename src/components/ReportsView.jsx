import React, { useState } from 'react';
import SalesReportContent from './SalesReportContent';
import StockInReportView from './StockInReportView';
import StockOutReportView from './StockOutReportView';
import StockDetailsReportView from './StockDetailsReportView';
import LowStockReportView from './LowStockReportView';
import StockPerformanceReportView from './StockPerformanceReportView';
import './staffAttendanceView.css';

const ReportsView = ({ onClose }) => {
  const [selectedReport, setSelectedReport] = useState('sales');

  const reportOptions = [
    { value: 'sales', label: 'Sales Report', icon: 'fa-chart-line' },
    { value: 'stockIn', label: 'Stock In Report', icon: 'fa-box-open' },
    { value: 'stockOut', label: 'Stock Out Report', icon: 'fa-box' },
    { value: 'stockDetails', label: 'Stock Details Report', icon: 'fa-warehouse' },
    { value: 'lowStock', label: 'Low Stock Report', icon: 'fa-exclamation-triangle' },
    { value: 'stockPerformance', label: 'Stock Performance Report', icon: 'fa-chart-bar' }
  ];

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'sales':
        return <SalesReportContent onClose={onClose} />;
      case 'stockIn':
        return <StockInReportView onClose={onClose} />;
      case 'stockOut':
        return <StockOutReportView onClose={onClose} />;
      case 'stockDetails':
        return <StockDetailsReportView onClose={onClose} />;
      case 'lowStock':
        return <LowStockReportView onClose={onClose} />;
      case 'stockPerformance':
        return <StockPerformanceReportView onClose={onClose} />;
      default:
        return <SalesReportContent onClose={onClose} />;
    }
  };

  return (
    <div className="attendance-view-overlay" onClick={onClose}>
      <div className="attendance-view-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1400px', width: '95%' }}>
        <div className="attendance-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '20px', borderBottom: '2px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Reports</h2>
            <div style={{ position: 'relative', minWidth: '280px' }}>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                style={{
                  padding: '12px 45px 12px 40px',
                  borderRadius: '8px',
                  border: '2px solid #dc3545',
                  background: '#fff',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#333',
                  cursor: 'pointer',
                  appearance: 'none',
                  width: '100%',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 15px center',
                  backgroundSize: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {reportOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <i 
                className={`fas ${reportOptions.find(opt => opt.value === selectedReport)?.icon || 'fa-chart-line'}`}
                style={{
                  position: 'absolute',
                  left: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#dc3545',
                  pointerEvents: 'none',
                  fontSize: '16px'
                }}
              ></i>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} style={{ marginLeft: '16px' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="attendance-view-body" style={{ padding: '20px' }}>
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;

