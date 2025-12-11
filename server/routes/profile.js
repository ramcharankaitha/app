const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get admin profile
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin_profile LIMIT 1');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update admin profile
router.put('/', async (req, res) => {
  try {
    const { fullName, email, phone, primaryStore, storeScope, timezone } = req.body;

    const result = await pool.query(
      `UPDATE admin_profile 
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           primary_store = COALESCE($4, primary_store),
           store_scope = COALESCE($5, store_scope),
           timezone = COALESCE($6, timezone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM admin_profile LIMIT 1)
       RETURNING *`
    , [fullName, email, phone, primaryStore, storeScope, timezone]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      success: true,
      profile: result.rows[0],
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

