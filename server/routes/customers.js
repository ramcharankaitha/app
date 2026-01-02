const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { sendCustomerWelcomeMessage } = require('../services/smsService');

router.get('/', async (req, res) => {
  try {
    const { type } = req.query; // Optional: 'walkin' or 'chitplan'
    
    let query;
    if (type === 'walkin') {
      // Get only walk-in customers (not in chit_customers table)
      query = `SELECT 
        c.*,
        'walkin' as customer_type
      FROM customers c 
      WHERE NOT EXISTS (
        SELECT 1 FROM chit_customers cc 
        WHERE cc.phone = c.phone 
        AND c.phone IS NOT NULL
      )
      ORDER BY c.created_at DESC`;
    } else if (type === 'chitplan') {
      // Get only chit plan customers
      query = `SELECT 
        c.*,
        'chitplan' as customer_type
      FROM customers c 
      WHERE EXISTS (
        SELECT 1 FROM chit_customers cc 
        WHERE cc.phone = c.phone 
        AND c.phone IS NOT NULL
      )
      ORDER BY c.created_at DESC`;
    } else {
      // Get all customers with type
      query = `SELECT 
        c.*,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM chit_customers cc 
            WHERE cc.phone = c.phone 
            AND c.phone IS NOT NULL
          ) THEN 'chitplan'
          ELSE 'walkin'
        END as customer_type
      FROM customers c 
      ORDER BY c.created_at DESC`;
    }
    
    const result = await pool.query(query);
    res.json({ success: true, customers: result.rows });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search customers by name or phone (for dispatch form and phone validation)
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name || name.trim() === '') {
      return res.json({ success: true, customers: [] });
    }

    const searchTerm = name.trim();
    
    // Check if search term looks like a phone number (contains only digits, spaces, +, -, etc.)
    const isPhoneNumber = /^[\d\s\+\-\(\)]+$/.test(searchTerm);
    
    let query;
    let params;
    
    if (isPhoneNumber) {
      // Search by phone number (exact match or partial)
      const phoneDigits = searchTerm.replace(/\D/g, ''); // Remove non-digits
      query = `SELECT DISTINCT 
        full_name, 
        email, 
        phone, 
        address, 
        city, 
        state, 
        pincode,
        MIN(created_at) as first_purchase_date,
        MAX(created_at) as last_purchase_date
      FROM customers 
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') LIKE $1
         OR phone = $2
      GROUP BY full_name, email, phone, address, city, state, pincode
      ORDER BY full_name ASC
      LIMIT 20`;
      params = [`%${phoneDigits}%`, searchTerm];
    } else {
      // Search by name
      query = `SELECT DISTINCT 
        full_name, 
        email, 
        phone, 
        address, 
        city, 
        state, 
        pincode,
        MIN(created_at) as first_purchase_date,
        MAX(created_at) as last_purchase_date
      FROM customers 
      WHERE LOWER(full_name) LIKE LOWER($1)
      GROUP BY full_name, email, phone, address, city, state, pincode
      ORDER BY full_name ASC
      LIMIT 20`;
      params = [`%${searchTerm}%`];
    }

    const result = await pool.query(query, params);

    res.json({ success: true, customers: result.rows });
  } catch (error) {
    console.error('Search customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all products/purchases for a customer by name, email, or phone
router.get('/products/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    console.log('Fetching products for customer identifier:', identifier);
    
    // Search by name, email, or phone - get all purchases with product details
    const result = await pool.query(
      `SELECT DISTINCT
        c.item_code,
        c.quantity,
        c.mrp,
        c.sell_rate,
        c.discount,
        COALESCE(p.product_name, c.item_code) as product_name,
        p.sku_code,
        p.category
      FROM customers c
      LEFT JOIN products p ON c.item_code = p.item_code
      WHERE (LOWER(c.full_name) = LOWER($1) 
         OR c.phone = $1)
         AND (c.item_code IS NOT NULL AND c.item_code != '')
      ORDER BY c.created_at DESC`,
      [identifier]
    );

    console.log(`Found ${result.rows.length} product records for customer`);

    // Also get customer details (first record)
    const customerResult = await pool.query(
      `SELECT DISTINCT
        full_name,
        email,
        phone,
        address,
        city,
        state,
        pincode
      FROM customers
      WHERE LOWER(full_name) = LOWER($1)
         OR phone = $1
      LIMIT 1`,
      [identifier]
    );

    res.json({ 
      success: true, 
      products: result.rows,
      customer: customerResult.rows[0] || null
    });
  } catch (error) {
    console.error('Get customer products error:', error);
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
    if (customer.phone) {
      const tokenResult = await pool.query(
        'SELECT tokens FROM customer_tokens WHERE customer_phone = $1 AND customer_phone IS NOT NULL',
        [customer.phone]
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
    
    const { fullName, phone, address, city, state, pincode, whatsapp, itemCode, quantity, mrp, sellRate, discount, paymentMode, tokensUsed, tokensEarned, totalAmount, createdBy, chitPlanId, userRole } = req.body;
    
    // Ensure verification columns exist
    const { ensureVerificationColumn, shouldBeVerified, notifyStaffCreation } = require('../utils/verification');
    await ensureVerificationColumn('customers');
    
    // Determine verification status based on user role
    const isVerified = shouldBeVerified(userRole || 'staff');

    if (!fullName) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Full name is required' });
    }

    // Check if phone number already exists
    if (phone && phone.trim() !== '') {
      const existingCustomer = await client.query(
        'SELECT id, full_name, email FROM customers WHERE phone = $1 LIMIT 1',
        [phone.trim()]
      );
      
      if (existingCustomer.rows.length > 0) {
        await client.query('ROLLBACK');
        const existing = existingCustomer.rows[0];
        return res.status(400).json({ 
          error: `Mobile number already exists! This number is registered with customer: ${existing.full_name} (${existing.email})` 
        });
      }
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
      `INSERT INTO customers (full_name, email, phone, address, city, state, pincode, whatsapp, item_code, quantity, mrp, sell_rate, discount, payment_mode, tokens_used, tokens_earned, created_by, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        fullName, 
        null, // email is no longer required
        phone || null, 
        address || null,
        city || null,
        state || null,
        pincode || null,
        whatsapp || null,
        itemCode || null,
        customerQuantity,
        mrp || null,
        sellRate || null,
        discount || 0,
        paymentMode || null,
        tokensToRedeem,
        tokensToEarn,
        createdBy || null,
        isVerified
      ]
    );

    // If chit plan is selected, also create entry in chit_customers table
    if (req.body.chitPlanId) {
      try {
        await client.query(
          `INSERT INTO chit_customers (customer_name, phone, address, city, state, pincode, email, chit_plan_id, payment_mode, enrollment_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)`,
          [
            fullName,
            phone || null,
            address || null,
            city || null,
            state || null,
            pincode || null,
            email || null,
            parseInt(req.body.chitPlanId),
            paymentMode || null
          ]
        );
      } catch (chitError) {
        console.error('Error creating chit customer entry:', chitError);
        // Don't fail the entire request if chit customer creation fails
        // The main customer is already created
      }
    }

    // Update customer tokens (using phone only, email removed)
    if (phone) {
      // Find or create customer_tokens record
      let tokenResult = await client.query(
        'SELECT * FROM customer_tokens WHERE customer_phone = $1 AND customer_phone IS NOT NULL',
        [phone]
      );

      if (tokenResult.rows.length === 0) {
        // Create new token record
        await client.query(
          'INSERT INTO customer_tokens (customer_phone, customer_email, tokens, total_purchased, tokens_earned, tokens_redeemed) VALUES ($1, $2, $3, $4, $5, $6)',
          [phone, null, tokensToEarn, finalAmount, tokensToEarn, tokensToRedeem]
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
           WHERE customer_phone = $5 AND customer_phone IS NOT NULL`,
          [newTokens, finalAmount, tokensToEarn, tokensToRedeem, phone]
        );
      }
    }

    // If chit plan is selected, also create entry in chit_customers table
    if (chitPlanId) {
      try {
        await client.query(
          `INSERT INTO chit_customers (customer_name, phone, address, city, state, pincode, email, chit_plan_id, payment_mode, enrollment_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)`,
          [
            fullName,
            phone || null,
            address || null,
            city || null,
            state || null,
            pincode || null,
            null, // email is no longer required
            parseInt(chitPlanId),
            paymentMode || null
          ]
        );
      } catch (chitError) {
        console.error('Error creating chit customer entry:', chitError);
        // Don't fail the entire request if chit customer creation fails
        // The main customer is already created
      }
    }

    await client.query('COMMIT');

    const customer = result.rows[0];
    
    // Send notification if created by staff
    if (!isVerified) {
      await notifyStaffCreation('Customer', fullName, customer.id);
    }

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
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      constraint: error.constraint
    });
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (error.code === '23502') { // Not null violation
      return res.status(400).json({ error: `Required field missing: ${error.column || 'unknown'}` });
    }
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Invalid reference data' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please check server logs'
    });
  } finally {
    client.release();
  }
});

// Verify customer (admin/supervisor only)
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { ensureVerificationColumn } = require('../utils/verification');
    await ensureVerificationColumn('customers');
    
    const result = await pool.query(
      'UPDATE customers SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ 
      success: true, 
      customer: result.rows[0],
      message: 'Customer verified successfully' 
    });
  } catch (error) {
    console.error('Verify customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, address, storeId } = req.body;

    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const result = await pool.query(
      `UPDATE customers 
       SET full_name = $1, phone = $2, address = $3, store_id = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [fullName, phone || null, address || null, storeId || null, id]
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

// Generate unique 4-digit chit number
const generateChitNumber = async () => {
  const prefix = 'CHIT';
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    // Generate a random 4-digit number (1000-9999)
    const fourDigit = Math.floor(1000 + Math.random() * 9000);
    const chitNumber = `${prefix}-${fourDigit}`;
    
    // Check if this chit number already exists
    try {
      // First ensure the chit_number column exists in chit_customers table
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'chit_customers' AND column_name = 'chit_number'
          ) THEN
            ALTER TABLE chit_customers ADD COLUMN chit_number VARCHAR(100);
            RAISE NOTICE 'Added chit_number column to chit_customers';
          END IF;
        END $$;
      `);
      
      const checkResult = await pool.query(
        'SELECT id FROM chit_customers WHERE chit_number = $1 LIMIT 1',
        [chitNumber]
      );
      
      if (checkResult.rows.length === 0) {
        // Chit number is unique
        console.log('Generated unique chit number:', chitNumber);
        return chitNumber;
      }
    } catch (error) {
      // If there's an error checking, just return the number anyway
      console.log('Could not check chit number uniqueness, using generated number:', chitNumber, error.message);
      return chitNumber;
    }
    
    attempts++;
  }
  
  // Fallback: use timestamp-based if we can't find a unique 4-digit number
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

// Create chit plan customer with chit number
router.post('/chit-plan', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { fullName, phone, address, city, state, pincode, whatsapp, chitPlanId, duration, startDate, endDate, createdBy } = req.body;

    if (!fullName || !phone || !chitPlanId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Full name, phone, and chit plan are required' });
    }

    // Check if this phone number already has a chit plan (not just if customer exists)
    if (phone && phone.trim() !== '') {
      const existingChitCustomer = await client.query(
        'SELECT id, customer_name, chit_number FROM chit_customers WHERE phone = $1 LIMIT 1',
        [phone.trim()]
      );
      
      if (existingChitCustomer.rows.length > 0) {
        await client.query('ROLLBACK');
        const existing = existingChitCustomer.rows[0];
        return res.status(400).json({ 
          error: `This phone number already has a chit plan! Customer: ${existing.customer_name}, Chit Number: ${existing.chit_number || 'N/A'}` 
        });
      }
    }

    // Check if customer already exists, if not create one
    let customer;
    const existingCustomerCheck = await client.query(
      'SELECT id, full_name, email, phone, address, city, state, pincode, whatsapp FROM customers WHERE phone = $1 LIMIT 1',
      [phone.trim()]
    );
    
    if (existingCustomerCheck.rows.length > 0) {
      // Customer already exists, use existing customer
      customer = existingCustomerCheck.rows[0];
    } else {
      // Create new customer record
      const customerResult = await client.query(
        `INSERT INTO customers (full_name, email, phone, address, city, state, pincode, whatsapp, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          fullName.trim(), 
          null, // email
          phone.trim(), 
          address ? address.trim() : null,
          city ? city.trim() : null,
          state ? state.trim() : null,
          pincode ? pincode.trim() : null,
          whatsapp ? whatsapp.trim() : null,
          createdBy || 'system'
        ]
      );
      customer = customerResult.rows[0];
    }

    // Generate unique chit number
    const chitNumber = await generateChitNumber();

    // Ensure duration, start_date, and end_date columns exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'chit_customers' AND column_name = 'duration'
        ) THEN
          ALTER TABLE chit_customers ADD COLUMN duration INTEGER;
          RAISE NOTICE 'Added duration column to chit_customers';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'chit_customers' AND column_name = 'start_date'
        ) THEN
          ALTER TABLE chit_customers ADD COLUMN start_date DATE;
          RAISE NOTICE 'Added start_date column to chit_customers';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'chit_customers' AND column_name = 'end_date'
        ) THEN
          ALTER TABLE chit_customers ADD COLUMN end_date DATE;
          RAISE NOTICE 'Added end_date column to chit_customers';
        END IF;
      END $$;
    `);

    // Create chit customer entry with chit number
    const chitCustomerResult = await client.query(
      `INSERT INTO chit_customers (customer_name, phone, address, city, state, pincode, email, chit_plan_id, chit_number, duration, start_date, end_date, enrollment_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, COALESCE($11, CURRENT_DATE))
       RETURNING *`,
      [
        fullName.trim(),
        phone.trim(),
        address ? address.trim() : null,
        city ? city.trim() : null,
        state ? state.trim() : null,
        pincode ? pincode.trim() : null,
        null, // email
        parseInt(chitPlanId),
        chitNumber,
        duration ? parseInt(duration) : null,
        startDate || null,
        endDate || null
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      customer: customer,
      chitCustomer: chitCustomerResult.rows[0],
      chitNumber: chitNumber,
      message: 'Chit plan customer created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create chit plan customer error:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Invalid chit plan selected' });
    }
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Phone number already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get customer by chit number
router.get('/chit-number/:chitNumber', async (req, res) => {
  try {
    const { chitNumber } = req.params;
    
    const result = await pool.query(
      `SELECT 
        cc.*,
        c.full_name,
        c.phone,
        c.address,
        c.city,
        c.state,
        c.pincode,
        c.whatsapp,
        cp.plan_name,
        cp.plan_amount,
        cp.description
      FROM chit_customers cc
      LEFT JOIN customers c ON cc.phone = c.phone
      LEFT JOIN chit_plans cp ON cc.chit_plan_id = cp.id
      WHERE cc.chit_number = $1
      LIMIT 1`,
      [chitNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chit number not found' });
    }

    const chitCustomer = result.rows[0];
    
    // Fetch paid months for this chit customer
    let paidMonths = [];
    try {
      const paidMonthsResult = await pool.query(
        `SELECT DISTINCT month 
         FROM chit_entries 
         WHERE customer_id = $1 AND month IS NOT NULL
         ORDER BY month ASC`,
        [chitCustomer.id]
      );
      paidMonths = paidMonthsResult.rows.map(row => row.month);
    } catch (err) {
      console.error('Error fetching paid months:', err);
      // Continue even if this fails - just means no months are paid yet
    }
    
    res.json({
      success: true,
      customer: {
        id: chitCustomer.id,
        customerName: chitCustomer.customer_name || chitCustomer.full_name,
        phone: chitCustomer.phone,
        address: chitCustomer.address,
        city: chitCustomer.city,
        state: chitCustomer.state,
        pincode: chitCustomer.pincode,
        whatsapp: chitCustomer.whatsapp,
        chitNumber: chitCustomer.chit_number,
        chitPlanId: chitCustomer.chit_plan_id,
        chitPlanName: chitCustomer.plan_name,
        chitPlanAmount: chitCustomer.plan_amount,
        duration: chitCustomer.duration,
        startDate: chitCustomer.start_date,
        endDate: chitCustomer.end_date,
        enrollmentDate: chitCustomer.enrollment_date,
        paidMonths: paidMonths
      }
    });
  } catch (error) {
    console.error('Get customer by chit number error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

