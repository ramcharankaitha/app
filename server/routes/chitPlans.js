const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

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

router.post('/plans', async (req, res) => {
  try {
    const { planName, planAmount } = req.body;

    if (!planName || !planAmount) {
      return res.status(400).json({ error: 'Plan name and amount are required' });
    }

    const result = await pool.query(
      `INSERT INTO chit_plans (plan_name, plan_amount)
       VALUES ($1, $2)
       RETURNING *`,
      [planName, planAmount]
    );

    res.status(201).json({
      success: true,
      plan: result.rows[0],
      message: 'Chit plan created successfully'
    });
  } catch (error) {
    console.error('Create chit plan error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'A chit plan with this name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { planName, planAmount } = req.body;

    if (!planName || !planAmount) {
      return res.status(400).json({ error: 'Plan name and amount are required' });
    }

    const result = await pool.query(
      `UPDATE chit_plans 
       SET plan_name = $1, 
           plan_amount = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [planName, planAmount, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chit plan not found' });
    }

    res.json({
      success: true,
      plan: result.rows[0],
      message: 'Chit plan updated successfully'
    });
  } catch (error) {
    console.error('Update chit plan error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'A chit plan with this name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if there are any customers using this plan
    const customersCheck = await pool.query(
      'SELECT id FROM chit_customers WHERE chit_plan_id = $1 LIMIT 1',
      [id]
    );

    if (customersCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete chit plan. There are customers enrolled in this plan.' 
      });
    }

    const result = await pool.query('DELETE FROM chit_plans WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chit plan not found' });
    }

    res.json({ success: true, message: 'Chit plan deleted successfully' });
  } catch (error) {
    console.error('Delete chit plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/customers', async (req, res) => {
  try {
    // Ensure chit_number column exists
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'chit_customers' AND column_name = 'chit_number'
        ) THEN
          ALTER TABLE chit_customers ADD COLUMN chit_number VARCHAR(100);
          RAISE NOTICE 'Added chit_number column to chit_customers';
        END IF;
      END $$;
    `);
    
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

router.post('/customers', async (req, res) => {
  try {
    const { customerName, phone, address, city, state, pincode, email, chitPlanId, paymentMode, userRole, createdBy } = req.body;

    if (!customerName || !chitPlanId) {
      return res.status(400).json({ error: 'Customer name and chit plan are required' });
    }

    // Ensure verification columns exist
    const { ensureVerificationColumn, shouldBeVerified, notifyStaffCreation } = require('../utils/verification');
    await ensureVerificationColumn('chit_customers');
    
    // Determine verification status based on user role
    const isVerified = shouldBeVerified(userRole || 'staff');

    const result = await pool.query(
      `INSERT INTO chit_customers (customer_name, phone, address, city, state, pincode, email, chit_plan_id, payment_mode, enrollment_date, is_verified, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, $10, $11)
       RETURNING *`,
      [
        customerName,
        phone || null,
        address || null,
        city || null,
        state || null,
        pincode || null,
        email || null,
        chitPlanId,
        paymentMode || null,
        isVerified,
        createdBy || null
      ]
    );

    // Send notification if created by staff
    if (!isVerified) {
      await notifyStaffCreation('Chit Plan Customer', customerName, result.rows[0].id);
    }

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

// Verify chit plan customer (admin/supervisor only) - MUST come before /customers/:id
router.put('/customers/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { ensureVerificationColumn } = require('../utils/verification');
    await ensureVerificationColumn('chit_customers');
    
    const result = await pool.query(
      'UPDATE chit_customers SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chit plan customer not found' });
    }
    
    res.json({ 
      success: true, 
      customer: result.rows[0],
      message: 'Chit plan customer verified successfully' 
    });
  } catch (error) {
    console.error('Verify chit plan customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, phone, address, city, state, pincode, email, chitPlanId, paymentMode } = req.body;

    if (!customerName || !chitPlanId) {
      return res.status(400).json({ error: 'Customer name and chit plan are required' });
    }

    const result = await pool.query(
      `UPDATE chit_customers 
       SET customer_name = $1, 
           phone = $2, 
           address = $3,
           city = $4,
           state = $5,
           pincode = $6, 
           email = $7,
           chit_plan_id = $8,
           payment_mode = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [customerName, phone || null, address || null, city || null, state || null, pincode || null, email || null, chitPlanId, paymentMode || null, id]
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

router.delete('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    // Check if customer exists
    const checkResult = await pool.query('SELECT id FROM chit_customers WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chit customer not found' });
    }

    // Check if there are related chit entries
    const entriesCheck = await pool.query(
      'SELECT id FROM chit_entries WHERE customer_id = $1 LIMIT 1',
      [id]
    );

    if (entriesCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer as they have chit entries. Please delete the entries first.' 
      });
    }

    // Delete the customer
    const result = await pool.query('DELETE FROM chit_customers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chit customer not found' });
    }

    res.json({ success: true, message: 'Chit customer deleted successfully' });
  } catch (error) {
    console.error('Delete chit customer error:', error);
    
    // Handle foreign key constraint violations
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'Cannot delete customer as they are linked to other records (e.g., chit entries).' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Chit Entry Routes
router.get('/entries', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ce.*,
        cc.customer_name,
        cc.phone,
        cp.plan_name,
        cp.plan_amount
      FROM chit_entries ce
      LEFT JOIN chit_customers cc ON ce.customer_id = cc.id
      LEFT JOIN chit_plans cp ON ce.chit_plan_id = cp.id
      ORDER BY ce.created_at DESC`
    );
    res.json({ success: true, entries: result.rows });
  } catch (error) {
    console.error('Get chit entries error:', error);
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      res.json({ success: true, entries: [] });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.get('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
        ce.*,
        cc.customer_name,
        cc.phone,
        cp.plan_name,
        cp.plan_amount
      FROM chit_entries ce
      LEFT JOIN chit_customers cc ON ce.customer_id = cc.id
      LEFT JOIN chit_plans cp ON ce.chit_plan_id = cp.id
      WHERE ce.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chit entry not found' });
    }

    res.json({ success: true, entry: result.rows[0] });
  } catch (error) {
    console.error('Get chit entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/entries', async (req, res) => {
  try {
    const { customerId, chitPlanId, paymentMode, month, notes, createdBy } = req.body;

    if (!customerId || !chitPlanId || !paymentMode) {
      return res.status(400).json({ error: 'Customer ID, Chit Plan ID, and Payment Mode are required' });
    }

    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }

    // First, ensure chit_entries table exists (MUST be done before any column checks)
    try {
      // Check if table exists first
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'chit_entries'
        )
      `);

      if (!tableExists.rows[0].exists) {
        // Table doesn't exist, create it
        await pool.query(`
          CREATE TABLE chit_entries (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER,
            chit_plan_id INTEGER,
            payment_mode VARCHAR(50) NOT NULL,
            month INTEGER,
            notes TEXT,
            created_by VARCHAR(255),
            is_verified BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('Created chit_entries table');
      }
    } catch (tableError) {
      console.error('Error checking/creating chit_entries table:', tableError);
      // If it's not a "table already exists" error, throw it
      if (tableError.code !== '42P07') {
        throw tableError;
      }
    }

    // Now ensure all columns exist (table must exist first)
    try {
      await pool.query(`
        DO $$ 
        BEGIN
          -- Ensure month column exists
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'chit_entries' AND column_name = 'month'
          ) THEN
            ALTER TABLE chit_entries ADD COLUMN month INTEGER;
            RAISE NOTICE 'Added month column to chit_entries';
          END IF;
          
          -- Ensure is_verified column exists
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'chit_entries' AND column_name = 'is_verified'
          ) THEN
            ALTER TABLE chit_entries ADD COLUMN is_verified BOOLEAN DEFAULT false;
            RAISE NOTICE 'Added is_verified column to chit_entries';
          END IF;
        END $$;
      `);
    } catch (columnError) {
      console.error('Error adding columns to chit_entries:', columnError);
      // If table still doesn't exist, this is a critical error
      if (columnError.code === '42P01') {
        throw new Error('chit_entries table could not be created. Please contact administrator.');
      }
      // For other column errors, log but continue (column might already exist)
      console.warn('Column addition warning:', columnError.message);
    }

    // Add foreign key constraints if they don't exist (without failing if tables don't exist)
    try {
      // Check if chit_customers table exists before adding FK
      const customersTableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'chit_customers'
        )
      `);
      
      if (customersTableCheck.rows[0].exists) {
        // Check if foreign key constraint already exists
        const fkCheck = await pool.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'chit_entries_customer_id_fkey'
            AND table_name = 'chit_entries'
          )
        `);
        
        if (!fkCheck.rows[0].exists) {
          await pool.query(`
            ALTER TABLE chit_entries 
            ADD CONSTRAINT chit_entries_customer_id_fkey 
            FOREIGN KEY (customer_id) REFERENCES chit_customers(id) ON DELETE CASCADE
          `);
        }
      }
    } catch (fkError) {
      console.warn('Could not add customer_id foreign key constraint:', fkError.message);
    }

    try {
      // Check if chit_plans table exists before adding FK
      const plansTableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'chit_plans'
        )
      `);
      
      if (plansTableCheck.rows[0].exists) {
        // Check if foreign key constraint already exists
        const fkCheck = await pool.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'chit_entries_chit_plan_id_fkey'
            AND table_name = 'chit_entries'
          )
        `);
        
        if (!fkCheck.rows[0].exists) {
          await pool.query(`
            ALTER TABLE chit_entries 
            ADD CONSTRAINT chit_entries_chit_plan_id_fkey 
            FOREIGN KEY (chit_plan_id) REFERENCES chit_plans(id) ON DELETE CASCADE
          `);
        }
      }
    } catch (fkError) {
      console.warn('Could not add chit_plan_id foreign key constraint:', fkError.message);
    }

    // Verify customer_id and chit_plan_id exist before inserting
    const customerCheck = await pool.query('SELECT id FROM chit_customers WHERE id = $1', [customerId]);
    if (customerCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid customer ID. Customer does not exist.' });
    }

    const planCheck = await pool.query('SELECT id FROM chit_plans WHERE id = $1', [chitPlanId]);
    if (planCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid chit plan ID. Chit plan does not exist.' });
    }

    let result;
    try {
      result = await pool.query(
        `INSERT INTO chit_entries (customer_id, chit_plan_id, payment_mode, month, notes, created_by, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, false)
         RETURNING *`,
        [customerId, chitPlanId, paymentMode, parseInt(month) || null, notes || null, createdBy || 'system']
      );
    } catch (insertError) {
      console.error('Insert chit entry error:', insertError);
      // Handle foreign key constraint errors
      if (insertError.code === '23503') {
        if (insertError.constraint === 'chit_entries_customer_id_fkey' || insertError.message.includes('customer_id')) {
          return res.status(400).json({ error: 'Invalid customer ID. Customer does not exist.' });
        }
        if (insertError.constraint === 'chit_entries_chit_plan_id_fkey' || insertError.message.includes('chit_plan_id')) {
          return res.status(400).json({ error: 'Invalid chit plan ID. Chit plan does not exist.' });
        }
        return res.status(400).json({ error: 'Foreign key constraint violation. Please check customer and chit plan IDs.' });
      }
      throw insertError;
    }

    res.status(201).json({
      success: true,
      entry: result.rows[0],
      message: 'Chit entry created successfully'
    });
  } catch (error) {
    console.error('Create chit entry error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table
    });
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') {
      return res.status(500).json({ 
        error: 'Database table does not exist. Please contact administrator.',
        details: error.message 
      });
    }
    
    if (error.code === '23503') {
      if (error.message.includes('chit_customers') || error.message.includes('customer_id')) {
        return res.status(400).json({ 
          error: 'Invalid customer. The customer does not exist in the system.',
          details: error.message 
        });
      }
      if (error.message.includes('chit_plans') || error.message.includes('chit_plan_id')) {
        return res.status(400).json({ 
          error: 'Invalid chit plan. The chit plan does not exist in the system.',
          details: error.message 
        });
      }
      return res.status(400).json({ 
        error: 'Invalid reference. Please check customer and chit plan selections.',
        details: error.message 
      });
    }
    
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: 'Duplicate entry. This chit entry already exists.',
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create chit entry. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify chit entry (admin/supervisor only) - MUST come before PUT /entries/:id route
router.put('/entries/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Chit Entry Verify] Received PUT /chit-plans/entries/${id}/verify request`);
    
    // Ensure is_verified column exists
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'chit_entries' AND column_name = 'is_verified'
        ) THEN
          ALTER TABLE chit_entries ADD COLUMN is_verified BOOLEAN DEFAULT false;
          RAISE NOTICE 'Added is_verified column to chit_entries';
        END IF;
      END $$;
    `);
    
    const result = await pool.query(
      'UPDATE chit_entries SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chit entry not found' });
    }
    
    res.json({ 
      success: true, 
      entry: result.rows[0],
      message: 'Chit entry verified successfully' 
    });
  } catch (error) {
    console.error('Verify chit entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { chitPlanId, paymentMode, notes } = req.body;

    if (!paymentMode) {
      return res.status(400).json({ error: 'Payment Mode is required' });
    }

    if (!chitPlanId) {
      return res.status(400).json({ error: 'Chit Plan ID is required' });
    }

    let result;
    try {
      result = await pool.query(
        `UPDATE chit_entries 
         SET chit_plan_id = $1,
             payment_mode = $2, 
             notes = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [chitPlanId, paymentMode, notes || null, id]
      );
    } catch (colError) {
      if (colError.code === '42703') {
        // updated_at column doesn't exist, try without it
        try {
          result = await pool.query(
            `UPDATE chit_entries 
             SET chit_plan_id = $1,
                 payment_mode = $2, 
                 notes = $3
             WHERE id = $4
             RETURNING *`,
            [chitPlanId, paymentMode, notes || null, id]
          );
        } catch (colError2) {
          if (colError2.code === '42703') {
            // chit_plan_id column might not exist, try without it
            result = await pool.query(
              `UPDATE chit_entries 
               SET payment_mode = $1, 
                   notes = $2
               WHERE id = $3
               RETURNING *`,
              [paymentMode, notes || null, id]
            );
          } else {
            throw colError2;
          }
        }
      } else {
        throw colError;
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chit entry not found' });
    }

    res.json({
      success: true,
      entry: result.rows[0],
      message: 'Chit entry updated successfully'
    });
  } catch (error) {
    console.error('Update chit entry error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;

