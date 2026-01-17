const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { createCriticalAlert } = require('../services/notificationService');
const { ensureVerificationColumn, shouldBeVerified, notifyStaffCreation } = require('../utils/verification');

// Public endpoint for storefront - only returns available products
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, product_name, item_code, sku_code, category, mrp, discount, sell_rate, 
              current_quantity, image_url, status
       FROM products 
       WHERE status = 'STOCK' AND current_quantity > 0 AND sell_rate IS NOT NULL
       ORDER BY created_at DESC`
    );
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Get public products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/item-code/:itemCode', async (req, res) => {
  try {
    const { itemCode } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE item_code = $1',
      [itemCode]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Get product by item code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { productName, itemCode, skuCode, modelNumber, minimumQuantity, maintainingQuantity, currentQuantity, supplierName, category, mrp, discount, discount1, discount2, sellRate, purchaseRate, points, imageUrl, userRole, createdBy } = req.body;
    
    // Ensure verification columns exist
    await ensureVerificationColumn('products');
    
    // Ensure sku_code is optional and model_number exists (one-time migration)
    try {
      await pool.query(`
        DO $$ 
        BEGIN
          -- Make sku_code optional (remove NOT NULL constraint if it exists)
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'products' 
            AND column_name = 'sku_code' 
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE products ALTER COLUMN sku_code DROP NOT NULL;
          END IF;
          
          -- Add model_number column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'products' 
            AND column_name = 'model_number'
          ) THEN
            ALTER TABLE products ADD COLUMN model_number VARCHAR(255);
          END IF;
        END $$;
      `);
    } catch (migrationError) {
      // Log but don't fail - migration might have already run
      console.warn('⚠️  Product fields migration warning:', migrationError.message);
    }
    
    // Determine verification status based on user role
    const isVerified = shouldBeVerified(userRole || 'staff');

    console.log('=== CREATE PRODUCT REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Helper function to safely parse numeric values
    const parseNumeric = (value) => {
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'number') return isNaN(value) ? null : value;
      if (typeof value === 'string') {
        // Remove currency symbols, commas, spaces
        const cleaned = value.replace(/[Rs₹,\s]/gi, '').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    };

    // Trim and validate - all fields are now optional
    const trimmedProductName = productName ? productName.trim() : null;
    const trimmedItemCode = itemCode ? itemCode.trim() : null;
    const trimmedSkuCode = skuCode ? skuCode.trim() : null;
    const trimmedModelNumber = modelNumber ? modelNumber.trim() : null;
    
    // Generate default values if not provided - ensure they're not empty strings
    const finalProductName = (trimmedProductName && trimmedProductName.length > 0) ? trimmedProductName : 'Unnamed Product';
    const finalItemCode = (trimmedItemCode && trimmedItemCode.length > 0) ? trimmedItemCode : `ITEM-${Date.now()}`;
    // SKU and Model Number are now optional - use null if not provided
    const finalSkuCode = (trimmedSkuCode && trimmedSkuCode.length > 0) ? trimmedSkuCode : null;
    const finalModelNumber = (trimmedModelNumber && trimmedModelNumber.length > 0) ? trimmedModelNumber : null;

    // Parse numeric values safely
    const parsedMrp = parseNumeric(mrp);
    const parsedSellRate = parseNumeric(sellRate);
    const parsedPurchaseRate = parseNumeric(purchaseRate);
    const parsedDiscount = parseNumeric(discount) || 0;
    const parsedDiscount1 = parseNumeric(discount1) || 0;
    const parsedDiscount2 = parseNumeric(discount2) || 0;
    const parsedPoints = parseNumeric(points) || 0;
    const parsedMinQty = parseNumeric(minimumQuantity) || 0;
    const parsedMaintainingQty = parseNumeric(maintainingQuantity) || 0;
    const parsedCurrentQty = parseNumeric(currentQuantity) || 0;

    console.log('Parsed values:', {
      mrp: parsedMrp,
      sellRate: parsedSellRate,
      discount: parsedDiscount,
      points: parsedPoints
    });

    // Check which columns exist and build query dynamically
    let result;
    let insertQuery;
    
    // First, check which columns exist
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('maintaining_quantity', 'points', 'image_url', 'purchase_rate', 'discount_1', 'discount_2', 'model_number')
    `);
    
    const existingColumns = columnCheck.rows.map(r => r.column_name);
    const hasMaintainingQty = existingColumns.includes('maintaining_quantity');
    const hasPoints = existingColumns.includes('points');
    const hasImageUrl = existingColumns.includes('image_url');
    const hasPurchaseRate = existingColumns.includes('purchase_rate');
    const hasDiscount1 = existingColumns.includes('discount_1');
    const hasDiscount2 = existingColumns.includes('discount_2');
    const hasModelNumber = existingColumns.includes('model_number');
    
    // Build query based on existing columns
    let columns = ['product_name', 'item_code', 'sku_code', 'minimum_quantity', 'current_quantity', 'status', 'mrp', 'discount', 'sell_rate', 'supplier_name', 'category', 'is_verified', 'created_by'];
    let values = [finalProductName, finalItemCode, finalSkuCode, parsedMinQty, parsedCurrentQty, 'STOCK', parsedMrp, parsedDiscount, parsedSellRate, supplierName ? supplierName.trim() : null, category && category.trim() !== '' ? category.trim() : null, isVerified, createdBy || null];
    let paramIndex = values.length + 1;
    
    if (hasMaintainingQty) {
      columns.splice(4, 0, 'maintaining_quantity');
      values.splice(4, 0, parsedMaintainingQty);
      paramIndex++;
    }
    
    if (hasPoints) {
      columns.push('points');
      values.push(parsedPoints);
      paramIndex++;
    }
    
    if (hasImageUrl) {
      columns.push('image_url');
      values.push(imageUrl || null);
      paramIndex++;
    }
    
    if (hasPurchaseRate) {
      columns.push('purchase_rate');
      values.push(parsedPurchaseRate);
      paramIndex++;
    }
    
    if (hasDiscount1) {
      columns.push('discount_1');
      values.push(parsedDiscount1);
      paramIndex++;
    }
    
    if (hasDiscount2) {
      columns.push('discount_2');
      values.push(parsedDiscount2);
      paramIndex++;
    }
    
    if (hasModelNumber) {
      columns.push('model_number');
      values.push(finalModelNumber);
      paramIndex++;
    }
    
    // Build the parameterized query
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    insertQuery = `INSERT INTO products (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
    console.log('Insert query:', insertQuery);
    console.log('Insert values:', values);
    
    try {
      result = await pool.query(insertQuery, values);
    } catch (dbError) {
      // If it's a unique constraint violation, provide better error
      if (dbError.code === '23505') {
        if (dbError.constraint && dbError.constraint.includes('item_code')) {
          return res.status(400).json({ 
            error: `Item code "${finalItemCode}" already exists. Please use a different item code.` 
          });
        }
        if (dbError.constraint && dbError.constraint.includes('sku_code')) {
          return res.status(400).json({ 
            error: `SKU code "${finalSkuCode}" already exists. Please use a different SKU code.` 
          });
        }
        return res.status(400).json({ 
          error: 'Item code or SKU code already exists. Please use different codes.' 
        });
      }
      throw dbError;
    }

    const newProduct = result.rows[0];
    
    // Send notification if created by staff
    if (!isVerified) {
      await notifyStaffCreation('Product', `${newProduct.product_name} (${newProduct.item_code})`, newProduct.id);
    } else {
      // Create critical alert for new product (admin/supervisor created)
      try {
        await createCriticalAlert(
          'info',
          'New Product Created',
          `Product "${newProduct.product_name}" (${newProduct.item_code}) has been added to inventory`,
          newProduct.id
        );
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    res.status(201).json({
      success: true,
      product: newProduct,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Create product error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      constraint: error.constraint,
      column: error.column,
      stack: error.stack
    });
    
    if (error.code === '23505') { // Unique violation
      if (error.constraint && error.constraint.includes('item_code')) {
        return res.status(400).json({ error: 'Item code already exists. Please use a different item code.' });
      }
      if (error.constraint && error.constraint.includes('sku_code')) {
        return res.status(400).json({ error: 'SKU code already exists. Please use a different SKU code.' });
      }
      return res.status(400).json({ error: 'Item code or SKU code already exists' });
    }
    if (error.code === '23502') { // Not null violation
      return res.status(400).json({ 
        error: `Required field missing: ${error.column || 'unknown'}. Please check database constraints.`,
        column: error.column
      });
    }
    
    // Return more detailed error in development, generic in production
    const errorResponse = {
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred while creating the product'
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.code = error.code;
      errorResponse.detail = error.detail;
      errorResponse.constraint = error.constraint;
      errorResponse.column = error.column;
    }
    
    res.status(500).json(errorResponse);
  }
});

// Verify product (admin/supervisor only)
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    await ensureVerificationColumn('products');
    
    const result = await pool.query(
      'UPDATE products SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ 
      success: true, 
      product: result.rows[0],
      message: 'Product verified successfully' 
    });
  } catch (error) {
    console.error('Verify product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, itemCode, skuCode, modelNumber, minimumQuantity, supplierName, category, mrp, discount, sellRate, currentQuantity, status } = req.body;

    // Fetch previous product values before updating
    const prevResult = await pool.query('SELECT current_quantity, minimum_quantity FROM products WHERE id = $1', [id]);
    if (prevResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const prevProduct = prevResult.rows[0];
    const prevQty = parseInt(prevProduct.current_quantity) || 0;
    const prevMinQty = parseInt(prevProduct.minimum_quantity) || 0;

    // Check if model_number column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'model_number'
    `);
    const hasModelNumber = columnCheck.rows.length > 0;

    // Trim and handle optional fields
    const trimmedSkuCode = skuCode ? skuCode.trim() : null;
    const finalSkuCode = (trimmedSkuCode && trimmedSkuCode.length > 0) ? trimmedSkuCode : null;
    const trimmedModelNumber = modelNumber ? modelNumber.trim() : null;
    const finalModelNumber = (trimmedModelNumber && trimmedModelNumber.length > 0) ? trimmedModelNumber : null;

    // Build update query dynamically based on whether model_number column exists
    let updateQuery;
    let updateValues;
    
    if (hasModelNumber) {
      updateQuery = `UPDATE products 
       SET product_name = $1, item_code = $2, sku_code = $3, model_number = $4, minimum_quantity = $5, 
           mrp = $6, discount = $7, sell_rate = $8, current_quantity = $9, status = $10, supplier_name = $11, category = $12, updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`;
      updateValues = [
        productName,
        itemCode,
        finalSkuCode,
        finalModelNumber,
        minimumQuantity || 0,
        mrp || null,
        discount || 0,
        sellRate || null,
        currentQuantity !== undefined ? currentQuantity : null,
        status || 'STOCK',
        supplierName || null,
        category && category.trim() !== '' ? category.trim() : null,
        id
      ];
    } else {
      updateQuery = `UPDATE products 
       SET product_name = $1, item_code = $2, sku_code = $3, minimum_quantity = $4, 
           mrp = $5, discount = $6, sell_rate = $7, current_quantity = $8, status = $9, supplier_name = $10, category = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`;
      updateValues = [
        productName,
        itemCode,
        finalSkuCode,
        minimumQuantity || 0,
        mrp || null,
        discount || 0,
        sellRate || null,
        currentQuantity !== undefined ? currentQuantity : null,
        status || 'STOCK',
        supplierName || null,
        category && category.trim() !== '' ? category.trim() : null,
        id
      ];
    }

    const result = await pool.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = result.rows[0];
    const newQty = parseInt(updatedProduct.current_quantity) || 0;
    const minQty = parseInt(updatedProduct.minimum_quantity) || 0;
    
    // Check if stock went from above minimum to below minimum
    const wasAboveMin = prevQty > prevMinQty;
    const isNowBelowMin = newQty <= minQty;
    
    // Create critical alert if stock is low
    if (isNowBelowMin && (wasAboveMin || newQty < prevQty)) {
      try {
        await createCriticalAlert(
          'warning',
          'Low Stock Alert',
          `Product "${updatedProduct.product_name}" (${updatedProduct.item_code}) stock is now ${newQty} units (below minimum: ${minQty})`,
          updatedProduct.id
        );
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    res.json({
      success: true,
      product: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Item code or SKU code already exists' });
    }
    console.error('Update product error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

