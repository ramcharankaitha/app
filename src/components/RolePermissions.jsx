import React, { useState, useEffect } from 'react';
import { permissionsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';

const RolePermissions = ({ onClose, onNavigate }) => {
  const [rolePermissions, setRolePermissions] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeRole, setActiveRole] = useState('Super Admin');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const roles = ['Super Admin', 'Supervisor', 'Staff'];
  
  const permissionSections = [
    {
      key: 'users',
      title: 'Users/Managers',
      icon: 'fa-users',
      description: 'Manage user accounts and managers'
    },
    {
      key: 'products',
      title: 'Products',
      icon: 'fa-box',
      description: 'Manage product inventory'
    },
    {
      key: 'staff',
      title: 'Staff',
      icon: 'fa-user-tie',
      description: 'Manage staff members'
    },
    {
      key: 'stores',
      title: 'Stores',
      icon: 'fa-store',
      description: 'Manage store locations'
    },
    {
      key: 'settings',
      title: 'Settings',
      icon: 'fa-cog',
      description: 'Access system settings'
    },
    {
      key: 'profile',
      title: 'Profile',
      icon: 'fa-user',
      description: 'View and edit profile'
    }
  ];

  const permissionTypes = [
    { key: 'view', label: 'View', icon: 'fa-eye' },
    { key: 'create', label: 'Create', icon: 'fa-plus' },
    { key: 'update', label: 'Update', icon: 'fa-edit' },
    { key: 'delete', label: 'Delete', icon: 'fa-trash' }
  ];

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await permissionsAPI.getAll();
        if (response.success) {
          const permissionsMap = {};
          response.rolePermissions.forEach(rp => {
            permissionsMap[rp.role_name] = rp.permissions;
          });
          setRolePermissions(permissionsMap);
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError('Failed to load permissions. Please try again.');
      }
    };

    fetchPermissions();
  }, []);

  const getPermission = (role, section, type) => {
    if (!rolePermissions[role]) return false;
    if (!rolePermissions[role][section]) return false;
    return rolePermissions[role][section][type] || false;
  };

  const setPermission = (role, section, type, value) => {
    setRolePermissions(prev => {
      const updated = { ...prev };
      if (!updated[role]) {
        updated[role] = {};
      }
      if (!updated[role][section]) {
        updated[role][section] = {};
      }
      updated[role][section][type] = value;
      return updated;
    });
  };

  const handleTogglePermission = (section, type) => {
    setPermission(activeRole, section, type, !getPermission(activeRole, section, type));
  };

  const handleSelectAll = (section) => {
    // For settings and profile, only check view and edit
    if (section === 'settings' || section === 'profile') {
      const perms = ['view', 'edit'];
      const allSelected = perms.every(p => getPermission(activeRole, section, p));
      perms.forEach(p => {
        setPermission(activeRole, section, p, !allSelected);
      });
    } else {
      const allSelected = permissionTypes.every(pt => getPermission(activeRole, section, pt.key));
      permissionTypes.forEach(pt => {
        setPermission(activeRole, section, pt.key, !allSelected);
      });
    }
  };

  const saveRolePermissions = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // Save permissions for the active role
      const permissions = rolePermissions[activeRole] || {};
      const response = await permissionsAPI.update(activeRole, permissions);

      if (response.success) {
        setSuccessMessage('Role permissions updated successfully');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(response.error || 'Failed to update permissions. Please try again.');
      }
    } catch (err) {
      console.error('Update permissions error:', err);
      setError(err.message || 'Failed to update permissions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllPermissions = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // Save permissions for all roles
      const savePromises = roles.map(role => {
        const permissions = rolePermissions[role] || {};
        return permissionsAPI.update(role, permissions);
      });

      await Promise.all(savePromises);
      setSuccessMessage('All role permissions updated successfully');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Update permissions error:', err);
      setError(err.message || 'Failed to update permissions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    setConfirmState({
      open: true,
      message: 'Are you sure you want to save role permission changes?',
      onConfirm: saveRolePermissions,
    });
  };

  const handleSaveAll = () => {
    setConfirmState({
      open: true,
      message: 'Are you sure you want to save all role permission changes?',
      onConfirm: saveAllPermissions,
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '900px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '700' }}>
            Role Permissions Management
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <Toast message={error} type="error" onClose={() => setError('')} />
        <Toast message={successMessage} type="success" onClose={() => setSuccessMessage('')} />

        {/* Role Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
            Select Role
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {roles.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setActiveRole(role)}
                style={{
                  padding: '10px 20px',
                  background: activeRole === role ? '#dc3545' : '#f0f0f0',
                  color: activeRole === role ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Grid */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'grid',
            gap: '16px'
          }}>
            {permissionSections.map(section => (
              <div
                key={section.key}
                style={{
                  border: '2px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '16px',
                  background: '#fff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className={`fas ${section.icon}`} style={{ color: '#dc3545', fontSize: '18px' }}></i>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                        {section.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {section.description}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(section.key)}
                    style={{
                      padding: '6px 12px',
                      background: '#f0f0f0',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#333'
                    }}
                  >
                    {(() => {
                      if (section.key === 'settings' || section.key === 'profile') {
                        const perms = ['view', 'edit'];
                        const allSelected = perms.every(p => getPermission(activeRole, section.key, p));
                        return allSelected ? 'Deselect All' : 'Select All';
                      } else {
                        const allSelected = permissionTypes.every(pt => getPermission(activeRole, section.key, pt.key));
                        return allSelected ? 'Deselect All' : 'Select All';
                      }
                    })()}
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                  {(() => {
                    // For settings and profile, only show view and edit
                    if (section.key === 'settings' || section.key === 'profile') {
                      return [
                        { key: 'view', label: 'View', icon: 'fa-eye' },
                        { key: 'edit', label: 'Edit', icon: 'fa-edit' }
                      ].map(pt => {
                        const isChecked = getPermission(activeRole, section.key, pt.key);
                        return (
                          <label
                            key={pt.key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px',
                              background: isChecked ? '#fff5f5' : '#fff',
                              border: isChecked ? '2px solid #dc3545' : '2px solid #f0f0f0',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(section.key, pt.key)}
                              style={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer'
                              }}
                            />
                            <i className={`fas ${pt.icon}`} style={{ color: isChecked ? '#dc3545' : '#999', fontSize: '14px' }}></i>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                              {pt.label}
                            </span>
                          </label>
                        );
                      });
                    }
                    // For other sections, show all permission types
                    return permissionTypes.map(pt => {
                      const isChecked = getPermission(activeRole, section.key, pt.key);
                      return (
                        <label
                          key={pt.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px',
                            background: isChecked ? '#fff5f5' : '#fff',
                            border: isChecked ? '2px solid #dc3545' : '2px solid #f0f0f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(section.key, pt.key)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer'
                            }}
                          />
                          <i className={`fas ${pt.icon}`} style={{ color: isChecked ? '#dc3545' : '#999', fontSize: '14px' }}></i>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                            {pt.label}
                          </span>
                        </label>
                      );
                    });
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '10px 20px',
              background: '#dc3545',
              border: 'none',
              borderRadius: '8px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              color: '#fff',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? 'Saving...' : `Save ${activeRole} Permissions`}
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              border: 'none',
              borderRadius: '8px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              color: '#fff',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save All Roles'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.open}
        title="Confirm Changes"
        message={confirmState.message}
        confirmText="Yes, Save"
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmState({ open: false, message: '', onConfirm: null });
          if (confirmState.onConfirm) confirmState.onConfirm();
        }}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
    </div>
  );
};

export default RolePermissions;

