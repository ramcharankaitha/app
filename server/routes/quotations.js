const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Create quotations table if it doesn't exist and migrate existing schema
const createTableIfNotExists = async () => {
  try {
    // First, create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        items JSONB,
        customer_name VARCHAR(255) NOT NULL,
        customer_number VARCHAR(50) NOT NULL,
        gst_number VARCHAR(50),
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Now migrate existing table to match the new schema
    console.log('Checking and migrating quotations table schema...');
    
    // Run comprehensive migration
    await pool.query(`
      DO $$ 
      BEGIN
        -- Add customer_name if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'quotations' AND column_name = 'customer_name'
        ) THEN
          ALTER TABLE quotations ADD COLUMN customer_name VARCHAR(255);
          UPDATE quotations SET customer_name = 'N/A' WHERE customer_name IS NULL;
          ALTER TABLE quotations ALTER COLUMN customer_name SET NOT NULL;
          RAISE NOTICE 'Added customer_name column';
        END IF;
        
        -- Add customer_number if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'quotations' AND column_name = 'customer_number'
        ) THEN
          ALTER TABLE quotations ADD COLUMN customer_number VARCHAR(50);
          UPDATE quotations SET customer_number = 'N/A' WHERE customer_number IS NULL;
          ALTER TABLE quotations ALTER COLUMN customer_number SET NOT NULL;
          RAISE NOTICE 'Added customer_number column';
        END IF;
        
        -- Make gst_number nullable (remove NOT NULL constraint if it exists)
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quotations' 
            AND column_name = 'gst_number' 
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE quotations ALTER COLUMN gst_number DROP NOT NULL;
            RAISE NOTICE 'Made gst_number nullable';
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- If column doesn't exist, add it as nullable
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'quotations' AND column_name = 'gst_number'
            ) THEN
              ALTER TABLE quotations ADD COLUMN gst_number VARCHAR(50);
              RAISE NOTICE 'Added gst_number column';
            END IF;
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'gst_number column already exists or error occurred';
          END;
        END;
        
        -- Remove quotation_date column if it exists
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quotations' AND column_name = 'quotation_date'
          ) THEN
            ALTER TABLE quotations DROP COLUMN quotation_date;
            RAISE NOTICE 'Removed quotation_date column';
          END IF;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not remove quotation_date column: %', SQLERRM;
        END;
        
        -- Remove old single-item columns (item_code, price, quantity) - we use items JSONB now
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quotations' AND column_name = 'item_code'
          ) THEN
            ALTER TABLE quotations DROP COLUMN item_code;
            RAISE NOTICE 'Removed old item_code column';
          END IF;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not remove item_code column: %', SQLERRM;
        END;
        
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quotations' AND column_name = 'price'
          ) THEN
            ALTER TABLE quotations DROP COLUMN price;
            RAISE NOTICE 'Removed old price column';
          END IF;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not remove price column: %', SQLERRM;
        END;
        
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quotations' AND column_name = 'quantity'
          ) THEN
            ALTER TABLE quotations DROP COLUMN quantity;
            RAISE NOTICE 'Removed old quantity column';
          END IF;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not remove quantity column: %', SQLERRM;
        END;
        
        -- Add items column if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'quotations' AND column_name = 'items'
        ) THEN
          ALTER TABLE quotations ADD COLUMN items JSONB;
          RAISE NOTICE 'Added items column';
        END IF;
        
        -- Add status column if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'quotations' AND column_name = 'status'
        ) THEN
          ALTER TABLE quotations ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
          UPDATE quotations SET status = 'pending' WHERE status IS NULL;
          RAISE NOTICE 'Added status column';
        END IF;
      END $$;
    `);
    
    console.log('✅ Quotations table schema verified and migrated');
  } catch (error) {
    console.error('❌ Error creating/migrating quotations table:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    throw error; // Re-throw so we know if migration fails
  }
};

// Initialize table on module load with retry logic
const initializeTableWithRetry = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await createTableIfNotExists();
      return; // Success, exit
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        if (i < retries - 1) {
          console.log(`⚠️  Database not ready, retrying in ${delay}ms... (${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5; // Exponential backoff
        } else {
          console.error('❌ Failed to initialize quotations table after retries. Database may not be ready.');
          console.error('   The table will be created on first use.');
        }
      } else {
        // Non-connection errors, log but don't retry
        console.error('❌ Error initializing quotations table:', error.message);
        break;
      }
    }
  }
};

// Initialize asynchronously without blocking
initializeTableWithRetry().catch(err => {
  console.error('❌ Table initialization failed:', err.message);
});

// Get all quotations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM quotations ORDER BY created_at DESC'
    );
    
    // Transform results to include first item details for display
    const transformedQuotations = result.rows.map(quotation => {
      let firstItem = null;
      if (quotation.items && typeof quotation.items === 'string') {
        try {
          const items = JSON.parse(quotation.items);
          firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;
        } catch (e) {
          console.error('Error parsing items JSON:', e);
        }
      } else if (Array.isArray(quotation.items) && quotation.items.length > 0) {
        firstItem = quotation.items[0];
      }
      
      return {
        ...quotation,
        item_code: firstItem?.itemCode || quotation.item_code || 'N/A',
        price: firstItem?.price || quotation.price || 0,
        quantity: firstItem?.quantity || quotation.quantity || 0
      };
    });
    
    res.json({ success: true, quotations: transformedQuotations });
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve quotation - MUST come before /:id routes
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Approving quotation ${id}...`);
    
    // First check if quotation exists
    const checkResult = await pool.query('SELECT * FROM quotations WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Update status to approved
    const result = await pool.query(
      `UPDATE quotations 
       SET status = 'approved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    console.log(`Quotation ${id} approved successfully`);
    res.json({
      success: true,
      quotation: result.rows[0],
      message: 'Quotation approved successfully'
    });
  } catch (error) {
    console.error('Approve quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get quotation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM quotations WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json({ success: true, quotation: result.rows[0] });
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create quotation
router.post('/', async (req, res) => {
  try {
    await createTableIfNotExists();
    
    const { items, customerName, customerNumber, gstNumber, gst, totalPrice, createdBy, userRole } = req.body;
    
    // Ensure verification columns exist
    const { ensureVerificationColumn, shouldBeVerified, notifyStaffCreation } = require('../utils/verification');
    await ensureVerificationColumn('quotations');
    
    // Determine verification status based on user role
    const isVerified = shouldBeVerified(userRole || 'staff');

    console.log('Creating quotation with data:', {
      customerName,
      customerNumber,
      gstNumber,
      itemsCount: items?.length,
      totalPrice
    });

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    if (!customerNumber || !customerNumber.trim()) {
      return res.status(400).json({ error: 'Customer number is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Validate all items
    for (const item of items) {
      if (!item.itemCode || !item.price || !item.quantity) {
        return res.status(400).json({ error: 'Each item must have item code, price, and quantity' });
      }
      if (parseFloat(item.price) <= 0 || parseFloat(item.quantity) <= 0) {
        return res.status(400).json({ error: 'Price and quantity must be greater than 0' });
      }
    }

    // Calculate total price from items if not provided
    let calculatedTotalPrice = parseFloat(totalPrice) || 0;
    if (calculatedTotalPrice === 0) {
      calculatedTotalPrice = items.reduce((total, item) => {
        return total + (parseFloat(item.price) * parseFloat(item.quantity));
      }, 0);
    }

    const itemsJson = JSON.stringify(items);
    
    // Prepare values - handle gstNumber/gst
    const gstValue = (gstNumber && gstNumber.trim()) ? gstNumber.trim() : 
                     (gst && gst.trim()) ? gst.trim() : null;
    
    const values = [
      itemsJson,
      customerName.trim(),
      customerNumber.trim(),
      gstValue,
      calculatedTotalPrice,
      createdBy || 'system',
      isVerified
    ];
    
    console.log('Inserting quotation with values:', {
      itemsCount: items.length,
      customerName: values[1],
      customerNumber: values[2],
      gstNumber: values[3],
      totalPrice: values[4]
    });

    // Try to insert, but first ensure schema is correct
    let result;
    try {
      result = await pool.query(
        `INSERT INTO quotations (items, customer_name, customer_number, gst_number, total_price, created_by, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        values
      );
    } catch (dbError) {
      // If error is due to missing column or constraint, try to fix it
      if (dbError.code === '42703' || dbError.code === '23502' || dbError.constraint) {
        console.log('Database schema issue detected, fixing...');
        try {
          // Ensure all columns exist and have correct constraints
          await pool.query(`
            DO $$ 
            BEGIN
              -- Add customer_name if missing
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'customer_name') THEN
                ALTER TABLE quotations ADD COLUMN customer_name VARCHAR(255);
                UPDATE quotations SET customer_name = 'N/A' WHERE customer_name IS NULL;
                ALTER TABLE quotations ALTER COLUMN customer_name SET NOT NULL;
              END IF;
              
              -- Add customer_number if missing
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'customer_number') THEN
                ALTER TABLE quotations ADD COLUMN customer_number VARCHAR(50);
                UPDATE quotations SET customer_number = 'N/A' WHERE customer_number IS NULL;
                ALTER TABLE quotations ALTER COLUMN customer_number SET NOT NULL;
              END IF;
              
              -- Make gst_number nullable
              BEGIN
                ALTER TABLE quotations ALTER COLUMN gst_number DROP NOT NULL;
              EXCEPTION WHEN OTHERS THEN
                -- Ignore if already nullable or column doesn't exist
                RAISE NOTICE 'gst_number constraint already correct or column missing';
              END;
              
              -- Remove quotation_date
              ALTER TABLE quotations DROP COLUMN IF EXISTS quotation_date;
              
              -- Remove old single-item columns
              ALTER TABLE quotations DROP COLUMN IF EXISTS item_code;
              ALTER TABLE quotations DROP COLUMN IF EXISTS price;
              ALTER TABLE quotations DROP COLUMN IF EXISTS quantity;
            END $$;
          `);
          
          // Retry the insert
          result = await pool.query(
            `INSERT INTO quotations (items, customer_name, customer_number, gst_number, total_price, created_by, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            values
          );
        } catch (fixError) {
          console.error('Could not fix schema:', fixError);
          throw dbError; // Throw original error
        }
      } else {
        throw dbError; // Re-throw if it's a different error
      }
    }

    // Send notification if created by staff
    if (!isVerified) {
      await notifyStaffCreation('Quotation', `Quotation #${result.rows[0].id} for ${customerName.trim()}`, result.rows[0].id);
    }
    
    res.status(201).json({
      success: true,
      quotation: result.rows[0],
      message: 'Quotation created successfully'
    });
  } catch (error) {
    console.error('❌ Create quotation error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      column: error.column,
      hint: error.hint
    });
    
    // Provide helpful error messages based on error code
    let errorMessage = 'Internal server error';
    let errorDetails = {};
    
    if (error.code === '23502') {
      errorMessage = `Database constraint violation: Column '${error.column}' cannot be null`;
      errorDetails = { column: error.column, hint: 'The database schema may need to be updated' };
    } else if (error.code === '42703') {
      errorMessage = `Database error: Column '${error.column}' does not exist`;
      errorDetails = { column: error.column, hint: 'The database schema may need to be updated' };
    } else if (error.code === '42P01') {
      errorMessage = 'Database error: Table does not exist';
      errorDetails = { hint: 'The quotations table may not have been created' };
    } else if (error.constraint) {
      errorMessage = `Database constraint error: ${error.constraint}`;
      errorDetails = { constraint: error.constraint };
    } else {
      errorMessage = error.message || 'Internal server error';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      code: error.code
    });
  }
});

// Verify quotation (admin/supervisor only) - MUST come before PUT /:id route
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Quotations Verify] Received PUT /quotations/${id}/verify request`);
    const { ensureVerificationColumn } = require('../utils/verification');
    await ensureVerificationColumn('quotations');
    
    const result = await pool.query(
      'UPDATE quotations SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    
    res.json({ 
      success: true, 
      quotation: result.rows[0],
      message: 'Quotation verified successfully' 
    });
  } catch (error) {
    console.error('Verify quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update quotation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemCode, price, quantity, gstNumber, quotationDate, totalPrice } = req.body;

    if (!itemCode || !price || !quantity || !gstNumber || !quotationDate) {
      return res.status(400).json({ error: 'Item code, price, quantity, GST number, and quotation date are required' });
    }

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity);
    const parsedTotalPrice = parseFloat(totalPrice);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    if (isNaN(parsedTotalPrice) || parsedTotalPrice <= 0) {
      return res.status(400).json({ error: 'Invalid total price' });
    }

    const result = await pool.query(
      `UPDATE quotations 
       SET item_code = $1, price = $2, quantity = $3, gst_number = $4, quotation_date = $5, total_price = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        itemCode.trim(),
        parsedPrice,
        parsedQuantity,
        gstNumber.trim(),
        quotationDate,
        parsedTotalPrice,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json({
      success: true,
      quotation: result.rows[0],
      message: 'Quotation updated successfully'
    });
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete quotation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM quotations WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

