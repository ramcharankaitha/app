import React, { useState, useEffect, useRef } from 'react';
import { customersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import SidebarNav from './SidebarNav';
import './customers.css';

const Customers = ({ onBack, onAddCustomer, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('All Stores');
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewCustomerModal, setViewCustomerModal] = useState(null);
  const [editCustomerModal, setEditCustomerModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
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

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers based on search and store
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.customer_unique_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  // Handle edit customer
  const handleEditCustomer = async (customer) => {
    setOpenMenuId(null);
    try {
      const response = await customersAPI.getById(customer.id);
      if (response.success) {
        setEditCustomerModal(response.customer);
      } else {
        setError('Failed to fetch customer details');
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      setError('Failed to fetch customer details');
    }
  };

  // Handle save customer details
  const handleSaveCustomerDetails = async () => {
    if (!editCustomerModal) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await customersAPI.update(editCustomerModal.id, {
        fullName: editCustomerModal.full_name,
        phone: editCustomerModal.phone,
        email: editCustomerModal.email,
        address: editCustomerModal.address,
        city: editCustomerModal.city,
        state: editCustomerModal.state,
        pincode: editCustomerModal.pincode,
        whatsapp: editCustomerModal.whatsapp
      });
      
      if (response.success) {
        // Refresh customers list
        await fetchCustomers();
        setEditCustomerModal(null);
        setError('');
        setSuccessMessage('Customer updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to update customer');
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err.message || 'Failed to update customer');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input change in edit modal
  const handleEditInputChange = (field, value) => {
    if (editCustomerModal) {
      setEditCustomerModal({
        ...editCustomerModal,
        [field]: value
      });
    }
  };

  const closeEditModal = () => {
    setEditCustomerModal(null);
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
      <SidebarNav onNavigate={onNavigate} userRole={userRole} activeKey="masterMenu" />

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
              placeholder="Search name, phone, or Customer ID..."
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
                      Phone
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Customer ID
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Customer Type
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Address
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
                  {filteredCustomers.map((customer, index) => (
                    <tr key={customer.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#333'
                      }}>
                        {customer.full_name || customer.name || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px 8px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {customer.phone || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px 8px',
                        fontSize: '14px',
                        color: '#007bff',
                        fontWeight: '600'
                      }}>
                        {customer.customer_unique_id || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px 8px',
                        fontSize: '14px',
                        color: customer.customer_type === 'chitplan' ? '#dc3545' : '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {customer.customer_type === 'chitplan' ? 'Chit Plan' : 'Walk-in'}
                      </td>
                      <td style={{ 
                        padding: '12px 8px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {customer.address || 'N/A'}
                      </td>
                      <td style={{ 
                        textAlign: 'center',
                        padding: '12px 8px'
                      }}>
                        {customer.is_verified === true ? (
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#28a745', 
                            fontWeight: '600',
                            padding: '4px 8px',
                            background: '#d4edda',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            <i className="fas fa-check-circle"></i> Verified
                          </span>
                        ) : (
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#dc3545', 
                            fontWeight: '600',
                            padding: '4px 8px',
                            background: '#f8d7da',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            <i className="fas fa-times-circle"></i> Not Verified
                          </span>
                        )}
                      </td>
                      <td style={{ 
                        textAlign: 'center',
                        padding: '12px 8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleViewCustomerDetails(customer)}
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
                            onClick={() => handleEditCustomer(customer)}
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
                            onClick={() => handleDeleteCustomer(customer)}
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
                  ))}
                </tbody>
              </table>
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
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{viewCustomerModal.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Customer ID:</span>
                    <span className="detail-value" style={{ color: '#007bff', fontWeight: '600' }}>{viewCustomerModal.customer_unique_id || 'N/A'}</span>
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
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(userRole === 'admin' || userRole === 'supervisor') && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    <input
                      type="checkbox"
                      checked={viewCustomerModal.is_verified === true}
                      onChange={async (e) => {
                        console.log('Checkbox clicked:', e.target.checked, 'Current verified status:', viewCustomerModal.is_verified);
                        if (e.target.checked) {
                          try {
                            console.log('Calling verify API for customer ID:', viewCustomerModal.id);
                            const response = await customersAPI.verify(viewCustomerModal.id);
                            console.log('Verify API response:', response);
                            if (response.success) {
                              setViewCustomerModal({ ...viewCustomerModal, is_verified: true });
                              setSuccessMessage('Customer verified successfully');
                              setTimeout(() => setSuccessMessage(''), 3000);
                              // Refresh from server to update the list
                              await fetchCustomers();
                            } else {
                              setError(response.error || 'Failed to verify customer');
                              setTimeout(() => setError(''), 3000);
                            }
                          } catch (err) {
                            console.error('Error verifying customer:', err);
                            setError(err.message || 'Failed to verify customer');
                            setTimeout(() => setError(''), 3000);
                          }
                        }
                      }}
                      disabled={viewCustomerModal.is_verified === true}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
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

      {/* Edit Customer Modal */}
      {editCustomerModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Customer Details</h2>
              <button className="modal-close-btn" onClick={closeEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              {error && (
                <div style={{ 
                  padding: '12px', 
                  background: '#ffe0e0', 
                  color: '#dc3545', 
                  borderRadius: '8px', 
                  marginBottom: '20px' 
                }}>
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{editCustomerModal.full_name 
                    ? editCustomerModal.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'CU'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Full Name:</span>
                    <input
                      type="text"
                      value={editCustomerModal.full_name || ''}
                      onChange={(e) => handleEditInputChange('full_name', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <input
                      type="tel"
                      value={editCustomerModal.phone || ''}
                      onChange={(e) => handleEditInputChange('phone', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Customer ID:</span>
                    <span className="detail-value" style={{ color: '#007bff', fontWeight: '600' }}>
                      {editCustomerModal.customer_unique_id || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <input
                      type="email"
                      value={editCustomerModal.email || ''}
                      onChange={(e) => handleEditInputChange('email', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">WhatsApp:</span>
                    <input
                      type="tel"
                      value={editCustomerModal.whatsapp || ''}
                      onChange={(e) => handleEditInputChange('whatsapp', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <textarea
                      value={editCustomerModal.address || ''}
                      onChange={(e) => handleEditInputChange('address', e.target.value)}
                      rows="2"
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">City:</span>
                    <input
                      type="text"
                      value={editCustomerModal.city || ''}
                      onChange={(e) => handleEditInputChange('city', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">State:</span>
                    <input
                      type="text"
                      value={editCustomerModal.state || ''}
                      onChange={(e) => handleEditInputChange('state', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Pincode:</span>
                    <input
                      type="text"
                      value={editCustomerModal.pincode || ''}
                      onChange={(e) => handleEditInputChange('pincode', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="modal-close-button" 
                onClick={closeEditModal}
                style={{ background: '#6c757d', color: '#fff' }}
              >
                Cancel
              </button>
              <button 
                className="modal-close-button" 
                onClick={handleSaveCustomerDetails}
                disabled={isSaving}
                style={{ 
                  background: '#dc3545', 
                  color: '#fff',
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
