const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/all', async (req, res) => {
  try {
    const [usersResult, staffResult, productsResult, storesResult] = await Promise.all([
      pool.query('SELECT * FROM users ORDER BY created_at DESC'),
      pool.query('SELECT * FROM staff ORDER BY created_at DESC'),
      pool.query('SELECT * FROM products ORDER BY created_at DESC'),
      pool.query('SELECT * FROM stores ORDER BY created_at DESC')
    ]);

    const exportData = {
      users: usersResult.rows,
      staff: staffResult.rows,
      products: productsResult.rows,
      stores: storesResult.rows,
      exportDate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/sales', async (req, res) => {
  try {
    const salesResult = await pool.query(
      `SELECT 
        c.id,
        c.full_name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        c.address AS customer_address,
        c.item_code,
        p.product_name,
        c.quantity,
        c.mrp,
        c.discount,
        c.sell_rate,
        (c.quantity * c.sell_rate) AS total_amount,
        c.payment_mode,
        c.created_at AS sale_date
      FROM customers c
      LEFT JOIN products p ON c.item_code = p.item_code
      WHERE c.item_code IS NOT NULL AND c.quantity > 0
      ORDER BY c.created_at DESC`
    );

    res.json({
      success: true,
      sales: salesResult.rows
    });
  } catch (error) {
    console.error('Export sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

