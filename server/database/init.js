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

    // Insert default chit plans (1, 2, 3, 4, 5)
    const checkChitPlans = await pool.query('SELECT COUNT(*) as count FROM chit_plans');
    const planCount = parseInt(checkChitPlans.rows[0]?.count || 0);
    
    if (planCount < 5) {
      // Check which plans exist
      const existingPlans = await pool.query('SELECT plan_name FROM chit_plans');
      const existingNames = existingPlans.rows.map(p => p.plan_name);
      
      const defaultPlans = [
        { name: 'Chit Plan 1', amount: 1000.00, desc: 'Chit plan of ₹1000' },
        { name: 'Chit Plan 2', amount: 2000.00, desc: 'Chit plan of ₹2000' },
        { name: 'Chit Plan 3', amount: 3000.00, desc: 'Chit plan of ₹3000' },
        { name: 'Chit Plan 4', amount: 4000.00, desc: 'Chit plan of ₹4000' },
        { name: 'Chit Plan 5', amount: 5000.00, desc: 'Chit plan of ₹5000' }
      ];
      
      for (const plan of defaultPlans) {
        if (!existingNames.includes(plan.name)) {
          await pool.query(
            `INSERT INTO chit_plans (plan_name, plan_amount, description)
             VALUES ($1, $2, $3)
             ON CONFLICT (plan_name) DO NOTHING`,
            [plan.name, plan.amount, plan.desc]
          );
        }
      }
      console.log('✅ Default chit plans (1-5) created');
    }

    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = { initDatabase };

