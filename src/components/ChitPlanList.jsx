import React, { useState, useEffect, useRef } from 'react';
import { chitPlansAPI } from '../services/api';
import './staff.css';

const ChitPlanList = ({ onBack, onAddChitPlan, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chitCustomers, setChitCustomers] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const menuRefs = useRef({});

  // Fetch chit plan customers from database
  const fetchChitCustomers = async () => {
    try {
      setError('');
      const response = await chitPlansAPI.getCustomers();
      if (response.success) {
        setChitCustomers(response.customers || []);
      }
    } catch (err) {
      console.error('Error fetching chit plan customers:', err);
      setError('Failed to load chit plan customers. Please try again.');
    }
  };

  useEffect(() => {
    fetchChitCustomers();
  }, []);

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

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('masterMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddChitPlan = () => {
    if (onNavigate) {
      onNavigate('addChitPlanCustomer');
    } else if (onAddChitPlan) {
      onAddChitPlan();
    }
  };

  // Filter customers based on search
  const filteredCustomers = chitCustomers.filter(customer => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (customer.customer_name || '').toLowerCase().includes(query) ||
      (customer.phone || '').toLowerCase().includes(query) ||
      (customer.plan_name || '').toLowerCase().includes(query) ||
      (customer.chit_number || '').toLowerCase().includes(query);
    return matchesSearch;
  });

  // Handle menu toggle
  const toggleMenu = (customerId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === customerId ? null : customerId);
  };

  const handleView = (customer) => {
    setViewModal(customer);
    setOpenMenuId(null);
  };



  const closeViewModal = () => {
    setViewModal(null);
  };

  const getInitials = (name) => {
    if (!name) return 'CP';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={handleBack}>
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
        </div>
        {userRole === 'admin' && (
          <div className="nav-item" onClick={() => onNavigate && onNavigate('users')}>
            <div className="nav-icon">
              <i className="fas fa-users"></i>
            </div>
            <span>Supervisors</span>
          </div>
        )}
        {userRole !== 'staff' && (
          <div className="nav-item" onClick={() => onNavigate && onNavigate('staff')}>
            <div className="nav-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <span>Staff</span>
          </div>
        )}
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('masterMenu')}>
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
        <div className="nav-item" onClick={() => onNavigate && onNavigate('settings')}>
          <div className="nav-icon">
            <i className="fas fa-cog"></i>
          </div>
          <span>Settings</span>
        </div>
      </nav>

      {/* Main */}
      <div className="dashboard-main">
        <div className="staff-container">
          {/* Header */}
          <header className="staff-header">
            <button className="back-btn" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-content">
              <h1 className="page-title">Chit Plan</h1>
              <p className="page-subtitle">Manage chit plan customers</p>
            </div>
          </header>

          {/* Content */}
          <main className="staff-content">
            <div className="staff-top-section">
              <div className="tab-indicator">
                <span className="tab-dot"></span>
                <span className="tab-label">CHIT PLAN</span>
              </div>
              <button className="add-staff-btn" onClick={handleAddChitPlan}>
                <i className="fas fa-plus"></i>
                <span>Add New Customer</span>
              </button>
            </div>

            <div className="staff-heading">
              <h2>Chit Plan Customers</h2>
              <p>View and manage customers enrolled in chit plans.</p>
            </div>

            {/* Search */}
            <div className="staff-controls">
              <div className="staff-search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by name, phone, chit number, or plan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Messages */}
            {successMessage && (
              <div style={{ padding: '12px', background: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px' }}>
                <i className="fas fa-check-circle"></i> {successMessage}
              </div>
            )}
            {error && (
              <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            {/* Results Count */}
            <div className="staff-count">
              {`Showing ${filteredCustomers.length} of ${chitCustomers.length} customers`}
            </div>

            {/* Customers List */}
            <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
              {chitCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
                  <i className="fas fa-user-friends" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Chit Plan Customers</h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>Start by adding your first chit plan customer.</p>
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
                          Chit Number
                        </th>
                        <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          Phone
                        </th>
                        <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          Plan Name
                        </th>
                        <th style={{ textAlign: 'right', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          Plan Amount
                        </th>
                        <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          Duration
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
                            fontSize: '14px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#dc3545',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '600',
                                fontSize: '14px',
                                flexShrink: 0
                              }}>
                                {getInitials(customer.customer_name)}
                              </div>
                              <div>
                                <div style={{ fontWeight: '500', color: '#333' }}>
                                  {customer.customer_name || 'N/A'}
                                </div>
                                <span style={{ 
                                  backgroundColor: '#dc3545', 
                                  color: '#fff',
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  marginTop: '4px',
                                  display: 'inline-block'
                                }}>
                                  Chit Plan
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#dc3545'
                          }}>
                            {customer.chit_number || 'N/A'}
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
                            color: '#666'
                          }}>
                            {customer.plan_name || 'N/A'}
                          </td>
                          <td style={{ 
                            textAlign: 'right',
                            padding: '12px 8px',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#dc3545'
                          }}>
                            {customer.plan_amount ? `₹${parseFloat(customer.plan_amount || 0).toLocaleString('en-IN')}` : 'N/A'}
                          </td>
                          <td style={{ 
                            textAlign: 'center',
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {customer.duration ? `${customer.duration} months` : 'N/A'}
                          </td>
                          <td style={{ 
                            textAlign: 'center',
                            padding: '12px 8px',
                            fontSize: '14px'
                          }}>
                            {customer.is_verified === false ? (
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
                            ) : customer.is_verified === true ? (
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
                                onClick={() => handleView(customer)}
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

      {/* View Modal */}
      {viewModal && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chit Plan Customer Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{getInitials(viewModal.customer_name)}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Customer Name:</span>
                    <span className="detail-value">{viewModal.customer_name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Chit Number:</span>
                    <span className="detail-value" style={{ color: '#dc3545', fontWeight: '600' }}>
                      {viewModal.chit_number || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{viewModal.phone || 'N/A'}</span>
                  </div>
                  {viewModal.address && (
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{viewModal.address}</span>
                    </div>
                  )}
                  {viewModal.city && (
                    <div className="detail-row">
                      <span className="detail-label">City:</span>
                      <span className="detail-value">{viewModal.city}</span>
                    </div>
                  )}
                  {viewModal.state && (
                    <div className="detail-row">
                      <span className="detail-label">State:</span>
                      <span className="detail-value">{viewModal.state}</span>
                    </div>
                  )}
                  {viewModal.pincode && (
                    <div className="detail-row">
                      <span className="detail-label">Pincode:</span>
                      <span className="detail-value">{viewModal.pincode}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Chit Plan:</span>
                    <span className="detail-value">{viewModal.plan_name || 'N/A'}</span>
                  </div>
                  {viewModal.plan_amount && (
                    <div className="detail-row">
                      <span className="detail-label">Plan Amount:</span>
                      <span className="detail-value" style={{ fontSize: '18px', fontWeight: '700', color: '#dc3545' }}>
                        ₹{parseFloat(viewModal.plan_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {viewModal.duration && (
                    <div className="detail-row">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{viewModal.duration} months</span>
                    </div>
                  )}
                  {viewModal.enrollment_date && (
                    <div className="detail-row">
                      <span className="detail-label">Enrollment Date:</span>
                      <span className="detail-value">{new Date(viewModal.enrollment_date).toLocaleDateString()}</span>
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
                      checked={viewModal.is_verified === true}
                      onChange={async (e) => {
                        console.log('Checkbox clicked:', e.target.checked, 'Current verified status:', viewModal.is_verified);
                        if (e.target.checked) {
                          try {
                            console.log('Calling verify API for chit customer ID:', viewModal.id);
                            const response = await chitPlansAPI.verifyCustomer(viewModal.id);
                            console.log('Verify API response:', response);
                            if (response.success) {
                              setViewModal({ ...viewModal, is_verified: true });
                              setSuccessMessage('Chit plan customer verified successfully');
                              setTimeout(() => setSuccessMessage(''), 3000);
                              // Refresh from server to update the list
                              await fetchChitCustomers();
                            } else {
                              setError(response.error || 'Failed to verify chit plan customer');
                              setTimeout(() => setError(''), 3000);
                            }
                          } catch (err) {
                            console.error('Error verifying chit plan customer:', err);
                            setError(err.message || 'Failed to verify chit plan customer');
                            setTimeout(() => setError(''), 3000);
                          }
                        }
                      }}
                      disabled={viewModal.is_verified === true}
                      style={{ width: '18px', height: '18px', cursor: viewModal.is_verified === true ? 'not-allowed' : 'pointer' }}
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

export default ChitPlanList;

