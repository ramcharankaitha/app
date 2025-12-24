import React, { useState, useEffect } from 'react';
import { exportAPI } from '../services/api';
import { downloadCSV } from '../utils/fileDownload';
import './staffAttendanceView.css';

const LowStockReportView = ({ onClose }) => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [threshold, setThreshold] = useState(10);

  useEffect(() => {
    fetchLowStock();
  }, [threshold]);

  const fetchLowStock = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await exportAPI.getLowStock(threshold);
      if (response && response.success) {
        setLowStockItems(response.items || []);
      } else {
        setError(response?.error || 'Failed to fetch low stock data');
      }
    } catch (err) {
      console.error('Error fetching low stock:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return 'No data available\n';
    const headers = ['Item Code', 'Product Name', 'Category', 'Current Stock', 'MRP', 'Status', 'Action Required'];
    const csvRows = [headers.join(',')];
    data.forEach(item => {
      const row = [
        `"${(item.item_code || '').replace(/"/g, '""')}"`,
        `"${(item.product_name || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        item.current_quantity || 0,
        item.mrp || 0,
        `"${(item.current_quantity <= 0 ? 'Out of Stock' : 'Low Stock').replace(/"/g, '""')}"`,
        `"${(item.current_quantity <= 0 ? 'URGENT: Restock immediately' : 'Consider restocking').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    return csvRows.join('\n');
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const filtered = getFilteredItems();
      const csvContent = convertToCSV(filtered);
      const filename = `low_stock_report_${new Date().toISOString().split('T')[0]}.csv`;
      await downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError(err.message || 'Failed to export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFilteredItems = () => {
    if (!searchQuery.trim()) return lowStockItems;
    const query = searchQuery.toLowerCase();
    return lowStockItems.filter(item =>
      (item.item_code && item.item_code.toLowerCase().includes(query)) ||
      (item.product_name && item.product_name.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query))
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const calculateTotals = () => {
    const filtered = getFilteredItems();
    const outOfStock = filtered.filter(item => (item.current_quantity || 0) <= 0).length;
    const lowStock = filtered.filter(item => (item.current_quantity || 0) > 0 && (item.current_quantity || 0) <= threshold).length;
    return { total: filtered.length, outOfStock, lowStock };
  };

  const totals = calculateTotals();
  const filteredItems = getFilteredItems();

  return (
    <div>
      <div className="attendance-controls" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div className="date-selector">
          <label>Stock Threshold:</label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value) || 10)}
            min="0"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '100px' }}
          />
        </div>
        <div className="date-selector" style={{ flex: 1, minWidth: '200px' }}>
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by item code, product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
          />
        </div>
        <button
          className="btn-primary"
          onClick={handleExportCSV}
          disabled={isExporting || filteredItems.length === 0}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          {isExporting ? <><i className="fas fa-spinner fa-spin"></i> Exporting...</> : <><i className="fas fa-download"></i> Export CSV</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#f8d7da', padding: '16px', borderRadius: '8px', border: '2px solid #dc3545' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Out of Stock</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{totals.outOfStock}</div>
        </div>
        <div style={{ background: '#fff3cd', padding: '16px', borderRadius: '8px', border: '2px solid #ffc107' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Low Stock (≤{threshold})</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>{totals.lowStock}</div>
        </div>
        <div style={{ background: '#e8f5e9', padding: '16px', borderRadius: '8px', border: '2px solid #4caf50' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Items</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>{totals.total}</div>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ padding: '10px', background: '#fee', color: '#c33', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#dc3545' }}></i>
          <p>Loading low stock data...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <i className="fas fa-check-circle" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5, color: '#28a745' }}></i>
          <p>No low stock items found. All products are well stocked!</p>
        </div>
      ) : (
        <div className="attendance-table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>MRP</th>
                <th>Status</th>
                <th>Action Required</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isOutOfStock = (item.current_quantity || 0) <= 0;
                return (
                  <tr key={item.id || item.item_code} style={isOutOfStock ? { background: '#fff5f5' } : {}}>
                    <td>{item.item_code || '-'}</td>
                    <td style={{ fontWeight: '600' }}>{item.product_name || '-'}</td>
                    <td>{item.category || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: isOutOfStock ? '#dc3545' : '#856404' }}>
                      {item.current_quantity || 0}
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.mrp)}</td>
                    <td>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: isOutOfStock ? '#f8d7da' : '#fff3cd',
                        color: isOutOfStock ? '#dc3545' : '#856404'
                      }}>
                        {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                    <td style={{ color: isOutOfStock ? '#dc3545' : '#856404', fontWeight: '600' }}>
                      {isOutOfStock ? 'URGENT: Restock immediately' : 'Consider restocking'}
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

export default LowStockReportView;

