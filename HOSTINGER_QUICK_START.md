# Hostinger Quick Start Guide

## 🚀 Fast Deployment (30 Minutes)

### Prerequisites
- ✅ Hostinger VPS or Cloud Hosting account
- ✅ Domain name pointed to Hostinger
- ✅ Git repository with your code
- ✅ SSH access to your server

---

## Step-by-Step Deployment

### 1. Initial Server Setup (5 minutes)

**Option A: Use Setup Script**
```bash
# Download and run setup script
wget https://raw.githubusercontent.com/your-repo/hostinger-setup.sh
chmod +x hostinger-setup.sh
sudo ./hostinger-setup.sh
```

**Option B: Manual Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2, Nginx, Git
sudo apt install -y git nginx
sudo npm install -g pm2
```

---

### 2. Clone Your Repository (2 minutes)

```bash
# Create directory
sudo mkdir -p /var/www/anitha-stores
sudo chown $USER:$USER /var/www/anitha-stores

# Clone repo
cd /var/www/anitha-stores
git clone https://github.com/your-username/your-repo.git .
```

---

### 3. Setup Database (3 minutes)

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE anitha_stores;
CREATE USER postgres WITH PASSWORD 'your_secure_password';
ALTER USER postgres CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE anitha_stores TO postgres;
\q
```

---

### 4. Configure Backend (5 minutes)

```bash
cd /var/www/anitha-stores/server

# Install dependencies
npm install

# Create .env file
nano .env
```

**Add to `.env`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=your_secure_password
PORT=5000
NODE_ENV=production
JWT_SECRET=your_very_secure_random_string_32_chars_min
FRONTEND_URL=https://yourdomain.com
```

**Save:** `Ctrl+X`, `Y`, `Enter`

---

### 5. Build Frontend (5 minutes)

```bash
cd /var/www/anitha-stores

# Install dependencies
npm install

# Build React app
npm run build
```

---

### 6. Configure Nginx (5 minutes)

```bash
# Copy configuration
sudo cp nginx-config.conf /etc/nginx/sites-available/anitha-stores

# Edit and update domain name
sudo nano /etc/nginx/sites-available/anitha-stores
# Replace "yourdomain.com" with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/anitha-stores /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### 7. Start Backend (2 minutes)

```bash
cd /var/www/anitha-stores/server

# Start with PM2
pm2 start server.js --name anitha-stores-api

# Save PM2 config
pm2 save

# Setup auto-start on boot
pm2 startup
# Follow the instructions it provides
```

---

### 8. Setup SSL (3 minutes)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts (enter email, agree to terms)
```

---

### 9. Update Frontend API URL (2 minutes)

Create `.env.production` in root:
```bash
cd /var/www/anitha-stores
nano .env.production
```

**Add:**
```env
REACT_APP_API_URL=https://yourdomain.com/api
```

**Rebuild:**
```bash
npm run build
```

---

## ✅ Verify Deployment

1. **Check Backend:**
   ```bash
   pm2 status
   pm2 logs anitha-stores-api
   ```

2. **Check Nginx:**
   ```bash
   sudo systemctl status nginx
   ```

3. **Visit Your Site:**
   - Frontend: `https://yourdomain.com`
   - API Health: `https://yourdomain.com/api/health`

---

## 🔄 Updating Your App

**Use the deploy script:**
```bash
cd /var/www/anitha-stores
chmod +x deploy.sh
./deploy.sh
```

**Or manually:**
```bash
cd /var/www/anitha-stores
git pull origin main
npm run build
cd server
pm2 restart anitha-stores-api
```

---

## 🆘 Common Issues

### Backend not starting?
```bash
pm2 logs anitha-stores-api
# Check for errors in logs
```

### 502 Bad Gateway?
- Check if backend is running: `pm2 status`
- Check backend logs: `pm2 logs`
- Verify Nginx config: `sudo nginx -t`

### Database connection failed?
```bash
sudo systemctl status postgresql
sudo -u postgres psql -d anitha_stores
# Check if database exists and credentials are correct
```

---

## 📋 Important Files

- **Backend Config:** `/var/www/anitha-stores/server/.env`
- **Nginx Config:** `/etc/nginx/sites-available/anitha-stores`
- **Frontend Build:** `/var/www/anitha-stores/build`
- **PM2 Config:** `~/.pm2/`

---

## 🎯 Quick Commands

```bash
# Restart backend
pm2 restart anitha-stores-api

# View logs
pm2 logs anitha-stores-api

# Restart Nginx
sudo systemctl restart nginx

# Check status
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
```

---

**🚀 Your app should now be live at https://yourdomain.com!**

For detailed instructions, see `HOSTINGER_DEPLOYMENT_GUIDE.md`

