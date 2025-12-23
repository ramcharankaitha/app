import React, { useState, useEffect } from 'react';
import { exportAPI } from '../services/api';
import { downloadCSV } from '../utils/fileDownload';
import './staffAttendanceView.css';

const SalesReportView = ({ onClose }) => {
  const [sales, setSales] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByCreator, setFilterByCreator] = useState('');

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate]);

  const fetchSales = async () => {
    setLoading(true);
    setError('');
    try {
      // Pass date range to backend for filtering
      const response = await exportAPI.getSales(startDate, endDate);
      
      if (response.success && response.sales) {
        setSales(response.sales);
        
        // Set top performers
        if (response.topPerformers) {
          setTopPerformers(response.topPerformers);
        }
      } else {
        setError('Failed to fetch sales data');
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertSalesToCSV = (salesData) => {
    if (!salesData || salesData.length === 0) {
      return 'No sales data available\n';
    }

    // CSV Headers
    const headers = [
      'ID',
      'Customer Name',
      'Email',
      'Phone',
      'Address',
      'Item Code',
      'Product Name',
      'Quantity',
      'MRP',
      'Discount (%)',
      'Sell Rate',
      'Total Amount',
      'Payment Mode',
      'Created By',
      'Sale Date'
    ];

    const csvRows = [headers.join(',')];

    // Add data rows
    salesData.forEach(sale => {
      const row = [
        sale.id || '',
        `"${(sale.customer_name || '').replace(/"/g, '""')}"`,
        `"${(sale.customer_email || '').replace(/"/g, '""')}"`,
        `"${(sale.customer_phone || '').replace(/"/g, '""')}"`,
        `"${(sale.customer_address || '').replace(/"/g, '""')}"`,
        `"${(sale.item_code || '').replace(/"/g, '""')}"`,
        `"${(sale.product_name || '').replace(/"/g, '""')}"`,
        sale.quantity || 0,
        sale.mrp || 0,
        sale.discount || 0,
        sale.sell_rate || 0,
        sale.total_amount || 0,
        `"${(sale.payment_mode || '').replace(/"/g, '""')}"`,
        `"${(sale.creator_name || sale.created_by || 'N/A').replace(/"/g, '""')}"`,
        sale.sale_date ? new Date(sale.sale_date).toLocaleString() : ''
      ];
      
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      setError('');
      
      const filteredSales = getFilteredSales();
      const csvContent = convertSalesToCSV(filteredSales);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `sales_report_${startDate}_to_${endDate || timestamp}.csv`;
      
      await downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError(err.message || 'Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFilteredSales = () => {
    let filtered = sales;
    
    // Filter by creator
    if (filterByCreator && filterByCreator !== 'all') {
      filtered = filtered.filter(sale => {
        const creatorName = sale.creator_name || sale.created_by || '';
        return creatorName.toLowerCase().includes(filterByCreator.toLowerCase());
      });
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sale => 
        (sale.customer_name && sale.customer_name.toLowerCase().includes(query)) ||
        (sale.customer_email && sale.customer_email.toLowerCase().includes(query)) ||
        (sale.customer_phone && sale.customer_phone.includes(query)) ||
        (sale.item_code && sale.item_code.toLowerCase().includes(query)) ||
        (sale.product_name && sale.product_name.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  // Get unique creators for filter dropdown
  const getUniqueCreators = () => {
    const creators = new Set();
    sales.forEach(sale => {
      const creator = sale.creator_name || sale.created_by;
      if (creator) creators.add(creator);
    });
    return Array.from(creators).sort();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
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
    const filtered = getFilteredSales();
    const totalSales = filtered.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
    const totalQuantity = filtered.reduce((sum, sale) => sum + (parseInt(sale.quantity) || 0), 0);
    const totalItems = filtered.length;
    
    return { totalSales, totalQuantity, totalItems };
  };

  const totals = calculateTotals();
  const filteredSales = getFilteredSales();

  return (
    <div className="attendance-view-overlay" onClick={onClose}>
      <div className="attendance-view-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1400px', width: '95%' }}>
        <div className="attendance-view-header">
          <h2>Sales Report</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="attendance-view-body">
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
                placeholder="Search by customer, product, item code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
              />
            </div>

            <div className="date-selector">
              <label>Filter by Creator:</label>
              <select
                value={filterByCreator}
                onChange={(e) => setFilterByCreator(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
              >
                <option value="all">All Creators</option>
                {getUniqueCreators().map(creator => (
                  <option key={creator} value={creator}>{creator}</option>
                ))}
              </select>
            </div>

            <button 
              className="btn-primary" 
              onClick={handleExportCSV}
              disabled={isExporting || filteredSales.length === 0}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              {isExporting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Exporting...
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i> Export CSV
                </>
              )}
            </button>
          </div>

          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px', 
            marginBottom: '20px' 
          }}>
            <div style={{
              background: '#e3f2fd',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #2196F3'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Sales</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                {formatCurrency(totals.totalSales)}
              </div>
            </div>
            <div style={{
              background: '#f3e5f5',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #9c27b0'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Items Sold</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9c27b0' }}>
                {totals.totalQuantity}
              </div>
            </div>
            <div style={{
              background: '#e8f5e9',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #4caf50'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Transactions</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
                {totals.totalItems}
              </div>
            </div>
          </div>

          {/* Top Performers Section */}
          {topPerformers && topPerformers.length > 0 && (
            <div style={{ 
              background: '#fff3cd',
              padding: '20px',
              borderRadius: '8px',
              border: '2px solid #ffc107',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#856404', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-trophy" style={{ color: '#ffc107' }}></i>
                Top Performers (Best Sales)
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '12px' 
              }}>
                {topPerformers.map((performer, index) => (
                  <div key={index} style={{
                    background: '#fff',
                    padding: '12px',
                    borderRadius: '6px',
                    border: index === 0 ? '2px solid #ffc107' : '1px solid #dee2e6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: index === 0 ? '#ffc107' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: index < 3 ? '#fff' : '#2196F3',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', color: '#333', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {performer.creator_name || performer.created_by || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {formatCurrency(performer.total_revenue)} • {performer.total_sales} sales
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="error-message" style={{ padding: '10px', background: '#fee', color: '#c33', borderRadius: '4px', marginBottom: '15px' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#dc3545' }}></i>
              <p>Loading sales data...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-chart-line" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}></i>
              <p>No sales records found for the selected date range.</p>
            </div>
          ) : (
            <div className="attendance-table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Item Code</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>MRP</th>
                    <th>Discount</th>
                    <th>Sell Rate</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{formatDate(sale.sale_date)}</td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{sale.customer_name || '-'}</div>
                        {sale.customer_email && (
                          <div style={{ fontSize: '12px', color: '#666' }}>{sale.customer_email}</div>
                        )}
                      </td>
                      <td>{sale.customer_phone || '-'}</td>
                      <td>{sale.item_code || '-'}</td>
                      <td>{sale.product_name || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{sale.quantity || 0}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(sale.mrp)}</td>
                      <td style={{ textAlign: 'center' }}>{sale.discount || 0}%</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(sale.sell_rate)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: '#28a745' }}>
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td>
                        <span className={`badge ${sale.payment_mode ? 'success' : 'warning'}`}>
                          {sale.payment_mode || 'N/A'}
                        </span>
                      </td>
                      <td>
                        {sale.creator_name || sale.created_by ? (
                          <span className={`badge ${(sale.creator_name || sale.created_by) === 'Admin' ? 'warning' : 'info'}`} style={{ fontSize: '12px' }}>
                            {sale.creator_name || sale.created_by}
                          </span>
                        ) : (
                          <span style={{ color: '#999', fontSize: '12px' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                    <td colSpan="5" style={{ textAlign: 'right', padding: '12px' }}>Grand Total:</td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>{totals.totalQuantity}</td>
                    <td colSpan="3"></td>
                    <td style={{ textAlign: 'right', padding: '12px', color: '#28a745', fontSize: '16px' }}>
                      {formatCurrency(totals.totalSales)}
                    </td>
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReportView;

