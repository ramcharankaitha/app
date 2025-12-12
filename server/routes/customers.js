const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { sendCustomerWelcomeMessage } = require('../services/smsService');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM customers ORDER BY created_at DESC'
    );
    res.json({ success: true, customers: result.rows });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ success: true, customer: result.rows[0] });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { fullName, email, phone, address, itemCode, quantity, mrp, sellRate, discount, paymentMode } = req.body;

    if (!fullName || !email) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    const customerQuantity = quantity || 0;

    // If itemCode and quantity are provided, update product quantity
    if (itemCode && customerQuantity > 0) {
      // Find the product by item code
      const productResult = await client.query(
        'SELECT id, current_quantity, product_name FROM products WHERE item_code = $1',
        [itemCode]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Product with item code "${itemCode}" not found` });
      }

      const product = productResult.rows[0];
      const currentQuantity = parseInt(product.current_quantity) || 0;
      const requestedQuantity = parseInt(customerQuantity);

      // Check if enough stock is available
      if (currentQuantity < requestedQuantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Insufficient stock. Available: ${currentQuantity}, Requested: ${requestedQuantity}` 
        });
      }

      // Update product quantity (subtract the purchased quantity)
      const newQuantity = Math.max(0, currentQuantity - requestedQuantity);
      await client.query(
        'UPDATE products SET current_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newQuantity, product.id]
      );

      console.log(`Product "${product.product_name}" (${product.id}) quantity updated: ${currentQuantity} -> ${newQuantity} (sold ${requestedQuantity})`);
    }

    // Create the customer record
    const result = await client.query(
      `INSERT INTO customers (full_name, email, phone, address, item_code, quantity, mrp, sell_rate, discount, payment_mode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        fullName, 
        email, 
        phone || null, 
        address || null, 
        itemCode || null,
        customerQuantity,
        mrp || null,
        sellRate || null,
        discount || 0,
        paymentMode || null
      ]
    );

    await client.query('COMMIT');

    const customer = result.rows[0];

    // Send WhatsApp message to customer if phone number is provided
    let whatsappResult = null;
    if (phone && phone.trim()) {
      try {
        whatsappResult = await sendCustomerWelcomeMessage(fullName, phone);
        if (whatsappResult.success) {
          console.log(`✅ Welcome WhatsApp message sent to ${fullName} (${phone})`);
        } else {
          console.warn(`⚠️  Failed to send WhatsApp to ${fullName}: ${whatsappResult.error}`);
        }
      } catch (whatsappError) {
        // Don't fail the customer creation if WhatsApp fails
        console.error('WhatsApp error (non-blocking):', whatsappError);
      }
    }

    res.json({
      success: true,
      customer: customer,
      message: itemCode && customerQuantity > 0 
        ? `Customer created successfully. Product quantity updated.` 
        : 'Customer created successfully',
      whatsappSent: whatsappResult ? whatsappResult.success : false
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create customer error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, address, storeId } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    const result = await pool.query(
      `UPDATE customers 
       SET full_name = $1, email = $2, phone = $3, address = $4, store_id = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [fullName, email, phone || null, address || null, storeId || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      success: true,
      customer: result.rows[0],
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Update customer error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

