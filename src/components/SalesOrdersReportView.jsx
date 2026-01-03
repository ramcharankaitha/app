import React, { useState, useEffect } from 'react';
import { exportAPI } from '../services/api';
import { downloadCSV } from '../utils/fileDownload';
import './staffAttendanceView.css';

const SalesOrdersReportView = ({ onClose }) => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSalesOrders();
  }, [startDate, endDate]);

  const fetchSalesOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await exportAPI.getSalesOrders(startDate, endDate);
      if (response.success && response.salesOrders) {
        setSalesOrders(response.salesOrders);
      } else {
        setError('Failed to fetch sales orders data');
      }
    } catch (err) {
      console.error('Error fetching sales orders:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) {
      return 'No sales orders data available\n';
    }

    const headers = [
      'ID', 'Customer Name', 'Customer Contact', 'Handler Name', 'Handler Mobile',
      'Date of Duration', 'Supplier Name', 'Supplier Number', 'Products', 'Total Amount', 'Created By', 'Created At'
    ];

    const csvRows = [headers.join(',')];

    data.forEach(order => {
      const products = typeof order.products === 'string' ? order.products : JSON.stringify(order.products || []);
      const row = [
        order.id || '',
        `"${(order.customer_name || '').replace(/"/g, '""')}"`,
        `"${(order.customer_contact || '').replace(/"/g, '""')}"`,
        `"${(order.handler_name || '').replace(/"/g, '""')}"`,
        `"${(order.handler_mobile || '').replace(/"/g, '""')}"`,
        order.date_of_duration || '',
        `"${(order.supplier_name || '').replace(/"/g, '""')}"`,
        `"${(order.supplier_number || '').replace(/"/g, '""')}"`,
        `"${products.replace(/"/g, '""')}"`,
        order.total_amount || 0,
        `"${(order.created_by || '').replace(/"/g, '""')}"`,
        order.created_at ? new Date(order.created_at).toLocaleString() : ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const csvContent = convertToCSV(filteredSalesOrders);
      const filename = `sales-orders-report-${startDate}-to-${endDate}.csv`;
      downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredSalesOrders = salesOrders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (order.customer_name || '').toLowerCase().includes(searchLower) ||
      (order.handler_name || '').toLowerCase().includes(searchLower) ||
      (order.supplier_name || '').toLowerCase().includes(searchLower)
    );
  });

  const totals = {
    totalOrders: filteredSalesOrders.length,
    totalAmount: filteredSalesOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

  return (
    <div>
      {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
            placeholder="Search by customer, handler, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
          />
        </div>
        <button 
          className="btn-primary" 
          onClick={handleExportCSV}
          disabled={isExporting || filteredSalesOrders.length === 0}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          {isExporting ? <><i className="fas fa-spinner fa-spin"></i> Exporting...</> : <><i className="fas fa-download"></i> Export CSV</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#e3f2fd', padding: '16px', borderRadius: '8px', border: '2px solid #2196F3' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Orders</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>{totals.totalOrders}</div>
        </div>
        <div style={{ background: '#e8f5e9', padding: '16px', borderRadius: '8px', border: '2px solid #4caf50' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Amount</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>{formatCurrency(totals.totalAmount)}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#dc3545', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Handler</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Supplier</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Total Amount</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Created By</th>
            </tr>
          </thead>
          <tbody>
            {filteredSalesOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  No sales orders found
                </td>
              </tr>
            ) : (
              filteredSalesOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{order.id}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '600' }}>{order.customer_name || '-'}</div>
                    {order.customer_contact && <div style={{ fontSize: '12px', color: '#666' }}>{order.customer_contact}</div>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {order.handler_name || '-'}
                    {order.handler_mobile && <div style={{ fontSize: '12px', color: '#666' }}>{order.handler_mobile}</div>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {order.supplier_name || '-'}
                    {order.supplier_number && <div style={{ fontSize: '12px', color: '#666' }}>{order.supplier_number}</div>}
                  </td>
                  <td style={{ padding: '12px' }}>{order.date_of_duration ? new Date(order.date_of_duration).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#28a745' }}>
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td style={{ padding: '12px' }}>{order.created_by || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesOrdersReportView;

