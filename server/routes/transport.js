const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { ensureVerificationColumn, shouldBeVerified, notifyStaffCreation } = require('../utils/verification');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transport ORDER BY created_at DESC'
    );
    res.json({ success: true, transports: result.rows });
  } catch (error) {
    console.error('Get transports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transports by address (city, state, pincode)
// IMPORTANT: This route must be before /:id to avoid route conflict
router.get('/by-address', async (req, res) => {
  try {
    const { city, state, pincode } = req.query;
    
    // At least one field must be provided
    if (!city && !state && !pincode) {
      return res.json({ success: true, transports: [] });
    }
    
    // Query that checks both legacy fields and JSONB addresses array
    let query = `SELECT * FROM transport WHERE (
      -- Check legacy fields
      (LOWER(TRIM(city)) = LOWER(TRIM($1)) OR $1 IS NULL OR $1 = '')
      AND (LOWER(TRIM(state)) = LOWER(TRIM($2)) OR $2 IS NULL OR $2 = '')
      AND (TRIM(pincode) = TRIM($3) OR $3 IS NULL OR $3 = '')
    ) OR (
      -- Check JSONB addresses array
      EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(addresses, '[]'::jsonb)) AS addr
        WHERE (LOWER(TRIM(addr->>'city')) = LOWER(TRIM($1)) OR $1 IS NULL OR $1 = '')
          AND (LOWER(TRIM(addr->>'state')) = LOWER(TRIM($2)) OR $2 IS NULL OR $2 = '')
          AND (TRIM(addr->>'pincode') = TRIM($3) OR $3 IS NULL OR $3 = '')
      )
    )`;
    
    const params = [
      city && city.trim() !== '' ? city.trim() : null,
      state && state.trim() !== '' ? state.trim() : null,
      pincode && pincode.trim() !== '' ? pincode.trim() : null
    ];

    query += ' ORDER BY travels_name ASC';

    console.log('Fetching transports by address:', { city, state, pincode });
    const result = await pool.query(query, params);
    console.log(`Found ${result.rows.length} matching transports`);
    res.json({ success: true, transports: result.rows });
  } catch (error) {
    console.error('Get transports by address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all unique cities from transport addresses
router.get('/cities', async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT DISTINCT city
      FROM (
        SELECT city FROM transport WHERE city IS NOT NULL AND city != ''
        UNION
        SELECT addr->>'city' as city
        FROM transport, jsonb_array_elements(COALESCE(addresses, '[]'::jsonb)) AS addr
        WHERE addr->>'city' IS NOT NULL AND addr->>'city' != ''
      ) AS all_cities
      WHERE city IS NOT NULL AND city != ''
    `;
    
    const params = [];
    if (search && search.trim() !== '') {
      query += ` AND LOWER(TRIM(city)) LIKE LOWER($1)`;
      params.push(`%${search.trim()}%`);
    }
    
    query += ` ORDER BY city ASC`;
    
    const result = await pool.query(query, params);
    const cities = result.rows.map(row => row.city).filter(city => city && city.trim() !== '');
    
    res.json({ success: true, cities: cities });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM transport WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transport record not found' });
    }

    res.json({ success: true, transport: result.rows[0] });
  } catch (error) {
    console.error('Get transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { travelsName, phoneNumber1, phoneNumber2, address, addresses, userRole, createdBy } = req.body;
    
    // Ensure is_verified and created_by columns exist
    await ensureVerificationColumn('transport');
    
    // Determine verification status based on user role
    const isVerified = shouldBeVerified(userRole || 'staff');

    if (!travelsName) {
      return res.status(400).json({ error: 'Required fields: travelsName' });
    }

    if (!phoneNumber1 || !phoneNumber2) {
      return res.status(400).json({ error: 'Phone Number 1 and Phone Number 2 are required' });
    }

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: 'At least one city is required' });
    }

    // Validate that all 10 cities have both city name and phone number
    if (addresses.length !== 10) {
      return res.status(400).json({ error: 'Exactly 10 cities are required' });
    }

    const invalidCities = addresses.filter(addr => 
      !addr.city || !addr.city.trim() || !addr.phoneNumber || !addr.phoneNumber.trim()
    );

    if (invalidCities.length > 0) {
      return res.status(400).json({ error: 'All 10 cities and their phone numbers are required' });
    }

    // Check for duplicate transport name
    const existingTransport = await pool.query(
      'SELECT id FROM transport WHERE LOWER(TRIM(travels_name)) = LOWER(TRIM($1))',
      [travelsName]
    );

    if (existingTransport.rows.length > 0) {
      return res.status(400).json({ error: 'Transport name already exists. Please use a different name.' });
    }

    // Check for duplicate phone number combination
    const phoneNumber = `${phoneNumber1.trim()}, ${phoneNumber2.trim()}`;
    const existingPhone = await pool.query(
      'SELECT id FROM transport WHERE phone_number = $1',
      [phoneNumber]
    );

    if (existingPhone.rows.length > 0) {
      return res.status(400).json({ error: 'This phone number combination already exists. Please use different phone numbers.' });
    }

    // Store addresses as JSONB, also keep first address in legacy fields for backward compatibility
    const firstAddress = addresses[0];
    const addressesJson = JSON.stringify(addresses);

    const result = await pool.query(
      `INSERT INTO transport (name, travels_name, phone_number, address, city, state, pincode, service, vehicle_number, addresses, is_verified, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        '', // name - removed (empty string instead of null for NOT NULL constraint)
        travelsName.trim(), 
        phoneNumber, // Combined phone numbers
        address.trim(), // Main address
        firstAddress.city || '', 
        null, // state - removed
        null, // pincode - removed
        '', // service - removed (empty string instead of null for NOT NULL constraint)
        null, // vehicleNumber - removed
        addressesJson,
        isVerified,
        createdBy || null
      ]
    );
    
    // Send notification if created by staff
    if (!isVerified) {
      await notifyStaffCreation('Transport', travelsName.trim(), result.rows[0].id);
    }

    res.status(201).json({
      success: true,
      transport: result.rows[0],
      message: 'Transport record created successfully'
    });
  } catch (error) {
    console.error('Create transport error:', error);
    
    // Handle database unique constraint violations
    if (error.code === '23505') { // Unique violation
      if (error.constraint && error.constraint.includes('travels_name')) {
        return res.status(400).json({ error: 'Transport name already exists. Please use a different name.' });
      }
      if (error.constraint && error.constraint.includes('phone_number')) {
        return res.status(400).json({ error: 'This phone number combination already exists. Please use different phone numbers.' });
      }
      return res.status(400).json({ error: 'Duplicate entry detected. Please check transport name and phone numbers.' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify transport record (admin/supervisor only)
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    await ensureVerificationColumn('transport');
    
    const result = await pool.query(
      'UPDATE transport SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transport record not found' });
    }
    
    res.json({ 
      success: true, 
      transport: result.rows[0],
      message: 'Transport record verified successfully' 
    });
  } catch (error) {
    console.error('Verify transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { travelsName, phoneNumber1, phoneNumber2, address, addresses } = req.body;

    if (!travelsName) {
      return res.status(400).json({ error: 'Required fields: travelsName' });
    }

    if (!phoneNumber1 || !phoneNumber2) {
      return res.status(400).json({ error: 'Phone Number 1 and Phone Number 2 are required' });
    }

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: 'At least one city is required' });
    }

    // Validate that all 10 cities have both city name and phone number
    if (addresses.length !== 10) {
      return res.status(400).json({ error: 'Exactly 10 cities are required' });
    }

    const invalidCities = addresses.filter(addr => 
      !addr.city || !addr.city.trim() || !addr.phoneNumber || !addr.phoneNumber.trim()
    );

    if (invalidCities.length > 0) {
      return res.status(400).json({ error: 'All 10 cities and their phone numbers are required' });
    }

    // Store addresses as JSONB, also keep first address in legacy fields for backward compatibility
    const firstAddress = addresses[0];
    const addressesJson = JSON.stringify(addresses);

    // Combine phoneNumber1 and phoneNumber2 for legacy phoneNumber field
    const phoneNumber = `${phoneNumber1.trim()}, ${phoneNumber2.trim()}`;

    const result = await pool.query(
      `UPDATE transport 
       SET name = $1, 
           travels_name = $2,
           phone_number = $3,
           address = $4,
           city = $5,
           state = $6,
           pincode = $7, 
           service = $8,
           vehicle_number = $9,
           addresses = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        '', // name - removed (empty string instead of null for NOT NULL constraint)
        travelsName, 
        phoneNumber, // Combined phone numbers
        address.trim(), // Main address
        firstAddress.city || '', 
        null, // state - removed
        null, // pincode - removed
        '', // service - removed (empty string instead of null for NOT NULL constraint)
        null, // vehicleNumber - removed
        addressesJson,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transport record not found' });
    }

    res.json({
      success: true,
      transport: result.rows[0],
      message: 'Transport record updated successfully'
    });
  } catch (error) {
    console.error('Update transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM transport WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transport record not found' });
    }

    res.json({ success: true, message: 'Transport record deleted successfully' });
  } catch (error) {
    console.error('Delete transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

