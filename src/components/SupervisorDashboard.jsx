import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useProfile } from '../hooks/useProfile';
import ConfirmDialog from './ConfirmDialog';
import StaffAttendanceView from './StaffAttendanceView';
import AttendanceModal from './AttendanceModal';
import BestSalesPerson from './BestSalesPerson';
import NotificationsPanel from './NotificationsPanel';
import './attendanceModal.css';

const SupervisorDashboard = ({ onNavigate, onLogout, userData, currentPage }) => {
  const { profile, avatarUrl, initials } = useProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAttendanceView, setShowAttendanceView] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceType, setAttendanceType] = useState(null); // 'checkin' or 'checkout'
  const [attendanceStatus, setAttendanceStatus] = useState('Not checked in');
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
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
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/supervisor-attendance/today?username=${userData.username || ''}`, {
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
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/notifications?userId=${userData.id}&userType=supervisor`, {
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
    
    // Listen for notification updates
    const handleNotificationUpdate = () => {
      console.log('🔔 Supervisor: Notification update event received, refreshing...');
      fetchNotifications();
    };
    window.addEventListener('notificationsUpdated', handleNotificationUpdate);
    window.addEventListener('notificationSent', handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationsUpdated', handleNotificationUpdate);
      window.removeEventListener('notificationSent', handleNotificationUpdate);
    };
  }, []);

  // Sync activeNav with currentPage
  useEffect(() => {
    if (currentPage === 'supervisorHome') {
      setActiveNav('home');
    } else if (currentPage === 'staff') {
      setActiveNav('staff');
    } else if (currentPage === 'customers') {
      setActiveNav('customers');
    } else if (currentPage === 'products') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'suppliers') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'dispatch') {
      setActiveNav('transactionMenu');
    } else if (currentPage === 'transport') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'chitPlans' || currentPage === 'addChitCustomer' || currentPage === 'chitPlanMaster' || currentPage === 'addChitPlan') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'categoryMaster') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'masterMenu') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'transactionMenu' || currentPage === 'stockIn' || currentPage === 'stockOut' || currentPage === 'createSupplier' || currentPage === 'supplierTransactionMaster' || currentPage === 'transactionProducts' || currentPage === 'addProductPricing') {
      setActiveNav('transactionMenu');
    } else if (currentPage === 'settings') {
      setActiveNav('settings');
    }
  }, [currentPage]);

  const workingStore = useMemo(() => {
    return profile?.primary_store || 'Hyderabad Store';
  }, [profile]);

  const shiftLabel = '9:00 AM – 6:00 PM';

  const handleCheckIn = () => {
    setAttendanceType('checkin');
    setShowAttendanceModal(true);
  };

  const handleCheckOut = () => {
    setAttendanceType('checkout');
    setShowAttendanceModal(true);
  };

  const handleAttendanceSuccess = (type, time, message, warning) => {
    if (type === 'checkin') {
      setCheckInTime(time);
      setAttendanceStatus('Checked in');
    } else if (type === 'checkout') {
      setCheckOutTime(time);
      setAttendanceStatus('Checked out');
    }
    setShowAttendanceModal(false);
    setAttendanceType(null);
    
    // Display success message in-app
    setSuccessMessage(message || `${type === 'checkin' ? 'Checked in' : 'Checked out'} successfully`);
    if (warning) {
      setWarningMessage(warning);
    }
    
    // Auto-hide messages after 5 seconds
    setTimeout(() => {
      setSuccessMessage('');
      setWarningMessage('');
    }, 5000);
    
    // Refresh notifications if there's a warning
    if (warning) {
      setTimeout(() => {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.id) {
          fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/notifications?userId=${userData.id}&userType=supervisor`)
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

  const handleNavClick = (navItem, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveNav(navItem);
    if (!onNavigate) return;
    if (navItem === 'home') {
      onNavigate('supervisorHome');
    } else if (navItem === 'staff') {
      onNavigate('staff');
    } else if (navItem === 'customers') {
      onNavigate('customers');
    } else if (navItem === 'masterMenu') {
      // Handle masterMenu as internal state, don't navigate away
      // Just update the activeNav state, which is already done above
    } else if (navItem === 'transactionMenu') {
      // Handle transactionMenu as internal state, don't navigate away
      // Just update the activeNav state, which is already done above
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
          className={`nav-item ${activeNav === 'staff' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('staff', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
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
          className={`nav-item ${activeNav === 'transactionMenu' ? 'active' : ''}`} 
          onClick={(e) => handleNavClick('transactionMenu', e)}
        >
          <div className="nav-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span>Transaction</span>
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
              <h1>Supervisor Panel</h1>
              <p>Anitha Stores</p>
            </div>
          </div>
          <div className="header-right">
            <div 
              className="notification-icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔔 Supervisor: Bell clicked, opening notifications panel');
                setShowNotificationsPanel(true);
              }}
              style={{ cursor: 'pointer', position: 'relative', zIndex: 10 }}
              title="View Notifications"
            >
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
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
                { title: 'Transport Master', desc: 'Transport partners & routes', icon: 'fa-truck-moving', target: 'transport' },
                { title: 'Category Master', desc: 'Organize product categories', icon: 'fa-tags', target: 'categoryMaster' },
                { title: 'Products', desc: 'Catalog and pricing', icon: 'fa-box', target: 'products' },
                { title: 'Supply Master', desc: 'Suppliers and logistics', icon: 'fa-truck', target: 'suppliers' },
                { title: 'Customers', desc: 'Customer management & details', icon: 'fa-user-friends', target: 'customers' },
                { title: 'Chit Plan Master', desc: 'Create and manage chit plans', icon: 'fa-file-invoice-dollar', target: 'chitPlanMaster' },
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
          ) : activeNav === 'transactionMenu' ? (
            <div className="master-menu-grid">
              {[
                { title: 'Dispatch Department', desc: 'Manage dispatch workflows', icon: 'fa-shipping-fast', target: 'dispatch' },
                { title: 'Stock In', desc: 'Record stock entries', icon: 'fa-box-open', target: 'stockInMaster' },
                { title: 'Stock Out', desc: 'Record stock exits', icon: 'fa-box', target: 'stockOutMaster' },
                { title: 'Services', desc: 'Manage service transactions', icon: 'fa-cog', target: 'services' },
                { title: 'Sales Order', desc: 'View and manage sales orders', icon: 'fa-chart-line', target: 'salesOrder' },
                { title: 'Chit Receipt', desc: 'Record chit payments', icon: 'fa-file-invoice-dollar', target: 'chitEntryMaster' },
                { title: 'Purchase Order', desc: 'Create and manage purchase orders', icon: 'fa-shopping-cart', target: 'purchaseOrderMaster' },
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

          <div className="panel checkin-card" style={{ marginBottom: '24px' }}>
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
              <div className={`status-pill ${attendanceStatus === 'Checked out' ? 'success' : attendanceStatus === 'Checked in' ? 'warning' : 'danger'}`}>
                <span className="dot"></span>
                <span>{attendanceStatus}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {!checkInTime ? (
                <button className="primary-action" onClick={handleCheckIn}>
                  <i className="fas fa-sign-in-alt"></i> Check In
                </button>
              ) : !checkOutTime ? (
                <button className="primary-action" onClick={handleCheckOut}>
                  <i className="fas fa-sign-out-alt"></i> Check Out
                </button>
              ) : (
                <button className="primary-action" disabled style={{ opacity: 0.6 }}>
                  <i className="fas fa-check-circle"></i> Completed
                </button>
              )}
            </div>
          </div>

          {/* Best Sales Person of the Month */}
          <BestSalesPerson />

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))', marginTop: '24px', gap: '16px' }}>
            <div 
              className="stat-card" 
              onClick={() => {
                if (onNavigate) {
                  onNavigate('products');
                }
              }} 
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-content">
                <h3 className="stat-title">Check Inventory</h3>
                <p className="stat-value">View-only list</p>
                <p className="stat-subtitle">Stay updated</p>
              </div>
              <div className="stat-icon" style={{ backgroundColor: '#99999920', color: '#666' }}>
                <i className="fas fa-list"></i>
              </div>
            </div>
            <div className="stat-card" onClick={() => setShowAttendanceView(true)} style={{ cursor: 'pointer' }}>
              <div className="stat-content">
                <h3 className="stat-title">Staff Attendance</h3>
                <p className="stat-value">View today</p>
                <p className="stat-subtitle">Check all staff attendance</p>
              </div>
              <div className="stat-icon" style={{ backgroundColor: '#2196F320', color: '#2196F3' }}>
                <i className="fas fa-calendar-check"></i>
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
                <div className="notif-desc">Supervisor team notified</div>
              </div>
              <span className="time">5 min ago</span>
            </div>
            <div className="notif-row success">
              <span className="dot"></span>
              <div>
                <div className="notif-title">New task assigned by Supervisor</div>
                <div className="notif-desc">Tap to open Assigned Tasks</div>
              </div>
              <span className="time">20 min</span>
            </div>
          </div>

              <footer className="dashboard-footer">
                <p>&copy; 2025 Anitha Stores. All rights reserved.</p>
              </footer>
            </>
          )}
        </main>
      </div>

      {showAttendanceView && (
        <StaffAttendanceView onClose={() => setShowAttendanceView(false)} />
      )}

      {showAttendanceModal && (
        <AttendanceModal
          type={attendanceType}
          onSuccess={handleAttendanceSuccess}
          onClose={() => {
            setShowAttendanceModal(false);
            setAttendanceType(null);
          }}
          userRole="supervisor"
        />
      )}

      {showNotificationsPanel && userData?.id && (
        <NotificationsPanel
          onClose={() => setShowNotificationsPanel(false)}
          userId={userData.id}
          userType="supervisor"
        />
      )}

      {/* Success/Warning Messages */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#d4edda',
          color: '#155724',
          padding: '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '400px'
        }}>
          <i className="fas fa-check-circle"></i>
          <span>{successMessage}</span>
        </div>
      )}

      {warningMessage && (
        <div style={{
          position: 'fixed',
          top: successMessage ? '80px' : '20px',
          right: '20px',
          background: '#fff3cd',
          color: '#856404',
          padding: '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '400px'
        }}>
          <i className="fas fa-exclamation-triangle"></i>
          <span>{warningMessage}</span>
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;


