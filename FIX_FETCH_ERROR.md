# 🔧 Fix "Cannot Fetch Data" Error on Other Laptops

## Problem
Other laptops/devices cannot see data because the frontend is trying to connect to `localhost` instead of your live backend.

## Root Cause
The `REACT_APP_API_URL` environment variable is not set in Vercel, so the app falls back to `http://localhost:5000/api`.

---

## ✅ Solution: Set Environment Variable in Vercel

### Step 1: Get Your Backend URL
1. Go to your Render/Railway dashboard
2. Find your backend service
3. Copy the URL (e.g., `https://anitha-stores-backend.onrender.com`)

### Step 2: Add Environment Variable in Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Login to your account
   - Select your project

2. **Navigate to Settings**
   - Click on your project
   - Go to **Settings** tab
   - Click **Environment Variables** in the left sidebar

3. **Add New Variable**
   - Click **"Add New"** button
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`
     - ⚠️ **Important**: Include `/api` at the end!
     - Example: `https://anitha-stores-backend.onrender.com/api`
   - **Environment**: Select **Production**, **Preview**, and **Development** (or just Production)
   - Click **Save**

4. **Redeploy Your Frontend**
   - Go to **Deployments** tab
   - Click the **"..."** menu on the latest deployment
   - Click **"Redeploy"**
   - Or push a new commit to trigger automatic redeploy

### Step 3: Verify Backend CORS

Make sure your backend allows your Vercel frontend:

1. **Go to Render/Railway Dashboard**
2. **Add Environment Variable** in backend:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://your-vercel-app.vercel.app`
     - Replace with your actual Vercel app URL
     - No trailing slash!

3. **Redeploy Backend** (if needed)

---

## 🔍 Verify It's Working

### Test 1: Check Browser Console
1. Open your Vercel app in a browser
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Look for any errors mentioning `localhost` or `Failed to fetch`
5. Check **Network** tab - API calls should go to your backend URL

### Test 2: Check Environment Variable
1. In browser console, type:
   ```javascript
   console.log(process.env.REACT_APP_API_URL)
   ```
2. Should show your backend URL (not `undefined` or `localhost`)

### Test 3: Test API Endpoint
1. Visit: `https://your-backend-url.onrender.com/api/health`
2. Should see: `{"status":"OK","message":"Server is running"}`

---

## 🚨 Common Issues & Fixes

### Issue 1: Still seeing localhost errors
**Fix:**
- Make sure you redeployed Vercel after adding the variable
- Clear browser cache (Ctrl+Shift+Delete)
- Check variable name is exactly `REACT_APP_API_URL` (case-sensitive)

### Issue 2: CORS errors
**Fix:**
- Add `FRONTEND_URL` in backend environment variables
- Make sure it matches your Vercel URL exactly
- Redeploy backend

### Issue 3: "Network error: Could not connect to server"
**Fix:**
- Verify backend is running (check Render/Railway dashboard)
- Test backend health endpoint directly
- Check backend logs for errors

### Issue 4: Environment variable not updating
**Fix:**
- Variables starting with `REACT_APP_` require a rebuild
- Redeploy frontend after adding variable
- Don't use `.env` file in production - use Vercel dashboard

---

## 📝 Quick Checklist

- [ ] Backend is deployed and running
- [ ] Backend URL is accessible (test `/api/health`)
- [ ] `REACT_APP_API_URL` is set in Vercel
- [ ] `FRONTEND_URL` is set in backend
- [ ] Frontend is redeployed after adding variable
- [ ] Backend is redeployed (if CORS was updated)
- [ ] Browser cache is cleared
- [ ] Tested on different device/network

---

## 🎯 Example Configuration

### Vercel Environment Variables:
```
REACT_APP_API_URL = https://anitha-stores-backend.onrender.com/api
```

### Backend (Render/Railway) Environment Variables:
```
NODE_ENV = production
PORT = 10000
DATABASE_URL = postgresql://postgres:...@shinkansen.proxy.rlwy.net:32058/railway
FRONTEND_URL = https://your-app.vercel.app
```

---

## 💡 Pro Tip

After setting environment variables:
1. **Always redeploy** both frontend and backend
2. **Clear browser cache** on test devices
3. **Test in incognito mode** to avoid cache issues
4. **Check browser console** for specific error messages

---

## ✅ Success Indicators

When it's working correctly:
- ✅ No `localhost` in browser console
- ✅ Network requests go to your backend URL
- ✅ Data loads on all devices
- ✅ No CORS errors
- ✅ Login works from any device

---

If you're still having issues, check:
1. Backend logs in Render/Railway
2. Browser console errors
3. Network tab in DevTools
4. Verify all URLs are correct (no typos)

