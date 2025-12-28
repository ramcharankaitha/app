const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Stock In - Add stock to a product
router.post('/in', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { itemCode, quantity, notes, createdBy } = req.body;
    
    if (!itemCode || !quantity || quantity <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Item code and valid quantity are required' });
    }
    
    // Find product by item code
    const productResult = await client.query(
      'SELECT id, product_name, current_quantity FROM products WHERE item_code = $1',
      [itemCode.trim()]
    );
    
    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Product with item code "${itemCode}" not found` });
    }
    
    const product = productResult.rows[0];
    const previousQuantity = parseInt(product.current_quantity) || 0;
    const quantityToAdd = parseInt(quantity);
    const newQuantity = previousQuantity + quantityToAdd;
    
    // Update product quantity
    await client.query(
      'UPDATE products SET current_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newQuantity, product.id]
    );
    
    // Record stock transaction
    await client.query(
      `INSERT INTO stock_transactions (
        product_id, item_code, product_name, transaction_type, 
        quantity, previous_quantity, new_quantity, 
        notes, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
      [
        product.id,
        itemCode.trim(),
        product.product_name,
        'STOCK_IN',
        quantityToAdd,
        previousQuantity,
        newQuantity,
        notes || null,
        createdBy || 'system'
      ]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: `Stock added successfully. New quantity: ${newQuantity}`,
      product: {
        id: product.id,
        itemCode: itemCode.trim(),
        productName: product.product_name,
        previousQuantity,
        quantityAdded: quantityToAdd,
        newQuantity
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Stock In error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      constraint: error.constraint
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please check server logs'
    });
  } finally {
    client.release();
  }
});

// Stock Out - Remove stock from a product
router.post('/out', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { itemCode, quantity, notes, createdBy, customerName, customerPhone, paymentMode, mrp, sellRate, discount } = req.body;
    
    if (!itemCode || !quantity || quantity <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Item code and valid quantity are required' });
    }
    
    // Find product by item code
    const productResult = await client.query(
      'SELECT id, product_name, current_quantity, mrp, sell_rate, discount FROM products WHERE item_code = $1',
      [itemCode.trim()]
    );
    
    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Product with item code "${itemCode}" not found` });
    }
    
    const product = productResult.rows[0];
    const previousQuantity = parseInt(product.current_quantity) || 0;
    const quantityToRemove = parseInt(quantity);
    
    // Check if sufficient stock is available
    if (previousQuantity < quantityToRemove) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Insufficient stock. Available: ${previousQuantity}, Requested: ${quantityToRemove}` 
      });
    }
    
    const newQuantity = previousQuantity - quantityToRemove;
    
    // Update product quantity
    await client.query(
      'UPDATE products SET current_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newQuantity, product.id]
    );
    
    // Use provided pricing or product pricing
    const finalMrp = mrp || product.mrp || 0;
    const finalSellRate = sellRate || product.sell_rate || 0;
    const finalDiscount = discount || product.discount || 0;
    const totalAmount = finalSellRate * quantityToRemove;
    
    // Record stock transaction (same simple pattern as Stock In)
    await client.query(
      `INSERT INTO stock_transactions (
        product_id, item_code, product_name, transaction_type, 
        quantity, previous_quantity, new_quantity, 
        reference_type, payment_mode, customer_name, customer_phone, notes, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)`,
      [
        product.id,
        itemCode.trim(),
        product.product_name,
        'STOCK_OUT',
        quantityToRemove,
        previousQuantity,
        newQuantity,
        customerName && customerPhone ? 'CUSTOMER' : null,
        paymentMode || null,
        customerName ? customerName.trim() : null,
        customerPhone ? customerPhone.trim() : null,
        notes || null,
        createdBy || 'system'
      ]
    );
    
    console.log('✅ Stock OUT transaction inserted successfully');
    console.log('📝 Transaction details:', {
      item_code: itemCode.trim(),
      product_name: product.product_name,
      quantity: quantityToRemove,
      transaction_type: 'STOCK_OUT',
      customer_name: customerName || 'N/A',
      customer_phone: customerPhone || 'N/A'
    });
    
    // COMMIT the transaction FIRST (same simple pattern as Stock In)
    // This MUST happen before any customer record creation to ensure stock transaction is saved
    await client.query('COMMIT');
    console.log('✅ Stock OUT transaction COMMITTED successfully');
    
    // Release the client after commit
    client.release();
    
    // Now handle customer record creation in a separate transaction (non-blocking)
    // This way, even if customer record creation fails, the stock transaction is already saved
    if (customerName && customerPhone && paymentMode) {
      // Use a separate connection for customer record creation
      const customerClient = await pool.connect();
      try {
        await customerClient.query('BEGIN');
        
        // Get full customer details from existing customer record
        const existingCustomer = await customerClient.query(
          'SELECT email, address, city, state, pincode FROM customers WHERE phone = $1 ORDER BY created_at DESC LIMIT 1',
          [customerPhone.trim()]
        );
        const customerEmail = existingCustomer.rows.length > 0 ? existingCustomer.rows[0].email : null;
        const customerAddress = existingCustomer.rows.length > 0 ? existingCustomer.rows[0].address : null;
        const customerCity = existingCustomer.rows.length > 0 ? existingCustomer.rows[0].city : null;
        const customerState = existingCustomer.rows.length > 0 ? existingCustomer.rows[0].state : null;
        const customerPincode = existingCustomer.rows.length > 0 ? existingCustomer.rows[0].pincode : null;
        
        // Create customer purchase record with product and payment details
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 11);
        const purchaseEmail = customerEmail || `${customerPhone.trim()}_${timestamp}_${randomStr}@purchase.local`;
        
        await customerClient.query(
          `INSERT INTO customers (
            full_name, email, phone, address, city, state, pincode, item_code, quantity, mrp, sell_rate, discount, 
            payment_mode, total_amount, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            customerName.trim(),
            purchaseEmail,
            customerPhone.trim(),
            customerAddress || null,
            customerCity || null,
            customerState || null,
            customerPincode || null,
            itemCode.trim(),
            quantityToRemove,
            finalMrp || 0,
            finalSellRate || 0,
            finalDiscount || 0,
            paymentMode,
            totalAmount || 0,
            createdBy || 'system'
          ]
        );
        
        // Update customer tokens if applicable
        const tokensEarned = Math.floor(totalAmount / 1000);
        if (tokensEarned > 0 && (customerEmail || customerPhone)) {
          try {
            const tokenCheck = await customerClient.query(
              `SELECT * FROM customer_tokens 
               WHERE (customer_phone = $1 OR customer_email = $2) 
               AND (customer_phone IS NOT NULL OR customer_email IS NOT NULL)
               LIMIT 1`,
              [customerPhone.trim() || null, customerEmail || null]
            );
            
            if (tokenCheck.rows.length > 0) {
              await customerClient.query(
                `UPDATE customer_tokens 
                 SET tokens = tokens + $1,
                     total_purchased = total_purchased + $2,
                     tokens_earned = tokens_earned + $3,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE (customer_phone = $4 OR customer_email = $5)
                 AND (customer_phone IS NOT NULL OR customer_email IS NOT NULL)`,
                [tokensEarned, totalAmount, tokensEarned, customerPhone.trim() || null, customerEmail || null]
              );
            } else {
              await customerClient.query(
                `INSERT INTO customer_tokens (customer_phone, customer_email, tokens, total_purchased, tokens_earned, updated_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                [customerPhone.trim() || null, customerEmail || null, tokensEarned, totalAmount, tokensEarned]
              );
            }
          } catch (tokenError) {
            console.error('Token update error (non-blocking):', tokenError.message);
          }
        }
        
        await customerClient.query('COMMIT');
      } catch (customerError) {
        await customerClient.query('ROLLBACK');
        console.error('⚠️ Customer purchase record error (non-blocking - stock transaction already saved):', customerError.message);
      } finally {
        customerClient.release();
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Stock removed successfully. New quantity: ${newQuantity}`,
      product: {
        id: product.id,
        itemCode: itemCode.trim(),
        productName: product.product_name,
        previousQuantity,
        quantityRemoved: quantityToRemove,
        newQuantity
      }
    });
  } catch (error) {
    try {
      // Only rollback if client is still active (not released)
      if (client) {
        try {
          await client.query('ROLLBACK');
          console.error('❌ Transaction ROLLED BACK due to error');
        } catch (rollbackError) {
          // Client might already be released, ignore
        }
      }
    } catch (rollbackError) {
      console.error('❌ Error during rollback:', rollbackError);
    }
    console.error('❌ Stock Out error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An error occurred while processing stock out',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // Only release if client exists and hasn't been released yet
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        // Client might already be released, ignore
      }
    }
  }
});

// Get stock transactions history
router.get('/transactions', async (req, res) => {
  try {
    const { itemCode, productId, type, limit = 100, offset = 0 } = req.query;
    
    console.log('GET /stock/transactions - Query params:', { itemCode, productId, type, limit, offset });
    
    let query = 'SELECT * FROM stock_transactions WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (itemCode) {
      query += ` AND item_code = $${paramCount}`;
      params.push(itemCode.trim());
      paramCount++;
    }
    
    if (productId) {
      query += ` AND product_id = $${paramCount}`;
      params.push(parseInt(productId));
      paramCount++;
    }
    
    if (type) {
      query += ` AND transaction_type = $${paramCount}`;
      params.push(type.toUpperCase());
      paramCount++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    console.log('Executing query:', query);
    console.log('Query params:', params);
    
    const result = await pool.query(query, params);
    
    console.log(`📊 GET /stock/transactions - Found ${result.rows.length} transactions`);
    if (result.rows.length > 0) {
      console.log('✅ First transaction:', JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('⚠️ No transactions found with query filters');
      // Check if there are any transactions at all
      const allTransactions = await pool.query('SELECT COUNT(*) as count FROM stock_transactions');
      console.log('📊 Total transactions in database:', allTransactions.rows[0]?.count || 0);
      const stockOutCount = await pool.query("SELECT COUNT(*) as count FROM stock_transactions WHERE transaction_type = 'STOCK_OUT'");
      console.log('📊 Total STOCK_OUT transactions:', stockOutCount.rows[0]?.count || 0);
      if (parseInt(stockOutCount.rows[0]?.count || 0) > 0) {
        // Get a sample to see what's in the DB
        const sample = await pool.query("SELECT * FROM stock_transactions WHERE transaction_type = 'STOCK_OUT' ORDER BY created_at DESC LIMIT 1");
        console.log('📊 Sample STOCK_OUT transaction:', JSON.stringify(sample.rows[0], null, 2));
      }
    }
    
    res.json({
      success: true,
      transactions: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ Get stock transactions error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to fetch stock transactions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current stock for all products or a specific product
router.get('/current', async (req, res) => {
  try {
    const { itemCode } = req.query;
    
    if (itemCode) {
      const result = await pool.query(
        'SELECT id, product_name, item_code, sku_code, current_quantity, minimum_quantity FROM products WHERE item_code = $1',
        [itemCode.trim()]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      return res.json({
        success: true,
        product: result.rows[0]
      });
    }
    
    // Get all products with stock info
    const result = await pool.query(
      `SELECT id, product_name, item_code, sku_code, current_quantity, minimum_quantity, 
       CASE 
         WHEN current_quantity <= minimum_quantity THEN 'LOW'
         WHEN current_quantity = 0 THEN 'OUT'
         ELSE 'OK'
       END as stock_status
       FROM products 
       ORDER BY current_quantity ASC, product_name ASC`
    );
    
    res.json({
      success: true,
      products: result.rows
    });
  } catch (error) {
    console.error('Get current stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

