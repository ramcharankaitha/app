const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Get admin profile
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin_profile LIMIT 1');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update admin profile
router.put('/', async (req, res) => {
  try {
    const { fullName, email, phone, primaryStore, storeScope, timezone, avatarUrl, password, currentPassword } = req.body;
    
    console.log('Profile update request received');
    
    console.log('Profile update request:', { fullName, email, phone, primaryStore, storeScope, timezone, avatarUrl: avatarUrl ? 'provided' : 'not provided', password: password ? 'provided' : 'not provided' });

    // Get current profile to verify password if changing password
    const currentProfile = await pool.query('SELECT * FROM admin_profile LIMIT 1');
    if (currentProfile.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // If password is being changed, verify current password
    if (password) {
      // If admin has a password set, require current password
      if (currentProfile.rows[0].password_hash) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to change password' });
        }
        const isValid = await bcrypt.compare(currentPassword, currentProfile.rows[0].password_hash);
        if (!isValid) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
      }
      // If no password is set, allow setting password without current password (first time setup)
    }

    // Hash new password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(fullName);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (primaryStore !== undefined) {
      updates.push(`primary_store = $${paramCount++}`);
      values.push(primaryStore);
    }
    if (storeScope !== undefined) {
      updates.push(`store_scope = $${paramCount++}`);
      values.push(storeScope);
    }
    if (timezone !== undefined) {
      updates.push(`timezone = $${paramCount++}`);
      values.push(timezone);
    }
    if (avatarUrl !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatarUrl);
    }
    if (passwordHash) {
      updates.push(`password_hash = $${paramCount++}`);
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE admin_profile 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, full_name, email, phone, role, primary_store, store_scope, timezone, avatar_url, created_at, updated_at
    `;
    values.push(currentProfile.rows[0].id);

    console.log('Executing query:', query);
    console.log('With values:', values.map((v, i) => `$${i+1}=${v ? (typeof v === 'string' ? v.substring(0, 50) : String(v)) : 'null'}`));

    const result = await pool.query(query, values);
    
    console.log('Update result:', result.rows.length > 0 ? 'Success' : 'No rows updated');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      success: true,
      profile: result.rows[0],
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile photo
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the file URL (relative path for frontend)
    const fileUrl = `/uploads/avatars/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;
    
    // Update profile with new avatar URL
    const result = await pool.query(
      `UPDATE admin_profile 
       SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM admin_profile LIMIT 1)
       RETURNING id, full_name, email, phone, role, primary_store, store_scope, timezone, avatar_url, created_at, updated_at`
    , [fileUrl]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      success: true,
      avatarUrl: fileUrl,
      fullAvatarUrl: fullUrl,
      profile: result.rows[0],
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

