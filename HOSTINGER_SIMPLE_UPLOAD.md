# Simple Hostinger File Upload Guide

## 🎯 Quick Upload Steps

### Step 1: Login to Hostinger

1. Go to: **https://hpanel.hostinger.com**
2. Login with your credentials

---

### Step 2: Open File Manager

1. Click **"File Manager"** in left sidebar
   - OR
2. Go to **"Files"** → **"File Manager"**

---

### Step 3: Navigate to Your Domain

1. Click on **"public_html"** folder
2. If you have multiple domains, select your domain folder

---

### Step 4: Create Project Folder

1. Click **"New Folder"** button (top menu)
2. Name it: **`anitha-stores`**
3. Click **"Create"** or press Enter
4. Double-click the folder to enter it

---

### Step 5: Upload Your Files

#### Option A: Upload Individual Files/Folders

1. Click **"Upload Files"** button (top menu)
2. Click **"Select Files"** or drag and drop
3. Select these folders/files from your computer:
   - ✅ `src` folder
   - ✅ `public` folder
   - ✅ `server` folder (but NOT server/node_modules or server/.env)
   - ✅ `package.json`
   - ✅ `package-lock.json`
4. Click **"Upload"**
5. Wait for upload to complete

#### Option B: Upload as ZIP (Faster)

1. On your computer, create a ZIP file with:
   - `src` folder
   - `public` folder
   - `server` folder (without node_modules and .env)
   - `package.json`
   - `package-lock.json`

2. In File Manager, click **"Upload Files"**
3. Select your ZIP file
4. Click **"Upload"**
5. After upload, right-click ZIP file → **"Extract"**
6. Delete the ZIP file after extraction

---

## 📁 What Files to Upload

### ✅ UPLOAD THESE:

```
✅ src/                    (React source code)
✅ public/                 (Public assets)
✅ server/                 (Backend code)
   ✅ routes/
   ✅ config/
   ✅ database/
   ✅ services/
   ✅ package.json
   ✅ server.js
✅ package.json            (Root)
✅ package-lock.json       (Root)
```

### ❌ DO NOT UPLOAD:

```
❌ node_modules/           (Will install on server)
❌ server/node_modules/    (Will install on server)
❌ .env                    (Create new on server)
❌ server/.env            (Create new on server)
❌ build/                  (Will generate on server)
❌ .git/                   (Not needed)
❌ *.log                   (Log files)
```

---

## ⚙️ Hostinger Settings to Configure

### 1. Node.js Settings (If Available)

1. Go to: **"Advanced"** → **"Node.js"**
2. Click **"Create Node.js App"**
3. Fill in:
   - **App Name:** `anitha-stores-api`
   - **Node.js Version:** `18.x` or latest
   - **Application Root:** `/public_html/anitha-stores/server`
   - **Application Startup File:** `server.js`
   - **Application URL:** Leave empty or `/api`
4. Click **"Create"**

### 2. Environment Variables

In Node.js settings, add these variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=your_database_password
PORT=5000
NODE_ENV=production
JWT_SECRET=your_secure_random_string_32_chars_min
FRONTEND_URL=https://yourdomain.com
```

### 3. Database Setup

1. Go to: **"Databases"** → **"PostgreSQL Databases"**
2. Click **"Create Database"**
3. Fill in:
   - **Database Name:** `anitha_stores`
   - **Username:** `postgres` (or create new)
   - **Password:** Set strong password
4. Click **"Create"**
5. **Note down:** Host, Port, Database name, Username, Password

### 4. SSL Certificate

1. Go to: **"SSL"** → **"Free SSL"**
2. Select your domain
3. Click **"Install"** or **"Enable"**
4. Wait for activation (few minutes)

---

## 🔧 After Upload - Quick Setup

### 1. Install Dependencies

1. Go to: **"Advanced"** → **"Terminal"**
2. Run these commands:

```bash
cd public_html/anitha-stores
npm install
cd server
npm install
cd ..
npm run build
```

### 2. Create .env File

1. In File Manager, go to `server` folder
2. Click **"New File"**
3. Name it: **`.env`**
4. Double-click to edit
5. Add this content:

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

6. Click **"Save"**

### 3. Create Frontend .env

1. In File Manager, go to root `anitha-stores` folder
2. Click **"New File"**
3. Name it: **`.env.production`**
4. Add:

```env
REACT_APP_API_URL=https://yourdomain.com/api
```

5. Click **"Save"**

### 4. Start Backend

1. Go to: **"Advanced"** → **"Node.js"**
2. Find your app: `anitha-stores-api`
3. Click **"Start"** or **"Restart"**

---

## 📋 Upload Options in File Manager

### Upload Button Options:

1. **"Upload Files"** - Upload individual files
2. **"Upload Folder"** - Upload entire folder (if available)
3. **Drag & Drop** - Drag files directly into browser

### File Options (Right-click):

- **Edit** - Edit text files
- **Rename** - Rename file/folder
- **Copy** - Copy file
- **Move** - Move to another location
- **Delete** - Delete file
- **Download** - Download to computer
- **Extract** - Extract ZIP files
- **Compress** - Create ZIP file
- **Change Permissions** - Set file permissions

### Recommended Permissions:

- **Folders:** `755`
- **Files:** `644`
- **Uploads folder:** `755` (writable)

---

## ✅ Verification Steps

After upload and setup:

1. **Check Files:**
   - [ ] All folders uploaded
   - [ ] No `node_modules` uploaded
   - [ ] `.env` file created

2. **Check Dependencies:**
   - [ ] Frontend dependencies installed
   - [ ] Backend dependencies installed
   - [ ] Frontend built successfully

3. **Check Configuration:**
   - [ ] `.env` file has correct values
   - [ ] Database created
   - [ ] Node.js app created

4. **Test:**
   - [ ] Visit: `https://yourdomain.com`
   - [ ] Check API: `https://yourdomain.com/api/health`
   - [ ] Test login

---

## 🎯 Quick Summary

1. **Login** → hPanel
2. **File Manager** → `public_html`
3. **Create folder** → `anitha-stores`
4. **Upload files** → src, public, server, package.json
5. **Setup Node.js** → Create app
6. **Setup Database** → PostgreSQL
7. **Install dependencies** → Terminal
8. **Create .env** → Backend config
9. **Build frontend** → npm run build
10. **Start backend** → Node.js manager

---

**🚀 Your files are now uploaded to Hostinger!**

For detailed instructions, see `HOSTINGER_FILE_UPLOAD_GUIDE.md`


