# Complete Setup: UI + Backend on Hostinger

## 🎯 Overview

Your application has **two parts**:
1. **Frontend (UI)** - React app that users see in browser
2. **Backend (API)** - Node.js server that handles database and logic

Both need to be configured and running for your app to work.

---

## 📋 Step-by-Step Complete Setup

### Part 1: Backend Setup

#### Step 1.1: Navigate to Backend Directory
```bash
ssh username@ssh.yourdomain.com
cd ~/public_html/anitha-stores/server
```

#### Step 1.2: Create Backend .env File
```bash
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=YOUR_DATABASE_PASSWORD_HERE
PORT=5000
NODE_ENV=production
JWT_SECRET=YOUR_SECRET_KEY_32_CHARS_MINIMUM_HERE
FRONTEND_URL=https://yourdomain.com
EOF
```

**Edit with YOUR values:**
```bash
nano .env
```

**Replace:**
- `YOUR_DATABASE_PASSWORD_HERE` → Your PostgreSQL password
- `YOUR_SECRET_KEY_32_CHARS_MINIMUM_HERE` → Random secure string (32+ characters)
- `https://yourdomain.com` → Your actual domain (e.g., `https://anithastores.com`)

**Save:** `Ctrl+X`, then `Y`, then `Enter`

#### Step 1.3: Install Backend Dependencies
```bash
npm install
```

#### Step 1.4: Start Backend with PM2
```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Start backend
pm2 start server.js --name anitha-stores-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
# Copy and run the command it shows you
```

#### Step 1.5: Verify Backend is Running
```bash
# Check status
pm2 status

# Should show: anitha-stores-api | online

# Test API
curl http://localhost:5000/api/health

# Should return: {"status":"OK","message":"Server is running"}

# View logs
pm2 logs anitha-stores-api
```

---

### Part 2: Frontend Setup

#### Step 2.1: Navigate to Frontend Directory
```bash
cd ~/public_html/anitha-stores
```

#### Step 2.2: Create Frontend .env.production File
```bash
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://yourdomain.com/api
EOF
```

**Edit with YOUR domain:**
```bash
nano .env.production
```

**Replace:**
- `https://yourdomain.com` → Your actual domain (e.g., `https://anithastores.com`)

**Important:** Must match the domain where your frontend is hosted!

**Save:** `Ctrl+X`, then `Y`, then `Enter`

#### Step 2.3: Install Frontend Dependencies
```bash
npm install
```

#### Step 2.4: Build Frontend
```bash
npm run build
```

**This creates the `build/` folder** with all compiled files.

**Verify build:**
```bash
ls -la build/
ls -la build/index.html
ls -la build/static/
```

#### Step 2.5: Create .htaccess for React Router
```bash
cat > .htaccess << 'EOF'
# React Router - Redirect all to index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# API Proxy (if mod_proxy available)
<IfModule mod_proxy.c>
  ProxyPass /api http://localhost:5000/api
  ProxyPassReverse /api http://localhost:5000/api
</IfModule>
EOF
```

#### Step 2.6: Set File Permissions
```bash
# Folders: 755
find . -type d -exec chmod 755 {} \;

# Files: 644
find . -type f -exec chmod 644 {} \;

# Build folder specifically
chmod -R 755 build/
chmod 644 build/index.html
chmod 644 .htaccess
```

---

### Part 3: Database Setup

#### Step 3.1: Create PostgreSQL Database

**In Hostinger hPanel:**
1. Go to **"Databases"** → **"PostgreSQL Databases"**
2. Click **"Create Database"**
3. Fill in:
   - **Database Name:** `anitha_stores`
   - **Username:** `postgres` (or create new)
   - **Password:** Set a strong password
4. Click **"Create"**

**Note down:**
- Database Name
- Username
- Password
- Host (usually `localhost`)
- Port (usually `5432`)

#### Step 3.2: Update Backend .env with Database Info
```bash
cd ~/public_html/anitha-stores/server
nano .env
```

**Update:**
- `DB_PASSWORD` → Your database password from Step 3.1

**Save:** `Ctrl+X`, then `Y`, then `Enter`

#### Step 3.3: Restart Backend
```bash
pm2 restart anitha-stores-api
```

---

### Part 4: Configure Domain Document Root

#### Step 4.1: Set Document Root in hPanel

**In Hostinger hPanel:**
1. Go to **"Domains"** → **"Manage"**
2. Select your domain
3. Find **"Document Root"** or **"Website Root"**
4. Set to: `/home/username/public_html/anitha-stores/build`
5. Click **"Save"**

**OR if using subdomain:**
- Create subdomain: `app.yourdomain.com`
- Point to: `/home/username/public_html/anitha-stores/build`

---

### Part 5: SSL Certificate

#### Step 5.1: Enable SSL

**In Hostinger hPanel:**
1. Go to **"SSL"** → **"Free SSL"**
2. Select your domain
3. Click **"Install"** or **"Enable"**
4. Wait 2-10 minutes for activation

**Verify:**
- Visit `https://yourdomain.com`
- Should show padlock icon

---

## ✅ Verification Checklist

### Backend Verification:
```bash
# 1. Check PM2 status
pm2 status
# Should show: anitha-stores-api | online

# 2. Test local API
curl http://localhost:5000/api/health
# Should return: {"status":"OK","message":"Server is running"}

# 3. Check backend logs
pm2 logs anitha-stores-api --lines 20
# Should show no errors

# 4. Test database connection
# Check logs for database connection success
```

### Frontend Verification:
```bash
# 1. Check build exists
ls -la build/index.html
# Should exist

# 2. Check .env.production
cat .env.production
# Should show: REACT_APP_API_URL=https://yourdomain.com/api

# 3. Check .htaccess
cat .htaccess
# Should have rewrite rules
```

### Full Application Test:
1. **Visit:** `https://yourdomain.com`
2. **Open Browser Console:** Press `F12` → Console tab
3. **Check for errors:**
   - No CORS errors ✅
   - No 404 errors ✅
   - No network errors ✅
4. **Try to login:**
   - Should connect to backend ✅
   - Should redirect to dashboard ✅

---

## 🔄 How They Work Together

```
User Browser
    ↓
    Visits: https://yourdomain.com
    ↓
Frontend (React App in build/ folder)
    ↓
    Makes API call: https://yourdomain.com/api/login
    ↓
.htaccess Proxy: /api → http://localhost:5000/api
    ↓
Backend (Node.js on port 5000)
    ↓
    Connects to PostgreSQL Database
    ↓
    Returns data to Frontend
    ↓
Frontend displays data to user
```

**Key Points:**
- **Frontend** serves static files (HTML, CSS, JS) from `build/` folder
- **Backend** runs on port 5000 and handles API requests
- **.htaccess** proxies `/api/*` requests to backend
- **CORS** allows frontend domain to call backend API

---

## 🛠️ Complete Setup Script

**Save this as `setup-complete.sh` and run:**

```bash
#!/bin/bash

echo "🚀 Complete Setup: UI + Backend"
echo "================================"

PROJECT_DIR="$HOME/public_html/anitha-stores"
BACKEND_DIR="$PROJECT_DIR/server"

# Backend Setup
echo ""
echo "1️⃣ Setting up Backend..."
cd "$BACKEND_DIR"

# Create .env
if [ ! -f .env ]; then
    cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=CHANGE_ME
PORT=5000
NODE_ENV=production
JWT_SECRET=CHANGE_ME_32_CHARS_MIN
FRONTEND_URL=https://yourdomain.com
EOF
    echo "⚠️  Created .env - Please edit with your values!"
fi

# Install dependencies
npm install

# Install PM2
npm install -g pm2 2>/dev/null || true

# Start backend
pm2 start server.js --name anitha-stores-api || pm2 restart anitha-stores-api
pm2 save

# Frontend Setup
echo ""
echo "2️⃣ Setting up Frontend..."
cd "$PROJECT_DIR"

# Create .env.production
if [ ! -f .env.production ]; then
    cat > .env.production << 'EOF'
REACT_APP_API_URL=https://yourdomain.com/api
EOF
    echo "⚠️  Created .env.production - Please edit with your domain!"
fi

# Install dependencies
npm install

# Build
npm run build

# Create .htaccess
cat > .htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_proxy.c>
  ProxyPass /api http://localhost:5000/api
  ProxyPassReverse /api http://localhost:5000/api
</IfModule>
EOF

# Set permissions
find . -type d -exec chmod 755 {} \; 2>/dev/null
find . -type f -exec chmod 644 {} \; 2>/dev/null
chmod 755 build/
chmod 644 build/index.html

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit server/.env with your database credentials"
echo "2. Edit .env.production with your domain"
echo "3. Rebuild: npm run build"
echo "4. Restart: pm2 restart anitha-stores-api"
```

**Run:**
```bash
chmod +x setup-complete.sh
./setup-complete.sh
```

---

## 🔧 Quick Commands Reference

### Backend Commands:
```bash
# Navigate to backend
cd ~/public_html/anitha-stores/server

# Edit config
nano .env

# Start/restart
pm2 start server.js --name anitha-stores-api
pm2 restart anitha-stores-api
pm2 stop anitha-stores-api

# Check status
pm2 status
pm2 logs anitha-stores-api

# Test API
curl http://localhost:5000/api/health
```

### Frontend Commands:
```bash
# Navigate to frontend
cd ~/public_html/anitha-stores

# Edit config
nano .env.production

# Build
npm run build

# Check build
ls -la build/
```

### Both Together:
```bash
# Update and rebuild everything
cd ~/public_html/anitha-stores
npm install
cd server && npm install && cd ..
npm run build
pm2 restart anitha-stores-api
```

---

## 🆘 Troubleshooting

### Issue: Backend not starting

**Check:**
```bash
# Check .env file
cat server/.env

# Check database connection
# Look for errors in logs
pm2 logs anitha-stores-api

# Check if port 5000 is available
netstat -tulpn | grep 5000
```

### Issue: Frontend can't connect to backend

**Check:**
```bash
# 1. Backend running?
pm2 status

# 2. API URL correct?
cat .env.production

# 3. CORS configured?
cat server/.env | grep FRONTEND_URL

# 4. Test API
curl http://localhost:5000/api/health
curl https://yourdomain.com/api/health
```

### Issue: 404 errors after login

**Check:**
```bash
# .htaccess exists?
cat .htaccess

# Build folder exists?
ls -la build/index.html

# Document root correct?
# Check in hPanel → Domains → Document Root
```

---

## 📊 Configuration Summary

### Backend Configuration (`server/.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5000
NODE_ENV=production
JWT_SECRET=your_secret_32_chars
FRONTEND_URL=https://yourdomain.com  ← Must match your domain
```

### Frontend Configuration (`.env.production`):
```env
REACT_APP_API_URL=https://yourdomain.com/api  ← Must match your domain
```

### Key Points:
- ✅ Backend runs on port 5000
- ✅ Frontend serves from `build/` folder
- ✅ `.htaccess` proxies `/api/*` to backend
- ✅ `FRONTEND_URL` in backend must match your domain
- ✅ `REACT_APP_API_URL` in frontend must match your domain + `/api`

---

**🎉 Follow these steps and both UI and Backend will work together!**

