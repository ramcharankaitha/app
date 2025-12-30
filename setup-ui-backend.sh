#!/bin/bash

# Complete Setup Script: UI + Backend on Hostinger
# Run this via SSH on your Hostinger server

set -e

echo "🚀 Complete Setup: UI + Backend"
echo "================================"

PROJECT_DIR="$HOME/public_html/anitha-stores"
BACKEND_DIR="$PROJECT_DIR/server"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if project exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Project not found: $PROJECT_DIR${NC}"
    exit 1
fi

# ============================================
# BACKEND SETUP
# ============================================
echo ""
echo "1️⃣ Setting up Backend..."
cd "$BACKEND_DIR"

# Create .env if missing
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Creating .env file...${NC}"
    cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=CHANGE_ME
PORT=5000
NODE_ENV=production
JWT_SECRET=CHANGE_ME_32_CHARS_MINIMUM
FRONTEND_URL=https://yourdomain.com
EOF
    echo -e "${YELLOW}⚠️  Please edit server/.env with your actual values!${NC}"
else
    echo -e "${GREEN}✓${NC} .env exists"
    
    # Check if FRONTEND_URL is set
    if ! grep -q "FRONTEND_URL=https://" .env 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Adding FRONTEND_URL to .env...${NC}"
        echo "" >> .env
        echo "FRONTEND_URL=https://yourdomain.com" >> .env
        echo -e "${YELLOW}⚠️  Please edit server/.env and set your domain!${NC}"
    fi
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}✓${NC} node_modules exists"
fi

# Install PM2
echo "⚙️  Installing PM2..."
npm install -g pm2 2>/dev/null || echo -e "${YELLOW}⚠️  PM2 already installed or install failed${NC}"

# Start/Restart backend
echo "🚀 Starting backend..."
if pm2 list | grep -q "anitha-stores-api"; then
    echo "Restarting backend..."
    pm2 restart anitha-stores-api
else
    echo "Starting backend for the first time..."
    pm2 start server.js --name anitha-stores-api
    pm2 save
    
    # Setup startup
    STARTUP_CMD=$(pm2 startup 2>/dev/null | grep -o 'sudo.*' || echo "")
    if [ ! -z "$STARTUP_CMD" ]; then
        echo -e "${YELLOW}⚠️  Run this to enable PM2 on boot:${NC}"
        echo "   $STARTUP_CMD"
    fi
fi

echo -e "${GREEN}✓${NC} Backend status:"
pm2 status | grep anitha-stores-api || true

# Test backend
echo "🔍 Testing backend..."
sleep 2
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend is responding"
else
    echo -e "${YELLOW}⚠️  Backend not responding yet (may need a moment)${NC}"
fi

# ============================================
# FRONTEND SETUP
# ============================================
echo ""
echo "2️⃣ Setting up Frontend..."
cd "$PROJECT_DIR"

# Create .env.production if missing
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  Creating .env.production file...${NC}"
    cat > .env.production << 'EOF'
REACT_APP_API_URL=https://yourdomain.com/api
EOF
    echo -e "${YELLOW}⚠️  Please edit .env.production with your actual domain!${NC}"
else
    echo -e "${GREEN}✓${NC} .env.production exists"
    
    # Check if it has correct format
    if ! grep -q "REACT_APP_API_URL=https://" .env.production 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Fixing .env.production...${NC}"
        cat > .env.production << 'EOF'
REACT_APP_API_URL=https://yourdomain.com/api
EOF
        echo -e "${YELLOW}⚠️  Please edit .env.production with your domain!${NC}"
    fi
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}✓${NC} node_modules exists"
fi

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Verify build
if [ ! -d "build" ] || [ ! -f "build/index.html" ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Build successful"
echo "   Build size: $(du -sh build | cut -f1)"

# Create .htaccess
echo "📝 Creating .htaccess..."
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

chmod 644 .htaccess
echo -e "${GREEN}✓${NC} .htaccess created"

# Set permissions
echo "🔧 Setting file permissions..."
find . -type d -exec chmod 755 {} \; 2>/dev/null
find . -type f -exec chmod 644 {} \; 2>/dev/null
chmod 755 build/
chmod 644 build/index.html

# Create uploads directories
mkdir -p "$BACKEND_DIR/uploads"/{aadhar,avatars,llr} 2>/dev/null
chmod -R 755 "$BACKEND_DIR/uploads" 2>/dev/null

echo -e "${GREEN}✓${NC} Permissions set"

# ============================================
# SUMMARY
# ============================================
echo ""
echo "=================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=================================="
echo ""
echo "📋 IMPORTANT: Edit these files with your actual domain:"
echo ""
echo "1. Backend .env:"
echo "   nano $BACKEND_DIR/.env"
echo "   Set: FRONTEND_URL=https://YOUR_DOMAIN.com"
echo "   Set: DB_PASSWORD=your_database_password"
echo "   Set: JWT_SECRET=your_secret_key_32_chars_min"
echo ""
echo "2. Frontend .env.production:"
echo "   nano $PROJECT_DIR/.env.production"
echo "   Set: REACT_APP_API_URL=https://YOUR_DOMAIN.com/api"
echo ""
echo "3. After editing, rebuild frontend:"
echo "   cd $PROJECT_DIR"
echo "   npm run build"
echo ""
echo "4. Restart backend:"
echo "   pm2 restart anitha-stores-api"
echo ""
echo "🔍 Check status:"
echo "   pm2 status"
echo "   pm2 logs anitha-stores-api"
echo ""
echo "🌐 Test your website:"
echo "   https://yourdomain.com"
echo ""
echo "📊 Current Status:"
pm2 status
echo ""

