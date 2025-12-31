# 🔐 Credentials Guide

## 📋 Table of Contents
1. [Application Login Credentials](#application-login-credentials)
2. [Vercel Environment Variables](#vercel-environment-variables)
3. [Backend Environment Variables](#backend-environment-variables)
4. [Database Credentials](#database-credentials)

---

## 🔑 Application Login Credentials

### Default Admin Login
**Email:** `admin@anithastores.com`  
**Password:** `admin123`  
**Role:** `admin` (Super Admin)

**⚠️ Important:** Change this password after first login for security!

---

## 🌐 Vercel Environment Variables

### Required for Frontend (Vercel Dashboard)

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

#### 1. `REACT_APP_API_URL`
- **What it is:** Your backend API URL
- **Format:** `https://your-backend-url.com/api`
- **Examples:**
  - If backend on Railway: `https://your-app.railway.app/api`
  - If backend on Heroku: `https://your-app.herokuapp.com/api`
  - If backend on Hostinger: `https://yourdomain.com/api`
  - If backend on custom domain: `https://api.yourdomain.com/api`
- **Environment:** Select all (Production, Preview, Development)
- **⚠️ Must use `https://` (not `http://`)**
- **⚠️ Must include `/api` at the end**
- **⚠️ No trailing slash after `/api`**

---

## 🖥️ Backend Environment Variables

### Required for Backend (Server `.env` file)

Location: `server/.env`

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE

# Server Configuration
PORT=5000
NODE_ENV=production

# Security
JWT_SECRET=YOUR_SECRET_KEY_32_CHARS_MINIMUM_HERE

# Frontend URL (for CORS)
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### How to Get Each Value:

#### `DB_PASSWORD`
- **What it is:** Your PostgreSQL database password
- **Where to find:**
  - If using local PostgreSQL: The password you set during installation
  - If using Hostinger: Database Manager → PostgreSQL → Your database → Password
  - If using Railway: Railway Dashboard → Database → Connection String → Password
  - If using Heroku: Heroku Dashboard → Database → Credentials → Password

#### `JWT_SECRET`
- **What it is:** A random secret key for encrypting JWT tokens
- **How to generate:**
  ```bash
  # Option 1: Use Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  
  # Option 2: Use online generator
  # Visit: https://randomkeygen.com/
  # Use: "CodeIgniter Encryption Keys" (256-bit)
  
  # Option 3: Use OpenSSL
  openssl rand -hex 32
  ```
- **⚠️ Must be at least 32 characters**
- **⚠️ Keep it secret - never share or commit to Git**

#### `FRONTEND_URL`
- **What it is:** Your Vercel frontend URL
- **Format:** `https://your-project.vercel.app`
- **Examples:**
  - `https://app-one-theta-14.vercel.app`
  - `https://anitha-stores.vercel.app`
  - `https://yourdomain.com` (if using custom domain)

---

## 🗄️ Database Credentials

### PostgreSQL Database

**Default Database Name:** `anitha_stores`  
**Default User:** `postgres`  
**Default Port:** `5432`  
**Default Host:** `localhost` (for local) or your database host (for cloud)

### How to Find Database Credentials:

#### On Hostinger:
1. Login to hPanel
2. Go to **"Databases"** → **"PostgreSQL Databases"**
3. Find your database
4. Click **"Manage"** or **"Details"**
5. You'll see:
   - Database Name
   - Username
   - Password (click "Show" to reveal)
   - Host (usually `localhost` or provided hostname)
   - Port (usually `5432`)

#### On Railway:
1. Go to Railway Dashboard
2. Click your PostgreSQL service
3. Go to **"Variables"** tab
4. You'll see connection details:
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

#### On Heroku:
1. Go to Heroku Dashboard
2. Click your app
3. Go to **"Settings"** → **"Config Vars"**
4. Or use **"Resources"** → **"Heroku Postgres"** → **"Settings"** → **"View Credentials"**

#### On Local PostgreSQL:
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `anitha_stores` (create it if doesn't exist)
- **User:** `postgres` (or your PostgreSQL username)
- **Password:** The password you set during PostgreSQL installation

---

## 📝 Quick Setup Checklist

### For Vercel Deployment:

- [ ] Added `REACT_APP_API_URL` in Vercel environment variables
- [ ] Value is `https://your-backend-url.com/api`
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed after adding variable

### For Backend Setup:

- [ ] Created `server/.env` file
- [ ] Set `DB_PASSWORD` (your PostgreSQL password)
- [ ] Set `JWT_SECRET` (32+ character random string)
- [ ] Set `FRONTEND_URL` (your Vercel URL)
- [ ] Backend is running and accessible

### For Database Setup:

- [ ] PostgreSQL is installed/running
- [ ] Database `anitha_stores` exists
- [ ] User has access to database
- [ ] Can connect with credentials

---

## 🔍 How to Verify Credentials

### Test Database Connection:
```bash
# From server directory
cd server
node -e "require('dotenv').config(); const { pool } = require('./config/database'); pool.query('SELECT NOW()').then(() => console.log('✅ Database connected')).catch(err => console.error('❌ Error:', err.message));"
```

### Test Backend API:
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Should return: {"status":"OK","message":"Server is running"}
```

### Test Frontend API URL:
```bash
# In browser console (F12)
console.log(process.env.REACT_APP_API_URL)

# Should show your backend URL
```

---

## 🆘 Common Issues

### Issue: "REACT_APP_API_URL is not set"
**Solution:** Add it in Vercel Dashboard → Settings → Environment Variables

### Issue: "Database connection failed"
**Solution:** 
- Check `DB_PASSWORD` is correct
- Check database exists
- Check PostgreSQL is running
- Check host/port are correct

### Issue: "CORS error"
**Solution:**
- Check `FRONTEND_URL` in backend `.env` matches your Vercel URL
- Check backend allows your Vercel domain

### Issue: "Invalid credentials" on login
**Solution:**
- Use: `admin@anithastores.com` / `admin123`
- Check backend is running
- Check database is initialized

---

## 🔒 Security Best Practices

1. **Never commit `.env` files to Git**
   - Already in `.gitignore` ✅

2. **Change default admin password**
   - Login with `admin@anithastores.com` / `admin123`
   - Go to Profile → Change Password

3. **Use strong JWT_SECRET**
   - At least 32 characters
   - Random and unique
   - Don't reuse passwords

4. **Use HTTPS in production**
   - Always use `https://` for API URLs
   - Never use `http://` in production

5. **Keep credentials secret**
   - Don't share in chat/email
   - Use environment variables
   - Rotate secrets periodically

---

## 📞 Need Help?

If you're missing any credentials:

1. **Database Password:** Check your hosting provider's database manager
2. **JWT_SECRET:** Generate a new one (see instructions above)
3. **Backend URL:** Check where your backend is hosted
4. **Vercel URL:** Check Vercel Dashboard → Your Project → Domains

---

**🎉 Once all credentials are set correctly, your app should work!**

