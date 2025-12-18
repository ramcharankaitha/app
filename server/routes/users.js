const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, role, store_allocated, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, username, password, storeAllocated, address, city, state, pincode } = req.body;

    if (!firstName || !lastName || !email || !username || !password) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    if (!passwordHash) {
      console.error('Password hash creation failed');
      return res.status(500).json({ error: 'Failed to hash password' });
    }

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, username, password_hash, store_allocated, address, city, state, pincode, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, first_name, last_name, email, username, role, store_allocated`,
      [firstName, lastName, email, username, passwordHash, storeAllocated || null, address || null, city || null, state || null, pincode || null, 'Supervisor']
    );
    
    console.log('Supervisor created successfully:', result.rows[0].username);

    res.status(201).json({
      success: true,
      user: result.rows[0],
      message: 'Supervisor created successfully'
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, storeAllocated, address, city, state, pincode, role } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           store_allocated = COALESCE($4, store_allocated),
           address = COALESCE($5, address),
           city = COALESCE($6, city),
           state = COALESCE($7, state),
           pincode = COALESCE($8, pincode),
           role = COALESCE($9, role),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING id, first_name, last_name, email, role, store_allocated`,
      [firstName, lastName, email, storeAllocated, address, city, state, pincode, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    res.json({
      success: true,
      user: result.rows[0],
      message: 'Supervisor updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

