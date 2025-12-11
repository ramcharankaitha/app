import React, { useState, useEffect, useRef } from 'react';

const Dashboard = ({ onLogout, onNavigate, currentPage }) => {
  const [activeScope, setActiveScope] = useState('All Stores');
  const [timeRange, setTimeRange] = useState('Live');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef(null);

  const handleNavClick = (navItem, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveNav(navItem);
    if (!onNavigate) return;
    if (navItem === 'users') {
      onNavigate('users');
    } else if (navItem === 'products') {
      onNavigate('products');
    } else if (navItem === 'staff') {
      onNavigate('staff');
    } else if (navItem === 'home' || navItem === 'stores') {
      // Only navigate if not already on dashboard
      if (currentPage !== 'dashboard') {
        onNavigate('dashboard');
      }
    } else if (navItem === 'settings') {
      onNavigate('settings');
    }
    setSidebarOpen(false);
    setMenuOpen(false);
  };

  const stats = [
    {
      title: 'Total Managers',
      value: '1,248',
      subtitle: '+32 this week',
      icon: 'fa-plus',
      color: '#dc3545'
    },
    {
      title: 'Active Stores',
      value: '18',
      subtitle: '2 in maintenance',
      icon: 'fa-store',
      color: '#dc3545'
    },
    {
      title: 'Current Products',
      value: '54',
      subtitle: 'Critical: 9 products',
      icon: 'fa-box',
      color: '#dc3545'
    },
    {
      title: "Today's Orders",
      value: '3,291',
      subtitle: '+12.4% vs yesterday',
      icon: 'fa-shopping-cart',
      color: '#dc3545'
    }
  ];

  const alerts = [
    {
      priority: 'High Priority',
      message: 'Stock below minimum (Stock-Name)',
      time: '5 min ago',
      color: '#ff6b9d'
    },
    {
      priority: 'Medium Priority',
      message: 'Unusual login attempt detected',
      time: '18 min ago',
      color: '#ffa500'
    }
  ];

  // Mock chart data for horizontal bars (12 data points for 24 hours)
  const chartData = [45, 60, 55, 70, 65, 80, 75, 90, 85, 70, 65, 75, 80, 85, 75, 70, 65, 60, 55, 50, 45, 50, 55, 60];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleMenuClick = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleMenuAction = (action) => {
    setMenuOpen(false);
    switch (action) {
      case 'profile':
        if (onNavigate) {
          onNavigate('profile');
        }
        break;
      case 'settings':
        if (onNavigate) {
          onNavigate('settings');
        }
        break;
      case 'logout':
        onLogout();
        break;
      case 'addUser':
        if (onNavigate) {
          onNavigate('addUser');
        }
        break;
      case 'addProduct':
        if (onNavigate) {
          onNavigate('addProduct');
        }
        break;
      case 'addStaff':
        if (onNavigate) {
          onNavigate('addStaff');
        }
        break;
      default:
        break;
    }
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
          className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('settings', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-cog"></i>
          </div>
          <span>Settings</span>
        </div>
      </nav>

      {/* Overlay when sidebar is open */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Content Area */}
      <div className={`dashboard-main ${sidebarOpen ? 'shifted' : ''}`}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>
          <div className="admin-icon">
            <span>A</span>
          </div>
          <div className="header-title">
            <h1>Admin Panel</h1>
            <p>Anitha Stores</p>
          </div>
        </div>
        <div className="header-right">
          <div className    ="notification-icon">
            <i className="fas fa-bell"></i>
            <span className="notification-badge">3</span>
          </div>
          <div className="menu-icon-container" ref={menuRef}>
            <div className="menu-icon" onClick={handleMenuClick}>
              <i className="fas fa-bars"></i>
            </div>
            {menuOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => handleMenuAction('profile')}>
                  <i className="fas fa-user"></i>
                  <span>Profile</span>
                </div>
                <div className="dropdown-item" onClick={() => handleMenuAction('settings')}>
                  <i className="fas fa-cog"></i>
                  <span>Settings</span>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item" onClick={() => handleMenuAction('addUser')}>
                  <i className="fas fa-user-plus"></i>
                  <span>Add Manager</span>
                </div>
                <div className="dropdown-item" onClick={() => handleMenuAction('addProduct')}>
                  <i className="fas fa-box"></i>
                  <span>Add Product</span>
                </div>
                <div className="dropdown-item" onClick={() => handleMenuAction('addStaff')}>
                  <i className="fas fa-user-tie"></i>
                  <span>Add Staff</span>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={() => handleMenuAction('logout')}>
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
        {/* Active Scope, Sales Report and Search */}
        <div className="controls-section">
          <button className="scope-button">
            <i className="fas fa-minus"></i>
            <span>Active Scope</span>
            <span className="scope-value">{activeScope}</span>
            <i className="fas fa-chevron-down"></i>
          </button>
          <button className="sales-report-button">
            Sales Report
          </button>
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search managers, products, stores..." />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-content">
                <h3 className="stat-title">{stat.title}</h3>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-subtitle">{stat.subtitle}</p>
              </div>
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
            </div>
          ))}
        </div>

        {/* Store Performance Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Store Performance</h3>
              <p>Last 24 hours across selected scope</p>
            </div>
            <div className="time-range-selector">
              <button 
                className={timeRange === 'Live' ? 'active' : ''}
                onClick={() => setTimeRange('Live')}
              >
                Live
              </button>
              <button 
                className={timeRange === '24h' ? 'active' : ''}
                onClick={() => setTimeRange('24h')}
              >
                24h
              </button>
            </div>
          </div>
          <div className="chart-container">
            <div className="chart-bars">
              {chartData.map((height, index) => (
                <div key={index} className="chart-bar">
                  <div className="bar-fill" style={{ height: `${height}%` }}></div>
                </div>
              ))}
            </div>
            <div className="chart-labels">
              <span>00</span>
              <span>06</span>
              <span>12</span>
              <span>18</span>
              <span>24</span>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="alerts-card">
          <div className="alerts-header">
            <h3>Critical Alerts</h3>
            <span className="active-alerts-badge">5 Active</span>
          </div>
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <div key={index} className="alert-item">
                <span className="alert-priority" style={{ backgroundColor: `${alert.color}20`, color: alert.color }}>
                  {alert.priority}
                </span>
                <div className="alert-content">
                  <p className="alert-message">{alert.message}</p>
                  <span className="alert-time">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
          <a href="#" className="view-all-alerts">View all alerts →</a>
        </div>

        {/* Footer */}
        <footer className="dashboard-footer">
          <p>&copy; 2025 Anitha Stores. All rights reserved.</p>
        </footer>
      </main>
      </div>
    </div>
  );
};

export default Dashboard;

