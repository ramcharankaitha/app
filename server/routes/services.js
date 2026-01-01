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

// Get services by handler name
router.get('/handler/:handlerName', async (req, res) => {
  try {
    const { handlerName } = req.params;
    const { handlerId } = req.query;
    const decodedHandlerName = decodeURIComponent(handlerName);
    
    console.log('Fetching services for handler:', decodedHandlerName, 'handlerId:', handlerId);
    
    // Check if handler_name column exists, if not return empty array
    let columnCheck;
    try {
      columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='services' AND column_name='handler_name'
      `);
    } catch (checkError) {
      console.error('Error checking column:', checkError);
      // Continue anyway, try the query
    }
    
    if (columnCheck && columnCheck.rows.length === 0) {
      console.log('handler_name column does not exist in services table');
      return res.json({ success: true, services: [] });
    }
    
    // First, let's check what handler names exist in the database for debugging
    try {
      const allHandlers = await pool.query(
        `SELECT DISTINCT handler_name, handler_id FROM services WHERE handler_name IS NOT NULL LIMIT 10`
      );
      console.log('Available handlers in database:', allHandlers.rows.map(r => ({ name: r.handler_name, id: r.handler_id })));
    } catch (debugError) {
      console.error('Error fetching handler list:', debugError);
    }
    
    console.log('Searching for handler - Name:', decodedHandlerName, 'ID:', handlerId);
    
    // PRIORITY 1: If handlerId is provided, use it first (most reliable)
    if (handlerId) {
      try {
        // First, check what handler_ids exist in services table
        const handlerIdsCheck = await pool.query(
          `SELECT DISTINCT handler_id, handler_name, COUNT(*) as count 
           FROM services 
           WHERE handler_id IS NOT NULL 
           GROUP BY handler_id, handler_name 
           ORDER BY count DESC 
           LIMIT 20`
        );
        console.log('All handler_ids in services table:', JSON.stringify(handlerIdsCheck.rows, null, 2));
        
        // Also check services with the handler name (exact and similar)
        const handlerNameCheck = await pool.query(
          `SELECT id, handler_id, handler_name, customer_name 
           FROM services 
           WHERE handler_name IS NOT NULL 
             AND (
               LOWER(TRIM(handler_name)) = LOWER(TRIM($1))
               OR LOWER(TRIM(handler_name)) LIKE '%' || LOWER(TRIM($1)) || '%'
               OR LOWER(TRIM($1)) LIKE '%' || LOWER(TRIM(handler_name)) || '%'
             )
           ORDER BY created_at DESC 
           LIMIT 10`,
          [decodedHandlerName]
        );
        console.log(`Services with handler_name matching "${decodedHandlerName}":`, JSON.stringify(handlerNameCheck.rows, null, 2));
        
        // Check what staff member matches this handler
        const staffCheck = await pool.query(
          `SELECT id, full_name, username, is_handler 
           FROM staff 
           WHERE id = $1 OR LOWER(TRIM(full_name)) = LOWER(TRIM($2)) 
           LIMIT 5`,
          [handlerId, decodedHandlerName]
        );
        console.log('Matching staff members:', JSON.stringify(staffCheck.rows, null, 2));
        
        // Convert handlerId to integer for comparison
        const handlerIdInt = parseInt(handlerId);
        console.log('Searching for handler_id (as integer):', handlerIdInt, 'original:', handlerId);
        
        const resultById = await pool.query(
          `SELECT s.*, 
                  COALESCE(s.customer_phone, c.phone) as customer_phone 
           FROM services s 
           LEFT JOIN customers c ON LOWER(TRIM(s.customer_name)) = LOWER(TRIM(c.name))
           WHERE s.handler_id = $1::integer
           ORDER BY s.created_at DESC`,
          [handlerIdInt]
        );
        console.log(`Query for handler_id ${handlerIdInt} returned ${resultById.rows.length} services`);
        if (resultById.rows.length > 0) {
          return res.json({ success: true, services: resultById.rows });
        }
      } catch (idError) {
        console.error('Error querying by handler_id:', idError);
        console.error('Error stack:', idError.stack);
      }
    }
    
    // PRIORITY 2: Try to find handler_id from staff table using name
    let foundHandlerId = null;
    if (!handlerId) {
      try {
        const staffResult = await pool.query(
          `SELECT id FROM staff WHERE LOWER(TRIM(full_name)) = LOWER(TRIM($1)) LIMIT 1`,
          [decodedHandlerName]
        );
        if (staffResult.rows.length > 0) {
          foundHandlerId = staffResult.rows[0].id;
          console.log('Found handler ID:', foundHandlerId, 'for name:', decodedHandlerName);
          
          // Check if handler_id column exists before querying
          const idColumnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='services' AND column_name='handler_id'
          `);
          
          if (idColumnCheck.rows.length > 0) {
            // Try querying by this handler_id
            const resultById = await pool.query(
              `SELECT s.*, 
                      COALESCE(s.customer_phone, c.phone) as customer_phone 
               FROM services s 
               LEFT JOIN customers c ON LOWER(TRIM(s.customer_name)) = LOWER(TRIM(c.name))
               WHERE s.handler_id = $1
               ORDER BY s.created_at DESC`,
              [foundHandlerId]
            );
            console.log(`Found ${resultById.rows.length} services by handler_id: ${foundHandlerId}`);
            if (resultById.rows.length > 0) {
              return res.json({ success: true, services: resultById.rows });
            }
          }
        }
      } catch (staffError) {
        console.error('Error finding handler in staff table:', staffError);
      }
    }
    
    // PRIORITY 3: Fallback to name matching (less reliable due to potential name variations)
    let result;
    try {
      result = await pool.query(
        `SELECT s.*, 
                COALESCE(s.customer_phone, c.phone) as customer_phone 
         FROM services s 
         LEFT JOIN customers c ON LOWER(TRIM(s.customer_name)) = LOWER(TRIM(c.name))
         WHERE s.handler_name IS NOT NULL 
           AND (
             LOWER(TRIM(s.handler_name)) = LOWER(TRIM($1))
             OR LOWER(TRIM(s.handler_name)) LIKE LOWER(TRIM($1)) || '%'
             OR LOWER(TRIM($1)) LIKE LOWER(TRIM(s.handler_name)) || '%'
           )
         ORDER BY s.created_at DESC`,
        [decodedHandlerName]
      );
      console.log(`Found ${result.rows.length} services for handler name: ${decodedHandlerName}`);
    } catch (queryError) {
      console.error('Query error:', queryError);
      return res.json({ success: true, services: [] });
    }
    
    res.json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Get services by handler error:', error);
    res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
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

    // Ensure handler_id is set if handlerName is provided but handlerId is not
    let finalHandlerId = handlerId;
    if (!finalHandlerId && handlerName) {
      try {
        const staffResult = await pool.query(
          `SELECT id FROM staff WHERE LOWER(TRIM(full_name)) = LOWER(TRIM($1)) LIMIT 1`,
          [handlerName]
        );
        if (staffResult.rows.length > 0) {
          finalHandlerId = staffResult.rows[0].id;
          console.log('Auto-resolved handler_id:', finalHandlerId, 'for handler_name:', handlerName);
        }
      } catch (staffError) {
        console.error('Error resolving handler_id:', staffError);
      }
    }

    // Ensure product_complaint and estimated_date columns exist
    await pool.query(`
      DO $$ 
      BEGIN
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
        finalHandlerId ? parseInt(finalHandlerId) : null,
        handlerName || null,
        handlerPhone || null,
        productComplaint || null,
        estimatedDate || null,
        createdBy || 'system'
      ]
    );
    
    console.log('=== SERVICE CREATED ===');
    console.log('Service ID:', result.rows[0].id);
    console.log('Handler ID stored:', result.rows[0].handler_id, 'Type:', typeof result.rows[0].handler_id);
    console.log('Handler Name stored:', result.rows[0].handler_name);
    console.log('Expected handler_id:', finalHandlerId);
    console.log('======================');
    
    console.log('Service created with handler_id:', finalHandlerId, 'handler_name:', handlerName);

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

module.exports = router;

