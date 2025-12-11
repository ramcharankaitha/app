# How to Start the Database and Server

This guide will help you start PostgreSQL database and the application servers.

## Step 1: Start PostgreSQL Database Server

### Windows

**Option A: Using Services (Recommended)**
1. Press `Win + R` to open Run dialog
2. Type `services.msc` and press Enter
3. Find "postgresql-x64-XX" (where XX is your version number)
4. Right-click and select "Start"
5. Verify it shows "Running" status

**Option B: Using Command Line**
```bash
# Open Command Prompt as Administrator
net start postgresql-x64-14
# Replace 14 with your PostgreSQL version number
```

**Option C: Using pgAdmin**
1. Open pgAdmin
2. PostgreSQL service should start automatically when you connect

### macOS

**Using Homebrew:**
```bash
brew services start postgresql@14
# Replace 14 with your PostgreSQL version
```

**Using Launchpad:**
1. Open System Preferences
2. Go to PostgreSQL
3. Click "Start"

### Linux (Ubuntu/Debian)

```bash
sudo systemctl start postgresql
# Or for specific version
sudo systemctl start postgresql@14-main
```

### Verify PostgreSQL is Running

Open a terminal/command prompt and run:
```bash
psql -U postgres -c "SELECT version();"
```

If you see PostgreSQL version info, the database server is running!

---

## Step 2: Verify Database Exists

Connect to PostgreSQL and check if the database exists:

```bash
psql -U postgres
```

Then in the psql prompt:
```sql
\l
```

Look for `anitha_stores` in the list. If it doesn't exist, create it:
```sql
CREATE DATABASE anitha_stores;
\q
```

---

## Step 3: Configure Environment Variables

Make sure you have a `server/.env` file with the correct database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

PORT=5000
NODE_ENV=development

JWT_SECRET=your_jwt_secret_key_here
```

**Important:** Replace `your_postgres_password_here` with your actual PostgreSQL password!

---

## Step 4: Install Dependencies (If Not Already Done)

**Backend:**
```bash
cd server
npm install
cd ..
```

**Frontend:**
```bash
npm install
```

---

## Step 5: Start the Backend Server

**Option A: From Root Directory (Recommended)**
```bash
cd server
npm start
# or for development with auto-reload
npm run dev
```

**Option B: From Root Directory (Both Servers)**
```bash
npm run dev
```

This will start:
- Backend API server on **http://localhost:5000**
- React frontend on **http://localhost:3000**

---

## Step 6: Verify Everything is Running

### Check Backend Server
Open browser and go to: **http://localhost:5000/api/health**

You should see:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### Check Frontend
Open browser and go to: **http://localhost:3000**

You should see the login page.

---

## Quick Start Commands Summary

### Start Everything (Recommended)
```bash
# From root directory
npm run dev
```

### Start Separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm start
```

---

## Troubleshooting

### PostgreSQL Not Starting

**Windows:**
- Check if PostgreSQL service is installed
- Try restarting the service from Services panel
- Check Windows Event Viewer for errors

**macOS:**
```bash
brew services list
brew services restart postgresql@14
```

**Linux:**
```bash
sudo systemctl status postgresql
sudo journalctl -u postgresql
```

### Database Connection Error

1. **Check PostgreSQL is running:**
   ```bash
   psql -U postgres -c "SELECT 1;"
   ```

2. **Verify .env file exists:**
   ```bash
   cd server
   cat .env
   ```

3. **Check database exists:**
   ```bash
   psql -U postgres -l
   ```

4. **Test connection manually:**
   ```bash
   psql -U postgres -d anitha_stores
   ```

### Port Already in Use

**Backend (Port 5000):**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

**Frontend (Port 3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### "Failed to fetch" Error

This usually means:
1. **Backend server is not running** - Start it with `cd server && npm start`
2. **Wrong API URL** - Check `REACT_APP_API_URL` in your `.env` file
3. **CORS issue** - Backend CORS is configured, but verify server is running

---

## Default Login Credentials

Once everything is running:
- **Email:** `admin@anithastores.com`
- **Password:** `admin123`

---

## What Happens When Server Starts

When you start the backend server, it will:
1. ✅ Connect to PostgreSQL database
2. ✅ Initialize database schema (creates tables)
3. ✅ Create default admin profile
4. ✅ Create default stores
5. ✅ Start listening on port 5000

You should see messages like:
```
✅ Database schema initialized successfully
✅ Default admin profile created
✅ Default stores created
✅ Database initialization completed
🚀 Server is running on http://localhost:5000
📡 API endpoints available at http://localhost:5000/api
```

---

## Need Help?

If you're still having issues:
1. Check the console/terminal for error messages
2. Verify PostgreSQL is running
3. Check your `.env` file has correct credentials
4. Make sure the database `anitha_stores` exists
5. Check that ports 3000 and 5000 are not in use

