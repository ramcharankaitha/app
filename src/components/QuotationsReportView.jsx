import React, { useState, useEffect } from 'react';
import { exportAPI } from '../services/api';
import { downloadCSV } from '../utils/fileDownload';
import './staffAttendanceView.css';

const QuotationsReportView = ({ onClose }) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchQuotations();
  }, [startDate, endDate]);

  const fetchQuotations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await exportAPI.getQuotations(startDate, endDate);
      if (response.success && response.quotations) {
        setQuotations(response.quotations);
      } else {
        setError('Failed to fetch quotations data');
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) {
      return 'No quotations data available\n';
    }

    const headers = [
      'ID', 'Quotation Number', 'Customer Name', 'Customer Email', 'Customer Phone',
      'Customer Address', 'Quotation Date', 'Valid Until', 'Items', 'Subtotal',
      'Tax Rate', 'Tax Amount', 'Total Amount', 'Notes', 'Status', 'Created By', 'Created At'
    ];

    const csvRows = [headers.join(',')];

    data.forEach(quotation => {
      const items = typeof quotation.items === 'string' ? quotation.items : JSON.stringify(quotation.items || []);
      const row = [
        quotation.id || '',
        `"${(quotation.quotation_number || '').replace(/"/g, '""')}"`,
        `"${(quotation.customer_name || '').replace(/"/g, '""')}"`,
        `"${(quotation.customer_email || '').replace(/"/g, '""')}"`,
        `"${(quotation.customer_phone || '').replace(/"/g, '""')}"`,
        `"${(quotation.customer_address || '').replace(/"/g, '""')}"`,
        quotation.quotation_date || '',
        quotation.valid_until || '',
        `"${items.replace(/"/g, '""')}"`,
        quotation.subtotal || 0,
        quotation.tax_rate || 0,
        quotation.tax_amount || 0,
        quotation.total_amount || 0,
        `"${(quotation.notes || '').replace(/"/g, '""')}"`,
        `"${(quotation.status || '').replace(/"/g, '""')}"`,
        `"${(quotation.created_by || '').replace(/"/g, '""')}"`,
        quotation.created_at ? new Date(quotation.created_at).toLocaleString() : ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const csvContent = convertToCSV(filteredQuotations);
      const filename = `quotations-report-${startDate}-to-${endDate}.csv`;
      downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredQuotations = quotations.filter(quotation => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (quotation.quotation_number || '').toLowerCase().includes(searchLower) ||
      (quotation.customer_name || '').toLowerCase().includes(searchLower) ||
      (quotation.status || '').toLowerCase().includes(searchLower)
    );
  });

  const totals = {
    totalQuotations: filteredQuotations.length,
    totalAmount: filteredQuotations.reduce((sum, q) => sum + (parseFloat(q.total_amount) || 0), 0),
    pending: filteredQuotations.filter(q => q.status === 'pending' || !q.status).length,
    accepted: filteredQuotations.filter(q => q.status === 'accepted').length
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
            placeholder="Search by quotation number, customer, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
          />
        </div>
        <button 
          className="btn-primary" 
          onClick={handleExportCSV}
          disabled={isExporting || filteredQuotations.length === 0}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          {isExporting ? <><i className="fas fa-spinner fa-spin"></i> Exporting...</> : <><i className="fas fa-download"></i> Export CSV</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#e3f2fd', padding: '16px', borderRadius: '8px', border: '2px solid #2196F3' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Quotations</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>{totals.totalQuotations}</div>
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
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Accepted</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9c27b0' }}>{totals.accepted}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#dc3545', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Quotation #</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Quotation Date</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Valid Until</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Total Amount</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Created By</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  No quotations found
                </td>
              </tr>
            ) : (
              filteredQuotations.map(quotation => (
                <tr key={quotation.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{quotation.quotation_number || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '600' }}>{quotation.customer_name || '-'}</div>
                    {quotation.customer_email && <div style={{ fontSize: '12px', color: '#666' }}>{quotation.customer_email}</div>}
                    {quotation.customer_phone && <div style={{ fontSize: '12px', color: '#666' }}>{quotation.customer_phone}</div>}
                  </td>
                  <td style={{ padding: '12px' }}>{quotation.quotation_date ? new Date(quotation.quotation_date).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px' }}>{quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#28a745' }}>
                    {formatCurrency(quotation.total_amount)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: quotation.status === 'accepted' ? '#d4edda' : quotation.status === 'pending' ? '#fff3cd' : '#f8d7da',
                      color: quotation.status === 'accepted' ? '#155724' : quotation.status === 'pending' ? '#856404' : '#721c24'
                    }}>
                      {quotation.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{quotation.created_by || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuotationsReportView;

