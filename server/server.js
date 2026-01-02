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
const stockRoutes = require('./routes/stock');
const categoryRoutes = require('./routes/categories');
const serviceRoutes = require('./routes/services');
const salesOrdersRoutes = require('./routes/salesOrders');
const purchaseOrdersRoutes = require('./routes/purchaseOrders');
const smsRoutes = require('./routes/sms');
const quotationsRoutes = require('./routes/quotations');
const paymentsRoutes = require('./routes/payments');

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
      process.env.FRONTEND_URL, // Your frontend URL (Vercel/Hostinger)
      // Support multiple frontend URLs (comma-separated)
      ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : []),
    ].filter(Boolean);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Normalize origin for comparison (remove trailing slash, handle www)
    const normalizeUrl = (url) => {
      if (!url) return '';
      return url.replace(/\/$/, '').toLowerCase();
    };
    
    const normalizedOrigin = normalizeUrl(origin);
    
    // Check if origin matches any allowed origin (exact match or www variant)
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = normalizeUrl(allowed);
      return normalizedOrigin === normalizedAllowed ||
             normalizedOrigin === normalizedAllowed.replace(/^https?:\/\/(www\.)?/, 'https://') ||
             normalizedOrigin === normalizedAllowed.replace(/^https?:\/\//, 'https://www.');
    });
    
    // In production, allow Vercel domains and specified frontend URLs
    // Vercel apps can have multiple domains (*.vercel.app, custom domains)
    const isVercelDomain = origin.includes('.vercel.app') || 
                          origin.includes('vercel.app');
    
    if (isVercelDomain || isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      console.warn(`⚠️  Allowed origins: ${allowedOrigins.join(', ')}`);
      // In production, be more permissive if FRONTEND_URL is not set
      if (!process.env.FRONTEND_URL && !process.env.FRONTEND_URLS) {
        console.warn('⚠️  FRONTEND_URL not set - allowing all origins');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
};

// Security Headers Middleware
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Strict Transport Security (HSTS) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  // Content Security Policy - secure and optimized
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https: blob:; font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
  );
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.use(cors(corsOptions));
// Increase JSON body size limit to handle large base64 image data (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
app.use('/api/stock', stockRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/sales-orders', salesOrdersRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/payments', paymentsRoutes);

// Schedule daily check for upcoming payments
const schedulePaymentNotifications = () => {
  const checkUpcomingPayments = async () => {
    try {
      const { pool } = require('./config/database');
      const { createNotificationForUserType } = require('./services/notificationService');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Find payments due tomorrow
      const result = await pool.query(
        `SELECT * FROM payments 
         WHERE date_to_be_paid = $1 
         AND id NOT IN (
           SELECT DISTINCT related_id 
           FROM notifications 
           WHERE notification_type = 'warning' 
           AND title LIKE '%Payment Due%'
           AND created_at::date = CURRENT_DATE
         )`,
        [tomorrowStr]
      );

      let notificationCount = 0;

      for (const payment of result.rows) {
        try {
          // Send notification to admin
          await createNotificationForUserType(
            'admin',
            'warning',
            'Payment Due Tomorrow',
            `Payment of ₹${parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} for ${payment.supplier_name} is due tomorrow. Please make sure to pay the bill.`,
            true,
            payment.id
          );

          // Send notification to supervisor
          await createNotificationForUserType(
            'supervisor',
            'warning',
            'Payment Due Tomorrow',
            `Payment of ₹${parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} for ${payment.supplier_name} is due tomorrow. Please make sure to pay the bill.`,
            true,
            payment.id
          );

          notificationCount++;
        } catch (err) {
          console.error(`❌ Error creating notification for payment ${payment.id}:`, err);
        }
      }

      console.log(`✅ Payment notification check completed: Sent ${notificationCount} notification(s)`);
    } catch (error) {
      console.error('❌ Error checking upcoming payments:', error.message);
    }
  };

  // Run immediately on server start
  checkUpcomingPayments();

  // Then run daily at 9 AM
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  
  const msUntilTomorrow = tomorrow.getTime() - now.getTime();
  
  setTimeout(() => {
    checkUpcomingPayments();
    // Run every 24 hours
    setInterval(checkUpcomingPayments, 24 * 60 * 60 * 1000);
  }, msUntilTomorrow);

  console.log('📅 Payment notification scheduler initialized');
};

const startServer = async () => {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      await initDatabase();
      
      app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
        
        // Start payment notification scheduler
        schedulePaymentNotifications();
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

