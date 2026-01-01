import React, { useState, useEffect, useRef } from 'react';
import { chitPlansAPI } from '../services/api';
import './staff.css';

const ChitPlanList = ({ onBack, onAddChitPlan, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chitCustomers, setChitCustomers] = useState([]);
  const [error, setError] = useState('');
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
                <div className="premium-cards-grid">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="premium-identity-card"
                    >
                      {/* Card Header */}
                      <div className="premium-card-header">
                        <div className="premium-header-content">
                          <div className="premium-avatar">
                            <span>{getInitials(customer.customer_name)}</span>
                          </div>
                          <div>
                            <h3 className="premium-worker-name">{customer.customer_name || 'N/A'}</h3>
                            <span className="premium-role-badge" style={{ background: '#dc3545', color: '#fff' }}>Chit Plan</span>
                          </div>
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
                              <div className="premium-menu-item" onClick={() => handleView(customer)}>
                                <i className="fas fa-eye"></i>
                                <span>View</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="premium-card-body">
                        <div className="premium-info-row">
                          <div className="premium-info-item">
                            <div className="premium-info-icon">
                              <i className="fas fa-hashtag"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">Chit Number</span>
                              <span className="premium-info-value" style={{ color: '#dc3545', fontWeight: '600' }}>
                                {customer.chit_number || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="premium-info-row">
                          <div className="premium-info-item">
                            <div className="premium-info-icon">
                              <i className="fas fa-phone"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">Phone</span>
                              <span className="premium-info-value">{customer.phone || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="premium-info-item">
                            <div className="premium-info-icon">
                              <i className="fas fa-file-invoice-dollar"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">Plan</span>
                              <span className="premium-info-value">{customer.plan_name || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        {customer.plan_amount && (
                          <div className="premium-info-row">
                            <div className="premium-info-item" style={{ gridColumn: '1 / -1' }}>
                              <div className="premium-info-icon">
                                <i className="fas fa-rupee-sign"></i>
                              </div>
                              <div className="premium-info-content">
                                <span className="premium-info-label">Plan Amount</span>
                                <span className="premium-info-value" style={{ fontSize: '18px', color: '#dc3545', fontWeight: '700' }}>
                                  ₹{parseFloat(customer.plan_amount || 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        {customer.duration && (
                          <div className="premium-info-row">
                            <div className="premium-info-item">
                              <div className="premium-info-icon">
                                <i className="fas fa-calendar-alt"></i>
                              </div>
                              <div className="premium-info-content">
                                <span className="premium-info-label">Duration</span>
                                <span className="premium-info-value">{customer.duration} months</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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

export default ChitPlanList;

