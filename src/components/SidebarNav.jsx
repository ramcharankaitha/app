import React from 'react';

const SidebarNav = ({ onNavigate, userRole = 'admin', activeKey }) => {
  const homePage = userRole === 'admin' ? 'dashboard' : userRole === 'supervisor' ? 'supervisorHome' : 'staffHome';

  const go = (page) => {
    if (onNavigate) onNavigate(page);
  };

  const isActive = (key) => activeKey === key;

  return (
    <nav className="sidebar-nav">
      <div className={`nav-item ${isActive('home') ? 'active' : ''}`} onClick={() => go(homePage)}>
        <div className="nav-icon">
          <i className="fas fa-home"></i>
        </div>
        <span>Home</span>
      </div>

      <div className={`nav-item ${isActive('users') ? 'active' : ''}`} onClick={() => go('users')}>
        <div className="nav-icon">
          <i className="fas fa-users"></i>
        </div>
        <span>Supervisors</span>
      </div>

      <div className={`nav-item ${isActive('staff') ? 'active' : ''}`} onClick={() => go('staff')}>
        <div className="nav-icon">
          <i className="fas fa-user-tie"></i>
        </div>
        <span>Staff</span>
      </div>

      <div className={`nav-item ${isActive('masterMenu') ? 'active' : ''}`} onClick={() => go('masterMenu')}>
        <div className="nav-icon">
          <i className="fas fa-th-large"></i>
        </div>
        <span>Master Menu</span>
      </div>

      <div className={`nav-item ${isActive('transactionMenu') ? 'active' : ''}`} onClick={() => go('transactionMenu')}>
        <div className="nav-icon">
          <i className="fas fa-exchange-alt"></i>
        </div>
        <span>Transaction</span>
      </div>

      <div className={`nav-item ${isActive('settings') ? 'active' : ''}`} onClick={() => go('settings')}>
        <div className="nav-icon">
          <i className="fas fa-cog"></i>
        </div>
        <span>Settings</span>
      </div>
    </nav>
  );
};

export default SidebarNav;
