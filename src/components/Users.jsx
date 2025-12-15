import React, { useState, useEffect, useRef } from 'react';
import { usersAPI } from '../services/api';

const Supervisors = ({ onBack, onAddUser, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('All Stores');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewSupervisorModal, setViewSupervisorModal] = useState(null);
  const menuRefs = useRef({});

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else if (onBack) {
      onBack();
    }
  };

  const handleStaff = () => {
    if (onNavigate) {
      onNavigate('staff');
    }
  };

  const handleCustomers = () => {
    if (onNavigate) {
      onNavigate('customers');
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
            role: user.role || 'Store User/Supervisor',
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

  // Handle menu toggle
  const toggleMenu = (userId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === userId ? null : userId);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Handle view supervisor details
  const handleViewSupervisorDetails = async (user) => {
    setOpenMenuId(null);
    try {
      const response = await usersAPI.getById(user.id);
      if (response.success) {
        setViewSupervisorModal(response.user);
      } else {
        setError('Failed to fetch supervisor details');
      }
    } catch (err) {
      console.error('Error fetching supervisor details:', err);
      setError('Failed to fetch supervisor details');
    }
  };

  const closeViewModal = () => {
    setViewSupervisorModal(null);
  };

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
          <span>Supervisors</span>
        </div>
        <div className="nav-item" onClick={handleStaff}>
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
        </div>
        <div className="nav-item" onClick={handleCustomers}>
          <div className="nav-icon">
            <i className="fas fa-user-friends"></i>
          </div>
          <span>Customers</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
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
          <h1 className="page-title">Supervisors</h1>
          <p className="page-subtitle">Manage store supervisors</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="users-content">
        {/* Tab and Add Button */}
        <div className="users-top-section">
          <div className="tab-indicator">
            <span className="tab-dot"></span>
            <span className="tab-label">SUPERVISORS</span>
          </div>
          <button className="add-user-btn" onClick={handleAddUser}>
            <i className="fas fa-plus"></i>
            <span>Add New Supervisor</span>
          </button>
        </div>

        {/* Heading */}
        <div className="users-heading">
          <h2>Manage Store Supervisors</h2>
          <p>View supervisors, their roles, and working stores. Filter quickly.</p>
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
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Supervisors Available</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Start by adding your first supervisor to the system.</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <p>No supervisors found matching your search</p>
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
              <div 
                className="user-options-container" 
                ref={el => menuRefs.current[user.id] = el}
              >
                <button 
                  className="user-options"
                  onClick={(e) => toggleMenu(user.id, e)}
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
                {openMenuId === user.id && (
                  <div className="supervisor-menu-dropdown">
                    <div className="menu-item" onClick={() => handleViewSupervisorDetails(user)}>
                      <i className="fas fa-eye"></i>
                      <span>View Supervisor Details</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            ))
          )}
        </div>
      </main>
      </div>
      </div>

      {/* View Supervisor Details Modal */}
      {viewSupervisorModal && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Supervisor Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{viewSupervisorModal.first_name && viewSupervisorModal.last_name 
                    ? `${viewSupervisorModal.first_name[0]}${viewSupervisorModal.last_name[0]}`.toUpperCase()
                    : 'SP'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">First Name:</span>
                    <span className="detail-value">{viewSupervisorModal.first_name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Last Name:</span>
                    <span className="detail-value">{viewSupervisorModal.last_name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Full Name:</span>
                    <span className="detail-value">{`${viewSupervisorModal.first_name || ''} ${viewSupervisorModal.last_name || ''}`.trim() || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{viewSupervisorModal.email || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Username:</span>
                    <span className="detail-value">{viewSupervisorModal.username || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">{viewSupervisorModal.role || 'Supervisor'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Store Allocated:</span>
                    <span className="detail-value">{viewSupervisorModal.store_allocated || 'Not Assigned'}</span>
                  </div>
                  {viewSupervisorModal.address && (
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{viewSupervisorModal.address}</span>
                    </div>
                  )}
                  {viewSupervisorModal.created_at && (
                    <div className="detail-row">
                      <span className="detail-label">Created At:</span>
                      <span className="detail-value">{new Date(viewSupervisorModal.created_at).toLocaleString()}</span>
                    </div>
                  )}
                  {viewSupervisorModal.updated_at && (
                    <div className="detail-row">
                      <span className="detail-label">Updated At:</span>
                      <span className="detail-value">{new Date(viewSupervisorModal.updated_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-close-button" onClick={closeViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Supervisors;

