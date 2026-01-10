const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Export Railway Database Using Node.js (No pg_dump needed!)
// Usage: node export_with_node.js "postgresql://user:pass@host:port/database"

const connectionString = process.argv[2];

if (!connectionString) {
  console.error('❌ Error: Please provide connection string');
  console.error('');
  console.error('Usage:');
  console.error('  node export_with_node.js "postgresql://user:pass@host:port/database"');
  console.error('');
  console.error('Example:');
  console.error('  node export_with_node.js "postgresql://postgres:password@centerbeam.proxy.rlwy.net:13307/railway"');
  process.exit(1);
}

const pool = new Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function exportAllTables() {
  console.log('📦 Starting database export using Node.js...');
  console.log('');
  
  // Test connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful!');
  } catch (error) {
    console.error('❌ Cannot connect to database:', error.message);
    process.exit(1);
  }
  
  const tables = [
    'users',
    'staff',
    'products',
    'customers',
    'suppliers',
    'stores',
    'services',
    'stock_transactions',
    'sales_records',
    'purchase_orders',
    'payments',
    'quotations',
    'chit_plans',
    'chit_customers',
    'chit_entries',
    'admin_profile',
    'role_permissions',
    'dispatch',
    'transport',
    'attendance',
    'supervisor_attendance',
    'notifications',
    'categories'
  ];

  const backup = {
    exportDate: new Date().toISOString(),
    connectionString: connectionString.replace(/:[^@]+@/, ':****@'), // Hide password
    tables: {},
    summary: {}
  };

  console.log('📤 Exporting tables...');
  console.log('');

  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT * FROM ${table} ORDER BY id`);
      backup.tables[table] = result.rows;
      backup.summary[table] = result.rows.length;
      console.log(`✅ ${table.padEnd(25)} ${result.rows.length.toString().padStart(5)} records`);
    } catch (error) {
      if (error.code === '42P01') {
        console.log(`⚠️  ${table.padEnd(25)} Table does not exist`);
        backup.tables[table] = [];
        backup.summary[table] = 0;
      } else {
        console.error(`❌ ${table.padEnd(25)} Error: ${error.message}`);
        backup.tables[table] = [];
        backup.summary[table] = 0;
      }
    }
  }

  // Calculate total
  backup.totalRecords = Object.values(backup.summary).reduce((sum, count) => sum + count, 0);

  // Save JSON backup
  const jsonFile = 'railway_backup.json';
  fs.writeFileSync(jsonFile, JSON.stringify(backup, null, 2));
  
  console.log('');
  console.log('✅ Export completed!');
  console.log(`📁 JSON backup saved: ${jsonFile}`);
  console.log(`📊 Total records: ${backup.totalRecords}`);
  console.log('');
  console.log('📥 Next steps:');
  console.log('   1. Convert JSON to SQL: node convert_json_to_sql.js railway_backup.json backup.sql');
  console.log('   2. Import to new database: psql "new-connection" < backup.sql');
  
  await pool.end();
}

exportAllTables().catch(error => {
  console.error('❌ Export failed:', error.message);
  process.exit(1);
});

