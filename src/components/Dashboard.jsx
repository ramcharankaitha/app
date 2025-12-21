import React, { useState, useEffect, useRef } from 'react';
import { useProfile } from '../hooks/useProfile';
import { profileAPI, exportAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import SupervisorAttendanceView from './SupervisorAttendanceView';

const Dashboard = ({ onLogout, onNavigate, currentPage }) => {
  const [activeScope, setActiveScope] = useState('All stores • Global scope');
  const [timeRange, setTimeRange] = useState('Live');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const [scopeMessage, setScopeMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [isExportingSales, setIsExportingSales] = useState(false);
  const [showSupervisorAttendance, setShowSupervisorAttendance] = useState(false);
  const menuRef = useRef(null);
  const { profile, avatarUrl, initials } = useProfile();

  const handleNavClick = (navItem, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveNav(navItem);
    if (!onNavigate) return;
    if (navItem === 'users') {
      onNavigate('users');
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
    } else if (navItem === 'home') {
      // Reset to home view
      setActiveNav('home');
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
      title: 'Total Supervisors',
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

  // Convert sales data to CSV
  const convertSalesToCSV = (sales) => {
    if (!sales || sales.length === 0) {
      return 'No sales data available\n';
    }

    // CSV Headers
    const headers = [
      'Sale ID',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Customer Address',
      'Item Code',
      'Product Name',
      'Quantity',
      'MRP',
      'Discount',
      'Sell Rate',
      'Total Amount',
      'Payment Mode',
      'Sale Date'
    ];

    const csvRows = [headers.join(',')];

    // Add data rows
    sales.forEach(sale => {
      const row = [
        sale.id || '',
        sale.customer_name || '',
        sale.customer_email || '',
        sale.customer_phone || '',
        (sale.customer_address || '').replace(/,/g, ';'), // Replace commas in address
        sale.item_code || '',
        (sale.product_name || '').replace(/,/g, ';'),
        sale.quantity || 0,
        sale.mrp || 0,
        sale.discount || 0,
        sale.sell_rate || 0,
        sale.total_amount || 0,
        sale.payment_mode || '',
        sale.sale_date ? new Date(sale.sale_date).toLocaleString() : ''
      ];
      
      // Escape values that contain commas or quotes
      const escapedRow = row.map(value => {
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      
      csvRows.push(escapedRow.join(','));
    });

    return csvRows.join('\n');
  };

  // Download CSV file
  const downloadCSV = (csvContent, filename) => {
    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle sales report export
  const handleSalesReport = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Sales Report button clicked');
    setConfirmState({
      open: true,
      message: 'Are you sure you want to export the sales report?',
      onConfirm: async () => {
        setConfirmState({ open: false, message: '', onConfirm: null });
        setIsExportingSales(true);
        
        try {
          console.log('Fetching sales data...');
          const response = await exportAPI.getSales();
          console.log('Sales data response:', response);
          
          if (response.success && response.sales) {
            const csvContent = convertSalesToCSV(response.sales);
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `sales_report_${timestamp}.csv`;
            
            downloadCSV(csvContent, filename);
            
            // Show success message
            setScopeMessage('Sales report downloaded successfully!');
            setTimeout(() => setScopeMessage(''), 3000);
          } else {
            setScopeMessage('No sales data available to export.');
            setTimeout(() => setScopeMessage(''), 3000);
          }
        } catch (error) {
          console.error('Export sales error:', error);
          setScopeMessage('Failed to export sales report. Please try again.');
          setTimeout(() => setScopeMessage(''), 3000);
        } finally {
          setIsExportingSales(false);
        }
      }
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setScopeMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Sync active scope with profile
  useEffect(() => {
    if (profile?.store_scope) {
      setActiveScope(profile.store_scope);
    }
  }, [profile]);

  // Sync activeNav with currentPage - ensures navigation state persists
  useEffect(() => {
    if (currentPage === 'dashboard') {
      setActiveNav('home');
    } else if (currentPage === 'users') {
      setActiveNav('users');
    } else if (currentPage === 'products') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'staff') {
      setActiveNav('staff');
    } else if (currentPage === 'customers') {
      setActiveNav('customers');
    } else if (currentPage === 'suppliers') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'chitPlans') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'masterMenu') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'settings') {
      setActiveNav('settings');
    }
  }, [currentPage]);

  // Sync activeNav with currentPage
  useEffect(() => {
    if (currentPage === 'dashboard') {
      setActiveNav('home');
    } else if (currentPage === 'users') {
      setActiveNav('users');
    } else if (currentPage === 'products') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'staff') {
      setActiveNav('staff');
    } else if (currentPage === 'customers') {
      setActiveNav('customers');
    } else if (currentPage === 'suppliers') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'dispatch') {
      setActiveNav('transactionMenu');
    } else if (currentPage === 'transport') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'chitPlans') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'categoryMaster') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'masterMenu') {
      setActiveNav('masterMenu');
    } else if (currentPage === 'transactionMenu' || currentPage === 'stockIn' || currentPage === 'stockOut' || currentPage === 'createSupplier') {
      setActiveNav('transactionMenu');
    } else if (currentPage === 'settings') {
      setActiveNav('settings');
    }
  }, [currentPage]);

  const parseSelectedStores = () => {
    if (!profile || !profile.selected_stores) return [];
    try {
      const parsed = JSON.parse(profile.selected_stores);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const handleScopeSelect = (scopeKey) => {
    const selectedStores = parseSelectedStores();
    if (scopeKey === 'selected' && selectedStores.length === 0) {
      setScopeMessage('No selected stores found. Please choose stores in Store Access.');
      setTimeout(() => setScopeMessage(''), 3000);
      setScopeMenuOpen(false);
      return;
    }

    const newScope =
      scopeKey === 'all'
        ? 'All stores • Global scope'
        : profile.store_scope || 'Selected stores';

    setConfirmState({
      open: true,
      message:
        scopeKey === 'all'
          ? 'Switch active scope to all stores?'
          : 'Switch active scope to selected stores?',
      onConfirm: async () => {
        setConfirmState({ open: false, message: '', onConfirm: null });
        setScopeMenuOpen(false);
        setScopeMessage('');
        setActiveScope(newScope);
        try {
          const payload = {
            storeScope: newScope,
            selectedStores: scopeKey === 'all' ? [] : selectedStores,
          };
          await profileAPI.update(payload);
          setScopeMessage('Active scope updated');
          setTimeout(() => setScopeMessage(''), 3000);
        } catch (err) {
          console.error('Scope update error:', err);
          setScopeMessage(err.message || 'Failed to update scope');
          setTimeout(() => setScopeMessage(''), 3000);
        }
      },
    });
  };

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

  const masterSections = [
    { title: 'Dispatch Department', desc: 'Manage dispatch workflows', icon: 'fa-shipping-fast', target: 'dispatch' },
    { title: 'Transport Master', desc: 'Transport partners & routes', icon: 'fa-truck-moving', target: 'transport' },
    { title: 'Category Master', desc: 'Organize product categories', icon: 'fa-tags', target: 'categoryMaster' },
    { title: 'Products', desc: 'Catalog and pricing', icon: 'fa-box', target: 'products' },
    { title: 'Supply Master', desc: 'Suppliers and logistics', icon: 'fa-truck', target: 'suppliers' },
    { title: 'Chit Plans', desc: 'Chit plan setup & customers', icon: 'fa-file-invoice-dollar', target: 'chitPlans' },
  ];

  const transactionSections = [
    { title: 'Dispatch Department', desc: 'Manage dispatch workflows', icon: 'fa-shipping-fast', target: 'dispatch' },
    { title: 'Stock In', desc: 'Record stock entries', icon: 'fa-box-open', target: 'stockIn' },
    { title: 'Stock Out', desc: 'Record stock exits', icon: 'fa-box', target: 'stockOut' },
    { title: 'Create Supplier', desc: 'Record products from supplier', icon: 'fa-truck', target: 'createSupplier' },
  ];

  const renderContent = () => {
    if (activeNav === 'masterMenu') {
      return (
        <div className="master-menu-grid">
          {masterSections.map((item) => (
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
      );
    }

    if (activeNav === 'transactionMenu') {
      return (
        <div className="master-menu-grid">
          {transactionSections.map((item) => (
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
      );
    }

    return (
      <>
        {/* Active Scope, Sales Report and Search */}
        <div className="controls-section">
          <div className="scope-button" onClick={() => setScopeMenuOpen((prev) => !prev)}>
            <i className="fas fa-minus"></i>
            <span>Active Scope</span>
            <span className="scope-value">{activeScope}</span>
            <i className="fas fa-chevron-down"></i>
            {scopeMenuOpen && (
              <div className="scope-dropdown">
                <div
                  className="scope-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScopeSelect('all');
                  }}
                >
                  <div className="option-title">All stores • Global scope</div>
                  <div className="option-desc">See data across all stores</div>
                </div>
                <div
                  className="scope-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScopeSelect('selected');
                  }}
                >
                  <div className="option-title">Selected stores</div>
                  <div className="option-desc">
                    {parseSelectedStores().length > 0
                      ? `${parseSelectedStores().length} store(s) selected`
                      : 'No stores selected yet'}
                  </div>
                </div>
              </div>
            )}
          </div>
          <button 
            type="button"
            className="sales-report-button" 
            onClick={handleSalesReport}
            disabled={isExportingSales}
          >
            {isExportingSales ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Exporting...
              </>
            ) : (
              <>
                <i className="fas fa-file-excel"></i> Sales Report
              </>
            )}
          </button>
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search supervisors, products, stores..." />
          </div>
        </div>

        {/* Scope status message */}
        {scopeMessage && (
          <div className="scope-message">
            {scopeMessage}
          </div>
        )}

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
          <div className="stat-card" onClick={() => setShowSupervisorAttendance(true)} style={{ cursor: 'pointer' }}>
            <div className="stat-content">
              <h3 className="stat-title">Supervisor Attendance</h3>
              <p className="stat-value">View today</p>
              <p className="stat-subtitle">Check all supervisor attendance</p>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#2196F320', color: '#2196F3' }}>
              <i className="fas fa-calendar-check"></i>
            </div>
          </div>
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
      </>
    );
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
          <span>Supervisors</span>
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
                  left: 0
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const span = e.target.nextSibling;
                  if (span) span.style.display = 'flex';
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
                  <span>Add Supervisor</span>
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
        {renderContent()}
      </main>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.open}
        title="Confirm Export"
        message={confirmState.message}
        confirmText="Yes, Export"
        cancelText="Cancel"
        onConfirm={() => {
          if (confirmState.onConfirm) {
            confirmState.onConfirm();
          }
        }}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />

      {showSupervisorAttendance && (
        <SupervisorAttendanceView onClose={() => setShowSupervisorAttendance(false)} />
      )}
    </div>
  );
};

export default Dashboard;

