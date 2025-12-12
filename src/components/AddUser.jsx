import React, { useState } from 'react';
import { usersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddUser = ({ onBack, onCancel, onNavigate }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    storeAllocated: '',
    email: '',
    address: '',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('users');
    } else if (onBack) {
      onBack();
    }
  };

  const handleHome = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  const handleUsers = () => {
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

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('users');
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

  const submitUser = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await usersAPI.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        storeAllocated: formData.storeAllocated,
        address: formData.address
      });

      if (response.success) {
        const credentialsMessage = `Manager created successfully!\n\nLogin Credentials:\nUsername: ${formData.username}\nPassword: ${formData.password}\n\nPlease save these credentials. They cannot be viewed again.`;
        setSuccessMessage(credentialsMessage);
        // Clear success message and navigate after 5 seconds (longer to read credentials)
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 5000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create user. Please try again.');
      console.error('Create user error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: submitUser,
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
        <div className="nav-item active" onClick={handleUsers}>
          <div className="nav-icon">
            <i className="fas fa-users"></i>
          </div>
          <span>Managers</span>
        </div>
        <div className="nav-item" onClick={handleProducts}>
          <div className="nav-icon">
            <i className="fas fa-box"></i>
          </div>
          <span>Products</span>
        </div>
        <div className="nav-item" onClick={handleHome}>
          <div className="nav-icon">
            <i className="fas fa-store"></i>
          </div>
          <span>Stores</span>
        </div>
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
              <h1 className="page-title">Add Manager</h1>
              <p className="page-subtitle">Create a new manager account for this store.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            {/* Photo Upload */}
            <div className="photo-upload-section">
              <div className="photo-placeholder">
                <i className="fas fa-camera"></i>
              </div>
              <button type="button" className="upload-photo-btn">
                <i className="fas fa-camera"></i>
                <span>Upload photo</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="add-user-form">
                {/* User Details Section */}
                <div className="form-section">
                  <h3 className="section-title">Manager details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="firstName">First name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        className="form-input"
                        placeholder="Enter first name."
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="lastName">Last name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        className="form-input"
                        placeholder="Enter last name."
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
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
                          placeholder="firstname.lastname@dmart.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="storeAllocated">Store</label>
                      <div className="input-wrapper">
                        <i className="fas fa-store input-icon"></i>
                        <select
                          id="storeAllocated"
                          name="storeAllocated"
                          className="form-input"
                          value={formData.storeAllocated}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select store.</option>
                          <option value="mart">Mart</option>
                          <option value="global">Global</option>
                        </select>
                        <i className="fas fa-chevron-down dropdown-icon"></i>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="form-section">
                  <h3 className="section-title">Address</h3>
                  
                  <div className="form-group">
                    <label htmlFor="address">Store / home address</label>
                    <div className="input-wrapper">
                      <i className="fas fa-map-marker-alt input-icon"></i>
                      <textarea
                        id="address"
                        name="address"
                        className="form-input textarea-input"
                        placeholder="Street, area, city&#10;State, pincode"
                        rows="2"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Manager Details Section (Login Credentials) */}
                <div className="form-section">
                  <h3 className="section-title">Login Credentials</h3>
                  <div className="form-grid two-col">
                    <div className="form-group">
                      <label htmlFor="username">username</label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        className="form-input"
                        placeholder="Enter username."
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="password">password</label>
                      <div className="input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          className="form-input"
                          placeholder="Enter password."
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <i className={showPassword ? 'fas fa-eye' : 'fas fa-eye-slash'}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <p className="form-warning">
                  Make sure email and store allocation are correct before saving.
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
                    padding: '16px', 
                    background: '#d4edda', 
                    color: '#155724', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    border: '2px solid #28a745'
                  }}>
                    <div style={{ marginBottom: '12px', fontWeight: '600', fontSize: '16px' }}>
                      <i className="fas fa-check-circle"></i> {successMessage.split('\n')[0]}
                    </div>
                    {successMessage.includes('Login Credentials') && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '12px', 
                        background: '#fff', 
                        borderRadius: '6px', 
                        border: '1px solid #28a745',
                        fontFamily: 'monospace',
                        fontSize: '14px'
                      }}>
                        <div style={{ marginBottom: '8px', fontWeight: '600' }}>Login Credentials:</div>
                        <div style={{ marginBottom: '4px' }}><strong>Username:</strong> {formData.username}</div>
                        <div style={{ marginBottom: '8px' }}><strong>Password:</strong> {formData.password}</div>
                        <div style={{ 
                          marginTop: '8px', 
                          padding: '8px', 
                          background: '#fff3cd', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#856404'
                        }}>
                          <i className="fas fa-exclamation-triangle"></i> <strong>Important:</strong> Save these credentials now. They cannot be viewed again after closing.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="form-actions">
                  <button type="submit" className="create-user-btn" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create user'}
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

export default AddUser;