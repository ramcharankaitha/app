const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

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

module.exports = router;

