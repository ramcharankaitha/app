const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dispatch ORDER BY created_at DESC'
    );
    res.json({ success: true, dispatches: result.rows });
  } catch (error) {
    console.error('Get dispatches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM dispatch WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dispatch record not found' });
    }

    res.json({ success: true, dispatch: result.rows[0] });
  } catch (error) {
    console.error('Get dispatch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customer, name, phone, transportName } = req.body;

    if (!customer || !name || !phone || !transportName) {
      return res.status(400).json({ error: 'All fields are required: customer, name, phone, transportName' });
    }

    const result = await pool.query(
      `INSERT INTO dispatch (customer, name, phone, transport_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [customer, name, phone, transportName]
    );

    res.status(201).json({
      success: true,
      dispatch: result.rows[0],
      message: 'Dispatch record created successfully'
    });
  } catch (error) {
    console.error('Create dispatch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer, name, phone, transportName } = req.body;

    if (!customer || !name || !phone || !transportName) {
      return res.status(400).json({ error: 'All fields are required: customer, name, phone, transportName' });
    }

    const result = await pool.query(
      `UPDATE dispatch 
       SET customer = $1, 
           name = $2, 
           phone = $3, 
           transport_name = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [customer, name, phone, transportName, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dispatch record not found' });
    }

    res.json({
      success: true,
      dispatch: result.rows[0],
      message: 'Dispatch record updated successfully'
    });
  } catch (error) {
    console.error('Update dispatch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM dispatch WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dispatch record not found' });
    }

    res.json({ success: true, message: 'Dispatch record deleted successfully' });
  } catch (error) {
    console.error('Delete dispatch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

