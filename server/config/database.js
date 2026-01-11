const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let pool;

// Use DATABASE_URL if available (production - Railway/Heroku/Render style), otherwise use individual configs
if (process.env.DATABASE_URL) {
  // Production - Connection string format
  // Parse DATABASE_URL to extract connection details
  let connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 12, // Optimized for Railway Free tier (supports 10-20 concurrent users)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000, // Increased timeout for Railway (30 seconds)
    allowExitOnIdle: true,
    // Add keepalive to prevent connection drops
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };

  // Determine SSL requirement based on environment
  // Most cloud PostgreSQL providers require SSL
  const isRender = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com');
  const isRailway = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway.app');
  const isHeroku = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('herokuapp.com');
  const isSupabase = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.co');
  
  if (isRender || isRailway || isHeroku || isSupabase || process.env.NODE_ENV === 'production') {
    connectionConfig.ssl = {
      rejectUnauthorized: false
    };
    console.log('✅ Using SSL connection for production database');
  }

  pool = new Pool(connectionConfig);
  console.log('✅ Using DATABASE_URL for connection (Production mode)');
  if (isRender) {
    console.log('✅ Detected Render database - SSL enabled');
  } else if (isSupabase) {
    console.log('✅ Detected Supabase database - SSL enabled');
  } else if (isRailway) {
    console.log('✅ Detected Railway database - SSL enabled');
  } else if (isHeroku) {
    console.log('✅ Detected Heroku database - SSL enabled');
  }
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
    connectionTimeoutMillis: 10000, // Increased timeout
    allowExitOnIdle: true,
  };

  // Add SSL for development if explicitly requested
  if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = {
      rejectUnauthorized: false
    };
  }

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
  // Don't exit on error - let the application handle it gracefully
  // process.exit(-1);
});

// Monitor pool statistics
setInterval(() => {
  const poolStats = {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
  // Warn if using more than 80% of pool capacity
  const poolCapacity = process.env.DATABASE_URL ? 12 : 20; // Production: 12 (Railway Free), Development: 20
  if (poolStats.totalCount > poolCapacity * 0.8) {
    console.warn('⚠️  High database connection usage:', poolStats, `(Max: ${poolCapacity})`);
  }
}, 60000); // Log every minute

const testConnection = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Testing database connection (attempt ${attempt}/${retries})...`);
      const result = await pool.query('SELECT NOW()');
      console.log('✅ Database connection test successful:', result.rows[0].now);
      
      // Test if we can query a table (check if database is initialized)
      try {
        await pool.query('SELECT 1 FROM information_schema.tables LIMIT 1');
        console.log('✅ Database schema is accessible');
      } catch (schemaError) {
        console.warn('⚠️  Database connected but schema may not be initialized');
        console.warn('⚠️  This is normal on first deployment - tables will be created automatically');
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Database connection test failed (attempt ${attempt}/${retries}):`, error.message);
      
      // Provide specific error messages
      if (error.message.includes('password must be a string')) {
        console.error('\n💡 Solution: Make sure DB_PASSWORD is set in server/.env file');
        console.error('   Example: DB_PASSWORD=your_postgres_password');
        console.error('   For Render: DATABASE_URL should be automatically set by Render');
      } else if (error.message.includes('password authentication failed')) {
        console.error('\n💡 Solution: Check if DB_PASSWORD in server/.env matches your PostgreSQL password');
        console.error('   For Render: Verify DATABASE_URL is correct in Render dashboard');
      } else if (error.message.includes('does not exist')) {
        console.error('\n💡 Solution: Create the database: CREATE DATABASE anitha_stores;');
        console.error('   For Render: Database should be created automatically');
      } else if (error.message.includes('ECONNREFUSED') || error.code === 'ECONNREFUSED') {
        console.error('\n💡 Solution: Make sure PostgreSQL service is running');
        console.error('   For Render: Check if database service is active in Render dashboard');
      } else if (error.message.includes('timeout') || error.code === 'ETIMEDOUT' || error.message.includes('Connection terminated due to connection timeout')) {
        console.error('\n💡 Solution: Connection timeout - database may be slow to respond');
        console.error('   For Railway: Database may be paused (free tier) or slow to respond');
        console.error('   - Check Railway dashboard: Is database service active?');
        console.error('   - Free tier databases pause after inactivity - may need to wake up');
        console.error('   - Retrying with longer delays...');
      } else if (error.message.includes('SSL') || error.code === '23505') {
        console.error('\n💡 Solution: SSL connection issue');
        console.error('   For Render: SSL should be enabled automatically');
      }
      
      // If not the last attempt, wait before retrying
      if (attempt < retries) {
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 10000); // Exponential backoff, max 10s
      } else {
        console.error('\n❌ All connection attempts failed. Please check:');
        console.error('   1. Database service is running (Render dashboard)');
        console.error('   2. DATABASE_URL is set correctly (Render environment variables)');
        console.error('   3. Database is accessible from your deployment');
        if (process.env.DATABASE_URL) {
          const url = new URL(process.env.DATABASE_URL);
          console.error(`   4. Current DATABASE_URL host: ${url.hostname}`);
        }
      }
    }
  }
  
  return false;
};

module.exports = {
  pool,
  testConnection
};

