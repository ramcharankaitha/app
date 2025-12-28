const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

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
    const { travelsName, phoneNumber, addresses } = req.body;

    if (!travelsName) {
      return res.status(400).json({ error: 'Required fields: travelsName' });
    }

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: 'At least one city is required' });
    }

    // Validate that at least one address has a city
    const hasValidCity = addresses.some(addr => addr.city && addr.city.trim() !== '');
    if (!hasValidCity) {
      return res.status(400).json({ error: 'At least one city must be provided' });
    }

    // Store addresses as JSONB, also keep first address in legacy fields for backward compatibility
    const firstAddress = addresses[0];
    const addressesJson = JSON.stringify(addresses);

    const result = await pool.query(
      `INSERT INTO transport (name, travels_name, address, city, state, pincode, service, vehicle_number, addresses)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        '', // name - removed (empty string instead of null for NOT NULL constraint)
        travelsName, 
        null, // address - removed
        firstAddress.city || '', 
        null, // state - removed
        null, // pincode - removed
        '', // service - removed (empty string instead of null for NOT NULL constraint)
        null, // vehicleNumber - removed
        addressesJson
      ]
    );

    res.status(201).json({
      success: true,
      transport: result.rows[0],
      message: 'Transport record created successfully'
    });
  } catch (error) {
    console.error('Create transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { travelsName, phoneNumber, addresses } = req.body;

    if (!travelsName) {
      return res.status(400).json({ error: 'Required fields: travelsName' });
    }

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: 'At least one city is required' });
    }

    // Validate that at least one address has a city
    const hasValidCity = addresses.some(addr => addr.city && addr.city.trim() !== '');
    if (!hasValidCity) {
      return res.status(400).json({ error: 'At least one city must be provided' });
    }

    // Store addresses as JSONB, also keep first address in legacy fields for backward compatibility
    const firstAddress = addresses[0];
    const addressesJson = JSON.stringify(addresses);

    const result = await pool.query(
      `UPDATE transport 
       SET name = $1, 
           travels_name = $2,
           address = $3,
           city = $4,
           state = $5,
           pincode = $6, 
           service = $7,
           vehicle_number = $8,
           addresses = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        '', // name - removed (empty string instead of null for NOT NULL constraint)
        travelsName, 
        null, // address - removed
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

