import React, { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const EditProfile = ({ onBack, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    role: 'Super Admin',
    email: '',
    phone: '',
    primaryStore: '',
    storeScope: 'All stores • Global scope',
    timezone: 'IST (GMT+05:30)'
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const handleHome = () => {
    if (onNavigate) onNavigate('dashboard');
    else if (onBack) onBack();
  };

  const handleManagers = () => onNavigate && onNavigate('users');
  const handleProducts = () => onNavigate && onNavigate('products');
  const handleStaff = () => onNavigate && onNavigate('staff');
  const handleSettings = () => onNavigate && onNavigate('settings');

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Fetch profile from database in background (non-blocking)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileAPI.get();
        if (response.success) {
          const profile = response.profile;
          setFormData({
            fullName: profile.full_name || '',
            role: profile.role || 'Super Admin',
            email: profile.email || '',
            phone: profile.phone || '',
            primaryStore: profile.primary_store || '',
            storeScope: profile.store_scope || 'All stores • Global scope',
            timezone: profile.timezone || 'IST (GMT+05:30)'
          });
          if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
            // Construct full URL for preview
            const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
            const fullUrl = profile.avatar_url.startsWith('http') 
              ? profile.avatar_url 
              : `${apiBase}${profile.avatar_url}`;
            setAvatarPreview(fullUrl);
          } else {
            // Reset if no avatar - keep initials
            setAvatarUrl('');
            setAvatarPreview('');
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        // Silently fail - form already has default values
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploadingAvatar(true);
    setError('');
    try {
      const response = await profileAPI.uploadAvatar(file);
      if (response.success) {
        // Save the avatar URL - this is already saved to database by the upload endpoint
        setAvatarUrl(response.avatarUrl);
        // Update preview with full URL if provided
        if (response.fullAvatarUrl) {
          setAvatarPreview(response.fullAvatarUrl);
        } else {
          const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
          setAvatarPreview(`${apiBase}${response.avatarUrl}`);
        }
        setSuccessMessage('Profile photo updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        // Clear any previous errors
        setError('');
      } else {
        throw new Error(response.error || 'Failed to upload photo');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Failed to upload photo. Please try again.');
      // Revert preview to previous avatar or empty
      if (avatarUrl) {
        const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const fullUrl = avatarUrl.startsWith('http') 
          ? avatarUrl 
          : `${apiBase}${avatarUrl}`;
        setAvatarPreview(fullUrl);
      } else {
        setAvatarPreview('');
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const changePasswordConfirmed = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await profileAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (response.success) {
        // Close modal first
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        // Show success message in main form area
        setSuccessMessage('Successfully password changed');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(response.error || 'Failed to change password. Please try again.');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    // Clear previous errors
    setError('');
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    // Show custom confirmation dialog before submitting
    setConfirmState({
      open: true,
      message: 'Are you sure you want to change your password?',
      onConfirm: changePasswordConfirmed,
    });
  };

  const getInitials = (name) => {
    if (!name) return 'AR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const saveProfileConfirmed = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // Only include avatarUrl if it's been set (from upload)
      const updateData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        primaryStore: formData.primaryStore,
        storeScope: formData.storeScope,
        timezone: formData.timezone
      };
      
      // Only include avatarUrl if it exists (has been uploaded)
      if (avatarUrl) {
        updateData.avatarUrl = avatarUrl;
      }
      
      const response = await profileAPI.update(updateData);

      if (response.success) {
        setSuccessMessage('Save changes are done');
        // Update form data with response if provided
        if (response.profile) {
          const profile = response.profile;
          setFormData(prev => ({
            ...prev,
            fullName: profile.full_name || prev.fullName,
            email: profile.email || prev.email,
            phone: profile.phone || prev.phone,
            primaryStore: profile.primary_store || prev.primaryStore,
            storeScope: profile.store_scope || prev.storeScope,
            timezone: profile.timezone || prev.timezone
          }));
          // Update avatar if changed
          if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
            const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
            const fullUrl = profile.avatar_url.startsWith('http') 
              ? profile.avatar_url 
              : `${apiBase}${profile.avatar_url}`;
            setAvatarPreview(fullUrl);
          }
        }
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
          if (onNavigate) onNavigate('profile');
        }, 3000);
      } else {
        setError(response.error || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: saveProfileConfirmed,
    });
  };

  const handleCancel = () => {
    if (onNavigate) onNavigate('profile');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <nav className={`sidebar-nav ${sidebarOpen ? 'open' : ''}`}>
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
        <div className="nav-item" onClick={handleProducts}>
          <div className="nav-icon">
            <i className="fas fa-box"></i>
          </div>
          <span>Products</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('dashboard')}>
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
        <div className="nav-item" onClick={handleSettings}>
          <div className="nav-icon">
            <i className="fas fa-cog"></i>
          </div>
          <span>Settings</span>
        </div>
      </nav>

      {/* Overlay when sidebar is open */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main */}
      <div className={`dashboard-main ${sidebarOpen ? 'shifted' : ''}`}>
        <div className="edit-profile-container">
          {/* Header */}
          <header className="edit-profile-header">
            <div className="header-left">
              <button className="sidebar-toggle" onClick={toggleSidebar}>
                <i className="fas fa-bars"></i>
              </button>
              <button className="back-btn" onClick={handleCancel}>
                <i className="fas fa-arrow-left"></i>
              </button>
            </div>
            <div className="header-content">
              <h1 className="page-title">Edit Profile</h1>
              <p className="page-subtitle">Update your details</p>
            </div>
          </header>

          {/* Content */}
          <main className="edit-profile-content">
            <form onSubmit={handleSave}>
              {/* Profile Information Section */}
              <div className="profile-info-section">
                <div className="profile-avatar-large" style={{ position: 'relative', overflow: 'hidden' }}>
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview.startsWith('http') || avatarPreview.startsWith('data:') 
                        ? avatarPreview 
                        : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${avatarPreview}`}
                      alt="Profile"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1
                      }}
                      onError={(e) => {
                        console.error('Image load error:', e);
                        e.target.style.display = 'none';
                        const span = e.target.nextSibling;
                        if (span) {
                          span.style.display = 'flex';
                          setAvatarPreview(''); // Clear preview on error
                        }
                      }}
                    />
                  ) : null}
                  <span style={{ 
                    display: avatarPreview ? 'none' : 'flex',
                    position: avatarPreview ? 'absolute' : 'relative',
                    zIndex: avatarPreview ? 0 : 1
                  }}>
                    {getInitials(formData.fullName)}
                  </span>
                  {isUploadingAvatar && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff'
                    }}>
                      <i className="fas fa-spinner fa-spin"></i>
                    </div>
                  )}
                </div>
                <div className="profile-actions">
                  <label htmlFor="avatar-upload" className="change-photo-btn" style={{ cursor: 'pointer', margin: 0 }}>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarChange}
                      disabled={isUploadingAvatar}
                    />
                    <i className="fas fa-camera"></i>
                    <span>{isUploadingAvatar ? 'Uploading...' : 'Change photo'}</span>
                  </label>
                  <button 
                    type="button" 
                    className="change-password-btn"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </button>
                </div>
              </div>

              {/* Basic Details Section */}
              <div className="form-section">
                <h3 className="section-title">Basic details</h3>
                <div className="form-group">
                  <label htmlFor="fullName">Full name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className="form-input"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <div className="role-pill">{formData.role}</div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="form-section">
                <h3 className="section-title">Contact</h3>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <div className="input-wrapper">
                    <i className="fas fa-envelope input-icon"></i>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
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
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Store Scope Section */}
              <div className="form-section">
                <h3 className="section-title">Store scope</h3>
                <div className="form-group">
                  <label htmlFor="primaryStore">Primary store</label>
                  <div className="input-wrapper">
                    <i className="fas fa-building input-icon"></i>
                    <select
                      id="primaryStore"
                      name="primaryStore"
                      className="form-input"
                      value={formData.primaryStore}
                      onChange={handleInputChange}
                    >
                      <option value="Hyderabad Mart">Hyderabad Mart</option>
                      <option value="Mumbai Mart">Mumbai Mart</option>
                      <option value="Delhi Mart">Delhi Mart</option>
                    </select>
                    <i className="fas fa-chevron-down dropdown-icon"></i>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="storeScope">Store scope</label>
                  <div className="input-wrapper">
                    <i className="fas fa-circle input-icon scope-icon"></i>
                    <select
                      id="storeScope"
                      name="storeScope"
                      className="form-input"
                      value={formData.storeScope}
                      onChange={handleInputChange}
                    >
                      <option value="All stores • Global scope">All stores • Global scope</option>
                      <option value="Selected stores">Selected stores</option>
                    </select>
                    <i className="fas fa-chevron-down dropdown-icon"></i>
                  </div>
                </div>
              </div>

              {/* Timezone Section */}
              <div className="form-section">
                <h3 className="section-title">Timezone</h3>
                <div className="form-group">
                  <label htmlFor="timezone">Timezone</label>
                  <div className="input-wrapper">
                    <i className="fas fa-clock input-icon"></i>
                    <select
                      id="timezone"
                      name="timezone"
                      className="form-input"
                      value={formData.timezone}
                      onChange={handleInputChange}
                    >
                      <option value="IST (GMT+05:30)">IST (GMT+05:30)</option>
                      <option value="EST (GMT-05:00)">EST (GMT-05:00)</option>
                      <option value="PST (GMT-08:00)">PST (GMT-08:00)</option>
                    </select>
                    <i className="fas fa-chevron-down dropdown-icon"></i>
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
                  <button type="submit" className="save-btn" disabled={isSaving || isUploadingAvatar}>
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button type="button" className="cancel-link" onClick={handleCancel}>
                    Cancel and discard
                  </button>
                </div>
              </form>
            )}
          </main>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowPasswordModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '18px', fontWeight: '700' }}>
              Change Password
            </h3>
            
            {/* Error Message in Modal */}
            {error && (
              <div style={{ 
                padding: '12px', 
                background: '#ffe0e0', 
                color: '#dc3545', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#333' }}>
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #f0f0f0',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
                placeholder="Enter current password"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#333' }}>
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #f0f0f0',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
                placeholder="Enter new password"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#333' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #f0f0f0',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
                placeholder="Confirm new password"
              />
            </div>

            {/* Success Message in Modal */}
            {successMessage && successMessage.includes('password') && showPasswordModal && (
              <div style={{ 
                padding: '12px', 
                background: '#d4edda', 
                color: '#155724', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-check-circle"></i> 
                <span>{successMessage}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setError('');
                  setSuccessMessage('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={isSaving}
                style={{
                  padding: '10px 20px',
                  background: '#dc3545',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#fff',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmState.open}
        title="Please Confirm"
        message={confirmState.message}
        confirmText="Yes, Continue"
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

export default EditProfile;

