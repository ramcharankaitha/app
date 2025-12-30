# Detailed Guide: Upload to Hostinger via ZIP File

## 📦 Complete Step-by-Step ZIP Upload Process

This guide walks you through uploading your entire application to Hostinger using a ZIP file through the File Manager interface.

---

## 📋 Part 1: Prepare ZIP File on Your Computer

### Step 1.1: Clean Your Project Folder

Before creating the ZIP, ensure you have a clean copy:

1. **Open your project folder** on your computer
2. **Delete these folders/files** (if they exist):
   - ❌ `node_modules/` folder
   - ❌ `server/node_modules/` folder
   - ❌ `build/` folder
   - ❌ `.env` file (root)
   - ❌ `server/.env` file
   - ❌ `.git/` folder
   - ❌ Any `*.log` files
   - ❌ `.DS_Store` files (Mac)

### Step 1.2: Verify Required Files

Make sure these folders/files are present:

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

### Step 1.3: Create ZIP File

#### On Windows:

1. **Select all files and folders** in your project directory:
   - Press `Ctrl + A` to select all
   - OR manually select: `src`, `public`, `server`, `package.json`, `package-lock.json`

2. **Right-click** on selected files

3. **Choose:** "Send to" → "Compressed (zipped) folder"

4. **Rename the ZIP file** to: `anitha-stores.zip`

#### On Mac:

1. **Select all files and folders** in your project directory:
   - Press `Cmd + A` to select all
   - OR manually select: `src`, `public`, `server`, `package.json`, `package-lock.json`

2. **Right-click** on selected files

3. **Choose:** "Compress Items"

4. **Rename the ZIP file** to: `anitha-stores.zip`

#### On Linux:

1. **Open Terminal** in your project directory

2. **Run command:**
   ```bash
   zip -r anitha-stores.zip src/ public/ server/ package.json package-lock.json
   ```

3. **Verify ZIP created:**
   ```bash
   ls -lh anitha-stores.zip
   ```

### Step 1.4: Verify ZIP Contents (Optional)

**On Windows:**
- Right-click `anitha-stores.zip` → "Open with" → "Windows Explorer"
- Verify folders: `src`, `public`, `server` are inside

**On Mac:**
- Double-click `anitha-stores.zip` to preview
- Verify all folders are present

**On Linux:**
```bash
unzip -l anitha-stores.zip
```

---

## 🌐 Part 2: Access Hostinger File Manager

### Step 2.1: Login to Hostinger

1. **Open your web browser** (Chrome, Firefox, Edge, etc.)

2. **Go to:** https://hpanel.hostinger.com

3. **Enter your credentials:**
   - Email/Username
   - Password

4. **Click:** "Login" or press Enter

5. **If 2FA enabled:** Enter verification code

### Step 2.2: Navigate to File Manager

**Method 1: From Dashboard**
1. After login, you'll see the **Dashboard**
2. Look for **"File Manager"** in the left sidebar menu
3. Click on **"File Manager"**

**Method 2: From Files Section**
1. Click **"Files"** in the top navigation or left sidebar
2. Click **"File Manager"** from the dropdown/submenu

**Method 3: Direct Access**
1. Look for **"Advanced"** in the left sidebar
2. Click **"Advanced"**
3. Click **"File Manager"**

### Step 2.3: Navigate to Your Domain Root

1. **In File Manager**, you'll see a folder structure
2. **Look for:** `public_html` folder
3. **Click on** `public_html` to enter it
4. **If you have multiple domains:**
   - Look for your specific domain folder
   - Example: `public_html/yourdomain.com`
   - Click on your domain folder

---

## 📁 Part 3: Create Project Folder

### Step 3.1: Create New Folder

1. **In File Manager**, you'll see a toolbar at the top
2. **Look for:** "New Folder" button (usually has a folder icon with a "+")
3. **Click:** "New Folder" button

   **Alternative:**
   - Right-click in empty space → "New Folder"
   - OR press keyboard shortcut (if available)

### Step 3.2: Name the Folder

1. **A popup or input field** will appear
2. **Enter folder name:** `anitha-stores`
3. **Click:** "Create" or "OK" or press Enter

### Step 3.3: Enter the Folder

1. **You'll see** the new `anitha-stores` folder in the file list
2. **Double-click** on `anitha-stores` folder
3. **OR** right-click → "Open" or "Enter"
4. **You should now be inside** the `anitha-stores` folder (check the path at the top)

---

## 📤 Part 4: Upload ZIP File

### Step 4.1: Open Upload Dialog

1. **In File Manager**, look at the top toolbar
2. **Find:** "Upload Files" button (usually has an upload/arrow icon)
3. **Click:** "Upload Files" button

   **Alternative methods:**
   - Right-click in empty space → "Upload Files"
   - Drag and drop ZIP file directly into the browser window

### Step 4.2: Select ZIP File

1. **A file selection dialog** will open (your computer's file browser)
2. **Navigate to** where you saved `anitha-stores.zip`
3. **Click on** `anitha-stores.zip` to select it
4. **Click:** "Open" or "Select" button

   **Note:** 
   - You can select multiple files, but for now, just select the ZIP
   - File size limit is usually 50MB-100MB (check Hostinger limits)

### Step 4.3: Start Upload

1. **After selecting**, you'll see the file in the upload queue
2. **Click:** "Upload" or "Start Upload" button
3. **Wait for upload** to complete
   - You'll see a progress bar
   - Upload time depends on file size and internet speed
   - For a typical project: 2-10 minutes

### Step 4.4: Verify Upload

1. **After upload completes**, you should see:
   - Success message: "Upload completed" or similar
   - `anitha-stores.zip` file in the file list

2. **Verify the file:**
   - Check file name: `anitha-stores.zip`
   - Check file size: Should match your local ZIP size
   - Check upload date/time: Should be current

---

## 📂 Part 5: Extract ZIP File

### Step 5.1: Select ZIP File

1. **In File Manager**, find `anitha-stores.zip` in the file list
2. **Click once** on `anitha-stores.zip` to select it
   - The file should be highlighted

### Step 5.2: Extract ZIP

**Method 1: Right-Click Menu**
1. **Right-click** on `anitha-stores.zip`
2. **Look for:** "Extract" or "Extract Here" option
3. **Click:** "Extract" or "Extract Here"

**Method 2: Toolbar Button**
1. **Select** `anitha-stores.zip`
2. **Look for** "Extract" button in the toolbar
3. **Click:** "Extract" button

**Method 3: Double-Click (If Supported)**
1. **Double-click** on `anitha-stores.zip`
2. **If extraction dialog opens**, click "Extract All" or "Extract Here"

### Step 5.3: Wait for Extraction

1. **Extraction process** will start
2. **You'll see:**
   - Progress indicator
   - "Extracting..." message
   - File count being extracted

3. **Wait for completion:**
   - Small projects: 10-30 seconds
   - Large projects: 1-3 minutes

### Step 5.4: Verify Extraction

1. **After extraction**, you should see:
   - Success message
   - New folders and files in the file list

2. **Verify folder structure:**
   ```
   anitha-stores/
   ├── src/
   ├── public/
   ├── server/
   ├── package.json
   └── package-lock.json
   ```

3. **Check each folder:**
   - Double-click `src` → Should see React components
   - Double-click `public` → Should see `index.html`
   - Double-click `server` → Should see `server.js`, `routes/`, etc.

### Step 5.5: Delete ZIP File (Optional)

1. **Select** `anitha-stores.zip`
2. **Right-click** → "Delete"
3. **OR** select and press `Delete` key
4. **Confirm deletion** if prompted
5. **This saves server space**

---

## ⚙️ Part 6: Configure File Permissions

### Step 6.1: Set Folder Permissions

1. **Right-click** on `anitha-stores` folder
2. **Select:** "Change Permissions" or "Permissions"
3. **Set permissions to:** `755`
   - Owner: Read, Write, Execute (7)
   - Group: Read, Execute (5)
   - Others: Read, Execute (5)
4. **Check:** "Apply to subdirectories" or "Recursive"
5. **Click:** "Save" or "Apply"

### Step 6.2: Set File Permissions

1. **Select** `package.json` file
2. **Right-click** → "Change Permissions"
3. **Set to:** `644`
   - Owner: Read, Write (6)
   - Group: Read (4)
   - Others: Read (4)
4. **Click:** "Save"

5. **Repeat for:**
   - `package-lock.json`
   - `server/package.json`
   - `server/server.js`

### Step 6.3: Create Uploads Folder (If Needed)

1. **Navigate to** `server` folder
2. **Create new folder:** `uploads`
3. **Set permissions:** `755` (writable)
4. **Create subfolders:**
   - `uploads/aadhar`
   - `uploads/avatars`
   - `uploads/llr`
5. **Set each to:** `755`

---

## 🔧 Part 7: Create Environment Files

### Step 7.1: Create Backend .env File

1. **Navigate to** `server` folder
2. **Click:** "New File" button in toolbar
3. **Enter name:** `.env`
4. **Click:** "Create" or press Enter
5. **Double-click** `.env` to edit
6. **Add this content:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=your_database_password_here
PORT=5000
NODE_ENV=production
JWT_SECRET=your_very_secure_random_string_at_least_32_characters_long
FRONTEND_URL=https://yourdomain.com
```

7. **Replace placeholders:**
   - `your_database_password_here` → Your actual database password
   - `your_very_secure_random_string...` → A secure random string (32+ characters)
   - `https://yourdomain.com` → Your actual domain

8. **Click:** "Save" or press `Ctrl+S` (Windows) / `Cmd+S` (Mac)

### Step 7.2: Create Frontend .env.production File

1. **Navigate back to** `anitha-stores` root folder
2. **Click:** "New File" button
3. **Enter name:** `.env.production`
4. **Click:** "Create"
5. **Double-click** to edit
6. **Add this content:**

```env
REACT_APP_API_URL=https://yourdomain.com/api
```

7. **Replace:** `https://yourdomain.com` with your actual domain
8. **Click:** "Save"

---

## 🗄️ Part 8: Setup Database

### Step 8.1: Access Database Manager

1. **In hPanel**, go to **"Databases"** in left sidebar
2. **Click:** "PostgreSQL Databases"
3. **OR** go to **"Advanced"** → **"Databases"** → **"PostgreSQL"**

### Step 8.2: Create Database

1. **Click:** "Create Database" button
2. **Fill in the form:**
   - **Database Name:** `anitha_stores`
   - **Username:** `postgres` (or create new username)
   - **Password:** Enter a strong password
     - Use: Mix of uppercase, lowercase, numbers, symbols
     - Minimum: 12 characters
     - **Save this password!** (You'll need it for `.env`)

3. **Click:** "Create" or "Submit"

### Step 8.3: Note Database Details

After creation, you'll see:
- **Database Name:** `anitha_stores`
- **Username:** `postgres` (or your username)
- **Host:** Usually `localhost` or provided hostname
- **Port:** Usually `5432`
- **Password:** (The one you set)

**Copy these details** - you'll need them for `.env` file

---

## 🚀 Part 9: Install Dependencies

### Step 9.1: Access Terminal

1. **In hPanel**, go to **"Advanced"** in left sidebar
2. **Click:** "Terminal"
3. **OR** go to **"Advanced"** → **"SSH Access"**

### Step 9.2: Navigate to Project

1. **In Terminal**, type:
   ```bash
   cd public_html/anitha-stores
   ```
2. **Press Enter**

3. **Verify location:**
   ```bash
   pwd
   ```
   Should show: `/home/username/public_html/anitha-stores`

### Step 9.3: Install Frontend Dependencies

1. **Run command:**
   ```bash
   npm install
   ```

2. **Wait for installation:**
   - This creates `node_modules` folder
   - Takes 2-5 minutes typically
   - You'll see progress output

3. **Verify:**
   ```bash
   ls -la
   ```
   Should see `node_modules` folder

### Step 9.4: Install Backend Dependencies

1. **Navigate to server:**
   ```bash
   cd server
   ```

2. **Install:**
   ```bash
   npm install
   ```

3. **Wait for completion**

4. **Go back to root:**
   ```bash
   cd ..
   ```

### Step 9.5: Build Frontend

1. **In root directory** (`anitha-stores`), run:
   ```bash
   npm run build
   ```

2. **Wait for build:**
   - Takes 1-3 minutes
   - Creates `build` folder
   - Shows build progress

3. **Verify build:**
   ```bash
   ls -la build
   ```
   Should see `index.html` and `static` folder

---

## ⚙️ Part 10: Configure Node.js (If Available)

### Step 10.1: Access Node.js Manager

1. **In hPanel**, go to **"Advanced"** in left sidebar
2. **Click:** "Node.js"
3. **OR** go to **"Advanced"** → **"Node.js Applications"**

### Step 10.2: Create Node.js App

1. **Click:** "Create Node.js App" or "Add Application" button

2. **Fill in the form:**
   - **App Name:** `anitha-stores-api`
   - **Node.js Version:** Select `18.x` or latest LTS
   - **Application Root:** `/public_html/anitha-stores/server`
   - **Application Startup File:** `server.js`
   - **Application URL:** Leave empty or enter `/api`
   - **Port:** `5000` (or leave default)

3. **Click:** "Create" or "Save"

### Step 10.3: Add Environment Variables

1. **After creating app**, find your app in the list
2. **Click:** "Environment Variables" or "Edit" button
3. **Add each variable:**
   - Click "Add Variable" or "+"
   - Enter name and value
   - Click "Save"

4. **Add these variables:**
   ```
   DB_HOST = localhost
   DB_PORT = 5432
   DB_NAME = anitha_stores
   DB_USER = postgres
   DB_PASSWORD = (your database password)
   PORT = 5000
   NODE_ENV = production
   JWT_SECRET = (your secret key)
   FRONTEND_URL = https://yourdomain.com
   ```

5. **Save all variables**

### Step 10.4: Start Application

1. **Find your app** in the Node.js applications list
2. **Click:** "Start" button
   - OR toggle switch to "On"
3. **Wait for startup** (10-30 seconds)
4. **Check status:** Should show "Running" or green indicator

---

## 🌐 Part 11: Configure Web Server

### Step 11.1: Create .htaccess File (Apache)

1. **In File Manager**, go to `anitha-stores` root folder
2. **Click:** "New File"
3. **Name:** `.htaccess`
4. **Edit and add:**

```apache
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
```

5. **Save file**

### Step 11.2: Setup SSL Certificate

1. **In hPanel**, go to **"SSL"** in left sidebar
2. **Click:** "Free SSL" or "Let's Encrypt"
3. **Select your domain**
4. **Click:** "Install" or "Enable"
5. **Wait for activation** (2-10 minutes)
6. **Verify:** Visit `https://yourdomain.com` (should show padlock)

---

## ✅ Part 12: Verify Installation

### Step 12.1: Test Frontend

1. **Open browser**
2. **Visit:** `https://yourdomain.com`
3. **Check:**
   - ✅ Page loads without errors
   - ✅ No 404 errors in console
   - ✅ SSL certificate active (padlock icon)

### Step 12.2: Test Backend API

1. **Visit:** `https://yourdomain.com/api/health`
   - OR: `https://yourdomain.com/api`
2. **Should see:**
   - JSON response
   - OR "API is running" message
   - OR connection successful

### Step 12.3: Test Application

1. **Visit:** `https://yourdomain.com`
2. **Try to login**
3. **Check browser console** (F12) for errors
4. **Test API calls:**
   - Login
   - Fetch data
   - Create records

---

## 🆘 Troubleshooting

### Issue: ZIP file too large

**Solution:**
- Compress files more (remove unnecessary files)
- Split into multiple ZIPs
- Use FTP instead of File Manager
- Increase upload limit in Hostinger settings

### Issue: Extraction failed

**Solution:**
- Re-upload ZIP file
- Check file permissions
- Try extracting via Terminal:
  ```bash
  cd public_html/anitha-stores
  unzip anitha-stores.zip
  ```

### Issue: Node.js not available

**Solution:**
- Upgrade to VPS/Cloud hosting
- Use Hostinger's Node.js feature (if available)
- Contact Hostinger support
- Alternative: Use PM2 via SSH

### Issue: Database connection failed

**Solution:**
- Verify database credentials in `.env`
- Check database exists
- Verify PostgreSQL is running
- Check firewall settings
- Test connection via Terminal:
  ```bash
  psql -h localhost -U postgres -d anitha_stores
  ```

### Issue: Build failed

**Solution:**
- Check Node.js version (should be 18.x+)
- Verify all files uploaded correctly
- Check `.env.production` file exists
- Review build errors in Terminal

---

## 📋 Final Checklist

After completing all steps, verify:

- [ ] ZIP file uploaded successfully
- [ ] ZIP file extracted correctly
- [ ] All folders present (src, public, server)
- [ ] `.env` file created in server folder
- [ ] `.env.production` created in root
- [ ] Database created
- [ ] Frontend dependencies installed
- [ ] Backend dependencies installed
- [ ] Frontend built successfully
- [ ] Node.js app created and started
- [ ] Environment variables added
- [ ] SSL certificate active
- [ ] Website accessible
- [ ] API endpoints working

---

## 🎯 Quick Reference

### File Structure After Upload:
```
public_html/anitha-stores/
├── build/              (generated)
├── node_modules/       (installed)
├── src/
├── public/
├── server/
│   ├── node_modules/   (installed)
│   ├── .env           (created)
│   └── ...
├── .env.production     (created)
├── .htaccess          (created)
├── package.json
└── package-lock.json
```

### Important Paths:
- **Project Root:** `/public_html/anitha-stores`
- **Backend:** `/public_html/anitha-stores/server`
- **Frontend Build:** `/public_html/anitha-stores/build`
- **Backend .env:** `/public_html/anitha-stores/server/.env`

### Key Commands:
```bash
# Navigate to project
cd public_html/anitha-stores

# Install frontend
npm install

# Install backend
cd server && npm install

# Build frontend
cd .. && npm run build

# Check Node.js version
node -v

# Check if backend is running
ps aux | grep node
```

---

**🎉 Your application is now uploaded and configured on Hostinger!**

For additional help, refer to:
- `HOSTINGER_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `HOSTINGER_UPLOAD_CHECKLIST.md` - Upload checklist

