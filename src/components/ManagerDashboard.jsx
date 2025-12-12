import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useProfile } from '../hooks/useProfile';
import ConfirmDialog from './ConfirmDialog';

const ManagerDashboard = ({ onNavigate, onLogout, userData, currentPage }) => {
  const { profile, avatarUrl, initials } = useProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Sync activeNav with currentPage
  useEffect(() => {
    if (currentPage === 'managerHome') {
      setActiveNav('home');
    } else if (currentPage === 'users') {
      setActiveNav('users');
    } else if (currentPage === 'products') {
      setActiveNav('products');
    } else if (currentPage === 'staff') {
      setActiveNav('staff');
    } else if (currentPage === 'customers') {
      setActiveNav('customers');
    } else if (currentPage === 'suppliers') {
      setActiveNav('suppliers');
    } else if (currentPage === 'chitPlans') {
      setActiveNav('chitPlans');
    } else if (currentPage === 'settings') {
      setActiveNav('settings');
    }
  }, [currentPage]);

  const workingStore = useMemo(() => {
    return profile?.primary_store || 'Hyderabad Store';
  }, [profile]);

  const shiftLabel = '9:00 AM – 6:00 PM';
  const currentStatus = 'Not checked in';

  const handleNavClick = (navItem, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveNav(navItem);
    if (!onNavigate) return;
    if (navItem === 'home' || navItem === 'stores') {
      // Only navigate if not already on managerHome
      if (currentPage !== 'managerHome') {
        onNavigate('managerHome');
      }
    } else if (navItem === 'users') {
      onNavigate('users');
    } else if (navItem === 'products') {
      onNavigate('products');
    } else if (navItem === 'staff') {
      onNavigate('staff');
    } else if (navItem === 'customers') {
      onNavigate('customers');
    } else if (navItem === 'suppliers') {
      onNavigate('suppliers');
    } else if (navItem === 'chitPlans') {
      onNavigate('chitPlans');
    } else if (navItem === 'settings') {
      onNavigate('settings');
    }
    setSidebarOpen(false);
    setMenuOpen(false);
  };

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Navigation */}
      <nav className={`sidebar-nav ${sidebarOpen ? 'open' : ''}`}>
        <div 
          className={`nav-item ${activeNav === 'home' ? 'active' : ''}`}
          onClick={(e) => handleNavClick('home', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
        </div>
        <div 
          className={`nav-item ${activeNav === 'users' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('users', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-users"></i>
          </div>
          <span>Managers</span>
        </div>
        <div 
          className={`nav-item ${activeNav === 'products' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('products', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-box"></i>
          </div>
          <span>Products</span>
        </div>
        <div 
          className={`nav-item ${activeNav === 'stores' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('stores', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-store"></i>
          </div>
          <span>Stores</span>
        </div>
        <div 
          className={`nav-item ${activeNav === 'staff' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('staff', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
        </div>
        <div 
          className={`nav-item ${activeNav === 'customers' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('customers', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-user-friends"></i>
          </div>
          <span>Customers</span>
        </div>
        <div 
          className={`nav-item ${activeNav === 'suppliers' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('suppliers', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-truck"></i>
          </div>
          <span>Supply Master</span>
        </div>
        <div 
          className={`nav-item ${activeNav === 'chitPlans' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('chitPlans', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-file-invoice-dollar"></i>
          </div>
          <span>Chit Plan</span>
        </div>
        <div 
          className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('settings', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-cog"></i>
          </div>
          <span>Settings</span>
        </div>
      </nav>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main */}
      <div className={`dashboard-main ${sidebarOpen ? 'shifted' : ''}`}>
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen((p) => !p)}>
              <i className="fas fa-bars"></i>
            </button>
            <div className="admin-icon" style={{ position: 'relative', overflow: 'hidden' }}>
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
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const span = e.target.nextSibling;
                    if (span) span.style.display = 'flex';
                  }}
                />
              ) : null}
              <span
                style={{
                  display: avatarUrl ? 'none' : 'flex',
                  position: avatarUrl ? 'absolute' : 'relative',
                  zIndex: avatarUrl ? 0 : 1,
                }}
              >
                {initials}
              </span>
            </div>
            <div className="header-title">
              <h1>Manager Panel</h1>
              <p>Anitha Stores</p>
            </div>
          </div>
          <div className="header-right">
            <div className="notification-icon">
              <i className="fas fa-bell"></i>
              <span className="notification-badge">3</span>
            </div>
            <div className="menu-icon-container" ref={menuRef}>
              <div className="menu-icon" onClick={() => setMenuOpen((p) => !p)}>
                <i className="fas fa-bars"></i>
              </div>
              {menuOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => handleNavClick('settings')}>
                    <i className="fas fa-cog"></i>
                    <span>Settings</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item logout" onClick={onLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="dashboard-content">
          <div className="controls-section">
            <div className="scope-button">
              <i className="fas fa-store"></i>
              <span>Working at</span>
              <span className="scope-value">{workingStore}</span>
            </div>
            <div className="sales-report-button" style={{ background: 'var(--card-bg)', color: 'var(--text-primary)', boxShadow: '0 2px 4px var(--shadow-light)', border: '1px solid var(--border-color)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span className="shift-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#35c759' }}></span>
                Shift {shiftLabel}
              </span>
            </div>
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Search tasks, products, inventory..." />
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Check-in / Check-out</div>
                <div className="panel-subtitle">Use face recognition to log your working hours.</div>
              </div>
              <div className="status-face">
                <i className="fas fa-smile"></i>
              </div>
            </div>
            <div className="panel-row">
              <div className="label">Current status</div>
              <div className="status-pill danger">
                <span className="dot"></span>
                <span>{currentStatus}</span>
              </div>
            </div>
            <button className="primary-action">Open Face Recognition</button>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
            <div className="stat-card">
              <div className="stat-content">
                <h3 className="stat-title">Assigned Tasks</h3>
                <p className="stat-value">4 open</p>
                <p className="stat-subtitle">View and update your work</p>
              </div>
              <div className="stat-icon" style={{ backgroundColor: '#4caf5020', color: '#4caf50' }}>
                <i className="fas fa-check"></i>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3 className="stat-title">Update Stock</h3>
                <p className="stat-value">Tap to update</p>
                <p className="stat-subtitle">Adjust quantities with log</p>
              </div>
              <div className="stat-icon" style={{ backgroundColor: '#8c2f2f20', color: '#8c2f2f' }}>
                <i className="fas fa-edit"></i>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3 className="stat-title">Report Damage</h3>
                <p className="stat-value">Log items</p>
                <p className="stat-subtitle">Reason with evidence</p>
              </div>
              <div className="stat-icon" style={{ backgroundColor: '#dc354520', color: '#dc3545' }}>
                <i className="fas fa-exclamation"></i>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3 className="stat-title">Check Inventory</h3>
                <p className="stat-value">View-only list</p>
                <p className="stat-subtitle">Stay updated</p>
              </div>
              <div className="stat-icon" style={{ backgroundColor: '#99999920', color: '#666' }}>
                <i className="fas fa-list"></i>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Notifications</div>
              <button className="link-btn" onClick={() => handleNavClick('notifications')}>View all</button>
            </div>
            <div className="notif-row alert">
              <span className="dot"></span>
              <div>
                <div className="notif-title">Warning: Check-in after allowed time</div>
                <div className="notif-desc">Manager &amp; Admin notified</div>
              </div>
              <span className="time">5 min ago</span>
            </div>
            <div className="notif-row success">
              <span className="dot"></span>
              <div>
                <div className="notif-title">New task assigned by Manager</div>
                <div className="notif-desc">Tap to open Assigned Tasks</div>
              </div>
              <span className="time">20 min</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManagerDashboard;

