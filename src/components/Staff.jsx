import React, { useState } from 'react';

const Staff = ({ onBack, onAddStaff, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('All Stores');
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddStaff = () => {
    if (onAddStaff) {
      onAddStaff();
    } else if (onNavigate) {
      onNavigate('addStaff');
    }
  };

  const handleManagers = () => {
    if (onNavigate) {
      onNavigate('users');
    }
  };

  const handleProducts = () => {
    if (onNavigate) {
      onNavigate('products');
    }
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  // Filter staff based on search and store
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = selectedStore === 'All Stores' || member.store === selectedStore;
    return matchesSearch && matchesStore;
  });

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={handleBack}>
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
        <div className="nav-item" onClick={handleBack}>
          <div className="nav-icon">
            <i className="fas fa-store"></i>
          </div>
          <span>Stores</span>
        </div>
        <div className="nav-item active">
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

      {/* Main Content Area */}
      <div className="dashboard-main">
      <div className="staff-container">
      {/* Header */}
      <header className="staff-header">
        <button className="back-btn" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="header-content">
          <h1 className="page-title">Staff Details</h1>
          <p className="page-subtitle">Manage store staff</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="staff-content">
        {/* Tab and Add Button */}
        <div className="staff-top-section">
          <div className="tab-indicator">
            <span className="tab-dot"></span>
            <span className="tab-label">USERS & STAFF</span>
          </div>
          <button className="add-staff-btn" onClick={handleAddStaff}>
            <i className="fas fa-plus"></i>
            <span>Add New User</span>
          </button>
        </div>

        {/* Heading */}
        <div className="staff-heading">
          <h2>Manage Store Staff</h2>
          <p>View staff, their roles, and working stores. Filter quickly.</p>
        </div>

        {/* Search and Filter */}
        <div className="staff-controls">
          <div className="staff-search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search name, role, store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="store-filter-btn">
            <i className="fas fa-store"></i>
            <span>{selectedStore}</span>
            <i className="fas fa-chevron-down"></i>
          </button>
        </div>

        {/* Results Count */}
        <div className="staff-count">
          {`Showing ${filteredStaff.length} of ${staff.length} staff`}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Staff List */}
        <div className="staff-list">
          {staff.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
              <i className="fas fa-user-tie" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Staff Available</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Start by adding your first staff member to the system.</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <p>No staff found matching your search</p>
            </div>
          ) : (
            filteredStaff.map((member) => (
            <div key={member.id} className="staff-card">
              <div className="staff-avatar">
                <span>{member.initials}</span>
              </div>
              <div className="staff-info">
                <div className="staff-name">{member.name}</div>
                <div className="staff-role">{member.role}</div>
                <div className="staff-store-badge">
                  <i className="fas fa-check-circle"></i>
                  <span>{member.store}</span>
                </div>
              </div>
              <div className="staff-email">{member.email}</div>
              <button className="staff-options">
                <i className="fas fa-ellipsis-v"></i>
              </button>
            </div>
            ))
          )}
        </div>
      </main>
      </div>
      </div>
    </div>
  );
};

export default Staff;

