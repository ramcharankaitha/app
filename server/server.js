const express = require('express');
const cors = require('cors');
const path = require('path');

// Load .env file from server directory
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { testConnection } = require('./config/database');
const { initDatabase } = require('./database/init');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const staffRoutes = require('./routes/staff');
const productRoutes = require('./routes/products');
const profileRoutes = require('./routes/profile');
const storeRoutes = require('./routes/stores');
const permissionRoutes = require('./routes/permissions');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/products', productRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/export', exportRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    const isConnected = await testConnection();
    
    if (isConnected) {
      // Initialize database schema
      await initDatabase();
      
      // Start server
      app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
      });
    } else {
      console.error('❌ Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

