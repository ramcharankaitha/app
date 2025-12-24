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
      sales: salesResult.rows || [],
      topPerformers: topPerformersResult.rows || []
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

// Get Stock In Report
router.get('/stock-in', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [];
    let paramCount = 1;
    
    if (startDate || endDate) {
      dateFilter = ' AND ';
      const conditions = [];
      
      if (startDate) {
        conditions.push(`DATE(created_at) >= $${paramCount}`);
        params.push(startDate);
        paramCount++;
      }
      
      if (endDate) {
        conditions.push(`DATE(created_at) <= $${paramCount}`);
        params.push(endDate);
        paramCount++;
      }
      
      dateFilter += conditions.join(' AND ');
    }

    const result = await pool.query(
      `SELECT 
        id,
        item_code,
        product_name,
        quantity,
        previous_quantity,
        new_quantity,
        notes,
        created_by,
        created_at
      FROM stock_transactions
      WHERE transaction_type = 'STOCK_IN' ${dateFilter}
      ORDER BY created_at DESC`,
      params
    );

    res.json({
      success: true,
      transactions: result.rows
    });
  } catch (error) {
    console.error('Export stock in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Stock Out Report
router.get('/stock-out', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [];
    let paramCount = 1;
    
    if (startDate || endDate) {
      dateFilter = ' AND ';
      const conditions = [];
      
      if (startDate) {
        conditions.push(`DATE(created_at) >= $${paramCount}`);
        params.push(startDate);
        paramCount++;
      }
      
      if (endDate) {
        conditions.push(`DATE(created_at) <= $${paramCount}`);
        params.push(endDate);
        paramCount++;
      }
      
      dateFilter += conditions.join(' AND ');
    }

    const result = await pool.query(
      `SELECT 
        id,
        item_code,
        product_name,
        quantity,
        previous_quantity,
        new_quantity,
        notes,
        created_by,
        created_at
      FROM stock_transactions
      WHERE transaction_type = 'STOCK_OUT' ${dateFilter}
      ORDER BY created_at DESC`,
      params
    );

    res.json({
      success: true,
      transactions: result.rows
    });
  } catch (error) {
    console.error('Export stock out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Stock Details Report
router.get('/stock-details', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        product_name,
        item_code,
        sku_code,
        category,
        current_quantity,
        minimum_quantity,
        mrp,
        CASE 
          WHEN current_quantity <= 0 THEN 'Out of Stock'
          WHEN current_quantity <= minimum_quantity OR (minimum_quantity = 0 AND current_quantity <= 10) THEN 'Low Stock'
          ELSE 'In Stock'
        END as status
      FROM products
      ORDER BY 
        CASE 
          WHEN current_quantity <= 0 THEN 1
          WHEN current_quantity <= minimum_quantity OR (minimum_quantity = 0 AND current_quantity <= 10) THEN 2
          ELSE 3
        END,
        product_name ASC`
    );

    res.json({
      success: true,
      stockDetails: result.rows
    });
  } catch (error) {
    console.error('Export stock details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Low Stock Report
router.get('/low-stock', async (req, res) => {
  try {
    const { threshold } = req.query;
    const stockThreshold = threshold ? parseInt(threshold) : 10;

    const result = await pool.query(
      `SELECT 
        id,
        product_name,
        item_code,
        sku_code,
        category,
        current_quantity,
        minimum_quantity,
        mrp
      FROM products
      WHERE current_quantity <= $1
      ORDER BY 
        CASE 
          WHEN current_quantity <= 0 THEN 1
          ELSE 2
        END,
        current_quantity ASC,
        product_name ASC`,
      [stockThreshold]
    );

    res.json({
      success: true,
      items: result.rows
    });
  } catch (error) {
    console.error('Export low stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Stock Performance Report (which products sold the most)
router.get('/stock-performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
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

    const result = await pool.query(
      `SELECT 
        c.item_code,
        p.product_name,
        p.category,
        SUM(c.quantity) AS total_sold,
        SUM(c.quantity * c.sell_rate) AS total_revenue,
        AVG(c.sell_rate) AS average_price,
        COUNT(*) AS transaction_count
      FROM customers c
      LEFT JOIN products p ON c.item_code = p.item_code
      WHERE c.item_code IS NOT NULL 
        AND c.quantity > 0 
        AND c.sell_rate IS NOT NULL
        ${dateFilter}
      GROUP BY c.item_code, p.product_name, p.category
      ORDER BY total_revenue DESC, total_sold DESC
      LIMIT 100`,
      params
    );

    res.json({
      success: true,
      performance: result.rows.map((row, index) => ({
        id: index + 1,
        item_code: row.item_code,
        product_name: row.product_name || 'Unknown Product',
        category: row.category || 'N/A',
        total_sold: parseInt(row.total_sold) || 0,
        total_revenue: parseFloat(row.total_revenue) || 0,
        average_price: parseFloat(row.average_price) || 0,
        transaction_count: parseInt(row.transaction_count) || 0
      }))
    });
  } catch (error) {
    console.error('Export stock performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

