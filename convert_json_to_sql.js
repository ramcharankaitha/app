const fs = require('fs');
const path = require('path');

// Convert JSON backup to SQL INSERT statements
function convertJsonToSql(jsonFilePath, outputSqlPath) {
  try {
    console.log('📦 Reading JSON backup file...');
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    if (!jsonData.success || !jsonData.data) {
      throw new Error('Invalid backup file format');
    }
    
    const backup = jsonData.data;
    let sql = `-- Complete Database Backup\n`;
    sql += `-- Export Date: ${backup.exportDate || new Date().toISOString()}\n`;
    sql += `-- Total Records: ${backup.totalRecords || 'Unknown'}\n\n`;
    sql += `-- This file was generated from JSON backup\n`;
    sql += `-- Import this file to restore all data\n\n`;
    
    // Disable foreign key checks temporarily (PostgreSQL doesn't support this, but we'll handle order)
    sql += `-- Note: Import tables in order to respect foreign key constraints\n\n`;
    
    // Define table import order (base tables first, then dependent tables)
    const tableOrder = [
      'stores',
      'role_permissions',
      'admin_profile',
      'users',
      'staff',
      'categories',
      'suppliers',
      'products',
      'customers',
      'chit_plans',
      'chit_customers',
      'chit_entries',
      'services',
      'stock_transactions',
      'sales_records',
      'purchase_orders',
      'payments',
      'quotations',
      'dispatch',
      'transport',
      'attendance',
      'supervisor_attendance',
      'notifications'
    ];
    
    // Convert each table to SQL INSERT statements
    for (const tableName of tableOrder) {
      const records = backup.tables?.[tableName] || [];
      
      if (records.length === 0) {
        console.log(`⚠️  Table ${tableName}: No records (skipping)`);
        continue;
      }
      
      console.log(`📤 Converting ${tableName}: ${records.length} records...`);
      
      sql += `\n-- ========================================\n`;
      sql += `-- Table: ${tableName}\n`;
      sql += `-- Records: ${records.length}\n`;
      sql += `-- ========================================\n\n`;
      
      // Get column names from first record
      const columns = Object.keys(records[0]);
      
      // Generate INSERT statements
      for (const record of records) {
        const values = columns.map(col => {
          const value = record[col];
          
          if (value === null || value === undefined) {
            return 'NULL';
          }
          
          if (typeof value === 'boolean') {
            return value ? 'TRUE' : 'FALSE';
          }
          
          if (typeof value === 'number') {
            return value.toString();
          }
          
          if (typeof value === 'object') {
            // Handle JSON/JSONB columns
            const jsonStr = JSON.stringify(value).replace(/'/g, "''");
            return `'${jsonStr}'::jsonb`;
          }
          
          // String - escape single quotes
          const escaped = String(value).replace(/'/g, "''").replace(/\\/g, '\\\\');
          return `'${escaped}'`;
        });
        
        sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      }
      
      sql += '\n';
    }
    
    // Write SQL file
    fs.writeFileSync(outputSqlPath, sql);
    console.log(`\n✅ SQL file created: ${outputSqlPath}`);
    console.log(`📊 Summary:`);
    
    if (backup.summary) {
      for (const [table, count] of Object.entries(backup.summary)) {
        if (count > 0) {
          console.log(`   ${table}: ${count} records`);
        }
      }
    }
    
    console.log(`\n✅ Conversion complete!`);
    console.log(`\n📥 To import, run:`);
    console.log(`   psql "your-connection-string" < ${outputSqlPath}`);
    
  } catch (error) {
    console.error('❌ Error converting JSON to SQL:', error.message);
    if (error.code === 'ENOENT') {
      console.error(`   File not found: ${jsonFilePath}`);
      console.error(`   Make sure you've exported the backup first!`);
    }
    process.exit(1);
  }
}

// Main execution
const jsonFile = process.argv[2] || 'complete_backup.json';
const sqlFile = process.argv[3] || 'complete_backup.sql';

if (!fs.existsSync(jsonFile)) {
  console.error(`❌ Error: File not found: ${jsonFile}`);
  console.error(`\nUsage:`);
  console.error(`   node convert_json_to_sql.js [input.json] [output.sql]`);
  console.error(`\nExample:`);
  console.error(`   node convert_json_to_sql.js complete_backup.json complete_backup.sql`);
  process.exit(1);
}

convertJsonToSql(jsonFile, sqlFile);

