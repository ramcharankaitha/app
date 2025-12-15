const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let pool;

// Use DATABASE_URL if available (production - Railway/Heroku style), otherwise use individual configs
if (process.env.DATABASE_URL) {
  // Production - Connection string format
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  console.log('✅ Using DATABASE_URL for connection (Production mode)');
} else {
  // Development - Individual config values
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'anitha_stores',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  if (!process.env.DB_PASSWORD) {
    console.warn('⚠️  WARNING: DB_PASSWORD is not set in .env file');
    console.warn('⚠️  Please create server/.env file with your PostgreSQL password');
    console.warn('⚠️  See server/.env.example for template');
  }

  pool = new Pool(dbConfig);
  console.log('✅ Using individual DB config (Development mode)');
}

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection test successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    
    if (error.message.includes('password must be a string')) {
      console.error('\n💡 Solution: Make sure DB_PASSWORD is set in server/.env file');
      console.error('   Example: DB_PASSWORD=your_postgres_password');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Solution: Check if DB_PASSWORD in server/.env matches your PostgreSQL password');
    } else if (error.message.includes('does not exist')) {
      console.error('\n💡 Solution: Create the database: CREATE DATABASE anitha_stores;');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Solution: Make sure PostgreSQL service is running');
    }
    
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};

