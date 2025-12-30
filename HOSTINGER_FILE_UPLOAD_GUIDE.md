# Hostinger Direct File Upload Guide

## 📤 Uploading Files via Hostinger File Manager

This guide covers uploading your application directly through Hostinger's File Manager (hPanel) without using Git or SSH.

---

## 📋 Step-by-Step Upload Process

### Step 1: Prepare Files for Upload

#### Files to Upload:

✅ **Upload These:**
- `/src` - React source code
- `/public` - Public assets (images, manifest.json, etc.)
- `/server` - Backend code (but NOT node_modules or .env)
- `package.json` - Frontend dependencies
- `package-lock.json` - Frontend lock file
- `server/package.json` - Backend dependencies
- `server/package-lock.json` - Backend lock file
- `.gitignore` - Git ignore rules
- `README.md` - Documentation (optional)

❌ **DO NOT Upload:**
- `node_modules/` - Will be installed on server
- `server/node_modules/` - Will be installed on server
- `.env` files - Create new ones on server
- `server/.env` - Create new one on server
- `build/` - Will be generated on server
- `.git/` - Not needed
- `*.log` files
- `.DS_Store` files
- `server/uploads/` - Will be created automatically

---

### Step 2: Access Hostinger File Manager

1. **Login to Hostinger:**
   - Go to https://hpanel.hostinger.com
   - Login with your credentials

2. **Open File Manager:**
   - Click on **"File Manager"** in the left sidebar
   - Or go to **"Files"** → **"File Manager"**

3. **Navigate to Your Domain:**
   - Click on **"public_html"** folder
   - Or navigate to your domain's root folder
   - If you have multiple domains, select the correct one

---

### Step 3: Upload Files

#### Option A: Upload via File Manager (Small Projects)

1. **Create Project Folder:**
   - Click **"New Folder"**
   - Name it: `anitha-stores`
   - Click **"Create"**

2. **Enter the Folder:**
   - Double-click `anitha-stores` folder

3. **Upload Files:**
   - Click **"Upload Files"** button
   - Select all files and folders from your local project
   - **Important:** Upload in this structure:
     ```
     anitha-stores/
     ├── src/
     ├── public/
     ├── server/
     │   ├── routes/
     │   ├── config/
     │   ├── database/
     │   ├── services/
     │   ├── package.json
     │   └── server.js
     ├── package.json
     └── package-lock.json
     ```
   - Wait for upload to complete

#### Option B: Upload via FTP (Large Projects - Recommended)

1. **Get FTP Credentials:**
   - In hPanel, go to **"Files"** → **"FTP Accounts"**
   - Create new FTP account or use existing
   - Note down:
     - FTP Host
     - FTP Username
     - FTP Password
     - Port (usually 21)

2. **Use FTP Client:**
   - **Windows:** FileZilla, WinSCP
   - **Mac:** FileZilla, Cyberduck
   - **Linux:** FileZilla, Nautilus

3. **Connect to FTP:**
   - Host: `ftp.yourdomain.com` or IP address
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21

4. **Upload Files:**
   - Navigate to `public_html/anitha-stores/` on server
   - Upload all files maintaining folder structure

---

### Step 4: Configure Hostinger Settings

#### A. Enable Node.js (If Available)

1. **Check Node.js Support:**
   - Go to **"Advanced"** → **"Node.js"** in hPanel
   - If available, enable Node.js

2. **Select Node.js Version:**
   - Choose **Node.js 18.x** or latest LTS
   - Set **Application Root:** `/public_html/anitha-stores/server`
   - Set **Application Startup File:** `server.js`
   - Set **Application URL:** `/api` (optional)

3. **Environment Variables:**
   - Add environment variables:
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=anitha_stores
     DB_USER=postgres
     DB_PASSWORD=your_password
     PORT=5000
     NODE_ENV=production
     JWT_SECRET=your_secret_key
     FRONTEND_URL=https://yourdomain.com
     ```

#### B. Setup Database (PostgreSQL)

1. **Access Database Manager:**
   - Go to **"Databases"** → **"PostgreSQL Databases"**

2. **Create Database:**
   - Click **"Create Database"**
   - Database Name: `anitha_stores`
   - Username: `postgres` (or create new)
   - Password: Set a strong password
   - Click **"Create"**

3. **Note Database Details:**
   - Host: Usually `localhost` or provided hostname
   - Port: Usually `5432`
   - Database Name: `anitha_stores`
   - Username: Your database username
   - Password: Your database password

---

### Step 5: Install Dependencies via Terminal

1. **Open Terminal in hPanel:**
   - Go to **"Advanced"** → **"Terminal"**
   - Or use **"SSH Access"** if available

2. **Navigate to Project:**
   ```bash
   cd public_html/anitha-stores
   ```

3. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

4. **Build Frontend:**
   ```bash
   npm run build
   ```

5. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   ```

---

### Step 6: Configure Backend Environment

1. **Create .env File:**
   ```bash
   cd public_html/anitha-stores/server
   nano .env
   ```

2. **Add Configuration:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=anitha_stores
   DB_USER=postgres
   DB_PASSWORD=your_database_password_here
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your_very_secure_random_string_32_chars_minimum
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Save File:**
   - Press `Ctrl+X`
   - Press `Y` to confirm
   - Press `Enter` to save

---

### Step 7: Setup File Permissions

1. **Set Correct Permissions:**
   ```bash
   cd public_html/anitha-stores
   
   # Set folder permissions
   chmod 755 .
   chmod 755 server
   chmod 755 build
   
   # Set file permissions
   chmod 644 package.json
   chmod 644 server/package.json
   chmod 644 server/server.js
   
   # Make uploads folder writable
   mkdir -p server/uploads
   chmod 755 server/uploads
   chmod 755 server/uploads/aadhar
   chmod 755 server/uploads/avatars
   chmod 755 server/uploads/llr
   ```

---

### Step 8: Start Backend Server

#### Option A: Using Hostinger Node.js Manager

1. **Go to Node.js Settings:**
   - **"Advanced"** → **"Node.js"**

2. **Configure:**
   - Application Root: `/public_html/anitha-stores/server`
   - Application Startup File: `server.js`
   - Node.js Version: 18.x

3. **Start Application:**
   - Click **"Start"** or **"Restart"**

#### Option B: Using PM2 (If SSH Available)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd public_html/anitha-stores/server
pm2 start server.js --name anitha-stores-api

# Save PM2 config
pm2 save
```

---

### Step 9: Configure Web Server

#### If Using Apache (Shared Hosting):

1. **Create .htaccess in Root:**
   ```bash
   cd public_html/anitha-stores
   nano .htaccess
   ```

2. **Add Configuration:**
   ```apache
   # React Router - Redirect all to index.html
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>

   # API Proxy (if Apache mod_proxy available)
   ProxyPass /api http://localhost:5000/api
   ProxyPassReverse /api http://localhost:5000/api
   ```

#### If Using Nginx (VPS/Cloud):

1. **Create Nginx Config:**
   - See `nginx-config.conf` file
   - Upload to server and configure

---

### Step 10: Setup Frontend Environment

1. **Create .env.production:**
   ```bash
   cd public_html/anitha-stores
   nano .env.production
   ```

2. **Add API URL:**
   ```env
   REACT_APP_API_URL=https://yourdomain.com/api
   ```

3. **Rebuild Frontend:**
   ```bash
   npm run build
   ```

---

## 📁 Final File Structure on Hostinger

```
public_html/
└── anitha-stores/
    ├── build/                    # React build (generated)
    │   ├── index.html
    │   └── static/
    ├── public/                    # Public assets
    │   ├── index.html
    │   ├── manifest.json
    │   └── googleb2cc2d8ccad0cd7c.html
    ├── src/                       # React source
    │   ├── components/
    │   ├── services/
    │   └── App.js
    ├── server/                    # Backend
    │   ├── routes/
    │   ├── config/
    │   ├── database/
    │   ├── services/
    │   ├── uploads/               # Created automatically
    │   ├── .env                   # Created manually
    │   ├── package.json
    │   └── server.js
    ├── node_modules/              # Installed via npm
    ├── package.json
    └── package-lock.json
```

---

## ⚙️ Hostinger Control Panel Settings

### 1. Domain Settings

- **Domain:** Point to `public_html/anitha-stores/build`
- **Or:** Use subdomain like `app.yourdomain.com`

### 2. SSL Certificate

1. **Go to:** **"SSL"** → **"Free SSL"**
2. **Enable:** Let's Encrypt SSL
3. **Apply to:** Your domain

### 3. PHP Settings (If Applicable)

- **PHP Version:** Not needed (Node.js app)
- **But if required:** PHP 8.0+ for compatibility

### 4. Cron Jobs (Optional - for backups)

1. **Go to:** **"Advanced"** → **"Cron Jobs"**
2. **Create:** Database backup cron job
3. **Command:**
   ```bash
   pg_dump -U postgres anitha_stores > /backup/db_backup_$(date +%Y%m%d).sql
   ```

---

## 🔧 Configuration Options in File Manager

### Upload Settings:

1. **File Size Limit:**
   - Default: Usually 50MB
   - For large uploads, increase in PHP settings

2. **File Types:**
   - Allowed: All file types
   - Blocked: Executable files (.exe, .sh)

3. **Compression:**
   - Enable ZIP upload for faster transfer
   - Extract after upload

### File Permissions:

- **Folders:** 755 (rwxr-xr-x)
- **Files:** 644 (rw-r--r--)
- **Executable:** 755 (for scripts)

---

## 📤 Upload Checklist

Before uploading, ensure:

- [ ] All `node_modules` folders excluded
- [ ] All `.env` files excluded
- [ ] `build` folder excluded (will be generated)
- [ ] `.git` folder excluded
- [ ] Folder structure maintained
- [ ] All source files included
- [ ] `package.json` files included
- [ ] `server` folder structure intact

---

## 🚀 After Upload - Quick Setup

1. **Install Dependencies:**
   ```bash
   cd public_html/anitha-stores
   npm install
   cd server && npm install
   ```

2. **Create .env:**
   ```bash
   cd server
   nano .env
   # Add your configuration
   ```

3. **Build Frontend:**
   ```bash
   cd ..
   npm run build
   ```

4. **Start Backend:**
   - Use Hostinger Node.js manager
   - Or PM2 if SSH available

5. **Test:**
   - Visit: `https://yourdomain.com`
   - Check API: `https://yourdomain.com/api/health`

---

## 🆘 Troubleshooting

### Issue: Files not uploading

**Solutions:**
- Check file size limits
- Use FTP for large files
- Compress files before upload
- Upload in smaller batches

### Issue: Node.js not available

**Solutions:**
- Upgrade to VPS/Cloud hosting
- Use Hostinger's Node.js feature (if available)
- Contact Hostinger support

### Issue: Database connection failed

**Solutions:**
- Verify database credentials in `.env`
- Check database exists
- Verify PostgreSQL is running
- Check firewall settings

### Issue: 404 errors

**Solutions:**
- Check `.htaccess` configuration
- Verify file paths
- Check Nginx/Apache configuration
- Ensure `build` folder exists

---

## 📝 Quick Reference

### Upload Methods:

1. **File Manager:** Small files, web interface
2. **FTP:** Large files, faster upload
3. **SSH/SCP:** Advanced users, command line

### Required Files:

- ✅ Source code (`src/`, `server/`)
- ✅ Configuration files (`package.json`)
- ✅ Public assets (`public/`)
- ❌ Dependencies (`node_modules/`)
- ❌ Environment files (`.env`)

### After Upload:

1. Install dependencies
2. Create `.env` file
3. Build frontend
4. Start backend
5. Configure web server

---

**🎯 Your application files are now uploaded to Hostinger!**

Next: Follow the configuration steps to complete the setup.


