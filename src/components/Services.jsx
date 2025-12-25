import React, { useState, useEffect, useRef } from 'react';
import { servicesAPI } from '../services/api';
import './staff.css';

const Services = ({ onBack, onAddService, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewServiceModal, setViewServiceModal] = useState(null);
  const menuRefs = useRef({});

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
          handlerName: service.handler_name
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

  // Handle menu toggle
  const toggleMenu = (serviceId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === serviceId ? null : serviceId);
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

  // Handle view service details
  const handleViewServiceDetails = (service) => {
    setOpenMenuId(null);
    setViewServiceModal(service);
  };

  const closeViewModal = () => {
    setViewServiceModal(null);
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
        <div className="staff-list">
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
            filteredServices.map((service) => (
            <div key={service.id} className="staff-card">
              <div className="staff-avatar">
                <span>{service.initials || 'SV'}</span>
              </div>
              <div className="staff-info">
                <div className="staff-name">{service.name || 'N/A'}</div>
                {service.description && (
                  <div className="staff-role">{service.description}</div>
                )}
                {service.category && (
                  <div className="staff-store-badge">
                    <i className="fas fa-tag"></i>
                    <span>{service.category}</span>
                  </div>
                )}
              </div>
              {service.price && (
                <div className="staff-email">₹{service.price}</div>
              )}
              <div 
                className="staff-options-container" 
                ref={el => menuRefs.current[service.id] = el}
              >
                <button 
                  className="staff-options"
                  onClick={(e) => toggleMenu(service.id, e)}
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
                {openMenuId === service.id && (
                  <div className="staff-menu-dropdown">
                    <div className="menu-item" onClick={() => handleViewServiceDetails(service)}>
                      <i className="fas fa-eye"></i>
                      <span>View Service Details</span>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
