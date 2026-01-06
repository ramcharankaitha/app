const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

// Ensure email is optional in staff table - URGENT FIX for hosted server
const ensureEmailOptional = async () => {
  try {
    // Aggressively remove all email constraints
    try {
      await pool.query('ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_email_key');
    } catch (e) {
      // Ignore if constraint doesn't exist
    }
    
    try {
      await pool.query('ALTER TABLE staff ALTER COLUMN email DROP NOT NULL');
      console.log('✅ Removed NOT NULL constraint from staff.email');
    } catch (e) {
      if (e.code !== '42703') { // Ignore if column doesn't exist
        console.error('Error removing NOT NULL from staff.email:', e.message);
      }
    }
    
    // Also fix users table
    try {
      await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key');
      await pool.query('ALTER TABLE users ALTER COLUMN email DROP NOT NULL');
      console.log('✅ Removed NOT NULL constraint from users.email');
    } catch (e) {
      // Ignore errors
    }
    
    // Also fix customers table
    try {
      await pool.query('ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key');
      await pool.query('ALTER TABLE customers ALTER COLUMN email DROP NOT NULL');
      console.log('✅ Removed NOT NULL constraint from customers.email');
    } catch (e) {
      // Ignore errors
    }
  } catch (error) {
    console.error('Error ensuring email is optional:', error.message);
  }
};

// Run migration immediately and aggressively
ensureEmailOptional().catch(err => {
  console.log('⚠️  Email migration failed, will retry on first use');
});

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

// Multer storage configuration for staff photos
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/staff-photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'staff-photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed for photos.'));
    }
  }
});

router.get('/', async (req, res) => {
  try {
    // Ensure avatar_url column exists
    await ensureAvatarUrlColumn();
    const result = await pool.query(
      'SELECT id, full_name, role, store_allocated, phone, is_handler, avatar_url, created_at FROM staff ORDER BY created_at DESC'
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

// Ensure avatar_url column exists in staff table
const ensureAvatarUrlColumn = async () => {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'staff' 
      AND column_name = 'avatar_url'
    `);
    if (result.rows.length === 0) {
      await pool.query('ALTER TABLE staff ADD COLUMN avatar_url TEXT');
      console.log('✅ Added avatar_url column to staff table');
    }
  } catch (error) {
    console.warn('⚠️  Error checking/adding avatar_url column:', error.message);
  }
};

// Run migration on module load
ensureAvatarUrlColumn().catch(err => {
  console.log('⚠️  Avatar URL migration failed, will retry on first use');
});

router.post('/', async (req, res) => {
  try {
    const { fullName, username, password, storeAllocated, address, city, state, pincode, isHandler, phoneNumber, salary, photo } = req.body;
    
    // Ensure avatar_url column exists
    await ensureAvatarUrlColumn();

    // Validate required fields
    if (!fullName || !username || !password || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Required fields are missing',
        missing: {
          fullName: !fullName,
          username: !username,
          password: !password,
          phoneNumber: !phoneNumber
        }
      });
    }

    // Trim username to avoid whitespace issues
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      return res.status(400).json({ error: 'Username cannot be empty or only whitespace' });
    }

    // Check if phone number already exists (phone is unique identifier)
    const phoneCheck = await pool.query(
      'SELECT id FROM staff WHERE phone = $1',
      [phoneNumber]
    );
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Phone number already exists' });
    }

    // Check if username already exists (case-insensitive, trimmed)
    const usernameCheck = await pool.query(
      'SELECT id FROM staff WHERE LOWER(TRIM(username)) = LOWER($1)',
      [trimmedUsername]
    );
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    if (!passwordHash) {
      console.error('Password hash creation failed');
      return res.status(500).json({ error: 'Failed to hash password' });
    }

    // Ensure email constraint is removed before insert (for hosted server)
    await ensureEmailOptional();

    // Handle photo - if it's base64, store it directly; if it's a file path, use that
    let avatarUrl = null;
    if (photo) {
      // If photo is base64 data URL, store it directly
      if (photo.startsWith('data:image')) {
        avatarUrl = photo;
      } else {
        avatarUrl = photo;
      }
    }

    let result;
    try {
      // Try with all columns including phone, salary, avatar_url - DO NOT include email at all
      result = await pool.query(
        `INSERT INTO staff (full_name, username, password_hash, phone, store_allocated, address, city, state, pincode, is_handler, role, salary, avatar_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
         RETURNING id, full_name, username, phone, role, store_allocated, is_handler, avatar_url`,
        [fullName, trimmedUsername, passwordHash, phoneNumber, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'STAFF', salary || null, avatarUrl]
      );
    } catch (colError) {
      // If it's a NOT NULL violation on email, try to fix it and retry
      if (colError.code === '23502' && colError.column === 'email') {
        try {
          await ensureEmailOptional();
          // Retry the insert
          result = await pool.query(
            `INSERT INTO staff (full_name, username, password_hash, phone, store_allocated, address, city, state, pincode, is_handler, role, salary, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
             RETURNING id, full_name, username, phone, role, store_allocated, is_handler`,
            [fullName, trimmedUsername, passwordHash, phoneNumber, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'STAFF', salary || null]
          );
        } catch (retryError) {
          throw colError; // Throw original error if retry fails
        }
      } else if (colError.code === '42703') { // undefined_column error (email or salary might not exist)
        try {
          // Try without email and salary
          result = await pool.query(
            `INSERT INTO staff (full_name, username, password_hash, phone, store_allocated, address, city, state, pincode, is_handler, role, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
             RETURNING id, full_name, username, phone, role, store_allocated, is_handler`,
            [fullName, trimmedUsername, passwordHash, phoneNumber, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'STAFF']
          );
        } catch (colError2) {
          if (colError2.code === '42703') {
            // Fallback: try with 'Staff' instead of 'STAFF' for role
            result = await pool.query(
              `INSERT INTO staff (full_name, username, password_hash, phone, store_allocated, address, city, state, pincode, is_handler, role, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
               RETURNING id, full_name, username, phone, role, store_allocated, is_handler`,
              [fullName, trimmedUsername, passwordHash, phoneNumber, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'Staff']
            );
          } else {
            throw colError2;
          }
        }
      } else {
        throw colError;
      }
    }
    
    // Verify password_hash was saved correctly
    const verifyResult = await pool.query(
      'SELECT id, username, password_hash FROM staff WHERE id = $1',
      [result.rows[0].id]
    );
    
    if (verifyResult.rows.length > 0) {
      const savedStaff = verifyResult.rows[0];
      if (!savedStaff.password_hash || savedStaff.password_hash.trim() === '') {
        console.error('⚠️ CRITICAL: Password hash was not saved for staff:', savedStaff.username);
        // Try to update it
        await pool.query(
          'UPDATE staff SET password_hash = $1 WHERE id = $2',
          [passwordHash, savedStaff.id]
        );
        console.log('✅ Fixed: Updated password_hash for staff:', savedStaff.username);
      } else {
        console.log('✅ Verified: Password hash saved correctly for staff:', savedStaff.username);
      }
    }
    
    console.log('Staff created successfully:', result.rows[0].username, 'Phone:', result.rows[0].phone);

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
      constraint: error.constraint,
      column: error.column,
      stack: error.stack
    });
    
    if (error.code === '23505') { // Unique violation
      if (error.constraint && error.constraint.includes('phone')) {
        return res.status(400).json({ error: 'Phone number already exists' });
      }
      if (error.constraint && error.constraint.includes('username')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(400).json({ error: 'Duplicate entry. Please check phone number and username.' });
    }
    if (error.code === '23502') { // Not null violation
      // If it's email column, provide a helpful message
      if (error.column === 'email') {
        return res.status(400).json({ 
          error: 'Database constraint error: Email field has NOT NULL constraint. Please run this SQL: ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;',
          column: error.column,
          fix: 'Run SQL: ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;'
        });
      }
      return res.status(400).json({ 
        error: `Required field missing: ${error.column || 'unknown'}. Please check database constraints.`,
        column: error.column
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please check server logs',
      code: process.env.NODE_ENV === 'development' ? error.code : undefined
    });
  }
});

// Combined multer for handling both aadhar and photo
const uploadFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadDir;
      if (file.fieldname === 'aadharCopy') {
        uploadDir = path.join(__dirname, '../uploads/aadhar');
      } else if (file.fieldname === 'photo') {
        uploadDir = path.join(__dirname, '../uploads/staff-photos');
      } else {
        uploadDir = path.join(__dirname, '../uploads');
      }
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      if (file.fieldname === 'aadharCopy') {
        cb(null, 'aadhar-' + uniqueSuffix + path.extname(file.originalname));
      } else if (file.fieldname === 'photo') {
        cb(null, 'staff-photo-' + uniqueSuffix + path.extname(file.originalname));
      } else {
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'aadharCopy') {
      const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (extname && mimetype) {
        cb(null, true);
      } else {
        cb(new Error('Only image (jpeg, jpg, png, gif, webp) and PDF files are allowed for Aadhar copy.'));
      }
    } else if (file.fieldname === 'photo') {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (extname && mimetype) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed for photos.'));
      }
    } else {
      cb(null, true);
    }
  }
}).fields([
  { name: 'aadharCopy', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]);

// Route for creating staff with file upload (supports both aadhar and photo)
router.post('/upload', uploadFiles, async (req, res) => {
  try {
    const { fullName, username, password, storeAllocated, address, city, state, pincode, isHandler, phoneNumber, salary } = req.body;
    const aadharFile = req.files && req.files['aadharCopy'] ? req.files['aadharCopy'][0] : null;
    const photoFile = req.files && req.files['photo'] ? req.files['photo'][0] : null;
    const aadharFilePath = aadharFile ? `/uploads/aadhar/${aadharFile.filename}` : null;
    const photoFilePath = photoFile ? `/uploads/staff-photos/${photoFile.filename}` : null;
    
    // Ensure avatar_url column exists
    await ensureAvatarUrlColumn();

    // Validate required fields
    if (!fullName || !username || !password || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Required fields are missing',
        missing: {
          fullName: !fullName,
          username: !username,
          password: !password,
          phoneNumber: !phoneNumber
        }
      });
    }

    // Trim username to avoid whitespace issues
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      return res.status(400).json({ error: 'Username cannot be empty or only whitespace' });
    }

    // Check if phone number already exists (phone is unique identifier)
    const phoneCheck = await pool.query(
      'SELECT id FROM staff WHERE phone = $1',
      [phoneNumber]
    );
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Phone number already exists' });
    }

    // Check if username already exists (case-insensitive, trimmed)
    const usernameCheck = await pool.query(
      'SELECT id FROM staff WHERE LOWER(TRIM(username)) = LOWER($1)',
      [trimmedUsername]
    );
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    if (!passwordHash) {
      console.error('Password hash creation failed');
      return res.status(500).json({ error: 'Failed to hash password' });
    }

    // Ensure email constraint is removed before insert (for hosted server)
    await ensureEmailOptional();

    // Handle photo - use file path if uploaded, otherwise null
    const avatarUrl = photoFilePath || null;

    let result;
    try {
      // Try with all columns including phone, salary, aadhar_file_path, avatar_url - DO NOT include email at all
      result = await pool.query(
        `INSERT INTO staff (full_name, username, password_hash, phone, store_allocated, address, city, state, pincode, is_handler, role, salary, aadhar_file_path, avatar_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
         RETURNING id, full_name, username, phone, role, store_allocated, is_handler, avatar_url`,
        [fullName, trimmedUsername, passwordHash, phoneNumber, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'STAFF', salary || null, aadharFilePath, avatarUrl]
      );
    } catch (colError) {
      // If it's a NOT NULL violation on email, try to fix it and retry
      if (colError.code === '23502' && colError.column === 'email') {
        try {
          await ensureEmailOptional();
          // Retry the insert
          result = await pool.query(
            `INSERT INTO staff (full_name, username, password_hash, phone, store_allocated, address, city, state, pincode, is_handler, role, salary, aadhar_file_path, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
             RETURNING id, full_name, username, phone, role, store_allocated, is_handler`,
            [fullName, trimmedUsername, passwordHash, phoneNumber, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'STAFF', salary || null, aadharFilePath]
          );
        } catch (retryError) {
          throw colError; // Throw original error if retry fails
        }
      } else if (colError.code === '42703') { // undefined_column error (email, salary, or aadhar_file_path might not exist)
        try {
          // Try without email and aadhar_file_path
          result = await pool.query(
            `INSERT INTO staff (full_name, username, password_hash, phone, store_allocated, address, city, state, pincode, is_handler, role, salary, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
             RETURNING id, full_name, username, phone, role, store_allocated, is_handler`,
            [fullName, username, passwordHash, phoneNumber, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'STAFF', salary || null]
          );
        } catch (colError2) {
          if (colError2.code === '42703') {
            // Try without salary
            try {
              result = await pool.query(
                `INSERT INTO staff (full_name, username, password_hash, phone, store_allocated, address, city, state, pincode, is_handler, role, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
                 RETURNING id, full_name, username, phone, role, store_allocated, is_handler`,
                [fullName, username, passwordHash, phoneNumber, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'STAFF']
              );
            } catch (colError3) {
              // Fallback: try with 'Staff' instead of 'STAFF' for role
              result = await pool.query(
                `INSERT INTO staff (full_name, username, password_hash, phone, store_allocated, address, city, state, pincode, is_handler, role, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
                 RETURNING id, full_name, username, phone, role, store_allocated, is_handler`,
                [fullName, trimmedUsername, passwordHash, phoneNumber, storeAllocated || null, address || null, city || null, state || null, pincode || null, isHandler || false, 'Staff']
              );
            }
          } else {
            throw colError2;
          }
        }
      } else {
        throw colError;
      }
    }

    console.log('Staff created successfully:', result.rows[0].username, 'Phone:', result.rows[0].phone);

    res.status(201).json({
      success: true,
      staff: result.rows[0],
      message: 'Staff created successfully',
      aadharFilePath: aadharFilePath
    });
  } catch (error) {
    console.error('Create staff error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      constraint: error.constraint,
      column: error.column,
      stack: error.stack
    });
    
    if (error.code === '23505') { // Unique violation
      if (error.constraint && error.constraint.includes('phone')) {
        return res.status(400).json({ error: 'Phone number already exists' });
      }
      if (error.constraint && error.constraint.includes('username')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(400).json({ error: 'Duplicate entry. Please check phone number and username.' });
    }
    if (error.code === '23502') { // Not null violation
      // If it's email column, provide a helpful message
      if (error.column === 'email') {
        return res.status(400).json({ 
          error: 'Database constraint error: Email field has NOT NULL constraint. Please run this SQL: ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;',
          column: error.column,
          fix: 'Run SQL: ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;'
        });
      }
      return res.status(400).json({ 
        error: `Required field missing: ${error.column || 'unknown'}. Please check database constraints.`,
        column: error.column
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please check server logs',
      code: process.env.NODE_ENV === 'development' ? error.code : undefined
    });
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

// Delete staff
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if staff exists
    const staffCheck = await pool.query('SELECT id, full_name FROM staff WHERE id = $1', [id]);
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    // Check for foreign key constraints (e.g., if staff is referenced in other tables)
    // You can add checks here for related records if needed
    
    // Delete the staff member
    const result = await pool.query('DELETE FROM staff WHERE id = $1 RETURNING id, full_name', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    console.log('Staff deleted successfully:', result.rows[0].full_name);
    
    res.json({
      success: true,
      message: 'Staff deleted successfully',
      deletedStaff: result.rows[0]
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    
    // Handle foreign key constraint violations
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'Cannot delete staff member. This staff member is referenced in other records (e.g., services, sales, etc.). Please remove those references first.' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

