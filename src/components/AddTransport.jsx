import React, { useState } from 'react';
import { transportAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddTransport = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    name: '',
    travelsName: '',
    service: '',
    vehicleNumber: ''
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
    const newId = addresses.length > 0
      ? Math.max(...addresses.map(addr => addr.id)) + 1
      : 1;
    setAddresses(prev => [...prev, { id: newId, address: '', city: '', state: '', pincode: '' }]);
  };

  const removeAddress = (id) => {
    if (addresses.length > 1) {
      setAddresses(prev => prev.filter(addr => addr.id !== id));
    }
  };

  const submitTransport = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Filter out empty addresses
      const validAddresses = addresses.filter(addr => 
        addr.address.trim() !== '' || addr.city.trim() !== '' || addr.state.trim() !== '' || addr.pincode.trim() !== ''
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
        <div className="nav-item" onClick={handleCustomers}>
          <div className="nav-icon">
            <i className="fas fa-user-friends"></i>
          </div>
          <span>Customers</span>
        </div>
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
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
            <form onSubmit={handleSubmit} className="add-user-form">
                {/* Transport Details Section */}
                <div className="form-section">
                  <h3 className="section-title">Transport details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="name">Name</label>
                      <div className="input-wrapper">
                        <i className="fas fa-user input-icon"></i>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className="form-input"
                          placeholder="Enter name."
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="travelsName">Travels Name</label>
                      <div className="input-wrapper">
                        <i className="fas fa-building input-icon"></i>
                        <input
                          type="text"
                          id="travelsName"
                          name="travelsName"
                          className="form-input"
                          placeholder="Enter travels name."
                          value={formData.travelsName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Multiple Addresses Section */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <label>Addresses</label>
                        <button
                          type="button"
                          onClick={addAddress}
                          style={{
                            padding: '8px 16px',
                            background: '#28a745',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="fas fa-plus"></i>
                          <span>Add Address</span>
                        </button>
                      </div>
                      {addresses.map((addr, index) => (
                        <div key={addr.id} style={{
                          marginBottom: '20px',
                          padding: '16px',
                          border: '2px solid #f0f0f0',
                          borderRadius: '8px',
                          position: 'relative'
                        }}>
                          {addresses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAddress(addr.id)}
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px'
                              }}
                              title="Remove this address"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                          <div style={{ marginBottom: '12px', fontWeight: '600', color: '#333' }}>
                            Address {index + 1}
                          </div>
                          <div className="form-grid">
                            <div className="form-group full-width">
                              <label htmlFor={`address-${addr.id}`}>Street Address</label>
                              <div className="input-wrapper">
                                <i className="fas fa-map-marker-alt input-icon"></i>
                                <textarea
                                  id={`address-${addr.id}`}
                                  className="form-input textarea-input"
                                  placeholder="Enter street address, area"
                                  rows="2"
                                  value={addr.address}
                                  onChange={(e) => handleAddressChange(addr.id, 'address', e.target.value)}
                                ></textarea>
                              </div>
                            </div>

                            <div className="form-group">
                              <label htmlFor={`city-${addr.id}`}>City</label>
                              <div className="input-wrapper">
                                <i className="fas fa-city input-icon"></i>
                                <input
                                  type="text"
                                  id={`city-${addr.id}`}
                                  className="form-input"
                                  placeholder="Enter city."
                                  value={addr.city}
                                  onChange={(e) => handleAddressChange(addr.id, 'city', e.target.value)}
                                  required={index === 0}
                                />
                              </div>
                            </div>

                            <div className="form-group">
                              <label htmlFor={`state-${addr.id}`}>State</label>
                              <div className="input-wrapper">
                                <i className="fas fa-map input-icon"></i>
                                <input
                                  type="text"
                                  id={`state-${addr.id}`}
                                  className="form-input"
                                  placeholder="Enter state."
                                  value={addr.state}
                                  onChange={(e) => handleAddressChange(addr.id, 'state', e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="form-group">
                              <label htmlFor={`pincode-${addr.id}`}>Pincode</label>
                              <div className="input-wrapper">
                                <i className="fas fa-mail-bulk input-icon"></i>
                                <input
                                  type="text"
                                  id={`pincode-${addr.id}`}
                                  className="form-input"
                                  placeholder="Enter pincode."
                                  value={addr.pincode}
                                  onChange={(e) => handleAddressChange(addr.id, 'pincode', e.target.value)}
                                  maxLength="10"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
                          placeholder="Enter service."
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
                          placeholder="Enter vehicle number (optional)"
                          value={formData.vehicleNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <p className="form-warning">
                  Make sure all transport details are correct before saving.
                </p>

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

