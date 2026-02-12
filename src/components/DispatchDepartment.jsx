import React, { useState, useEffect, useRef } from 'react';
import { dispatchAPI } from '../services/api';
import Toast from './Toast';
import './products.css';

const DispatchDepartment = ({ onBack, onAddDispatch, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dispatches, setDispatches] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [viewDispatchModal, setViewDispatchModal] = useState(null);
  const [editDispatchModal, setEditDispatchModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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
          created_at: dispatch.created_at,
          is_verified: dispatch.is_verified
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

  // Handle edit dispatch
  const handleEditDispatch = async (dispatch) => {
    try {
      const response = await dispatchAPI.getById(dispatch.id);
      if (response.success) {
        setEditDispatchModal(response.dispatch);
      } else {
        setError('Failed to fetch dispatch details');
      }
    } catch (err) {
      console.error('Error fetching dispatch details:', err);
      setError('Failed to fetch dispatch details');
    }
  };

  // Handle save dispatch details
  const handleSaveDispatchDetails = async () => {
    if (!editDispatchModal) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await dispatchAPI.update(editDispatchModal.id, {
        customer: editDispatchModal.customer,
        name: editDispatchModal.name,
        phone: editDispatchModal.phone,
        address: editDispatchModal.address,
        city: editDispatchModal.city,
        state: editDispatchModal.state,
        pincode: editDispatchModal.pincode,
        material: editDispatchModal.material,
        packaging: editDispatchModal.packaging,
        bookingToCity: editDispatchModal.booking_to_city,
        bookingCityNumber: editDispatchModal.booking_city_number,
        transportName: editDispatchModal.transport_name,
        transportPhone: editDispatchModal.transport_phone,
        estimatedDate: editDispatchModal.estimated_date,
        llrNumber: editDispatchModal.llr_number
      });
      
      if (response.success) {
        await fetchDispatches();
        setEditDispatchModal(null);
        setError('');
        setSuccessMessage('Dispatch updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to update dispatch');
      }
    } catch (err) {
      console.error('Error updating dispatch:', err);
      setError(err.message || 'Failed to update dispatch');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input change in edit modal
  const handleEditInputChange = (field, value) => {
    if (editDispatchModal) {
      setEditDispatchModal({
        ...editDispatchModal,
        [field]: value
      });
    }
  };

  const closeEditModal = () => {
    setEditDispatchModal(null);
  };

  // Handle mark as verified
  const handleMarkAsVerified = async (dispatch) => {
    if (dispatch.is_verified === true) {
      return; // Already verified
    }

    try {
      setError('');
      const response = await dispatchAPI.verify(dispatch.id);
      if (response.success) {
        setSuccessMessage('Dispatch marked as verified successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        await fetchDispatches();
      } else {
        setError(response.error || 'Failed to mark dispatch as verified');
      }
    } catch (err) {
      console.error('Error marking dispatch as verified:', err);
      setError(err.message || 'Failed to mark dispatch as verified');
    }
  };

  // Handle view dispatch details
  const handleViewDispatchDetails = async (dispatch) => {
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

        <Toast message={successMessage} type="success" onClose={() => setSuccessMessage('')} />
        <Toast message={error} type="error" onClose={() => setError('')} />

        {/* Dispatches List */}
        <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
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
                      Name
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Customer
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Phone
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Transport
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Date
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
                  {filteredDispatches.map((dispatch, index) => (
                    <tr key={dispatch.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
                        {dispatch.name || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px 8px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {dispatch.customer || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px 8px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {dispatch.phone || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px 8px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {dispatch.transportName || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px 8px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {dispatch.created_at ? new Date(dispatch.created_at).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </td>
                      <td style={{ 
                        textAlign: 'center',
                        padding: '12px 8px',
                        fontSize: '14px'
                      }}>
                        {dispatch.is_verified === true ? (
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
                            color: '#dc3545', 
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="fas fa-exclamation-circle"></i> Not Verified
                          </span>
                        )}
                      </td>
                      <td style={{ 
                        textAlign: 'center',
                        padding: '12px 8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleViewDispatchDetails(dispatch)}
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
                            onClick={() => handleEditDispatch(dispatch)}
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
                          {(dispatch.is_verified !== true) && (userRole === 'admin' || userRole === 'supervisor') && (
                            <button
                              onClick={() => handleMarkAsVerified(dispatch)}
                              style={{
                                background: '#ff9800',
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
                                e.target.style.background = '#e68900';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#ff9800';
                              }}
                            >
                              <i className="fas fa-check-circle"></i>
                              Mark as Verified
                            </button>
                          )}
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
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(userRole === 'admin' || userRole === 'supervisor') && (
                  viewDispatchModal.is_verified !== true ? (
                    <button
                      onClick={async () => {
                        try {
                          const response = await dispatchAPI.verify(viewDispatchModal.id);
                          if (response.success) {
                            setViewDispatchModal({ ...viewDispatchModal, is_verified: true });
                            setSuccessMessage('Dispatch verified successfully');
                            setTimeout(() => setSuccessMessage(''), 3000);
                            await fetchDispatches();
                          } else {
                            setError(response.error || 'Failed to verify dispatch');
                            setTimeout(() => setError(''), 3000);
                          }
                        } catch (err) {
                          console.error('Error verifying dispatch:', err);
                          setError(err.message || 'Failed to verify dispatch');
                          setTimeout(() => setError(''), 3000);
                        }
                      }}
                      style={{
                        background: '#ff9800',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fas fa-check-circle"></i>
                      Mark as Verified
                    </button>
                  ) : (
                    <span style={{ color: '#28a745', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-check-circle"></i>
                      Verified
                    </span>
                  )
                )}
              </div>
              <button className="modal-close-button" onClick={closeViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dispatch Modal */}
      {editDispatchModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Dispatch Details</h2>
              <button className="modal-close-btn" onClick={closeEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <Toast message={error} type="error" onClose={() => setError('')} />
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{editDispatchModal.name 
                    ? editDispatchModal.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'DP'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Customer:</span>
                    <input
                      type="text"
                      value={editDispatchModal.customer || ''}
                      onChange={(e) => handleEditInputChange('customer', e.target.value)}
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
                    <span className="detail-label">Name:</span>
                    <input
                      type="text"
                      value={editDispatchModal.name || ''}
                      onChange={(e) => handleEditInputChange('name', e.target.value)}
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
                      value={editDispatchModal.phone || ''}
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
                    <span className="detail-label">Address:</span>
                    <textarea
                      value={editDispatchModal.address || ''}
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
                      value={editDispatchModal.city || ''}
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
                      value={editDispatchModal.state || ''}
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
                      value={editDispatchModal.pincode || ''}
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
                  <div className="detail-row">
                    <span className="detail-label">Transport Name:</span>
                    <input
                      type="text"
                      value={editDispatchModal.transport_name || ''}
                      onChange={(e) => handleEditInputChange('transport_name', e.target.value)}
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
                  {editDispatchModal.material && (
                    <div className="detail-row">
                      <span className="detail-label">Material:</span>
                      <input
                        type="text"
                        value={editDispatchModal.material || ''}
                        onChange={(e) => handleEditInputChange('material', e.target.value)}
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
                  )}
                  {editDispatchModal.packaging && (
                    <div className="detail-row">
                      <span className="detail-label">Packaging:</span>
                      <input
                        type="text"
                        value={editDispatchModal.packaging || ''}
                        onChange={(e) => handleEditInputChange('packaging', e.target.value)}
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
                  )}
                  {editDispatchModal.booking_to_city && (
                    <div className="detail-row">
                      <span className="detail-label">Booking to City:</span>
                      <input
                        type="text"
                        value={editDispatchModal.booking_to_city || ''}
                        onChange={(e) => handleEditInputChange('booking_to_city', e.target.value)}
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
                  )}
                  {editDispatchModal.booking_city_number && (
                    <div className="detail-row">
                      <span className="detail-label">Booking City Number:</span>
                      <input
                        type="text"
                        value={editDispatchModal.booking_city_number || ''}
                        onChange={(e) => handleEditInputChange('booking_city_number', e.target.value)}
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
                  )}
                  {editDispatchModal.transport_phone && (
                    <div className="detail-row">
                      <span className="detail-label">Transport Phone:</span>
                      <input
                        type="tel"
                        value={editDispatchModal.transport_phone || ''}
                        onChange={(e) => handleEditInputChange('transport_phone', e.target.value)}
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
                  )}
                  {editDispatchModal.estimated_date && (
                    <div className="detail-row">
                      <span className="detail-label">Estimated Date:</span>
                      <input
                        type="date"
                        value={editDispatchModal.estimated_date ? editDispatchModal.estimated_date.split('T')[0] : ''}
                        onChange={(e) => handleEditInputChange('estimated_date', e.target.value)}
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
                  )}
                  {editDispatchModal.llr_number && (
                    <div className="detail-row">
                      <span className="detail-label">LLR Number:</span>
                      <input
                        type="text"
                        value={editDispatchModal.llr_number || ''}
                        onChange={(e) => handleEditInputChange('llr_number', e.target.value)}
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
                  )}
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
                onClick={handleSaveDispatchDetails}
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

export default DispatchDepartment;

