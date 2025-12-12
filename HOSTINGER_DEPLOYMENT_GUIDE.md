# Hostinger Deployment Guide

This guide will help you deploy your Anitha Stores application to Hostinger hosting.

## Prerequisites

1. **Hostinger Account** with:
   - Shared Hosting or VPS (VPS recommended for Node.js)
   - Domain name configured
   - SSH access enabled (for VPS)

2. **Local Setup**:
   - Git repository (GitHub/GitLab/Bitbucket)
   - Node.js installed locally
   - Database credentials ready

## Deployment Options

### Option 1: VPS Hosting (Recommended for Node.js)

Hostinger VPS allows you to run Node.js applications directly.

#### Step 1: Prepare Your Application

1. **Build the React Frontend**:
   ```bash
   cd /path/to/your/app
   npm install
   npm run build
   ```
   This creates a `build` folder with production-ready files.

2. **Prepare Backend**:
   ```bash
   cd server
   npm install --production
   ```

#### Step 2: Set Up VPS on Hostinger

1. **Access Your VPS**:
   - Log into Hostinger control panel
   - Go to VPS section
   - Note your VPS IP address
   - Use SSH to connect: `ssh root@your-vps-ip`

2. **Install Required Software**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js (v18 or v20)
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PostgreSQL (if not using external DB)
   sudo apt install postgresql postgresql-contrib -y
   
   # Install PM2 (Process Manager)
   sudo npm install -g pm2
   
   # Install Nginx (Web Server)
   sudo apt install nginx -y
   ```

3. **Set Up Database**:
   ```bash
   # Access PostgreSQL
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE anitha_stores;
   CREATE USER anitha_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE anitha_stores TO anitha_user;
   \q
   ```

#### Step 3: Deploy Application Files

1. **Upload Files via SFTP/SCP**:
   ```bash
   # From your local machine
   scp -r build/ root@your-vps-ip:/var/www/anitha-stores/frontend/
   scp -r server/ root@your-vps-ip:/var/www/anitha-stores/backend/
   ```

   Or use FileZilla/SFTP client:
   - Host: your-vps-ip
   - Username: root
   - Port: 22
   - Upload `build/` folder to `/var/www/anitha-stores/frontend/`
   - Upload `server/` folder to `/var/www/anitha-stores/backend/`

2. **Set Up Environment Variables**:
   ```bash
   # On VPS, create .env file in backend folder
   cd /var/www/anitha-stores/backend
   nano .env
   ```

   Add your configuration:
   ```env
   PORT=5000
   NODE_ENV=production
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=anitha_stores
   DB_USER=anitha_user
   DB_PASSWORD=your_secure_password
   REACT_APP_API_URL=https://yourdomain.com/api
   ```

3. **Initialize Database**:
   ```bash
   cd /var/www/anitha-stores/backend
   node database/init.js
   ```

#### Step 4: Configure PM2

1. **Start Backend with PM2**:
   ```bash
   cd /var/www/anitha-stores/backend
   pm2 start server.js --name anitha-backend
   pm2 save
   pm2 startup
   ```

2. **Configure PM2 to Auto-Start**:
   ```bash
   pm2 startup
   # Follow the instructions shown
   ```

#### Step 5: Configure Nginx

1. **Create Nginx Configuration**:
   ```bash
   sudo nano /etc/nginx/sites-available/anitha-stores
   ```

2. **Add Configuration**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       # Frontend (React App)
       location / {
           root /var/www/anitha-stores/frontend;
           try_files $uri $uri/ /index.html;
           index index.html;
       }

       # Backend API
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

       # Static files
       location /uploads {
           alias /var/www/anitha-stores/backend/uploads;
       }
   }
   ```

3. **Enable Site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/anitha-stores /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### Step 6: Set Up SSL Certificate (HTTPS)

1. **Install Certbot**:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```

2. **Get SSL Certificate**:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Auto-Renewal**:
   ```bash
   sudo certbot renew --dry-run
   ```

---

### Option 2: Shared Hosting (Frontend Only + External Backend)

If you only have shared hosting, you can host the frontend there and use a separate service for the backend.

#### Step 1: Build Frontend

```bash
npm install
npm run build
```

#### Step 2: Upload to Hostinger

1. **Access File Manager**:
   - Log into Hostinger hPanel
   - Go to File Manager
   - Navigate to `public_html` folder

2. **Upload Build Files**:
   - Upload all files from `build/` folder
   - Or use FTP client (FileZilla):
     - Host: ftp.yourdomain.com
     - Username: your hosting username
     - Port: 21

3. **Create .htaccess** (for React Router):
   Create `.htaccess` in `public_html`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

#### Step 3: Backend Options

**Option A: Use Hostinger VPS** (as described above)

**Option B: Use External Services**:
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

Update `REACT_APP_API_URL` in your build to point to your backend URL.

---

## Post-Deployment Checklist

### 1. Update Environment Variables
- [ ] Backend `.env` file configured
- [ ] Frontend API URL updated
- [ ] Database credentials correct

### 2. Database Setup
- [ ] Database created
- [ ] Tables initialized
- [ ] Default admin user created

### 3. File Permissions
```bash
# Set correct permissions
sudo chown -R www-data:www-data /var/www/anitha-stores
sudo chmod -R 755 /var/www/anitha-stores
```

### 4. Firewall Configuration
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 5. Test Application
- [ ] Frontend loads correctly
- [ ] API endpoints working
- [ ] Database connections successful
- [ ] File uploads working
- [ ] Login functionality works

---

## Troubleshooting

### Backend Not Starting
```bash
# Check PM2 status
pm2 status
pm2 logs anitha-backend

# Restart backend
pm2 restart anitha-backend
```

### Nginx Errors
```bash
# Check Nginx status
sudo systemctl status nginx

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -h localhost -U anitha_user -d anitha_stores

# Check PostgreSQL status
sudo systemctl status postgresql
```

### File Upload Issues
```bash
# Check uploads directory permissions
ls -la /var/www/anitha-stores/backend/uploads
sudo chmod -R 755 /var/www/anitha-stores/backend/uploads
```

---

## Quick Deployment Script

Save this as `deploy.sh` and run it on your VPS:

```bash
#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Create application directory
sudo mkdir -p /var/www/anitha-stores/{frontend,backend}
sudo chown -R $USER:$USER /var/www/anitha-stores

# Navigate to backend
cd /var/www/anitha-stores/backend

# Install dependencies
npm install --production

# Start with PM2
pm2 start server.js --name anitha-backend
pm2 save
pm2 startup

echo "Deployment setup complete!"
echo "Now configure Nginx and upload your files."
```

---

## Important Notes

1. **Security**:
   - Use strong passwords
   - Keep Node.js and dependencies updated
   - Enable firewall
   - Use HTTPS (SSL)
   - Don't commit `.env` files

2. **Performance**:
   - Enable Gzip compression in Nginx
   - Use CDN for static assets
   - Enable caching
   - Monitor with PM2

3. **Backups**:
   - Regular database backups
   - Backup application files
   - Test restore procedures

4. **Monitoring**:
   ```bash
   # PM2 monitoring
   pm2 monit
   
   # Check logs
   pm2 logs
   ```

---

## Support Resources

- **Hostinger Support**: https://www.hostinger.com/contact
- **Hostinger Knowledge Base**: https://support.hostinger.com
- **Node.js Documentation**: https://nodejs.org/docs
- **Nginx Documentation**: https://nginx.org/en/docs/

---

## Alternative: Use Hostinger's Node.js Hosting

If Hostinger offers Node.js hosting in your plan:

1. Upload your `server/` folder via File Manager
2. Set environment variables in hPanel
3. Configure Node.js app in hosting panel
4. Point domain to the Node.js app
5. Upload frontend build to separate subdomain or folder

Check Hostinger's documentation for specific Node.js hosting instructions.

