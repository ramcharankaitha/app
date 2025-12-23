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
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Stock Out - Remove stock from a product
router.post('/out', async (req, res) => {
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
        'STOCK_OUT',
        quantityToRemove,
        previousQuantity,
        newQuantity,
        notes || null,
        createdBy || 'system'
      ]
    );
    
    await client.query('COMMIT');
    
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
    await client.query('ROLLBACK');
    console.error('Stock Out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get stock transactions history
router.get('/transactions', async (req, res) => {
  try {
    const { itemCode, productId, type, limit = 100, offset = 0 } = req.query;
    
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
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      transactions: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get stock transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
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

