# Product Edit Internal Server Error - Fix

## Issue
Getting "Internal server error" when editing products in the master menu on the hosted website.

## Root Cause
The product update route was referencing undefined variables `prevQty` and `prevMinQty`, causing a ReferenceError that resulted in a 500 Internal Server Error.

## Fix Applied

**File: `server/routes/products.js`**

1. **Added code to fetch previous product values** before updating:
   ```javascript
   // Fetch previous product values before updating
   const prevResult = await pool.query('SELECT current_quantity, minimum_quantity FROM products WHERE id = $1', [id]);
   if (prevResult.rows.length === 0) {
     return res.status(404).json({ error: 'Product not found' });
   }

   const prevProduct = prevResult.rows[0];
   const prevQty = parseInt(prevProduct.current_quantity) || 0;
   const prevMinQty = parseInt(prevProduct.minimum_quantity) || 0;
   ```

2. **Improved error logging** to help debug future issues:
   ```javascript
   console.error('Update product error:', error);
   console.error('Error details:', {
     message: error.message,
     code: error.code,
     detail: error.detail,
     stack: error.stack
   });
   ```

## Deployment Steps

### For Render.com:
1. **Commit and push changes:**
   ```bash
   git add server/routes/products.js
   git commit -m "Fix product edit internal server error - fetch previous values before update"
   git push origin main
   ```

2. **Verify deployment:**
   - Go to Render dashboard
   - Check if auto-deploy triggered
   - Wait for deployment to complete
   - Check deployment logs for any errors

3. **Restart service (if needed):**
   - In Render dashboard, click "Manual Deploy" → "Deploy latest commit"

### For Hostinger VPS (PM2):
1. **SSH into your server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Navigate to project directory:**
   ```bash
   cd /path/to/your/project/server
   ```

3. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

4. **Restart PM2:**
   ```bash
   pm2 restart all
   # Or restart specific app
   pm2 restart ecosystem.config.js
   ```

5. **Check logs:**
   ```bash
   pm2 logs
   ```

### For Manual Deployment:
1. Upload the updated file:
   - `server/routes/products.js`

2. Restart Node.js server

## Verification

After deployment, test the product edit functionality:
1. Go to Master Menu → Products
2. Click "Edit" on any product
3. Make changes and click "Save"
4. Verify the product updates successfully without errors

## What Was Fixed

- **Before**: Code tried to use `prevQty` and `prevMinQty` variables that were never defined, causing a ReferenceError
- **After**: Code now fetches the previous product values from the database before updating, allowing proper comparison for low stock alerts

## Additional Notes

- The fix ensures that low stock alerts work correctly by comparing previous and new stock quantities
- Error logging has been improved to help debug any future issues
- The route now properly handles all product update scenarios

