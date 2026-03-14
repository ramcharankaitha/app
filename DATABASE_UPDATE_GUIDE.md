# 🔄 Database Update Guide

## Your Railway Database Has Expired - Here's How to Update

### Quick Summary
You only need to update **ONE file**: `server/.env`

---

## 📋 Step-by-Step Instructions

### Step 1: Get Your New Database Credentials

**From Railway:**
1. Go to https://railway.app
2. Open your project
3. Click on your PostgreSQL service
4. Go to "Variables" tab
5. Copy the `DATABASE_URL` (it looks like: `postgresql://username:password@host:port/database`)

**OR copy these individual values:**
- `PGHOST` → This is your DB_HOST
- `PGPORT` → This is your DB_PORT (usually 5432)
- `PGDATABASE` → This is your DB_NAME
- `PGUSER` → This is your DB_USER
- `PGPASSWORD` → This is your DB_PASSWORD

---

### Step 2: Update server/.env File

**Option A: Using DATABASE_URL (Recommended)**

Open `server/.env` and replace the database section with:

```env
DATABASE_URL=postgresql://username:password@host:port/database
```

**Option B: Using Individual Credentials**

Open `server/.env` and update these lines:

```env
DB_HOST=your-new-host.railway.app
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=your-new-password
```

---

### Step 3: Test the Connection

```bash
cd server
node setup-database.js
```

You should see:
```
✅ Connected to PostgreSQL server
✅ Database 'anitha_stores' is ready
✅ All tables created successfully
```

---

### Step 4: Restart Your Application

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd ..
npm start
```

---

## 🔍 What Files Are Affected?

### Files You Need to Update:
- ✅ `server/.env` - **THIS IS THE ONLY FILE YOU NEED TO CHANGE**

### Files That Automatically Use the New Config:
- ✅ `server/config/database.js` - Reads from .env automatically
- ✅ `server/setup-database.js` - Reads from .env automatically
- ✅ `server/server.js` - Uses database config automatically
- ✅ All route files - Use the database pool automatically

**You don't need to modify any code files!** Just update the `.env` file.

---

## 🎯 Example Configuration

### For Railway Database:

```env
# Database
DATABASE_URL=postgresql://postgres:xYz123@containers-us-west-123.railway.app:5432/railway

# Server
PORT=5000
NODE_ENV=production

# API
REACT_APP_API_URL=http://localhost:5000/api

# Security
JWT_SECRET=change_this_to_a_secure_random_string

# WhatsApp (Optional)
WHATSAPP_ENABLED=true
TWILIO_ACCOUNT_SID=AC39e6323a2cac70e656f6bcef332b53b8
TWILIO_AUTH_TOKEN=ba45415afe435d80526486f8d8cc260d
TWILIO_WHATSAPP_NUMBER=whatsapp:+18444915079
```

---

## ⚠️ Important Notes

1. **Backup First**: Your current `.env` is already backed up as `server/.env.backup`

2. **SSL is Automatic**: The code automatically detects Railway/Render/Supabase and enables SSL

3. **Connection Pooling**: The code is optimized for Railway's free tier (12 concurrent connections)

4. **No Code Changes**: You don't need to modify any `.js` or `.jsx` files

5. **Environment Variables**: Make sure there are no extra spaces in your `.env` file

---

## 🐛 Troubleshooting

### Error: "password authentication failed"
- Check your `DB_PASSWORD` or `DATABASE_URL` password is correct
- Make sure there are no extra spaces

### Error: "ECONNREFUSED"
- Check your `DB_HOST` is correct
- Make sure the database service is running on Railway

### Error: "database does not exist"
- Run `node setup-database.js` to create the database
- Check your `DB_NAME` or database name in `DATABASE_URL`

### Error: "SSL connection required"
- This should be automatic, but if not, add to `.env`:
  ```env
  DB_SSL=true
  ```

---

## 📞 Need Help?

If you encounter any issues:
1. Check the server console for error messages
2. Verify your Railway database is active
3. Make sure your `.env` file has no syntax errors
4. Try running `node setup-database.js` again

---

## ✅ Checklist

- [ ] Got new database credentials from Railway
- [ ] Updated `server/.env` file
- [ ] Tested connection with `node setup-database.js`
- [ ] Restarted backend server
- [ ] Restarted frontend application
- [ ] Verified application is working

---

**That's it! Your database configuration is now updated.** 🎉
