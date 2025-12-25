const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, store_allocated, phone, is_handler, created_at FROM staff ORDER BY created_at DESC'
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
    const { fullName, email, username, password, storeAllocated, address, city, state, pincode, isHandler } = req.body;

    if (!fullName || !email || !username || !password) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    if (!passwordHash) {
      console.error('Password hash creation failed');
      return res.status(500).json({ error: 'Failed to hash password' });
    }

    const result = await pool.query(
      `INSERT INTO staff (full_name, email, username, password_hash, store_allocated, address, city, state, pincode, is_handler, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, full_name, email, username, role, store_allocated, is_handler`,
      [fullName, email, username, passwordHash, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'Staff']
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

// Update staff (must be before /:id route)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, username, phone, storeAllocated, address, city, state, pincode, isHandler } = req.body;

    // Check if staff exists
    const staffCheck = await pool.query('SELECT id FROM staff WHERE id = $1', [id]);
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Update all provided fields
    const result = await pool.query(
      `UPDATE staff 
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           username = COALESCE($3, username),
           phone = COALESCE($4, phone),
           store_allocated = COALESCE($5, store_allocated),
           address = COALESCE($6, address),
           city = COALESCE($7, city),
           state = COALESCE($8, state),
           pincode = COALESCE($9, pincode),
           is_handler = COALESCE($10, is_handler),
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $11 
       RETURNING id, full_name, email, username, role, store_allocated, phone, address, city, state, pincode, is_handler`,
      [
        fullName || null,
        email || null,
        username || null,
        phone || null,
        storeAllocated || null,
        address || null,
        city || null,
        state || null,
        pincode || null,
        isHandler !== undefined ? isHandler : null,
        id
      ]
    );

    res.json({
      success: true,
      staff: result.rows[0],
      message: 'Staff updated successfully'
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    console.error('Update staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save face data for staff (must be before /:id route)
router.post('/face-data', async (req, res) => {
  try {
    const { username, faceImage } = req.body;
    
    console.log('Face data save request received for staff:', username);
    console.log('Face image data length:', faceImage ? faceImage.length : 0);

    if (!username || !faceImage) {
      return res.status(400).json({ error: 'Username and face image are required' });
    }

    // Find staff by username (case-insensitive search)
    const staffResult = await pool.query(
      'SELECT id, username FROM staff WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    if (staffResult.rows.length === 0) {
      // Also check if username exists with different case
      const allStaffResult = await pool.query('SELECT username FROM staff LIMIT 10');
      console.log('Available staff usernames in database:', allStaffResult.rows.map(r => r.username));
      console.log('Searched username:', username);
      return res.status(404).json({ 
        error: `Staff not found with username: ${username}. Please check your username and try again.` 
      });
    }

    const staffId = staffResult.rows[0].id;

    // Store face data as JSONB in PostgreSQL - simple single image
    const faceData = {
      image: faceImage,
      captured_at: new Date().toISOString()
    };

    console.log('Storing face data in PostgreSQL for staff ID:', staffId);
    console.log('Face data size:', JSON.stringify(faceData).length, 'bytes');

    // Store directly in PostgreSQL as JSONB
    const result = await pool.query(
      `UPDATE staff 
       SET face_data = $1::jsonb, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, username, face_data`,
      [JSON.stringify(faceData), staffId]
    );

    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to update face data in database' });
    }

    console.log('Face data successfully stored in PostgreSQL for:', result.rows[0].username);

    console.log('Face data saved successfully for staff:', username);
    
    res.json({
      success: true,
      message: 'Face captured successfully! You can now use face recognition for check-in and check-out.'
    });
  } catch (error) {
    console.error('Save face data error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

module.exports = router;

