import React, { useState } from 'react';
import { staffAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import { pickPhotoWithSource, pickPhoto, pickDocument } from '../utils/photoUpload';

const AddStaff = ({ onBack, onCancel, onNavigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    storeAllocated: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    username: '',
    password: '',
    isHandler: false,
    salary: '',
    aadharFile: null,
    photo: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

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
      onNavigate('dashboard');
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

  const handlePhotoUpload = async () => {
    try {
      setError('');
      const result = await pickPhotoWithSource({ quality: 80, allowEditing: true });
      
      if (result.cancelled) {
        return;
      }
      
      if (!result.success) {
        setError(result.error || 'Failed to select photo');
        return;
      }
      
      if (result.file && result.preview) {
        setPhotoFile(result.file);
        setPhotoPreview(result.preview);
        setFormData(prev => ({ ...prev, photo: result.preview }));
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setError('Failed to upload photo. Please try again.');
    }
  };

  const handleAadharUpload = async () => {
    try {
      setError('');
      // Use pickDocument for Aadhar since it can be PDF or image
      const result = await pickDocument('image/*,.pdf');
      
      if (result.cancelled) {
        return;
      }
      
      if (!result.success) {
        setError(result.error || 'Failed to select Aadhar file');
        return;
      }
      
      if (result.file) {
        setFormData(prev => ({
          ...prev,
          aadharFile: result.file
        }));
      }
    } catch (err) {
      console.error('Aadhar upload error:', err);
      setError('Failed to upload Aadhar file. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const submitStaff = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // If Aadhar file is present, use FormData; if only photo (base64), use JSON
      let response;
      if (formData.aadharFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('fullName', formData.fullName);
        formDataToSend.append('phoneNumber', formData.phoneNumber);
        formDataToSend.append('username', formData.username);
        formDataToSend.append('password', formData.password);
        formDataToSend.append('storeAllocated', formData.storeAllocated);
        formDataToSend.append('address', formData.address);
        formDataToSend.append('city', formData.city);
        formDataToSend.append('state', formData.state);
        formDataToSend.append('pincode', formData.pincode);
        formDataToSend.append('isHandler', formData.isHandler);
        formDataToSend.append('salary', formData.salary || '');
        formDataToSend.append('aadharCopy', formData.aadharFile);
        // If photo is base64, convert to blob and append
        if (formData.photo && photoFile) {
          formDataToSend.append('photo', photoFile);
        }
        
        response = await staffAPI.createWithFile(formDataToSend);
      } else {
        // Use JSON for regular creation (supports base64 photo)
        response = await staffAPI.create({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          username: formData.username,
          password: formData.password,
          storeAllocated: formData.storeAllocated,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          isHandler: formData.isHandler,
          salary: formData.salary || null,
          photo: formData.photo || null
        });
      }

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
          <span>Supervisors</span>
        </div>
        <div className="nav-item active" onClick={handleStaff}>
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
        </div>
        <div className="nav-item" onClick={handleMasterMenu}>
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
              <h1 className="page-title">Add Staff</h1>
              <p className="page-subtitle">Create a new account for this store.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            {/* Photo Upload */}
            <div className="photo-upload-section">
              {photoPreview ? (
                <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
                  <img 
                    src={photoPreview} 
                    alt="Staff preview" 
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #dc3545'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoFile(null);
                      setFormData(prev => ({ ...prev, photo: null }));
                    }}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
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
                      fontSize: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                <div className="photo-placeholder">
                  <i className="fas fa-camera"></i>
                </div>
              )}
              <button
                type="button"
                className="upload-photo-btn"
                onClick={handlePhotoUpload}
              >
                <i className="fas fa-camera"></i>
                <span>{photoPreview ? 'Change photo' : 'Upload photo'}</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="add-user-form">
                {/* All fields in 3-column grid without section titles */}
                <div className="form-section">
                  <div className="form-grid three-col">
                    {/* Row 1: Name, Phone Number */}
                    <div className="form-group">
                      <label htmlFor="fullName">Staff name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className="form-input"
                        placeholder="Enter staff name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
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

                    {/* Row 2: Street, City, State */}
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
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <div className="input-wrapper">
                        <i className="fas fa-city input-icon"></i>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          className="form-input"
                          placeholder="Enter city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
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
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Row 3: Pincode, Can you be the handler, Floor allocated */}
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
                          value={formData.pincode}
                          onChange={handleInputChange}
                          required
                          maxLength="10"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="isHandler">Can you be the handler?</label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="isHandler"
                            value="yes"
                            checked={formData.isHandler === true}
                            onChange={(e) => setFormData(prev => ({ ...prev, isHandler: true }))}
                            style={{
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer',
                              accentColor: '#dc3545'
                            }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>Yes</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="isHandler"
                            value="no"
                            checked={formData.isHandler === false}
                            onChange={(e) => setFormData(prev => ({ ...prev, isHandler: false }))}
                            style={{
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer',
                              accentColor: '#dc3545'
                            }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>No</span>
                        </label>
                      </div>
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
                          <option value="">Select Floor</option>
                          <option value="1">Floor 1</option>
                          <option value="2">Floor 2</option>
                          <option value="3">Floor 3</option>
                          <option value="4">Floor 4</option>
                          <option value="5">Floor 5</option>
                        </select>
                        <i className="fas fa-chevron-down dropdown-icon"></i>
                  </div>
                </div>

                    {/* Row 4: Salary, Aadhar Upload */}
                    <div className="form-group">
                      <label htmlFor="salary">Salary</label>
                      <div className="input-wrapper">
                        <i className="fas fa-rupee-sign input-icon"></i>
                        <input
                          type="number"
                          id="salary"
                          name="salary"
                          className="form-input"
                          placeholder="Enter salary"
                          value={formData.salary}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="aadharFile">Upload Aadhar</label>
                      <div className="input-wrapper" style={{ position: 'relative' }}>
                        <i className="fas fa-id-card input-icon"></i>
                        <button
                          type="button"
                          onClick={handleAadharUpload}
                          className="form-input"
                          style={{ 
                            paddingTop: '10px',
                            paddingBottom: '10px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            background: 'var(--input-bg)',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <i className="fas fa-upload"></i>
                          <span>{formData.aadharFile ? formData.aadharFile.name : 'Click to upload Aadhar (Image/PDF)'}</span>
                        </button>
                        {formData.aadharFile && (
                          <div style={{
                            fontSize: '11px',
                            color: '#28a745',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="fas fa-check-circle"></i>
                            {formData.aadharFile.name}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, aadharFile: null }));
                              }}
                              style={{
                                marginLeft: '8px',
                                background: 'transparent',
                                border: 'none',
                                color: '#dc3545',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                              title="Remove file"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 5: Username and Password (2 columns) */}
                    <div className="form-group">
                      <label htmlFor="username">Username</label>
                      <div className="input-wrapper">
                        <i className="fas fa-user input-icon"></i>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        className="form-input"
                          placeholder="Enter username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                      />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <div className="input-wrapper password-wrapper">
                        <i className="fas fa-lock input-icon"></i>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          className="form-input"
                          placeholder="Enter password"
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

