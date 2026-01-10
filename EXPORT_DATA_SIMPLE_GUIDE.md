# 🚀 Export Data from Railway - Simple Guide (No Admin Rights Needed!)

## ✅ Option 1: Use Node.js Script (EASIEST - No Installation!)

**You already have this script in your project!** It uses the `pg` library that's already installed.

### Step 1: Get Your Railway Connection String

**From Railway Dashboard:**
1. Go to Railway → Your Project → PostgreSQL → Variables
2. Copy the `DATABASE_URL` value
   - Format: `postgresql://postgres:PASSWORD@centerbeam.proxy.rlwy.net:13307/railway`

**Or build it manually:**
- Host: `centerbeam.proxy.rlwy.net`
- Port: `13307`
- Database: `railway`
- User: `postgres`
- Password: (from Railway Variables)

### Step 2: Run Export Script

**Open PowerShell in your project directory:**

```powershell
cd D:\projects\app

# Run the export script
node export_with_node.js "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway"
```

**Replace `YOUR_PASSWORD` with your actual Railway password!**

### Step 3: Check Output

**The script will create:**
- `backup.sql` - Complete database backup
- Individual table files (optional)

**Verify:**
```powershell
Get-Item backup.sql
```

---

## ✅ Option 2: Use API Endpoint (If Render is Still Connected to Old Database)

**If your Render deployment is still connected to the old Railway database:**

### Step 1: Call Export API

**Open browser or use curl:**

```
https://your-render-app.onrender.com/api/export/complete-backup
```

**Or use PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://your-render-app.onrender.com/api/export/complete-backup" -OutFile "backup.json"
```

### Step 2: Convert JSON to SQL

**Use the converter script:**
```powershell
node convert_json_to_sql.js backup.json backup.sql
```

### Step 3: Import to New Database

**After setting up new Railway:**
```powershell
# You'll need PostgreSQL client for this, or use Node.js import script
```

---

## ✅ Option 3: Install PostgreSQL Client (If You Want pg_dump)

**If you prefer using `pg_dump` directly:**

### Step 1: Run PowerShell as Administrator

**Right-click PowerShell → "Run as Administrator"**

### Step 2: Install PostgreSQL

```powershell
# Add Chocolatey to PATH (if needed)
$env:Path += ";C:\ProgramData\chocolatey\bin"

# Install PostgreSQL
choco install postgresql15 -y
```

### Step 3: Restart PowerShell

**Close and reopen PowerShell** (important for PATH update)

### Step 4: Export

```powershell
pg_dump "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" > backup.sql
```

---

## 🎯 Recommended: Use Option 1 (Node.js Script)

**Why?**
- ✅ No admin rights needed
- ✅ No installation needed
- ✅ Uses existing dependencies
- ✅ Works immediately

**Just run:**
```powershell
cd D:\projects\app
node export_with_node.js "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway"
```

---

## 📋 Quick Checklist

- [ ] Got connection string from Railway Variables
- [ ] Ran `node export_with_node.js "connection-string"`
- [ ] Verified `backup.sql` file exists
- [ ] Checked file size (should be > 0 bytes)

---

## 🔍 Troubleshooting

### Issue: "Cannot find module 'pg'"

**Solution:**
```powershell
cd D:\projects\app
npm install
```

### Issue: "Connection refused"

**Check:**
- Connection string is correct
- Using external hostname (not `postgres.railway.internal`)
- Public networking is enabled in Railway
- Password is correct

### Issue: "Script not found"

**Check:**
```powershell
Test-Path "D:\projects\app\export_with_node.js"
```

**If missing, the script should be in your project root.**

---

**Last Updated:** Simple export guide using Node.js (no admin rights needed)

