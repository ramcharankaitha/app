#!/bin/bash

# Quick Fix Script for UI Not Loading on Hostinger
# Run this via SSH on your Hostinger server

set -e

echo "🔧 Fixing UI Loading Issues..."
echo "=============================="

# Get current directory
PROJECT_DIR="${1:-$HOME/public_html/anitha-stores}"

# Navigate to project
cd "$PROJECT_DIR" || {
    echo "❌ Project directory not found: $PROJECT_DIR"
    echo "Usage: ./fix-ui-hostinger.sh [project-path]"
    exit 1
}

echo "📁 Current directory: $(pwd)"

# Step 1: Check if build exists
echo ""
echo "1️⃣ Checking build folder..."
if [ ! -d "build" ]; then
    echo "⚠️  Build folder not found! Creating it..."
    mkdir -p build
fi

# Step 2: Install dependencies
echo ""
echo "2️⃣ Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✓ node_modules exists, skipping install"
fi

# Step 3: Create .env.production
echo ""
echo "3️⃣ Checking .env.production..."
if [ ! -f ".env.production" ]; then
    echo "⚠️  Creating .env.production..."
    cat > .env.production << 'EOF'
REACT_APP_API_URL=https://yourdomain.com/api
EOF
    echo "⚠️  Please edit .env.production with your actual domain!"
    echo "   Run: nano .env.production"
else
    echo "✓ .env.production exists"
fi

# Step 4: Build frontend
echo ""
echo "4️⃣ Building frontend..."
npm run build

# Step 5: Verify build
echo ""
echo "5️⃣ Verifying build..."
if [ ! -f "build/index.html" ]; then
    echo "❌ Build failed! index.html not found"
    exit 1
fi

if [ ! -d "build/static" ]; then
    echo "❌ Build failed! static folder not found"
    exit 1
fi

echo "✅ Build successful!"
echo "   - index.html: $(ls -lh build/index.html | awk '{print $5}')"
echo "   - Static files: $(ls -1 build/static/js/*.js 2>/dev/null | wc -l) JS files"

# Step 6: Create .htaccess
echo ""
echo "6️⃣ Creating .htaccess..."
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
echo "✅ .htaccess created"

# Step 7: Set permissions
echo ""
echo "7️⃣ Setting file permissions..."
find . -type d -exec chmod 755 {} \; 2>/dev/null
find . -type f -exec chmod 644 {} \; 2>/dev/null
chmod 755 build/
chmod 644 build/index.html
chmod 644 .htaccess
echo "✅ Permissions set"

# Step 8: Check backend
echo ""
echo "8️⃣ Checking backend..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "anitha-stores-api"; then
        echo "✅ Backend is running"
        pm2 status | grep anitha-stores-api
    else
        echo "⚠️  Backend not running. Start it with:"
        echo "   cd server && pm2 start server.js --name anitha-stores-api"
    fi
else
    echo "⚠️  PM2 not installed. Backend might not be running."
fi

# Summary
echo ""
echo "=============================="
echo "✅ Fix Complete!"
echo "=============================="
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env.production with your domain:"
echo "   nano .env.production"
echo "   Change: REACT_APP_API_URL=https://yourdomain.com/api"
echo ""
echo "2. Rebuild after editing:"
echo "   npm run build"
echo ""
echo "3. Check document root in hPanel:"
echo "   Should point to: $(pwd)/build"
echo ""
echo "4. Visit your website and check browser console (F12)"
echo ""
echo "🔍 Verify build:"
echo "   ls -la build/"
echo "   ls -la build/index.html"
echo ""

