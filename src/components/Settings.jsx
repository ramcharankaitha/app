import React, { useState, useMemo } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../contexts/ThemeContext';
import { exportAPI } from '../services/api';
import StoreAccess from './StoreAccess';
import RolePermissions from './RolePermissions';
import ConfirmDialog from './ConfirmDialog';
import { downloadCSV } from '../utils/fileDownload';

const Settings = ({ onBack, onNavigate, onLogout, userRole = 'admin' }) => {
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [twoFactorOn, setTwoFactorOn] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStoreAccess, setShowStoreAccess] = useState(false);
  const [showRolePermissions, setShowRolePermissions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutSecondConfirm, setShowLogoutSecondConfirm] = useState(false);
  const { profile, avatarUrl, initials, refreshProfile } = useProfile();
  const { theme, toggleTheme, isDark } = useTheme();

  const homePage = userRole === 'admin' ? 'dashboard' : userRole === 'supervisor' ? 'supervisorHome' : 'staffHome';
  const handleHome = () => {
    if (onNavigate) onNavigate(homePage);
    else if (onBack) onBack();
  };

  const handleManagers = () => onNavigate && onNavigate('users');
  const handleStaff = () => onNavigate && onNavigate('staff');
  const handleCustomers = () => onNavigate && onNavigate('customers');
  const handleMasterMenu = () => onNavigate && onNavigate('dashboard');
  const handleSettings = () => onNavigate && onNavigate('settings');

  const displayName = profile.full_name || (userRole === 'supervisor' ? 'Supervisor Account' : userRole === 'staff' ? 'Staff Account' : 'Admin Root');
  const displayRole = profile.role || (userRole === 'supervisor' ? 'Supervisor' : userRole === 'staff' ? 'Staff' : 'Super Admin');

  const sections = useMemo(() => [
    {
      title: 'ACCOUNT',
      items: [
        {
          type: 'profile',
          title: displayName,
          subtitle: `${displayRole} • ${profile.store_scope || 'Global'}`,
          action: 'Edit Profile',
        },
      ],
    },
    {
      title: 'STORES & ROLES',
      items: [
        { type: 'link', title: 'Store Access', desc: `Choose stores this ${userRole === 'supervisor' ? 'supervisor' : userRole === 'staff' ? 'staff' : 'admin'} can manage` },
        { type: 'link', title: 'Role Permissions', desc: `Define access for ${userRole === 'supervisor' ? 'Supervisor / Staff' : userRole === 'staff' ? 'Staff' : 'Admin / Staff'}` },
      ],
    },
    {
      title: 'SECURITY',
      items: [
        { type: 'link', title: 'Change Password', desc: 'Update your password' },
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
          desc: isDark ? 'Dark mode • Easy on the eyes' : 'Light mode • red & white',
          value: isDark ? 'Dark Theme' : 'Light Theme',
          onToggle: toggleTheme,
        },
      ],
    },
    {
      title: 'DATA & SUPPORT',
      items: [
        { type: 'link', title: 'Data & Backup', desc: 'Export or backup store data' },
      ],
    },
  ], [profile, displayName, displayRole, userRole, notificationsOn, isDark, twoFactorOn]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Convert array of objects to CSV
  const convertToCSV = (data, headers) => {
    if (!data || data.length === 0) {
      return headers.join(',') + '\n(No data)\n';
    }

    // Create CSV header row
    const csvRows = [headers.join(',')];

    // Create CSV data rows
    data.forEach(row => {
      const values = headers.map(header => {
        let value = row[header];
        
        // Handle null/undefined values
        if (value === null || value === undefined) {
          value = '';
        }
        
        // Convert to string
        value = String(value);
        
        // Escape commas, quotes, and newlines in values
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  };

  // Download CSV file is now imported from utils/fileDownload.js

  // Handle data export
  const handleExportData = async () => {
    setShowExportConfirm(false);
    setIsExporting(true);
    setExportMessage('');

    try {
      // Fetch all data
      const response = await exportAPI.getAll();

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch data for export');
      }

      const { users, staff, products, stores } = response.data;

      // Prepare CSV content with multiple sheets (we'll combine them)
      let csvContent = '';

      // Add Users section
      csvContent += '=== USERS/MANAGERS ===\n';
      csvContent += convertToCSV(users, [
        'id', 'first_name', 'last_name', 'email', 'username', 'role', 
        'store_allocated', 'address', 'phone', 'created_at', 'updated_at'
      ]);
      csvContent += '\n\n';

      // Add Staff section
      csvContent += '=== STAFF ===\n';
      csvContent += convertToCSV(staff, [
        'id', 'full_name', 'email', 'username', 'role', 
        'store_allocated', 'address', 'phone', 'created_at', 'updated_at'
      ]);
      csvContent += '\n\n';

      // Add Products section
      csvContent += '=== PRODUCTS ===\n';
      csvContent += convertToCSV(products, [
        'id', 'product_name', 'item_code', 'sku_code', 'minimum_quantity', 
        'current_quantity', 'category', 'store_id', 'status', 'image_url', 
        'created_at', 'updated_at'
      ]);
      csvContent += '\n\n';

      // Add Stores section
      csvContent += '=== STORES ===\n';
      csvContent += convertToCSV(stores, [
        'id', 'store_name', 'store_code', 'address', 'city', 'state', 
        'pincode', 'phone', 'email', 'status', 'created_at', 'updated_at'
      ]);
      csvContent += '\n\n';

      // Add export metadata
      csvContent += `=== EXPORT INFORMATION ===\n`;
      csvContent += `Export Date,${new Date().toLocaleString()}\n`;
      csvContent += `Total Users,${users.length}\n`;
      csvContent += `Total Staff,${staff.length}\n`;
      csvContent += `Total Products,${products.length}\n`;
      csvContent += `Total Stores,${stores.length}\n`;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `anitha_stores_export_${timestamp}.csv`;

      // Download the file (async for mobile compatibility)
      await downloadCSV(csvContent, filename);

      setExportMessage('Data exported successfully!');
      setTimeout(() => {
        setExportMessage('');
      }, 3000);

    } catch (error) {
      console.error('Export error:', error);
      setExportMessage(`Export failed: ${error.message}`);
      setTimeout(() => {
        setExportMessage('');
      }, 5000);
    } finally {
      setIsExporting(false);
    }
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
        {userRole === 'admin' && (
          <div className="nav-item" onClick={handleManagers}>
            <div className="nav-icon">
              <i className="fas fa-users"></i>
            </div>
            <span>Supervisors</span>
          </div>
        )}
        {userRole !== 'staff' && (
          <div className="nav-item" onClick={handleStaff}>
            <div className="nav-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <span>Staff</span>
          </div>
        )}
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

            {/* Export Message */}
            {exportMessage && (
              <div style={{ 
                padding: '12px', 
                background: exportMessage.includes('successfully') ? '#d4edda' : '#ffe0e0', 
                color: exportMessage.includes('successfully') ? '#155724' : '#dc3545', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                <i className={`fas ${exportMessage.includes('successfully') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i> {exportMessage}
              </div>
            )}

            {sections.map((section) => (
              <div key={section.title} className="settings-section">
                <h3 className="section-title">{section.title}</h3>
                <div className="section-list">
                  {section.items.map((item, idx) => {
                    if (item.type === 'profile') {
                      return (
                        <div key={idx} className="settings-card profile-card">
                          <div className="profile-badge" style={{ position: 'relative', overflow: 'hidden' }}>
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
                          <div className="profile-info">
                            <div className="profile-name">{item.title}</div>
                            <div className="profile-role">{item.subtitle}</div>
                          </div>
                          <button className="primary-chip" onClick={() => onNavigate && onNavigate('profile')}>Edit Profile</button>
                        </div>
                      );
                    }
                    if (item.type === 'link') {
                      const handleLinkClick = () => {
                        if (item.title === 'Store Access') {
                          setShowStoreAccess(true);
                        } else if (item.title === 'Role Permissions') {
                          setShowRolePermissions(true);
                        } else if (item.title === 'Change Password') {
                          // Navigate to edit profile for password change
                          if (onNavigate) onNavigate('editProfile');
                        } else if (item.title === 'Data & Backup') {
                          setShowExportConfirm(true);
                        }
                      };
                      
                      return (
                        <div 
                          key={idx} 
                          className="settings-card link-card"
                          onClick={handleLinkClick}
                          style={{ cursor: 'pointer' }}
                        >
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
              <div 
                className="settings-card logout-card"
                onClick={() => setShowLogoutConfirm(true)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-left">
                  <span className="dot-icon alert"></span>
                  <div className="card-text">
                    <div className="card-title">Logout of {userRole === 'supervisor' ? 'Supervisor' : userRole === 'staff' ? 'Staff' : 'Admin'} Account</div>
                    <div className="card-desc">Sign out from your {userRole === 'supervisor' ? 'supervisor' : userRole === 'staff' ? 'staff' : 'admin'} account</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right chevron"></i>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Store Access Modal */}
      {showStoreAccess && (
        <StoreAccess
          onClose={() => {
            setShowStoreAccess(false);
            refreshProfile(); // Refresh profile to show updated store scope
          }}
          onNavigate={onNavigate}
          onProfileUpdate={refreshProfile}
        />
      )}

      {/* Role Permissions Modal */}
      {showRolePermissions && (
        <RolePermissions
          onClose={() => setShowRolePermissions(false)}
          onNavigate={onNavigate}
        />
      )}

      {/* Export Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showExportConfirm}
        title="Export Data"
        message="Are you sure you want to export all data? This will download a CSV file containing all staff, users, products, and stores."
        confirmText="Yes, Export"
        cancelText="Cancel"
        onConfirm={handleExportData}
        onCancel={() => setShowExportConfirm(false)}
      />

      {/* First Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message={`Are you sure you want to logout from your ${userRole === 'supervisor' ? 'supervisor' : userRole === 'staff' ? 'staff' : 'admin'} account? You will need to sign in again to access the system.`}
        confirmText="Yes, Logout"
        cancelText="Cancel"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          // Show second confirmation
          setShowLogoutSecondConfirm(true);
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Second Logout Confirmation Dialog (Double Verification) */}
      <ConfirmDialog
        isOpen={showLogoutSecondConfirm}
        title="Final Confirmation"
        message="This is your final confirmation. Are you absolutely sure you want to logout? All unsaved changes will be lost."
        confirmText="Yes, Logout Now"
        cancelText="Cancel"
        onConfirm={() => {
          setShowLogoutSecondConfirm(false);
          // Perform logout
          if (onLogout) {
            onLogout();
          }
        }}
        onCancel={() => setShowLogoutSecondConfirm(false)}
      />
    </div>
  );
};

export default Settings;

