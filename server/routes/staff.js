const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

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

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const staffResult = await pool.query(
      'SELECT * FROM staff WHERE id = $1',
      [id]
    );
    
    if (staffResult.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const staff = staffResult.rows[0];

    const salesResult = await pool.query(
      `SELECT c.*, p.product_name 
       FROM customers c 
       LEFT JOIN products p ON c.item_code = p.item_code 
       WHERE c.item_code IS NOT NULL AND c.quantity > 0
       ORDER BY c.created_at DESC 
       LIMIT 50`
    );

    res.json({
      success: true,
      staff: staff,
      sales: salesResult.rows
    });
  } catch (error) {
    console.error('Get staff by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { fullName, email, username, password, storeAllocated, address } = req.body;

    if (!fullName || !email || !username || !password) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
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

