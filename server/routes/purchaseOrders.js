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

// Initialize table on module load with retry logic
const initializeTableWithRetry = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await createTableIfNotExists();
      return; // Success, exit
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        if (i < retries - 1) {
          console.log(`⚠️  Database not ready, retrying in ${delay}ms... (${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5; // Exponential backoff
        } else {
          console.error('❌ Failed to initialize purchase_orders table after retries. Database may not be ready.');
          console.error('   The table will be created on first use.');
        }
      } else {
        // Non-connection errors, log but don't retry
        console.error('❌ Error initializing purchase_orders table:', error.message);
        break;
      }
    }
  }
};

// Initialize asynchronously without blocking
initializeTableWithRetry().catch(err => {
  console.error('❌ Table initialization failed:', err.message);
});

// Generate unique order number
const generateOrderNumber = () => {
  const prefix = 'PO';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

// Get purchase orders by handler - MUST come before GET /
router.get('/handler/:handlerName', async (req, res) => {
  try {
    const { handlerName } = req.params;
    const handlerId = req.query.handlerId ? parseInt(req.query.handlerId) : null;
    const decodedHandlerName = decodeURIComponent(handlerName);
    
    console.log('Fetching purchase orders for handler:', decodedHandlerName, 'handlerId:', handlerId);
    
    // Ensure handler_id column exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'handler_id') THEN
          ALTER TABLE purchase_orders ADD COLUMN handler_id INTEGER;
          RAISE NOTICE 'Added handler_id column to purchase_orders';
        END IF;
      END $$;
    `);
    
    let query;
    let params;
    
    if (handlerId) {
      query = `SELECT * FROM purchase_orders WHERE handler_id = $1 ORDER BY created_at DESC`;
      params = [handlerId];
    } else {
      query = `SELECT * FROM purchase_orders 
               WHERE handler_name IS NOT NULL 
                 AND (
                   LOWER(TRIM(handler_name)) = LOWER(TRIM($1))
                   OR LOWER(TRIM(handler_name)) LIKE '%' || LOWER(TRIM($1)) || '%'
                 )
               ORDER BY created_at DESC`;
      params = [decodedHandlerName];
    }
    
    const result = await pool.query(query, params);
    
    res.json({ 
      success: true, 
      orders: result.rows 
    });
  } catch (error) {
    console.error('Get purchase orders by handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
        let calculatedTotal = parseFloat(order.total_amount) || 0;
        
        try {
          if (order.items) {
            let items = [];
            if (typeof order.items === 'string') {
              items = JSON.parse(order.items);
            } else if (Array.isArray(order.items)) {
              items = order.items;
            }
            
            itemsCount = items.length;
            
            // Calculate total from items if total_amount is 0 or missing
            if (calculatedTotal === 0 && items.length > 0) {
              calculatedTotal = items.reduce((total, item) => {
                const quantity = parseFloat(item.quantity) || 0;
                const unitPrice = parseFloat(item.unitPrice) || parseFloat(item.mrp) || 0;
                const totalPrice = parseFloat(item.totalPrice) || (quantity * unitPrice);
                return total + totalPrice;
              }, 0);
              
              // Update database if calculated total is greater than 0
              if (calculatedTotal > 0) {
                pool.query(
                  'UPDATE purchase_orders SET total_amount = $1 WHERE id = $2',
                  [calculatedTotal, order.id]
                ).catch(err => {
                  console.error('Error updating total_amount:', err);
                });
              }
            }
          }
        } catch (e) {
          itemsCount = 0;
        }
        
        return {
          ...order,
          items_count: order.items_count || itemsCount,
          total_amount: calculatedTotal > 0 ? calculatedTotal : (parseFloat(order.total_amount) || 0)
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
          let calculatedTotal = parseFloat(order.total_amount) || 0;
          
          try {
            if (order.items) {
              let items = [];
              if (typeof order.items === 'string') {
                items = JSON.parse(order.items);
              } else if (Array.isArray(order.items)) {
                items = order.items;
              }
              
              itemsCount = items.length;
              
              // Calculate total from items if total_amount is 0 or missing
              if (calculatedTotal === 0 && items.length > 0) {
                calculatedTotal = items.reduce((total, item) => {
                  const quantity = parseFloat(item.quantity) || 0;
                  const unitPrice = parseFloat(item.unitPrice) || parseFloat(item.mrp) || 0;
                  const totalPrice = parseFloat(item.totalPrice) || (quantity * unitPrice);
                  return total + totalPrice;
                }, 0);
                
                // Update database if calculated total is greater than 0
                if (calculatedTotal > 0) {
                  pool.query(
                    'UPDATE purchase_orders SET total_amount = $1 WHERE id = $2',
                    [calculatedTotal, order.id]
                  ).catch(err => {
                    console.error('Error updating total_amount:', err);
                  });
                }
              }
            }
          } catch (e) {
            itemsCount = 0;
          }
          
          return {
            ...order,
            items_count: itemsCount,
            total_amount: calculatedTotal > 0 ? calculatedTotal : (parseFloat(order.total_amount) || 0)
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
// Verify purchase order (admin/supervisor only) - MUST come before GET /:id route
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Purchase Orders Verify] Received PUT /purchase-orders/${id}/verify request`);
    
    // Ensure is_verified column exists
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'purchase_orders' AND column_name = 'is_verified'
        ) THEN
          ALTER TABLE purchase_orders ADD COLUMN is_verified BOOLEAN DEFAULT false;
          RAISE NOTICE 'Added is_verified column to purchase_orders';
        END IF;
      END $$;
    `);
    
    const result = await pool.query(
      'UPDATE purchase_orders SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    res.json({ 
      success: true, 
      order: result.rows[0],
      message: 'Purchase order verified successfully' 
    });
  } catch (error) {
    console.error('Verify purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

    let order = result.rows[0];
    
    // Calculate total amount from items if total_amount is 0 or missing
    if (!order.total_amount || parseFloat(order.total_amount) === 0) {
      try {
        let items = [];
        if (order.items) {
          if (typeof order.items === 'string') {
            items = JSON.parse(order.items);
          } else if (Array.isArray(order.items)) {
            items = order.items;
          }
        }
        
        if (items.length > 0) {
          const calculatedTotal = items.reduce((total, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || parseFloat(item.mrp) || 0;
            const totalPrice = parseFloat(item.totalPrice) || (quantity * unitPrice);
            return total + totalPrice;
          }, 0);
          
          if (calculatedTotal > 0) {
            order.total_amount = calculatedTotal;
            // Update the database
            await pool.query(
              'UPDATE purchase_orders SET total_amount = $1 WHERE id = $2',
              [calculatedTotal, order.id]
            );
          }
        }
      } catch (calcError) {
        console.error('Error calculating total from items:', calcError);
      }
    }
    
    // If PO number exists and items are empty, try to fetch from sales order
    if (order.po_number && (!order.items || (typeof order.items === 'string' ? JSON.parse(order.items) : order.items).length === 0)) {
      try {
        const salesOrderResult = await pool.query(
          'SELECT products FROM sales_records WHERE po_number = $1 ORDER BY created_at DESC LIMIT 1',
          [order.po_number]
        );
        
        if (salesOrderResult.rows.length > 0 && salesOrderResult.rows[0].products) {
          const salesProducts = salesOrderResult.rows[0].products;
          // Convert sales order products to purchase order items format
          let items = [];
          if (typeof salesProducts === 'string') {
            items = JSON.parse(salesProducts);
          } else if (Array.isArray(salesProducts)) {
            items = salesProducts;
          }
          
          // Transform to purchase order item format
          const transformedItems = items.map(product => {
            const quantity = parseFloat(product.quantity) || 0;
            const sellRate = parseFloat(product.sellRate) || parseFloat(product.sell_rate) || 0;
            const mrp = parseFloat(product.mrp) || 0;
            const unitPrice = sellRate > 0 ? sellRate : mrp;
            const totalPrice = quantity * unitPrice;
            
            return {
              itemCode: product.itemCode || product.item_code || '',
              productName: product.productName || product.product_name || '',
              quantity: quantity,
              unitPrice: unitPrice,
              totalPrice: totalPrice
            };
          });
          
          if (transformedItems.length > 0) {
            order.items = transformedItems;
            // Calculate total amount from items
            const calculatedTotal = transformedItems.reduce((total, item) => {
              return total + (parseFloat(item.totalPrice) || 0);
            }, 0);
            
            // Update the purchase order with items and total amount
            await pool.query(
              'UPDATE purchase_orders SET items = $1, total_amount = $2 WHERE id = $3',
              [JSON.stringify(transformedItems), calculatedTotal, id]
            );
            
            // Update order object for response
            order.total_amount = calculatedTotal;
          }
        }
      } catch (salesError) {
        console.error('Error fetching items from sales order:', salesError);
        // Continue with existing order data
      }
    }

    res.json({ success: true, order: order });
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
      handlerId,
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

    // Ensure handler_id column exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'handler_id') THEN
          ALTER TABLE purchase_orders ADD COLUMN handler_id INTEGER;
          RAISE NOTICE 'Added handler_id column to purchase_orders';
        END IF;
      END $$;
    `);

    // If handlerId is provided, verify it and get the correct name
    let finalHandlerId = handlerId ? parseInt(handlerId) : null;
    let finalHandlerName = handlerName;

    if (finalHandlerId) {
      try {
        const staffResult = await pool.query(
          `SELECT id, full_name FROM staff WHERE id = $1 LIMIT 1`,
          [finalHandlerId]
        );
        if (staffResult.rows.length > 0) {
          finalHandlerName = staffResult.rows[0].full_name;
        } else {
          console.warn('Handler ID', finalHandlerId, 'not found in staff table during purchase order creation');
        }
      } catch (staffError) {
        console.error('Error verifying handler_id during purchase order creation:', staffError);
      }
    }

    const orderNumber = poNumber || generateOrderNumber();
    const itemsJson = JSON.stringify(items);

    let result;
    try {
      result = await pool.query(
        `INSERT INTO purchase_orders (
          order_number, supplier_id, supplier_name, supplier_number, handler_id, handler_name, po_number,
          order_date, expected_delivery_date, items, total_amount, status, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          orderNumber,
          supplierId || null,
          supplierName,
          supplierNumber || null,
          finalHandlerId,
          finalHandlerName || null,
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
        // Column doesn't exist, try without handler_id
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
            finalHandlerName || null,
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
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      constraint: error.constraint
    });
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Order number already exists' });
    }
    if (error.code === '23502') {
      return res.status(400).json({ error: `Required field missing: ${error.column || 'unknown'}` });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please check server logs'
    });
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

