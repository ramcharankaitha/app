import React, { useState, useEffect, useRef } from 'react';
import { salesOrdersAPI } from '../services/api';
import './staff.css';

const SalesOrder = ({ onBack, onAddSalesOrder, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [salesOrders, setSalesOrders] = useState([]);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewSalesOrderModal, setViewSalesOrderModal] = useState(null);
  const menuRefs = useRef({});

  // Fetch sales orders from database
  const fetchSalesOrders = async () => {
    try {
      setError('');
      const response = await salesOrdersAPI.getAll();
      if (response.success) {
        const formattedRecords = response.salesOrders.map(record => ({
          id: record.id,
          name: record.customer_name,
          initials: record.customer_name 
            ? record.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : 'SO',
          customerContact: record.customer_contact,
          handlerName: record.handler_name || 'N/A',
          dateOfDuration: record.date_of_duration,
          supplierName: record.supplier_name || 'N/A',
          totalAmount: parseFloat(record.total_amount || 0) || 0,
          products: record.products || [],
          poNumber: record.po_number || null,
          created_at: record.created_at
        }));
        setSalesOrders(formattedRecords);
      }
    } catch (err) {
      console.error('Error fetching sales orders:', err);
      setError('Failed to load sales orders. Please try again.');
    }
  };

  useEffect(() => {
    fetchSalesOrders();
    
    // Listen for sales order creation events
    const handleSalesOrderCreated = () => {
      fetchSalesOrders();
    };
    
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSalesOrders();
      }
    };
    
    window.addEventListener('salesOrderCreated', handleSalesOrderCreated);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('salesOrderCreated', handleSalesOrderCreated);
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

  const handleAddSalesOrder = () => {
    if (onAddSalesOrder) {
      onAddSalesOrder();
    } else if (onNavigate) {
      onNavigate('addSalesOrder');
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

  // Filter sales orders based on search
  const filteredSalesOrders = salesOrders.filter(record => {
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

  // Handle view sales order details
  const handleViewSalesOrderDetails = (record) => {
    setOpenMenuId(null);
    setViewSalesOrderModal(record);
  };

  const closeViewModal = () => {
    setViewSalesOrderModal(null);
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
          <h1 className="page-title">Sales Orders</h1>
          <p className="page-subtitle">Manage sales transactions</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="staff-content">
        {/* Tab and Add Button */}
        <div className="staff-top-section">
          <div className="tab-indicator">
            <span className="tab-dot"></span>
            <span className="tab-label">SALES ORDERS</span>
          </div>
          <button className="add-staff-btn" onClick={handleAddSalesOrder}>
            <i className="fas fa-plus"></i>
            <span>Create Sales Order</span>
          </button>
        </div>

        {/* Heading */}
        <div className="staff-heading">
          <h2>Manage Sales Orders</h2>
          <p>View sales orders, their details, and transactions. Filter quickly.</p>
        </div>

        {/* Search */}
        <div className="staff-controls">
          <div className="staff-search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search sales orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="staff-count">
          {`Showing ${filteredSalesOrders.length} of ${salesOrders.length} sales orders`}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Sales Orders List */}
        <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
          {salesOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
              <i className="fas fa-chart-line" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Sales Orders Available</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Start by creating your first sales order.</p>
            </div>
          ) : filteredSalesOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <p>No sales orders found matching your search</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredSalesOrders.map((record) => (
                <div
                  key={record.id}
                  className="product-card stock-in-card"
                  style={{ position: 'relative' }}
                >
                  <div className="product-header" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    width: '100%',
                    gap: '12px'
                  }}>
                    <div className="product-title" style={{ 
                      fontWeight: '600',
                      fontSize: '16px',
                      color: '#333'
                    }}>
                      {record.name || 'N/A'}
                    </div>
                    <div 
                      className="staff-options-container" 
                      ref={el => menuRefs.current[record.id] = el}
                      style={{ 
                        position: 'relative'
                      }}
                    >
                      <button 
                        className="staff-options"
                        onClick={(e) => toggleMenu(record.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          fontSize: '16px',
                          cursor: 'pointer',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#f8f9fa';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'none';
                        }}
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      {openMenuId === record.id && (
                        <div className="staff-menu-dropdown" style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          background: '#fff',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          border: '1px solid #e0e0e0',
                          minWidth: '180px',
                          zIndex: 1000,
                          marginTop: '4px',
                          overflow: 'hidden'
                        }}>
                          <div className="menu-item" onClick={() => handleViewSalesOrderDetails(record)}>
                            <i className="fas fa-eye"></i>
                            <span>View Details</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="product-details">
                    <div className="detail-row">
                      <span className="detail-label">Contact:</span>
                      <span className="detail-value">{record.customerContact || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Handler:</span>
                      <span className="detail-value">{record.handlerName || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Total Amount:</span>
                      <span className="detail-value" style={{ fontWeight: 'bold', color: '#28a745' }}>
                        ₹{parseFloat(record.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Products:</span>
                      <span className="detail-value">{record.products?.length || 0} items</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{record.dateOfDuration ? new Date(record.dateOfDuration).toLocaleDateString('en-IN') : 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">PO Number:</span>
                      <span className="detail-value" style={{ fontWeight: '600', color: '#dc3545' }}>
                        {record.poNumber || 'N/A'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{record.created_at ? new Date(record.created_at).toLocaleDateString('en-IN') : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      </div>
      </div>

      {/* View Sales Order Details Modal */}
      {viewSalesOrderModal && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sales Order Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{viewSalesOrderModal.initials || 'SO'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Customer Name:</span>
                    <span className="detail-value">{viewSalesOrderModal.name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Customer Contact:</span>
                    <span className="detail-value">{viewSalesOrderModal.customerContact || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Handler Name:</span>
                    <span className="detail-value">{viewSalesOrderModal.handlerName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date of Duration:</span>
                    <span className="detail-value">{viewSalesOrderModal.dateOfDuration ? new Date(viewSalesOrderModal.dateOfDuration).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Supplier Name:</span>
                    <span className="detail-value">{viewSalesOrderModal.supplierName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Amount:</span>
                    <span className="detail-value" style={{ color: '#28a745', fontWeight: '600' }}>₹{parseFloat(viewSalesOrderModal.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  {viewSalesOrderModal.products && viewSalesOrderModal.products.length > 0 && (
                    <div className="detail-row" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e9ecef' }}>
                      <span className="detail-label" style={{ fontSize: '16px', fontWeight: '700', color: '#000' }}>Products:</span>
                      <div style={{ marginTop: '12px' }}>
                        {viewSalesOrderModal.products.map((product, index) => (
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
                  {viewSalesOrderModal.created_at && (
                    <div className="detail-row">
                      <span className="detail-label">Created At:</span>
                      <span className="detail-value">{new Date(viewSalesOrderModal.created_at).toLocaleString()}</span>
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

export default SalesOrder;

