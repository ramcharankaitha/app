# 🚀 Vercel Environment Variable Setup (Step-by-Step with Screenshots Guide)

## ⚠️ CRITICAL: This Must Be Done for Other Devices to Work!

---

## 📍 Step 1: Get Your Backend URL

1. Go to **Render** (https://render.com) or **Railway** (https://railway.app)
2. Login to your account
3. Find your backend service
4. **Copy the URL** - it will look like:
   - `https://anitha-stores-backend.onrender.com` (Render)
   - `https://your-app.up.railway.app` (Railway)

---

## 📍 Step 2: Add Environment Variable in Vercel

### A. Go to Vercel Dashboard
1. Visit https://vercel.com
2. **Login** to your account
3. Click on your **project name**

### B. Navigate to Settings
1. Click on **"Settings"** tab (top navigation)
2. In the left sidebar, click **"Environment Variables"**

### C. Add the Variable
1. Click the **"Add New"** button (or **"Add"** button)

2. Fill in the form:
   - **Key**: `REACT_APP_API_URL`
     - ⚠️ Must be exactly this (case-sensitive)
   - **Value**: `https://your-backend-url.onrender.com/api`
     - Replace `your-backend-url.onrender.com` with your actual backend URL
     - ⚠️ **IMPORTANT**: Must include `/api` at the end!
     - Example: `https://anitha-stores-backend.onrender.com/api`
   
3. **Environment**: 
   - Check **Production** ✅
   - Check **Preview** ✅ (optional but recommended)
   - Check **Development** ✅ (optional)

4. Click **"Save"**

### D. Verify the Variable
- You should see `REACT_APP_API_URL` in the list
- Value should show your backend URL with `/api`

---

## 📍 Step 3: Redeploy Frontend

**This is CRITICAL!** Environment variables only take effect after redeploy.

### Option A: Manual Redeploy
1. Go to **"Deployments"** tab
2. Find your latest deployment
3. Click the **"..."** (three dots) menu
4. Click **"Redeploy"**
5. Wait for deployment to complete (2-5 minutes)

### Option B: Automatic Redeploy
1. Make a small change to your code (add a comment)
2. Commit and push to GitHub
3. Vercel will automatically redeploy

---

## 📍 Step 4: Update Backend CORS (If Needed)

### A. Go to Backend Dashboard (Render/Railway)
1. Open your backend service
2. Go to **Environment Variables** or **Variables** section

### B. Add FRONTEND_URL
1. Add new variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://your-vercel-app.vercel.app`
     - Replace with your actual Vercel app URL
     - No trailing slash!
     - Example: `https://anitha-stores.vercel.app`

2. **Save** and **Redeploy** backend

---

## ✅ Step 5: Test

### Test on Your Computer
1. Open your Vercel app in browser
2. Open **Developer Tools** (F12)
3. Go to **Console** tab
4. Type: `console.log(process.env.REACT_APP_API_URL)`
5. Should show your backend URL (not `undefined`)

### Test on Another Device
1. Open your Vercel app on another laptop/phone
2. Try to login
3. Check if data loads
4. If still not working, see troubleshooting below

---

## 🔍 Troubleshooting

### ❌ Still seeing "Cannot fetch data"
**Check:**
1. Did you redeploy Vercel after adding the variable? ⚠️ **Required!**
2. Is the variable name exactly `REACT_APP_API_URL`?
3. Does the value include `/api` at the end?
4. Clear browser cache (Ctrl+Shift+Delete)

### ❌ CORS errors in console
**Fix:**
1. Add `FRONTEND_URL` in backend environment variables
2. Redeploy backend
3. Make sure URL matches exactly (no trailing slash)

### ❌ Backend not accessible
**Check:**
1. Visit backend URL directly: `https://your-backend.onrender.com/api/health`
2. Should return: `{"status":"OK","message":"Server is running"}`
3. If not, check backend logs in Render/Railway

### ❌ Environment variable shows undefined
**Fix:**
1. Variables starting with `REACT_APP_` require rebuild
2. Redeploy frontend (don't just save the variable)
3. Wait for deployment to complete

---

## 📋 Quick Checklist

Before testing on other devices:

- [ ] Backend is deployed and accessible
- [ ] `REACT_APP_API_URL` is set in Vercel
- [ ] Value includes `/api` at the end
- [ ] Frontend is redeployed after adding variable
- [ ] `FRONTEND_URL` is set in backend (if using CORS)
- [ ] Backend is redeployed (if CORS was updated)
- [ ] Tested backend health endpoint
- [ ] Cleared browser cache

---

## 🎯 Example Values

### Vercel Environment Variable:
```
Key: REACT_APP_API_URL
Value: https://anitha-stores-backend.onrender.com/api
```

### Backend Environment Variable:
```
Key: FRONTEND_URL
Value: https://anitha-stores.vercel.app
```

---

## 💡 Important Notes

1. **Environment variables are case-sensitive**
2. **Must redeploy after adding variables**
3. **REACT_APP_ prefix is required** for React to see the variable
4. **Include /api in the URL** - your backend serves APIs at `/api` route
5. **No trailing slashes** in URLs (except `/api`)

---

## ✅ Success!

When working correctly:
- ✅ No errors in browser console
- ✅ Network requests go to your backend (not localhost)
- ✅ Data loads on all devices
- ✅ Login works from any device
- ✅ All features work as expected

---

**Still having issues?** Check:
1. Backend logs in Render/Railway dashboard
2. Browser console for specific errors
3. Network tab in DevTools to see which URL is being called
4. Verify all URLs are correct (no typos, correct protocol https://)

