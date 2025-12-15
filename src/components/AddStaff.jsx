import React, { useState } from 'react';
import { staffAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddStaff = ({ onBack, onCancel, onNavigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    storeAllocated: '',
    email: '',
    phoneNumber: '',
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
      onNavigate('staff');
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

  const handleMasterMenu = () => {
    if (onNavigate) {
      onNavigate('masterMenu');
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
      onNavigate('staff');
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

  const submitStaff = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await staffAPI.create({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        username: formData.username,
        password: formData.password,
        storeAllocated: formData.storeAllocated,
        address: formData.address
      });

      if (response.success) {
        setSuccessMessage('Save changes are done');
        // Clear success message and navigate after 2 seconds
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create staff. Please try again.');
      console.error('Create staff error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: submitStaff,
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
        <div className="nav-item" onClick={handleManagers}>
          <div className="nav-icon">
            <i className="fas fa-users"></i>
          </div>
          <span>Managers</span>
        </div>
        <div className="nav-item active" onClick={handleStaff}>
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
        <div className="nav-item" onClick={handleMasterMenu}>
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
              <h1 className="page-title">Add Staff</h1>
              <p className="page-subtitle">Create a new account for this store.</p>
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
                {/* Staff Details Section */}
                <div className="form-section">
                  <h3 className="section-title">Staff details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="fullName">Full name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className="form-input"
                        placeholder="Enter full name."
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="storeAllocated">Floor allocated</label>
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
                          <option value="">Select Floor.</option>
                          <option value="1">Floor 1</option>
                          <option value="2">Floor 2</option>
                          <option value="3">Floor 3</option>
                          <option value="4">Floor 4</option>
                          <option value="5">Floor 5</option>
                        </select>
                        <i className="fas fa-chevron-down dropdown-icon"></i>
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
                          placeholder="name.lastname@dmart.com"
                          value={formData.email}
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

                {/* Staff Details Section (Login Credentials) */}
                <div className="form-section">
                  <h3 className="section-title">Staff details</h3>
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
                    {isLoading ? 'Creating...' : 'Create Staff'}
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

export default AddStaff;

