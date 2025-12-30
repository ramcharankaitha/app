# Fix UI Not Loading on Hostinger

## 🔍 Quick Diagnosis & Fix

If your UI is not loading after uploading files to Hostinger, follow these steps:

---

## ✅ Step 1: Check if Build Folder Exists

**Connect via SSH:**
```bash
ssh username@ssh.yourdomain.com
cd ~/public_html/anitha-stores
ls -la
```

**You should see:**
- ✅ `build/` folder
- ✅ `src/` folder
- ✅ `public/` folder
- ✅ `server/` folder

**If `build/` folder is MISSING:**
```bash
# Install dependencies
npm install

# Build the frontend
npm run build

# Verify build was created
ls -la build/
```

---

## ✅ Step 2: Check Web Server Configuration

### Option A: If Using Apache (Shared Hosting)

**Check if .htaccess exists:**
```bash
cd ~/public_html/anitha-stores
ls -la .htaccess
```

**If missing, create it:**
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

# API Proxy
<IfModule mod_proxy.c>
  ProxyPass /api http://localhost:5000/api
  ProxyPassReverse /api http://localhost:5000/api
</IfModule>
EOF
```

**Set correct permissions:**
```bash
chmod 644 .htaccess
```

### Option B: If Using Nginx (VPS)

**Check Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/yourdomain.com
```

**Make sure it points to build folder:**
```nginx
root /home/username/public_html/anitha-stores/build;
index index.html;

location / {
    try_files $uri $uri/ /index.html;
}
```

**Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Step 3: Check File Structure

**Verify correct structure:**
```bash
cd ~/public_html/anitha-stores
tree -L 2
# OR
ls -la
```

**Should look like:**
```
anitha-stores/
├── build/              ← MUST EXIST
│   ├── index.html
│   └── static/
├── src/
├── public/
├── server/
├── package.json
└── .htaccess
```

**If files are in wrong location:**
```bash
# Check where your domain points
# Usually: ~/public_html/yourdomain.com or ~/public_html

# Move files if needed
cd ~/public_html
mv anitha-stores/* .  # If domain root should have files
# OR
# Keep in anitha-stores subfolder and configure domain to point there
```

---

## ✅ Step 4: Check Domain Document Root

**In Hostinger hPanel:**
1. Go to **"Domains"** → **"Manage"**
2. Check **"Document Root"** or **"Website Root"**
3. Should point to:
   - `public_html/anitha-stores/build` (if subfolder)
   - OR `public_html/build` (if files moved to root)

**If wrong, update it:**
- Change Document Root to: `/home/username/public_html/anitha-stores/build`

---

## ✅ Step 5: Build Frontend (If Not Done)

**Connect via SSH:**
```bash
ssh username@ssh.yourdomain.com
cd ~/public_html/anitha-stores
```

**Install dependencies:**
```bash
npm install
```

**Create .env.production:**
```bash
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://yourdomain.com/api
EOF

# Edit with your domain
nano .env.production
```

**Build frontend:**
```bash
npm run build
```

**Verify build:**
```bash
ls -la build/
ls -la build/index.html
ls -la build/static/
```

**Should see:**
- `index.html`
- `static/` folder with JS and CSS files

---

## ✅ Step 6: Check File Permissions

**Set correct permissions:**
```bash
cd ~/public_html/anitha-stores

# Folders: 755
find . -type d -exec chmod 755 {} \;

# Files: 644
find . -type f -exec chmod 644 {} \;

# Build folder specifically
chmod -R 755 build/
chmod 644 build/index.html
```

---

## ✅ Step 7: Check Browser Console

**Open your website in browser:**
1. Press `F12` to open Developer Tools
2. Go to **"Console"** tab
3. Look for errors:
   - 404 errors → Files not found
   - CORS errors → API URL wrong
   - Network errors → Backend not running

**Common errors and fixes:**

**Error: "Failed to fetch" or CORS error**
```bash
# Check .env.production
cat .env.production
# Should have: REACT_APP_API_URL=https://yourdomain.com/api
```

**Error: 404 for static files**
```bash
# Check if build/static exists
ls -la build/static/
# Rebuild if missing
npm run build
```

**Error: Blank page**
```bash
# Check if index.html exists
ls -la build/index.html
# Check .htaccess
cat .htaccess
```

---

## ✅ Step 8: Verify Backend is Running

**Check if backend is running:**
```bash
# Check PM2
pm2 status

# If not running, start it
cd ~/public_html/anitha-stores/server
pm2 start server.js --name anitha-stores-api
pm2 save
```

**Test API:**
```bash
curl http://localhost:5000/api/health
# OR
curl https://yourdomain.com/api/health
```

---

## ✅ Step 9: Complete Fix Script

**Run this complete fix:**
```bash
#!/bin/bash

echo "🔧 Fixing UI Loading Issues..."

# Navigate to project
cd ~/public_html/anitha-stores

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Create .env.production if missing
if [ ! -f .env.production ]; then
    echo "📝 Creating .env.production..."
    cat > .env.production << 'EOF'
REACT_APP_API_URL=https://yourdomain.com/api
EOF
    echo "⚠️  Edit .env.production with your domain!"
fi

# 3. Build frontend
echo "🏗️  Building frontend..."
npm run build

# 4. Create .htaccess if missing
if [ ! -f .htaccess ]; then
    echo "📝 Creating .htaccess..."
    cat > .htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF
fi

# 5. Set permissions
echo "🔧 Setting permissions..."
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 755 build/
chmod 644 build/index.html

# 6. Verify build
echo "✅ Verifying build..."
if [ -d "build" ] && [ -f "build/index.html" ]; then
    echo "✅ Build folder exists!"
    echo "✅ index.html exists!"
else
    echo "❌ Build failed! Check errors above."
    exit 1
fi

echo "✅ Fix complete!"
echo "🌐 Visit: https://yourdomain.com"
```

**Save as `fix-ui.sh` and run:**
```bash
chmod +x fix-ui.sh
./fix-ui.sh
```

---

## 🎯 Quick Fix Commands (Copy-Paste)

**If UI is blank/not loading, run these:**

```bash
# 1. Connect to server
ssh username@ssh.yourdomain.com

# 2. Go to project
cd ~/public_html/anitha-stores

# 3. Install and build
npm install
npm run build

# 4. Create .htaccess
cat > .htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF

# 5. Set permissions
chmod 755 build/
chmod 644 build/index.html
chmod 644 .htaccess

# 6. Check
ls -la build/index.html
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Blank White Page

**Cause:** Build folder missing or wrong document root

**Fix:**
```bash
cd ~/public_html/anitha-stores
npm run build
# Check document root in hPanel points to build folder
```

### Issue 2: 404 Errors for Static Files

**Cause:** Static files not in build/static

**Fix:**
```bash
npm run build
ls -la build/static/
# Should see JS and CSS files
```

### Issue 3: React Router Not Working (404 on refresh)

**Cause:** Missing .htaccess or wrong rewrite rules

**Fix:**
```bash
# Create .htaccess (see Step 2)
# OR check Nginx config
```

### Issue 4: API Calls Failing

**Cause:** Wrong API URL or backend not running

**Fix:**
```bash
# Check .env.production
cat .env.production
# Should be: REACT_APP_API_URL=https://yourdomain.com/api

# Rebuild after changing
npm run build

# Check backend
pm2 status
```

### Issue 5: Files in Wrong Location

**Cause:** Domain points to wrong folder

**Fix:**
```bash
# Check current location
pwd
# Should be: ~/public_html/anitha-stores

# Check domain document root in hPanel
# Should point to: /home/username/public_html/anitha-stores/build
```

---

## ✅ Verification Checklist

After running fixes, verify:

- [ ] `build/` folder exists
- [ ] `build/index.html` exists
- [ ] `build/static/` folder has JS/CSS files
- [ ] `.htaccess` file exists (Apache)
- [ ] Document root points to `build` folder
- [ ] File permissions are correct (755 for folders, 644 for files)
- [ ] `.env.production` has correct API URL
- [ ] Backend is running (`pm2 status`)
- [ ] No errors in browser console (F12)

---

## 🚀 Complete Rebuild Command

**If nothing works, do a complete rebuild:**
```bash
cd ~/public_html/anitha-stores

# Clean everything
rm -rf node_modules
rm -rf build
rm -rf server/node_modules

# Reinstall
npm install
cd server && npm install && cd ..

# Rebuild
npm run build

# Verify
ls -la build/
cat build/index.html | head -20
```

---

**Run the quick fix commands above and your UI should load!**

