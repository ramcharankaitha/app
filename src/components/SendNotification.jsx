import React, { useState, useEffect } from 'react';
import { notificationsAPI, usersAPI, staffAPI } from '../services/api';
import './SendNotification.css';

const SendNotification = ({ onClose, userRole }) => {
  const [formData, setFormData] = useState({
    userType: 'all',
    sendMode: 'all', // 'all' or 'specific'
    type: 'info',
    title: '',
    message: '',
    isCritical: false,
    userIds: []
  });
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (formData.userType === 'all' || formData.sendMode === 'all') {
      setUsers([]);
      setSelectedUsers([]);
    } else if (formData.sendMode === 'specific') {
      fetchUsers();
    }
  }, [formData.userType, formData.sendMode]);

  const fetchUsers = async () => {
    try {
      let response;
      if (formData.userType === 'staff') {
        response = await staffAPI.getAll();
        setUsers(response.staff || []);
      } else if (formData.userType === 'supervisor') {
        response = await usersAPI.getAll();
        const supervisors = (response.users || []).filter(u => u.role === 'Supervisor');
        setUsers(supervisors);
      } else if (formData.userType === 'admin') {
        // For admin, we'll use a different approach
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
    setSuccess('');
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Determine if we're sending to specific users or all
      const sendToSpecific = formData.sendMode === 'specific' && selectedUsers.length > 0;
      
      const notificationData = {
        userType: formData.userType,
        type: formData.type,
        title: formData.title.trim(),
        message: formData.message.trim(),
        isCritical: formData.isCritical,
        userIds: sendToSpecific ? selectedUsers : []
      };

      if (!notificationData.title || !notificationData.message) {
        throw new Error('Title and message are required');
      }

      const response = await notificationsAPI.send(notificationData);

      if (response.success) {
        const recipientCount = response.count || 1;
        setSuccess(`Notification sent successfully to ${recipientCount} recipient(s)`);
        setFormData({
          userType: 'all',
          sendMode: 'all',
          type: 'info',
          title: '',
          message: '',
          isCritical: false,
          userIds: []
        });
        setSelectedUsers([]);
        
        // Trigger notification refresh in all dashboards
        console.log('📢 Dispatching notificationsUpdated event');
        window.dispatchEvent(new Event('notificationsUpdated'));
        
        // Also trigger a custom event with more info
        window.dispatchEvent(new CustomEvent('notificationSent', { 
          detail: { count: recipientCount, userType: notificationData.userType } 
        }));
        
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content send-notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send Notification</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="notification-form">
          <div className="form-group">
            <label>Send To</label>
            <select
              name="userType"
              value={formData.userType}
              onChange={(e) => {
                handleInputChange(e);
                // Reset send mode when user type changes
                setFormData(prev => ({ ...prev, sendMode: 'all', userType: e.target.value }));
                setSelectedUsers([]);
              }}
              required
            >
              <option value="all">All Admins</option>
              {userRole === 'admin' && <option value="supervisor">Supervisors</option>}
              {userRole === 'admin' && <option value="staff">Staff</option>}
            </select>
          </div>

          {formData.userType !== 'all' && (
            <div className="form-group">
              <label>Send Mode</label>
              <select
                name="sendMode"
                value={formData.sendMode}
                onChange={(e) => {
                  handleInputChange(e);
                  if (e.target.value === 'all') {
                    setSelectedUsers([]);
                  }
                }}
                required
              >
                <option value="all">Send to All {formData.userType === 'supervisor' ? 'Supervisors' : 'Staff'}</option>
                <option value="specific">Select Specific Users</option>
              </select>
            </div>
          )}

          {formData.userType !== 'all' && formData.sendMode === 'specific' && (
            <div className="form-group">
              <label>Select Users *</label>
              {users.length === 0 ? (
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', color: '#666' }}>
                  <i className="fas fa-spinner fa-spin"></i> Loading users...
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                    {selectedUsers.length > 0 ? (
                      <span style={{ color: '#28a745', fontWeight: '600' }}>
                        {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                      </span>
                    ) : (
                      <span style={{ color: '#dc3545' }}>Please select at least one user</span>
                    )}
                  </div>
                  <div className="user-select-list">
                    {users.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        No {formData.userType} found
                      </div>
                    ) : (
                      users.map(user => (
                        <label key={user.id} className="user-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                          />
                          <span>
                            {user.full_name || user.name || user.username} 
                            {user.role && ` (${user.role})`}
                            {user.phone && ` - ${user.phone}`}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter notification title"
              required
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label>Message *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Enter notification message"
              required
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isCritical"
                checked={formData.isCritical}
                onChange={handleInputChange}
              />
              <span>Mark as Critical Alert</span>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isLoading || (formData.sendMode === 'specific' && selectedUsers.length === 0)}
            >
              {isLoading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendNotification;

