import React, { useState, useEffect } from 'react';
import { servicesAPI } from '../services/api';
import './products.css';

const Handler = ({ onBack, onNavigate, userData }) => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch services assigned to this handler
  const fetchHandlerServices = async () => {
    setIsLoading(true);
    try {
      setError('');
      // Get handler name from userData (staff login returns name field from full_name)
      // Also get handler ID if available for more accurate matching
      const handlerName = userData?.name || userData?.full_name || userData?.username || '';
      const handlerId = userData?.id;
      
      if (!handlerName) {
        console.error('Handler name not found in userData:', userData);
        setError('Handler name not found. Please contact administrator.');
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching services for handler:', handlerName, 'ID:', handlerId);
      console.log('Full userData:', userData);
      const response = await servicesAPI.getByHandler(handlerName, handlerId);
      
      if (response && response.success !== false) {
        // Filter only pending services (not completed)
        const pendingServices = (response.services || []).filter(
          service => !service.is_completed
        );
        setServices(pendingServices);
        setFilteredServices(pendingServices);
        console.log('Loaded services:', pendingServices.length);
        
        if (pendingServices.length === 0 && (response.services || []).length > 0) {
          // All services are completed
          setError('');
        }
      } else {
        console.error('API response error:', response);
        setError(response?.error || response?.message || 'Failed to load services');
      }
    } catch (err) {
      console.error('Error fetching handler services:', err);
      setError(err.message || 'Failed to load services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHandlerServices();
  }, []);

  // Filter services based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredServices(services);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = services.filter(service =>
      service.customer_name?.toLowerCase().includes(query) ||
      service.product_name?.toLowerCase().includes(query) ||
      service.item_code?.toLowerCase().includes(query) ||
      service.serial_number?.toLowerCase().includes(query)
    );
    setFilteredServices(filtered);
  }, [searchQuery, services]);

  // Handle service selection
  const handleSelectService = (service) => {
    setSelectedService(service);
    setShowOTPModal(true);
    setOtpSent(false);
    setOtpCode('');
    setError('');
  };

  // Send OTP to customer
  const handleSendOTP = async () => {
    if (!selectedService) return;

    setIsLoading(true);
    try {
      setError('');
      const response = await servicesAPI.sendOTP(selectedService.id);
      if (response.success) {
        setOtpSent(true);
        setSuccessMessage('OTP sent successfully to customer');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and complete service
  const handleVerifyOTP = async () => {
    if (!selectedService || !otpCode.trim()) {
      setError('Please enter the OTP');
      return;
    }

    setIsVerifying(true);
    try {
      setError('');
      const response = await servicesAPI.verifyOTP(selectedService.id, otpCode);
      if (response.success) {
        setSuccessMessage('Service completed successfully!');
        setTimeout(() => {
          setShowOTPModal(false);
          setSelectedService(null);
          setOtpSent(false);
          setOtpCode('');
          fetchHandlerServices(); // Refresh services list
        }, 2000);
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={onBack}>
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="staff-container">
          {/* Header */}
          <header className="staff-header">
            <div className="header-left">
              <button className="back-btn" onClick={onBack}>
                <i className="fas fa-arrow-left"></i>
              </button>
              <div>
                <h1 className="staff-title">Handler Services</h1>
                <p className="staff-subtitle">Manage services assigned to you</p>
              </div>
            </div>
          </header>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="alert alert-success" style={{ margin: '16px 24px' }}>
              <i className="fas fa-check-circle"></i> {successMessage}
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ margin: '16px 24px' }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {/* Search Bar */}
          <div className="search-container" style={{ padding: '16px 24px' }}>
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by customer name, product, item code, or serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Services List */}
          <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
            {isLoading && services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#999' }}></i>
                <p style={{ marginTop: '16px', color: '#666' }}>Loading services...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-tools" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
                <p style={{ color: '#666', fontSize: '16px' }}>
                  {searchQuery ? 'No services found matching your search.' : 'No services assigned to you yet.'}
                </p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="product-card handler-service-card"
                    onClick={() => handleSelectService(service)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="product-header">
                      <div className="product-title">{service.customer_name || 'Unknown Customer'}</div>
                      <div className="product-badge" style={{ background: '#17a2b8', color: '#fff' }}>
                        <i className="fas fa-tools"></i> Service
                      </div>
                    </div>
                    <div className="product-details">
                      <div className="detail-row">
                        <span className="detail-label">Product:</span>
                        <span className="detail-value">{service.product_name || 'N/A'}</span>
                      </div>
                      {service.item_code && (
                        <div className="detail-row">
                          <span className="detail-label">Item Code:</span>
                          <span className="detail-value">{service.item_code}</span>
                        </div>
                      )}
                      {service.serial_number && (
                        <div className="detail-row">
                          <span className="detail-label">Serial Number:</span>
                          <span className="detail-value">{service.serial_number}</span>
                        </div>
                      )}
                      {service.service_date && (
                        <div className="detail-row">
                          <span className="detail-label">Service Date:</span>
                          <span className="detail-value">{formatDate(service.service_date)}</span>
                        </div>
                      )}
                      {service.customer_phone && (
                        <div className="detail-row">
                          <span className="detail-label">Customer Phone:</span>
                          <span className="detail-value">{service.customer_phone}</span>
                        </div>
                      )}
                    </div>
                    <div style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      background: '#fff3cd',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#856404',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>
                      <i className="fas fa-hand-pointer"></i> Click to complete service
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && selectedService && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => {
            if (!isVerifying) {
              setShowOTPModal(false);
              setSelectedService(null);
              setOtpSent(false);
              setOtpCode('');
            }
          }}
        >
          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Complete Service</h2>
              <button
                onClick={() => {
                  if (!isVerifying) {
                    setShowOTPModal(false);
                    setSelectedService(null);
                    setOtpSent(false);
                    setOtpCode('');
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: isVerifying ? 'not-allowed' : 'pointer',
                  color: '#999',
                }}
                disabled={isVerifying}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}><strong>Customer:</strong> {selectedService.customer_name}</p>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}><strong>Product:</strong> {selectedService.product_name}</p>
              {selectedService.customer_phone && (
                <p style={{ margin: '0', color: 'var(--text-secondary)' }}><strong>Phone:</strong> {selectedService.customer_phone}</p>
              )}
            </div>

            {!otpSent ? (
              <div>
                <p style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Click the button below to send OTP to the customer's phone number.
                </p>
                <button
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: isLoading ? '#ccc' : '#17a2b8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Send OTP
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '12px',
                  background: '#d4edda',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  color: '#155724'
                }}>
                  <i className="fas fa-check-circle"></i> OTP sent successfully to customer!
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Enter OTP received by customer:
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '18px',
                      textAlign: 'center',
                      letterSpacing: '4px',
                      fontWeight: '600'
                    }}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleVerifyOTP}
                  disabled={isVerifying || !otpCode || otpCode.length !== 6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: (isVerifying || !otpCode || otpCode.length !== 6) ? '#ccc' : '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (isVerifying || !otpCode || otpCode.length !== 6) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isVerifying ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      Verify OTP & Complete Service
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Handler;

