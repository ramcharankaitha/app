import React, { useState } from 'react';
import { useProfile } from '../hooks/useProfile';

const Profile = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, avatarUrl, initials } = useProfile();

  const homePage = userRole === 'admin' ? 'dashboard' : userRole === 'supervisor' ? 'supervisorHome' : 'staffHome';

  const handleHome = () => {
    if (onNavigate) onNavigate(homePage);
    else if (onBack) onBack();
  };

  const handleManagers = () => onNavigate && onNavigate('users');
  const handleProducts = () => onNavigate && onNavigate('products');
  const handleStaff = () => onNavigate && onNavigate('staff');
  const handleCustomers = () => onNavigate && onNavigate('customers');
  const handleSettings = () => onNavigate && onNavigate('settings');

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleEditProfile = () => {
    if (onNavigate) onNavigate('editProfile');
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

      {/* Overlay when sidebar is open */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main */}
      <div className={`dashboard-main ${sidebarOpen ? 'shifted' : ''}`}>
        <div className="profile-container">
          {/* Header */}
          <header className="profile-header">
            <div className="header-left">
              <button className="sidebar-toggle" onClick={toggleSidebar}>
                <i className="fas fa-bars"></i>
              </button>
              <button className="back-btn" onClick={handleHome}>
                <i className="fas fa-arrow-left"></i>
              </button>
            </div>
            <div className="header-content">
              <h1 className="page-title">Profile</h1>
              <p className="page-subtitle">Manage your identity</p>
            </div>
          </header>

          {/* Content */}
          <main className="profile-content">
            {/* Profile Card */}
            <div className="profile-card admin-profile-card">
              <div className="admin-avatar-large" style={{ position: 'relative', overflow: 'hidden' }}>
                {avatarUrl ? (
                  <img 
                    src={avatarUrl}
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
                      e.target.style.display = 'none';
                      const span = e.target.nextSibling;
                      if (span) {
                        span.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <span style={{ 
                  display: avatarUrl ? 'none' : 'flex',
                  position: avatarUrl ? 'absolute' : 'relative',
                  zIndex: avatarUrl ? 0 : 1
                }}>
                  {initials}
                </span>
              </div>
              <div className="admin-info">
                <div className="admin-name">{profile.full_name || (userRole === 'supervisor' ? 'Supervisor' : 'Admin')}</div>
                <div className="admin-role-scope">{profile.role || (userRole === 'supervisor' ? 'Supervisor' : 'Super Admin')} • {profile.store_scope || 'Global Scope'}</div>
                <div className="active-badge">
                  <span className="active-dot"></span>
                  <span>Active {userRole === 'supervisor' ? 'Supervisor' : 'Admin'}</span>
                </div>
              </div>
              <button className="edit-profile-btn" onClick={handleEditProfile}>
                Edit Profile
              </button>
            </div>

            {/* Contact Information Card */}
            <div className="profile-card contact-card">
              <div className="card-header">
                <h3 className="card-title">Contact information</h3>
                <p className="card-subtitle">Keep your contact details up to date.</p>
              </div>
              <div className="contact-item">
                <i className="fas fa-envelope contact-icon"></i>
                <div className="contact-details">
                  <div className="contact-label">Email</div>
                  <div className="contact-value">{profile.email || 'admin@anithastores.com'}</div>
                </div>
              </div>
              {profile.phone && (
                <div className="contact-item">
                  <i className="fas fa-phone contact-icon"></i>
                  <div className="contact-details">
                    <div className="contact-label">Phone</div>
                    <div className="contact-value">{profile.phone}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Role & Access Card */}
            <div className="profile-card role-access-card">
              <div className="card-header">
                <h3 className="card-title">Role & access</h3>
                <p className="card-subtitle">Controls what this account can see and do.</p>
                <a href="#" className="manage-link">Manage &gt;&gt;</a>
              </div>
              <div className="role-item">
                <div className="role-label">Role</div>
                <div className="role-badge">{profile.role || 'Super Admin'}</div>
              </div>
              <div className="role-item">
                <div className="role-label">Store access</div>
                <div className="role-badge">{profile.store_scope || 'All stores • Global scope'}</div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="profile-card quick-actions-card">
              <div className="card-header">
                <h3 className="card-title">Quick actions</h3>
                <p className="card-subtitle">Frequently used profile-related shortcuts.</p>
              </div>
              <div className="action-item">
                <i className="fas fa-chart-line action-icon"></i>
                <div className="action-details">
                  <div className="action-title">View activity</div>
                  <div className="action-desc">Logins, changes & approvals</div>
                </div>
              </div>
              <div className="action-item">
                <i className="fas fa-shield-alt action-icon"></i>
                <div className="action-details">
                  <div className="action-title">Security settings</div>
                  <div className="action-desc">Password & 2FA for this profile</div>
                </div>
              </div>
              <div className="action-item">
                <i className="fas fa-bell action-icon"></i>
                <div className="action-details">
                  <div className="action-title">Notification preferences</div>
                  <div className="action-desc">Alerts for this account</div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;

