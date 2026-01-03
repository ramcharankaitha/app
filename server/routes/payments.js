const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { createNotificationForUserType } = require('../services/notificationService');

// Create payments table if it doesn't exist
const createTableIfNotExists = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        supplier_name VARCHAR(255) NOT NULL,
        supplier_number VARCHAR(50),
        chq_number VARCHAR(100),
        utr VARCHAR(100),
        date_to_be_paid DATE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        created_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on date_to_be_paid for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_date_to_be_paid 
      ON payments(date_to_be_paid)
    `);
  } catch (error) {
    console.error('Error creating payments table:', error);
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
          console.error('❌ Failed to initialize payments table after retries. Database may not be ready.');
          console.error('   The table will be created on first use.');
        }
      } else {
        // Non-connection errors, log but don't retry
        console.error('❌ Error initializing payments table:', error.message);
        break;
      }
    }
  }
};

// Initialize asynchronously without blocking
initializeTableWithRetry().catch(err => {
  console.error('❌ Table initialization failed:', err.message);
});

// Get all payments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM payments ORDER BY created_at DESC`
    );
    
    res.json({ 
      success: true, 
      payments: result.rows
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch payments' 
    });
  }
});

// Get payment by ID
// Verify payment (admin/supervisor only) - MUST come before GET /:id route
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Payments Verify] Received PUT /payments/${id}/verify request`);
    
    // Ensure is_verified column exists
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'payments' AND column_name = 'is_verified'
        ) THEN
          ALTER TABLE payments ADD COLUMN is_verified BOOLEAN DEFAULT false;
          RAISE NOTICE 'Added is_verified column to payments';
        END IF;
      END $$;
    `);
    
    const result = await pool.query(
      'UPDATE payments SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ 
      success: true, 
      payment: result.rows[0],
      message: 'Payment verified successfully' 
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment not found' 
      });
    }

    res.json({ 
      success: true, 
      payment: result.rows[0] 
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch payment' 
    });
  }
});

// Create new payment
router.post('/', async (req, res) => {
  try {
    const { 
      supplierName, 
      supplierNumber, 
      chqNumber, 
      utr, 
      dateToBePaid, 
      amount, 
      createdBy 
    } = req.body;

    if (!supplierName || !dateToBePaid || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Supplier name, date to be paid, and amount are required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO payments (
        supplier_name, 
        supplier_number, 
        chq_number, 
        utr, 
        date_to_be_paid, 
        amount, 
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        supplierName,
        supplierNumber || null,
        chqNumber || null,
        utr || null,
        dateToBePaid,
        parseFloat(amount),
        createdBy || 'system'
      ]
    );

    res.json({ 
      success: true, 
      payment: result.rows[0],
      message: 'Payment created successfully' 
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create payment' 
    });
  }
});

// Update payment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      supplierName, 
      supplierNumber, 
      chqNumber, 
      utr, 
      dateToBePaid, 
      amount 
    } = req.body;

    if (!supplierName || !dateToBePaid || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Supplier name, date to be paid, and amount are required' 
      });
    }

    const result = await pool.query(
      `UPDATE payments SET
        supplier_name = $1,
        supplier_number = $2,
        chq_number = $3,
        utr = $4,
        date_to_be_paid = $5,
        amount = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *`,
      [
        supplierName,
        supplierNumber || null,
        chqNumber || null,
        utr || null,
        dateToBePaid,
        parseFloat(amount),
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment not found' 
      });
    }

    res.json({ 
      success: true, 
      payment: result.rows[0],
      message: 'Payment updated successfully' 
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update payment' 
    });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM payments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Payment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete payment' 
    });
  }
});

// Test endpoint to send a sample notification (for testing purposes)
router.post('/test-notification', async (req, res) => {
  try {
    const { createNotificationForUserType } = require('../services/notificationService');
    
    // Create a sample payment notification
    const sampleAmount = 50000;
    const sampleSupplier = 'Test Supplier Name';
    
    // Send notification to admin
    await createNotificationForUserType(
      'admin',
      'warning',
      'Payment Due Tomorrow',
      `Payment of ₹${sampleAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} for ${sampleSupplier} is due tomorrow. Please make sure to pay the bill.`,
      true,
      null
    );

    // Send notification to supervisor
    await createNotificationForUserType(
      'supervisor',
      'warning',
      'Payment Due Tomorrow',
      `Payment of ₹${sampleAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} for ${sampleSupplier} is due tomorrow. Please make sure to pay the bill.`,
      true,
      null
    );

    res.json({ 
      success: true, 
      message: 'Test notification sent successfully to admin and supervisor',
      notification: {
        title: 'Payment Due Tomorrow',
        message: `Payment of ₹${sampleAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} for ${sampleSupplier} is due tomorrow. Please make sure to pay the bill.`,
        type: 'warning',
        isCritical: true
      }
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send test notification' 
    });
  }
});

// Check for upcoming payments and send notifications
// This should be called daily (via cron job or scheduled task)
router.post('/check-upcoming-payments', async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Find payments due tomorrow
    const result = await pool.query(
      `SELECT * FROM payments 
       WHERE date_to_be_paid = $1 
       AND id NOT IN (
         SELECT DISTINCT related_id 
         FROM notifications 
         WHERE notification_type = 'warning' 
         AND title LIKE '%Payment Due%'
         AND created_at::date = CURRENT_DATE
       )`,
      [tomorrowStr]
    );

    let notificationCount = 0;

    for (const payment of result.rows) {
      try {
        // Send notification to admin
        await createNotificationForUserType(
          'admin',
          'warning',
          'Payment Due Tomorrow',
          `Payment of ₹${parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} for ${payment.supplier_name} is due tomorrow. Please make sure to pay the bill.`,
          true,
          payment.id
        );

        // Send notification to supervisor
        await createNotificationForUserType(
          'supervisor',
          'warning',
          'Payment Due Tomorrow',
          `Payment of ₹${parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} for ${payment.supplier_name} is due tomorrow. Please make sure to pay the bill.`,
          true,
          payment.id
        );

        notificationCount++;
      } catch (err) {
        console.error(`Error creating notification for payment ${payment.id}:`, err);
      }
    }

    res.json({ 
      success: true, 
      message: `Checked upcoming payments. Sent ${notificationCount} notification(s).`,
      count: notificationCount
    });
  } catch (error) {
    console.error('Error checking upcoming payments:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check upcoming payments' 
    });
  }
});

module.exports = router;

