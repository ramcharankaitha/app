const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
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
      const trimmedUsername = username.trim();
      const userResult = await pool.query(
        'SELECT * FROM users WHERE LOWER(TRIM(username)) = LOWER($1)',
        [trimmedUsername]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        
        if (!user.password_hash) {
          console.error('Supervisor has no password hash:', user.username);
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        console.log('Attempting login for supervisor:', user.username);
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('Password comparison result:', isValid);
        
        if (!isValid) {
          console.error('Password mismatch for supervisor:', user.username);
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        console.log('Supervisor login successful:', user.username);

        return res.json({
          success: true,
          user: {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            username: user.username,
            role: user.role,
            store: user.store_allocated
          },
          message: 'Login successful'
        });
      }

      // Trim whitespace from username for staff lookup (same as supervisor)
      const trimmedStaffUsername = username.trim();
      const staffResult = await pool.query(
        'SELECT * FROM staff WHERE LOWER(TRIM(username)) = LOWER($1)',
        [trimmedStaffUsername]
      );

      if (staffResult.rows.length > 0) {
        const staff = staffResult.rows[0];
        
        if (!staff.password_hash) {
          console.error('Staff has no password hash:', staff.username);
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        console.log('Attempting login for staff:', staff.username);
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
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

