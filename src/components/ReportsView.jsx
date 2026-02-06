import React, { useState } from 'react';
import SalesReportContent from './SalesReportContent';
import StockInReportView from './StockInReportView';
import StockOutReportView from './StockOutReportView';
import StockDetailsReportView from './StockDetailsReportView';
import LowStockReportView from './LowStockReportView';
import StockPerformanceReportView from './StockPerformanceReportView';
import ServicesReportView from './ServicesReportView';
import SalesOrdersReportView from './SalesOrdersReportView';
import PurchaseOrdersReportView from './PurchaseOrdersReportView';
import QuotationsReportView from './QuotationsReportView';
import './staffAttendanceView.css';

const ReportsView = ({ onClose }) => {
  const [selectedReport, setSelectedReport] = useState('sales');

  const reportOptions = [
    { value: 'sales', label: 'Sales Report', icon: 'fa-chart-line' },
    { value: 'stockIn', label: 'Stock In Report', icon: 'fa-box-open' },
    { value: 'stockOut', label: 'Stock Out Report', icon: 'fa-box' },
    { value: 'stockDetails', label: 'Stock Details Report', icon: 'fa-warehouse' },
    { value: 'lowStock', label: 'Low Stock Report', icon: 'fa-exclamation-triangle' },
    { value: 'stockPerformance', label: 'Stock Performance Report', icon: 'fa-chart-bar' },
    { value: 'services', label: 'Services Report', icon: 'fa-cog' },
    { value: 'salesOrders', label: 'Sales Orders Report', icon: 'fa-shopping-cart' },
    { value: 'purchaseOrders', label: 'Purchase Orders Report', icon: 'fa-file-invoice-dollar' },
    { value: 'quotations', label: 'Quotations Report', icon: 'fa-file-invoice' }
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
      case 'services':
        return <ServicesReportView onClose={onClose} />;
      case 'salesOrders':
        return <SalesOrdersReportView onClose={onClose} />;
      case 'purchaseOrders':
        return <PurchaseOrdersReportView onClose={onClose} />;
      case 'quotations':
        return <QuotationsReportView onClose={onClose} />;
      default:
        return <SalesReportContent onClose={onClose} />;
    }
  };

  return (
    <div className="attendance-view-overlay" onClick={onClose}>
      <div className="attendance-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="attendance-view-header">
          <div className="reports-header-content">
            <h2>Reports</h2>
            <div className="reports-select-wrapper">
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="reports-select"
              >
                {reportOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <i 
                className={`fas ${reportOptions.find(opt => opt.value === selectedReport)?.icon || 'fa-chart-line'} reports-select-icon`}
              ></i>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="attendance-view-body">
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;

