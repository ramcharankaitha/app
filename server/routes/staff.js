const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

// Multer storage configuration for Aadhar files
const aadharStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/aadhar');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'aadhar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadAadhar = multer({
  storage: aadharStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image (jpeg, jpg, png, gif, webp) and PDF files are allowed for Aadhar copy.'));
    }
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, role, store_allocated, phone, is_handler, created_at FROM staff ORDER BY created_at DESC'
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
    const { fullName, username, password, storeAllocated, address, city, state, pincode, isHandler, phoneNumber, salary } = req.body;

    if (!fullName || !username || !password) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    if (!passwordHash) {
      console.error('Password hash creation failed');
      return res.status(500).json({ error: 'Failed to hash password' });
    }

    let result;
    try {
      result = await pool.query(
        `INSERT INTO staff (full_name, username, password_hash, store_allocated, address, city, state, pincode, is_handler, role, salary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, full_name, username, role, store_allocated, is_handler`,
        [fullName, username, passwordHash, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'Staff', salary || null]
      );
    } catch (colError) {
      if (colError.code === '42703') { // undefined_column error
        result = await pool.query(
          `INSERT INTO staff (full_name, username, password_hash, store_allocated, address, city, state, pincode, is_handler, role)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, full_name, username, role, store_allocated, is_handler`,
          [fullName, username, passwordHash, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'Staff']
        );
      } else {
        throw colError;
      }
    }
    
    console.log('Staff created successfully:', result.rows[0].username);

    res.status(201).json({
      success: true,
      staff: result.rows[0],
      message: 'Staff created successfully'
    });
  } catch (error) {
    console.error('Create staff error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      constraint: error.constraint
    });
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    if (error.code === '23502') {
      return res.status(400).json({ error: `Required field missing: ${error.column || 'unknown'}` });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please check server logs'
    });
  }
});

// Route for creating staff with file upload
router.post('/upload', uploadAadhar.single('aadharCopy'), async (req, res) => {
  try {
    const { fullName, username, password, storeAllocated, address, city, state, pincode, isHandler, phoneNumber, salary } = req.body;
    const aadharFilePath = req.file ? `/uploads/aadhar/${req.file.filename}` : null;

    if (!fullName || !username || !password) {
      return res.status(400).json({ error: 'Required fields: fullName, username, password' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    if (!passwordHash) {
      console.error('Password hash creation failed');
      return res.status(500).json({ error: 'Failed to hash password' });
    }

    let result;
    try {
      result = await pool.query(
        `INSERT INTO staff (full_name, username, password_hash, store_allocated, address, city, state, pincode, is_handler, role, salary, aadhar_file_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, full_name, username, role, store_allocated, is_handler`,
        [fullName, username, passwordHash, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'Staff', salary || null, aadharFilePath]
      );
    } catch (colError) {
      if (colError.code === '42703') { // undefined_column error
        // Try without salary and aadhar_file_path
        try {
          result = await pool.query(
            `INSERT INTO staff (full_name, username, password_hash, store_allocated, address, city, state, pincode, is_handler, role, salary)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id, full_name, username, role, store_allocated, is_handler`,
            [fullName, username, passwordHash, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'Staff', salary || null]
          );
        } catch (colError2) {
          if (colError2.code === '42703') {
            // Fallback to original schema without salary and aadhar
            result = await pool.query(
              `INSERT INTO staff (full_name, username, password_hash, store_allocated, address, city, state, pincode, is_handler, role)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               RETURNING id, full_name, username, role, store_allocated, is_handler`,
              [fullName, username, passwordHash, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'Staff']
            );
          } else {
            throw colError2;
          }
        }
      } else {
        throw colError;
      }
    }

    res.status(201).json({
      success: true,
      staff: result.rows[0],
      message: 'Staff created successfully',
      aadharFilePath: aadharFilePath
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Update staff (must be before /:id route)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, username, phone, storeAllocated, address, city, state, pincode, isHandler } = req.body;

    // Check if staff exists
    const staffCheck = await pool.query('SELECT id FROM staff WHERE id = $1', [id]);
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Update all provided fields
    const result = await pool.query(
      `UPDATE staff 
       SET full_name = COALESCE($1, full_name),
           username = COALESCE($2, username),
           phone = COALESCE($3, phone),
           store_allocated = COALESCE($4, store_allocated),
           address = COALESCE($5, address),
           city = COALESCE($6, city),
           state = COALESCE($7, state),
           pincode = COALESCE($8, pincode),
           is_handler = COALESCE($9, is_handler),
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 
       RETURNING id, full_name, username, role, store_allocated, phone, address, city, state, pincode, is_handler`,
      [
        fullName || null,
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
      return res.status(400).json({ error: 'Username already exists' });
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

