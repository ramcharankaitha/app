import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useProfile } from '../hooks/useProfile';
import ConfirmDialog from './ConfirmDialog';
import AttendanceModal from './AttendanceModal';
import './attendanceModal.css';

const StaffDashboard = ({ onNavigate, onLogout, userData, currentPage }) => {
  const { profile, avatarUrl, initials } = useProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceType, setAttendanceType] = useState(null); // 'checkin' or 'checkout'
  const [attendanceStatus, setAttendanceStatus] = useState('Not checked in');
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
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

  // Fetch today's attendance status and notifications
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/attendance/today?username=${userData.username || ''}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.attendance) {
            setCheckInTime(data.attendance.check_in_time);
            setCheckOutTime(data.attendance.check_out_time);
            if (data.attendance.check_out_time) {
              setAttendanceStatus('Checked out');
            } else if (data.attendance.check_in_time) {
              setAttendanceStatus('Checked in');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
      }
    };

    const fetchNotifications = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.id) {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/notifications?userId=${userData.id}&userType=staff`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setNotifications(data.notifications || []);
              setUnreadCount(data.notifications.filter(n => !n.is_read).length);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchTodayAttendance();
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync activeNav with currentPage
  useEffect(() => {
    if (currentPage === 'staffHome') {
      setActiveNav('home');
    } else if (currentPage === 'customers') {
      setActiveNav('customers');
    } else if (currentPage === 'products') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'suppliers') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'dispatch') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'transport') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'chitPlans') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'masterMenu') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'settings') {
      setActiveNav('settings');
    }
  }, [currentPage]);

  const workingStore = useMemo(() => {
    return profile?.primary_store || 'Hyderabad Store';
  }, [profile]);

  const shiftLabel = '9:00 AM – 6:00 PM';

  const handleNavClick = (navItem, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveNav(navItem);
    if (!onNavigate) return;
    if (navItem === 'home') {
      if (currentPage !== 'staffHome') {
        onNavigate('staffHome');
      }
    } else if (navItem === 'customers') {
      onNavigate('customers');
    } else if (navItem === 'masterMenu') {
      onNavigate('masterMenu');
    } else if (navItem === 'settings') {
      onNavigate('settings');
    }
    setSidebarOpen(false);
    setMenuOpen(false);
  };

  const handleCheckIn = () => {
    setAttendanceType('checkin');
    setShowAttendanceModal(true);
  };

  const handleCheckOut = () => {
    setAttendanceType('checkout');
    setShowAttendanceModal(true);
  };

  const handleAttendanceSuccess = (type, time, warning) => {
    if (type === 'checkin') {
      setCheckInTime(time);
      setAttendanceStatus('Checked in');
    } else if (type === 'checkout') {
      setCheckOutTime(time);
      setAttendanceStatus('Checked out');
    }
    setShowAttendanceModal(false);
    setAttendanceType(null);
    
    // Refresh notifications if there's a warning
    if (warning) {
      setTimeout(() => {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.id) {
          fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/notifications?userId=${userData.id}&userType=staff`)
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.notifications.filter(n => !n.is_read).length);
              }
            })
            .catch(err => console.error('Error refreshing notifications:', err));
        }
      }, 1000);
    }
  };

  const handleAttendanceClose = () => {
    setShowAttendanceModal(false);
    setAttendanceType(null);
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
          className={`nav-item ${activeNav === 'customers' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('customers', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-user-friends"></i>
          </div>
          <span>Customers</span>
        </div>
        <div 
          className={`nav-item ${activeNav === 'masterMenu' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('masterMenu', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
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
              <h1>Staff Panel</h1>
              <p>Anitha Stores</p>
            </div>
          </div>
          <div className="header-right">
            <div className="notification-icon">
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
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
          {activeNav === 'masterMenu' ? (
            <div className="master-menu-grid">
              {[
                { title: 'Dispatch Department', desc: 'Manage dispatch workflows', icon: 'fa-shipping-fast', target: 'dispatch' },
                { title: 'Transport Master', desc: 'Transport partners & routes', icon: 'fa-truck-moving', target: 'transport' },
                { title: 'Category Master', desc: 'Organize product categories', icon: 'fa-tags', target: 'products' },
                { title: 'Products', desc: 'Catalog and pricing', icon: 'fa-box', target: 'products' },
                { title: 'Supply Master', desc: 'Suppliers and logistics', icon: 'fa-truck', target: 'suppliers' },
                { title: 'Chit Plans', desc: 'Chit plan setup & customers', icon: 'fa-file-invoice-dollar', target: 'chitPlans' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="stat-card"
                  style={{ cursor: item.target ? 'pointer' : 'default' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (item.target && onNavigate) {
                      onNavigate(item.target);
                    }
                  }}
                >
                  <div className="stat-content">
                    <h3 className="stat-title">{item.title}</h3>
                    <p className="stat-subtitle">{item.desc}</p>
                  </div>
                  <div className="stat-icon" style={{ backgroundColor: '#dc354520', color: '#dc3545' }}>
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
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

              <div className="panel checkin-card">
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
                  <div className={`status-pill ${attendanceStatus === 'Checked in' ? 'success' : attendanceStatus === 'Checked out' ? 'info' : 'danger'}`}>
                    <span className="dot"></span>
                    <span>{attendanceStatus}</span>
                  </div>
                </div>
                {checkInTime && (
                  <div className="panel-row">
                    <div className="label">Check-in time</div>
                    <div className="value">{new Date(checkInTime).toLocaleTimeString()}</div>
                  </div>
                )}
                {checkOutTime && (
                  <div className="panel-row">
                    <div className="label">Check-out time</div>
                    <div className="value">{new Date(checkOutTime).toLocaleTimeString()}</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  {!checkInTime && (
                    <button className="primary-action" onClick={handleCheckIn} style={{ flex: 1 }}>
                      Check In
                    </button>
                  )}
                  {checkInTime && !checkOutTime && (
                    <button className="primary-action" onClick={handleCheckOut} style={{ flex: 1, background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' }}>
                      Check Out
                    </button>
                  )}
                </div>
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
            {notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <i className="fas fa-bell-slash" style={{ fontSize: '24px', marginBottom: '10px', opacity: 0.5 }}></i>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className={`notif-row ${notif.notification_type === 'warning' ? 'alert' : notif.notification_type === 'success' ? 'success' : ''}`}>
                  <span className="dot"></span>
                  <div>
                    <div className="notif-title">{notif.title}</div>
                    <div className="notif-desc">{notif.message}</div>
                  </div>
                  <span className="time">{new Date(notif.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))
            )}
          </div>

              <footer className="dashboard-footer">
                <p>&copy; 2025 Anitha Stores. All rights reserved.</p>
              </footer>
            </>
          )}
        </main>
      </div>

      {showAttendanceModal && (
        <AttendanceModal
          type={attendanceType}
          onSuccess={handleAttendanceSuccess}
          onClose={handleAttendanceClose}
        />
      )}
    </div>
  );
};

export default StaffDashboard;

