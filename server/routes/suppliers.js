const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM suppliers ORDER BY created_at DESC'
    );
    res.json({ success: true, suppliers: result.rows });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ success: true, supplier: result.rows[0] });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { supplierName, phone, phone2, phone3, address, city, state, pincode, brand, notifications } = req.body;

    if (!supplierName) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    // Try with new fields first, fallback to old structure if columns don't exist
    let result;
    try {
      result = await pool.query(
        `INSERT INTO suppliers (supplier_name, phone, phone_2, phone_3, address, city, state, pincode, brand, notifications)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          supplierName,
          phone || null,
          phone2 || null,
          phone3 || null,
          address || null,
          city || null,
          state || null,
          pincode || null,
          brand || null,
          notifications || null
        ]
      );
    } catch (colError) {
      // If new columns don't exist, use old structure
      if (colError.code === '42703') { // undefined_column error
        result = await pool.query(
          `INSERT INTO suppliers (supplier_name, phone, address, city, state, pincode, email)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            supplierName,
            phone || null,
            address || null,
            city || null,
            state || null,
            pincode || null,
            null // email removed
          ]
        );
      } else {
        throw colError;
      }
    }

    res.status(201).json({
      success: true,
      supplier: result.rows[0],
      message: 'Supplier created successfully'
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Supplier already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { supplierName, phone, phone2, phone3, address, city, state, pincode, brand, notifications } = req.body;

    if (!supplierName) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    // Try with new fields first, fallback to old structure if columns don't exist
    let result;
    try {
      result = await pool.query(
        `UPDATE suppliers 
         SET supplier_name = $1, 
             phone = $2, 
             phone_2 = $3,
             phone_3 = $4,
             address = $5,
             city = $6,
             state = $7,
             pincode = $8, 
             brand = $9,
             notifications = $10,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $11
         RETURNING *`,
        [supplierName, phone || null, phone2 || null, phone3 || null, address || null, city || null, state || null, pincode || null, brand || null, notifications || null, id]
      );
    } catch (colError) {
      // If new columns don't exist, use old structure
      if (colError.code === '42703') { // undefined_column error
        result = await pool.query(
          `UPDATE suppliers 
           SET supplier_name = $1, 
               phone = $2, 
               address = $3,
               city = $4,
               state = $5,
               pincode = $6, 
               email = $7,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $8
           RETURNING *`,
          [supplierName, phone || null, address || null, city || null, state || null, pincode || null, null, id]
        );
      } else {
        throw colError;
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      success: true,
      supplier: result.rows[0],
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get supplier transactions
router.get('/transactions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT st.*, s.supplier_name, s.phone as supplier_phone, s.email as supplier_email
       FROM stock_transactions st
       LEFT JOIN suppliers s ON s.id = st.reference_id
       WHERE st.transaction_type = 'SUPPLIER'
       ORDER BY st.created_at DESC
       LIMIT 1000`
    );
    res.json({ success: true, transactions: result.rows });
  } catch (error) {
    console.error('Get supplier transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create supplier transaction (record products received from supplier)
router.post('/transaction', async (req, res) => {
  try {
    const { supplierName, phone, products } = req.body;

    if (!supplierName || !supplierName.trim()) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'At least one product is required' });
    }

    // Validate products
    for (const product of products) {
      if (!product.itemCode || !product.quantity || !product.mrp || !product.sellRate) {
        return res.status(400).json({ error: 'All product fields (itemCode, quantity, MRP, sellRate) are required' });
      }
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Find or create supplier
      let supplierResult = await pool.query(
        'SELECT id FROM suppliers WHERE LOWER(TRIM(supplier_name)) = LOWER($1)',
        [supplierName.trim()]
      );

      let supplierId;
      if (supplierResult.rows.length === 0) {
        // Create new supplier
        const newSupplier = await pool.query(
          `INSERT INTO suppliers (supplier_name, phone, updated_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           RETURNING id`,
          [supplierName.trim(), phone || null]
        );
        supplierId = newSupplier.rows[0].id;
      } else {
        supplierId = supplierResult.rows[0].id;
        // Update supplier phone if provided
        if (phone) {
          await pool.query(
            'UPDATE suppliers SET phone = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [phone, supplierId]
          );
        }
      }

      // Get user identifier for created_by
      const createdBy = req.body.createdBy || 'system';

      // Process each product
      for (const product of products) {
        // Find product by item code
        const productResult = await pool.query(
          'SELECT id, current_quantity FROM products WHERE item_code = $1',
          [product.itemCode.trim()]
        );

        let productId;
        let previousQuantity = 0;
        let newQuantity = 0;

        if (productResult.rows.length === 0) {
          // Create new product if it doesn't exist
          const newProduct = await pool.query(
            `INSERT INTO products (
              product_name, item_code, sku_code, category, 
              current_quantity, mrp, sell_rate, supplier_name, 
              minimum_quantity, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, current_quantity`,
            [
              product.productName || 'Unknown Product',
              product.itemCode.trim(),
              product.skuCode || product.itemCode.trim(),
              product.category || null,
              parseFloat(product.quantity) || 0,
              parseFloat(product.mrp) || 0,
              parseFloat(product.sellRate) || 0,
              supplierName.trim(),
              0,
              'STOCK'
            ]
          );
          productId = newProduct.rows[0].id;
          previousQuantity = 0;
          newQuantity = parseFloat(product.quantity) || 0;
        } else {
          // Update existing product
          const existingProduct = productResult.rows[0];
          productId = existingProduct.id;
          previousQuantity = existingProduct.current_quantity || 0;
          newQuantity = previousQuantity + parseFloat(product.quantity);
          
          await pool.query(
            `UPDATE products 
             SET current_quantity = $1,
                 mrp = $2,
                 sell_rate = $3,
                 supplier_name = $4,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [
              newQuantity,
              parseFloat(product.mrp),
              parseFloat(product.sellRate),
              supplierName.trim(),
              existingProduct.id
            ]
          );
        }

        // Create stock transaction record
        await pool.query(
          `INSERT INTO stock_transactions (
            product_id, item_code, product_name, transaction_type,
            quantity, previous_quantity, new_quantity,
            reference_type, reference_id, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            productId,
            product.itemCode.trim(),
            product.productName || 'Unknown Product',
            'SUPPLIER',
            parseFloat(product.quantity) || 0,
            previousQuantity,
            newQuantity,
            'SUPPLIER',
            supplierId,
            createdBy
          ]
        );
      }

      // Commit transaction
      await pool.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Supplier transaction created successfully',
        supplierId: supplierId
      });
    } catch (error) {
      // Rollback on error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Create supplier transaction error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

module.exports = router;

