const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Public endpoint for storefront - only returns available products
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, product_name, item_code, sku_code, category, mrp, discount, sell_rate, 
              current_quantity, image_url, status
       FROM products 
       WHERE status = 'STOCK' AND current_quantity > 0 AND sell_rate IS NOT NULL
       ORDER BY created_at DESC`
    );
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Get public products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/item-code/:itemCode', async (req, res) => {
  try {
    const { itemCode } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE item_code = $1',
      [itemCode]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Get product by item code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { productName, itemCode, skuCode, minimumQuantity, currentQuantity, supplierName, category, mrp, discount, sellRate } = req.body;

    if (!productName || !itemCode || !skuCode) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const result = await pool.query(
      `INSERT INTO products (product_name, item_code, sku_code, minimum_quantity, current_quantity, status, mrp, discount, sell_rate, supplier_name, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        productName, 
        itemCode, 
        skuCode, 
        minimumQuantity || 0, 
        currentQuantity || 0, 
        'STOCK',
        mrp || null,
        discount || 0,
        sellRate || null,
        supplierName || null,
        category && category.trim() !== '' ? category.trim() : null
      ]
    );

    res.status(201).json({
      success: true,
      product: result.rows[0],
      message: 'Product created successfully'
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Item code or SKU code already exists' });
    }
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, itemCode, skuCode, minimumQuantity, supplierName, category, mrp, discount, sellRate, currentQuantity, status } = req.body;

    const result = await pool.query(
      `UPDATE products 
       SET product_name = $1, item_code = $2, sku_code = $3, minimum_quantity = $4, 
           mrp = $5, discount = $6, sell_rate = $7, current_quantity = $8, status = $9, supplier_name = $10, category = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        productName,
        itemCode,
        skuCode,
        minimumQuantity || 0,
        mrp || null,
        discount || 0,
        sellRate || null,
        currentQuantity !== undefined ? currentQuantity : null,
        status || 'STOCK',
        supplierName || null,
        category && category.trim() !== '' ? category.trim() : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product: result.rows[0],
      message: 'Product updated successfully'
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Item code or SKU code already exists' });
    }
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

