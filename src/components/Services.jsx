import React, { useState, useEffect, useRef } from 'react';
import { servicesAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './products.css';

const Services = ({ onBack, onAddService, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [viewServiceModal, setViewServiceModal] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  // Fetch services from database
  const fetchServices = async () => {
    try {
      setError('');
      const response = await servicesAPI.getAll();
      if (response.success) {
        const formattedServices = response.services.map(service => ({
          id: service.id,
          name: service.customer_name,
          initials: service.customer_name 
            ? service.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : 'SV',
          description: service.product_name || '',
          category: service.brand_name || '',
          price: null,
          created_at: service.created_at,
          warranty: service.warranty,
          unwarranty: service.unwarranty,
          itemCode: service.item_code,
          serialNumber: service.serial_number,
          serviceDate: service.service_date,
          handlerName: service.handler_name,
          is_verified: service.is_verified
        }));
        setServices(formattedServices);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services. Please try again.');
    }
  };

  useEffect(() => {
    fetchServices();
    
    // Listen for service creation events
    const handleServiceCreated = () => {
      fetchServices();
    };
    
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchServices();
      }
    };
    
    window.addEventListener('serviceCreated', handleServiceCreated);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('serviceCreated', handleServiceCreated);
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

  const handleAddService = () => {
    if (onAddService) {
      onAddService();
    } else if (onNavigate) {
      onNavigate('addService');
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

  // Filter services based on search
  const filteredServices = services.filter(service => {
    const searchLower = searchQuery.toLowerCase();
    const matchesName = service.name?.toLowerCase().includes(searchLower);
    const matchesDescription = service.description?.toLowerCase().includes(searchLower);
    const matchesCategory = service.category?.toLowerCase().includes(searchLower);
    return matchesName || matchesDescription || matchesCategory;
  });

  // Handle edit service
  const handleEditService = (service) => {
    if (onNavigate) {
      onNavigate('addService', { editId: service.id });
    }
  };

  // Handle verify service
  const handleVerifyService = async (service) => {
    if (service.is_verified === true) {
      return; // Already verified
    }

    try {
      setError('');
      const response = await servicesAPI.verify(service.id);
      if (response.success) {
        setSuccessMessage('Service verified successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        await fetchServices();
      } else {
        setError(response.error || 'Failed to mark service as verified');
      }
    } catch (err) {
      console.error('Error marking service as verified:', err);
      setError(err.message || 'Failed to mark service as verified');
    }
  };

  // Handle delete service
  const handleDeleteService = (service) => {
    setConfirmState({
      open: true,
      message: `Are you sure you want to delete service "${service.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setError('');
          // Note: You may need to add a delete endpoint to servicesAPI
          setError('Delete functionality to be implemented');
          setTimeout(() => setError(''), 3000);
          // const response = await servicesAPI.delete(service.id);
          // if (response.success) {
          //   await fetchServices();
          // } else {
          //   setError(response.error || 'Failed to delete service');
          // }
        } catch (err) {
          console.error('Delete service error:', err);
          setError(err.message || 'Failed to delete service');
        } finally {
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  // Handle view service details
  const handleViewServiceDetails = (service) => {
    setViewServiceModal(service);
  };

  const closeViewModal = () => {
    setViewServiceModal(null);
  };

  return (
    <div className="dashboard-container">
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
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
          <h1 className="page-title">Services</h1>
          <p className="page-subtitle">Manage service transactions</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="staff-content">
        {/* Tab and Add Button */}
        <div className="staff-top-section">
          <div className="tab-indicator">
            <span className="tab-dot"></span>
            <span className="tab-label">SERVICES</span>
          </div>
          <button className="add-staff-btn" onClick={handleAddService}>
            <i className="fas fa-plus"></i>
            <span>Create Service</span>
          </button>
        </div>

        {/* Heading */}
        <div className="staff-heading">
          <h2>Manage Services</h2>
          <p>View services, their details, and categories. Filter quickly.</p>
        </div>

        {/* Search */}
        <div className="staff-controls">
          <div className="staff-search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="staff-count">
          {`Showing ${filteredServices.length} of ${services.length} services`}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Services List */}
        <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
          {services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
              <i className="fas fa-concierge-bell" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Services Available</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Start by creating your first service.</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <p>No services found matching your search</p>
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
                      Service Name
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Product
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Category
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Handler
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Service Date
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
                  {filteredServices.map((service, index) => (
                    <tr key={service.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
                        {service.name || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px 8px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {service.description || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px 8px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {service.category || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px 8px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {service.handlerName || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px 8px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {service.serviceDate ? new Date(service.serviceDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td style={{ 
                        textAlign: 'center',
                        padding: '12px 8px',
                        fontSize: '14px'
                      }}>
                        {service.is_verified === true ? (
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
                            onClick={() => handleViewServiceDetails(service)}
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
                            onClick={() => handleEditService(service)}
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
                          {(service.is_verified !== true) && (userRole === 'admin' || userRole === 'supervisor') && (
                            <button
                              onClick={() => handleVerifyService(service)}
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
                          <button
                            onClick={() => handleDeleteService(service)}
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

      {/* View Service Details Modal */}
      {viewServiceModal && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Service Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{viewServiceModal.initials || 'SV'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Service Name:</span>
                    <span className="detail-value">{viewServiceModal.name || 'N/A'}</span>
                  </div>
                  {viewServiceModal.description && (
                    <div className="detail-row">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{viewServiceModal.description}</span>
                    </div>
                  )}
                  {viewServiceModal.category && (
                    <div className="detail-row">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{viewServiceModal.category}</span>
                    </div>
                  )}
                  {viewServiceModal.price && (
                    <div className="detail-row">
                      <span className="detail-label">Price:</span>
                      <span className="detail-value">₹{viewServiceModal.price}</span>
                    </div>
                  )}
                  {viewServiceModal.created_at && (
                    <div className="detail-row">
                      <span className="detail-label">Created At:</span>
                      <span className="detail-value">{new Date(viewServiceModal.created_at).toLocaleString()}</span>
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
                      checked={viewServiceModal.is_verified === true}
                      onChange={async (e) => {
                        if (e.target.checked && viewServiceModal.is_verified === false) {
                          try {
                            const response = await servicesAPI.verify(viewServiceModal.id);
                            if (response.success) {
                              setViewServiceModal({ ...viewServiceModal, is_verified: true });
                              setSuccessMessage('Service verified successfully');
                              setTimeout(() => setSuccessMessage(''), 3000);
                              await fetchServices();
                            } else {
                              setError('Failed to verify service');
                              setTimeout(() => setError(''), 3000);
                            }
                          } catch (err) {
                            console.error('Error verifying service:', err);
                            setError('Failed to verify service');
                            setTimeout(() => setError(''), 3000);
                          }
                        }
                      }}
                      disabled={viewServiceModal.is_verified === true}
                      style={{ width: '18px', height: '18px', cursor: viewServiceModal.is_verified === true ? 'not-allowed' : 'pointer' }}
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

export default Services;
