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
    
    let query = 'SELECT * FROM transport WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (city && city.trim() !== '') {
      query += ` AND LOWER(TRIM(city)) = LOWER(TRIM($${paramCount}))`;
      params.push(city.trim());
      paramCount++;
    }

    if (state && state.trim() !== '') {
      query += ` AND LOWER(TRIM(state)) = LOWER(TRIM($${paramCount}))`;
      params.push(state.trim());
      paramCount++;
    }

    if (pincode && pincode.trim() !== '') {
      query += ` AND TRIM(pincode) = TRIM($${paramCount})`;
      params.push(pincode.trim());
      paramCount++;
    }

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
    const { name, travelsName, address, city, state, pincode, service, llrNumber, vehicleNumber } = req.body;

    if (!name || !travelsName || !city || !service) {
      return res.status(400).json({ error: 'Required fields: name, travelsName, city, service' });
    }

    const result = await pool.query(
      `INSERT INTO transport (name, travels_name, address, city, state, pincode, service, llr_number, vehicle_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, travelsName, address || null, city, state || null, pincode || null, service, llrNumber || null, vehicleNumber || null]
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
    const { name, travelsName, address, city, state, pincode, service, llrNumber, vehicleNumber } = req.body;

    if (!name || !travelsName || !city || !service) {
      return res.status(400).json({ error: 'Required fields: name, travelsName, city, service' });
    }

    const result = await pool.query(
      `UPDATE transport 
       SET name = $1, 
           travels_name = $2,
           address = $3,
           city = $4,
           state = $5,
           pincode = $6, 
           service = $7,
           llr_number = $8,
           vehicle_number = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [name, travelsName, address || null, city, state || null, pincode || null, service, llrNumber || null, vehicleNumber || null, id]
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

