const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Generate unique 4-digit PO number
const generatePONumber = async () => {
  const prefix = 'PO';
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    // Generate a random 4-digit number (1000-9999)
    const fourDigit = Math.floor(1000 + Math.random() * 9000);
    const poNumber = `${prefix}-${fourDigit}`;
    
    // Check if this PO number already exists
    try {
      // First ensure the po_number column exists
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sales_records' AND column_name = 'po_number'
          ) THEN
            ALTER TABLE sales_records ADD COLUMN po_number VARCHAR(100);
            RAISE NOTICE 'Added po_number column to sales_records';
          END IF;
        END $$;
      `);
      
      const checkResult = await pool.query(
        'SELECT id FROM sales_records WHERE po_number = $1 LIMIT 1',
        [poNumber]
      );
      
      if (checkResult.rows.length === 0) {
        // PO number is unique
        console.log('Generated unique PO number:', poNumber);
        return poNumber;
      }
    } catch (error) {
      // If there's an error checking, just return the number anyway
      console.log('Could not check PO number uniqueness, using generated number:', poNumber, error.message);
      return poNumber;
    }
    
    attempts++;
  }
  
  // Fallback: use timestamp-based if we can't find a unique 4-digit number
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

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
      // Create table with all columns including po_number
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
          po_number VARCHAR(100),
          is_verified BOOLEAN DEFAULT false,
          created_by VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('sales_records table created successfully with po_number column');
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
        { name: 'po_number', type: 'VARCHAR(100)' },
        { name: 'is_verified', type: 'BOOLEAN', default: 'false' },
        { name: 'created_by', type: 'VARCHAR(255)' },
        { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'CURRENT_TIMESTAMP' }
      ];
      
      // Ensure po_number column exists and is added to new tables
      if (!tableExists.rows[0].exists) {
        // Add po_number to the CREATE TABLE statement
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
          po_number VARCHAR(100),
          is_verified BOOLEAN DEFAULT false,
          created_by VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('sales_records table created with po_number column');
      }
      
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

// Get sales orders by handler - MUST come before GET /
router.get('/handler/:handlerName', async (req, res) => {
  try {
    const { handlerName } = req.params;
    const handlerId = req.query.handlerId ? parseInt(req.query.handlerId) : null;
    const decodedHandlerName = decodeURIComponent(handlerName);
    
    console.log('Fetching sales orders for handler:', decodedHandlerName, 'handlerId:', handlerId);
    
    let query;
    let params;
    
    if (handlerId) {
      query = `SELECT * FROM sales_records WHERE handler_id = $1 ORDER BY created_at DESC`;
      params = [handlerId];
    } else {
      query = `SELECT * FROM sales_records 
               WHERE handler_name IS NOT NULL 
                 AND (
                   LOWER(TRIM(handler_name)) = LOWER(TRIM($1))
                   OR LOWER(TRIM(handler_name)) LIKE '%' || LOWER(TRIM($1)) || '%'
                 )
               ORDER BY created_at DESC`;
      params = [decodedHandlerName];
    }
    
    const result = await pool.query(query, params);
    
    res.json({ 
      success: true, 
      salesOrders: result.rows 
    });
  } catch (error) {
    console.error('Get sales orders by handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

    // Calculate total amount from products if not provided or is 0
    let calculatedTotalAmount = parseFloat(totalAmount) || 0;
    if (calculatedTotalAmount === 0) {
      calculatedTotalAmount = validProducts.reduce((total, product) => {
        const quantity = parseFloat(product.quantity) || 0;
        const sellRate = parseFloat(product.sellRate) || parseFloat(product.sell_rate) || 0;
        const mrp = parseFloat(product.mrp) || 0;
        // Use sellRate if available, otherwise use mrp
        const price = sellRate > 0 ? sellRate : mrp;
        return total + (quantity * price);
      }, 0);
      console.log('Calculated total amount from products:', calculatedTotalAmount);
    }

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

    // Generate unique 4-digit PO number FIRST
    const poNumber = await generatePONumber();
    console.log('Generated PO Number:', poNumber);

    // Prepare values - IMPORTANT: po_number comes BEFORE created_by to match INSERT order
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
      calculatedTotalAmount,  // Use calculated total amount
      poNumber,  // $11 - po_number
      createdBy || 'system'  // $12 - created_by
    ];

    console.log('Prepared values:', values.map((v, i) => `$${i+1}: ${typeof v === 'string' && v.length > 50 ? v.substring(0, 50) + '...' : v}`));
    console.log('PO Number position (should be $11):', values[10]);
    console.log('Created By position (should be $12):', values[11]);

    // Insert into sales_records - use products column (should exist after createTableIfNotExists)
    console.log('Attempting insert into sales_records...');
    let result;
    try {
      // Ensure is_verified column exists before insert
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sales_records' AND column_name = 'is_verified'
          ) THEN
            ALTER TABLE sales_records ADD COLUMN is_verified BOOLEAN DEFAULT false;
            RAISE NOTICE 'Added is_verified column to sales_records';
          END IF;
        END $$;
      `);

      result = await pool.query(
        `INSERT INTO sales_records (
          customer_name, customer_contact, handler_id, handler_name, handler_mobile,
          date_of_duration, supplier_name, supplier_number, products, total_amount, po_number, is_verified, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          customerName.trim(),
          customerContact.trim(),
          validHandlerId,
          handlerName ? handlerName.trim() : null,
          handlerMobile ? handlerMobile.trim() : null,
          dateOfDuration,
          supplierName ? supplierName.trim() : null,
          supplierNumber ? supplierNumber.trim() : null,
          productsJson,
          calculatedTotalAmount,
          poNumber,
          false,  // is_verified = false for new records
          createdBy || 'system'
        ]
      );
    } catch (colError) {
      if (colError.code === '42703') { // undefined_column error (po_number might not exist)
        // Try without po_number - need to remove poNumber from values array
        const valuesWithoutPO = [
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
        result = await pool.query(
          `INSERT INTO sales_records (
            customer_name, customer_contact, handler_id, handler_name, handler_mobile,
            date_of_duration, supplier_name, supplier_number, products, total_amount, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          valuesWithoutPO
        );
        // Update with PO number after insert
        await pool.query(
          `UPDATE sales_records SET po_number = $1 WHERE id = $2`,
          [poNumber, result.rows[0].id]
        );
        // Fetch updated record
        const updatedResult = await pool.query(
          'SELECT * FROM sales_records WHERE id = $1',
          [result.rows[0].id]
        );
        result = updatedResult;
      } else {
        throw colError;
      }
    }
    console.log('Sales order created successfully, ID:', result.rows[0]?.id);
    console.log('PO Number in result:', result.rows[0]?.po_number);

    // Ensure PO number is in the response
    const salesOrderResponse = result.rows[0];
    if (!salesOrderResponse.po_number) {
      // If PO number is missing, fetch it again
      const fetchResult = await pool.query(
        'SELECT po_number FROM sales_records WHERE id = $1',
        [salesOrderResponse.id]
      );
      if (fetchResult.rows.length > 0 && fetchResult.rows[0].po_number) {
        salesOrderResponse.po_number = fetchResult.rows[0].po_number;
        console.log('Fetched PO number from database:', salesOrderResponse.po_number);
      } else {
        // If still missing, update it
        await pool.query(
          'UPDATE sales_records SET po_number = $1 WHERE id = $2',
          [poNumber, salesOrderResponse.id]
        );
        salesOrderResponse.po_number = poNumber;
        console.log('Updated PO number in database:', poNumber);
      }
    }

    // Ensure is_verified is set to false for new records
    if (salesOrderResponse.is_verified === undefined || salesOrderResponse.is_verified === null) {
      await pool.query('UPDATE sales_records SET is_verified = false WHERE id = $1', [salesOrderResponse.id]);
      salesOrderResponse.is_verified = false;
    }

    res.status(201).json({
      success: true,
      salesOrder: salesOrderResponse,
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

// Verify sales order (admin/supervisor only) - MUST come before PUT /:id route
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure is_verified column exists
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'sales_records' AND column_name = 'is_verified'
        ) THEN
          ALTER TABLE sales_records ADD COLUMN is_verified BOOLEAN DEFAULT false;
          RAISE NOTICE 'Added is_verified column to sales_records';
        END IF;
      END $$;
    `);
    
    const result = await pool.query(
      'UPDATE sales_records SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    
    res.json({ 
      success: true, 
      salesOrder: result.rows[0],
      message: 'Sales order verified successfully' 
    });
  } catch (error) {
    console.error('Verify sales order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
