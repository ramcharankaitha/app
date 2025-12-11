# How to View Database Table Data

## Option 1: Using pgAdmin (Recommended - GUI Tool)

### Steps:
1. **Open pgAdmin**
   - pgAdmin should be installed with PostgreSQL
   - Look for it in your Start Menu or Applications

2. **Connect to Server**
   - Open pgAdmin
   - In the left panel, expand "Servers"
   - Click on your PostgreSQL server (usually "PostgreSQL 15" or similar)
   - Enter your PostgreSQL password when prompted

3. **Navigate to Database**
   - Expand "Databases"
   - Expand "anitha_stores"
   - Expand "Schemas"
   - Expand "public"
   - Expand "Tables"

4. **View Table Data**
   - Right-click on any table (e.g., `users`, `staff`, `products`)
   - Select "View/Edit Data" → "All Rows"
   - You'll see all the data in a table format

### Tables Available:
- `users` - Managers data
- `staff` - Staff members data
- `products` - Products inventory
- `stores` - Store information
- `admin_profile` - Admin profile data

---

## Option 2: Using psql Command Line

### Steps:
1. **Open Command Prompt or PowerShell**

2. **Connect to Database**
   ```bash
   psql -U postgres -d anitha_stores
   ```
   Enter your PostgreSQL password when prompted

3. **View Table Data**
   ```sql
   -- View all managers
   SELECT * FROM users;

   -- View all staff
   SELECT * FROM staff;

   -- View all products
   SELECT * FROM products;

   -- View admin profile
   SELECT * FROM admin_profile;

   -- View stores
   SELECT * FROM stores;
   ```

4. **Exit psql**
   ```sql
   \q
   ```

---

## Option 3: Using SQL Queries in pgAdmin

1. Open pgAdmin and connect to your database
2. Right-click on "anitha_stores" database
3. Select "Query Tool"
4. Run queries like:
   ```sql
   -- View all managers with their details
   SELECT id, first_name, last_name, email, username, role, store_allocated 
   FROM users;

   -- View all staff
   SELECT id, full_name, email, username, role, store_allocated 
   FROM staff;

   -- View all products
   SELECT * FROM products;
   ```

---

## Option 4: View in Application (I can create this)

I can create a database viewer page in your admin panel that shows all table data in a nice UI format. Would you like me to add this?

---

## Quick Check Commands

### Check if tables exist:
```sql
\dt
```

### View table structure:
```sql
\d users
\d staff
\d products
```

### Count records:
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM staff;
SELECT COUNT(*) FROM products;
```

---

## Troubleshooting

### If you can't find pgAdmin:
- It might not have been installed
- Download it separately from: https://www.pgadmin.org/download/

### If psql command not found:
- Make sure PostgreSQL bin directory is in your PATH
- Or use full path: `C:\Program Files\PostgreSQL\15\bin\psql.exe`

### If connection fails:
- Make sure PostgreSQL service is running
- Check your password in `server/.env` file
- Verify database name is `anitha_stores`

