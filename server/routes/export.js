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
    const { startDate, endDate } = req.query;
    
    // Build WHERE clause for date filtering
    let dateFilter = '';
    const params = [];
    let paramCount = 1;
    
    if (startDate || endDate) {
      dateFilter = ' AND ';
      const conditions = [];
      
      if (startDate) {
        conditions.push(`DATE(c.created_at) >= $${paramCount}`);
        params.push(startDate);
        paramCount++;
      }
      
      if (endDate) {
        conditions.push(`DATE(c.created_at) <= $${paramCount}`);
        params.push(endDate);
        paramCount++;
      }
      
      dateFilter += conditions.join(' AND ');
    }

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
        c.created_by,
        CASE 
          WHEN EXISTS (SELECT 1 FROM admin_profile WHERE email = c.created_by OR full_name = c.created_by) THEN 'Admin'
          WHEN EXISTS (SELECT 1 FROM users WHERE username = c.created_by OR email = c.created_by OR (first_name || ' ' || last_name) = c.created_by) THEN 
            COALESCE((SELECT first_name || ' ' || last_name FROM users WHERE username = c.created_by OR email = c.created_by OR (first_name || ' ' || last_name) = c.created_by LIMIT 1), c.created_by)
          WHEN EXISTS (SELECT 1 FROM staff WHERE username = c.created_by OR email = c.created_by OR full_name = c.created_by) THEN 
            COALESCE((SELECT full_name FROM staff WHERE username = c.created_by OR email = c.created_by OR full_name = c.created_by LIMIT 1), c.created_by)
          ELSE c.created_by
        END AS creator_name,
        CASE 
          WHEN EXISTS (SELECT 1 FROM admin_profile WHERE email = c.created_by OR full_name = c.created_by) THEN 'Admin'
          WHEN EXISTS (SELECT 1 FROM users WHERE username = c.created_by OR email = c.created_by OR (first_name || ' ' || last_name) = c.created_by) THEN 'Supervisor'
          WHEN EXISTS (SELECT 1 FROM staff WHERE username = c.created_by OR email = c.created_by OR full_name = c.created_by) THEN 'Staff'
          ELSE 'Admin'
        END AS user_type,
        c.created_at AS sale_date
      FROM customers c
      LEFT JOIN products p ON c.item_code = p.item_code
      WHERE c.item_code IS NOT NULL AND c.quantity > 0 ${dateFilter}
      ORDER BY c.created_at DESC`,
      params
    );

    // Get top performers (users with best sales) - same date filter
    const topPerformersParams = [];
    let topPerformersParamCount = 1;
    let topPerformersDateFilter = '';
    
    if (startDate || endDate) {
      topPerformersDateFilter = ' AND ';
      const conditions = [];
      
      if (startDate) {
        conditions.push(`DATE(c.created_at) >= $${topPerformersParamCount}`);
        topPerformersParams.push(startDate);
        topPerformersParamCount++;
      }
      
      if (endDate) {
        conditions.push(`DATE(c.created_at) <= $${topPerformersParamCount}`);
        topPerformersParams.push(endDate);
        topPerformersParamCount++;
      }
      
      topPerformersDateFilter += conditions.join(' AND ');
    }

    const topPerformersResult = await pool.query(
      `SELECT 
        c.created_by,
        CASE 
          WHEN EXISTS (SELECT 1 FROM admin_profile WHERE email = c.created_by OR full_name = c.created_by) THEN 'Admin'
          WHEN EXISTS (SELECT 1 FROM users WHERE username = c.created_by OR email = c.created_by OR (first_name || ' ' || last_name) = c.created_by) THEN 
            COALESCE((SELECT first_name || ' ' || last_name FROM users WHERE username = c.created_by OR email = c.created_by OR (first_name || ' ' || last_name) = c.created_by LIMIT 1), c.created_by)
          WHEN EXISTS (SELECT 1 FROM staff WHERE username = c.created_by OR email = c.created_by OR full_name = c.created_by) THEN 
            COALESCE((SELECT full_name FROM staff WHERE username = c.created_by OR email = c.created_by OR full_name = c.created_by LIMIT 1), c.created_by)
          ELSE c.created_by
        END AS creator_name,
        CASE 
          WHEN EXISTS (SELECT 1 FROM admin_profile WHERE email = c.created_by OR full_name = c.created_by) THEN 'Admin'
          WHEN EXISTS (SELECT 1 FROM users WHERE username = c.created_by OR email = c.created_by OR (first_name || ' ' || last_name) = c.created_by) THEN 'Supervisor'
          WHEN EXISTS (SELECT 1 FROM staff WHERE username = c.created_by OR email = c.created_by OR full_name = c.created_by) THEN 'Staff'
          ELSE 'Admin'
        END AS user_type,
        COUNT(*) AS total_sales,
        SUM(c.quantity * c.sell_rate) AS total_revenue,
        SUM(c.quantity) AS total_quantity
      FROM customers c
      WHERE c.item_code IS NOT NULL AND c.quantity > 0 AND c.created_by IS NOT NULL ${topPerformersDateFilter}
      GROUP BY c.created_by
      ORDER BY total_revenue DESC
      LIMIT 10`,
      topPerformersParams
    );

    res.json({
      success: true,
      sales: salesResult.rows,
      topPerformers: topPerformersResult.rows
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

// Get monthly best sales person
router.get('/best-sales-person', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Default to current month if not provided
    const currentDate = new Date();
    const targetMonth = month || (currentDate.getMonth() + 1);
    const targetYear = year || currentDate.getFullYear();
    
    // Get best sales person for the month
    const bestSalesResult = await pool.query(
      `SELECT 
        c.created_by,
        CASE 
          WHEN EXISTS (SELECT 1 FROM admin_profile WHERE email = c.created_by OR full_name = c.created_by) THEN 'Admin'
          WHEN EXISTS (SELECT 1 FROM users WHERE username = c.created_by OR email = c.created_by OR (first_name || ' ' || last_name) = c.created_by) THEN 
            COALESCE((SELECT first_name || ' ' || last_name FROM users WHERE username = c.created_by OR email = c.created_by OR (first_name || ' ' || last_name) = c.created_by LIMIT 1), c.created_by)
          WHEN EXISTS (SELECT 1 FROM staff WHERE username = c.created_by OR email = c.created_by OR full_name = c.created_by) THEN 
            COALESCE((SELECT full_name FROM staff WHERE username = c.created_by OR email = c.created_by OR full_name = c.created_by LIMIT 1), c.created_by)
          ELSE c.created_by
        END AS creator_name,
        COUNT(*) AS total_sales,
        SUM(c.quantity * c.sell_rate) AS total_revenue,
        SUM(c.quantity) AS total_quantity
      FROM customers c
      WHERE c.item_code IS NOT NULL 
        AND c.quantity > 0 
        AND c.created_by IS NOT NULL
        AND EXTRACT(MONTH FROM c.created_at) = $1
        AND EXTRACT(YEAR FROM c.created_at) = $2
      GROUP BY c.created_by
      ORDER BY total_revenue DESC
      LIMIT 1`,
      [targetMonth, targetYear]
    );

    if (bestSalesResult.rows.length === 0) {
      return res.json({
        success: true,
        bestSalesPerson: null,
        message: 'No sales data for this month'
      });
    }

    const bestPerson = bestSalesResult.rows[0];
    
    // Get user photo/avatar and name
    let userPhoto = null;
    let userEmail = null;
    let userName = bestPerson.creator_name;
    
    // Check if it's admin (only admin has avatar_url in admin_profile)
    const adminResult = await pool.query(
      'SELECT email, avatar_url, full_name FROM admin_profile WHERE email = $1 OR full_name = $1 LIMIT 1',
      [bestPerson.created_by]
    );
    
    if (adminResult.rows.length > 0) {
      userPhoto = adminResult.rows[0].avatar_url;
      userEmail = adminResult.rows[0].email;
      userName = adminResult.rows[0].full_name || userName;
    } else {
      // Check if it's supervisor (users table) - no avatar_url field
      const userResult = await pool.query(
        'SELECT email, first_name, last_name FROM users WHERE username = $1 OR email = $1 OR (first_name || \' \' || last_name) = $1 LIMIT 1',
        [bestPerson.created_by]
      );
      
      if (userResult.rows.length > 0) {
        userEmail = userResult.rows[0].email;
        userName = `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}` || userName;
      } else {
        // Check if it's staff - no avatar_url field
        const staffResult = await pool.query(
          'SELECT email, full_name FROM staff WHERE username = $1 OR email = $1 OR full_name = $1 LIMIT 1',
          [bestPerson.created_by]
        );
        
        if (staffResult.rows.length > 0) {
          userEmail = staffResult.rows[0].email;
          userName = staffResult.rows[0].full_name || userName;
        }
      }
    }

    res.json({
      success: true,
      bestSalesPerson: {
        name: userName,
        originalIdentifier: bestPerson.created_by,
        totalRevenue: parseFloat(bestPerson.total_revenue) || 0,
        totalSales: parseInt(bestPerson.total_sales) || 0,
        totalQuantity: parseInt(bestPerson.total_quantity) || 0,
        photo: userPhoto,
        email: userEmail,
        month: targetMonth,
        year: targetYear
      }
    });
  } catch (error) {
    console.error('Get best sales person error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

