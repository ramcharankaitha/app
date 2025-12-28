import React, { useState } from 'react';
import { transportAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddTransport = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    travelsName: '',
    service: '',
    vehicleNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [addresses, setAddresses] = useState([
    { id: 1, address: '', city: '', state: '', pincode: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('transport');
    } else if (onBack) {
      onBack();
    }
  };

  const handleHome = () => {
    if (onNavigate) {
      onNavigate('dashboard');
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

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('transport');
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (id, field, value) => {
    setAddresses(prev =>
      prev.map(addr =>
        addr.id === id ? { ...addr, [field]: value } : addr
      )
    );
  };

  const addAddress = () => {
    // At least city is required (backend validation)
    if (formData.city && formData.city.trim() !== '') {
      const newId = addresses.length > 0
        ? Math.max(...addresses.map(addr => addr.id)) + 1
        : 1;
      setAddresses(prev => [...prev, { 
        id: newId, 
        address: formData.address.trim() || '', 
        city: formData.city.trim(), 
        state: formData.state.trim() || '', 
        pincode: formData.pincode.trim() || '' 
      }]);
      // Clear address fields after adding
      setFormData(prev => ({ 
        ...prev, 
        address: '', 
        city: '', 
        state: '', 
        pincode: '' 
      }));
      setError(''); // Clear any previous errors
    } else {
      setError('City is required for each address.');
    }
  };

  const removeAddress = (id) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  const submitTransport = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Filter out empty addresses - at least city is required
      const validAddresses = addresses.filter(addr => 
        addr.city && addr.city.trim() !== ''
      );

      if (validAddresses.length === 0) {
        setError('Please add at least one address.');
        setIsLoading(false);
        return;
      }

      const response = await transportAPI.create({
        name: formData.name,
        travelsName: formData.travelsName,
        addresses: validAddresses,
        service: formData.service,
        vehicleNumber: formData.vehicleNumber
      });

      if (response.success) {
        setSuccessMessage('Save changes are done');
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create transport record. Please try again.');
      console.error('Create transport error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: submitTransport,
    });
  };

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={handleHome}>
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
        <div className="nav-item" onClick={handleStaff}>
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
        </div>
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
        <div className="add-user-container">
          {/* Header */}
          <header className="add-user-header">
            <button className="back-btn" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-content">
              <h1 className="page-title">Add Transport</h1>
              <p className="page-subtitle">Create a new transport record.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form add-transport-form">
                {/* All fields in 3-column grid without section titles */}
                <div className="form-section">
                  <div className="form-grid three-col">
                    {/* Row 1: Name, Phone Number, Email */}
                    <div className="form-group">
                      <label htmlFor="name">Name</label>
                      <div className="input-wrapper">
                        <i className="fas fa-user input-icon"></i>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className="form-input"
                          placeholder="Enter name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phoneNumber">Phone number</label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone input-icon"></i>
                        <input
                          type="tel"
                          id="phoneNumber"
                          name="phoneNumber"
                          className="form-input"
                          placeholder="Enter phone number"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <div className="input-wrapper">
                        <i className="fas fa-envelope input-icon"></i>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="form-input"
                          placeholder="Enter email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Row 2: Transport Name, Service, Vehicle Number */}
                    <div className="form-group">
                      <label htmlFor="travelsName">Transport Name</label>
                      <div className="input-wrapper">
                        <i className="fas fa-building input-icon"></i>
                        <input
                          type="text"
                          id="travelsName"
                          name="travelsName"
                          className="form-input"
                          placeholder="Enter transport name"
                          value={formData.travelsName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="service">Service</label>
                      <div className="input-wrapper">
                        <i className="fas fa-cog input-icon"></i>
                        <input
                          type="text"
                          id="service"
                          name="service"
                          className="form-input"
                          placeholder="Enter service"
                          value={formData.service}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="vehicleNumber">Vehicle Number</label>
                      <div className="input-wrapper">
                        <i className="fas fa-truck input-icon"></i>
                        <input
                          type="text"
                          id="vehicleNumber"
                          name="vehicleNumber"
                          className="form-input"
                          placeholder="Enter vehicle number"
                          value={formData.vehicleNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Row 3: Street, City, State */}
                    <div className="form-group">
                      <label htmlFor="address">Street</label>
                          <div className="input-wrapper">
                            <i className="fas fa-map-marker-alt input-icon"></i>
                        <input
                          type="text"
                              id="address"
                              name="address"
                          className="form-input"
                          placeholder="Enter street address"
                              value={formData.address || ''}
                              onChange={handleInputChange}
                        />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="city">City <span style={{ color: '#dc3545' }}>*</span></label>
                          <div className="input-wrapper">
                            <i className="fas fa-city input-icon"></i>
                            <input
                              type="text"
                              id="city"
                              name="city"
                              className="form-input"
                              placeholder="Enter city"
                              value={formData.city || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="state">State</label>
                          <div className="input-wrapper">
                            <i className="fas fa-map input-icon"></i>
                            <input
                              type="text"
                              id="state"
                              name="state"
                              className="form-input"
                              placeholder="Enter state"
                              value={formData.state || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>

                    {/* Row 4: Pincode and Add Address button */}
                        <div className="form-group">
                          <label htmlFor="pincode">Pincode</label>
                          <div className="input-wrapper">
                            <i className="fas fa-mail-bulk input-icon"></i>
                            <input
                              type="text"
                              id="pincode"
                              name="pincode"
                              className="form-input"
                              placeholder="Enter pincode"
                              value={formData.pincode || ''}
                              onChange={handleInputChange}
                              maxLength="10"
                            />
                        </div>
                      </div>

                    <div className="form-group">
                      <label>&nbsp;</label>
                      <button
                        type="button"
                        onClick={addAddress}
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          background: '#28a745',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          marginTop: '4px'
                        }}
                      >
                        <i className="fas fa-plus"></i>
                        <span>Add Address</span>
                      </button>
                    </div>
                      
                    {/* Display Added Addresses - Side by side with Add Address button in same row */}
                      {addresses.length > 0 && addresses.some(addr => addr.city && addr.city.trim() !== '') && (
                      <div className="form-group" style={{ gridColumn: 'span 1' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px', 
                          fontWeight: '600', 
                          color: '#333', 
                          fontSize: '12px' 
                        }}>
                          Added ({addresses.filter(addr => addr.city && addr.city.trim() !== '').length})
                          </label>
                        <div style={{ 
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '8px',
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          width: '100%'
                        }}>
                          {addresses
                            .filter(addr => addr.city && addr.city.trim() !== '')
                            .map((addr, index) => (
                              <div
                                key={addr.id}
                                style={{
                                  padding: '8px',
                                  background: '#f8f9fa',
                                  border: '2px solid #e0e0e0',
                                  borderRadius: '6px',
                                  position: 'relative',
                                  minWidth: '200px',
                                  maxWidth: '200px',
                                  flexShrink: 0,
                                  boxSizing: 'border-box'
                                }}
                              >
                                <div style={{ marginBottom: '6px', fontWeight: '600', color: '#dc3545', fontSize: '11px' }}>
                                  Address {index + 1}
                                </div>
                                {addr.address && addr.address.trim() !== '' && (
                                  <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                                    <span style={{ fontWeight: '500', color: '#666' }}>Street: </span>
                                    <span style={{ color: '#333' }}>{addr.address}</span>
                                  </div>
                                )}
                                <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                                  <span style={{ fontWeight: '500', color: '#666' }}>City: </span>
                                  <span style={{ color: '#333' }}>{addr.city || 'N/A'}</span>
                                </div>
                                {addr.state && addr.state.trim() !== '' && (
                                  <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                                    <span style={{ fontWeight: '500', color: '#666' }}>State: </span>
                                    <span style={{ color: '#333' }}>{addr.state}</span>
                                  </div>
                                )}
                                {addr.pincode && addr.pincode.trim() !== '' && (
                                  <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                                    <span style={{ fontWeight: '500', color: '#666' }}>Pincode: </span>
                                    <span style={{ color: '#333' }}>{addr.pincode}</span>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeAddress(addr.id)}
                                  style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    background: '#dc3545',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '9px'
                                  }}
                                  title="Remove this address"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            ))}
                        </div>
                        </div>
                      )}
                  </div>
                </div>


                {/* Error Message */}
                {error && (
                  <div className="error-message" style={{ 
                    padding: '12px', 
                    background: '#ffe0e0', 
                    color: '#dc3545', 
                    borderRadius: '8px', 
                    marginBottom: '20px' 
                  }}>
                    <i className="fas fa-exclamation-circle"></i> {error}
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="success-message" style={{ 
                    padding: '12px', 
                    background: '#d4edda', 
                    color: '#155724', 
                    borderRadius: '8px', 
                    marginBottom: '20px' 
                  }}>
                    <i className="fas fa-check-circle"></i> {successMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="form-actions">
                  <button type="submit" className="create-user-btn" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Transport Record'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    Cancel and go back
                  </button>
                </div>
              </form>
          </main>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.open}
        title="Confirm Submission"
        message={confirmState.message}
        confirmText="Yes, Submit"
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmState({ open: false, message: '', onConfirm: null });
          if (confirmState.onConfirm) confirmState.onConfirm();
        }}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
    </div>
  );
};

export default AddTransport;

