# Fix: Only Login Page Loading (No Dashboard After Login)

## 🔍 Problem: Login Page Shows But App Doesn't Work

If you can see the login page but:
- Can't login
- Login works but dashboard doesn't load
- API calls fail
- Pages show 404 after login

Follow these fixes:

---

## ✅ Step 1: Check Backend is Running

**Connect via SSH:**
```bash
ssh username@ssh.yourdomain.com
```

**Check if backend is running:**
```bash
pm2 status
```

**If backend is NOT running:**
```bash
cd ~/public_html/anitha-stores/server

# Check if .env exists
ls -la .env

# If missing, create it
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=YOUR_DATABASE_PASSWORD
PORT=5000
NODE_ENV=production
JWT_SECRET=YOUR_SECRET_KEY_32_CHARS_MIN
FRONTEND_URL=https://yourdomain.com
EOF

# Edit with your values
nano .env

# Install dependencies if needed
npm install

# Start backend
pm2 start server.js --name anitha-stores-api
pm2 save
```

**Check backend logs:**
```bash
pm2 logs anitha-stores-api --lines 50
```

---

## ✅ Step 2: Test API Connection

**Test if API is accessible:**
```bash
# Test local API
curl http://localhost:5000/api/health

# Test public API
curl https://yourdomain.com/api/health
```

**If API doesn't respond:**
- Backend not running → Start it (Step 1)
- Port blocked → Check firewall
- Wrong URL → Check .env.production

---

## ✅ Step 3: Fix API URL in Frontend

**Check .env.production:**
```bash
cd ~/public_html/anitha-stores
cat .env.production
```

**Should show:**
```
REACT_APP_API_URL=https://yourdomain.com/api
```

**If wrong or missing:**
```bash
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://yourdomain.com/api
EOF

# Edit with YOUR domain
nano .env.production

# Rebuild frontend
npm run build
```

**Important:** Replace `yourdomain.com` with your actual domain!

---

## ✅ Step 4: Fix .htaccess for React Router

**Check if .htaccess exists:**
```bash
cd ~/public_html/anitha-stores
ls -la .htaccess
```

**If missing or wrong, create it:**
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

chmod 644 .htaccess
```

---

## ✅ Step 5: Check Browser Console for Errors

**Open your website:**
1. Press `F12` to open Developer Tools
2. Go to **"Console"** tab
3. Look for errors:
   - **CORS errors** → Backend CORS not configured
   - **404 errors** → API URL wrong
   - **Network errors** → Backend not running
   - **Route errors** → .htaccess not working

**Common errors:**

**Error: "Failed to fetch" or CORS**
```bash
# Check server/server.js CORS settings
cd ~/public_html/anitha-stores/server
grep -i "cors" server.js
```

**Error: 404 on /api/...**
- Check API URL in .env.production
- Check if backend is running
- Check .htaccess proxy settings

---

## ✅ Step 6: Complete Fix Script

**Run this complete fix:**
```bash
#!/bin/bash

echo "🔧 Fixing Login Page Only Issue..."

# Navigate to project
cd ~/public_html/anitha-stores

# 1. Check backend
echo "1️⃣ Checking backend..."
if ! pm2 list | grep -q "anitha-stores-api"; then
    echo "⚠️  Backend not running! Starting..."
    cd server
    
    # Create .env if missing
    if [ ! -f .env ]; then
        echo "Creating .env..."
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
        echo "⚠️  Edit server/.env with your values!"
    fi
    
    # Install dependencies
    npm install
    
    # Start backend
    pm2 start server.js --name anitha-stores-api
    pm2 save
    cd ..
else
    echo "✅ Backend is running"
fi

# 2. Fix frontend .env.production
echo "2️⃣ Fixing frontend API URL..."
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://yourdomain.com/api
EOF
echo "⚠️  Edit .env.production with your domain!"

# 3. Rebuild frontend
echo "3️⃣ Rebuilding frontend..."
npm run build

# 4. Fix .htaccess
echo "4️⃣ Fixing .htaccess..."
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

# 5. Set permissions
echo "5️⃣ Setting permissions..."
chmod 644 .htaccess
chmod 755 build/
chmod 644 build/index.html

echo "✅ Fix complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env.production: nano .env.production"
echo "   Change: REACT_APP_API_URL=https://YOUR_DOMAIN.com/api"
echo ""
echo "2. Edit server/.env: nano server/.env"
echo "   Add your database credentials"
echo ""
echo "3. Rebuild: npm run build"
echo ""
echo "4. Restart backend: pm2 restart anitha-stores-api"
```

---

## 🎯 Quick Fix Commands

**Copy and paste these:**

```bash
# 1. Connect
ssh username@ssh.yourdomain.com

# 2. Go to project
cd ~/public_html/anitha-stores

# 3. Start backend (if not running)
cd server
pm2 start server.js --name anitha-stores-api || pm2 restart anitha-stores-api
pm2 save
cd ..

# 4. Fix API URL
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://yourdomain.com/api
EOF
nano .env.production  # Edit with YOUR domain

# 5. Rebuild
npm run build

# 6. Fix .htaccess
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

# 7. Check status
pm2 status
curl http://localhost:5000/api/health
```

---

## 🔍 Diagnostic Commands

**Check what's wrong:**
```bash
# Check backend
pm2 status
pm2 logs anitha-stores-api --lines 20

# Check API
curl http://localhost:5000/api/health
curl https://yourdomain.com/api/health

# Check frontend config
cat .env.production

# Check backend config
cat server/.env

# Check build
ls -la build/index.html

# Check .htaccess
cat .htaccess
```

---

## 🆘 Common Issues

### Issue 1: Login Button Does Nothing

**Cause:** API not responding

**Fix:**
```bash
# Check backend
pm2 status
# If not running:
cd server && pm2 start server.js --name anitha-stores-api
```

### Issue 2: Login Works But Dashboard Blank

**Cause:** API URL wrong or CORS issue

**Fix:**
```bash
# Check .env.production
cat .env.production
# Should be: REACT_APP_API_URL=https://yourdomain.com/api
# Rebuild: npm run build
```

### Issue 3: 404 After Login

**Cause:** React Router not configured

**Fix:**
```bash
# Check .htaccess exists and has rewrite rules
cat .htaccess
# If missing, create it (see Step 4)
```

### Issue 4: CORS Error in Console

**Cause:** Backend CORS not allowing your domain

**Fix:**
```bash
# Check server/server.js
cd server
grep -i "cors" server.js
# Should allow your domain
```

---

## ✅ Verification Checklist

After fixes, verify:

- [ ] Backend running: `pm2 status` shows "anitha-stores-api"
- [ ] API responds: `curl http://localhost:5000/api/health`
- [ ] .env.production has correct domain
- [ ] Frontend rebuilt: `ls -la build/index.html`
- [ ] .htaccess exists with rewrite rules
- [ ] No errors in browser console (F12)
- [ ] Can login successfully
- [ ] Dashboard loads after login

---

**Run the quick fix commands above and your app should work!**

