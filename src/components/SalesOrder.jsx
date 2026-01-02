import React, { useState, useEffect, useRef } from 'react';
import { salesOrdersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './staff.css';

const SalesOrder = ({ onBack, onAddSalesOrder, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [salesOrders, setSalesOrders] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewSalesOrderModal, setViewSalesOrderModal] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
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
          created_at: record.created_at,
          is_verified: record.is_verified
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

  // Handle edit sales order
  const handleEditSalesOrder = (record) => {
    setOpenMenuId(null);
    if (onNavigate) {
      onNavigate('addSalesOrder', { editId: record.id });
    }
  };

  // Handle delete sales order
  const handleDeleteSalesOrder = (record) => {
    setOpenMenuId(null);
    setConfirmState({
      open: true,
      message: `Are you sure you want to delete sales order for ${record.name}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setError('');
          const response = await salesOrdersAPI.delete(record.id);
          if (response.success) {
            await fetchSalesOrders();
          } else {
            setError(response.error || 'Failed to delete sales order');
          }
        } catch (err) {
          console.error('Delete sales order error:', err);
          setError(err.message || 'Failed to delete sales order');
        } finally {
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
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
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
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
            <div className="attendance-table-container" style={{ 
              marginTop: '0', 
              maxHeight: 'none',
              overflowX: 'auto',
              width: '100%'
            }}>
              <table className="attendance-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6', width: '60px' }}>
                      #
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Customer Name
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Contact
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Handler
                    </th>
                    <th style={{ textAlign: 'right', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Total Amount
                    </th>
                    <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6', width: '250px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalesOrders.map((record, index) => {
                    return (
                      <tr key={record.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ 
                          textAlign: 'center', 
                          color: '#666',
                          padding: '12px 8px',
                          fontSize: '14px'
                        }}>
                          {index + 1}
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: '#007bff',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                              fontSize: '14px',
                              flexShrink: 0
                            }}>
                              {record.initials || 'SO'}
                            </div>
                            <span style={{ fontWeight: '500', color: '#333' }}>{record.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {record.customerContact || 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {record.handlerName || 'N/A'}
                        </td>
                        <td style={{ 
                          textAlign: 'right',
                          padding: '12px 8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#28a745'
                        }}>
                            ₹{parseFloat(record.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ 
                            textAlign: 'center',
                            padding: '12px 8px',
                            fontSize: '14px'
                          }}>
                            {record.is_verified === false ? (
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#dc3545', 
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <i className="fas fa-exclamation-circle"></i> Not Verified
                              </span>
                            ) : record.is_verified === true ? (
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#28a745', 
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <i className="fas fa-check-circle"></i> Verified
                              </span>
                            ) : (
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#666', 
                                fontWeight: '500'
                              }}>
                                N/A
                              </span>
                            )}
                          </td>
                          <td style={{ 
                            textAlign: 'center',
                            padding: '12px 8px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleViewSalesOrderDetails(record)}
                              style={{
                                background: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#0056b3';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#007bff';
                              }}
                            >
                              <i className="fas fa-eye"></i>
                              View
                            </button>
                            <button
                              onClick={() => handleEditSalesOrder(record)}
                              style={{
                                background: '#28a745',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#218838';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#28a745';
                              }}
                            >
                              <i className="fas fa-edit"></i>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSalesOrder(record)}
                              style={{
                                background: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#c82333';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#dc3545';
                              }}
                            >
                              <i className="fas fa-trash"></i>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #e9ecef' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '16px' }}>Products</h3>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse',
                          background: '#fff'
                        }}>
                          <thead>
                            <tr style={{ 
                              background: '#f8f9fa', 
                              borderBottom: '2px solid #dee2e6' 
                            }}>
                              <th style={{ 
                                padding: '12px 8px', 
                                textAlign: 'left', 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: '#333',
                                borderBottom: '2px solid #dee2e6'
                              }}>#</th>
                              <th style={{ 
                                padding: '12px 8px', 
                                textAlign: 'left', 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: '#333',
                                borderBottom: '2px solid #dee2e6'
                              }}>Item Code</th>
                              <th style={{ 
                                padding: '12px 8px', 
                                textAlign: 'left', 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: '#333',
                                borderBottom: '2px solid #dee2e6'
                              }}>Product Name</th>
                              <th style={{ 
                                padding: '12px 8px', 
                                textAlign: 'center', 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: '#333',
                                borderBottom: '2px solid #dee2e6'
                              }}>Qty</th>
                              <th style={{ 
                                padding: '12px 8px', 
                                textAlign: 'right', 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: '#333',
                                borderBottom: '2px solid #dee2e6'
                              }}>Unit Price</th>
                              <th style={{ 
                                padding: '12px 8px', 
                                textAlign: 'right', 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: '#333',
                                borderBottom: '2px solid #dee2e6'
                              }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              let products = [];
                              if (viewSalesOrderModal.products) {
                                if (typeof viewSalesOrderModal.products === 'string') {
                                  try {
                                    products = JSON.parse(viewSalesOrderModal.products);
                                  } catch (e) {
                                    console.error('Error parsing products:', e);
                                  }
                                } else if (Array.isArray(viewSalesOrderModal.products)) {
                                  products = viewSalesOrderModal.products;
                                }
                              }
                              return products.map((product, index) => {
                                const quantity = parseFloat(product.quantity) || 0;
                                const unitPrice = parseFloat(product.sellRate) || parseFloat(product.sell_rate) || parseFloat(product.mrp) || parseFloat(product.price) || 0;
                                const total = quantity * unitPrice;
                                
                                return (
                                  <tr key={index} style={{ 
                                    borderBottom: '1px solid #f0f0f0' 
                                  }}>
                                    <td style={{ 
                                      padding: '12px 8px', 
                                      color: '#666',
                                      fontSize: '14px'
                                    }}>{index + 1}</td>
                                    <td style={{ 
                                      padding: '12px 8px', 
                                      fontWeight: '500', 
                                      color: '#333',
                                      fontSize: '14px'
                                    }}>{product.itemCode || 'N/A'}</td>
                                    <td style={{ 
                                      padding: '12px 8px', 
                                      color: '#333',
                                      fontSize: '14px'
                                    }}>{product.productName || 'N/A'}</td>
                                    <td style={{ 
                                      padding: '12px 8px', 
                                      textAlign: 'center', 
                                      color: '#666',
                                      fontSize: '14px'
                                    }}>{quantity}</td>
                                    <td style={{ 
                                      padding: '12px 8px', 
                                      textAlign: 'right', 
                                      color: '#666',
                                      fontSize: '14px'
                                    }}>₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ 
                                      padding: '12px 8px', 
                                      textAlign: 'right', 
                                      fontWeight: '600', 
                                      color: '#333',
                                      fontSize: '14px'
                                    }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
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
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(userRole === 'admin' || userRole === 'supervisor') && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    <input
                      type="checkbox"
                      checked={viewSalesOrderModal.is_verified === true}
                      onChange={async (e) => {
                        if (e.target.checked && viewSalesOrderModal.is_verified === false) {
                          try {
                            const response = await salesOrdersAPI.verify(viewSalesOrderModal.id);
                            if (response.success) {
                              setViewSalesOrderModal({ ...viewSalesOrderModal, is_verified: true });
                              setSuccessMessage('Sales order verified successfully');
                              setTimeout(() => setSuccessMessage(''), 3000);
                              await fetchSalesOrders();
                            } else {
                              setError('Failed to verify sales order');
                              setTimeout(() => setError(''), 3000);
                            }
                          } catch (err) {
                            console.error('Error verifying sales order:', err);
                            setError('Failed to verify sales order');
                            setTimeout(() => setError(''), 3000);
                          }
                        }
                      }}
                      disabled={viewSalesOrderModal.is_verified === true}
                      style={{ width: '18px', height: '18px', cursor: viewSalesOrderModal.is_verified === true ? 'not-allowed' : 'pointer' }}
                    />
                    <span>Mark as Verified</span>
                  </label>
                )}
              </div>
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

