import React, { useState, useEffect } from 'react';
import { exportAPI } from '../services/api';
import { downloadCSV } from '../utils/fileDownload';
import './staffAttendanceView.css';

const ServicesReportView = ({ onClose }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchServices();
  }, [startDate, endDate]);

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await exportAPI.getServices(startDate, endDate);
      if (response.success && response.services) {
        setServices(response.services);
      } else {
        setError('Failed to fetch services data');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) {
      return 'No services data available\n';
    }

    const headers = [
      'ID', 'Customer Name', 'Warranty', 'Unwarranty', 'Item Code', 'Brand Name',
      'Product Name', 'Serial Number', 'Service Date', 'Handler Name', 'Handler Phone',
      'Product Complaint', 'Estimated Date', 'Completed', 'Completed At', 'Created By', 'Created At'
    ];

    const csvRows = [headers.join(',')];

    data.forEach(service => {
      const row = [
        service.id || '',
        `"${(service.customer_name || '').replace(/"/g, '""')}"`,
        service.warranty ? 'Yes' : 'No',
        service.unwarranty ? 'Yes' : 'No',
        `"${(service.item_code || '').replace(/"/g, '""')}"`,
        `"${(service.brand_name || '').replace(/"/g, '""')}"`,
        `"${(service.product_name || '').replace(/"/g, '""')}"`,
        `"${(service.serial_number || '').replace(/"/g, '""')}"`,
        service.service_date || '',
        `"${(service.handler_name || '').replace(/"/g, '""')}"`,
        `"${(service.handler_phone || '').replace(/"/g, '""')}"`,
        `"${(service.product_complaint || '').replace(/"/g, '""')}"`,
        service.estimated_date || '',
        service.is_completed ? 'Yes' : 'No',
        service.completed_at ? new Date(service.completed_at).toLocaleString() : '',
        `"${(service.created_by || '').replace(/"/g, '""')}"`,
        service.created_at ? new Date(service.created_at).toLocaleString() : ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const csvContent = convertToCSV(filteredServices);
      const filename = `services-report-${startDate}-to-${endDate}.csv`;
      downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredServices = services.filter(service => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (service.customer_name || '').toLowerCase().includes(searchLower) ||
      (service.item_code || '').toLowerCase().includes(searchLower) ||
      (service.product_name || '').toLowerCase().includes(searchLower) ||
      (service.handler_name || '').toLowerCase().includes(searchLower)
    );
  });

  const totals = {
    totalServices: filteredServices.length,
    warranty: filteredServices.filter(s => s.warranty).length,
    unwarranty: filteredServices.filter(s => s.unwarranty).length,
    completed: filteredServices.filter(s => s.is_completed).length
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
            placeholder="Search by customer, product, item code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
          />
        </div>
        <button 
          className="btn-primary" 
          onClick={handleExportCSV}
          disabled={isExporting || filteredServices.length === 0}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          {isExporting ? <><i className="fas fa-spinner fa-spin"></i> Exporting...</> : <><i className="fas fa-download"></i> Export CSV</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#e3f2fd', padding: '16px', borderRadius: '8px', border: '2px solid #2196F3' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Services</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>{totals.totalServices}</div>
        </div>
        <div style={{ background: '#e8f5e9', padding: '16px', borderRadius: '8px', border: '2px solid #4caf50' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Warranty</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>{totals.warranty}</div>
        </div>
        <div style={{ background: '#fff3e0', padding: '16px', borderRadius: '8px', border: '2px solid #ff9800' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Unwarranty</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>{totals.unwarranty}</div>
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
              <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Handler</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Service Date</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  No services found
                </td>
              </tr>
            ) : (
              filteredServices.map(service => (
                <tr key={service.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{service.id}</td>
                  <td style={{ padding: '12px' }}>{service.customer_name}</td>
                  <td style={{ padding: '12px' }}>
                    {service.warranty ? <span style={{ color: '#4caf50', fontWeight: 'bold' }}>Warranty</span> : 
                     service.unwarranty ? <span style={{ color: '#ff9800', fontWeight: 'bold' }}>Unwarranty</span> : '-'}
                  </td>
                  <td style={{ padding: '12px' }}>{service.product_name || service.item_code || '-'}</td>
                  <td style={{ padding: '12px' }}>{service.handler_name || '-'}</td>
                  <td style={{ padding: '12px' }}>{service.service_date ? new Date(service.service_date).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px' }}>
                    {service.is_completed ? (
                      <span style={{ color: '#4caf50', fontWeight: 'bold' }}>Completed</span>
                    ) : (
                      <span style={{ color: '#ff9800', fontWeight: 'bold' }}>Pending</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServicesReportView;

