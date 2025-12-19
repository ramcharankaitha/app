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
      const adminResult = await pool.query(
        'SELECT * FROM admin_profile WHERE email = $1',
        [email]
      );

      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0];
        
        if (admin.password_hash) {
          const isValid = await bcrypt.compare(password, admin.password_hash);
          if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
          }
        }
        
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

      const staffResult = await pool.query(
        'SELECT * FROM staff WHERE username = $1',
        [username]
      );

      if (staffResult.rows.length > 0) {
        const staff = staffResult.rows[0];
        
        if (!staff.password_hash) {
          console.error('Staff has no password hash:', staff.username);
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
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

