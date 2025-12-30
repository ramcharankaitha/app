# Hostinger CLI Deployment - Complete Command Guide

## 🚀 Quick Deploy - Copy & Paste Commands

This guide provides ALL CLI commands needed to deploy your app to Hostinger. Just copy and paste!

---

## 📋 Prerequisites

1. **SSH Access Enabled** in Hostinger
2. **Git Installed** on Hostinger server
3. **Node.js 18+** installed
4. **PostgreSQL** database created

---

## 🔑 Step 1: Enable SSH Access

1. **In hPanel:** Go to **"Advanced"** → **"SSH Access"**
2. **Enable SSH** if not already enabled
3. **Note your SSH credentials:**
   - Host: `ssh.yourdomain.com` or IP
   - Username: Your Hostinger username
   - Port: Usually `22`

---

## 🔐 Step 2: Connect via SSH

### On Windows (PowerShell/CMD):
```bash
ssh username@ssh.yourdomain.com -p 22
```

### On Mac/Linux:
```bash
ssh username@ssh.yourdomain.com -p 22
```

**Replace:**
- `username` → Your Hostinger username
- `ssh.yourdomain.com` → Your SSH host

**Enter password when prompted**

---

## 📁 Step 3: Navigate to Project Directory

```bash
cd ~/public_html
```

**OR if you have a domain folder:**
```bash
cd ~/public_html/yourdomain.com
```

---

## 📦 Step 4: Clone Your Repository

### Option A: Clone from Git (Recommended)

```bash
# Clone your repository
git clone https://github.com/yourusername/your-repo.git anitha-stores

# Enter project directory
cd anitha-stores
```

### Option B: Upload via SCP (If no Git)

**On your local computer, run:**
```bash
# Create a clean copy (exclude node_modules, .env, build)
tar -czf anitha-stores.tar.gz --exclude='node_modules' --exclude='server/node_modules' --exclude='.env' --exclude='server/.env' --exclude='build' --exclude='.git' src/ public/ server/ package.json package-lock.json

# Upload to Hostinger
scp anitha-stores.tar.gz username@ssh.yourdomain.com:~/public_html/

# Extract on server
ssh username@ssh.yourdomain.com
cd ~/public_html
tar -xzf anitha-stores.tar.gz -C anitha-stores
cd anitha-stores
```

---

## ⚙️ Step 5: Create Environment Files

### Create Backend .env:
```bash
cd ~/public_html/anitha-stores/server

cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=YOUR_DATABASE_PASSWORD_HERE
PORT=5000
NODE_ENV=production
JWT_SECRET=YOUR_SECRET_KEY_MIN_32_CHARS_HERE
FRONTEND_URL=https://yourdomain.com
EOF
```

**Edit the file:**
```bash
nano .env
```

**Replace:**
- `YOUR_DATABASE_PASSWORD_HERE` → Your actual database password
- `YOUR_SECRET_KEY_MIN_32_CHARS_HERE` → A secure random string (32+ chars)
- `https://yourdomain.com` → Your actual domain

**Save:** `Ctrl+X`, then `Y`, then `Enter`

### Create Frontend .env.production:
```bash
cd ~/public_html/anitha-stores

cat > .env.production << 'EOF'
REACT_APP_API_URL=https://yourdomain.com/api
EOF
```

**Edit if needed:**
```bash
nano .env.production
```

**Replace:** `https://yourdomain.com` with your domain

**Save:** `Ctrl+X`, then `Y`, then `Enter`

---

## 📦 Step 6: Install Dependencies

### Install Frontend Dependencies:
```bash
cd ~/public_html/anitha-stores
npm install
```

### Install Backend Dependencies:
```bash
cd ~/public_html/anitha-stores/server
npm install
```

### Go back to root:
```bash
cd ~/public_html/anitha-stores
```

---

## 🏗️ Step 7: Build Frontend

```bash
cd ~/public_html/anitha-stores
npm run build
```

**Wait for build to complete** (1-3 minutes)

---

## 🗄️ Step 8: Setup Database (If Not Done)

### Create Database via CLI:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE anitha_stores;

# Create user (if needed)
CREATE USER postgres WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE anitha_stores TO postgres;

# Exit PostgreSQL
\q
```

**OR use Hostinger Database Manager** (easier):
- Go to hPanel → Databases → PostgreSQL
- Create database: `anitha_stores`
- Note credentials

---

## 🚀 Step 9: Install PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

---

## ⚡ Step 10: Start Backend with PM2

```bash
cd ~/public_html/anitha-stores/server

# Start backend
pm2 start server.js --name anitha-stores-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
# Copy and run the command it provides
```

### PM2 Useful Commands:
```bash
# Check status
pm2 status

# View logs
pm2 logs anitha-stores-api

# Restart
pm2 restart anitha-stores-api

# Stop
pm2 stop anitha-stores-api

# Delete
pm2 delete anitha-stores-api

# Monitor
pm2 monit
```

---

## 🌐 Step 11: Configure Nginx (If VPS/Cloud)

### Create Nginx Config:
```bash
sudo nano /etc/nginx/sites-available/anitha-stores
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend - React App
    root /home/username/public_html/anitha-stores/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Save:** `Ctrl+X`, then `Y`, then `Enter`

### Enable Site:
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/anitha-stores /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 Step 12: Setup SSL Certificate

### Install Certbot:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y
```

### Get SSL Certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Follow prompts:**
- Enter email
- Agree to terms
- Choose redirect HTTP to HTTPS

### Auto-renewal (Already setup by Certbot):
```bash
# Test renewal
sudo certbot renew --dry-run
```

---

## 📝 Step 13: Create .htaccess (If Apache/Shared Hosting)

```bash
cd ~/public_html/anitha-stores

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

# Security Headers
<IfModule mod_headers.c>
  Header set X-Frame-Options "DENY"
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
EOF
```

---

## 🔧 Step 14: Set File Permissions

```bash
cd ~/public_html/anitha-stores

# Set folder permissions
find . -type d -exec chmod 755 {} \;

# Set file permissions
find . -type f -exec chmod 644 {} \;

# Make server.js executable
chmod +x server/server.js

# Create uploads folder with write permissions
mkdir -p server/uploads/aadhar
mkdir -p server/uploads/avatars
mkdir -p server/uploads/llr
chmod -R 755 server/uploads
```

---

## ✅ Step 15: Verify Everything Works

### Check Backend:
```bash
# Check if PM2 is running
pm2 status

# Check backend logs
pm2 logs anitha-stores-api --lines 50

# Test API endpoint
curl http://localhost:5000/api/health
```

### Check Frontend:
```bash
# Verify build exists
ls -la build/

# Check if index.html exists
ls -la build/index.html
```

### Test from Browser:
```bash
# Visit your domain
curl https://yourdomain.com

# Test API
curl https://yourdomain.com/api/health
```

---

## 🔄 Step 16: Update Deployment Script

### Create deploy.sh:
```bash
cd ~/public_html/anitha-stores

cat > deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting deployment..."

# Navigate to project
cd ~/public_html/anitha-stores

# Pull latest changes (if using Git)
# git pull origin main

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Restart backend
echo "🔄 Restarting backend..."
pm2 restart anitha-stores-api

echo "✅ Deployment complete!"
pm2 status
EOF

# Make executable
chmod +x deploy.sh
```

### Run deployment:
```bash
./deploy.sh
```

---

## 🆘 Troubleshooting Commands

### Check Node.js Version:
```bash
node -v
npm -v
```

### Check PostgreSQL:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Connect to database
psql -U postgres -d anitha_stores

# List databases
psql -U postgres -l
```

### Check Port 5000:
```bash
# Check if port is in use
sudo netstat -tulpn | grep 5000

# OR
sudo lsof -i :5000
```

### Check PM2:
```bash
# View all processes
pm2 list

# View detailed info
pm2 show anitha-stores-api

# View logs
pm2 logs anitha-stores-api

# Restart everything
pm2 restart all
```

### Check Nginx:
```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### Check File Permissions:
```bash
# Check current permissions
ls -la

# Fix ownership (if needed)
sudo chown -R username:username ~/public_html/anitha-stores
```

### Check Environment Variables:
```bash
# View backend .env
cat server/.env

# View frontend .env
cat .env.production
```

### Database Connection Test:
```bash
# Test connection
psql -h localhost -U postgres -d anitha_stores -c "SELECT version();"
```

---

## 📋 Complete One-Time Setup Script

**Save this as `setup.sh` and run once:**

```bash
#!/bin/bash

echo "🚀 Hostinger Setup Script"
echo "========================"

# Navigate to project
cd ~/public_html/anitha-stores

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Install PM2
echo "⚙️ Installing PM2..."
npm install -g pm2

# Start backend
echo "🚀 Starting backend..."
cd server
pm2 start server.js --name anitha-stores-api
pm2 save
pm2 startup
cd ..

# Set permissions
echo "🔧 Setting permissions..."
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
mkdir -p server/uploads/{aadhar,avatars,llr}
chmod -R 755 server/uploads

echo "✅ Setup complete!"
echo "📊 PM2 Status:"
pm2 status
```

**Make executable and run:**
```bash
chmod +x setup.sh
./setup.sh
```

---

## 🔄 Quick Update Commands

### Update Frontend Only:
```bash
cd ~/public_html/anitha-stores
npm install
npm run build
```

### Update Backend Only:
```bash
cd ~/public_html/anitha-stores/server
npm install
pm2 restart anitha-stores-api
```

### Full Update:
```bash
cd ~/public_html/anitha-stores
npm install
cd server && npm install && cd ..
npm run build
pm2 restart anitha-stores-api
```

---

## 📊 Monitoring Commands

### View Real-time Logs:
```bash
# Backend logs
pm2 logs anitha-stores-api --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### Check Resource Usage:
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
# OR
top

# Disk space
df -h

# Memory
free -h
```

---

## 🎯 Quick Reference - All Commands

```bash
# Connect
ssh username@ssh.yourdomain.com

# Navigate
cd ~/public_html/anitha-stores

# Install
npm install
cd server && npm install

# Build
npm run build

# PM2
pm2 start server.js --name anitha-stores-api
pm2 restart anitha-stores-api
pm2 stop anitha-stores-api
pm2 logs anitha-stores-api
pm2 status

# Permissions
chmod -R 755 .
find . -type f -exec chmod 644 {} \;

# Deploy
./deploy.sh
```

---

**🎉 That's it! Your app is deployed via CLI!**

**Need help?** Check the troubleshooting section above.

