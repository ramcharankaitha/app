require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment configuration...\n');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('📝 Creating .env file from template...\n');
  
  // Create .env from example if it exists
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created from .env.example');
    console.log('⚠️  Please update DB_PASSWORD with your PostgreSQL password!\n');
  } else {
    // Create basic .env file
    const defaultEnv = `# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here
`;
    fs.writeFileSync(envPath, defaultEnv);
    console.log('✅ .env file created with default values');
    console.log('⚠️  Please update DB_PASSWORD with your PostgreSQL password!\n');
  }
} else {
  console.log('✅ .env file exists');
}

// Check environment variables
console.log('📋 Environment Variables:');
console.log('─'.repeat(50));

const requiredVars = {
  'DB_HOST': process.env.DB_HOST,
  'DB_PORT': process.env.DB_PORT,
  'DB_NAME': process.env.DB_NAME,
  'DB_USER': process.env.DB_USER,
  'DB_PASSWORD': process.env.DB_PASSWORD ? '***' : 'NOT SET',
  'PORT': process.env.PORT,
  'JWT_SECRET': process.env.JWT_SECRET ? '***' : 'NOT SET'
};

let hasIssues = false;

for (const [key, value] of Object.entries(requiredVars)) {
  const status = value === undefined || value === 'NOT SET' ? '❌' : '✅';
  if (value === undefined || value === 'NOT SET') {
    hasIssues = true;
  }
  console.log(`${status} ${key}: ${value || 'NOT SET'}`);
}

console.log('─'.repeat(50));

if (hasIssues) {
  console.log('\n⚠️  Issues found:');
  if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === 'your_postgres_password_here') {
    console.log('   - DB_PASSWORD is not set or still has placeholder value');
    console.log('   - Please set your actual PostgreSQL password in server/.env');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret_key_here') {
    console.log('   - JWT_SECRET is not set (optional for development)');
  }
  console.log('\n💡 To fix: Edit server/.env and set the correct values');
} else {
  console.log('\n✅ All required environment variables are set!');
}

console.log('');

