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
        `SELECT DISTINCT handler_name, handler_id, COUNT(*) as service_count 
         FROM services 
         WHERE handler_name IS NOT NULL OR handler_id IS NOT NULL 
         GROUP BY handler_name, handler_id 
         ORDER BY service_count DESC 
         LIMIT 20`
      );
      console.log('Available handlers in database:', JSON.stringify(allHandlers.rows, null, 2));
      
      // Also check specifically for the handler we're looking for
      if (handlerId) {
        const specificHandler = await pool.query(
          `SELECT id, customer_name, handler_id, handler_name, created_at 
           FROM services 
           WHERE handler_id = $1 
           ORDER BY created_at DESC 
           LIMIT 5`,
          [parseInt(handlerId)]
        );
        console.log(`Services with handler_id ${handlerId}:`, JSON.stringify(specificHandler.rows, null, 2));
      }
    } catch (debugError) {
      console.error('Error fetching handler list:', debugError);
    }
    
    console.log('Searching for handler - Name:', decodedHandlerName, 'ID:', handlerId);
    
    // PRIORITY 1: If handlerId is provided, use it first (most reliable)
    if (handlerId) {
      try {
        // Convert handlerId to integer for comparison
        const handlerIdInt = parseInt(handlerId);
        console.log('Searching for handler_id (as integer):', handlerIdInt, 'original:', handlerId);
        
        // First, check what handler_ids exist in services table for debugging
        const handlerIdsCheck = await pool.query(
          `SELECT DISTINCT handler_id, handler_name, COUNT(*) as count 
           FROM services 
           WHERE handler_id IS NOT NULL 
           GROUP BY handler_id, handler_name 
           ORDER BY count DESC 
           LIMIT 20`
        );
        console.log('All handler_ids in services table:', JSON.stringify(handlerIdsCheck.rows, null, 2));
        
        // Check what staff member matches this handler
        const staffCheck = await pool.query(
          `SELECT id, full_name, username, is_handler 
           FROM staff 
           WHERE id = $1 
           LIMIT 1`,
          [handlerIdInt]
        );
        console.log('Matching staff member:', JSON.stringify(staffCheck.rows, null, 2));
        
        // Query by handler_id (most reliable)
        // First check if handler_id column exists
        const idColumnCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name='services' AND column_name='handler_id'
        `);
        
        if (idColumnCheck.rows.length > 0) {
          // First, let's check what services exist with this handler_id
          const debugQuery = await pool.query(
            `SELECT id, customer_name, handler_id, handler_name, created_at 
             FROM services 
             WHERE handler_id = $1 
             ORDER BY created_at DESC 
             LIMIT 5`,
            [handlerIdInt]
          );
          console.log(`DEBUG: Services with handler_id ${handlerIdInt}:`, JSON.stringify(debugQuery.rows, null, 2));
          
          const resultById = await pool.query(
            `SELECT s.*, 
                    COALESCE(s.customer_phone, c.phone) as customer_phone 
             FROM services s 
             LEFT JOIN customers c ON LOWER(TRIM(s.customer_name)) = LOWER(TRIM(c.name))
             WHERE s.handler_id = $1
             ORDER BY s.created_at DESC`,
            [handlerIdInt]
          );
          console.log(`Query for handler_id ${handlerIdInt} returned ${resultById.rows.length} services`);
          if (resultById.rows.length > 0) {
            return res.json({ success: true, services: resultById.rows });
          }
        } else {
          console.log('handler_id column does not exist, will try by name');
        }
        
        // If no results by ID, also try by name (in case handler_id wasn't set but handler_name was)
        if (decodedHandlerName) {
          const staffName = staffCheck.rows.length > 0 ? staffCheck.rows[0].full_name : decodedHandlerName;
          const resultByName = await pool.query(
            `SELECT s.*, 
                    COALESCE(s.customer_phone, c.phone) as customer_phone 
             FROM services s 
             LEFT JOIN customers c ON LOWER(TRIM(s.customer_name)) = LOWER(TRIM(c.name))
             WHERE s.handler_name IS NOT NULL 
               AND (
                 LOWER(TRIM(s.handler_name)) = LOWER(TRIM($1))
                 OR LOWER(TRIM(s.handler_name)) LIKE '%' || LOWER(TRIM($1)) || '%'
               )
             ORDER BY s.created_at DESC`,
            [staffName]
          );
          console.log(`Query for handler_name "${staffName}" returned ${resultByName.rows.length} services`);
          if (resultByName.rows.length > 0) {
            return res.json({ success: true, services: resultByName.rows });
          }
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
    
    // PRIORITY 3: Fallback to name matching with multiple strategies
    let result;
    try {
      // Try multiple matching strategies for name
      const searchName = decodedHandlerName.trim();
      const searchNameLower = searchName.toLowerCase();
      
      // Strategy 1: Exact match (case-insensitive, trimmed)
      result = await pool.query(
        `SELECT s.*, 
                COALESCE(s.customer_phone, c.phone) as customer_phone 
         FROM services s 
         LEFT JOIN customers c ON LOWER(TRIM(s.customer_name)) = LOWER(TRIM(c.name))
         WHERE s.handler_name IS NOT NULL 
           AND LOWER(TRIM(s.handler_name)) = $1
         ORDER BY s.created_at DESC`,
        [searchNameLower]
      );
      console.log(`Exact match for "${searchNameLower}" returned ${result.rows.length} services`);
      
      // Strategy 2: Partial match if exact match fails
      if (result.rows.length === 0) {
        result = await pool.query(
          `SELECT s.*, 
                  COALESCE(s.customer_phone, c.phone) as customer_phone 
           FROM services s 
           LEFT JOIN customers c ON LOWER(TRIM(s.customer_name)) = LOWER(TRIM(c.name))
           WHERE s.handler_name IS NOT NULL 
             AND (
               LOWER(TRIM(s.handler_name)) LIKE '%' || $1 || '%'
               OR $1 LIKE '%' || LOWER(TRIM(s.handler_name)) || '%'
             )
           ORDER BY s.created_at DESC`,
          [searchNameLower]
        );
        console.log(`Partial match for "${searchNameLower}" returned ${result.rows.length} services`);
      }
      
      // Strategy 3: Try matching with staff table to get all variations
      if (result.rows.length === 0) {
        const staffVariations = await pool.query(
          `SELECT id, full_name FROM staff 
           WHERE LOWER(TRIM(full_name)) LIKE '%' || $1 || '%'
              OR $1 LIKE '%' || LOWER(TRIM(full_name)) || '%'`,
          [searchNameLower]
        );
        console.log(`Found ${staffVariations.rows.length} staff members matching "${searchNameLower}"`);
        
        if (staffVariations.rows.length > 0) {
          // Try matching services by any of these staff names
          const staffNames = staffVariations.rows.map(s => s.full_name.toLowerCase().trim());
          const staffIds = staffVariations.rows.map(s => s.id);
          
          // Try by handler_id first
          if (staffIds.length > 0) {
            const resultByIds = await pool.query(
              `SELECT s.*, 
                      COALESCE(s.customer_phone, c.phone) as customer_phone 
               FROM services s 
               LEFT JOIN customers c ON LOWER(TRIM(s.customer_name)) = LOWER(TRIM(c.name))
               WHERE s.handler_id = ANY($1::int[])
               ORDER BY s.created_at DESC`,
              [staffIds]
            );
            console.log(`Found ${resultByIds.rows.length} services by staff IDs:`, staffIds);
            if (resultByIds.rows.length > 0) {
              return res.json({ success: true, services: resultByIds.rows });
            }
          }
          
          // Try by handler_name variations
          for (const staffName of staffNames) {
            const resultByName = await pool.query(
              `SELECT s.*, 
                      COALESCE(s.customer_phone, c.phone) as customer_phone 
               FROM services s 
               LEFT JOIN customers c ON LOWER(TRIM(s.customer_name)) = LOWER(TRIM(c.name))
               WHERE s.handler_name IS NOT NULL 
                 AND LOWER(TRIM(s.handler_name)) = $1
               ORDER BY s.created_at DESC`,
              [staffName]
            );
            if (resultByName.rows.length > 0) {
              console.log(`Found ${resultByName.rows.length} services by staff name: "${staffName}"`);
              return res.json({ success: true, services: resultByName.rows });
            }
          }
        }
      }
      
      console.log(`Final result: ${result.rows.length} services for handler name: ${decodedHandlerName}`);
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

    console.log('Inserting service with handler - ID:', finalHandlerId, 'Name:', finalHandlerName);
    
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
        finalHandlerId,
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
        `SELECT id, customer_name, handler_id, handler_name 
         FROM services 
         WHERE id = $1`,
        [createdService.id]
      );
      console.log('Verification query result:', JSON.stringify(verifyQuery.rows[0], null, 2));
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

module.exports = router;

