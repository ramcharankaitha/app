const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email || 'not provided');
    console.log('Username:', username || 'not provided');
    console.log('Password provided:', !!password);

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Ensure password_hash column exists in all tables
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
    } catch (colError) {
      console.warn('Column check warning (may already exist):', colError.message);
    }

    if (email) {
      // Trim and normalize email (case-insensitive)
      const trimmedEmail = email.trim().toLowerCase();
      
      const adminResult = await pool.query(
        'SELECT * FROM admin_profile WHERE LOWER(TRIM(email)) = $1',
        [trimmedEmail]
      );

      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0];
        
        // Password hash is REQUIRED - reject if missing
        if (!admin.password_hash) {
          console.error('Admin has no password hash:', admin.email);
          return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        console.log('Attempting login for admin:', admin.email);
        const isValid = await bcrypt.compare(password, admin.password_hash);
        console.log('Password comparison result for admin:', isValid);
        
        if (!isValid) {
          console.error('Password mismatch for admin:', admin.email);
          return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        console.log('Admin login successful:', admin.email);

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
    }

    if (username) {
      // Trim whitespace from username for lookup
      const trimmedUsername = username.trim().toLowerCase();
      
      if (!trimmedUsername) {
        return res.status(400).json({ error: 'Username cannot be empty' });
      }

      console.log('Looking up supervisor with username:', trimmedUsername);
      const userResult = await pool.query(
        'SELECT * FROM users WHERE LOWER(TRIM(username)) = $1',
        [trimmedUsername]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        
        console.log('Found supervisor:', user.username, 'Has password_hash:', !!user.password_hash);
        
        if (!user.password_hash || user.password_hash.trim() === '') {
          console.error('Supervisor has no password hash:', user.username, 'ID:', user.id);
          return res.status(401).json({ 
            error: 'Account setup incomplete. Please contact administrator to set your password.' 
          });
        }
        
        console.log('Attempting password comparison for supervisor:', user.username);
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('Password comparison result for supervisor:', isValid);
        
        if (!isValid) {
          console.error('Password mismatch for supervisor:', user.username);
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        console.log('Supervisor login successful:', user.username);

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

      // Trim whitespace from username for staff lookup (same as supervisor)
      console.log('Looking up staff with username:', trimmedUsername);
      const staffResult = await pool.query(
        'SELECT * FROM staff WHERE LOWER(TRIM(username)) = $1',
        [trimmedUsername]
      );

      if (staffResult.rows.length > 0) {
        const staff = staffResult.rows[0];
        
        console.log('Found staff:', staff.username, 'Has password_hash:', !!staff.password_hash);
        
        if (!staff.password_hash || staff.password_hash.trim() === '') {
          console.error('Staff has no password hash:', staff.username, 'ID:', staff.id);
          return res.status(401).json({ 
            error: 'Account setup incomplete. Please contact administrator to set your password.' 
          });
        }
        
        console.log('Attempting password comparison for staff:', staff.username);
        const isValid = await bcrypt.compare(password, staff.password_hash);
        console.log('Password comparison result for staff:', isValid);
        
        if (!isValid) {
          console.error('Password mismatch for staff:', staff.username);
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        console.log('Staff login successful:', staff.username);

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
      
      console.log('No user found with username:', trimmedUsername);
    }

    console.log('Login failed: No matching user found');
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

