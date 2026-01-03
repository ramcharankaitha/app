# Hostinger Backend Deployment Guide

## 🎯 **Overview**

This guide will help you deploy your Node.js/Express backend application to Hostinger VPS.

**Requirements:**
- Hostinger VPS plan (minimum 2GB RAM recommended)
- SSH access to your VPS
- Domain name (optional, can use IP address)

---

## 📋 **Prerequisites**

### **1. Hostinger VPS Setup**
- Purchase a VPS plan from Hostinger
- Note your VPS IP address
- Get SSH credentials from Hostinger hPanel

### **2. Local Requirements**
- Git installed on your local machine
- SSH client (Windows: PuTTY, Mac/Linux: Terminal)

---

## 🚀 **Step-by-Step Deployment**

### **Step 1: Connect to Your VPS via SSH**

#### **Windows (PuTTY):**
1. Download and open PuTTY
2. Enter your VPS IP address
3. Port: 22
4. Click "Open"
5. Login with username: `root` and your password

#### **Mac/Linux (Terminal):**
```bash
ssh root@your-vps-ip-address
```

---

### **Step 2: Update System Packages**

```bash
# Update package list
apt update

# Upgrade existing packages
apt upgrade -y
```

---

### **Step 3: Install Node.js (v18 or higher)**

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version
```

**Expected output:**
```
v18.x.x
9.x.x
```

---

### **Step 4: Install PostgreSQL (if using local database)**

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
systemctl start postgresql
systemctl enable postgresql

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_secure_password';"

# Create your database
sudo -u postgres createdb anitha_stores
```

**OR** use external database (Render, Railway, etc.) - recommended for production.

---

### **Step 5: Install PM2 (Process Manager)**

PM2 keeps your Node.js application running and restarts it if it crashes.

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

---

### **Step 6: Install Nginx (Reverse Proxy)**

Nginx will handle incoming requests and forward them to your Node.js app.

```bash
# Install Nginx
apt install -y nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx

# Check status
systemctl status nginx
```

---

### **Step 7: Clone Your Repository**

```bash
# Navigate to home directory
cd ~

# Create app directory
mkdir -p /var/www
cd /var/www

# Clone your repository (replace with your repo URL)
git clone https://github.com/your-username/your-repo-name.git backend

# Navigate to backend directory
cd backend/server
```

**OR** upload files via SFTP:
- Use FileZilla or WinSCP
- Upload entire `server` folder to `/var/www/backend/server`

---

### **Step 8: Install Dependencies**

```bash
# Navigate to server directory
cd /var/www/backend/server

# Install npm packages
npm install --production
```

---

### **Step 9: Create Environment File**

```bash
# Create .env file
nano .env
```

**Add your environment variables:**
```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
# Option 1: Local PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Option 2: External Database (Recommended)
# DATABASE_URL=postgresql://user:password@host:port/database

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this

# Add other environment variables as needed
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

### **Step 10: Initialize Database**

```bash
# Run database initialization
node setup-database.js

# Or manually run SQL schema
psql -U postgres -d anitha_stores -f database/schema.sql
```

---

### **Step 11: Configure PM2**

Create a PM2 ecosystem file:

```bash
# Create ecosystem file
nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [{
    name: 'anitha-stores-backend',
    script: './server.js',
    instances: 1, // Use 1 for VPS, or 'max' for multi-core
    exec_mode: 'fork', // Use 'fork' for single instance, 'cluster' for multiple
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};
```

**Save and exit**

**Note:** For VPS, use single instance mode (`exec_mode: 'fork'`) instead of clustering to avoid resource issues.

---

### **Step 12: Start Application with PM2**

```bash
# Start application
pm2 start ecosystem.config.js

# Or start directly
pm2 start server.js --name anitha-stores-backend

# Save PM2 configuration (auto-start on reboot)
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs anitha-stores-backend
```

---

### **Step 13: Configure Nginx Reverse Proxy**

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/anitha-stores-backend
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # If using IP address instead of domain
    # server_name _;

    # Increase body size for file uploads
    client_max_body_size 50M;

    # Proxy to Node.js application
    location / {
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

    # Serve static files (uploads)
    location /uploads {
        alias /var/www/backend/server/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Save and exit**

**Enable the site:**
```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/anitha-stores-backend /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

### **Step 14: Configure Firewall**

```bash
# Allow HTTP, HTTPS, and SSH
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

### **Step 15: Install SSL Certificate (Let's Encrypt)**

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)

# Test auto-renewal
certbot renew --dry-run
```

**Your backend will now be accessible at:** `https://your-domain.com`

---

## 🔧 **Additional Configuration**

### **1. Create Logs Directory**

```bash
mkdir -p /var/www/backend/server/logs
```

### **2. Set Proper Permissions**

```bash
# Set ownership
chown -R $USER:$USER /var/www/backend

# Set permissions
chmod -R 755 /var/www/backend
```

### **3. Configure File Uploads**

Ensure the `uploads` directory exists and has proper permissions:

```bash
mkdir -p /var/www/backend/server/uploads/avatars
mkdir -p /var/www/backend/server/uploads/aadhar

# Set permissions
chmod -R 755 /var/www/backend/server/uploads
```

---

## 🔄 **Updating Your Application**

### **Method 1: Git Pull (Recommended)**

```bash
cd /var/www/backend
git pull origin main
cd server
npm install --production
pm2 restart anitha-stores-backend
```

### **Method 2: Manual Upload**

1. Upload new files via SFTP
2. Restart application:
```bash
pm2 restart anitha-stores-backend
```

---

## 📊 **Monitoring & Management**

### **PM2 Commands**

```bash
# View all processes
pm2 list

# View logs
pm2 logs anitha-stores-backend

# Restart application
pm2 restart anitha-stores-backend

# Stop application
pm2 stop anitha-stores-backend

# Delete application from PM2
pm2 delete anitha-stores-backend

# Monitor resources
pm2 monit
```

### **Check Application Status**

```bash
# Check if Node.js is running
pm2 status

# Check Nginx status
systemctl status nginx

# Check PostgreSQL status (if local)
systemctl status postgresql

# View application logs
tail -f /var/www/backend/server/logs/out.log
```

---

## 🐛 **Troubleshooting**

### **Application Not Starting**

```bash
# Check PM2 logs
pm2 logs anitha-stores-backend --lines 50

# Check if port is in use
netstat -tulpn | grep 5000

# Test database connection
cd /var/www/backend/server
node -e "require('./config/database').testConnection()"
```

### **Nginx Not Working**

```bash
# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### **Database Connection Issues**

```bash
# Test PostgreSQL connection
psql -U postgres -d anitha_stores

# Check PostgreSQL status
systemctl status postgresql

# View PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*.log
```

### **Permission Issues**

```bash
# Fix ownership
chown -R $USER:$USER /var/www/backend

# Fix permissions
chmod -R 755 /var/www/backend
chmod -R 755 /var/www/backend/server/uploads
```

---

## 🔒 **Security Best Practices**

### **1. Update System Regularly**

```bash
apt update && apt upgrade -y
```

### **2. Use Strong Passwords**

- Database passwords
- SSH passwords
- JWT secrets

### **3. Configure Firewall**

```bash
# Only allow necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp # HTTPS
```

### **4. Disable Root Login (Optional but Recommended)**

```bash
# Create new user
adduser deploy
usermod -aG sudo deploy

# Configure SSH key authentication
# Then disable password authentication in /etc/ssh/sshd_config
```

### **5. Keep Dependencies Updated**

```bash
cd /var/www/backend/server
npm audit
npm update
```

---

## 📝 **Environment Variables Checklist**

Make sure these are set in your `.env` file:

```env
# Required
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
# OR
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=your_password

# Required
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=your_secret_key

# Optional (if using)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

---

## 🎯 **Quick Reference Commands**

```bash
# Start application
pm2 start ecosystem.config.js

# Restart application
pm2 restart anitha-stores-backend

# View logs
pm2 logs anitha-stores-backend

# Stop application
pm2 stop anitha-stores-backend

# Update application
cd /var/www/backend && git pull && cd server && npm install && pm2 restart anitha-stores-backend

# Check status
pm2 status
systemctl status nginx
systemctl status postgresql
```

---

## ✅ **Deployment Checklist**

- [ ] VPS purchased and SSH access obtained
- [ ] System packages updated
- [ ] Node.js installed (v18+)
- [ ] PostgreSQL installed (or external DB configured)
- [ ] PM2 installed
- [ ] Nginx installed and configured
- [ ] Application files uploaded/cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env` file)
- [ ] Database initialized
- [ ] Application started with PM2
- [ ] Nginx reverse proxy configured
- [ ] Firewall configured
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Application accessible via domain/IP
- [ ] File uploads working
- [ ] PM2 auto-start configured
- [ ] Logs directory created
- [ ] Permissions set correctly

---

## 📞 **Support Resources**

- **Hostinger Support**: https://www.hostinger.com/contact
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Node.js Documentation**: https://nodejs.org/docs/

---

## 🎉 **You're Done!**

Your backend should now be accessible at:
- **HTTP**: `http://your-domain.com` or `http://your-ip-address`
- **HTTPS**: `https://your-domain.com` (after SSL setup)

**Test your API:**
```bash
curl http://your-domain.com/api/health
```

Expected response:
```json
{"status":"OK","message":"Server is running"}
```

---

## 💡 **Pro Tips**

1. **Use External Database**: For production, use managed PostgreSQL (Render, Railway) instead of local database
2. **Monitor Resources**: Use `pm2 monit` to monitor CPU and memory usage
3. **Set Up Backups**: Regularly backup your database and application files
4. **Use Git**: Keep your code in Git for easy updates
5. **Monitor Logs**: Regularly check PM2 and Nginx logs for errors
6. **Update Regularly**: Keep Node.js, PM2, and system packages updated

---

## 🔄 **Alternative: Single Server Mode**

If you want to disable clustering (recommended for VPS):

**Modify `package.json`:**
```json
{
  "scripts": {
    "start": "node server.js",
    "start:cluster": "node cluster.js"
  }
}
```

**Or use PM2 with single instance:**
```bash
pm2 start server.js --name anitha-stores-backend -i 1
```

This uses less resources and is better for smaller VPS instances.

---

**Good luck with your deployment! 🚀**

