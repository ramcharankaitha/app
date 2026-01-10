# 🔧 Railway Public Networking Connection String Setup

## ✅ Your Public Networking Details

**Host:** `centerbeam.proxy.rlwy.net`  
**Port:** `13307`

This is Railway's **public networking proxy** - perfect for connecting from Render!

---

## 📋 Step-by-Step: Build Connection String

### Step 1: Get Database Credentials from Railway

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app
   - Click on your **PostgreSQL service**

2. **Go to "Variables" Tab:**
   - Click **"Variables"** tab
   - You'll see:
     - `PGUSER` - Usually `postgres`
     - `PGPASSWORD` - Your database password
     - `PGDATABASE` - Usually `railway` (or your database name)

3. **Copy these values:**
   - Username: `postgres` (or value from `PGUSER`)
   - Password: (value from `PGPASSWORD`)
   - Database: `railway` (or value from `PGDATABASE`)

### Step 2: Build Connection String

**Format:**
```
postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

**Your Connection String:**
```
postgresql://postgres:[YOUR_PASSWORD]@centerbeam.proxy.rlwy.net:13307/railway
```

**Example (replace with your actual password):**
```
postgresql://postgres:AbCdEf123456@centerbeam.proxy.rlwy.net:13307/railway
```

### Step 3: Update in Render

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Click on your **backend service**

2. **Update DATABASE_URL:**
   - Click **"Environment"** tab
   - Find `DATABASE_URL` variable
   - Click **"Edit"**
   - **Replace** with your new connection string:
     ```
     postgresql://postgres:[YOUR_PASSWORD]@centerbeam.proxy.rlwy.net:13307/railway
     ```
   - **Important:** Replace `[YOUR_PASSWORD]` with your actual password from Railway Variables
   - Click **"Save Changes"**

3. **Render will auto-redeploy** (wait 2-3 minutes)

### Step 4: Verify Connection

1. **Check Render Logs:**
   - Go to **"Logs"** tab
   - Look for:
     ```
     ✅ Using DATABASE_URL for connection (Production mode)
     ✅ Detected Railway database - SSL enabled
     ✅ Database connection test successful
     ```

2. **Test API:**
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```

---

## 🔍 Complete Connection String Example

If your Railway Variables show:
- `PGUSER` = `postgres`
- `PGPASSWORD` = `MySecurePass123`
- `PGDATABASE` = `railway`

Then your connection string is:
```
postgresql://postgres:MySecurePass123@centerbeam.proxy.rlwy.net:13307/railway
```

---

## ⚠️ Important Notes

1. **Password Security:**
   - Never share your password
   - Password is case-sensitive
   - No spaces in password

2. **Port Number:**
   - Public networking uses port `13307` (not the default 5432)
   - This is Railway's proxy port

3. **Hostname:**
   - `centerbeam.proxy.rlwy.net` is Railway's public proxy
   - This allows external connections (from Render)

4. **SSL:**
   - Code automatically enables SSL for Railway
   - Should see: `✅ Detected Railway database - SSL enabled`

---

## 🎯 Quick Checklist

- [ ] Got `PGUSER`, `PGPASSWORD`, `PGDATABASE` from Railway Variables
- [ ] Built connection string: `postgresql://postgres:password@centerbeam.proxy.rlwy.net:13307/railway`
- [ ] Updated `DATABASE_URL` in Render environment variables
- [ ] Replaced `[YOUR_PASSWORD]` with actual password
- [ ] Render service redeployed
- [ ] Logs show: `✅ Database connection test successful`

---

## 🔧 Troubleshooting

### Issue: "Connection refused"

**Solutions:**
1. **Verify password:**
   - Check `PGPASSWORD` in Railway Variables
   - Make sure no extra spaces
   - Password is case-sensitive

2. **Check port:**
   - Should be `13307` (public networking port)
   - NOT `5432` (internal port)

3. **Verify hostname:**
   - Should be `centerbeam.proxy.rlwy.net`
   - This is the public proxy hostname

### Issue: "Authentication failed"

**Solutions:**
1. **Double-check password:**
   - Copy from Railway Variables tab
   - No typos
   - No extra spaces

2. **Verify username:**
   - Usually `postgres`
   - Check `PGUSER` in Railway Variables

### Issue: "Database does not exist"

**Solutions:**
1. **Check database name:**
   - Usually `railway`
   - Check `PGDATABASE` in Railway Variables
   - Use that exact name in connection string

---

## 📝 Connection String Template

```
postgresql://[PGUSER]:[PGPASSWORD]@centerbeam.proxy.rlwy.net:13307/[PGDATABASE]
```

**Replace:**
- `[PGUSER]` → Your username (usually `postgres`)
- `[PGPASSWORD]` → Your password from Railway Variables
- `[PGDATABASE]` → Your database name (usually `railway`)

---

## ✅ After Setup

Once you update the connection string in Render:

1. **Render will auto-redeploy**
2. **Check logs** - should see:
   ```
   ✅ Using DATABASE_URL for connection (Production mode)
   ✅ Detected Railway database - SSL enabled
   ✅ Database connection test successful
   ✅ Database schema is accessible
   ```

3. **Your application should work!**

---

**Last Updated:** Railway public networking connection string setup guide.

