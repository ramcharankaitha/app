import React, { useState, useEffect } from 'react';
import { exportAPI } from '../services/api';
import { downloadCSV } from '../utils/fileDownload';
import './staffAttendanceView.css';

const StockInReportView = ({ onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStockIn();
  }, [startDate, endDate]);

  const fetchStockIn = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await exportAPI.getStockIn(startDate, endDate);
      if (response && response.success) {
        setTransactions(response.transactions || []);
      } else {
        setError(response?.error || 'Failed to fetch stock in data');
      }
    } catch (err) {
      console.error('Error fetching stock in:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return 'No data available\n';
    const headers = ['ID', 'Item Code', 'Product Name', 'Quantity Added', 'Previous Stock', 'New Stock', 'Created By', 'Date', 'Notes'];
    const csvRows = [headers.join(',')];
    data.forEach(item => {
      const row = [
        item.id || '',
        `"${(item.item_code || '').replace(/"/g, '""')}"`,
        `"${(item.product_name || '').replace(/"/g, '""')}"`,
        item.quantity || 0,
        item.previous_quantity || 0,
        item.new_quantity || 0,
        `"${(item.created_by || '').replace(/"/g, '""')}"`,
        item.created_at ? new Date(item.created_at).toLocaleString() : '',
        `"${(item.notes || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    return csvRows.join('\n');
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const filtered = getFilteredTransactions();
      const csvContent = convertToCSV(filtered);
      const filename = `stock_in_report_${startDate}_to_${endDate}.csv`;
      await downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError(err.message || 'Failed to export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFilteredTransactions = () => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter(t =>
      (t.item_code && t.item_code.toLowerCase().includes(query)) ||
      (t.product_name && t.product_name.toLowerCase().includes(query)) ||
      (t.created_by && t.created_by.toLowerCase().includes(query))
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotals = () => {
    const filtered = getFilteredTransactions();
    const totalQuantity = filtered.reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0);
    return { totalQuantity, totalItems: filtered.length };
  };

  const totals = calculateTotals();
  const filteredTransactions = getFilteredTransactions();

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
          disabled={isExporting || filteredTransactions.length === 0}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          {isExporting ? <><i className="fas fa-spinner fa-spin"></i> Exporting...</> : <><i className="fas fa-download"></i> Export CSV</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#e3f2fd', padding: '16px', borderRadius: '8px', border: '2px solid #2196F3' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Quantity Added</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>{totals.totalQuantity}</div>
        </div>
        <div style={{ background: '#e8f5e9', padding: '16px', borderRadius: '8px', border: '2px solid #4caf50' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Transactions</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>{totals.totalItems}</div>
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
          <p>Loading stock in data...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <i className="fas fa-box-open" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}></i>
          <p>No stock in records found for the selected date range.</p>
        </div>
      ) : (
        <div className="attendance-table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item Code</th>
                <th>Product Name</th>
                <th>Quantity Added</th>
                <th>Previous Stock</th>
                <th>New Stock</th>
                <th>Created By</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.created_at)}</td>
                  <td>{transaction.item_code || '-'}</td>
                  <td>{transaction.product_name || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#28a745', fontWeight: 'bold' }}>+{transaction.quantity || 0}</td>
                  <td style={{ textAlign: 'center' }}>{transaction.previous_quantity || 0}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{transaction.new_quantity || 0}</td>
                  <td>{transaction.created_by || '-'}</td>
                  <td>{transaction.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                <td colSpan="3" style={{ textAlign: 'right', padding: '12px' }}>Grand Total:</td>
                <td style={{ textAlign: 'center', padding: '12px', color: '#28a745', fontSize: '16px' }}>{totals.totalQuantity}</td>
                <td colSpan="4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockInReportView;

