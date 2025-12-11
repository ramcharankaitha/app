const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Get all staff
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, store_allocated, created_at FROM staff ORDER BY created_at DESC'
    );
    res.json({ success: true, staff: result.rows });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new staff
router.post('/', async (req, res) => {
  try {
    const { fullName, email, username, password, storeAllocated, address } = req.body;

    if (!fullName || !email || !username || !password) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Verify the hash was created (for debugging)
    if (!passwordHash) {
      console.error('Password hash creation failed');
      return res.status(500).json({ error: 'Failed to hash password' });
    }

    const result = await pool.query(
      `INSERT INTO staff (full_name, email, username, password_hash, store_allocated, address, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, full_name, email, username, role, store_allocated`,
      [fullName, email, username, passwordHash, storeAllocated || null, address || null, 'Staff']
    );
    
    console.log('Staff created successfully:', result.rows[0].username);

    res.status(201).json({
      success: true,
      staff: result.rows[0],
      message: 'Staff created successfully'
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

