const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { sendSMS } = require('../services/smsService');

// Get all services
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services ORDER BY created_at DESC'
    );
    res.json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get services by handler - MUST come before GET /
router.get('/handler/:handlerName', async (req, res) => {
  try {
    const { handlerName } = req.params;
    const handlerId = req.query.handlerId ? parseInt(req.query.handlerId) : null;
    const decodedHandlerName = decodeURIComponent(handlerName);
    
    console.log('Fetching services for handler:', decodedHandlerName, 'handlerId:', handlerId);
    
    let query;
    let params;
    
    if (handlerId) {
      query = `SELECT * FROM services WHERE handler_id = $1 ORDER BY created_at DESC`;
      params = [handlerId];
    } else {
      query = `SELECT * FROM services 
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
      services: result.rows 
    });
  } catch (error) {
    console.error('Get services by handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify service (admin/supervisor only) - MUST come before GET /:id route
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Services Verify] Received PUT /services/${id}/verify request`);
    
    // Ensure is_verified column exists
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'services' AND column_name = 'is_verified'
        ) THEN
          ALTER TABLE services ADD COLUMN is_verified BOOLEAN DEFAULT false;
          RAISE NOTICE 'Added is_verified column to services';
        END IF;
      END $$;
    `);
    
    const result = await pool.query(
      'UPDATE services SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ 
      success: true, 
      service: result.rows[0],
      message: 'Service verified successfully' 
    });
  } catch (error) {
    console.error('Verify service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create service
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      warranty,
      unwarranty,
      itemCode,
      brandName,
      productName,
      serialNumber,
      serviceDate,
      handlerId,
      handlerName,
      handlerPhone,
      productComplaint,
      estimatedDate,
      createdBy
    } = req.body;

    if (!customerName) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    // Validate based on warranty status
    if (warranty && (!itemCode || !serialNumber || !handlerId || !estimatedDate)) {
      return res.status(400).json({ error: 'For warranty services: Item Code, Serial Number, Handler Name, and Estimate Date are required' });
    }

    if (unwarranty && (!productComplaint || !estimatedDate)) {
      return res.status(400).json({ error: 'For unwarranty services: Product Complaint and Estimated Date are required' });
    }

    // Ensure handler_id is ALWAYS set if handlerName is provided
    let finalHandlerId = handlerId ? parseInt(handlerId) : null;
    let finalHandlerName = handlerName;
    
    // If handlerId is provided, verify it and get the correct name
    if (finalHandlerId) {
      try {
        const staffResult = await pool.query(
          `SELECT id, full_name FROM staff WHERE id = $1 LIMIT 1`,
          [finalHandlerId]
        );
        if (staffResult.rows.length > 0) {
          // Use the actual full_name from database to ensure consistency
          finalHandlerName = staffResult.rows[0].full_name;
          console.log('Verified handler_id:', finalHandlerId, 'with name:', finalHandlerName);
        } else {
          console.warn('Handler ID', finalHandlerId, 'not found in staff table');
        }
      } catch (staffError) {
        console.error('Error verifying handler_id:', staffError);
      }
    }
    
    // If handlerId is not provided but handlerName is, try to find the ID
    if (!finalHandlerId && handlerName) {
      try {
        const staffResult = await pool.query(
          `SELECT id, full_name FROM staff 
           WHERE LOWER(TRIM(full_name)) = LOWER(TRIM($1)) 
              OR LOWER(TRIM(full_name)) LIKE '%' || LOWER(TRIM($1)) || '%'
              OR LOWER(TRIM($1)) LIKE '%' || LOWER(TRIM(full_name)) || '%'
           LIMIT 1`,
          [handlerName]
        );
        if (staffResult.rows.length > 0) {
          finalHandlerId = staffResult.rows[0].id;
          finalHandlerName = staffResult.rows[0].full_name; // Use exact name from DB
          console.log('Auto-resolved handler_id:', finalHandlerId, 'for handler_name:', handlerName, '-> using:', finalHandlerName);
        } else {
          console.warn('Could not find handler_id for handler_name:', handlerName);
        }
      } catch (staffError) {
        console.error('Error resolving handler_id:', staffError);
      }
    }
    
    console.log('Final handler values - ID:', finalHandlerId, 'Name:', finalHandlerName);

    // Ensure required columns exist (handler_id, handler_name, product_complaint, estimated_date)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'services' AND column_name = 'handler_id'
        ) THEN
          ALTER TABLE services ADD COLUMN handler_id INTEGER;
          RAISE NOTICE 'Added handler_id column to services';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'services' AND column_name = 'handler_name'
        ) THEN
          ALTER TABLE services ADD COLUMN handler_name VARCHAR(255);
          RAISE NOTICE 'Added handler_name column to services';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'services' AND column_name = 'product_complaint'
        ) THEN
          ALTER TABLE services ADD COLUMN product_complaint TEXT;
          RAISE NOTICE 'Added product_complaint column to services';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'services' AND column_name = 'estimated_date'
        ) THEN
          ALTER TABLE services ADD COLUMN estimated_date DATE;
          RAISE NOTICE 'Added estimated_date column to services';
        END IF;
      END $$;
    `);

    console.log('Inserting service with handler - ID:', finalHandlerId, 'Name:', finalHandlerName);
    console.log('Handler ID type:', typeof finalHandlerId, 'Value:', finalHandlerId);
    
    // Ensure handler_id is an integer, not null if handler was selected
    const handlerIdToInsert = finalHandlerId ? parseInt(finalHandlerId) : null;
    console.log('Handler ID to insert:', handlerIdToInsert, 'Type:', typeof handlerIdToInsert);
    
    const result = await pool.query(
      `INSERT INTO services (
        customer_name, warranty, unwarranty, item_code, brand_name, product_name, 
        serial_number, service_date, handler_id, handler_name, handler_phone, 
        product_complaint, estimated_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        customerName,
        warranty || false,
        unwarranty || false,
        itemCode || null,
        brandName || null,
        productName || null,
        serialNumber || null,
        estimatedDate || serviceDate || null,
        handlerIdToInsert, // Explicitly use parsed integer
        finalHandlerName || null,
        handlerPhone || null,
        productComplaint || null,
        estimatedDate || null,
        createdBy || 'system'
      ]
    );
    
    const createdService = result.rows[0];
    console.log('=== SERVICE CREATED ===');
    console.log('Service ID:', createdService.id);
    console.log('Handler ID stored:', createdService.handler_id, 'Type:', typeof createdService.handler_id);
    console.log('Handler Name stored:', createdService.handler_name);
    console.log('Expected handler_id:', finalHandlerId, 'Type:', typeof finalHandlerId);
    console.log('Expected handler_name:', finalHandlerName);
    
    // Verify the service was stored correctly by querying it back
    try {
      const verifyQuery = await pool.query(
        `SELECT id, customer_name, handler_id, handler_name, handler_id::text as handler_id_text
         FROM services 
         WHERE id = $1`,
        [createdService.id]
      );
      console.log('Verification query result:', JSON.stringify(verifyQuery.rows[0], null, 2));
      
      // Also verify it can be found by handler_id
      if (handlerIdToInsert) {
        const handlerIdQuery = await pool.query(
          `SELECT id, customer_name, handler_id, handler_name 
           FROM services 
           WHERE handler_id = $1 AND id = $2`,
          [handlerIdToInsert, createdService.id]
        );
        console.log(`Verification by handler_id ${handlerIdToInsert}:`, handlerIdQuery.rows.length > 0 ? 'FOUND ✓' : 'NOT FOUND ✗');
        if (handlerIdQuery.rows.length > 0) {
          console.log('Service found by handler_id:', JSON.stringify(handlerIdQuery.rows[0], null, 2));
        } else {
          console.error('ERROR: Service NOT found by handler_id! This indicates a data storage issue.');
          console.error('Trying alternative query...');
          // Try without type casting
          const altQuery = await pool.query(
            `SELECT id, customer_name, handler_id, handler_name 
             FROM services 
             WHERE handler_id::text = $1::text AND id = $2`,
            [handlerIdToInsert.toString(), createdService.id]
          );
          console.log('Alternative query result:', altQuery.rows.length > 0 ? 'FOUND' : 'NOT FOUND');
        }
        
        // Also test the actual query that the handler module will use
        const handlerModuleQuery = await pool.query(
          `SELECT * FROM services 
           WHERE handler_id = $1
           ORDER BY created_at DESC`,
          [handlerIdToInsert]
        );
        console.log(`Handler module query test: Found ${handlerModuleQuery.rows.length} services for handler_id ${handlerIdToInsert}`);
        if (handlerModuleQuery.rows.length > 0) {
          console.log('Service will be visible to handler:', JSON.stringify(handlerModuleQuery.rows[0], null, 2));
        }
      }
    } catch (verifyError) {
      console.error('Error verifying service:', verifyError);
    }
    console.log('======================');

    res.status(201).json({
      success: true,
      service: result.rows[0],
      message: 'Service created successfully'
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send OTP to customer for service completion
router.post('/:id/send-otp', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get service details
    const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    const service = serviceResult.rows[0];
    
    // Get customer phone number
    let customerPhone = null;
    if (service.customer_name) {
      const customerResult = await pool.query(
        'SELECT phone FROM customers WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1',
        [service.customer_name]
      );
      if (customerResult.rows.length > 0) {
        customerPhone = customerResult.rows[0].phone;
      }
    }
    
    if (!customerPhone) {
      return res.status(400).json({ success: false, message: 'Customer phone number not found' });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    // Update service with OTP
    await pool.query(
      `UPDATE services 
       SET otp_code = $1, otp_expiry = $2, otp_sent_at = NOW()
       WHERE id = $3`,
      [otp, otpExpiry, id]
    );
    
    // Send OTP via SMS
    const message = `Your service completion OTP is ${otp}. This OTP is valid for 10 minutes. Please share this with the service handler.`;
    try {
      await sendSMS(customerPhone, message);
    } catch (smsError) {
      console.error('SMS sending error:', smsError);
      // Still return success as OTP is generated and stored
    }
    
    res.json({
      success: true,
      message: 'OTP sent successfully to customer'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Verify OTP and complete service
router.post('/:id/verify-otp', async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, message: 'Invalid OTP format' });
    }
    
    // Get service details
    const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    const service = serviceResult.rows[0];
    
    // Check if service is already completed
    if (service.is_completed) {
      return res.status(400).json({ success: false, message: 'Service is already completed' });
    }
    
    // Verify OTP
    if (!service.otp_code || service.otp_code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    // Check if OTP is expired
    if (service.otp_expiry && new Date(service.otp_expiry) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }
    
    // Mark service as completed
    await pool.query(
      `UPDATE services 
       SET is_completed = true, completed_at = NOW(), otp_code = NULL, otp_expiry = NULL
       WHERE id = $1`,
      [id]
    );
    
    res.json({
      success: true,
      message: 'Service completed successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// Update service
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      warranty,
      unwarranty,
      itemCode,
      brandName,
      productName,
      serialNumber,
      serviceDate,
      handlerId,
      handlerName,
      productComplaint,
      estimatedDate
    } = req.body;

    // Check if service exists
    const checkService = await pool.query('SELECT id FROM services WHERE id = $1', [id]);
    if (checkService.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (customerName !== undefined) {
      updateFields.push(`customer_name = $${paramCount++}`);
      updateValues.push(customerName);
    }
    if (customerPhone !== undefined) {
      updateFields.push(`customer_phone = $${paramCount++}`);
      updateValues.push(customerPhone);
    }
    if (warranty !== undefined) {
      updateFields.push(`warranty = $${paramCount++}`);
      updateValues.push(warranty);
    }
    if (unwarranty !== undefined) {
      updateFields.push(`unwarranty = $${paramCount++}`);
      updateValues.push(unwarranty);
    }
    if (itemCode !== undefined) {
      updateFields.push(`item_code = $${paramCount++}`);
      updateValues.push(itemCode);
    }
    if (brandName !== undefined) {
      updateFields.push(`brand_name = $${paramCount++}`);
      updateValues.push(brandName);
    }
    if (productName !== undefined) {
      updateFields.push(`product_name = $${paramCount++}`);
      updateValues.push(productName);
    }
    if (serialNumber !== undefined) {
      updateFields.push(`serial_number = $${paramCount++}`);
      updateValues.push(serialNumber);
    }
    if (serviceDate !== undefined) {
      updateFields.push(`service_date = $${paramCount++}`);
      updateValues.push(serviceDate);
    }
    if (handlerId !== undefined) {
      updateFields.push(`handler_id = $${paramCount++}`);
      updateValues.push(handlerId ? parseInt(handlerId) : null);
    }
    if (handlerName !== undefined) {
      updateFields.push(`handler_name = $${paramCount++}`);
      updateValues.push(handlerName);
    }
    if (productComplaint !== undefined) {
      updateFields.push(`product_complaint = $${paramCount++}`);
      updateValues.push(productComplaint);
    }
    if (estimatedDate !== undefined) {
      updateFields.push(`estimated_date = $${paramCount++}`);
      updateValues.push(estimatedDate);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const result = await pool.query(
      `UPDATE services 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      updateValues
    );

    res.json({
      success: true,
      service: result.rows[0],
      message: 'Service updated successfully'
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

