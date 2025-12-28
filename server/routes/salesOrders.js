const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Create sales_records table if it doesn't exist
const createTableIfNotExists = async () => {
  try {
    console.log('Creating/checking sales_records table...');
    
    // Drop and recreate table to ensure correct structure (only if table doesn't exist)
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sales_records'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      // Create table with all columns
      await pool.query(`
        CREATE TABLE sales_records (
          id SERIAL PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          customer_contact VARCHAR(50) NOT NULL,
          handler_id INTEGER,
          handler_name VARCHAR(255),
          handler_mobile VARCHAR(50),
          date_of_duration DATE NOT NULL,
          supplier_name VARCHAR(255),
          supplier_number VARCHAR(50),
          products JSONB DEFAULT '[]'::jsonb,
          product_details JSONB DEFAULT '[]'::jsonb,
          total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
          created_by VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('sales_records table created successfully');
    } else {
      console.log('sales_records table already exists');
      
      // Add missing columns if they don't exist
      const columnsToAdd = [
        { name: 'products', type: 'JSONB', default: "'[]'::jsonb" },
        { name: 'product_details', type: 'JSONB', default: "'[]'::jsonb" },
        { name: 'handler_id', type: 'INTEGER' },
        { name: 'handler_name', type: 'VARCHAR(255)' },
        { name: 'handler_mobile', type: 'VARCHAR(50)' },
        { name: 'supplier_name', type: 'VARCHAR(255)' },
        { name: 'supplier_number', type: 'VARCHAR(50)' },
        { name: 'total_amount', type: 'DECIMAL(10, 2)', default: '0' },
        { name: 'created_by', type: 'VARCHAR(255)' },
        { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'CURRENT_TIMESTAMP' }
      ];
      
      for (const col of columnsToAdd) {
        try {
          const columnExists = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'sales_records' 
              AND column_name = $1
            )
          `, [col.name]);
          
          if (!columnExists.rows[0].exists) {
            const defaultClause = col.default ? ` DEFAULT ${col.default}` : '';
            await pool.query(`
              ALTER TABLE sales_records 
              ADD COLUMN ${col.name} ${col.type}${defaultClause}
            `);
            console.log(`Added column: ${col.name}`);
          }
        } catch (alterError) {
          if (alterError.code !== '42701') { // duplicate_column
            console.error(`Error adding column ${col.name}:`, alterError.message);
          }
        }
      }
    }
    
    console.log('Table setup complete');
  } catch (error) {
    console.error('CRITICAL: Error creating/updating sales_records table:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    // Don't throw - allow the request to continue and try to fix on insert
  }
};

// Initialize table on module load (don't block if it fails)
createTableIfNotExists().catch(err => {
  console.error('Initial table creation failed:', err.message);
});

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
  console.log('=== Sales Order Creation Request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
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

    console.log('Extracted data:', {
      customerName,
      customerContact,
      handlerId,
      dateOfDuration,
      productsCount: products ? products.length : 0
    });

    // Validate required fields
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    if (!customerContact || !customerContact.trim()) {
      return res.status(400).json({ error: 'Customer contact is required' });
    }

    if (!dateOfDuration) {
      return res.status(400).json({ error: 'Date of duration is required' });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'At least one product is required' });
    }

    // Validate products array
    const validProducts = products.filter(p => p && (p.itemCode || p.productName));
    if (validProducts.length === 0) {
      return res.status(400).json({ error: 'At least one valid product is required' });
    }

    console.log('Valid products:', validProducts.length);

    const productsJson = JSON.stringify(validProducts);
    console.log('Products JSON length:', productsJson.length);

    // Ensure table exists and has required columns
    console.log('Ensuring table exists...');
    await createTableIfNotExists();
    console.log('Table check complete');

    // Validate and convert handlerId
    let validHandlerId = null;
    if (handlerId) {
      const parsed = parseInt(handlerId);
      if (!isNaN(parsed) && parsed > 0) {
        validHandlerId = parsed;
      }
    }

    // Prepare values
    const values = [
      customerName.trim(),
      customerContact.trim(),
      validHandlerId,
      handlerName ? handlerName.trim() : null,
      handlerMobile ? handlerMobile.trim() : null,
      dateOfDuration,
      supplierName ? supplierName.trim() : null,
      supplierNumber ? supplierNumber.trim() : null,
      productsJson,
      parseFloat(totalAmount) || 0,
      createdBy || 'system'
    ];

    console.log('Prepared values:', values.map((v, i) => `$${i+1}: ${typeof v === 'string' && v.length > 50 ? v.substring(0, 50) + '...' : v}`));

    // Insert into sales_records - use products column (should exist after createTableIfNotExists)
    console.log('Attempting insert into sales_records...');
    const result = await pool.query(
      `INSERT INTO sales_records (
        customer_name, customer_contact, handler_id, handler_name, handler_mobile,
        date_of_duration, supplier_name, supplier_number, products, total_amount, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      values
    );
    console.log('Sales order created successfully, ID:', result.rows[0]?.id);

    res.status(201).json({
      success: true,
      salesOrder: result.rows[0],
      message: 'Sales order created successfully'
    });
  } catch (error) {
    console.error('=== CREATE SALES ORDER ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error constraint:', error.constraint);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    
    // Always return detailed error for debugging
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
  }
});

module.exports = router;
