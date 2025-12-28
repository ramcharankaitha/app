import React, { useState, useEffect, useRef } from 'react';
import { customersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './customers.css';

const Customers = ({ onBack, onAddCustomer, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('All Stores');
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewCustomerModal, setViewCustomerModal] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null, customer: null });
  const menuRefs = useRef({});

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('masterMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddCustomer = () => {
    if (onAddCustomer) {
      onAddCustomer();
    } else if (onNavigate) {
      onNavigate('addCustomer');
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

  const handleProducts = () => {
    if (onNavigate) {
      onNavigate('products');
    }
  };

  const handleCustomers = () => {
    if (onNavigate) {
      onNavigate('customers');
    }
  };

  const handleSuppliers = () => {
    if (onNavigate) {
      onNavigate('suppliers');
    }
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  // Fetch customers from database
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customersAPI.getAll();
        if (response.success) {
          setCustomers(response.customers || []);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers based on search and store
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = selectedStore === 'All Stores' || customer.store === selectedStore;
    return matchesSearch && matchesStore;
  });

  // Handle menu toggle
  const toggleMenu = (customerId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === customerId ? null : customerId);
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

  // Handle menu actions
  const handleViewCustomerDetails = async (customer) => {
    setOpenMenuId(null);
    try {
      // Fetch full customer details from API
      const response = await customersAPI.getById(customer.id);
      if (response.success) {
        setViewCustomerModal(response.customer);
      } else {
        setError('Failed to fetch customer details');
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      setError('Failed to fetch customer details');
    }
  };

  const closeViewModal = () => {
    setViewCustomerModal(null);
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer) => {
    setOpenMenuId(null);
    setConfirmState({
      open: true,
      message: `Are you sure you want to delete "${customer.full_name || customer.name}"? This action cannot be undone.`,
      customer: customer,
      onConfirm: async () => {
        try {
          const response = await customersAPI.delete(customer.id);
          if (response.success) {
            setSuccessMessage('Customer deleted successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
            // Refresh customers list
            const fetchResponse = await customersAPI.getAll();
            if (fetchResponse.success) {
              setCustomers(fetchResponse.customers || []);
            }
            setConfirmState({ open: false, message: '', onConfirm: null, customer: null });
          } else {
            setError('Failed to delete customer');
            setConfirmState({ open: false, message: '', onConfirm: null, customer: null });
          }
        } catch (err) {
          setError(err.message || 'Failed to delete customer');
          setConfirmState({ open: false, message: '', onConfirm: null, customer: null });
        }
      }
    });
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
        <div className="nav-item" onClick={() => onNavigate && onNavigate('transactionMenu')}>
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
          <h1 className="page-title">Customer Details</h1>
          <p className="page-subtitle">Manage store customers</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="staff-content">
        {/* Tab and Add Button */}
        <div className="staff-top-section">
          <div className="tab-indicator">
            <span className="tab-dot"></span>
            <span className="tab-label">CUSTOMERS</span>
          </div>
          <button className="add-staff-btn" onClick={handleAddCustomer}>
            <i className="fas fa-plus"></i>
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Heading */}
        <div className="staff-heading">
          <h2>Manage Store Customers</h2>
          <p>View customers, their contact information, and assigned stores. Filter quickly.</p>
        </div>

        {/* Search and Filter */}
        <div className="staff-controls">
          <div className="staff-search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="store-filter-btn">
            <i className="fas fa-store"></i>
            <span>{selectedStore}</span>
            <i className="fas fa-chevron-down"></i>
          </button>
        </div>

        {/* Results Count */}
        <div className="staff-count">
          {`Showing ${filteredCustomers.length} of ${customers.length} customers`}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div style={{ padding: '12px', background: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}

        {/* Customers List */}
        <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
          {customers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
              <i className="fas fa-user-friends" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>No Customers Available</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Start by adding your first customer to the system.</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <p>No customers found matching your search</p>
            </div>
          ) : (
            <div className="premium-cards-grid">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="premium-identity-card"
                >
                  {/* Card Header */}
                  <div className="premium-card-header">
                    <div className="premium-header-content">
                      <h3 className="premium-worker-name">{customer.full_name || customer.name || 'N/A'}</h3>
                    </div>
                    {/* Floating Three-Dot Menu */}
                    <div 
                      className="premium-card-menu" 
                      ref={el => menuRefs.current[customer.id] = el}
                    >
                      <button 
                        className="premium-menu-trigger"
                        onClick={(e) => toggleMenu(customer.id, e)}
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      {openMenuId === customer.id && (
                        <div className="premium-menu-dropdown">
                          <div className="premium-menu-item" onClick={() => handleViewCustomerDetails(customer)}>
                            <i className="fas fa-eye"></i>
                            <span>View</span>
                          </div>
                          <div className="premium-menu-item premium-menu-item-danger" onClick={() => handleDeleteCustomer(customer)}>
                            <i className="fas fa-trash"></i>
                            <span>Delete</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body - Two Column Layout */}
                  <div className="premium-card-body">
                    <div className="premium-info-row">
                      <div className="premium-info-item">
                        <div className="premium-info-icon">
                          <i className="fas fa-envelope"></i>
                        </div>
                        <div className="premium-info-content">
                          <span className="premium-info-label">Email</span>
                          <span className="premium-info-value premium-email-value">{customer.email || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="premium-info-item">
                        <div className="premium-info-icon">
                          <i className="fas fa-phone"></i>
                        </div>
                        <div className="premium-info-content">
                          <span className="premium-info-label">Phone</span>
                          <span className="premium-info-value">{customer.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="premium-info-row" style={{ marginTop: '16px' }}>
                      <div className="premium-info-item">
                        <div className="premium-info-icon">
                          <i className="fas fa-user-tag"></i>
                        </div>
                        <div className="premium-info-content">
                          <span className="premium-info-label">Customer Type</span>
                          <span className="premium-info-value" style={{ 
                            textTransform: 'uppercase',
                            fontWeight: '600',
                            color: customer.customer_type === 'chitplan' ? '#dc3545' : '#64748b'
                          }}>
                            {customer.customer_type === 'chitplan' ? 'Chit Plan' : 'Walk-in'}
                          </span>
                        </div>
                      </div>
                      {customer.address && (
                        <div className="premium-info-item">
                          <div className="premium-info-icon">
                            <i className="fas fa-map-marker-alt"></i>
                          </div>
                          <div className="premium-info-content">
                            <span className="premium-info-label">Address</span>
                            <span className="premium-info-value">{customer.address || 'N/A'}</span>
                          </div>
                        </div>
                      )}
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title="Delete Customer"
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null, customer: null })}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* View Customer Details Modal */}
      {viewCustomerModal && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customer Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{viewCustomerModal.full_name ? viewCustomerModal.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'CU'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{viewCustomerModal.full_name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{viewCustomerModal.email || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{viewCustomerModal.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{viewCustomerModal.address || 'N/A'}</span>
                  </div>
                  {viewCustomerModal.item_code && (
                    <div className="detail-row">
                      <span className="detail-label">Item Code:</span>
                      <span className="detail-value">{viewCustomerModal.item_code}</span>
                    </div>
                  )}
                  {viewCustomerModal.quantity !== undefined && viewCustomerModal.quantity !== null && (
                    <div className="detail-row">
                      <span className="detail-label">Quantity:</span>
                      <span className="detail-value">{viewCustomerModal.quantity}</span>
                    </div>
                  )}
                  {viewCustomerModal.mrp && (
                    <div className="detail-row">
                      <span className="detail-label">MRP:</span>
                      <span className="detail-value">₹{viewCustomerModal.mrp}</span>
                    </div>
                  )}
                  {viewCustomerModal.sell_rate && (
                    <div className="detail-row">
                      <span className="detail-label">Sell Rate:</span>
                      <span className="detail-value">₹{viewCustomerModal.sell_rate}</span>
                    </div>
                  )}
                  {viewCustomerModal.discount && (
                    <div className="detail-row">
                      <span className="detail-label">Discount:</span>
                      <span className="detail-value">₹{viewCustomerModal.discount}</span>
                    </div>
                  )}
                  {viewCustomerModal.payment_mode && (
                    <div className="detail-row">
                      <span className="detail-label">Payment Mode:</span>
                      <span className="detail-value">{viewCustomerModal.payment_mode}</span>
                    </div>
                  )}
                  {viewCustomerModal.available_tokens !== undefined && (
                    <div className="detail-row" style={{ 
                      background: '#fff5f5', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '2px solid #dc3545',
                      marginTop: '12px'
                    }}>
                      <span className="detail-label" style={{ fontWeight: '600', color: '#dc3545' }}>
                        <i className="fas fa-gift" style={{ marginRight: '8px' }}></i>
                        Available Tokens:
                      </span>
                      <span className="detail-value" style={{ fontSize: '20px', fontWeight: '700', color: '#dc3545' }}>
                        {viewCustomerModal.available_tokens || 0}
                      </span>
                    </div>
                  )}
                  {viewCustomerModal.tokens_earned && (
                    <div className="detail-row">
                      <span className="detail-label">Tokens Earned (This Purchase):</span>
                      <span className="detail-value" style={{ color: '#28a745', fontWeight: '600' }}>
                        +{viewCustomerModal.tokens_earned}
                      </span>
                    </div>
                  )}
                  {viewCustomerModal.tokens_used && (
                    <div className="detail-row">
                      <span className="detail-label">Tokens Used (This Purchase):</span>
                      <span className="detail-value" style={{ color: '#dc3545', fontWeight: '600' }}>
                        -{viewCustomerModal.tokens_used}
                      </span>
                    </div>
                  )}
                  {viewCustomerModal.created_at && (
                    <div className="detail-row">
                      <span className="detail-label">Created At:</span>
                      <span className="detail-value">{new Date(viewCustomerModal.created_at).toLocaleString()}</span>
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

export default Customers;
