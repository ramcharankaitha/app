const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM suppliers ORDER BY created_at DESC'
    );
    res.json({ success: true, suppliers: result.rows });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ success: true, supplier: result.rows[0] });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new supplier
router.post('/', async (req, res) => {
  try {
    const { supplierName, phone, address, email } = req.body;

    if (!supplierName) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const result = await pool.query(
      `INSERT INTO suppliers (supplier_name, phone, address, email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        supplierName,
        phone || null,
        address || null,
        email || null
      ]
    );

    res.status(201).json({
      success: true,
      supplier: result.rows[0],
      message: 'Supplier created successfully'
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Supplier already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { supplierName, phone, address, email } = req.body;

    if (!supplierName) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const result = await pool.query(
      `UPDATE suppliers 
       SET supplier_name = $1, 
           phone = $2, 
           address = $3, 
           email = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [supplierName, phone || null, address || null, email || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      success: true,
      supplier: result.rows[0],
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

