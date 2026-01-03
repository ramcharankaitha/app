# Verify Endpoints Deployment Checklist

## Issue
All "Mark as Verified" endpoints are returning "Cannot PUT /api/{module}/{id}/verify" errors on the hosted server.

## Root Cause
The verify endpoints exist in the codebase but haven't been deployed to the hosted server, or the server hasn't been restarted after deployment.

## All Verify Endpoints

### Transaction Menu Modules

1. **Dispatch Department**
   - Route: `PUT /api/dispatch/:id/verify`
   - File: `server/routes/dispatch.js` (line 193)
   - Status: ✅ Configured

2. **Stock In**
   - Route: `PUT /api/stock/in/:id/verify`
   - File: `server/routes/stock.js` (line 775)
   - Status: ✅ Configured

3. **Stock Out**
   - Route: `PUT /api/stock/out/:id/verify`
   - File: `server/routes/stock.js` (line 817)
   - Status: ✅ Configured

4. **Services**
   - Route: `PUT /api/services/:id/verify`
   - File: `server/routes/services.js` (line 313)
   - Status: ✅ Configured

5. **Sales Orders**
   - Route: `PUT /api/sales-orders/:id/verify`
   - File: `server/routes/salesOrders.js` (line 494)
   - Status: ✅ Configured

6. **Chit Receipt (Chit Entries)**
   - Route: `PUT /api/chit-plans/entries/:id/verify`
   - File: `server/routes/chitPlans.js` (line 484)
   - Status: ✅ Configured

7. **Purchase Orders**
   - Route: `PUT /api/purchase-orders/:id/verify`
   - File: `server/routes/purchaseOrders.js` (line 260)
   - Status: ✅ Configured

8. **Quotations**
   - Route: `PUT /api/quotations/:id/verify`
   - File: `server/routes/quotations.js` (line 472)
   - Status: ✅ Configured

9. **Payment Menu**
   - Route: `PUT /api/payments/:id/verify`
   - File: `server/routes/payments.js` (line 86)
   - Status: ✅ Configured

## Deployment Steps

### For Render.com:
1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Add verify endpoints for all transaction modules"
   git push origin main
   ```

2. **Verify deployment:**
   - Go to Render dashboard
   - Check if auto-deploy triggered
   - Wait for deployment to complete
   - Check deployment logs for any errors

3. **Restart service (if needed):**
   - In Render dashboard, click "Manual Deploy" → "Deploy latest commit"
   - Or restart the service manually

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
1. Upload all route files to server:
   - `server/routes/dispatch.js`
   - `server/routes/stock.js`
   - `server/routes/services.js`
   - `server/routes/salesOrders.js`
   - `server/routes/chitPlans.js`
   - `server/routes/purchaseOrders.js`
   - `server/routes/quotations.js`
   - `server/routes/payments.js`

2. Restart Node.js server

## Verification

After deployment, test each endpoint:

```bash
# Test Dispatch
curl -X PUT https://your-api.com/api/dispatch/1/verify

# Test Stock In
curl -X PUT https://your-api.com/api/stock/in/1/verify

# Test Stock Out
curl -X PUT https://your-api.com/api/stock/out/1/verify

# Test Services
curl -X PUT https://your-api.com/api/services/1/verify

# Test Sales Orders
curl -X PUT https://your-api.com/api/sales-orders/1/verify

# Test Chit Entry
curl -X PUT https://your-api.com/api/chit-plans/entries/1/verify

# Test Purchase Orders
curl -X PUT https://your-api.com/api/purchase-orders/1/verify

# Test Quotations
curl -X PUT https://your-api.com/api/quotations/1/verify

# Test Payments
curl -X PUT https://your-api.com/api/payments/1/verify
```

## Expected Response

All endpoints should return:
```json
{
  "success": true,
  "{module}": { /* record data */ },
  "message": "{Module} verified successfully"
}
```

## Debugging

If errors persist after deployment:

1. **Check server logs** for console.log messages:
   - Look for: `[Dispatch Verify]`, `[Stock In Verify]`, etc.
   - These logs confirm the route is being hit

2. **Verify route registration:**
   - Check `server/server.js` to ensure all routes are registered:
     ```javascript
     app.use('/api/dispatch', dispatchRoutes);
     app.use('/api/stock', stockRoutes);
     app.use('/api/services', serviceRoutes);
     app.use('/api/sales-orders', salesOrdersRoutes);
     app.use('/api/chit-plans', chitPlanRoutes);
     app.use('/api/purchase-orders', purchaseOrdersRoutes);
     app.use('/api/quotations', quotationsRoutes);
     app.use('/api/payments', paymentsRoutes);
     ```

3. **Check route order:**
   - Verify routes must come BEFORE generic `/:id` routes
   - Example: `PUT /:id/verify` must come before `PUT /:id`

4. **Check database:**
   - Ensure `is_verified` columns exist in all tables
   - The routes will auto-create them, but verify if needed

## Notes

- All verify routes include automatic column creation if `is_verified` doesn't exist
- All verify routes include console logging for debugging
- All verify routes are properly ordered before generic routes
- All routes are registered in `server/server.js`

