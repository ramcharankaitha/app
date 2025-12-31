const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { createNotification, createNotificationForUserType } = require('../services/notificationService');

// Get notifications for a user
router.get('/', async (req, res) => {
  try {
    const { userId, userType } = req.query;
    
    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and user type are required' });
    }

    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 AND user_type = $2 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId, userType]
    );

    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, notification: result.rows[0] });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const { userId, userType } = req.query;
    
    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and user type are required' });
    }

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND user_type = $2 AND is_read = FALSE',
      [userId, userType]
    );

    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get critical alerts for admin
router.get('/critical-alerts', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 AND user_type = 'admin' AND is_critical = TRUE
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    res.json({ success: true, alerts: result.rows });
  } catch (error) {
    console.error('Get critical alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send notification (Admin/Supervisor only)
router.post('/send', async (req, res) => {
  try {
    const { userType, type, title, message, isCritical, userIds } = req.body;
    
    // Note: Authentication should be handled by middleware
    // For now, we'll allow if the request comes through (can be secured later)
    // In production, add authentication middleware

    if (!userType || !type || !title || !message) {
      return res.status(400).json({ error: 'userType, type, title, and message are required' });
    }

    let result;

    // If specific user IDs provided, send to those users
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      let notificationCount = 0;
      for (const userId of userIds) {
        try {
          await pool.query(
            `INSERT INTO notifications (user_id, user_type, notification_type, title, message, is_critical, related_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, userType, type, title, message, isCritical || false, null]
          );
          notificationCount++;
          console.log(`✅ Notification created for user ${userId} (${userType})`);
        } catch (err) {
          console.error(`❌ Error creating notification for user ${userId}:`, err);
        }
      }
      result = { success: true, count: notificationCount };
      console.log(`📬 Sent ${notificationCount} notifications to specific users`);
    } else {
      // Send to all users of the specified type
      console.log(`📬 Sending notification to all ${userType}s`);
      result = await createNotificationForUserType(
        userType,
        type,
        title,
        message,
        isCritical || false
      );
      console.log(`✅ Sent ${result.count} notifications to all ${userType}s`);
    }

    res.json(result);
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all as read
router.put('/mark-all-read', async (req, res) => {
  try {
    const { userId, userType } = req.body;
    
    if (!userId || !userType) {
      return res.status(400).json({ error: 'User ID and user type are required' });
    }

    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND user_type = $2 RETURNING COUNT(*)',
      [userId, userType]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

