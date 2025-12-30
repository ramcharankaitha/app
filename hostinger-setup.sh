#!/bin/bash

# Hostinger Deployment Setup Script
# Run this script on your Hostinger VPS/Cloud server

echo "🚀 Starting Hostinger Deployment Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js 18.x
echo -e "${YELLOW}Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node -v)
echo -e "${GREEN}Node.js installed: $NODE_VERSION${NC}"

# Install PostgreSQL
echo -e "${YELLOW}Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Install Git
echo -e "${YELLOW}Installing Git...${NC}"
apt install -y git

# Install PM2
echo -e "${YELLOW}Installing PM2...${NC}"
npm install -g pm2

# Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
apt install -y nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx

# Install Certbot for SSL
echo -e "${YELLOW}Installing Certbot for SSL...${NC}"
apt install -y certbot python3-certbot-nginx

# Setup firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
echo "y" | ufw enable

# Create application directory
echo -e "${YELLOW}Creating application directory...${NC}"
mkdir -p /var/www/anitha-stores
chown $SUDO_USER:$SUDO_USER /var/www/anitha-stores

echo ""
echo -e "${GREEN}✅ Basic setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Clone your repository:"
echo "   cd /var/www/anitha-stores"
echo "   git clone https://github.com/your-username/your-repo.git ."
echo ""
echo "2. Setup backend:"
echo "   cd server"
echo "   npm install"
echo "   nano .env  # Add your environment variables"
echo ""
echo "3. Setup database:"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE anitha_stores;"
echo "   CREATE USER postgres WITH PASSWORD 'your_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE anitha_stores TO postgres;"
echo ""
echo "4. Build frontend:"
echo "   cd /var/www/anitha-stores"
echo "   npm install"
echo "   npm run build"
echo ""
echo "5. Configure Nginx (see HOSTINGER_DEPLOYMENT_GUIDE.md)"
echo ""
echo "6. Start backend with PM2:"
echo "   cd server"
echo "   pm2 start server.js --name anitha-stores-api"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "7. Setup SSL:"
echo "   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo ""

