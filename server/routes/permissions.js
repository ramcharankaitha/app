const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all role permissions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, role_name, permissions, created_at, updated_at FROM role_permissions ORDER BY role_name ASC'
    );
    
    // Parse JSON permissions
    const permissions = result.rows.map(row => ({
      ...row,
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions
    }));
    
    res.json({
      success: true,
      rolePermissions: permissions
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get permissions for a specific role
router.get('/:roleName', async (req, res) => {
  try {
    const { roleName } = req.params;
    const result = await pool.query(
      'SELECT * FROM role_permissions WHERE role_name = $1',
      [roleName]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role permissions not found' });
    }
    
    const rolePerm = result.rows[0];
    rolePerm.permissions = typeof rolePerm.permissions === 'string' 
      ? JSON.parse(rolePerm.permissions) 
      : rolePerm.permissions;
    
    res.json({
      success: true,
      rolePermission: rolePerm
    });
  } catch (error) {
    console.error('Get role permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update role permissions
router.put('/:roleName', async (req, res) => {
  try {
    const { roleName } = req.params;
    const { permissions } = req.body;
    
    if (!permissions) {
      return res.status(400).json({ error: 'Permissions are required' });
    }
    
    // Check if role exists
    const checkRole = await pool.query(
      'SELECT id FROM role_permissions WHERE role_name = $1',
      [roleName]
    );
    
    if (checkRole.rows.length === 0) {
      // Create new role permission
      const result = await pool.query(
        `INSERT INTO role_permissions (role_name, permissions, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         RETURNING id, role_name, permissions, created_at, updated_at`,
        [roleName, JSON.stringify(permissions)]
      );
      
      const rolePerm = result.rows[0];
      rolePerm.permissions = JSON.parse(rolePerm.permissions);
      
      res.json({
        success: true,
        rolePermission: rolePerm,
        message: 'Role permissions created successfully'
      });
    } else {
      // Update existing role permission
      const result = await pool.query(
        `UPDATE role_permissions 
         SET permissions = $1, updated_at = CURRENT_TIMESTAMP
         WHERE role_name = $2
         RETURNING id, role_name, permissions, created_at, updated_at`,
        [JSON.stringify(permissions), roleName]
      );
      
      const rolePerm = result.rows[0];
      rolePerm.permissions = JSON.parse(rolePerm.permissions);
      
      res.json({
        success: true,
        rolePermission: rolePerm,
        message: 'Role permissions updated successfully'
      });
    }
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

