import React, { useState, useEffect } from 'react';
import { exportAPI } from '../services/api';
import { downloadCSV } from '../utils/fileDownload';
import './staffAttendanceView.css';

const PurchaseOrdersReportView = ({ onClose }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPurchaseOrders();
  }, [startDate, endDate]);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await exportAPI.getPurchaseOrders(startDate, endDate);
      if (response.success && response.purchaseOrders) {
        setPurchaseOrders(response.purchaseOrders);
      } else {
        setError('Failed to fetch purchase orders data');
      }
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) {
      return 'No purchase orders data available\n';
    }

    const headers = [
      'ID', 'Order Number', 'Supplier Name', 'Order Date', 'Expected Delivery Date',
      'Items', 'Total Amount', 'Status', 'Notes', 'Created By', 'Created At'
    ];

    const csvRows = [headers.join(',')];

    data.forEach(order => {
      const items = typeof order.items === 'string' ? order.items : JSON.stringify(order.items || []);
      const row = [
        order.id || '',
        `"${(order.order_number || '').replace(/"/g, '""')}"`,
        `"${(order.supplier_name || '').replace(/"/g, '""')}"`,
        order.order_date || '',
        order.expected_delivery_date || '',
        `"${items.replace(/"/g, '""')}"`,
        order.total_amount || 0,
        `"${(order.status || '').replace(/"/g, '""')}"`,
        `"${(order.notes || '').replace(/"/g, '""')}"`,
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
      const csvContent = convertToCSV(filteredPurchaseOrders);
      const filename = `purchase-orders-report-${startDate}-to-${endDate}.csv`;
      downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredPurchaseOrders = purchaseOrders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (order.order_number || '').toLowerCase().includes(searchLower) ||
      (order.supplier_name || '').toLowerCase().includes(searchLower) ||
      (order.status || '').toLowerCase().includes(searchLower)
    );
  });

  const totals = {
    totalOrders: filteredPurchaseOrders.length,
    totalAmount: filteredPurchaseOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0),
    pending: filteredPurchaseOrders.filter(o => o.status === 'pending').length,
    completed: filteredPurchaseOrders.filter(o => o.status === 'completed').length
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
            placeholder="Search by order number, supplier, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
          />
        </div>
        <button 
          className="btn-primary" 
          onClick={handleExportCSV}
          disabled={isExporting || filteredPurchaseOrders.length === 0}
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
        <div style={{ background: '#fff3e0', padding: '16px', borderRadius: '8px', border: '2px solid #ff9800' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Pending</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>{totals.pending}</div>
        </div>
        <div style={{ background: '#f3e5f5', padding: '16px', borderRadius: '8px', border: '2px solid #9c27b0' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Completed</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9c27b0' }}>{totals.completed}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#dc3545', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Order #</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Supplier</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Order Date</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Expected Delivery</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Total Amount</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Created By</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchaseOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  No purchase orders found
                </td>
              </tr>
            ) : (
              filteredPurchaseOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{order.order_number || '-'}</td>
                  <td style={{ padding: '12px' }}>{order.supplier_name || '-'}</td>
                  <td style={{ padding: '12px' }}>{order.order_date ? new Date(order.order_date).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px' }}>{order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#28a745' }}>
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: order.status === 'completed' ? '#d4edda' : order.status === 'pending' ? '#fff3cd' : '#f8d7da',
                      color: order.status === 'completed' ? '#155724' : order.status === 'pending' ? '#856404' : '#721c24'
                    }}>
                      {order.status || 'N/A'}
                    </span>
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

export default PurchaseOrdersReportView;

