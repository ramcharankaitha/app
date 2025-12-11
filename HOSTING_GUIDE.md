# Hosting Guide for Anitha Stores Application

This guide covers multiple hosting options for your React frontend + Node.js backend + PostgreSQL database application.

## 📋 Prerequisites

Before hosting, ensure you have:
1. ✅ Built your React app (`npm run build`)
2. ✅ Database credentials ready
3. ✅ Environment variables configured
4. ✅ Git repository (recommended)

---

## 🚀 Option 1: Vercel (Frontend) + Railway/Render (Backend) - **RECOMMENDED**

### **Frontend on Vercel** (Free tier available)

1. **Build your React app:**
   ```bash
   npm run build
   ```

2. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Add environment variable: `REACT_APP_API_URL=https://your-backend-url.com/api`

4. **Or use Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Set build command: `npm run build`
   - Set output directory: `build`
   - Add environment variable: `REACT_APP_API_URL`

### **Backend on Railway** (Free tier available)

1. **Go to [railway.app](https://railway.app)**
2. **Create new project → Deploy from GitHub**
3. **Select your repository**
4. **Configure:**
   - Root directory: `server`
   - Build command: (none needed)
   - Start command: `npm start`
5. **Add environment variables:**
   - `PORT=5000`
   - `DB_HOST=your-db-host`
   - `DB_PORT=5432`
   - `DB_NAME=your-db-name`
   - `DB_USER=your-db-user`
   - `DB_PASSWORD=your-db-password`
   - `JWT_SECRET=your-secret-key`
6. **Add PostgreSQL database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will auto-create and provide connection details

### **Backend on Render** (Free tier available)

1. **Go to [render.com](https://render.com)**
2. **Create new Web Service**
3. **Connect your GitHub repository**
4. **Configure:**
   - Name: `anitha-stores-backend`
   - Environment: `Node`
   - Build command: (leave empty)
   - Start command: `cd server && npm start`
   - Root directory: (leave empty)
5. **Add environment variables** (same as Railway)
6. **Add PostgreSQL database:**
   - Create new PostgreSQL database
   - Copy connection string to environment variables

---

## 🐳 Option 2: Docker + Any Cloud Provider

### **Create Dockerfile for Backend**

Create `server/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### **Create Dockerfile for Frontend**

Create `Dockerfile` in root:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### **Create nginx.conf**

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Create docker-compose.yml**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: anitha_stores
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    environment:
      PORT: 5000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: anitha_stores
      DB_USER: postgres
      DB_PASSWORD: your_password
      JWT_SECRET: your_jwt_secret
    depends_on:
      - postgres
    ports:
      - "5000:5000"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      - backend
    ports:
      - "80:80"
```

**Deploy to:**
- **DigitalOcean App Platform**
- **AWS ECS/Fargate**
- **Google Cloud Run**
- **Azure Container Instances**

---

## ☁️ Option 3: AWS (Full Stack)

### **Frontend: AWS S3 + CloudFront**

1. **Build React app:**
   ```bash
   npm run build
   ```

2. **Upload to S3:**
   - Create S3 bucket
   - Enable static website hosting
   - Upload `build/` contents
   - Set bucket policy for public read

3. **CloudFront Distribution:**
   - Create distribution
   - Origin: S3 bucket
   - Default root object: `index.html`
   - Error pages: 404 → `/index.html` (for React Router)

### **Backend: AWS Elastic Beanstalk or EC2**

**Elastic Beanstalk:**
1. Install EB CLI: `pip install awsebcli`
2. Initialize: `eb init`
3. Create environment: `eb create`
4. Deploy: `eb deploy`

**EC2:**
1. Launch EC2 instance (Ubuntu)
2. Install Node.js and PM2
3. Clone repository
4. Set up environment variables
5. Use PM2 to run: `pm2 start server/server.js`

### **Database: AWS RDS PostgreSQL**

1. Create RDS PostgreSQL instance
2. Configure security groups
3. Update backend environment variables

---

## 🌐 Option 4: Heroku (Simple but Limited Free Tier)

### **Frontend + Backend on Heroku**

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Login:**
   ```bash
   heroku login
   ```

3. **Create apps:**
   ```bash
   heroku create anitha-stores-frontend
   heroku create anitha-stores-backend
   ```

4. **Backend Setup:**
   ```bash
   cd server
   heroku git:remote -a anitha-stores-backend
   heroku addons:create heroku-postgresql:hobby-dev
   heroku config:set JWT_SECRET=your-secret
   git push heroku main
   ```

5. **Frontend Setup:**
   - Use `heroku-buildpack-static` for React
   - Create `static.json`:
   ```json
   {
     "root": "build",
     "clean_urls": false,
     "routes": {
       "/**": "index.html"
     }
   }
   ```

---

## 🔧 Option 5: Self-Hosted (VPS)

### **Using DigitalOcean, Linode, or Vultr**

1. **Create VPS** (Ubuntu 22.04, 2GB RAM minimum)

2. **SSH into server:**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install dependencies:**
   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs

   # Install PostgreSQL
   apt install -y postgresql postgresql-contrib

   # Install Nginx
   apt install -y nginx

   # Install PM2
   npm install -g pm2
   ```

4. **Set up PostgreSQL:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE anitha_stores;
   CREATE USER your_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE anitha_stores TO your_user;
   \q
   ```

5. **Clone and setup backend:**
   ```bash
   cd /var/www
   git clone your-repo-url
   cd app/server
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   pm2 start server.js --name backend
   pm2 save
   pm2 startup
   ```

6. **Build and setup frontend:**
   ```bash
   cd /var/www/app
   npm install
   npm run build
   ```

7. **Configure Nginx:**
   ```bash
   nano /etc/nginx/sites-available/anitha-stores
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend
       location / {
           root /var/www/app/build;
           try_files $uri $uri/ /index.html;
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
   }
   ```

   ```bash
   ln -s /etc/nginx/sites-available/anitha-stores /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

8. **Setup SSL (Let's Encrypt):**
   ```bash
   apt install certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

---

## 📝 Environment Variables Checklist

### **Frontend (.env or hosting platform):**
```
REACT_APP_API_URL=https://your-backend-url.com/api
```

### **Backend (.env):**
```
PORT=5000
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

---

## 🔍 Quick Comparison

| Platform | Frontend | Backend | Database | Cost | Difficulty |
|----------|----------|---------|----------|------|------------|
| **Vercel + Railway** | ✅ Free | ✅ Free | ✅ Free | $0 | ⭐ Easy |
| **Vercel + Render** | ✅ Free | ✅ Free | ✅ Free | $0 | ⭐ Easy |
| **Heroku** | ✅ Free* | ✅ Free* | ✅ Free* | $0-7/mo | ⭐⭐ Medium |
| **AWS** | ✅ S3 | ✅ EC2/EB | ✅ RDS | $10-50/mo | ⭐⭐⭐ Hard |
| **VPS** | ✅ Nginx | ✅ Node | ✅ PostgreSQL | $5-20/mo | ⭐⭐⭐ Hard |
| **Docker** | ✅ Any | ✅ Any | ✅ Any | Varies | ⭐⭐ Medium |

*Heroku free tier discontinued, but paid tier starts at $7/month

---

## 🎯 Recommended Setup for Beginners

**Best Option: Vercel (Frontend) + Railway (Backend)**

1. ✅ Easiest to set up
2. ✅ Free tier available
3. ✅ Automatic deployments from Git
4. ✅ Built-in PostgreSQL database
5. ✅ Great documentation

---

## 🚨 Important Notes

1. **Update API URL in frontend:**
   - Update `src/services/api.js` to use production API URL
   - Or use environment variable: `REACT_APP_API_URL`

2. **CORS Configuration:**
   - Ensure backend allows your frontend domain
   - Update CORS settings in `server/server.js` if needed

3. **Database Migrations:**
   - Run database initialization on first deployment
   - Your `initDatabase()` function should handle this

4. **Security:**
   - Never commit `.env` files
   - Use strong JWT secrets
   - Enable HTTPS in production
   - Set up proper firewall rules

5. **Monitoring:**
   - Set up error tracking (Sentry, LogRocket)
   - Monitor server health
   - Set up uptime monitoring

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [AWS Documentation](https://aws.amazon.com/documentation/)
- [DigitalOcean Tutorials](https://www.digitalocean.com/community/tags/node-js)

---

## 🆘 Need Help?

If you encounter issues:
1. Check server logs
2. Verify environment variables
3. Test database connection
4. Check CORS settings
5. Verify API endpoints are accessible

Good luck with your deployment! 🚀

