const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });
const { testConnection } = require('./config/database');
const { initDatabase } = require('./database/init');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const staffRoutes = require('./routes/staff');
const productRoutes = require('./routes/products');
const profileRoutes = require('./routes/profile');
const storeRoutes = require('./routes/stores');
const permissionRoutes = require('./routes/permissions');
const exportRoutes = require('./routes/export');
const customerRoutes = require('./routes/customers');
const supplierRoutes = require('./routes/suppliers');
const chitPlanRoutes = require('./routes/chitPlans');
const dispatchRoutes = require('./routes/dispatch');
const transportRoutes = require('./routes/transport');
const attendanceRoutes = require('./routes/attendance');
const notificationRoutes = require('./routes/notifications');
const supervisorAttendanceRoutes = require('./routes/supervisorAttendance');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - Allow frontend and localhost in development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL, // Your Vercel frontend URL
    ].filter(Boolean);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, allow Vercel domains and specified frontend URL
    // Vercel apps can have multiple domains (*.vercel.app, custom domains)
    const isVercelDomain = origin.includes('.vercel.app') || 
                          origin.includes('vercel.app') ||
                          allowedOrigins.some(allowed => origin === allowed);
    
    if (isVercelDomain || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      console.warn(`⚠️  Allowed origins: ${allowedOrigins.join(', ')}`);
      // In production, be more permissive if FRONTEND_URL is not set
      if (!process.env.FRONTEND_URL) {
        console.warn('⚠️  FRONTEND_URL not set - allowing all origins');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/products', productRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/chit-plans', chitPlanRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/supervisor-attendance', supervisorAttendanceRoutes);

const startServer = async () => {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      await initDatabase();
      
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

