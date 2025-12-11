import React, { useState } from 'react';

const Settings = ({ onBack, onNavigate }) => {
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [twoFactorOn, setTwoFactorOn] = useState(true);
  const [appTheme, setAppTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleHome = () => {
    if (onNavigate) onNavigate('dashboard');
    else if (onBack) onBack();
  };

  const handleManagers = () => onNavigate && onNavigate('users');
  const handleProducts = () => onNavigate && onNavigate('products');
  const handleStaff = () => onNavigate && onNavigate('staff');
  const handleSettings = () => onNavigate && onNavigate('settings');

  const sections = [
    {
      title: 'ACCOUNT',
      items: [
        {
          type: 'profile',
          title: 'Admin Root',
          subtitle: 'Super Admin • Global',
          action: 'Edit Profile',
        },
      ],
    },
    {
      title: 'STORES & ROLES',
      items: [
        { type: 'link', title: 'Store Access', desc: 'Choose stores this admin can manage' },
        { type: 'link', title: 'Role Permissions', desc: 'Define access for Admin / Staff' },
      ],
    },
    {
      title: 'SECURITY',
      items: [
        { type: 'link', title: 'Change Password', desc: 'Update your admin password' },
        {
          type: 'toggle',
          title: 'Two-Factor Authentication',
          desc: 'OTP for sensitive changes',
          state: twoFactorOn,
          onToggle: () => setTwoFactorOn(!twoFactorOn),
        },
      ],
    },
    {
      title: 'APP PREFERENCES',
      items: [
        {
          type: 'toggle',
          title: 'Notifications',
          desc: 'Low stock, login & alert messages',
          state: notificationsOn,
          onToggle: () => setNotificationsOn(!notificationsOn),
        },
        {
          type: 'pill',
          title: 'App Theme',
          desc: 'Light • red & white',
          value: appTheme === 'light' ? 'Light Theme' : 'Dark Theme',
          onToggle: () => setAppTheme(appTheme === 'light' ? 'dark' : 'light'),
        },
      ],
    },
    {
      title: 'DATA & SUPPORT',
      items: [
        { type: 'link', title: 'Data & Backup', desc: 'Export or backup store data' },
      ],
    },
  ];

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
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
        <div className="nav-item active" onClick={handleSettings}>
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
        <div className="settings-container">
          {/* Header */}
          <header className="settings-header">
            <div className="header-left">
              <button className="sidebar-toggle" onClick={toggleSidebar}>
                <i className="fas fa-bars"></i>
              </button>
              <button className="back-btn" onClick={handleHome}>
                <i className="fas fa-arrow-left"></i>
              </button>
            </div>
            <div className="header-content">
              <h1 className="page-title">Settings</h1>
              <p className="page-subtitle">Control account, security & app</p>
            </div>
          </header>

          {/* Content */}
          <main className="settings-content">
            <div className="settings-tab">
              <span className="tab-dot"></span>
              <span className="tab-label">ESSENTIALS</span>
            </div>

            <div className="settings-hero">
              <h2>Essential Settings</h2>
              <p>Update profile, security and app preferences.</p>
            </div>

            {sections.map((section) => (
              <div key={section.title} className="settings-section">
                <h3 className="section-title">{section.title}</h3>
                <div className="section-list">
                  {section.items.map((item, idx) => {
                    if (item.type === 'profile') {
                      return (
                        <div key={idx} className="settings-card profile-card">
                          <div className="profile-badge">AD</div>
                          <div className="profile-info">
                            <div className="profile-name">{item.title}</div>
                            <div className="profile-role">{item.subtitle}</div>
                          </div>
                          <button className="primary-chip" onClick={() => onNavigate && onNavigate('profile')}>Edit Profile</button>
                        </div>
                      );
                    }
                    if (item.type === 'link') {
                      return (
                        <div key={idx} className="settings-card link-card">
                          <div className="card-left">
                            <span className="dot-icon"></span>
                            <div className="card-text">
                              <div className="card-title">{item.title}</div>
                              <div className="card-desc">{item.desc}</div>
                            </div>
                          </div>
                          <i className="fas fa-chevron-right chevron"></i>
                        </div>
                      );
                    }
                    if (item.type === 'toggle') {
                      return (
                        <div key={idx} className="settings-card toggle-card">
                          <div className="card-left">
                            <span className="dot-icon"></span>
                            <div className="card-text">
                              <div className="card-title">{item.title}</div>
                              <div className="card-desc">{item.desc}</div>
                            </div>
                          </div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={item.state}
                              onChange={item.onToggle}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      );
                    }
                    if (item.type === 'pill') {
                      return (
                        <div key={idx} className="settings-card pill-card">
                          <div className="card-left">
                            <span className="dot-icon"></span>
                            <div className="card-text">
                              <div className="card-title">{item.title}</div>
                              <div className="card-desc">{item.desc}</div>
                            </div>
                          </div>
                          <button className="pill-btn" onClick={item.onToggle}>
                            {item.value}
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}

            {/* Logout */}
            <div className="settings-section">
              <div className="settings-card logout-card">
                <div className="card-left">
                  <span className="dot-icon alert"></span>
                  <div className="card-text">
                    <div className="card-title">Logout of Admin Account</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right chevron"></i>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;

