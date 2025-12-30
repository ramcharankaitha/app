#!/bin/bash

# Hostinger Deployment Script
# Run this script on your Hostinger server via SSH

set -e  # Exit on error

echo "🚀 Starting Hostinger Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$HOME/public_html/anitha-stores"
BACKEND_DIR="$PROJECT_DIR/server"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    echo "Please clone or upload your project first."
    exit 1
fi

# Navigate to project
cd "$PROJECT_DIR"
echo -e "${GREEN}✓${NC} Navigated to: $PROJECT_DIR"

# Check if .env files exist
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  Backend .env file not found!${NC}"
    echo "Creating template .env file..."
    cat > "$BACKEND_DIR/.env" << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=CHANGE_ME
PORT=5000
NODE_ENV=production
JWT_SECRET=CHANGE_ME_MIN_32_CHARS
FRONTEND_URL=https://yourdomain.com
EOF
    echo -e "${YELLOW}⚠️  Please edit $BACKEND_DIR/.env with your actual values!${NC}"
    echo "Run: nano $BACKEND_DIR/.env"
fi

if [ ! -f "$PROJECT_DIR/.env.production" ]; then
    echo -e "${YELLOW}⚠️  Frontend .env.production not found!${NC}"
    echo "Creating template .env.production file..."
    cat > "$PROJECT_DIR/.env.production" << 'EOF'
REACT_APP_API_URL=https://yourdomain.com/api
EOF
    echo -e "${YELLOW}⚠️  Please edit $PROJECT_DIR/.env.production with your domain!${NC}"
    echo "Run: nano $PROJECT_DIR/.env.production"
fi

# Install frontend dependencies
echo ""
echo -e "${GREEN}📦 Installing frontend dependencies...${NC}"
npm install --production=false

# Install backend dependencies
echo ""
echo -e "${GREEN}📦 Installing backend dependencies...${NC}"
cd "$BACKEND_DIR"
npm install --production=false
cd "$PROJECT_DIR"

# Build frontend
echo ""
echo -e "${GREEN}🏗️  Building frontend...${NC}"
npm run build

# Check if build succeeded
if [ ! -d "$PROJECT_DIR/build" ]; then
    echo -e "${RED}❌ Build failed! Build directory not found.${NC}"
    exit 1
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo ""
    echo -e "${GREEN}⚙️  Installing PM2...${NC}"
    npm install -g pm2
fi

# Start or restart backend with PM2
echo ""
echo -e "${GREEN}🚀 Starting/Restarting backend...${NC}"
cd "$BACKEND_DIR"

if pm2 list | grep -q "anitha-stores-api"; then
    echo "Backend already running, restarting..."
    pm2 restart anitha-stores-api
else
    echo "Starting backend for the first time..."
    pm2 start server.js --name anitha-stores-api
    pm2 save
    
    # Setup PM2 startup
    echo ""
    echo -e "${YELLOW}⚠️  Setting up PM2 startup...${NC}"
    STARTUP_CMD=$(pm2 startup | grep -o 'sudo.*')
    if [ ! -z "$STARTUP_CMD" ]; then
        echo "Run this command to enable PM2 on boot:"
        echo -e "${GREEN}$STARTUP_CMD${NC}"
    fi
fi

cd "$PROJECT_DIR"

# Set file permissions
echo ""
echo -e "${GREEN}🔧 Setting file permissions...${NC}"
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod +x "$BACKEND_DIR/server.js" 2>/dev/null || true

# Create uploads directories
echo ""
echo -e "${GREEN}📁 Creating upload directories...${NC}"
mkdir -p "$BACKEND_DIR/uploads/aadhar"
mkdir -p "$BACKEND_DIR/uploads/avatars"
mkdir -p "$BACKEND_DIR/uploads/llr"
chmod -R 755 "$BACKEND_DIR/uploads"

# Create .htaccess for React Router
echo ""
echo -e "${GREEN}📝 Creating .htaccess...${NC}"
cat > "$PROJECT_DIR/.htaccess" << 'EOF'
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

# Summary
echo ""
echo -e "${GREEN}=================================="
echo "✅ Deployment Complete!"
echo "==================================${NC}"
echo ""
echo "📊 PM2 Status:"
pm2 status
echo ""
echo "🔍 Check backend logs:"
echo "   pm2 logs anitha-stores-api"
echo ""
echo "🔄 Restart backend:"
echo "   pm2 restart anitha-stores-api"
echo ""
echo "🌐 Test your API:"
echo "   curl http://localhost:5000/api/health"
echo ""
echo -e "${YELLOW}⚠️  Don't forget to:${NC}"
echo "   1. Edit $BACKEND_DIR/.env with your database credentials"
echo "   2. Edit $PROJECT_DIR/.env.production with your domain"
echo "   3. Setup SSL certificate"
echo "   4. Configure Nginx/Apache if needed"
echo ""

