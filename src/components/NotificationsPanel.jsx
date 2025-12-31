import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';
import './NotificationsPanel.css';

const NotificationsPanel = ({ onClose, userId, userType = 'admin' }) => {
  const [notifications, setNotifications] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'critical', 'unread'
  const [isLoading, setIsLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [userId, userType, activeTab]);

  const fetchNotifications = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      if (activeTab === 'critical' && userType === 'admin') {
        const alertsResponse = await notificationsAPI.getCriticalAlerts(userId);
        if (alertsResponse.success) {
          setCriticalAlerts(alertsResponse.alerts || []);
        }
      } else {
        const notifResponse = await notificationsAPI.getAll(userId, userType);
        if (notifResponse.success) {
          let allNotifications = notifResponse.notifications || [];
          
          if (activeTab === 'unread') {
            allNotifications = allNotifications.filter(n => !n.is_read);
          }
          
          setNotifications(allNotifications);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setCriticalAlerts(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    setMarkingAllRead(true);
    try {
      await notificationsAPI.markAllAsRead(userId, userType);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setCriticalAlerts(prev => prev.map(n => ({ ...n, is_read: true })));
      // Trigger refresh in parent
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    try {
      await notificationsAPI.delete(id, userId);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setCriticalAlerts(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'success': return 'fas fa-check-circle';
      default: return 'fas fa-info-circle';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'error': return '#dc3545';
      case 'warning': return '#ffa500';
      case 'success': return '#28a745';
      default: return '#17a2b8';
    }
  };

  const displayNotifications = activeTab === 'critical' ? criticalAlerts : notifications;
  const unreadCount = displayNotifications.filter(n => !n.is_read).length;

  return (
    <div className="modal-overlay notifications-overlay" onClick={onClose}>
      <div className="notifications-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-header">
          <h2>
            <i className="fas fa-bell"></i>
            Notifications
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="notifications-tabs">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          {userType === 'admin' && (
            <button
              className={`tab ${activeTab === 'critical' ? 'active' : ''}`}
              onClick={() => setActiveTab('critical')}
            >
              Critical
              {criticalAlerts.filter(n => !n.is_read).length > 0 && (
                <span className="tab-badge">{criticalAlerts.filter(n => !n.is_read).length}</span>
              )}
            </button>
          )}
          <button
            className={`tab ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            Unread
            {unreadCount > 0 && (
              <span className="tab-badge">{unreadCount}</span>
            )}
          </button>
        </div>

        <div className="notifications-actions">
          {unreadCount > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
            >
              <i className="fas fa-check-double"></i>
              {markingAllRead ? 'Marking...' : 'Mark All as Read'}
            </button>
          )}
        </div>

        <div className="notifications-content">
          {isLoading ? (
            <div className="notifications-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading notifications...</p>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="notifications-empty">
              <i className="fas fa-bell-slash"></i>
              <p>No {activeTab === 'critical' ? 'critical alerts' : activeTab === 'unread' ? 'unread notifications' : 'notifications'}</p>
            </div>
          ) : (
            <div className="notifications-list">
              {displayNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.is_critical ? 'critical' : ''} ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                >
                  <div className="notification-icon-wrapper">
                    <i 
                      className={getNotificationIcon(notif.notification_type)}
                      style={{ color: getNotificationColor(notif.notification_type) }}
                    ></i>
                    {!notif.is_read && <span className="unread-dot"></span>}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title-row">
                      <h4 className="notification-title">{notif.title}</h4>
                      {notif.is_critical && (
                        <span className="critical-badge">Critical</span>
                      )}
                    </div>
                    <p className="notification-message">{notif.message}</p>
                    <div className="notification-footer">
                      <span className="notification-time">{formatTimeAgo(notif.created_at)}</span>
                      <div className="notification-actions">
                        {!notif.is_read && (
                          <button
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notif.id);
                            }}
                            title="Mark as read"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        <button
                          className="action-btn delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notif.id);
                          }}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;

