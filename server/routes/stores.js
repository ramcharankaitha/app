const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all stores
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, store_name, store_code, city, state, status, address, phone, email FROM stores ORDER BY store_name ASC'
    );
    
    res.json({
      success: true,
      stores: result.rows
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get store by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM stores WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    res.json({
      success: true,
      store: result.rows[0]
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

