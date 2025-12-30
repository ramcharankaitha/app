# Hostinger Upload Checklist

## ✅ Pre-Upload Checklist

### Files to Upload:

- [ ] `/src` folder (React source code)
- [ ] `/public` folder (public assets)
- [ ] `/server` folder (backend code - WITHOUT node_modules and .env)
- [ ] `package.json` (root)
- [ ] `package-lock.json` (root)
- [ ] `server/package.json`
- [ ] `server/package-lock.json`
- [ ] `.gitignore`
- [ ] `README.md` (optional)

### Files to EXCLUDE:

- [ ] `node_modules/` ❌
- [ ] `server/node_modules/` ❌
- [ ] `.env` files ❌
- [ ] `server/.env` ❌
- [ ] `build/` folder ❌
- [ ] `.git/` folder ❌
- [ ] `*.log` files ❌
- [ ] `.DS_Store` files ❌
- [ ] `server/uploads/` ❌

---

## 📤 Upload Steps

### Step 1: Prepare Files Locally

1. [ ] Create a clean copy of your project
2. [ ] Remove `node_modules` folders
3. [ ] Remove `.env` files
4. [ ] Remove `build` folder
5. [ ] Compress to ZIP (optional, for faster upload)

### Step 2: Access Hostinger

1. [ ] Login to https://hpanel.hostinger.com
2. [ ] Open File Manager
3. [ ] Navigate to `public_html`
4. [ ] Create folder: `anitha-stores`

### Step 3: Upload Files

1. [ ] Enter `anitha-stores` folder
2. [ ] Click "Upload Files"
3. [ ] Select all prepared files
4. [ ] Wait for upload to complete
5. [ ] Verify folder structure

### Step 4: Extract (If Zipped)

1. [ ] Select ZIP file
2. [ ] Click "Extract"
3. [ ] Verify extraction

---

## ⚙️ Configuration Checklist

### Backend Setup:

- [ ] Create `server/.env` file
- [ ] Add database credentials
- [ ] Add JWT_SECRET
- [ ] Add FRONTEND_URL
- [ ] Install backend dependencies: `cd server && npm install`

### Frontend Setup:

- [ ] Create `.env.production` file
- [ ] Add `REACT_APP_API_URL`
- [ ] Install frontend dependencies: `npm install`
- [ ] Build frontend: `npm run build`

### Database Setup:

- [ ] Create PostgreSQL database
- [ ] Create database user
- [ ] Set database password
- [ ] Note database connection details
- [ ] Run database initialization (if needed)

### Server Setup:

- [ ] Configure Node.js (if available)
- [ ] Set application root
- [ ] Set startup file
- [ ] Add environment variables
- [ ] Start application

### Web Server:

- [ ] Configure Apache `.htaccess` (if shared hosting)
- [ ] Or configure Nginx (if VPS)
- [ ] Setup SSL certificate
- [ ] Test website access

---

## 🔍 Verification Checklist

### After Upload:

- [ ] Files uploaded successfully
- [ ] Folder structure correct
- [ ] No missing files
- [ ] File permissions set correctly

### After Configuration:

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Frontend built successfully
- [ ] `.env` file created
- [ ] Database connection working
- [ ] Backend server running
- [ ] Frontend accessible
- [ ] API endpoints working

### Testing:

- [ ] Visit: `https://yourdomain.com`
- [ ] Check API: `https://yourdomain.com/api/health`
- [ ] Test login functionality
- [ ] Test API calls
- [ ] Check browser console for errors
- [ ] Verify SSL certificate active

---

## 📋 File Structure Verification

After upload, verify this structure:

```
public_html/anitha-stores/
├── src/
│   ├── components/
│   ├── services/
│   └── App.js
├── public/
│   ├── index.html
│   └── manifest.json
├── server/
│   ├── routes/
│   ├── config/
│   ├── database/
│   ├── package.json
│   └── server.js
├── package.json
└── package-lock.json
```

---

## 🚨 Common Issues to Check

- [ ] File permissions correct (755 for folders, 644 for files)
- [ ] `.env` file has correct database credentials
- [ ] Node.js version is 18.x or higher
- [ ] PostgreSQL is running
- [ ] Database exists and is accessible
- [ ] Port 5000 is available (or change in .env)
- [ ] CORS allows your domain
- [ ] SSL certificate is active
- [ ] API URL matches your domain

---

## ✅ Final Checklist

- [ ] All files uploaded
- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Database setup complete
- [ ] Backend running
- [ ] Frontend built
- [ ] Website accessible
- [ ] API working
- [ ] SSL active
- [ ] Testing complete

---

**🎯 Ready to deploy! Follow the checklist step by step.**


