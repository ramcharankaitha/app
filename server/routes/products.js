const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const { productName, itemCode, skuCode, minimumQuantity } = req.body;

    if (!productName || !itemCode || !skuCode) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const result = await pool.query(
      `INSERT INTO products (product_name, item_code, sku_code, minimum_quantity, current_quantity, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [productName, itemCode, skuCode, minimumQuantity || 0, 0, 'STOCK']
    );

    res.status(201).json({
      success: true,
      product: result.rows[0],
      message: 'Product created successfully'
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Item code or SKU code already exists' });
    }
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

