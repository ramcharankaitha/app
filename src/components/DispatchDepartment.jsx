import React, { useState, useEffect, useRef } from 'react';
import { dispatchAPI } from '../services/api';
import './suppliers.css';

const DispatchDepartment = ({ onBack, onAddDispatch, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dispatches, setDispatches] = useState([]);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewDispatchModal, setViewDispatchModal] = useState(null);
  const menuRefs = useRef({});

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('transactionMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddDispatch = () => {
    if (onAddDispatch) {
      onAddDispatch();
    } else if (onNavigate) {
      onNavigate('addDispatch');
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

  // Fetch dispatches from database
  const fetchDispatches = async () => {
    try {
      setError('');
      const response = await dispatchAPI.getAll();
      if (response.success) {
        const formattedDispatches = response.dispatches.map(dispatch => ({
          id: dispatch.id,
          customer: dispatch.customer,
          name: dispatch.name,
          phone: dispatch.phone,
          transportName: dispatch.transport_name,
          initials: dispatch.name 
            ? dispatch.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : 'DP',
          created_at: dispatch.created_at
        }));
        setDispatches(formattedDispatches);
      }
    } catch (err) {
      console.error('Error fetching dispatches:', err);
      setError('Failed to load dispatches. Please try again.');
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, []);

  // Filter dispatches based on search
  const filteredDispatches = dispatches.filter(dispatch => {
    const matchesSearch = dispatch.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dispatch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dispatch.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dispatch.transportName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Handle menu toggle
  const toggleMenu = (dispatchId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === dispatchId ? null : dispatchId);
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

  // Handle view dispatch details
  const handleViewDispatchDetails = async (dispatch) => {
    setOpenMenuId(null);
    try {
      const response = await dispatchAPI.getById(dispatch.id);
      if (response.success) {
        setViewDispatchModal(response.dispatch);
      } else {
        setError('Failed to fetch dispatch details');
      }
    } catch (err) {
      console.error('Error fetching dispatch details:', err);
      setError('Failed to fetch dispatch details');
    }
  };

  const closeViewModal = () => {
    setViewDispatchModal(null);
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
          <h1 className="page-title">Dispatch Department</h1>
          <p className="page-subtitle">Manage dispatch records</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="staff-content">
        {/* Tab and Add Button */}
        <div className="staff-top-section">
          <div className="tab-indicator">
            <span className="tab-dot"></span>
            <span className="tab-label">DISPATCH</span>
          </div>
          <button className="add-staff-btn" onClick={handleAddDispatch}>
            <i className="fas fa-plus"></i>
            <span>Add New Dispatch</span>
          </button>
        </div>

        {/* Heading */}
        <div className="staff-heading">
          <h2>Manage Dispatch Records</h2>
          <p>View dispatch records with customer, name, phone, and transport details. Filter quickly.</p>
        </div>

        {/* Search and Filter */}
        <div className="staff-controls">
          <div className="staff-search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search customer, name, phone, transport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="staff-count">
          {`Showing ${filteredDispatches.length} of ${dispatches.length} dispatches`}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Dispatches List */}
        <div className="staff-list">
          {dispatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
              <i className="fas fa-shipping-fast" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Dispatch Records Available</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Start by adding your first dispatch record to the system.</p>
            </div>
          ) : filteredDispatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <p>No dispatch records found matching your search</p>
            </div>
          ) : (
            filteredDispatches.map((dispatch) => (
            <div key={dispatch.id} className="staff-card">
              <div className="staff-avatar">
                <span>{dispatch.initials}</span>
              </div>
              <div className="staff-info">
                <div className="staff-name">{dispatch.name || 'N/A'}</div>
                {dispatch.customer && (
                  <div className="staff-role" style={{ fontSize: '11px', marginTop: '4px' }}>
                    <i className="fas fa-user" style={{ marginRight: '6px', fontSize: '10px' }}></i>
                    Customer: {dispatch.customer}
                  </div>
                )}
                {dispatch.phone && (
                  <div className="staff-role" style={{ fontSize: '11px', marginTop: '4px' }}>
                    <i className="fas fa-phone" style={{ marginRight: '6px', fontSize: '10px' }}></i>
                    {dispatch.phone}
                  </div>
                )}
                {dispatch.transportName && (
                  <div className="staff-role" style={{ fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fas fa-truck" style={{ fontSize: '10px', color: '#666' }}></i>
                    <span>{dispatch.transportName}</span>
                  </div>
                )}
              </div>
              <div 
                className="staff-options-container" 
                ref={el => menuRefs.current[dispatch.id] = el}
              >
                <button 
                  className="staff-options"
                  onClick={(e) => toggleMenu(dispatch.id, e)}
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
                {openMenuId === dispatch.id && (
                  <div className="staff-menu-dropdown">
                    <div className="menu-item" onClick={() => handleViewDispatchDetails(dispatch)}>
                      <i className="fas fa-eye"></i>
                      <span>View Dispatch Details</span>
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

      {/* View Dispatch Details Modal */}
      {viewDispatchModal && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Dispatch Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{viewDispatchModal.name 
                    ? viewDispatchModal.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'DP'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Customer:</span>
                    <span className="detail-value">{viewDispatchModal.customer || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{viewDispatchModal.name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone Number:</span>
                    <span className="detail-value">{viewDispatchModal.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Transport Name:</span>
                    <span className="detail-value">{viewDispatchModal.transport_name || 'N/A'}</span>
                  </div>
                  {viewDispatchModal.address && (
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{viewDispatchModal.address}</span>
                    </div>
                  )}
                  {viewDispatchModal.city && (
                    <div className="detail-row">
                      <span className="detail-label">City:</span>
                      <span className="detail-value">{viewDispatchModal.city}</span>
                    </div>
                  )}
                  {viewDispatchModal.state && (
                    <div className="detail-row">
                      <span className="detail-label">State:</span>
                      <span className="detail-value">{viewDispatchModal.state}</span>
                    </div>
                  )}
                  {viewDispatchModal.pincode && (
                    <div className="detail-row">
                      <span className="detail-label">Pincode:</span>
                      <span className="detail-value">{viewDispatchModal.pincode}</span>
                    </div>
                  )}
                  {viewDispatchModal.created_at && (
                    <div className="detail-row">
                      <span className="detail-label">Created At:</span>
                      <span className="detail-value">{new Date(viewDispatchModal.created_at).toLocaleString()}</span>
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

export default DispatchDepartment;

