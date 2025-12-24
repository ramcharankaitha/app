import React, { useState, useEffect } from 'react';
import { exportAPI } from '../services/api';
import { downloadCSV } from '../utils/fileDownload';
import './staffAttendanceView.css';

const StockPerformanceReportView = ({ onClose }) => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStockPerformance();
  }, [startDate, endDate]);

  const fetchStockPerformance = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await exportAPI.getStockPerformance(startDate, endDate);
      if (response && response.success) {
        setPerformance(response.performance || []);
      } else {
        setError(response?.error || 'Failed to fetch stock performance data');
      }
    } catch (err) {
      console.error('Error fetching stock performance:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return 'No data available\n';
    const headers = ['Item Code', 'Product Name', 'Category', 'Total Sold', 'Total Revenue', 'Average Sale Price', 'Performance Rank'];
    const csvRows = [headers.join(',')];
    data.forEach((item, index) => {
      const row = [
        `"${(item.item_code || '').replace(/"/g, '""')}"`,
        `"${(item.product_name || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        item.total_sold || 0,
        item.total_revenue || 0,
        item.average_price || 0,
        index + 1
      ];
      csvRows.push(row.join(','));
    });
    return csvRows.join('\n');
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const filtered = getFilteredPerformance();
      const csvContent = convertToCSV(filtered);
      const filename = `stock_performance_report_${startDate}_to_${endDate}.csv`;
      await downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError(err.message || 'Failed to export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFilteredPerformance = () => {
    if (!searchQuery.trim()) return performance;
    const query = searchQuery.toLowerCase();
    return performance.filter(item =>
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
    const filtered = getFilteredPerformance();
    const totalSold = filtered.reduce((sum, item) => sum + (parseInt(item.total_sold) || 0), 0);
    const totalRevenue = filtered.reduce((sum, item) => sum + (parseFloat(item.total_revenue) || 0), 0);
    return { totalSold, totalRevenue, totalProducts: filtered.length };
  };

  const totals = calculateTotals();
  const filteredPerformance = getFilteredPerformance();

  return (
    <div>
      <div className="attendance-controls" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div className="date-selector">
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div className="date-selector">
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
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
          disabled={isExporting || filteredPerformance.length === 0}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          {isExporting ? <><i className="fas fa-spinner fa-spin"></i> Exporting...</> : <><i className="fas fa-download"></i> Export CSV</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#e3f2fd', padding: '16px', borderRadius: '8px', border: '2px solid #2196F3' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Products Sold</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>{totals.totalProducts}</div>
        </div>
        <div style={{ background: '#f3e5f5', padding: '16px', borderRadius: '8px', border: '2px solid #9c27b0' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Quantity Sold</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9c27b0' }}>{totals.totalSold}</div>
        </div>
        <div style={{ background: '#e8f5e9', padding: '16px', borderRadius: '8px', border: '2px solid #4caf50' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Revenue</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>{formatCurrency(totals.totalRevenue)}</div>
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
          <p>Loading stock performance data...</p>
        </div>
      ) : filteredPerformance.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <i className="fas fa-chart-bar" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}></i>
          <p>No sales performance data found for the selected date range.</p>
        </div>
      ) : (
        <div className="attendance-table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Item Code</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Total Sold</th>
                <th>Total Revenue</th>
                <th>Average Sale Price</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {filteredPerformance.map((item, index) => {
                const rank = index + 1;
                const isTopPerformer = rank <= 3;
                return (
                  <tr key={item.id || item.item_code} style={isTopPerformer ? { background: '#fff9e6' } : {}}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </td>
                    <td>{item.item_code || '-'}</td>
                    <td style={{ fontWeight: '600' }}>{item.product_name || '-'}</td>
                    <td>{item.category || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.total_sold || 0}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: '#28a745' }}>
                      {formatCurrency(item.total_revenue)}
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.average_price)}</td>
                    <td>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: isTopPerformer ? '#fff3cd' : '#d1ecf1',
                        color: isTopPerformer ? '#856404' : '#0c5460'
                      }}>
                        {isTopPerformer ? 'Top Performer' : 'Good'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                <td colSpan="4" style={{ textAlign: 'right', padding: '12px' }}>Grand Total:</td>
                <td style={{ textAlign: 'center', padding: '12px' }}>{totals.totalSold}</td>
                <td style={{ textAlign: 'right', padding: '12px', color: '#28a745', fontSize: '16px' }}>
                  {formatCurrency(totals.totalRevenue)}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockPerformanceReportView;

