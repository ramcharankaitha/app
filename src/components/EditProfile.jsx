import React, { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

  // Fetch profile from database
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
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
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setIsLoading(false);
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

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to submit?');
    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await profileAPI.update({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        primaryStore: formData.primaryStore,
        storeScope: formData.storeScope,
        timezone: formData.timezone
      });

      if (response.success) {
        setSuccessMessage('Save changes are done');
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
          if (onNavigate) onNavigate('profile');
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
      console.error('Update profile error:', err);
    } finally {
      setIsSaving(false);
    }
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
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#dc3545' }}></i>
                <p>Loading profile...</p>
              </div>
            ) : (
              <form onSubmit={handleSave}>
              {/* Profile Information Section */}
              <div className="profile-info-section">
                <div className="profile-avatar-large">
                  <span>AR</span>
                </div>
                <div className="profile-actions">
                  <button type="button" className="change-photo-btn">
                    <i className="fas fa-camera"></i>
                    <span>Change photo</span>
                  </button>
                  <button type="button" className="change-password-btn">
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
                  <button type="submit" className="save-btn" disabled={isSaving}>
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
    </div>
  );
};

export default EditProfile;

