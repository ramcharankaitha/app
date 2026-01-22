import React, { useState } from 'react';
import { usersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddUser = ({ onBack, onCancel, onNavigate }) => {
  const [formData, setFormData] = useState({
    supervisorName: '',
    phone: '',
    storeAllocated: 'mart', // Default value
    address: '',
    city: '',
    state: '',
    pincode: '',
    username: '',
    password: '',
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
    const { name, value, type, files } = e.target;
    if (type === 'file' && name === 'photo') {
      const file = files && files.length > 0 ? files[0] : null;
      if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError('Photo size should be less than 5MB');
          return;
        }
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Please select a valid image file');
          return;
        }
        setPhotoFile(file);
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
          setFormData(prev => ({ ...prev, photo: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const submitUser = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Split supervisor name into first and last name for backend compatibility
      const nameParts = formData.supervisorName.trim().split(' ').filter(part => part.length > 0);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ').trim() || null; // Use null if empty
      
      // Trim all values before sending
      const response = await usersAPI.create({
        firstName: firstName.trim(),
        lastName: lastName, // Can be null
        username: formData.username.trim(),
        password: formData.password,
        storeAllocated: formData.storeAllocated || 'mart',
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        pincode: formData.pincode.trim() || null,
        phone: formData.phone.trim(),
        photo: formData.photo || null
      });

      if (response.success) {
        const credentialsMessage = `Supervisor created successfully!\n\nLogin Credentials:\nUsername: ${formData.username}\nPassword: ${formData.password}\n\nPlease save these credentials. They cannot be viewed again.`;
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
          <span>Supervisors</span>
        </div>
        <div className="nav-item" onClick={handleStaff}>
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('masterMenu')}>
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
              <h1 className="page-title">Add Supervisor</h1>
              <p className="page-subtitle">Create a new supervisor account for this store.</p>
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
                    alt="Supervisor preview" 
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
                      const fileInput = document.getElementById('supervisorPhoto');
                      if (fileInput) fileInput.value = '';
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
              <input
                type="file"
                id="supervisorPhoto"
                name="photo"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleInputChange}
              />
              <label htmlFor="supervisorPhoto" className="upload-photo-btn" style={{ cursor: 'pointer' }}>
                <i className="fas fa-camera"></i>
                <span>{photoPreview ? 'Change photo' : 'Upload photo'}</span>
              </label>
            </div>

            <form onSubmit={handleSubmit} className="add-user-form">
                {/* All fields in 3-column grid without section titles */}
                <div className="form-section">
                  <div className="form-grid three-col">
                    {/* Row 1: Name, Phone Number */}
                    <div className="form-group">
                      <label htmlFor="supervisorName">Supervisor name</label>
                      <input
                        type="text"
                        id="supervisorName"
                        name="supervisorName"
                        className="form-input"
                        placeholder="Enter supervisor name"
                        value={formData.supervisorName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone number</label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone input-icon"></i>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="form-input"
                          placeholder="Enter phone number"
                          value={formData.phone}
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
                        />
                      </div>
                    </div>

                    {/* Row 3: Pincode (alone) */}
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

                    {/* Row 4: Username and Password (2 columns) */}
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

                    {/* Store field - hidden but required for submission */}
                    <input
                      type="hidden"
                      id="storeAllocated"
                      name="storeAllocated"
                      value={formData.storeAllocated || 'mart'}
                      onChange={handleInputChange}
                    />
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