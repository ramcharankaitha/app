import React, { useState, useEffect, useRef } from 'react';
import { usersAPI, API_BASE_URL } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import SidebarNav from './SidebarNav';

const Supervisors = ({ onBack, onAddUser, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [selectedStore] = useState('All Stores');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewSupervisorModal, setViewSupervisorModal] = useState(null);
  const [editSupervisorModal, setEditSupervisorModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null, user: null });
  const menuRefs = useRef({});

  const handleHome = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else if (onBack) {
      onBack();
    }
  };

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
          const formattedUsers = response.users.map(user => {
            // Handle null last_name (supervisor name might be single word)
            const firstName = user.first_name || '';
            const lastName = user.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            // Generate initials: use first letter of first name, and first letter of last name if available
            const firstInitial = firstName ? firstName[0] : '';
            const lastInitial = lastName ? lastName[0] : '';
            const initials = `${firstInitial}${lastInitial}`.toUpperCase() || 'SU';
            
            return {
              id: user.id,
              name: fullName || firstName || 'Supervisor',
              initials: initials,
              role: user.role || 'Store User/Supervisor',
              store: user.store_allocated || 'Not Assigned',
              avatar_url: user.avatar_url || null,
            };
          });
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
              const formattedUsers = response.users.map(user => {
                // Handle null last_name (supervisor name might be single word)
                const firstName = user.first_name || '';
                const lastName = user.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim();
                // Generate initials: use first letter of first name, and first letter of last name if available
                const firstInitial = firstName ? firstName[0] : '';
                const lastInitial = lastName ? lastName[0] : '';
                const initials = `${firstInitial}${lastInitial}`.toUpperCase() || 'SU';
                
                return {
                  id: user.id,
                  name: fullName || firstName || 'Supervisor',
                  initials: initials,
                  role: user.role || 'Store User/Supervisor',
                  store: user.store_allocated || 'Not Assigned',
                  avatar_url: user.avatar_url || null,
                };
              });
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

  // Handle delete supervisor
  const handleDeleteSupervisor = (user) => {
    setOpenMenuId(null);
    setConfirmState({
      open: true,
      message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      user: user,
      onConfirm: async () => {
        try {
          setError('');
          const response = await usersAPI.delete(user.id);
          if (response.success) {
            // Refresh users list
            const fetchUsers = async () => {
              try {
                const response = await usersAPI.getAll();
                if (response.success) {
                  const formattedUsers = response.users.map(user => {
                    // Handle null last_name (supervisor name might be single word)
                    const firstName = user.first_name || '';
                    const lastName = user.last_name || '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    // Generate initials: use first letter of first name, and first letter of last name if available
                    const firstInitial = firstName ? firstName[0] : '';
                    const lastInitial = lastName ? lastName[0] : '';
                    const initials = `${firstInitial}${lastInitial}`.toUpperCase() || 'SU';
                    
                    return {
                      id: user.id,
                      name: fullName || firstName || 'Supervisor',
                      initials: initials,
                      role: user.role || 'Store User/Supervisor',
                      store: user.store_allocated || 'Not Assigned',
                    };
                  });
                  setUsers(formattedUsers);
                }
              } catch (err) {
                console.error('Error fetching users:', err);
              }
            };
            await fetchUsers();
            setConfirmState({ open: false, message: '', onConfirm: null, user: null });
          } else {
            setError(response.error || 'Failed to delete supervisor');
            setConfirmState({ open: false, message: '', onConfirm: null, user: null });
          }
        } catch (err) {
          console.error('Delete supervisor error:', err);
          setError(err.message || 'Failed to delete supervisor');
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
        title="Delete Supervisor"
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null, user: null })}
        confirmText="Disable"
        cancelText="Cancel"
      />
      {/* Left Sidebar Navigation */}
      <SidebarNav onNavigate={onNavigate} userRole={userRole} activeKey="users" />

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

        <Toast message={error} type="error" onClose={() => setError('')} />

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
            <div className="attendance-table-container" style={{ 
              marginTop: '0', 
              maxHeight: 'none',
              overflowX: 'auto',
              width: '100%'
            }}>
              <table className="attendance-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6', width: '60px' }}>
                      #
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Name
                    </th>
                    <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6', width: '250px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => {
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ 
                          textAlign: 'center', 
                          color: '#666',
                          padding: '12px 8px',
                          fontSize: '14px'
                        }}>
                          {index + 1}
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: user.avatar_url ? 'transparent' : '#dc3545',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                              fontSize: '14px',
                              flexShrink: 0,
                              position: 'relative',
                              overflow: 'hidden'
                            }}>
                              {user.avatar_url ? (
                                <img 
                                  src={user.avatar_url.startsWith('data:') ? user.avatar_url : (user.avatar_url.startsWith('/') ? `${API_BASE_URL.replace('/api', '')}${user.avatar_url}` : user.avatar_url)}
                                  alt={user.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '50%'
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.style.background = '#dc3545';
                                    e.target.parentElement.innerHTML = user.initials || 'SP';
                                  }}
                                />
                              ) : (
                                user.initials || 'SP'
                              )}
                            </div>
                            <span style={{ fontWeight: '500', color: '#333' }}>{user.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td style={{ 
                          textAlign: 'center',
                          padding: '12px 8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleViewSupervisorDetails(user)}
                              style={{
                                background: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#0056b3';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#007bff';
                              }}
                            >
                              <i className="fas fa-eye"></i>
                              View
                            </button>
                            <button
                              onClick={() => handleEditSupervisor(user)}
                              style={{
                                background: '#28a745',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#218838';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#28a745';
                              }}
                            >
                              <i className="fas fa-edit"></i>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSupervisor(user)}
                              style={{
                                background: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#c82333';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#dc3545';
                              }}
                            >
                              <i className="fas fa-trash"></i>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                  <span>{
                    (() => {
                      const firstName = viewSupervisorModal.first_name || '';
                      const lastName = viewSupervisorModal.last_name || '';
                      const firstInitial = firstName ? firstName[0] : '';
                      const lastInitial = lastName ? lastName[0] : '';
                      return `${firstInitial}${lastInitial}`.toUpperCase() || 'SP';
                    })()
                  }</span>
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
                  <span>{
                    (() => {
                      const firstName = editSupervisorModal.first_name || '';
                      const lastName = editSupervisorModal.last_name || '';
                      const firstInitial = firstName ? firstName[0] : '';
                      const lastInitial = lastName ? lastName[0] : '';
                      return `${firstInitial}${lastInitial}`.toUpperCase() || 'SP';
                    })()
                  }</span>
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

