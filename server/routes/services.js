const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all services
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services ORDER BY created_at DESC'
    );
    res.json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create service
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      warranty,
      unwarranty,
      itemCode,
      brandName,
      productName,
      serialNumber,
      serviceDate,
      handlerId,
      handlerName,
      handlerPhone,
      createdBy
    } = req.body;

    if (!customerName || !serviceDate) {
      return res.status(400).json({ error: 'Customer name and service date are required' });
    }

    const result = await pool.query(
      `INSERT INTO services (
        customer_name, warranty, unwarranty, item_code, brand_name, product_name, 
        serial_number, service_date, handler_id, handler_name, handler_phone, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        customerName,
        warranty || false,
        unwarranty || false,
        itemCode || null,
        brandName || null,
        productName || null,
        serialNumber || null,
        serviceDate,
        handlerId || null,
        handlerName || null,
        handlerPhone || null,
        createdBy || 'system'
      ]
    );

    res.status(201).json({
      success: true,
      service: result.rows[0],
      message: 'Service created successfully'
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

