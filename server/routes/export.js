const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Increase body size limit for CSV content
router.use(express.json({ limit: '10mb' }));
router.use(express.text({ limit: '10mb' }));

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

// Download CSV endpoint for mobile APK compatibility
// This endpoint accepts CSV content and returns it as a downloadable file with proper headers
router.post('/download-csv', async (req, res) => {
  try {
    const { content, filename } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'CSV content is required' });
    }

    const downloadFilename = filename || `export_${new Date().toISOString().split('T')[0]}.csv`;

    // Set headers for file download - these are crucial for mobile downloads
    res.setHeader('Content-Type', 'text/csv;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(content, 'utf8'));
    
    // Set cache control headers to prevent caching issues
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send the CSV content directly
    res.send(content);
  } catch (error) {
    console.error('Download CSV error:', error);
    res.status(500).json({ error: 'Failed to download CSV file' });
  }
});

module.exports = router;

