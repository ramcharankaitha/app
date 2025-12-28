import React, { useState, useEffect, useRef } from 'react';
import { usersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const Supervisors = ({ onBack, onAddUser, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('All Stores');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewSupervisorModal, setViewSupervisorModal] = useState(null);
  const [editSupervisorModal, setEditSupervisorModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null, user: null });
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
                         user.store.toLowerCase().includes(searchQuery.toLowerCase());
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

  // Handle edit supervisor
  const handleEditSupervisor = async (user) => {
    setOpenMenuId(null);
    try {
      const response = await usersAPI.getById(user.id);
      if (response.success) {
        setEditSupervisorModal(response.user);
      } else {
        setError('Failed to fetch supervisor details');
      }
    } catch (err) {
      console.error('Error fetching supervisor details:', err);
      setError('Failed to fetch supervisor details');
    }
  };

  // Handle save supervisor details
  const handleSaveSupervisorDetails = async () => {
    if (!editSupervisorModal) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await usersAPI.update(editSupervisorModal.id, {
        firstName: editSupervisorModal.first_name,
        lastName: editSupervisorModal.last_name,
        username: editSupervisorModal.username,
        storeAllocated: editSupervisorModal.store_allocated
      });
      
      if (response.success) {
        // Refresh users list
        const fetchUsers = async () => {
          try {
            const response = await usersAPI.getAll();
            if (response.success) {
              const formattedUsers = response.users.map(user => ({
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                initials: `${user.first_name[0]}${user.last_name[0]}`.toUpperCase(),
                role: user.role || 'Store User/Supervisor',
                store: user.store_allocated || 'Not Assigned',
              }));
              setUsers(formattedUsers);
            }
          } catch (err) {
            console.error('Error fetching users:', err);
          }
        };
        await fetchUsers();
        setEditSupervisorModal(null);
        setError('');
      } else {
        setError('Failed to update supervisor');
      }
    } catch (err) {
      console.error('Error updating supervisor:', err);
      setError(err.message || 'Failed to update supervisor');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input change in edit modal
  const handleEditInputChange = (field, value) => {
    if (editSupervisorModal) {
      setEditSupervisorModal({
        ...editSupervisorModal,
        [field]: value
      });
    }
  };

  const closeEditModal = () => {
    setEditSupervisorModal(null);
  };

  // Handle disable supervisor
  const handleDisableSupervisor = (user) => {
    setOpenMenuId(null);
    setConfirmState({
      open: true,
      message: `Are you sure you want to disable ${user.name}? This action can be reversed later.`,
      user: user,
      onConfirm: async () => {
        try {
          // Note: You may need to add a disable endpoint to usersAPI
          // For now, this is a placeholder that can be implemented based on your backend
          const response = await usersAPI.update(user.id, {
            ...user,
            is_active: false
          });
          
          if (response.success) {
            // Refresh users list
            const fetchUsers = async () => {
              try {
                const response = await usersAPI.getAll();
                if (response.success) {
                  const formattedUsers = response.users.map(user => ({
                    id: user.id,
                    name: `${user.first_name} ${user.last_name}`,
                    initials: `${user.first_name[0]}${user.last_name[0]}`.toUpperCase(),
                    role: user.role || 'Store User/Supervisor',
                    store: user.store_allocated || 'Not Assigned',
                  }));
                  setUsers(formattedUsers);
                }
              } catch (err) {
                console.error('Error fetching users:', err);
              }
            };
            await fetchUsers();
            setConfirmState({ open: false, message: '', onConfirm: null, user: null });
          } else {
            setError('Failed to disable supervisor');
            setConfirmState({ open: false, message: '', onConfirm: null, user: null });
          }
        } catch (err) {
          console.error('Error disabling supervisor:', err);
          setError('Failed to disable supervisor');
          setConfirmState({ open: false, message: '', onConfirm: null, user: null });
        }
      }
    });
  };

  return (
    <div className="dashboard-container">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title="Disable Supervisor"
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null, user: null })}
        confirmText="Disable"
        cancelText="Cancel"
      />
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
        <div className="nav-item" onClick={() => onNavigate && onNavigate('masterMenu')}>
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

        {/* Search */}
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
        <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
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
            <div className="premium-cards-grid">
              {filteredUsers.map((user) => {
                // Determine role badge color - Red theme
                const getRoleBadgeColor = (role) => {
                  const roleLower = (role || '').toLowerCase();
                  if (roleLower.includes('supervisor')) return '#dc3545'; // Red
                  if (roleLower.includes('admin')) return '#dc3545'; // Red
                  return '#dc3545'; // Red for all roles
                };

                return (
                  <div
                    key={user.id}
                    className="premium-identity-card"
                  >

                    {/* Card Header */}
                    <div className="premium-card-header">
                      <div className="premium-avatar">
                        <span>{user.initials || 'SP'}</span>
                      </div>
                      <div className="premium-header-content">
                        <h3 className="premium-worker-name">{user.name || 'N/A'}</h3>
                        <div 
                          className="premium-role-badge"
                          style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                        >
                          {user.role || 'Supervisor'}
                        </div>
                      </div>
                      {/* Move menu to header to prevent overlap */}
                      <div 
                        className="premium-card-menu" 
                        ref={el => menuRefs.current[user.id] = el}
                      >
                        <button 
                          className="premium-menu-trigger"
                          onClick={(e) => toggleMenu(user.id, e)}
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                        {openMenuId === user.id && (
                          <div className="premium-menu-dropdown">
                            <div className="premium-menu-item" onClick={() => handleViewSupervisorDetails(user)}>
                              <i className="fas fa-eye"></i>
                              <span>View</span>
                            </div>
                            <div className="premium-menu-item" onClick={() => handleEditSupervisor(user)}>
                              <i className="fas fa-edit"></i>
                              <span>Edit</span>
                            </div>
                            <div className="premium-menu-item premium-menu-item-danger" onClick={() => handleDisableSupervisor(user)}>
                              <i className="fas fa-ban"></i>
                              <span>Disable</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Body - Two Column Layout */}
                    <div className="premium-card-body">
                      <div className="premium-info-row">
                        <div className="premium-info-item">
                          <div className="premium-info-icon">
                            <i className="fas fa-store"></i>
                          </div>
                          <div className="premium-info-content">
                            <span className="premium-info-label">Store</span>
                            <span className="premium-info-value">{user.store || 'Not Assigned'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

      {/* Edit Supervisor Details Modal */}
      {editSupervisorModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h2>Edit Supervisor Details</h2>
              <button className="modal-close-btn" onClick={closeEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content" style={{ padding: '20px' }}>
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{editSupervisorModal.first_name && editSupervisorModal.last_name 
                    ? `${editSupervisorModal.first_name[0]}${editSupervisorModal.last_name[0]}`.toUpperCase()
                    : 'SP'}</span>
                </div>
                <div className="detail-info" style={{ width: '100%' }}>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>First Name:</span>
                    <input
                      type="text"
                      value={editSupervisorModal.first_name || ''}
                      onChange={(e) => handleEditInputChange('first_name', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Last Name:</span>
                    <input
                      type="text"
                      value={editSupervisorModal.last_name || ''}
                      onChange={(e) => handleEditInputChange('last_name', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Username:</span>
                    <input
                      type="text"
                      value={editSupervisorModal.username || ''}
                      onChange={(e) => handleEditInputChange('username', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Role:</span>
                    <span className="detail-value">{editSupervisorModal.role || 'Supervisor'}</span>
                  </div>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Store Allocated:</span>
                    <input
                      type="text"
                      value={editSupervisorModal.store_allocated || ''}
                      onChange={(e) => handleEditInputChange('store_allocated', e.target.value)}
                      placeholder="Not Assigned"
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '20px' }}>
              <button 
                className="modal-close-button" 
                onClick={closeEditModal}
                style={{ background: '#6c757d', color: '#fff' }}
              >
                Cancel
              </button>
              <button 
                className="modal-close-button" 
                onClick={handleSaveSupervisorDetails}
                disabled={isSaving}
                style={{ 
                  background: '#dc3545', 
                  color: '#fff',
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Supervisors;

