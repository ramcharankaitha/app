const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { sendCustomerWelcomeMessage } = require('../services/smsService');

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

// Get customer tokens by phone or email
router.get('/tokens', async (req, res) => {
  try {
    const { phone, email } = req.query;
    
    if (!phone && !email) {
      return res.json({ success: true, tokens: 0 });
    }

    // Find or create customer_tokens record
    let tokenResult = await pool.query(
      'SELECT * FROM customer_tokens WHERE (customer_phone = $1 OR customer_email = $2) AND ($1 IS NOT NULL OR $2 IS NOT NULL)',
      [phone || null, email || null]
    );

    if (tokenResult.rows.length === 0) {
      // Create new token record
      await pool.query(
        'INSERT INTO customer_tokens (customer_phone, customer_email, tokens) VALUES ($1, $2, 0)',
        [phone || null, email || null]
      );
      return res.json({ success: true, tokens: 0 });
    }

    res.json({ success: true, tokens: tokenResult.rows[0].tokens || 0 });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get customer tokens
    const customer = result.rows[0];
    let tokens = 0;
    if (customer.phone || customer.email) {
      const tokenResult = await pool.query(
        'SELECT tokens FROM customer_tokens WHERE (customer_phone = $1 OR customer_email = $2) AND ($1 IS NOT NULL OR $2 IS NOT NULL)',
        [customer.phone || null, customer.email || null]
      );
      if (tokenResult.rows.length > 0) {
        tokens = tokenResult.rows[0].tokens || 0;
      }
    }

    res.json({ 
      success: true, 
      customer: { ...customer, available_tokens: tokens }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { fullName, email, phone, address, itemCode, quantity, mrp, sellRate, discount, paymentMode, tokensUsed, tokensEarned, totalAmount } = req.body;

    if (!fullName || !email) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    const customerQuantity = quantity || 0;
    const tokensToRedeem = parseInt(tokensUsed) || 0;
    const tokensToEarn = parseInt(tokensEarned) || 0;
    const finalAmount = parseFloat(totalAmount) || 0;

    if (itemCode && customerQuantity > 0) {
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

      if (currentQuantity < requestedQuantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Insufficient stock. Available: ${currentQuantity}, Requested: ${requestedQuantity}` 
        });
      }

      const newQuantity = Math.max(0, currentQuantity - requestedQuantity);
      await client.query(
        'UPDATE products SET current_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newQuantity, product.id]
      );

      console.log(`Product "${product.product_name}" (${product.id}) quantity updated: ${currentQuantity} -> ${newQuantity} (sold ${requestedQuantity})`);
    }

    const result = await client.query(
      `INSERT INTO customers (full_name, email, phone, address, item_code, quantity, mrp, sell_rate, discount, payment_mode, tokens_used, tokens_earned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        paymentMode || null,
        tokensToRedeem,
        tokensToEarn
      ]
    );

    // Update customer tokens
    if (phone || email) {
      // Find or create customer_tokens record
      let tokenResult = await client.query(
        'SELECT * FROM customer_tokens WHERE (customer_phone = $1 OR customer_email = $2) AND ($1 IS NOT NULL OR $2 IS NOT NULL)',
        [phone || null, email || null]
      );

      if (tokenResult.rows.length === 0) {
        // Create new token record
        await client.query(
          'INSERT INTO customer_tokens (customer_phone, customer_email, tokens, total_purchased, tokens_earned, tokens_redeemed) VALUES ($1, $2, $3, $4, $5, $6)',
          [phone || null, email || null, tokensToEarn, finalAmount, tokensToEarn, tokensToRedeem]
        );
      } else {
        // Update existing token record
        const currentTokens = tokenResult.rows[0].tokens || 0;
        const newTokens = Math.max(0, currentTokens - tokensToRedeem + tokensToEarn);
        await client.query(
          `UPDATE customer_tokens 
           SET tokens = $1, 
               total_purchased = total_purchased + $2,
               tokens_earned = tokens_earned + $3,
               tokens_redeemed = tokens_redeemed + $4,
               updated_at = CURRENT_TIMESTAMP
           WHERE (customer_phone = $5 OR customer_email = $6) AND ($5 IS NOT NULL OR $6 IS NOT NULL)`,
          [newTokens, finalAmount, tokensToEarn, tokensToRedeem, phone || null, email || null]
        );
      }
    }

    await client.query('COMMIT');

    const customer = result.rows[0];

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
        console.error('WhatsApp error (non-blocking):', whatsappError);
      }
    }

    res.json({
      success: true,
      customer: customer,
      message: itemCode && customerQuantity > 0 
        ? `Customer created successfully. Product quantity updated.${tokensToEarn > 0 ? ` Earned ${tokensToEarn} token(s).` : ''}` 
        : `Customer created successfully.${tokensToEarn > 0 ? ` Earned ${tokensToEarn} token(s).` : ''}`,
      whatsappSent: whatsappResult ? whatsappResult.success : false,
      tokensEarned: tokensToEarn
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

