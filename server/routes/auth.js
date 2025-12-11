const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Admin login with email
    if (email) {
      // Check admin profile first
      const adminResult = await pool.query(
        'SELECT * FROM admin_profile WHERE email = $1',
        [email]
      );

      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0];
        
        // If password_hash exists, verify password
        if (admin.password_hash) {
          const isValid = await bcrypt.compare(password, admin.password_hash);
          if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
          }
        }
        // If no password_hash set, allow login (for backward compatibility)
        
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

    // Manager/Staff login with username
    if (username) {
      // Check users table (managers)
      const userResult = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        
        // Check if password_hash exists
        if (!user.password_hash) {
          console.error('Manager has no password hash:', user.username);
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Verify password
        console.log('Attempting login for manager:', user.username);
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('Password comparison result:', isValid);
        
        if (!isValid) {
          console.error('Password mismatch for manager:', user.username);
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        console.log('Manager login successful:', user.username);

        return res.json({
          success: true,
          user: {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            role: user.role,
            store: user.store_allocated
          },
          message: 'Login successful'
        });
      }

      // Check staff table
      const staffResult = await pool.query(
        'SELECT * FROM staff WHERE username = $1',
        [username]
      );

      if (staffResult.rows.length > 0) {
        const staff = staffResult.rows[0];
        
        // Check if password_hash exists
        if (!staff.password_hash) {
          console.error('Staff has no password hash:', staff.username);
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Verify password
        const isValid = await bcrypt.compare(password, staff.password_hash);
        if (!isValid) {
          console.error('Password mismatch for staff:', staff.username);
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        return res.json({
          success: true,
          user: {
            id: staff.id,
            name: staff.full_name,
            email: staff.email,
            role: staff.role || 'Staff',
            store: staff.store_allocated
          },
          message: 'Login successful'
        });
      }
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

