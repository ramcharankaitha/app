import React, { useState, useEffect, useRef } from 'react';
import { chitPlansAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import './chitPlans.css';

const ChitPlans = ({ onBack, onAddChitCustomer, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
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

  const handleAddChitCustomer = () => {
    if (onAddChitCustomer) {
      onAddChitCustomer();
    } else if (onNavigate) {
      onNavigate('addChitCustomer');
    }
  };

  const handleManagers = () => {
    if (onNavigate) {
      onNavigate('users');
    }
  };

  const handleProducts = () => {
    if (onNavigate) {
      onNavigate('products');
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

  // Fetch chit plans and customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        const [plansResponse, customersResponse] = await Promise.all([
          chitPlansAPI.getPlans(),
          chitPlansAPI.getCustomers()
        ]);

        if (plansResponse.success) {
          setPlans(plansResponse.plans);
        }

        if (customersResponse.success) {
          const formattedCustomers = customersResponse.customers.map(customer => ({
            id: customer.id,
            name: customer.customer_name,
            initials: customer.customer_name 
              ? customer.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
              : 'CH',
            phone: customer.phone,
            address: customer.address,
            email: customer.email,
            planName: customer.plan_name,
            planAmount: customer.plan_amount,
            paymentMode: customer.payment_mode,
            enrollmentDate: customer.enrollment_date,
            created_at: customer.created_at
          }));
          setCustomers(formattedCustomers);
        }
      } catch (err) {
        console.error('Error fetching chit data:', err);
        setError('Failed to load chit plans data. Please try again.');
      }
    };

    fetchData();
  }, []);

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.planName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
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

  // Handle view customer details
  const handleViewCustomerDetails = async (customer) => {
    setOpenMenuId(null);
    try {
      const response = await chitPlansAPI.getCustomerById(customer.id);
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

  // Handle delete customer
  const handleDeleteCustomer = (customer) => {
    setOpenMenuId(null);
    setConfirmState({
      open: true,
      message: `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`,
      customer: customer,
      onConfirm: async () => {
        try {
          setError('');
          const response = await chitPlansAPI.deleteCustomer(customer.id);
          if (response && response.success) {
            setSuccessMessage('Chit customer deleted successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
            // Refresh customers list
            const customersResponse = await chitPlansAPI.getCustomers();
            if (customersResponse.success) {
              const formattedCustomers = customersResponse.customers.map(customer => ({
                id: customer.id,
                name: customer.customer_name,
                initials: customer.customer_name 
                  ? customer.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                  : 'CH',
                phone: customer.phone,
                address: customer.address,
                email: customer.email,
                planName: customer.plan_name,
                planAmount: customer.plan_amount,
                paymentMode: customer.payment_mode,
                enrollmentDate: customer.enrollment_date,
                created_at: customer.created_at
              }));
              setCustomers(formattedCustomers);
            }
            setConfirmState({ open: false, message: '', onConfirm: null, customer: null });
          } else {
            setError(response?.error || 'Failed to delete chit customer');
            setConfirmState({ open: false, message: '', onConfirm: null, customer: null });
          }
        } catch (err) {
          console.error('Delete chit customer error:', err);
          setError(err.message || 'Failed to delete chit customer');
          setConfirmState({ open: false, message: '', onConfirm: null, customer: null });
        }
      }
    });
  };

  const closeViewModal = () => {
    setViewCustomerModal(null);
  };

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Navigation */}
      <nav className="sidebar-nav">
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
          <h1 className="page-title">Chit Plan Management</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="staff-content">
        {/* Tab and Add Button */}
        <div className="staff-top-section">
          <div className="tab-indicator">
            <span className="tab-dot"></span>
            <span className="tab-label">CHIT PLANS</span>
          </div>
          <button className="add-staff-btn" onClick={handleAddChitCustomer}>
            <i className="fas fa-plus"></i>
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Heading */}
        <div className="staff-heading">
          <h2>Manage Chit Plan Customers</h2>
          <p>View customers enrolled in chit plans. Filter quickly.</p>
        </div>

        {/* Chit Plans Info */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginBottom: '20px', 
          flexWrap: 'wrap' 
        }}>
          {plans.map(plan => (
            <div key={plan.id} style={{
              padding: '12px 20px',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                {plan.plan_name}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#dc3545' }}>
                ₹{parseFloat(plan.plan_amount).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="staff-controls">
          <div className="staff-search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search name, phone, address, plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="staff-count">
          {`Showing ${filteredCustomers.length} of ${customers.length} customers`}
        </div>

        <Toast message={error} type="error" onClose={() => setError('')} />

        {/* Customers List */}
        <div className="staff-list">
          {customers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
              <i className="fas fa-file-invoice-dollar" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Chit Customers Available</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Start by adding your first chit customer to the system.</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <p>No customers found matching your search</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
            <div key={customer.id} className="staff-card">
              <div className="staff-avatar">
                <span>{customer.initials}</span>
              </div>
              <div className="staff-info">
                <div className="staff-name">{customer.name}</div>
                <div className="staff-role" style={{ fontSize: '12px', marginTop: '4px', color: '#dc3545', fontWeight: '600' }}>
                  {customer.planName} - ₹{parseFloat(customer.planAmount).toLocaleString('en-IN')}
                </div>
                {customer.phone && (
                  <div className="staff-role" style={{ fontSize: '11px', marginTop: '4px' }}>
                    <i className="fas fa-phone" style={{ marginRight: '6px', fontSize: '10px' }}></i>
                    {customer.phone}
                  </div>
                )}
                {customer.address && (
                  <div className="staff-role" style={{ fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fas fa-map-marker-alt" style={{ fontSize: '10px', color: '#666' }}></i>
                    <span>{customer.address.length > 40 ? customer.address.substring(0, 40) + '...' : customer.address}</span>
                  </div>
                )}
              </div>
              {customer.email && (
                <div className="staff-email">{customer.email}</div>
              )}
              <div 
                className="staff-options-container" 
                ref={el => menuRefs.current[customer.id] = el}
              >
                <button 
                  className="staff-options"
                  onClick={(e) => toggleMenu(customer.id, e)}
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
                {openMenuId === customer.id && (
                  <div className="staff-menu-dropdown">
                    <div className="menu-item" onClick={(e) => {
                      e.stopPropagation();
                      handleViewCustomerDetails(customer);
                    }}>
                      <i className="fas fa-eye"></i>
                      <span>View Customer Details</span>
                    </div>
                    <div className="menu-item" onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomer(customer);
                    }}>
                      <i className="fas fa-trash"></i>
                      <span>Delete Customer</span>
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title="Delete Chit Customer"
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
              <h2>Chit Customer Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{viewCustomerModal.customer_name 
                    ? viewCustomerModal.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'CH'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Customer Name:</span>
                    <span className="detail-value">{viewCustomerModal.customer_name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Chit Plan:</span>
                    <span className="detail-value" style={{ color: '#dc3545', fontWeight: '600' }}>
                      {viewCustomerModal.plan_name || 'N/A'} - ₹{viewCustomerModal.plan_amount ? parseFloat(viewCustomerModal.plan_amount).toLocaleString('en-IN') : '0'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{viewCustomerModal.phone || 'N/A'}</span>
                  </div>
                  {viewCustomerModal.email && (
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{viewCustomerModal.email}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{viewCustomerModal.address || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Payment Mode:</span>
                    <span className="detail-value">{viewCustomerModal.payment_mode || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Enrollment Date:</span>
                    <span className="detail-value">
                      {viewCustomerModal.enrollment_date 
                        ? new Date(viewCustomerModal.enrollment_date).toLocaleDateString('en-IN')
                        : 'N/A'}
                    </span>
                  </div>
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

export default ChitPlans;

