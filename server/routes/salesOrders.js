const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all sales orders
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sales_records ORDER BY created_at DESC'
    );
    res.json({ success: true, salesOrders: result.rows });
  } catch (error) {
    console.error('Get sales orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sales order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM sales_records WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    
    res.json({ success: true, salesOrder: result.rows[0] });
  } catch (error) {
    console.error('Get sales order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create sales order
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerContact,
      handlerId,
      handlerName,
      handlerMobile,
      dateOfDuration,
      supplierName,
      supplierNumber,
      products,
      totalAmount,
      createdBy
    } = req.body;

    if (!customerName || !customerContact || !dateOfDuration) {
      return res.status(400).json({ error: 'Customer name, contact, and date of duration are required' });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'At least one product is required' });
    }

    const productsJson = JSON.stringify(products);

    const result = await pool.query(
      `INSERT INTO sales_records (
        customer_name, customer_contact, handler_id, handler_name, handler_mobile,
        date_of_duration, supplier_name, supplier_number, products, total_amount, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        customerName,
        customerContact,
        handlerId || null,
        handlerName || null,
        handlerMobile || null,
        dateOfDuration,
        supplierName || null,
        supplierNumber || null,
        productsJson,
        totalAmount || 0,
        createdBy || 'system'
      ]
    );

    res.status(201).json({
      success: true,
      salesOrder: result.rows[0],
      message: 'Sales order created successfully'
    });
  } catch (error) {
    console.error('Create sales order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
