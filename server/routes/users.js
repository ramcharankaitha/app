const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Ensure email is optional in users table - URGENT FIX for hosted server
const ensureEmailOptional = async () => {
  try {
    // Aggressively remove all email constraints
    try {
      await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key');
      await pool.query('ALTER TABLE users ALTER COLUMN email DROP NOT NULL');
      console.log('✅ Removed NOT NULL constraint from users.email');
    } catch (e) {
      if (e.code !== '42703' && e.code !== '42P01') {
        console.error('Error removing NOT NULL from users.email:', e.message);
      }
    }
    
    // Also fix staff table
    try {
      await pool.query('ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_email_key');
      await pool.query('ALTER TABLE staff ALTER COLUMN email DROP NOT NULL');
      console.log('✅ Removed NOT NULL constraint from staff.email');
    } catch (e) {
      // Ignore errors
    }
  } catch (error) {
    console.error('Error ensuring email is optional:', error.message);
  }
};

// Run migration immediately
ensureEmailOptional().catch(err => {
  console.log('⚠️  Email migration failed, will retry on first use');
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, role, store_allocated, phone, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
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
    const { firstName, lastName, username, password, storeAllocated, address, city, state, pincode, phone } = req.body;

    // Validate required fields - trim whitespace and check
    const trimmedFirstName = firstName ? firstName.trim() : '';
    const trimmedLastName = lastName ? lastName.trim() : '';
    const trimmedUsername = username ? username.trim() : '';
    const trimmedPassword = password ? password.trim() : '';
    const trimmedPhone = phone ? phone.trim() : '';

    // firstName is required, lastName can be empty (supervisor name might be single word)
    if (!trimmedFirstName || !trimmedUsername || !trimmedPassword || !trimmedPhone) {
      return res.status(400).json({ 
        error: 'Required fields are missing',
        missing: {
          firstName: !trimmedFirstName,
          lastName: false, // lastName is optional
          username: !trimmedUsername,
          password: !trimmedPassword,
          phone: !trimmedPhone
        }
      });
    }

    // Check if phone number already exists (phone is unique identifier)
    const phoneCheck = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [trimmedPhone]
    );
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Phone number already exists' });
    }

    // Check if username already exists
    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1',
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

    let result;
    try {
      // Try with 'SUPERVISOR' role (uppercase) - DO NOT include email at all
      // Use trimmed values and ensure lastName is not empty string (use null if empty)
      result = await pool.query(
        `INSERT INTO users (first_name, last_name, username, password_hash, phone, store_allocated, address, city, state, pincode, role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
         RETURNING id, first_name, last_name, username, phone, role, store_allocated`,
        [trimmedFirstName, trimmedLastName || null, trimmedUsername, passwordHash, trimmedPhone, storeAllocated || null, address || null, city || null, state || null, pincode || null, 'SUPERVISOR']
      );
    } catch (insertError) {
      if (insertError.code === '42703') { // undefined_column error (email might not exist in some schemas)
        // Try without email column
        try {
          result = await pool.query(
            `INSERT INTO users (first_name, last_name, username, password_hash, phone, store_allocated, address, city, state, pincode, role, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
             RETURNING id, first_name, last_name, username, phone, role, store_allocated`,
            [trimmedFirstName, trimmedLastName || null, trimmedUsername, passwordHash, trimmedPhone, storeAllocated || null, address || null, city || null, state || null, pincode || null, 'SUPERVISOR']
          );
        } catch (roleError) {
          // If role enum doesn't accept 'SUPERVISOR', try 'Supervisor'
          if (roleError.code === '23502' || roleError.message.includes('role')) {
            result = await pool.query(
              `INSERT INTO users (first_name, last_name, username, password_hash, phone, store_allocated, address, city, state, pincode, role, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
               RETURNING id, first_name, last_name, username, phone, role, store_allocated`,
              [trimmedFirstName, trimmedLastName || null, trimmedUsername, passwordHash, trimmedPhone, storeAllocated || null, address || null, city || null, state || null, pincode || null, 'Supervisor']
            );
          } else {
            throw roleError;
          }
        }
      } else if (insertError.code === '23502' && insertError.column === 'email') {
        // Email constraint error - try to fix and retry
        try {
          await ensureEmailOptional();
          result = await pool.query(
            `INSERT INTO users (first_name, last_name, username, password_hash, phone, store_allocated, address, city, state, pincode, role, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
             RETURNING id, first_name, last_name, username, phone, role, store_allocated`,
            [trimmedFirstName, trimmedLastName || null, trimmedUsername, passwordHash, trimmedPhone, storeAllocated || null, address || null, city || null, state || null, pincode || null, 'SUPERVISOR']
          );
        } catch (retryError) {
          throw insertError;
        }
      } else if (insertError.code === '23502' || insertError.message.includes('role')) {
        // If role enum doesn't accept 'SUPERVISOR', try 'Supervisor'
        result = await pool.query(
          `INSERT INTO users (first_name, last_name, username, password_hash, phone, store_allocated, address, city, state, pincode, role, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
           RETURNING id, first_name, last_name, username, phone, role, store_allocated`,
          [trimmedFirstName, trimmedLastName || null, trimmedUsername, passwordHash, trimmedPhone, storeAllocated || null, address || null, city || null, state || null, pincode || null, 'Supervisor']
        );
      } else {
        throw insertError;
      }
    }
    
    console.log('Supervisor created successfully:', result.rows[0].username, 'Phone:', result.rows[0].phone);

    res.status(201).json({
      success: true,
      user: result.rows[0],
      message: 'Supervisor created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
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
          error: 'Database constraint error: Email field has NOT NULL constraint. Please run this SQL: ALTER TABLE users ALTER COLUMN email DROP NOT NULL;',
          column: error.column,
          fix: 'Run SQL: ALTER TABLE users ALTER COLUMN email DROP NOT NULL;'
        });
      }
      return res.status(400).json({ 
        error: `Required field missing: ${error.column || 'unknown'}. Please check database constraints.`,
        column: error.column
      });
    }
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Invalid reference data' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please check server logs',
      code: process.env.NODE_ENV === 'development' ? error.code : undefined
    });
  }
});

// Save face data for supervisor (must be before /:id route)
router.post('/face-data', async (req, res) => {
  try {
    const { username, faceImage } = req.body;
    
    console.log('Face data save request received for supervisor:', username);
    console.log('Face image data length:', faceImage ? faceImage.length : 0);

    if (!username || !faceImage) {
      return res.status(400).json({ error: 'Username and face image are required' });
    }

    // Trim whitespace from username
    const trimmedUsername = username.trim();
    
    // Find user by username (case-insensitive and trimmed search)
    const userResult = await pool.query(
      'SELECT id, username FROM users WHERE LOWER(TRIM(username)) = LOWER($1)',
      [trimmedUsername]
    );

    if (userResult.rows.length === 0) {
      // Also check if username exists with different case
      const allUsersResult = await pool.query('SELECT id, username FROM users ORDER BY id LIMIT 20');
      console.log('Available supervisors in database:', allUsersResult.rows.map(r => ({ id: r.id, username: r.username })));
      console.log('Searched username (trimmed):', trimmedUsername);
      console.log('Searched username (original):', username);
      return res.status(404).json({ 
        error: `Supervisor not found with username: "${trimmedUsername}". Available supervisors in database. Check server logs for details.` 
      });
    }
    
    console.log('Found supervisor:', userResult.rows[0].username, 'ID:', userResult.rows[0].id);

    const userId = userResult.rows[0].id;

    // Store face data as JSONB in PostgreSQL - simple single image
    const faceData = {
      image: faceImage,
      captured_at: new Date().toISOString()
    };

    console.log('Storing face data in PostgreSQL for user ID:', userId);
    console.log('Face data size:', JSON.stringify(faceData).length, 'bytes');

    // Store directly in PostgreSQL as JSONB
    const result = await pool.query(
      `UPDATE users 
       SET face_data = $1::jsonb, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, username, face_data`,
      [JSON.stringify(faceData), userId]
    );

    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to update face data in database' });
    }

    console.log('Face data successfully stored in PostgreSQL for:', result.rows[0].username);

    console.log('Face data saved successfully for supervisor:', username);
    
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

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, storeAllocated, address, city, state, pincode, role } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           store_allocated = COALESCE($3, store_allocated),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           state = COALESCE($6, state),
           pincode = COALESCE($7, pincode),
           role = COALESCE($8, role),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, first_name, last_name, role, store_allocated`,
      [firstName, lastName, storeAllocated, address, city, state, pincode, role, id]
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

