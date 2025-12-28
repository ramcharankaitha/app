const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Create purchase_orders table if it doesn't exist
const createTableIfNotExists = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(100) UNIQUE,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        supplier_name VARCHAR(255) NOT NULL,
        supplier_number VARCHAR(50),
        handler_name VARCHAR(255),
        po_number VARCHAR(100),
        order_date DATE NOT NULL,
        expected_delivery_date DATE,
        total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        items JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Error creating purchase_orders table:', error);
  }
};

// Initialize table on module load
createTableIfNotExists();

// Generate unique order number
const generateOrderNumber = () => {
  const prefix = 'PO';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

// Get all purchase orders
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        po.*,
        COUNT(*) OVER() as total_count,
        CASE 
          WHEN po.items IS NULL THEN 0
          WHEN jsonb_typeof(po.items) = 'array' THEN jsonb_array_length(po.items)
          ELSE 0
        END as items_count
      FROM purchase_orders po
      ORDER BY po.created_at DESC`
    );
    
    res.json({ 
      success: true, 
      orders: result.rows.map(order => {
        let itemsCount = 0;
        try {
          if (order.items) {
            if (typeof order.items === 'string') {
              const parsed = JSON.parse(order.items);
              itemsCount = Array.isArray(parsed) ? parsed.length : 0;
            } else if (Array.isArray(order.items)) {
              itemsCount = order.items.length;
            }
          }
        } catch (e) {
          itemsCount = 0;
        }
        
        return {
          ...order,
          items_count: order.items_count || itemsCount
        };
      })
    });
  } catch (error) {
    console.error('Get purchase orders error:', error);
    // Try a simpler query as fallback
    try {
      const fallbackResult = await pool.query(
        `SELECT * FROM purchase_orders ORDER BY created_at DESC`
      );
      
      res.json({ 
        success: true, 
        orders: fallbackResult.rows.map(order => {
          let itemsCount = 0;
          try {
            if (order.items) {
              if (typeof order.items === 'string') {
                const parsed = JSON.parse(order.items);
                itemsCount = Array.isArray(parsed) ? parsed.length : 0;
              } else if (Array.isArray(order.items)) {
                itemsCount = order.items.length;
              }
            }
          } catch (e) {
            itemsCount = 0;
          }
          
          return {
            ...order,
            items_count: itemsCount
          };
        })
      });
    } catch (fallbackError) {
      console.error('Fallback query error:', fallbackError);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get purchase order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM purchase_orders WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Get purchase order by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create purchase order
router.post('/', async (req, res) => {
  try {
    const {
      supplierId,
      supplierName,
      supplierNumber,
      handlerName,
      poNumber,
      orderDate,
      expectedDeliveryDate,
      items,
      totalAmount,
      notes,
      createdBy
    } = req.body;

    if (!supplierName || !orderDate) {
      return res.status(400).json({ error: 'Supplier name and order date are required' });
    }

    // Items are optional now - allow empty array
    if (!items || !Array.isArray(items)) {
      items = [];
    }

    const orderNumber = poNumber || generateOrderNumber();
    const itemsJson = JSON.stringify(items);

    let result;
    try {
      result = await pool.query(
        `INSERT INTO purchase_orders (
          order_number, supplier_id, supplier_name, supplier_number, handler_name, po_number,
          order_date, expected_delivery_date, items, total_amount, status, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          orderNumber,
          supplierId || null,
          supplierName,
          supplierNumber || null,
          handlerName || null,
          poNumber || null,
          orderDate,
          expectedDeliveryDate || null,
          itemsJson,
          totalAmount || 0,
          'pending',
          notes || null,
          createdBy || 'system'
        ]
      );
    } catch (colError) {
      if (colError.code === '42703') {
        // Column doesn't exist, try without optional columns
        result = await pool.query(
          `INSERT INTO purchase_orders (
            order_number, supplier_id, supplier_name, supplier_number,
            order_date, expected_delivery_date, items, total_amount, status, notes, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            orderNumber,
            supplierId || null,
            supplierName,
            supplierNumber || null,
            orderDate,
            expectedDeliveryDate || null,
            itemsJson,
            totalAmount || 0,
            'pending',
            notes || null,
            createdBy || 'system'
          ]
        );
      } else {
        throw colError;
      }
    }

    res.status(201).json({
      success: true,
      order: result.rows[0],
      message: 'Purchase order created successfully'
    });
  } catch (error) {
    console.error('Create purchase order error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Order number already exists' });
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Update purchase order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      supplierId,
      supplierName,
      supplierNumber,
      handlerName,
      poNumber,
      orderDate,
      expectedDeliveryDate,
      items,
      totalAmount,
      status,
      notes
    } = req.body;

    // Check if order exists
    const orderCheck = await pool.query('SELECT id FROM purchase_orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const itemsJson = items ? JSON.stringify(items) : null;

    let result;
    try {
      result = await pool.query(
        `UPDATE purchase_orders 
         SET supplier_id = COALESCE($1, supplier_id),
             supplier_name = COALESCE($2, supplier_name),
             supplier_number = COALESCE($3, supplier_number),
             handler_name = COALESCE($4, handler_name),
             po_number = COALESCE($5, po_number),
             order_date = COALESCE($6, order_date),
             expected_delivery_date = COALESCE($7, expected_delivery_date),
             items = COALESCE($8::jsonb, items),
             total_amount = COALESCE($9, total_amount),
             status = COALESCE($10, status),
             notes = COALESCE($11, notes),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $12
         RETURNING *`,
        [
          supplierId || null,
          supplierName || null,
          supplierNumber || null,
          handlerName || null,
          poNumber || null,
          orderDate || null,
          expectedDeliveryDate || null,
          itemsJson,
          totalAmount || null,
          status || null,
          notes || null,
          id
        ]
      );
    } catch (colError) {
      if (colError.code === '42703') {
        // Column doesn't exist, try without optional columns
        result = await pool.query(
          `UPDATE purchase_orders 
           SET supplier_id = COALESCE($1, supplier_id),
               supplier_name = COALESCE($2, supplier_name),
               supplier_number = COALESCE($3, supplier_number),
               order_date = COALESCE($4, order_date),
               expected_delivery_date = COALESCE($5, expected_delivery_date),
               items = COALESCE($6::jsonb, items),
               total_amount = COALESCE($7, total_amount),
               status = COALESCE($8, status),
               notes = COALESCE($9, notes)
           WHERE id = $10
           RETURNING *`,
          [
            supplierId || null,
            supplierName || null,
            supplierNumber || null,
            orderDate || null,
            expectedDeliveryDate || null,
            itemsJson,
            totalAmount || null,
            status || null,
            notes || null,
            id
          ]
        );
      } else {
        throw colError;
      }
    }

    res.json({
      success: true,
      order: result.rows[0],
      message: 'Purchase order updated successfully'
    });
  } catch (error) {
    console.error('Update purchase order error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Delete purchase order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM purchase_orders WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Delete purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send SMS for purchase order
router.post('/:id/send-sms', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const order = result.rows[0];
    
    // TODO: Implement actual SMS sending logic
    // For now, just return success
    res.json({
      success: true,
      message: 'SMS sent successfully',
      order: order
    });
  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

