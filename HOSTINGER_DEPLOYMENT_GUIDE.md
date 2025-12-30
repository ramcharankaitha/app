# Complete Hostinger Deployment Guide

## 📋 Overview

This guide covers deploying your React + Node.js + PostgreSQL application to Hostinger. Hostinger offers multiple hosting options, and we'll cover the best approach for your stack.

---

## 🎯 Hostinger Hosting Options

### Option 1: VPS Hosting (Recommended) ⭐
- **Best for:** Node.js applications
- **Features:** Full root access, Node.js support, PostgreSQL
- **Cost:** ~$4-10/month
- **Pros:** Complete control, can run Node.js backend
- **Cons:** Requires server management

### Option 2: Cloud Hosting
- **Best for:** Modern applications
- **Features:** Node.js support, scalable
- **Cost:** ~$9-15/month
- **Pros:** Easy Node.js deployment
- **Cons:** Slightly more expensive

### Option 3: Shared Hosting (Not Recommended)
- **Limitations:** No Node.js support, only PHP/static files
- **Use only for:** Frontend static files (if backend is elsewhere)

**Recommendation:** Use **VPS Hosting** or **Cloud Hosting** for full application deployment.

---

## 🚀 Deployment Methods

### Method 1: Git Deployment (Recommended)

#### Step 1: Prepare Your Repository

1. **Ensure your code is on GitHub/GitLab/Bitbucket:**
   ```bash
   git add .
   git commit -m "Prepare for Hostinger deployment"
   git push origin main
   ```

2. **Create `.gitignore` if not exists:**
   ```gitignore
   node_modules/
   .env
   .env.local
   build/
   server/uploads/
   *.log
   .DS_Store
   ```

#### Step 2: Access Hostinger VPS/Cloud

1. **Login to Hostinger:**
   - Go to https://hpanel.hostinger.com
   - Navigate to your VPS/Cloud hosting

2. **Access via SSH:**
   ```bash
   ssh root@your-server-ip
   # Or use Hostinger's web terminal
   ```

#### Step 3: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Git
sudo apt install -y git

# Install PM2 (Process Manager for Node.js)
sudo npm install -g pm2

# Install Nginx (Web Server)
sudo apt install -y nginx
```

#### Step 4: Clone Your Repository

```bash
# Create application directory
sudo mkdir -p /var/www/anitha-stores
sudo chown $USER:$USER /var/www/anitha-stores

# Clone repository
cd /var/www/anitha-stores
git clone https://github.com/your-username/your-repo.git .

# Or if using private repo:
git clone https://your-username:your-token@github.com/your-username/your-repo.git .
```

#### Step 5: Setup Backend

```bash
# Navigate to server directory
cd /var/www/anitha-stores/server

# Install dependencies
npm install

# Create .env file
nano .env
```

**Add to `.env` file:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret
JWT_SECRET=your_very_secure_random_string_here_min_32_chars

# Frontend URL (your Hostinger domain)
FRONTEND_URL=https://yourdomain.com
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

#### Step 6: Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE anitha_stores;
CREATE USER postgres WITH PASSWORD 'your_secure_password_here';
ALTER USER postgres CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE anitha_stores TO postgres;
\q
```

#### Step 7: Build Frontend

```bash
# Go to root directory
cd /var/www/anitha-stores

# Install frontend dependencies
npm install

# Build React app
npm run build

# The build files will be in /var/www/anitha-stores/build
```

#### Step 8: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/anitha-stores
```

**Add this configuration:**
```nginx
# Frontend (React App)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/anitha-stores/build;
    index index.html;

    # Serve React app
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy (Backend)
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

**Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/anitha-stores /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

#### Step 9: Start Backend with PM2

```bash
# Navigate to server directory
cd /var/www/anitha-stores/server

# Start with PM2
pm2 start server.js --name anitha-stores-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it provides
```

#### Step 10: Setup SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts
# Certbot will automatically configure Nginx for HTTPS
```

---

### Method 2: Using Hostinger's File Manager (Alternative)

If you prefer using Hostinger's web interface:

#### Step 1: Upload Files via File Manager

1. **Login to Hostinger hPanel**
2. **Go to File Manager**
3. **Navigate to `public_html`** (or your domain folder)
4. **Upload your files:**
   - Upload the entire project folder
   - Or use Git via Hostinger's Git feature

#### Step 2: Install Dependencies

1. **Open Terminal in hPanel**
2. **Navigate to your project:**
   ```bash
   cd public_html/your-project
   ```
3. **Install dependencies:**
   ```bash
   npm install
   cd server && npm install
   ```

#### Step 3: Configure Environment

1. **Create `.env` file in `server` directory**
2. **Add your environment variables** (same as Step 5 above)

#### Step 4: Build and Start

```bash
# Build frontend
npm run build

# Start backend (if Node.js is available)
cd server
node server.js
# Or use PM2: pm2 start server.js
```

---

## 🔧 Configuration Files

### 1. Update CORS in `server/server.js`

Update the CORS configuration to allow your Hostinger domain:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://yourdomain.com',  // Add your Hostinger domain
  'https://www.yourdomain.com',
  process.env.FRONTEND_URL,
].filter(Boolean);
```

### 2. Update API Base URL

In your frontend, set environment variable:

**Create `.env.production` in root:**
```env
REACT_APP_API_URL=https://yourdomain.com/api
```

Then rebuild:
```bash
npm run build
```

---

## 📁 Directory Structure on Hostinger

```
/var/www/anitha-stores/
├── build/                 # React build files (served by Nginx)
├── server/                # Node.js backend
│   ├── .env              # Backend environment variables
│   ├── server.js         # Main server file
│   ├── routes/           # API routes
│   └── uploads/          # Uploaded files
├── public/               # Public assets
├── src/                  # React source (not needed in production)
├── package.json
└── .git/                 # Git repository
```

---

## 🔄 Updating Your Application

### Using Git (Recommended):

```bash
# SSH into your server
ssh root@your-server-ip

# Navigate to project
cd /var/www/anitha-stores

# Pull latest changes
git pull origin main

# Rebuild frontend
npm run build

# Restart backend
cd server
pm2 restart anitha-stores-api
```

### Manual Update:

1. **Upload new files via File Manager or FTP**
2. **Rebuild frontend:**
   ```bash
   npm run build
   ```
3. **Restart backend:**
   ```bash
   pm2 restart anitha-stores-api
   ```

---

## 🗄️ Database Management

### Access PostgreSQL:

```bash
sudo -u postgres psql -d anitha_stores
```

### Run SQL Scripts:

```bash
# Copy SQL files to server
# Then run:
psql -U postgres -d anitha_stores -f /path/to/script.sql
```

### Backup Database:

```bash
# Create backup
pg_dump -U postgres anitha_stores > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U postgres anitha_stores < backup_20240101.sql
```

---

## 🔐 Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable firewall (UFW)
- [ ] Setup SSL certificate (HTTPS)
- [ ] Configure CORS properly
- [ ] Set proper file permissions
- [ ] Regular database backups
- [ ] Keep Node.js and dependencies updated

### Setup Firewall:

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 🐛 Troubleshooting

### Issue: Backend not starting

**Check logs:**
```bash
pm2 logs anitha-stores-api
```

**Check if port is in use:**
```bash
sudo netstat -tulpn | grep 5000
```

### Issue: Frontend not loading

**Check Nginx:**
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Issue: Database connection failed

**Check PostgreSQL:**
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"  # List databases
```

**Check connection:**
```bash
psql -U postgres -d anitha_stores -h localhost
```

### Issue: 502 Bad Gateway

- Backend might not be running
- Check PM2: `pm2 status`
- Check Nginx proxy configuration
- Verify backend is listening on port 5000

---

## 📊 Monitoring

### PM2 Monitoring:

```bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 monit           # Monitor in real-time
pm2 restart all     # Restart all processes
```

### Nginx Logs:

```bash
sudo tail -f /var/log/nginx/access.log  # Access logs
sudo tail -f /var/log/nginx/error.log   # Error logs
```

---

## 🔄 Automated Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
cd /var/www/anitha-stores
git pull origin main
npm install
npm run build
cd server
npm install
pm2 restart anitha-stores-api
echo "Deployment complete!"
```

**Make executable:**
```bash
chmod +x deploy.sh
```

**Run:**
```bash
./deploy.sh
```

---

## 📝 Quick Reference

### Important Commands:

```bash
# Start backend
pm2 start server.js --name anitha-stores-api

# Stop backend
pm2 stop anitha-stores-api

# Restart backend
pm2 restart anitha-stores-api

# View logs
pm2 logs anitha-stores-api

# Rebuild frontend
npm run build

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# Database access
sudo -u postgres psql -d anitha_stores
```

### Important Files:

- **Backend Config:** `/var/www/anitha-stores/server/.env`
- **Nginx Config:** `/etc/nginx/sites-available/anitha-stores`
- **Frontend Build:** `/var/www/anitha-stores/build`
- **PM2 Config:** `~/.pm2/`

---

## 🎯 Summary

**Recommended Setup:**
1. ✅ Use Hostinger VPS or Cloud Hosting
2. ✅ Deploy via Git
3. ✅ Use Nginx for frontend + API proxy
4. ✅ Use PM2 for backend process management
5. ✅ Setup SSL with Let's Encrypt
6. ✅ Configure PostgreSQL database
7. ✅ Setup automated backups

**Your application will be available at:**
- Frontend: `https://yourdomain.com`
- API: `https://yourdomain.com/api`

---

## 📞 Support

- **Hostinger Support:** https://www.hostinger.com/contact
- **Hostinger Docs:** https://support.hostinger.com
- **PM2 Docs:** https://pm2.keymetrics.io/docs
- **Nginx Docs:** https://nginx.org/en/docs/

---

**🚀 Your application is now ready for Hostinger deployment!**

