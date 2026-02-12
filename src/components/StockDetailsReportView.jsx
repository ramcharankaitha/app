import React, { useState, useEffect } from 'react';
import { exportAPI } from '../services/api';
import { downloadCSV } from '../utils/fileDownload';
import Toast from './Toast';
import './staffAttendanceView.css';

const StockDetailsReportView = ({ onClose }) => {
  const [stockDetails, setStockDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStockDetails();
  }, []);

  const fetchStockDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await exportAPI.getStockDetails();
      if (response && response.success) {
        setStockDetails(response.stockDetails || []);
      } else {
        setError(response?.error || 'Failed to fetch stock details');
      }
    } catch (err) {
      console.error('Error fetching stock details:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return 'No data available\n';
    const headers = ['Item Code', 'Product Name', 'Category', 'SKU Code', 'Current Stock', 'MRP', 'Status'];
    const csvRows = [headers.join(',')];
    data.forEach(item => {
      const row = [
        `"${(item.item_code || '').replace(/"/g, '""')}"`,
        `"${(item.product_name || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        `"${(item.sku_code || '').replace(/"/g, '""')}"`,
        item.current_quantity || 0,
        item.mrp || 0,
        `"${(item.status || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    return csvRows.join('\n');
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const filtered = getFilteredStock();
      const csvContent = convertToCSV(filtered);
      const filename = `stock_details_report_${new Date().toISOString().split('T')[0]}.csv`;
      await downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError(err.message || 'Failed to export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFilteredStock = () => {
    if (!searchQuery.trim()) return stockDetails;
    const query = searchQuery.toLowerCase();
    return stockDetails.filter(item =>
      (item.item_code && item.item_code.toLowerCase().includes(query)) ||
      (item.product_name && item.product_name.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query))
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const getStockStatus = (quantity) => {
    if (quantity <= 0) return { text: 'Out of Stock', color: '#dc3545', bg: '#f8d7da' };
    if (quantity <= 10) return { text: 'Low Stock', color: '#856404', bg: '#fff3cd' };
    return { text: 'In Stock', color: '#155724', bg: '#d4edda' };
  };

  const calculateTotals = () => {
    const filtered = getFilteredStock();
    const totalProducts = filtered.length;
    const totalValue = filtered.reduce((sum, item) => sum + ((parseFloat(item.current_quantity) || 0) * (parseFloat(item.mrp) || 0)), 0);
    const lowStockCount = filtered.filter(item => (item.current_quantity || 0) <= 10 && (item.current_quantity || 0) > 0).length;
    const outOfStockCount = filtered.filter(item => (item.current_quantity || 0) <= 0).length;
    return { totalProducts, totalValue, lowStockCount, outOfStockCount };
  };

  const totals = calculateTotals();
  const filteredStock = getFilteredStock();

  return (
    <div>
      <div className="attendance-controls" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div className="date-selector" style={{ flex: 1, minWidth: '200px' }}>
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by item code, product name, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
          />
        </div>
        <button
          className="btn-primary"
          onClick={handleExportCSV}
          disabled={isExporting || filteredStock.length === 0}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          {isExporting ? <><i className="fas fa-spinner fa-spin"></i> Exporting...</> : <><i className="fas fa-download"></i> Export CSV</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#e3f2fd', padding: '16px', borderRadius: '8px', border: '2px solid #2196F3' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Products</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>{totals.totalProducts}</div>
        </div>
        <div style={{ background: '#fff3cd', padding: '16px', borderRadius: '8px', border: '2px solid #ffc107' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Low Stock Items</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>{totals.lowStockCount}</div>
        </div>
        <div style={{ background: '#f8d7da', padding: '16px', borderRadius: '8px', border: '2px solid #dc3545' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Out of Stock</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{totals.outOfStockCount}</div>
        </div>
        <div style={{ background: '#e8f5e9', padding: '16px', borderRadius: '8px', border: '2px solid #4caf50' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Stock Value</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>{formatCurrency(totals.totalValue)}</div>
        </div>
      </div>

      <Toast message={error} type="error" onClose={() => setError('')} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#dc3545' }}></i>
          <p>Loading stock details...</p>
        </div>
      ) : filteredStock.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <i className="fas fa-warehouse" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}></i>
          <p>No stock details found.</p>
        </div>
      ) : (
        <div className="attendance-table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>SKU Code</th>
                <th>Current Stock</th>
                <th>MRP</th>
                <th>Stock Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((item) => {
                const status = getStockStatus(item.current_quantity || 0);
                return (
                  <tr key={item.id || item.item_code}>
                    <td>{item.item_code || '-'}</td>
                    <td>{item.product_name || '-'}</td>
                    <td>{item.category || '-'}</td>
                    <td>{item.sku_code || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.current_quantity || 0}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.mrp)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency((item.current_quantity || 0) * (item.mrp || 0))}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: status.bg,
                        color: status.color
                      }}>
                        {status.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockDetailsReportView;

