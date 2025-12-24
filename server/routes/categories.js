const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY main ASC, sub ASC, common ASC'
    );

    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new category
router.post('/', async (req, res) => {
  try {
    const { main, sub, common, city } = req.body;

    if (!main || !sub || !common) {
      return res.status(400).json({ error: 'Main, Sub, and Common categories are required' });
    }

    const result = await pool.query(
      `INSERT INTO categories (main, sub, common, city)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [main.trim(), sub.trim(), common.trim(), city ? city.trim() : null]
    );

    res.status(201).json({
      success: true,
      category: result.rows[0],
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { main, sub, common, city } = req.body;

    if (!main || !sub || !common) {
      return res.status(400).json({ error: 'Main, Sub, and Common categories are required' });
    }

    const result = await pool.query(
      `UPDATE categories 
       SET main = $1, sub = $2, common = $3, city = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [main.trim(), sub.trim(), common.trim(), city ? city.trim() : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      category: result.rows[0],
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

