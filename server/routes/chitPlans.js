const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all chit plans
router.get('/plans', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chit_plans ORDER BY plan_amount ASC'
    );
    res.json({ success: true, plans: result.rows });
  } catch (error) {
    console.error('Get chit plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chit plan by ID
router.get('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM chit_plans WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chit plan not found' });
    }

    res.json({ success: true, plan: result.rows[0] });
  } catch (error) {
    console.error('Get chit plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all chit customers
router.get('/customers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        cc.*,
        cp.plan_name,
        cp.plan_amount
      FROM chit_customers cc
      LEFT JOIN chit_plans cp ON cc.chit_plan_id = cp.id
      ORDER BY cc.created_at DESC`
    );
    res.json({ success: true, customers: result.rows });
  } catch (error) {
    console.error('Get chit customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chit customer by ID
router.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
        cc.*,
        cp.plan_name,
        cp.plan_amount
      FROM chit_customers cc
      LEFT JOIN chit_plans cp ON cc.chit_plan_id = cp.id
      WHERE cc.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chit customer not found' });
    }

    res.json({ success: true, customer: result.rows[0] });
  } catch (error) {
    console.error('Get chit customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new chit customer
router.post('/customers', async (req, res) => {
  try {
    const { customerName, phone, address, email, chitPlanId, paymentMode } = req.body;

    if (!customerName || !chitPlanId) {
      return res.status(400).json({ error: 'Customer name and chit plan are required' });
    }

    const result = await pool.query(
      `INSERT INTO chit_customers (customer_name, phone, address, email, chit_plan_id, payment_mode, enrollment_date)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
       RETURNING *`,
      [
        customerName,
        phone || null,
        address || null,
        email || null,
        chitPlanId,
        paymentMode || null
      ]
    );

    res.status(201).json({
      success: true,
      customer: result.rows[0],
      message: 'Chit customer created successfully'
    });
  } catch (error) {
    console.error('Create chit customer error:', error);
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Invalid chit plan selected' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update chit customer
router.put('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, phone, address, email, chitPlanId, paymentMode } = req.body;

    if (!customerName || !chitPlanId) {
      return res.status(400).json({ error: 'Customer name and chit plan are required' });
    }

    const result = await pool.query(
      `UPDATE chit_customers 
       SET customer_name = $1, 
           phone = $2, 
           address = $3, 
           email = $4,
           chit_plan_id = $5,
           payment_mode = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [customerName, phone || null, address || null, email || null, chitPlanId, paymentMode || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chit customer not found' });
    }

    res.json({
      success: true,
      customer: result.rows[0],
      message: 'Chit customer updated successfully'
    });
  } catch (error) {
    console.error('Update chit customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete chit customer
router.delete('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM chit_customers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chit customer not found' });
    }

    res.json({ success: true, message: 'Chit customer deleted successfully' });
  } catch (error) {
    console.error('Delete chit customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

