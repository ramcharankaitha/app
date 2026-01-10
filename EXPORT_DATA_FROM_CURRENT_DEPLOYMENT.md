# 📦 Export Data from Current Deployment (No Old Railway Access)

## 🎯 Situation

You don't have access to the old Railway account, but your **Render deployment might still be connected to the old database** (if you haven't updated `DATABASE_URL` yet).

**OR** if you've already updated to new Railway, we can export from the new database (but it will be empty if you just set it up).

---

## ✅ Step 1: Check Current Database Connection

### Option A: If Render Still Connected to Old Database

**If you haven't updated `DATABASE_URL` in Render yet:**

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Click your backend service
   - Go to **"Environment"** tab
   - Check `DATABASE_URL` value

2. **If it still has old Railway connection string:**
   - ✅ **Good!** You can export data from old database
   - Continue to Step 2

3. **If it's already updated to new Railway:**
   - ❌ Data might be lost (unless Railway support can help)
   - Skip to "Alternative Options" section

### Option B: Export from New Database (If Already Updated)

If you've already updated `DATABASE_URL` to new Railway:
- New database will be empty (fresh)
- You'll need to contact Railway support for old data
- Or check if you have any local backups

---

## ✅ Step 2: Export All Data via API

### Method 1: Using Complete Backup Endpoint (Recommended)

I've added a new endpoint that exports **ALL tables**:

**Endpoint:**
```
GET https://your-backend.onrender.com/api/export/complete-backup
```

**How to Use:**

1. **Via Browser:**
   - Open: `https://your-backend.onrender.com/api/export/complete-backup`
   - Right-click → "Save As" → Save as `complete_backup.json`

2. **Via curl (Command Line):**
   ```bash
   curl https://your-backend.onrender.com/api/export/complete-backup > complete_backup.json
   ```

3. **Via Postman/API Client:**
   - GET request to: `https://your-backend.onrender.com/api/export/complete-backup`
   - Save response as JSON file

### Method 2: Export Individual Tables

**Available Endpoints:**
```
GET /api/export/all          → users, staff, products, stores
GET /api/export/sales       → sales data
GET /api/export/services    → services
GET /api/export/sales-orders → sales orders
GET /api/export/purchase-orders → purchase orders
GET /api/export/quotations  → quotations
GET /api/export/stock-in    → stock in transactions
GET /api/export/stock-out   → stock out transactions
GET /api/export/stock-details → stock details
```

**Example:**
```bash
# Export all basic data
curl https://your-backend.onrender.com/api/export/all > basic_data.json

# Export services
curl https://your-backend.onrender.com/api/export/services > services.json

# Export sales
curl https://your-backend.onrender.com/api/export/sales > sales.json
```

---

## ✅ Step 3: Convert JSON to SQL (For Import)

### Option A: Use Online Converter

1. **Export JSON** from API (Step 2)
2. **Use online tool** to convert JSON to SQL INSERT statements
3. **Or use the script below**

### Option B: Create SQL Import File

I'll create a script to convert the JSON export to SQL:

**Save this as `convert_json_to_sql.js`:**

```javascript
const fs = require('fs');

// Read JSON export
const backup = JSON.parse(fs.readFileSync('complete_backup.json', 'utf8'));

let sql = '-- Complete Database Backup\n';
sql += `-- Export Date: ${backup.data.exportDate}\n`;
sql += `-- Total Records: ${backup.data.totalRecords}\n\n`;

// Convert each table to SQL INSERT statements
for (const [tableName, records] of Object.entries(backup.data.tables)) {
  if (records.length === 0) continue;
  
  sql += `\n-- Table: ${tableName}\n`;
  sql += `-- Records: ${records.length}\n\n`;
  
  // Get column names from first record
  const columns = Object.keys(records[0]);
  
  // Generate INSERT statements
  for (const record of records) {
    const values = columns.map(col => {
      const value = record[col];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
      }
      if (typeof value === 'object') {
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      }
      return value;
    });
    
    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  }
  
  sql += '\n';
}

// Write SQL file
fs.writeFileSync('complete_backup.sql', sql);
console.log('✅ SQL file created: complete_backup.sql');
```

**Run it:**
```bash
node convert_json_to_sql.js
```

---

## ✅ Step 4: Import to New Railway Database

### Method 1: Import SQL File

1. **Get New Railway Connection String:**
   ```
   postgresql://postgres:NEW_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway
   ```

2. **Import SQL:**
   ```bash
   psql "postgresql://postgres:NEW_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" < complete_backup.sql
   ```

### Method 2: Import via Railway Dashboard

1. **Go to New Railway → PostgreSQL → Connect**
2. **Open Database Console**
3. **Paste and run SQL statements** from `complete_backup.sql`

---

## 🔍 Check if Old Database is Still Accessible

### Quick Test:

1. **Check Render Logs:**
   - Go to Render Dashboard → Your Backend → Logs
   - Look for database connection messages
   - Check if it's connecting to old or new database

2. **Test Export Endpoint:**
   ```bash
   curl https://your-backend.onrender.com/api/export/complete-backup
   ```
   
   **If you get data:**
   - ✅ Old database is still accessible!
   - Export immediately before it's lost

   **If you get errors:**
   - ❌ Database might be disconnected
   - Try Railway support

3. **Check DATABASE_URL in Render:**
   - Render Dashboard → Backend → Environment
   - Look at `DATABASE_URL`
   - If it has old Railway hostname → Still connected to old DB
   - If it has new Railway hostname → Already switched

---

## 🚨 If Old Database is Already Disconnected

**If Render is already connected to new Railway (empty database):**

### Option 1: Contact Railway Support

1. **Email Railway Support:**
   - Email: support@railway.app
   - Subject: "Data Recovery Request - Expired Account"
   - Explain:
     - Your account expired
     - You need to recover database data
     - Provide old project name/ID if you remember

2. **They might be able to:**
   - Provide temporary access to export data
   - Give you a database dump
   - Help recover data

### Option 2: Check for Local Backups

1. **Search your computer:**
   ```bash
   # Windows
   dir /s *.sql
   dir /s *backup*
   
   # Mac/Linux
   find . -name "*.sql"
   find . -name "*backup*"
   ```

2. **Check common locations:**
   - Downloads folder
   - Desktop
   - Documents
   - Project folder

### Option 3: Check Render Logs

1. **Go to Render Dashboard → Logs**
2. **Search for data:**
   - Some data might be in logs
   - But this won't be complete database

### Option 4: Start Fresh

**If data cannot be recovered:**
- New database will initialize with default data
- You'll need to re-enter data manually
- This is the last resort

---

## 📋 Complete Export Checklist

### Before Export:
- [ ] Check if Render still connected to old database
- [ ] Verify export endpoint works
- [ ] Have storage space for backup file

### During Export:
- [ ] Call `/api/export/complete-backup` endpoint
- [ ] Save JSON response
- [ ] Verify file size > 0
- [ ] Check record counts in response

### After Export:
- [ ] Convert JSON to SQL (if needed)
- [ ] Verify backup file is complete
- [ ] Test import to new database
- [ ] Verify all data imported correctly

---

## 🎯 Quick Commands

### Export All Data:
```bash
curl https://your-backend.onrender.com/api/export/complete-backup > complete_backup.json
```

### Check if Old Database Still Connected:
```bash
# Check what database Render is using
curl https://your-backend.onrender.com/api/export/all
```

### Convert JSON to SQL:
```bash
node convert_json_to_sql.js
```

### Import to New Railway:
```bash
psql "new-connection-string" < complete_backup.sql
```

---

## ⚠️ Important Notes

1. **Time Sensitive:**
   - If old database is still accessible, export **immediately**
   - Railway might delete expired databases after some time

2. **Backup File Size:**
   - Large databases = large JSON files
   - Make sure you have enough storage
   - JSON files can be 10-100MB+ depending on data

3. **Data Format:**
   - Export is in JSON format
   - Need to convert to SQL for import
   - Or use the conversion script provided

4. **Missing Tables:**
   - Some tables might not exist
   - Export will skip missing tables
   - Check summary in export response

---

## ✅ Success Indicators

After export:
- [ ] JSON file downloaded successfully
- [ ] File size > 0
- [ ] Response shows record counts
- [ ] All important tables exported
- [ ] Data looks correct when viewing JSON

After import:
- [ ] No errors during import
- [ ] Record counts match
- [ ] Can login to application
- [ ] All data visible in application

---

## 📞 Still Need Help?

**If old database is inaccessible:**

1. **Railway Support:**
   - support@railway.app
   - Explain your situation
   - Ask for data recovery

2. **Check Alternatives:**
   - Local backups
   - Previous exports
   - Application logs

3. **Last Resort:**
   - Start fresh with new database
   - Re-enter data manually

---

**Last Updated:** Guide for exporting data from current deployment when old Railway account is inaccessible.

