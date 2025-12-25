import React, { useState, useEffect, useRef } from 'react';
import { salesRecordsAPI } from '../services/api';
import './staff.css';

const SalesRecord = ({ onBack, onAddSalesRecord, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [salesRecords, setSalesRecords] = useState([]);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewSalesRecordModal, setViewSalesRecordModal] = useState(null);
  const menuRefs = useRef({});

  // Fetch sales records from database
  const fetchSalesRecords = async () => {
    try {
      setError('');
      const response = await salesRecordsAPI.getAll();
      if (response.success) {
        const formattedRecords = response.salesRecords.map(record => ({
          id: record.id,
          name: record.customer_name,
          initials: record.customer_name 
            ? record.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : 'SR',
          customerContact: record.customer_contact,
          handlerName: record.handler_name || 'N/A',
          dateOfDuration: record.date_of_duration,
          supplierName: record.supplier_name || 'N/A',
          totalAmount: record.total_amount || 0,
          products: record.products || [],
          created_at: record.created_at
        }));
        setSalesRecords(formattedRecords);
      }
    } catch (err) {
      console.error('Error fetching sales records:', err);
      setError('Failed to load sales records. Please try again.');
    }
  };

  useEffect(() => {
    fetchSalesRecords();
    
    // Listen for sales record creation events
    const handleSalesRecordCreated = () => {
      fetchSalesRecords();
    };
    
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSalesRecords();
      }
    };
    
    window.addEventListener('salesRecordCreated', handleSalesRecordCreated);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('salesRecordCreated', handleSalesRecordCreated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('transactionMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddSalesRecord = () => {
    if (onAddSalesRecord) {
      onAddSalesRecord();
    } else if (onNavigate) {
      onNavigate('addSalesRecord');
    }
  };

  const handleManagers = () => {
    if (onNavigate) {
      onNavigate('users');
    }
  };

  const handleStaff = () => {
    if (onNavigate) {
      onNavigate('staff');
    }
  };

  const handleCustomers = () => {
    if (onNavigate) {
      onNavigate('customers');
    }
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  // Filter sales records based on search
  const filteredSalesRecords = salesRecords.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    const matchesName = record.name?.toLowerCase().includes(searchLower);
    const matchesContact = record.customerContact?.toLowerCase().includes(searchLower);
    const matchesHandler = record.handlerName?.toLowerCase().includes(searchLower);
    const matchesSupplier = record.supplierName?.toLowerCase().includes(searchLower);
    return matchesName || matchesContact || matchesHandler || matchesSupplier;
  });

  // Handle menu toggle
  const toggleMenu = (recordId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === recordId ? null : recordId);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Handle view sales record details
  const handleViewSalesRecordDetails = (record) => {
    setOpenMenuId(null);
    setViewSalesRecordModal(record);
  };

  const closeViewModal = () => {
    setViewSalesRecordModal(null);
  };

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={handleBack}>
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
        </div>
        {userRole === 'admin' && (
          <div className="nav-item" onClick={handleManagers}>
            <div className="nav-icon">
              <i className="fas fa-users"></i>
            </div>
            <span>Supervisors</span>
          </div>
        )}
        {userRole !== 'staff' && (
          <div className="nav-item" onClick={handleStaff}>
            <div className="nav-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <span>Staff</span>
          </div>
        )}
        <div className="nav-item" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
        </div>
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('transactionMenu')}>
          <div className="nav-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span>Transaction</span>
        </div>
        <div className="nav-item" onClick={handleSettings}>
          <div className="nav-icon">
            <i className="fas fa-cog"></i>
          </div>
          <span>Settings</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="dashboard-main">
      <div className="staff-container">
      {/* Header */}
      <header className="staff-header">
        <button className="back-btn" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="header-content">
          <h1 className="page-title">Sales Records</h1>
          <p className="page-subtitle">Manage sales transactions</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="staff-content">
        {/* Tab and Add Button */}
        <div className="staff-top-section">
          <div className="tab-indicator">
            <span className="tab-dot"></span>
            <span className="tab-label">SALES RECORDS</span>
          </div>
          <button className="add-staff-btn" onClick={handleAddSalesRecord}>
            <i className="fas fa-plus"></i>
            <span>Create Sales Record</span>
          </button>
        </div>

        {/* Heading */}
        <div className="staff-heading">
          <h2>Manage Sales Records</h2>
          <p>View sales records, their details, and transactions. Filter quickly.</p>
        </div>

        {/* Search */}
        <div className="staff-controls">
          <div className="staff-search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search sales records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="staff-count">
          {`Showing ${filteredSalesRecords.length} of ${salesRecords.length} sales records`}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Sales Records List */}
        <div className="staff-list">
          {salesRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
              <i className="fas fa-chart-line" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Sales Records Available</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Start by creating your first sales record.</p>
            </div>
          ) : filteredSalesRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <p>No sales records found matching your search</p>
            </div>
          ) : (
            filteredSalesRecords.map((record) => (
            <div key={record.id} className="staff-card">
              <div className="staff-avatar">
                <span>{record.initials}</span>
              </div>
              <div className="staff-info">
                <div className="staff-name">{record.name}</div>
                <div className="staff-role">Contact: {record.customerContact}</div>
                <div className="staff-store-badge">
                  <i className="fas fa-user-tie"></i>
                  <span>Handler: {record.handlerName}</span>
                </div>
              </div>
              <div className="staff-email">₹{record.totalAmount?.toFixed(2) || '0.00'}</div>
              <div 
                className="staff-options-container" 
                ref={el => menuRefs.current[record.id] = el}
              >
                <button 
                  className="staff-options"
                  onClick={(e) => toggleMenu(record.id, e)}
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
                {openMenuId === record.id && (
                  <div className="staff-menu-dropdown">
                    <div className="menu-item" onClick={() => handleViewSalesRecordDetails(record)}>
                      <i className="fas fa-eye"></i>
                      <span>View Sales Record Details</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            ))
          )}
        </div>
      </main>
      </div>
      </div>

      {/* View Sales Record Details Modal */}
      {viewSalesRecordModal && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sales Record Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{viewSalesRecordModal.initials || 'SR'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Customer Name:</span>
                    <span className="detail-value">{viewSalesRecordModal.name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Customer Contact:</span>
                    <span className="detail-value">{viewSalesRecordModal.customerContact || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Handler Name:</span>
                    <span className="detail-value">{viewSalesRecordModal.handlerName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date of Duration:</span>
                    <span className="detail-value">{viewSalesRecordModal.dateOfDuration ? new Date(viewSalesRecordModal.dateOfDuration).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Supplier Name:</span>
                    <span className="detail-value">{viewSalesRecordModal.supplierName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Amount:</span>
                    <span className="detail-value" style={{ color: '#28a745', fontWeight: '600' }}>₹{viewSalesRecordModal.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  {viewSalesRecordModal.products && viewSalesRecordModal.products.length > 0 && (
                    <div className="detail-row" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e9ecef' }}>
                      <span className="detail-label" style={{ fontSize: '16px', fontWeight: '700', color: '#000' }}>Products:</span>
                      <div style={{ marginTop: '12px' }}>
                        {viewSalesRecordModal.products.map((product, index) => (
                          <div key={index} style={{ 
                            padding: '12px', 
                            marginBottom: '8px', 
                            background: '#f8f9fa', 
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                          }}>
                            <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>
                              {product.productName || product.itemCode || `Product ${index + 1}`}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              Item Code: {product.itemCode || 'N/A'} | Qty: {product.quantity || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewSalesRecordModal.created_at && (
                    <div className="detail-row">
                      <span className="detail-label">Created At:</span>
                      <span className="detail-value">{new Date(viewSalesRecordModal.created_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-close-button" onClick={closeViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesRecord;
