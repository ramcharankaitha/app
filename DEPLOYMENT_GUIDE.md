# 🚀 Deployment Guide - Backend & Database

This guide will help you deploy your backend API and database to production.

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Railway Account** (for database) - Already set up
3. **Render/Railway Account** (for backend) - Choose one:
   - **Render** (Recommended - Free tier available)
   - **Railway** (Also good, pay-as-you-go)
   - **Heroku** (Paid plans only)

---

## 🗄️ Step 1: Database Setup (Railway - Already Done)

Your database is already on Railway. You have:
- **Database URL**: `postgresql://postgres:bJFCmXuzhGDhhbajJnJhtkzJLXzEpUYx@shinkansen.proxy.rlwy.net:32058/railway`

**Note**: Keep this URL secure and never commit it to Git!

---

## 🖥️ Step 2: Deploy Backend to Render (Recommended)

### Option A: Render (Free Tier Available)

1. **Sign up/Login to Render**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your backend

3. **Configure the Service**
   - **Name**: `anitha-stores-backend` (or any name)
   - **Region**: Choose closest to your users (e.g., Singapore for India)
   - **Branch**: `main` or `master`
   - **Root Directory**: `server` (if your backend is in server folder)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Environment Variables**
   Add these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://postgres:bJFCmXuzhGDhhbajJnJhtkzJLXzEpUYx@shinkansen.proxy.rlwy.net:32058/railway
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your backend
   - Wait for deployment to complete (5-10 minutes)

6. **Get Your Backend URL**
   - After deployment, you'll get a URL like: `https://anitha-stores-backend.onrender.com`
   - This is your **BACKEND API URL**

---

### Option B: Railway (Alternative)

1. **Sign up/Login to Railway**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service**
   - Railway will auto-detect Node.js
   - Set **Root Directory** to `server` if needed
   - Set **Start Command** to `npm start`

4. **Environment Variables**
   Add in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://postgres:bJFCmXuzhGDhhbajJnJhtkzJLXzEpUYx@shinkansen.proxy.rlwy.net:32058/railway
   ```

5. **Deploy**
   - Railway will automatically deploy
   - Get your backend URL from the service dashboard

---

## ⚙️ Step 3: Update Database Configuration

Update `server/config/database.js` to support both local and production:

```javascript
const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let pool;

// Use DATABASE_URL if available (production), otherwise use individual configs
if (process.env.DATABASE_URL) {
  // Production - Railway/Heroku style connection string
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
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

  pool = new Pool(dbConfig);
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
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};
```

---

## 🔒 Step 4: Update CORS Configuration

Update `server/server.js` to allow your frontend domain:

```javascript
const cors = require('cors');

// CORS configuration
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
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
```

**In Render/Railway, add environment variable:**
```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## 🌐 Step 5: Update Frontend (Vercel)

1. **Go to Vercel Dashboard**
   - Open your project settings
   - Go to "Environment Variables"

2. **Add/Update Environment Variable**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```
   Replace `your-backend-url.onrender.com` with your actual Render/Railway backend URL

3. **Redeploy Frontend**
   - Vercel will automatically redeploy when you save the environment variable
   - Or trigger a manual redeploy

---

## ✅ Step 6: Test Your Deployment

1. **Test Backend Health**
   ```
   https://your-backend-url.onrender.com/api/health
   ```
   Should return: `{"status":"OK","message":"Server is running"}`

2. **Test Database Connection**
   - Check backend logs in Render/Railway dashboard
   - Should see: `✅ Connected to PostgreSQL database`

3. **Test Frontend**
   - Open your Vercel app
   - Try logging in
   - Check browser console for any API errors

---

## 🔧 Troubleshooting

### Issue: Backend can't connect to database
**Solution:**
- Verify `DATABASE_URL` is correctly set in Render/Railway
- Check Railway database is running
- Ensure SSL is enabled in connection (already done in config)

### Issue: CORS errors in frontend
**Solution:**
- Add your Vercel URL to `FRONTEND_URL` environment variable
- Update CORS configuration in `server/server.js`

### Issue: Environment variables not working
**Solution:**
- Make sure variables are set in Render/Railway dashboard (not just `.env` file)
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)

### Issue: Build fails
**Solution:**
- Check build logs in Render/Railway
- Ensure `package.json` has correct `start` script
- Verify all dependencies are listed in `package.json`

---

## 📝 Quick Checklist

- [ ] Database is running on Railway
- [ ] Backend deployed to Render/Railway
- [ ] `DATABASE_URL` environment variable set
- [ ] `NODE_ENV=production` set
- [ ] `FRONTEND_URL` set in backend
- [ ] `REACT_APP_API_URL` set in Vercel frontend
- [ ] Backend health check returns OK
- [ ] Frontend can connect to backend
- [ ] Login works from frontend

---

## 🔐 Security Notes

1. **Never commit `.env` files** to Git
2. **Rotate database password** if accidentally committed
3. **Use HTTPS** for all production URLs
4. **Keep DATABASE_URL secret** - only set in hosting platform
5. **Enable CORS** only for your frontend domain

---

## 📞 Support

If you encounter issues:
1. Check backend logs in Render/Railway dashboard
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Test backend API directly using Postman/curl

---

**Your Backend URL Format:**
- Render: `https://your-app-name.onrender.com`
- Railway: `https://your-app-name.up.railway.app`

**Your API Endpoints:**
- Health: `https://your-backend-url/api/health`
- Auth: `https://your-backend-url/api/auth/login`
- All other routes follow: `https://your-backend-url/api/{route}`

