const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const initDatabase = async () => {
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);
    console.log('✅ Database schema initialized successfully');

    // Insert default admin user (password: admin123)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const checkAdmin = await pool.query(
      'SELECT id FROM admin_profile WHERE email = $1',
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
      // Update password if not set
      const admin = checkAdmin.rows[0];
      if (!admin.password_hash) {
        await pool.query(
          `UPDATE admin_profile SET password_hash = $1 WHERE email = $2`,
          [hashedPassword, 'admin@anithastores.com']
        );
        console.log('✅ Default admin password set');
      }
    }

    // Insert default stores
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
        'Manager': {
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

    // Insert default chit plans
    const checkChitPlans = await pool.query('SELECT id FROM chit_plans LIMIT 1');
    if (checkChitPlans.rows.length === 0) {
      await pool.query(
        `INSERT INTO chit_plans (plan_name, plan_amount, description)
         VALUES 
         ($1, $2, $3),
         ($4, $5, $6),
         ($7, $8, $9)
         ON CONFLICT DO NOTHING`,
        [
          'Chit Plan 1', 1000.00, 'Monthly chit plan of ₹1000',
          'Chit Plan 2', 5000.00, 'Monthly chit plan of ₹5000',
          'Chit Plan 3', 10000.00, 'Monthly chit plan of ₹10000'
        ]
      );
      console.log('✅ Default chit plans created');
    }

    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = { initDatabase };

