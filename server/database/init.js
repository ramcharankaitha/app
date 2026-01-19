const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const initDatabase = async () => {
  try {
    // Check if database is already initialized
    const checkTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'staff', 'products', 'stores')
      LIMIT 1
    `);
    
    if (checkTables.rows.length === 0) {
      console.log('📦 Initializing fresh database...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute schema in a transaction for safety
      await pool.query('BEGIN');
      try {
        await pool.query(schema);
        await pool.query('COMMIT');
        console.log('✅ Database schema initialized successfully');
      } catch (schemaError) {
        await pool.query('ROLLBACK');
        console.error('❌ Error executing schema, rolling back:', schemaError.message);
        throw schemaError;
      }
    } else {
      console.log('✅ Database tables already exist, skipping schema initialization');
    }

    // Ensure product fields are optional (sku_code, model_number) - run on every startup
    try {
      await pool.query(`
        DO $$ 
        BEGIN
          -- Make sku_code optional (remove NOT NULL constraint if it exists)
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'products' 
            AND column_name = 'sku_code' 
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE products ALTER COLUMN sku_code DROP NOT NULL;
            RAISE NOTICE 'Made sku_code optional';
          END IF;
          
          -- Add model_number column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'products' 
            AND column_name = 'model_number'
          ) THEN
            ALTER TABLE products ADD COLUMN model_number VARCHAR(255);
            RAISE NOTICE 'Added model_number column to products table';
          END IF;
        END $$;
      `);
      console.log('✅ Product fields (sku_code, model_number) verified');
    } catch (migrationError) {
      console.warn('⚠️  Product fields migration warning:', migrationError.message);
      // Continue even if migration fails (column might already be in correct state)
    }

    // Ensure address fields are optional in customers and dispatch tables - run on every startup
    try {
      await pool.query(`
        DO $$ 
        BEGIN
          -- Make address fields optional in customers table (remove NOT NULL constraints if they exist)
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'customers' 
            AND column_name = 'address' 
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE customers ALTER COLUMN address DROP NOT NULL;
            RAISE NOTICE 'Made customers.address optional';
          END IF;
          
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'customers' 
            AND column_name = 'city' 
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE customers ALTER COLUMN city DROP NOT NULL;
            RAISE NOTICE 'Made customers.city optional';
          END IF;
          
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'customers' 
            AND column_name = 'state' 
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE customers ALTER COLUMN state DROP NOT NULL;
            RAISE NOTICE 'Made customers.state optional';
          END IF;
          
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'customers' 
            AND column_name = 'pincode' 
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE customers ALTER COLUMN pincode DROP NOT NULL;
            RAISE NOTICE 'Made customers.pincode optional';
          END IF;
          
          -- Make address fields optional in dispatch table (remove NOT NULL constraints if they exist)
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'dispatch' 
            AND column_name = 'address' 
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE dispatch ALTER COLUMN address DROP NOT NULL;
            RAISE NOTICE 'Made dispatch.address optional';
          END IF;
          
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'dispatch' 
            AND column_name = 'city' 
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE dispatch ALTER COLUMN city DROP NOT NULL;
            RAISE NOTICE 'Made dispatch.city optional';
          END IF;
          
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'dispatch' 
            AND column_name = 'state' 
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE dispatch ALTER COLUMN state DROP NOT NULL;
            RAISE NOTICE 'Made dispatch.state optional';
          END IF;
          
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'dispatch' 
            AND column_name = 'pincode' 
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE dispatch ALTER COLUMN pincode DROP NOT NULL;
            RAISE NOTICE 'Made dispatch.pincode optional';
          END IF;
        END $$;
      `);
      console.log('✅ Address fields (address, city, state, pincode) verified as optional');
    } catch (migrationError) {
      console.warn('⚠️  Address fields migration warning:', migrationError.message);
      // Continue even if migration fails (column might already be in correct state)
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Check if admin_profile table exists before querying
    const adminTableExists = await pool.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'admin_profile'
    `);
    
    if (adminTableExists.rows.length === 0) {
      console.log('⚠️  admin_profile table does not exist yet, skipping admin setup');
    } else {
      const checkAdmin = await pool.query(
        'SELECT id, password_hash FROM admin_profile WHERE LOWER(TRIM(email)) = LOWER($1)',
        ['admin@anithastores.com']
      );

      if (checkAdmin.rows.length === 0) {
        await pool.query(
          `INSERT INTO admin_profile (full_name, email, role, primary_store, store_scope, timezone, password_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT DO NOTHING`,
          ['Admin Root', 'admin@anithastores.com', 'Super Admin', 'Global', 'All stores • Global scope', 'IST (GMT+05:30)', hashedPassword]
        );
        console.log('✅ Default admin profile created');
      } else {
        const admin = checkAdmin.rows[0];
        if (!admin.password_hash) {
          await pool.query(
            `UPDATE admin_profile SET password_hash = $1 WHERE LOWER(TRIM(email)) = LOWER($2)`,
            [hashedPassword, 'admin@anithastores.com']
          );
          console.log('✅ Default admin password set');
        }
      }
    }

    const checkStores = await pool.query('SELECT id FROM stores LIMIT 1');
    if (checkStores.rows.length === 0) {
      await pool.query(
        `INSERT INTO stores (store_name, store_code, city, state, status)
         VALUES 
         ($1, $2, $3, $4, $5),
         ($6, $7, $8, $9, $10),
         ($11, $12, $13, $14, $15)
         ON CONFLICT DO NOTHING`,
        [
          'Mart', 'MART001', 'Hyderabad', 'Telangana', 'Active',
          'Mumbai DMart', 'MUMBAI001', 'Mumbai', 'Maharashtra', 'Active',
          'Global', 'GLOBAL001', 'Multiple', 'All', 'Active'
        ]
      );
      console.log('✅ Default stores created');
    }

    // Insert default role permissions
    const checkPermissions = await pool.query('SELECT id FROM role_permissions LIMIT 1');
    if (checkPermissions.rows.length === 0) {
      const defaultPermissions = {
        'Super Admin': {
          users: { view: true, create: true, update: true, delete: true },
          products: { view: true, create: true, update: true, delete: true },
          staff: { view: true, create: true, update: true, delete: true },
          stores: { view: true, create: true, update: true, delete: true },
          settings: { view: true, edit: true },
          profile: { view: true, edit: true }
        },
        'Supervisor': {
          users: { view: true, create: false, update: true, delete: false },
          products: { view: true, create: true, update: true, delete: false },
          staff: { view: true, create: true, update: true, delete: false },
          stores: { view: true, create: false, update: false, delete: false },
          settings: { view: false, edit: false },
          profile: { view: true, edit: true }
        },
        'Staff': {
          users: { view: true, create: false, update: false, delete: false },
          products: { view: true, create: false, update: false, delete: false },
          staff: { view: false, create: false, update: false, delete: false },
          stores: { view: true, create: false, update: false, delete: false },
          settings: { view: false, edit: false },
          profile: { view: true, edit: true }
        }
      };

      for (const [roleName, permissions] of Object.entries(defaultPermissions)) {
        await pool.query(
          `INSERT INTO role_permissions (role_name, permissions)
           VALUES ($1, $2)
           ON CONFLICT (role_name) DO NOTHING`,
          [roleName, JSON.stringify(permissions)]
        );
      }
      console.log('✅ Default role permissions created');
    }

    // Ensure only 2 chit plans exist: AAA (₹500) and BH (₹100)
    try {
      // Get all existing plans
      const existingPlans = await pool.query('SELECT id, plan_name, plan_amount FROM chit_plans');
      
      // Define the required plans
      const requiredPlans = [
        { name: 'AAA', amount: 500.00, desc: 'Chit plan of ₹500' },
        { name: 'BH', amount: 100.00, desc: 'Chit plan of ₹100' }
      ];
      
      // First, ensure AAA and BH plans exist with correct amounts (needed for reassignment)
      for (const plan of requiredPlans) {
        const existingPlan = existingPlans.rows.find(p => p.plan_name === plan.name);
        
        if (!existingPlan) {
          // Create the plan if it doesn't exist
          await pool.query(
            `INSERT INTO chit_plans (plan_name, plan_amount, description)
             VALUES ($1, $2, $3)
             ON CONFLICT (plan_name) DO NOTHING`,
            [plan.name, plan.amount, plan.desc]
          );
          console.log(`✅ Created chit plan: ${plan.name} (₹${plan.amount})`);
        } else if (parseFloat(existingPlan.plan_amount) !== plan.amount) {
          // Update the amount if it's incorrect
          await pool.query(
            `UPDATE chit_plans SET plan_amount = $1, description = $2 WHERE plan_name = $3`,
            [plan.amount, plan.desc, plan.name]
          );
          console.log(`✅ Updated chit plan: ${plan.name} to ₹${plan.amount}`);
        }
      }
      
      // Get AAA and BH plan IDs after ensuring they exist
      const finalPlans = await pool.query('SELECT id, plan_name FROM chit_plans WHERE plan_name IN ($1, $2)', ['AAA', 'BH']);
      const aaaPlan = finalPlans.rows.find(p => p.plan_name === 'AAA');
      const bhPlan = finalPlans.rows.find(p => p.plan_name === 'BH');
      const defaultPlanId = aaaPlan ? aaaPlan.id : (bhPlan ? bhPlan.id : null);
      
      // Delete all plans that are not AAA or BH
      const requiredNames = requiredPlans.map(p => p.name);
      const plansToDelete = existingPlans.rows.filter(p => !requiredNames.includes(p.plan_name));
      
      if (plansToDelete.length > 0) {
        for (const plan of plansToDelete) {
          try {
            // First, delete any chit_entries that reference this plan
            try {
              const entriesResult = await pool.query('DELETE FROM chit_entries WHERE chit_plan_id = $1', [plan.id]);
              if (entriesResult.rowCount > 0) {
                console.log(`🗑️  Deleted ${entriesResult.rowCount} chit entries for plan: ${plan.plan_name}`);
              }
            } catch (entryError) {
              // Table might not exist, continue
              if (entryError.code !== '42P01') {
                console.log(`ℹ️  Could not delete chit entries for plan: ${plan.plan_name}`);
              }
            }
            
            // Reassign customers to AAA plan (or set to NULL if no default plan available)
            try {
              if (defaultPlanId) {
                const customersResult = await pool.query(
                  'UPDATE chit_customers SET chit_plan_id = $1 WHERE chit_plan_id = $2',
                  [defaultPlanId, plan.id]
                );
                if (customersResult.rowCount > 0) {
                  console.log(`🔄 Reassigned ${customersResult.rowCount} customers from "${plan.plan_name}" to AAA`);
                }
              } else {
                // If no default plan, set to NULL
                const customersResult = await pool.query(
                  'UPDATE chit_customers SET chit_plan_id = NULL WHERE chit_plan_id = $1',
                  [plan.id]
                );
                if (customersResult.rowCount > 0) {
                  console.log(`🔄 Set chit_plan_id to NULL for ${customersResult.rowCount} customers from "${plan.plan_name}"`);
                }
              }
            } catch (customerError) {
              // Table might not exist, continue
              if (customerError.code !== '42P01') {
                console.log(`ℹ️  Could not update chit customers for plan: ${plan.plan_name}`);
              }
            }
            
            // Now delete the plan itself
            await pool.query('DELETE FROM chit_plans WHERE id = $1', [plan.id]);
            console.log(`🗑️  Deleted chit plan: ${plan.plan_name}`);
          } catch (deleteError) {
            console.warn(`⚠️  Could not delete chit plan "${plan.plan_name}": ${deleteError.message}`);
          }
        }
      }
      
      console.log('✅ Chit plans verified: AAA (₹500) and BH (₹100)');
    } catch (chitPlanError) {
      console.warn('⚠️  Chit plan initialization warning:', chitPlanError.message);
    }

    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = { initDatabase };

