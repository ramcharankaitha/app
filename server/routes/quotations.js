const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Create quotations table if it doesn't exist
const createTableIfNotExists = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        items JSONB,
        gst_number VARCHAR(50) NOT NULL,
        quotation_date DATE NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add items column if it doesn't exist (for existing tables)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'quotations' AND column_name = 'items'
        ) THEN
          ALTER TABLE quotations ADD COLUMN items JSONB;
          -- Migrate existing data if any
          UPDATE quotations SET items = jsonb_build_array(
            jsonb_build_object(
              'itemCode', item_code,
              'price', price,
              'quantity', quantity,
              'totalPrice', total_price
            )
          ) WHERE items IS NULL;
        END IF;
      END $$;
    `);
    
    console.log('Quotations table ensured');
  } catch (error) {
    console.error('Error creating quotations table:', error);
  }
};

// Initialize table on module load
createTableIfNotExists();

// Get all quotations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM quotations ORDER BY created_at DESC'
    );
    
    // Transform results to include first item details for display
    const transformedQuotations = result.rows.map(quotation => {
      let firstItem = null;
      if (quotation.items && typeof quotation.items === 'string') {
        try {
          const items = JSON.parse(quotation.items);
          firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;
        } catch (e) {
          console.error('Error parsing items JSON:', e);
        }
      } else if (Array.isArray(quotation.items) && quotation.items.length > 0) {
        firstItem = quotation.items[0];
      }
      
      return {
        ...quotation,
        item_code: firstItem?.itemCode || quotation.item_code || 'N/A',
        price: firstItem?.price || quotation.price || 0,
        quantity: firstItem?.quantity || quotation.quantity || 0
      };
    });
    
    res.json({ success: true, quotations: transformedQuotations });
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get quotation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM quotations WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json({ success: true, quotation: result.rows[0] });
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create quotation
router.post('/', async (req, res) => {
  try {
    await createTableIfNotExists();
    
    const { items, gstNumber, quotationDate, totalPrice, createdBy } = req.body;

    if (!gstNumber || !quotationDate) {
      return res.status(400).json({ error: 'GST number and quotation date are required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Validate all items
    for (const item of items) {
      if (!item.itemCode || !item.price || !item.quantity) {
        return res.status(400).json({ error: 'Each item must have item code, price, and quantity' });
      }
      if (parseFloat(item.price) <= 0 || parseFloat(item.quantity) <= 0) {
        return res.status(400).json({ error: 'Price and quantity must be greater than 0' });
      }
    }

    // Calculate total price from items if not provided
    let calculatedTotalPrice = parseFloat(totalPrice) || 0;
    if (calculatedTotalPrice === 0) {
      calculatedTotalPrice = items.reduce((total, item) => {
        return total + (parseFloat(item.price) * parseFloat(item.quantity));
      }, 0);
    }

    const itemsJson = JSON.stringify(items);

    const result = await pool.query(
      `INSERT INTO quotations (items, gst_number, quotation_date, total_price, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        itemsJson,
        gstNumber.trim(),
        quotationDate,
        calculatedTotalPrice,
        createdBy || 'system'
      ]
    );

    res.status(201).json({
      success: true,
      quotation: result.rows[0],
      message: 'Quotation created successfully'
    });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update quotation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemCode, price, quantity, gstNumber, quotationDate, totalPrice } = req.body;

    if (!itemCode || !price || !quantity || !gstNumber || !quotationDate) {
      return res.status(400).json({ error: 'Item code, price, quantity, GST number, and quotation date are required' });
    }

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity);
    const parsedTotalPrice = parseFloat(totalPrice);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    if (isNaN(parsedTotalPrice) || parsedTotalPrice <= 0) {
      return res.status(400).json({ error: 'Invalid total price' });
    }

    const result = await pool.query(
      `UPDATE quotations 
       SET item_code = $1, price = $2, quantity = $3, gst_number = $4, quotation_date = $5, total_price = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        itemCode.trim(),
        parsedPrice,
        parsedQuantity,
        gstNumber.trim(),
        quotationDate,
        parsedTotalPrice,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json({
      success: true,
      quotation: result.rows[0],
      message: 'Quotation updated successfully'
    });
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete quotation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM quotations WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

