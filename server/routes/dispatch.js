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
    const { customer, name, phone, address, city, state, pincode, transportName, transportPhone, packaging, llrNumber } = req.body;

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
      result = await pool.query(
        `INSERT INTO dispatch (customer, name, phone, address, city, state, pincode, transport_name, transport_phone, packaging, llr_number, llr_file_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [customer, name, phone, address || null, city || null, state || null, pincode || null, transportName, transportPhone || null, packaging || null, llrNumber || null, llrFilePath]
      );
    } catch (colError) {
      // If new columns don't exist, use old structure
      if (colError.code === '42703') { // undefined_column error
        result = await pool.query(
          `INSERT INTO dispatch (customer, name, phone, address, city, state, pincode, transport_name, packaging, llr_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [customer, name, phone, address || null, city || null, state || null, pincode || null, transportName, packaging || null, llrNumber || null]
        );
      } else {
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', uploadLlr.single('llrCopy'), async (req, res) => {
  try {
    const { id } = req.params;
    const { customer, name, phone, address, city, state, pincode, transportName, transportPhone, packaging, llrNumber } = req.body;

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
        'updated_at = CURRENT_TIMESTAMP'
      ];
      
      const updateValues = [customer, name, phone, address || null, city || null, state || null, pincode || null, transportName, transportPhone || null, packaging || null, llrNumber || null];
      
      if (llrFilePath) {
        updateFields.splice(updateFields.length - 1, 0, 'llr_file_path = $12');
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

