const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

// Configure multer for LLR file uploads
const llrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/llr');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'llr-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadLlr = multer({
  storage: llrStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';
    
    if (extname || mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) and PDF files are allowed'));
    }
  }
});

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

router.post('/', uploadLlr.single('llrCopy'), async (req, res) => {
  try {
    const { customer, name, phone, address, area, city, state, pincode, material, packaging, bookingToCity, bookingCityNumber, transportName, transportPhone, estimatedDate, llrNumber } = req.body;

    if (!customer || !name || !phone || !transportName) {
      return res.status(400).json({ error: 'Required fields: customer, name, phone, transportName' });
    }

    // Handle LLR file upload
    let llrFilePath = null;
    if (req.file) {
      llrFilePath = `/uploads/llr/${req.file.filename}`;
    }

    // Helper function to convert empty strings to null
    const toNull = (val) => (val && val.toString().trim() !== '') ? val : null;
    
    // Format date if provided (convert DD-MM-YYYY or other formats to YYYY-MM-DD)
    let formattedDate = null;
    if (estimatedDate && estimatedDate.toString().trim() !== '') {
      try {
        const date = new Date(estimatedDate);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      } catch (e) {
        console.warn('Invalid date format:', estimatedDate);
      }
    }

    // Try with new fields first, fallback to old structure if columns don't exist
    let result;
    try {
      // Ensure new columns exist
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatch' AND column_name = 'area') THEN
            ALTER TABLE dispatch ADD COLUMN area VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatch' AND column_name = 'material') THEN
            ALTER TABLE dispatch ADD COLUMN material VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatch' AND column_name = 'booking_to_city') THEN
            ALTER TABLE dispatch ADD COLUMN booking_to_city VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatch' AND column_name = 'booking_city_number') THEN
            ALTER TABLE dispatch ADD COLUMN booking_city_number VARCHAR(20);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatch' AND column_name = 'estimated_date') THEN
            ALTER TABLE dispatch ADD COLUMN estimated_date DATE;
          END IF;
        END $$;
      `);
      
      result = await pool.query(
        `INSERT INTO dispatch (customer, name, phone, address, area, city, material, packaging, booking_to_city, booking_city_number, transport_name, transport_phone, estimated_date, llr_number, llr_file_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          customer.trim(), 
          name.trim(), 
          phone.trim(), 
          toNull(address), 
          toNull(area), 
          toNull(city), 
          toNull(material), 
          toNull(packaging), 
          toNull(bookingToCity), 
          toNull(bookingCityNumber), 
          transportName.trim(), 
          toNull(transportPhone), 
          formattedDate, 
          toNull(llrNumber), 
          llrFilePath
        ]
      );
    } catch (colError) {
      // If new columns don't exist, use old structure
      if (colError.code === '42703') { // undefined_column error
        // Use area as state if state is not provided
        const stateValue = toNull(state) || toNull(area);
        result = await pool.query(
          `INSERT INTO dispatch (customer, name, phone, address, city, state, pincode, transport_name, packaging, llr_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [
            customer.trim(), 
            name.trim(), 
            phone.trim(), 
            toNull(address), 
            toNull(city), 
            stateValue, 
            toNull(pincode), 
            transportName.trim(), 
            toNull(packaging), 
            toNull(llrNumber)
          ]
        );
      } else {
        console.error('Database column error (not 42703):', colError);
        throw colError;
      }
    }

    res.status(201).json({
      success: true,
      dispatch: result.rows[0],
      message: 'Dispatch record created successfully'
    });
  } catch (error) {
    console.error('Create dispatch error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify dispatch (admin/supervisor only) - MUST come before PUT /:id route
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure is_verified column exists
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'dispatch' AND column_name = 'is_verified'
        ) THEN
          ALTER TABLE dispatch ADD COLUMN is_verified BOOLEAN DEFAULT false;
          RAISE NOTICE 'Added is_verified column to dispatch';
        END IF;
      END $$;
    `);
    
    const result = await pool.query(
      'UPDATE dispatch SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dispatch record not found' });
    }
    
    res.json({ 
      success: true, 
      dispatch: result.rows[0],
      message: 'Dispatch verified successfully' 
    });
  } catch (error) {
    console.error('Verify dispatch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', uploadLlr.single('llrCopy'), async (req, res) => {
  try {
    const { id } = req.params;
    const { customer, name, phone, address, city, state, pincode, transportName, transportPhone, packaging, llrNumber, material, bookingToCity, bookingCityNumber, estimatedDate } = req.body;

    if (!customer || !name || !phone || !transportName) {
      return res.status(400).json({ error: 'Required fields: customer, name, phone, transportName' });
    }

    // Handle LLR file upload
    let llrFilePath = null;
    if (req.file) {
      llrFilePath = `/uploads/llr/${req.file.filename}`;
    }

    // Try with new fields first, fallback to old structure if columns don't exist
    let result;
    try {
      const updateFields = [
        'customer = $1',
        'name = $2',
        'phone = $3',
        'address = $4',
        'city = $5',
        'state = $6',
        'pincode = $7',
        'transport_name = $8',
        'transport_phone = $9',
        'packaging = $10',
        'llr_number = $11',
        'material = $12',
        'booking_to_city = $13',
        'booking_city_number = $14',
        'estimated_date = $15',
        'updated_at = CURRENT_TIMESTAMP'
      ];
      
      const updateValues = [customer, name, phone, address || null, city || null, state || null, pincode || null, transportName, transportPhone || null, packaging || null, llrNumber || null, material || null, bookingToCity || null, bookingCityNumber || null, estimatedDate || null];
      
      if (llrFilePath) {
        updateFields.splice(updateFields.length - 1, 0, 'llr_file_path = $16');
        updateValues.push(llrFilePath);
      }
      
      updateValues.push(id);
      
      result = await pool.query(
        `UPDATE dispatch 
         SET ${updateFields.join(', ')}
         WHERE id = $${updateValues.length}
         RETURNING *`,
        updateValues
      );
    } catch (colError) {
      // If new columns don't exist, use old structure
      if (colError.code === '42703') { // undefined_column error
        result = await pool.query(
          `UPDATE dispatch 
           SET customer = $1, 
               name = $2, 
               phone = $3,
               address = $4,
               city = $5,
               state = $6,
               pincode = $7, 
               transport_name = $8,
               packaging = $9,
               llr_number = $10,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $11
           RETURNING *`,
          [customer, name, phone, address || null, city || null, state || null, pincode || null, transportName, packaging || null, llrNumber || null, id]
        );
      } else {
        throw colError;
      }
    }

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

