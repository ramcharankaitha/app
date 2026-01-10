# ✅ Verify Chocolatey and Install PostgreSQL

## 🔍 Step 1: Verify Chocolatey is Installed

**Test if Chocolatey works:**

```powershell
choco --version
```

**If you get an error:**
- Chocolatey might not be in PATH
- Or you need to restart PowerShell

**Try these:**

### Option A: Restart PowerShell
1. **Close PowerShell completely**
2. **Open new PowerShell as Administrator**
3. **Try:** `choco --version`

### Option B: Refresh Environment
```powershell
# Refresh environment variables
refreshenv

# Or manually add to PATH for this session
$env:Path += ";C:\ProgramData\chocolatey\bin"
```

### Option C: Use Full Path
```powershell
& "C:\ProgramData\chocolatey\bin\choco.exe" --version
```

---

## ✅ Step 2: Install PostgreSQL

**Once Chocolatey is working, install PostgreSQL:**

```powershell
# Run PowerShell as Administrator
choco install postgresql15 -y
```

**Or if you want latest version:**
```powershell
choco install postgresql -y
```

**Wait for installation** (2-5 minutes)

---

## ✅ Step 3: Restart PowerShell

**IMPORTANT:** After installation, **close and reopen PowerShell** so PATH is updated.

---

## ✅ Step 4: Verify PostgreSQL Installation

```powershell
pg_dump --version
psql --version
```

**Should show version numbers**

---

## ✅ Step 5: Export Data

**Once pg_dump works:**

```powershell
# Get connection string from Railway Variables
# Then export:
pg_dump "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" > backup.sql
```

---

## 🚀 Alternative: Use Node.js Script (No Installation Needed)

**If Chocolatey/PostgreSQL installation is taking too long:**

```powershell
# Go to your project directory
cd D:\projects\app

# Run Node.js export script (uses pg library already in your project)
node export_with_node.js "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway"
```

**This doesn't require pg_dump!**

---

## 📋 Quick Checklist

- [ ] Chocolatey installed (`choco --version` works)
- [ ] PostgreSQL installed (`choco install postgresql15`)
- [ ] PowerShell restarted
- [ ] `pg_dump --version` works
- [ ] Got connection string from Railway
- [ ] Exported database (`pg_dump "connection" > backup.sql`)
- [ ] Verified backup file exists

---

**Last Updated:** Verify Chocolatey and install PostgreSQL guide.

