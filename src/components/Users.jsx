import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';

const Managers = ({ onBack, onAddUser, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('All Stores');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else if (onBack) {
      onBack();
    }
  };

  const handleProducts = () => {
    if (onNavigate) {
      onNavigate('products');
    }
  };

  const handleStaff = () => {
    if (onNavigate) {
      onNavigate('staff');
    }
  };

  const handleUsers = () => {
    if (onNavigate) {
      onNavigate('users');
    }
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  const handleAddUser = () => {
    if (onAddUser) {
      onAddUser();
    } else if (onNavigate) {
      onNavigate('addUser');
    }
  };

  // Fetch users from database in background (non-blocking)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersAPI.getAll();
        if (response.success) {
          // Transform database users to display format
          const formattedUsers = response.users.map(user => ({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            initials: `${user.first_name[0]}${user.last_name[0]}`.toUpperCase(),
            role: user.role || 'Store User/Manager',
            store: user.store_allocated || 'Not Assigned',
            email: user.email
          }));
          setUsers(formattedUsers);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        // Silently fail - show empty state
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = selectedStore === 'All Stores' || user.store === selectedStore;
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
        <div className="nav-item active" onClick={handleUsers}>
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
        <div className="nav-item" onClick={handleStaff}>
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
      <div className="users-container">
      {/* Header */}
      <header className="users-header">
        <button className="back-btn" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="header-content">
          <h1 className="page-title">Managers</h1>
          <p className="page-subtitle">Manage store managers</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="users-content">
        {/* Tab and Add Button */}
        <div className="users-top-section">
          <div className="tab-indicator">
            <span className="tab-dot"></span>
            <span className="tab-label">MANAGERS</span>
          </div>
          <button className="add-user-btn" onClick={handleAddUser}>
            <i className="fas fa-plus"></i>
            <span>Add New Manager</span>
          </button>
        </div>

        {/* Heading */}
        <div className="users-heading">
          <h2>Manage Store Managers</h2>
          <p>View managers, their roles, and working stores. Filter quickly.</p>
        </div>

        {/* Search and Filter */}
        <div className="users-controls">
          <div className="users-search-bar">
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
        <div className="users-count">
          {`Showing ${filteredUsers.length} of ${users.length} users`}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Users List */}
        <div className="users-list">
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
              <i className="fas fa-users" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Managers Available</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Start by adding your first manager to the system.</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <p>No managers found matching your search</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-avatar">
                <span>{user.initials}</span>
              </div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role}</div>
                <div className="user-store-badge">
                  <i className="fas fa-check-circle"></i>
                  <span>{user.store}</span>
                </div>
              </div>
              <div className="user-email">{user.email}</div>
              <button className="user-options">
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

export default Managers;

