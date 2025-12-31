const { pool } = require('../config/database');

/**
 * Notification Service
 * Handles creating notifications and critical alerts
 */

/**
 * Create a notification
 * @param {Object} options - Notification options
 * @param {number|null} options.userId - User ID (null for all users of a type)
 * @param {string} options.userType - 'admin', 'supervisor', 'staff', or 'all'
 * @param {string} options.type - 'warning', 'info', 'success', 'error'
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {boolean} options.isCritical - Whether this is a critical alert
 * @param {number|null} options.relatedId - Related record ID (optional)
 */
async function createNotification({
  userId = null,
  userType = 'admin',
  type = 'info',
  title,
  message,
  isCritical = false,
  relatedId = null
}) {
  try {
    // If userType is 'all', create notifications for all admins
    if (userType === 'all') {
      const admins = await pool.query(
        'SELECT id FROM admin_profile'
      );
      
      const notifications = admins.rows.map(admin => ({
        userId: admin.id,
        userType: 'admin',
        type,
        title,
        message,
        isCritical,
        relatedId
      }));

      // Insert all notifications
      for (const notif of notifications) {
        await pool.query(
          `INSERT INTO notifications (user_id, user_type, notification_type, title, message, is_critical, related_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [notif.userId, notif.userType, notif.type, notif.title, notif.message, notif.isCritical, notif.relatedId]
        );
      }
      
      return { success: true, count: notifications.length };
    } else {
      // Single user notification
      const result = await pool.query(
        `INSERT INTO notifications (user_id, user_type, notification_type, title, message, is_critical, related_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, userType, type, title, message, isCritical, relatedId]
      );

      return { success: true, notification: result.rows[0] };
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create critical alert for all admins
 * @param {string} type - 'warning', 'info', 'success', 'error'
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {number|null} relatedId - Related record ID (optional)
 */
async function createCriticalAlert(type, title, message, relatedId = null) {
  return createNotification({
    userId: null,
    userType: 'all',
    type,
    title,
    message,
    isCritical: true,
    relatedId
  });
}

/**
 * Create notification for specific user types
 * @param {string} userType - 'admin', 'supervisor', 'staff'
 * @param {string} type - 'warning', 'info', 'success', 'error'
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {boolean} isCritical - Whether this is critical
 * @param {number|null} relatedId - Related record ID (optional)
 */
async function createNotificationForUserType(userType, type, title, message, isCritical = false, relatedId = null) {
  try {
    let query;
    let params;

    if (userType === 'admin') {
      query = 'SELECT id FROM admin_profile';
      params = [];
    } else if (userType === 'supervisor') {
      query = 'SELECT id FROM users WHERE role = $1';
      params = ['Supervisor'];
    } else if (userType === 'staff') {
      query = 'SELECT id FROM staff';
      params = [];
    } else {
      throw new Error('Invalid user type');
    }

    const users = await pool.query(query, params);
    console.log(`📋 Found ${users.rows.length} ${userType}s to notify`);
    
    let notificationCount = 0;
    // Insert all notifications
    for (const user of users.rows) {
      try {
        await pool.query(
          `INSERT INTO notifications (user_id, user_type, notification_type, title, message, is_critical, related_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [user.id, userType, type, title, message, isCritical, relatedId]
        );
        notificationCount++;
        console.log(`✅ Notification created for ${userType} ID: ${user.id}`);
      } catch (err) {
        console.error(`❌ Error creating notification for ${userType} ID ${user.id}:`, err);
      }
    }
    
    console.log(`📬 Successfully created ${notificationCount} notifications for ${userType}s`);
    return { success: true, count: notificationCount };
  } catch (error) {
    console.error('Error creating notification for user type:', error);
    throw error;
  }
}

module.exports = {
  createNotification,
  createCriticalAlert,
  createNotificationForUserType
};

