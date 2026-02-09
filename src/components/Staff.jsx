import React, { useState, useEffect, useRef } from 'react';
import { staffAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import SidebarNav from './SidebarNav';

const Staff = ({ onBack, onAddStaff, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewStaffModal, setViewStaffModal] = useState(null);
  const [editStaffModal, setEditStaffModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const menuRefs = useRef({});

  // Fetch staff from database
  const fetchStaff = async () => {
    try {
      setError('');
      const response = await staffAPI.getAll();
      if (response.success) {
        const formattedStaff = response.staff.map(member => ({
          id: member.id,
          name: member.full_name,
          initials: member.full_name 
            ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : 'ST',
          role: member.role || 'Staff',
          floor: member.store_allocated || 'Not Assigned', // store_allocated is used for floor in this system
          avatar_url: member.avatar_url || null,
          created_at: member.created_at
        }));
        setStaff(formattedStaff);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff. Please try again.');
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

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

  const handleCustomers = () => {
    if (onNavigate) {
      onNavigate('customers');
    }
  };

  const handleSuppliers = () => {
    if (onNavigate) {
      onNavigate('suppliers');
    }
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  // Filter staff based on search
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.store.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Handle menu toggle
  const toggleMenu = (staffId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === staffId ? null : staffId);
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

  // Handle view staff details
  const handleViewStaffDetails = async (member) => {
    setOpenMenuId(null);
    try {
      const response = await staffAPI.getById(member.id);
      if (response.success) {
        setViewStaffModal(response);
      } else {
        setError('Failed to fetch staff details');
      }
    } catch (err) {
      console.error('Error fetching staff details:', err);
      setError('Failed to fetch staff details');
    }
  };

  // Handle edit staff
  const handleEditStaff = async (member) => {
    setOpenMenuId(null);
    try {
      const response = await staffAPI.getById(member.id);
      if (response.success) {
        setEditStaffModal(response);
      } else {
        setError('Failed to fetch staff details');
      }
    } catch (err) {
      console.error('Error fetching staff details:', err);
      setError('Failed to fetch staff details');
    }
  };

  // Handle save staff details
  const handleSaveStaffDetails = async () => {
    if (!editStaffModal || !editStaffModal.staff) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await staffAPI.update(editStaffModal.staff.id, {
        fullName: editStaffModal.staff.full_name,
        username: editStaffModal.staff.username,
        phone: editStaffModal.staff.phone,
        storeAllocated: editStaffModal.staff.store_allocated,
        address: editStaffModal.staff.address,
        city: editStaffModal.staff.city,
        state: editStaffModal.staff.state,
        pincode: editStaffModal.staff.pincode,
        isHandler: editStaffModal.staff.is_handler
      });
      
      if (response.success) {
        // Refresh staff list
        await fetchStaff();
        setEditStaffModal(null);
        setError('');
        
        // Dispatch custom event to notify other components (like AddService) to refresh handlers
        window.dispatchEvent(new CustomEvent('staffUpdated'));
      } else {
        setError('Failed to update staff');
      }
    } catch (err) {
      console.error('Error updating staff:', err);
      setError(err.message || 'Failed to update staff');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input change in edit modal
  const handleEditInputChange = (field, value) => {
    if (editStaffModal && editStaffModal.staff) {
      setEditStaffModal({
        ...editStaffModal,
        staff: {
          ...editStaffModal.staff,
          [field]: value
        }
      });
    }
  };

  // Handle handler status change
  const handleHandlerStatusChange = (value) => {
    handleEditInputChange('is_handler', value === 'yes');
  };

  const closeEditModal = () => {
    setEditStaffModal(null);
  };

  const closeViewModal = () => {
    setViewStaffModal(null);
  };

  // Handle delete staff
  const handleDeleteStaff = (member) => {
    setConfirmState({
      open: true,
      message: `Are you sure you want to delete ${member.name}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setError('');
          const response = await staffAPI.delete(member.id);
          if (response.success) {
            await fetchStaff();
          } else {
            setError(response.error || 'Failed to delete staff');
          }
        } catch (err) {
          console.error('Delete staff error:', err);
          setError(err.message || 'Failed to delete staff');
        } finally {
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  return (
    <div className="dashboard-container">
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
      {/* Left Sidebar Navigation */}
      <SidebarNav onNavigate={onNavigate} userRole={userRole} activeKey="staff" />

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
        <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
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
                  {filteredStaff.map((member, index) => {
                    return (
                      <tr key={member.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
                              background: member.avatar_url ? 'transparent' : '#dc3545',
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
                              {member.avatar_url ? (
                                <img 
                                  src={member.avatar_url.startsWith('data:') ? member.avatar_url : (member.avatar_url.startsWith('/') ? `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${member.avatar_url}` : member.avatar_url)}
                                  alt={member.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '50%'
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.style.background = '#dc3545';
                                    e.target.parentElement.innerHTML = member.initials || 'ST';
                                  }}
                                />
                              ) : (
                                member.initials || 'ST'
                              )}
                            </div>
                            <span style={{ fontWeight: '500', color: '#333' }}>{member.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td style={{ 
                          textAlign: 'center',
                          padding: '12px 8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleViewStaffDetails(member)}
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
                              onClick={() => handleEditStaff(member)}
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
                              onClick={() => handleDeleteStaff(member)}
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

      {/* Edit Staff Modal */}
      {editStaffModal && editStaffModal.staff && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Staff Details</h2>
              <button className="modal-close-btn" onClick={closeEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              {error && (
                <div style={{ 
                  padding: '12px', 
                  background: '#ffe0e0', 
                  color: '#dc3545', 
                  borderRadius: '8px', 
                  marginBottom: '20px' 
                }}>
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{editStaffModal.staff.full_name 
                    ? editStaffModal.staff.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'ST'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Full Name:</span>
                    <input
                      type="text"
                      value={editStaffModal.staff.full_name || ''}
                      onChange={(e) => handleEditInputChange('full_name', e.target.value)}
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
                  <div className="detail-row">
                    <span className="detail-label">Username:</span>
                    <input
                      type="text"
                      value={editStaffModal.staff.username || ''}
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
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">{editStaffModal.staff.role || 'Staff'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <input
                      type="tel"
                      value={editStaffModal.staff.phone || ''}
                      onChange={(e) => handleEditInputChange('phone', e.target.value)}
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
                  <div className="detail-row">
                    <span className="detail-label">Floor Allocated:</span>
                    <input
                      type="text"
                      value={editStaffModal.staff.store_allocated || ''}
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
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <textarea
                      value={editStaffModal.staff.address || ''}
                      onChange={(e) => handleEditInputChange('address', e.target.value)}
                      rows="2"
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">City:</span>
                    <input
                      type="text"
                      value={editStaffModal.staff.city || ''}
                      onChange={(e) => handleEditInputChange('city', e.target.value)}
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
                  <div className="detail-row">
                    <span className="detail-label">State:</span>
                    <input
                      type="text"
                      value={editStaffModal.staff.state || ''}
                      onChange={(e) => handleEditInputChange('state', e.target.value)}
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
                  <div className="detail-row">
                    <span className="detail-label">Pincode:</span>
                    <input
                      type="text"
                      value={editStaffModal.staff.pincode || ''}
                      onChange={(e) => handleEditInputChange('pincode', e.target.value)}
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
                  
                  {/* Editable Handler Status */}
                  <div className="detail-row" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e9ecef' }}>
                    <span className="detail-label">Can you be the handler? *</span>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="isHandler"
                          value="yes"
                          checked={editStaffModal.staff.is_handler === true}
                          onChange={() => handleHandlerStatusChange('yes')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span>Yes</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="isHandler"
                          value="no"
                          checked={editStaffModal.staff.is_handler === false}
                          onChange={() => handleHandlerStatusChange('no')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="modal-close-button" 
                onClick={closeEditModal}
                style={{ background: '#6c757d', color: '#fff' }}
              >
                Cancel
              </button>
              <button 
                className="modal-close-button" 
                onClick={handleSaveStaffDetails}
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

      {/* View Staff Details Modal */}
      {viewStaffModal && viewStaffModal.staff && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Staff Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{viewStaffModal.staff.full_name 
                    ? viewStaffModal.staff.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'ST'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Full Name:</span>
                    <span className="detail-value">{viewStaffModal.staff.full_name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{viewStaffModal.staff.email || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Username:</span>
                    <span className="detail-value">{viewStaffModal.staff.username || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">{viewStaffModal.staff.role || 'Staff'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{viewStaffModal.staff.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Floor Allocated:</span>
                    <span className="detail-value">{viewStaffModal.staff.store_allocated || 'Not Assigned'}</span>
                  </div>
                  {viewStaffModal.staff.address && (
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{viewStaffModal.staff.address}</span>
                    </div>
                  )}
                  {viewStaffModal.staff.created_at && (
                    <div className="detail-row">
                      <span className="detail-label">Created At:</span>
                      <span className="detail-value">{new Date(viewStaffModal.staff.created_at).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {/* Sales Section */}
                  {viewStaffModal.sales && viewStaffModal.sales.length > 0 && (
                    <>
                      <div className="detail-row" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e9ecef' }}>
                        <span className="detail-label" style={{ fontSize: '16px', fontWeight: '700', color: '#000' }}>Sales Summary</span>
                        <span className="detail-value" style={{ fontSize: '16px', fontWeight: '700', color: '#000' }}>
                          Total Sales: {viewStaffModal.sales.length}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Total Revenue:</span>
                        <span className="detail-value" style={{ color: '#28a745', fontWeight: '600' }}>
                          ₹{viewStaffModal.sales.reduce((sum, sale) => {
                            const revenue = (parseFloat(sale.sell_rate) || 0) * (parseInt(sale.quantity) || 0);
                            return sum + revenue;
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ marginBottom: '12px', fontWeight: '600', color: '#000' }}>Recent Sales:</div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {viewStaffModal.sales.slice(0, 10).map((sale, index) => (
                            <div key={index} style={{ 
                              padding: '12px', 
                              marginBottom: '8px', 
                              background: '#f8f9fa', 
                              borderRadius: '8px',
                              border: '1px solid #e9ecef'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: '600', fontSize: '13px' }}>Customer: {sale.full_name || 'N/A'}</span>
                                <span style={{ fontSize: '12px', color: '#666' }}>{new Date(sale.created_at).toLocaleDateString()}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                {sale.product_name && <span>Product: {sale.product_name} | </span>}
                                Item: {sale.item_code || 'N/A'} | Qty: {sale.quantity || 0}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span>Rate: ₹{sale.sell_rate || '0'}</span>
                                <span style={{ fontWeight: '600', color: '#28a745' }}>
                                  Total: ₹{((parseFloat(sale.sell_rate) || 0) * (parseInt(sale.quantity) || 0)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {viewStaffModal.sales.length > 10 && (
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                            Showing 10 of {viewStaffModal.sales.length} sales
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {(!viewStaffModal.sales || viewStaffModal.sales.length === 0) && (
                    <div className="detail-row" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e9ecef' }}>
                      <span className="detail-label" style={{ fontSize: '16px', fontWeight: '700', color: '#000' }}>Sales Summary</span>
                      <span className="detail-value" style={{ color: '#666' }}>No sales orders</span>
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

export default Staff;

