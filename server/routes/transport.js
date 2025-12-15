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
    const { name, travelsName, city, service } = req.body;

    if (!name || !travelsName || !city || !service) {
      return res.status(400).json({ error: 'All fields are required: name, travelsName, city, service' });
    }

    const result = await pool.query(
      `INSERT INTO transport (name, travels_name, city, service)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, travelsName, city, service]
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
    const { name, travelsName, city, service } = req.body;

    if (!name || !travelsName || !city || !service) {
      return res.status(400).json({ error: 'All fields are required: name, travelsName, city, service' });
    }

    const result = await pool.query(
      `UPDATE transport 
       SET name = $1, 
           travels_name = $2, 
           city = $3, 
           service = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, travelsName, city, service, id]
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

