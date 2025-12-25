const { Pool } = require('pg');
require('dotenv').config();

// First, connect to the default 'postgres' database to create our database
const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: 'postgres', // Connect to default postgres database
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function setupDatabase() {
  const dbName = process.env.DB_NAME || 'anitha_stores';
  
  try {
    console.log('🔍 Checking PostgreSQL connection...');
    
    // Test connection to postgres database
    await adminPool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL server');
    
    // Check if database exists
    const dbCheck = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    
    if (dbCheck.rows.length > 0) {
      console.log(`✅ Database '${dbName}' already exists`);
    } else {
      console.log(`📦 Creating database '${dbName}'...`);
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully`);
    }
    
    // Now connect to the actual database and initialize schema
    const appPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });
    
    console.log(`🔍 Connecting to '${dbName}' database...`);
    await appPool.query('SELECT NOW()');
    console.log(`✅ Connected to '${dbName}' database`);
    
    // Check if tables exist
    const tableCheck = await appPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 1
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Database tables already exist');
      console.log('💡 To reinitialize, drop the database and run this script again');
    } else {
      console.log('📋 Database is empty - ready for schema initialization');
      console.log('💡 Run the server (npm start) to initialize the schema automatically');
    }
    
    await appPool.end();
    await adminPool.end();
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('💡 Next step: Run "npm start" to initialize the schema');
    
  } catch (error) {
    console.error('\n❌ Error setting up database:');
    console.error(error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Solution: Check your DB_PASSWORD in server/.env file');
      console.error('   Make sure it matches your PostgreSQL password');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.error('\n💡 Solution: Make sure PostgreSQL service is running');
      console.error('   On Windows: Open Services and start "postgresql-x64-XX" service');
      console.error('   Or use: net start postgresql-x64-XX (replace XX with version)');
    } else if (error.message.includes('does not exist')) {
      console.error('\n💡 Solution: Check your DB_USER in server/.env file');
      console.error('   Default user is usually "postgres"');
    }
    
    process.exit(1);
  }
}

setupDatabase();

