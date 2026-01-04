const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Initialize password_hash columns once on server start (not on every login)
let columnsInitialized = false;
const ensurePasswordHashColumns = async () => {
  if (columnsInitialized) return;
  
  try {
    // Check and add password_hash to staff if missing
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'staff' 
          AND column_name = 'password_hash'
        ) THEN
          ALTER TABLE staff ADD COLUMN password_hash VARCHAR(255);
          RAISE NOTICE 'Added password_hash column to staff';
        END IF;
      END $$;
    `);

    // Check and add password_hash to users if missing
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'password_hash'
        ) THEN
          ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
          RAISE NOTICE 'Added password_hash column to users';
        END IF;
      END $$;
    `);
    
    columnsInitialized = true;
    console.log('✅ Password hash columns verified');
  } catch (colError) {
    console.warn('⚠️  Column check warning (may already exist):', colError.message);
    // Mark as initialized even if error (column likely already exists)
    columnsInitialized = true;
  }
};

// Initialize columns on module load (non-blocking)
ensurePasswordHashColumns().catch(err => {
  console.error('❌ Error initializing password_hash columns:', err.message);
});

// Helper function to execute query with timeout
const queryWithTimeout = async (queryText, params, timeoutMs = 3000) => {
  const client = await pool.connect();
  try {
    // Set query timeout for this connection
    await client.query(`SET LOCAL statement_timeout = ${timeoutMs}`);
    const result = await client.query(queryText, params);
    return result;
  } finally {
    // Reset timeout and release connection
    try {
      await client.query('RESET statement_timeout');
    } catch (e) {
      // Ignore reset errors
    }
    client.release();
  }
};

router.post('/login', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { email, username, password } = req.body;

    // Basic validation
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Ensure columns are initialized (non-blocking check)
    if (!columnsInitialized) {
      await ensurePasswordHashColumns();
    }

    if (email) {
      // Trim and normalize email (case-insensitive)
      const trimmedEmail = email.trim().toLowerCase();
      
      try {
        // Use optimized query with timeout
        const adminResult = await queryWithTimeout(
          'SELECT id, full_name, email, role, primary_store, password_hash FROM admin_profile WHERE LOWER(TRIM(email)) = $1 LIMIT 1',
          [trimmedEmail],
          3000
        );

        if (adminResult.rows.length > 0) {
          const admin = adminResult.rows[0];
          
          // Password hash is REQUIRED - reject if missing
          if (!admin.password_hash || admin.password_hash.trim() === '') {
            return res.status(401).json({ error: 'Invalid email or password' });
          }
          
          // Compare password
          const isValid = await bcrypt.compare(password, admin.password_hash);
          
          if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
          }

          const duration = Date.now() - startTime;
          console.log(`✅ Admin login successful: ${admin.email} (${duration}ms)`);

          return res.json({
            success: true,
            user: {
              id: admin.id,
              name: admin.full_name,
              email: admin.email,
              role: admin.role || 'Super Admin',
              store: admin.primary_store || 'Global'
            },
            message: 'Login successful'
          });
        }
      } catch (queryError) {
        if (queryError.code === '57014') { // Query timeout
          console.error('❌ Login query timeout for admin:', trimmedEmail);
          return res.status(504).json({ error: 'Login request timed out. Please try again.' });
        }
        throw queryError;
      }
    }

    if (username) {
      // Trim whitespace from username for lookup
      const trimmedUsername = username.trim().toLowerCase();
      
      if (!trimmedUsername) {
        return res.status(400).json({ error: 'Username cannot be empty' });
      }

      try {
        // Try supervisor (users table) first
        const userResult = await queryWithTimeout(
          'SELECT id, first_name, last_name, email, username, role, store_allocated, password_hash FROM users WHERE LOWER(TRIM(username)) = $1 LIMIT 1',
          [trimmedUsername],
          3000
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          
          if (!user.password_hash || user.password_hash.trim() === '') {
            return res.status(401).json({ 
              error: 'Account setup incomplete. Please contact administrator to set your password.' 
            });
          }
          
          const isValid = await bcrypt.compare(password, user.password_hash);
          
          if (!isValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
          }

          const duration = Date.now() - startTime;
          console.log(`✅ Supervisor login successful: ${user.username} (${duration}ms)`);

          return res.json({
            success: true,
            user: {
              id: user.id,
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
              email: user.email,
              username: user.username,
              role: user.role,
              store: user.store_allocated
            },
            message: 'Login successful'
          });
        }

        // Try staff table
        const staffResult = await queryWithTimeout(
          'SELECT id, full_name, email, username, role, store_allocated, password_hash FROM staff WHERE LOWER(TRIM(username)) = $1 LIMIT 1',
          [trimmedUsername],
          3000
        );

        if (staffResult.rows.length > 0) {
          const staff = staffResult.rows[0];
          
          if (!staff.password_hash || staff.password_hash.trim() === '') {
            return res.status(401).json({ 
              error: 'Account setup incomplete. Please contact administrator to set your password.' 
            });
          }
          
          const isValid = await bcrypt.compare(password, staff.password_hash);
          
          if (!isValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
          }

          const duration = Date.now() - startTime;
          console.log(`✅ Staff login successful: ${staff.username} (${duration}ms)`);

          return res.json({
            success: true,
            user: {
              id: staff.id,
              name: staff.full_name,
              email: staff.email,
              username: staff.username,
              role: staff.role || 'Staff',
              store: staff.store_allocated
            },
            message: 'Login successful'
          });
        }
      } catch (queryError) {
        if (queryError.code === '57014') { // Query timeout
          console.error('❌ Login query timeout for username:', trimmedUsername);
          return res.status(504).json({ error: 'Login request timed out. Please try again.' });
        }
        throw queryError;
      }
    }

    // No matching credentials found
    const duration = Date.now() - startTime;
    console.log(`❌ Login failed: Invalid credentials (${duration}ms)`);
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Login error:', error.message);
    
    // Handle specific database errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ 
        error: 'Database connection failed. Please try again in a moment.' 
      });
    }
    
    if (error.code === '57014') { // Query timeout
      return res.status(504).json({ 
        error: 'Login request timed out. Please try again.' 
      });
    }
    
    // Generic error
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

