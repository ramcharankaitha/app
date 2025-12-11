# Environment Configuration Guide

## Quick Fix for Database Connection Error

If you're seeing the error:
```
SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

This means your `.env` file is missing or not configured correctly.

## Step-by-Step Setup

### 1. Navigate to Server Directory
```bash
cd server
```

### 2. Create or Edit `.env` File

Create a file named `.env` in the `server` directory with the following content:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE

PORT=5000
NODE_ENV=development

JWT_SECRET=any_random_string_for_jwt_secret
```

### 3. Replace Placeholder Values

**IMPORTANT:** Replace `YOUR_POSTGRES_PASSWORD_HERE` with your actual PostgreSQL password!

For example, if your PostgreSQL password is `mypassword123`, your `.env` should have:
```env
DB_PASSWORD=mypassword123
```

### 4. Verify Configuration

Run the check script:
```bash
npm run check-env
```

This will show you which environment variables are set and which are missing.

### 5. Start the Server

```bash
npm start
```

## Common Issues

### Issue: "password must be a string"
**Solution:** Make sure `DB_PASSWORD` in `.env` is set to a string value (not empty, not placeholder)

### Issue: "password authentication failed"
**Solution:** 
- Verify your PostgreSQL password is correct
- Make sure there are no extra spaces in `.env` file
- Password should be on the same line as `DB_PASSWORD=`

### Issue: "database does not exist"
**Solution:** Create the database:
```sql
CREATE DATABASE anitha_stores;
```

### Issue: Environment variables not loading
**Solution:**
- Make sure `.env` file is in the `server` directory (not root)
- Check for typos in variable names (should be `DB_PASSWORD` not `DB_PASS`)
- Restart the server after changing `.env`

## Example .env File

Here's a complete example (replace with your actual values):

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=MySecurePassword123

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (can be any random string)
JWT_SECRET=my_super_secret_jwt_key_12345
```

## Testing Connection

After setting up `.env`, test the connection:
```bash
npm start
```

You should see:
```
✅ Connected to PostgreSQL database
✅ Database connection test successful
✅ Database schema initialized successfully
🚀 Server is running on http://localhost:5000
```

If you see errors, check the troubleshooting section above.

