import React, { useState } from 'react';
import { transportAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddTransport = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    travelsName: '',
    city: ''
  });
  const [addresses, setAddresses] = useState([
    { id: 1, city: '' }
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
        city: formData.city.trim()
      }]);
      // Clear city field after adding
      setFormData(prev => ({ 
        ...prev, 
        city: ''
      }));
      setError(''); // Clear any previous errors
    } else {
      setError('City is required.');
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
        setError('Please add at least one city.');
        setIsLoading(false);
        return;
      }

      const response = await transportAPI.create({
        travelsName: formData.travelsName,
        phoneNumber: formData.phoneNumber,
        addresses: validAddresses
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
                    {/* Row 1: Phone Number, Transport Name */}
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

                    {/* Row 2: City with Add City button below, aligned to right */}
                    <div className="form-group" style={{ gridColumn: 'span 1' }}>
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
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={addAddress}
                          style={{
                            padding: '4px 10px',
                            background: '#28a745',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <i className="fas fa-plus" style={{ fontSize: '9px' }}></i>
                          <span>Add City</span>
                        </button>
                      </div>
                    </div>
                      
                    {/* Display Added Cities - Side by side with Add City button in same row */}
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
                                  minWidth: '150px',
                                  maxWidth: '150px',
                                  flexShrink: 0,
                                  boxSizing: 'border-box'
                                }}
                              >
                                <div style={{ marginBottom: '6px', fontWeight: '600', color: '#dc3545', fontSize: '11px' }}>
                                  City {index + 1}
                                </div>
                                <div style={{ marginBottom: '4px', fontSize: '10px', lineHeight: '1.3' }}>
                                  <span style={{ color: '#333' }}>{addr.city || 'N/A'}</span>
                                </div>
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
                                  title="Remove this city"
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

