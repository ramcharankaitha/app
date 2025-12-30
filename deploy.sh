#!/bin/bash

# Automated Deployment Script for Hostinger
# Run this script to update your application

echo "🚀 Starting deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from project root.${NC}"
    exit 1
fi

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes from Git...${NC}"
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}Git pull failed!${NC}"
    exit 1
fi

# Install/update frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install

# Build frontend
echo -e "${YELLOW}Building React application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

# Install/update backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd server
npm install

# Restart backend with PM2
echo -e "${YELLOW}Restarting backend server...${NC}"
pm2 restart anitha-stores-api

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}PM2 restart failed, trying to start...${NC}"
    pm2 start server.js --name anitha-stores-api
    pm2 save
fi

# Reload Nginx
echo -e "${YELLOW}Reloading Nginx...${NC}"
sudo systemctl reload nginx

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Check status:"
echo "  pm2 status"
echo "  pm2 logs anitha-stores-api"
echo "  sudo systemctl status nginx"
echo ""

