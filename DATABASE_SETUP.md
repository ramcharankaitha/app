# PostgreSQL Database Setup Guide

## Prerequisites

1. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/windows/
   - During installation:
     - Remember the password you set for the `postgres` user
     - Default port is `5432` (keep this)
     - Install pgAdmin (optional but recommended)

2. **Verify Installation**
   - Open Command Prompt or PowerShell
   - Run: `psql --version`
   - You should see the PostgreSQL version

## Database Setup Steps

### Step 1: Create Database

**Option A: Using pgAdmin (GUI)**
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on "Databases" → "Create" → "Database"
4. Name: `anitha_stores`
5. Click "Save"

**Option B: Using Command Line**
1. Open Command Prompt or PowerShell
2. Run: `psql -U postgres`
3. Enter your PostgreSQL password
4. Run: `CREATE DATABASE anitha_stores;`
5. Run: `\q` to exit

### Step 2: Configure Backend Environment

1. Navigate to the `server` folder
2. Create a `.env` file (copy from `.env.example` if it exists)
3. Add the following configuration:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

PORT=5000
NODE_ENV=development

JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
```

**Important:** Replace `your_postgres_password_here` with your actual PostgreSQL password!

### Step 3: Install Backend Dependencies

```bash
cd server
npm install
```

### Step 4: Start the Backend Server

```bash
# From the server directory
npm start

# Or for development with auto-reload
npm run dev
```

The server will:
- ✅ Connect to PostgreSQL
- ✅ Create all necessary tables automatically
- ✅ Insert default admin profile
- ✅ Insert default stores
- ✅ Start API server on http://localhost:5000

### Step 5: Verify Database Connection

1. Check the console output - you should see:
   ```
   ✅ Connected to PostgreSQL database
   ✅ Database connection test successful
   ✅ Database schema initialized successfully
   ✅ Default admin profile created
   ✅ Default stores created
   🚀 Server is running on http://localhost:5000
   ```

2. Test the API:
   - Open browser: http://localhost:5000/api/health
   - Should return: `{"status":"OK","message":"Server is running"}`

## Default Credentials

After setup, you can login with:
- **Email:** `admin@anithastores.com`
- **Password:** `admin123`

## Troubleshooting

### Error: "password authentication failed"
- Check your `.env` file - make sure `DB_PASSWORD` matches your PostgreSQL password
- Try resetting PostgreSQL password if needed

### Error: "database does not exist"
- Make sure you created the database `anitha_stores`
- Check the database name in `.env` file

### Error: "connection refused"
- Make sure PostgreSQL service is running
- Check if PostgreSQL is running on port 5432
- Verify `DB_HOST` and `DB_PORT` in `.env`

### Error: "relation does not exist"
- The database schema should be created automatically
- Check server console for initialization errors
- Try restarting the server

## Database Schema

The following tables are created automatically:

- **users** - Store users/managers
- **staff** - Store staff members
- **products** - Product inventory
- **stores** - Store locations
- **admin_profile** - Admin profile information

## API Endpoints

Once the server is running, you can access:

- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/staff` - Get all staff
- `POST /api/staff` - Create staff
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `GET /api/profile` - Get admin profile
- `PUT /api/profile` - Update admin profile

## Running Frontend and Backend Together

From the root directory:

```bash
# Install concurrently if not already installed
npm install --save-dev concurrently

# Run both frontend and backend
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- React frontend on http://localhost:3000

