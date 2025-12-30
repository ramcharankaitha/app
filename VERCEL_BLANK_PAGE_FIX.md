# Fix: Blank Page on Vercel

## 🔍 Problem: Blank/Plain Page After Deployment

If your Vercel site shows a blank page, it's usually because:
1. **Missing Environment Variable** - `REACT_APP_API_URL` not set
2. **Build Failed** - Check Vercel build logs
3. **JavaScript Errors** - Check browser console (F12)

---

## ✅ Quick Fix Steps

### Step 1: Add Environment Variable in Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click on your project

2. **Navigate to Settings:**
   - Click **"Settings"** tab
   - Click **"Environment Variables"** in left sidebar

3. **Add Environment Variable:**
   - Click **"Add New"**
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://your-backend-url.com/api`
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**

   **Example values:**
   - If backend on Railway: `https://your-app.railway.app/api`
   - If backend on Heroku: `https://your-app.herokuapp.com/api`
   - If backend on custom domain: `https://api.yourdomain.com/api`
   - If backend on Hostinger: `https://yourdomain.com/api`

4. **Redeploy:**
   - Go to **"Deployments"** tab
   - Click **"..."** (three dots) on latest deployment
   - Click **"Redeploy"**
   - Or push a new commit to trigger redeploy

---

### Step 2: Check Build Logs

1. **In Vercel Dashboard:**
   - Go to **"Deployments"** tab
   - Click on the latest deployment
   - Check **"Build Logs"**

2. **Look for errors:**
   - ❌ Build failed → Check Node version
   - ❌ Missing dependencies → Check `package.json`
   - ❌ Environment variable errors → Add `REACT_APP_API_URL`

---

### Step 3: Check Browser Console

1. **Open your Vercel site:**
   - Visit: `https://your-project.vercel.app`

2. **Open Developer Tools:**
   - Press `F12` or `Right-click → Inspect`
   - Go to **"Console"** tab

3. **Look for errors:**
   - ❌ `REACT_APP_API_URL is not set` → Add environment variable (Step 1)
   - ❌ `Failed to fetch` → Backend not running or wrong URL
   - ❌ `SyntaxError` → Build issue, check logs
   - ❌ `CORS error` → Backend CORS not configured

---

### Step 4: Verify Environment Variable

**After adding the variable, verify it's set:**

1. **Check in Vercel:**
   - Settings → Environment Variables
   - Should see: `REACT_APP_API_URL` with your URL

2. **Check in build logs:**
   - During build, Vercel will show environment variables (masked)
   - Look for: `REACT_APP_API_URL` in build output

3. **Test in browser:**
   - Open console (F12)
   - Type: `console.log(process.env.REACT_APP_API_URL)`
   - Should show your API URL (in production build)

---

## 🔧 Common Issues & Solutions

### Issue 1: "REACT_APP_API_URL is not set"

**Solution:**
- Add environment variable in Vercel (Step 1)
- Make sure it's set for **Production** environment
- Redeploy after adding

---

### Issue 2: Build Succeeds But Page is Blank

**Possible causes:**
1. **JavaScript error on page load**
   - Check browser console (F12)
   - Look for red error messages

2. **API URL incorrect**
   - Verify `REACT_APP_API_URL` points to correct backend
   - Test backend URL: `curl https://your-backend-url.com/api/health`

3. **CORS error**
   - Backend must allow your Vercel domain
   - Check backend CORS configuration

---

### Issue 3: "Failed to fetch" or Network Errors

**Solution:**
1. **Check backend is running:**
   ```bash
   curl https://your-backend-url.com/api/health
   ```

2. **Check CORS in backend:**
   - Backend must allow: `https://your-project.vercel.app`
   - Or allow all origins in development

3. **Verify API URL:**
   - Must be `https://` (not `http://`)
   - Must include `/api` at the end
   - No trailing slash

---

### Issue 4: Build Fails

**Check build logs for:**
- Node version mismatch → Set Node version in Vercel
- Missing dependencies → Check `package.json`
- TypeScript errors → Fix code errors
- Environment variable syntax → Check variable format

**Fix Node version:**
1. Vercel Dashboard → Settings → General
2. Set **Node.js Version:** `18.x` or `20.x`
3. Redeploy

---

## 📋 Complete Setup Checklist

- [ ] Environment variable `REACT_APP_API_URL` added in Vercel
- [ ] Environment variable set for Production environment
- [ ] Backend is running and accessible
- [ ] Backend CORS allows Vercel domain
- [ ] Build succeeds (check logs)
- [ ] No console errors (check browser F12)
- [ ] API URL is correct format (`https://domain.com/api`)

---

## 🚀 Quick Command Reference

### Check Vercel Environment Variables (CLI):
```bash
vercel env ls
```

### Add Environment Variable (CLI):
```bash
vercel env add REACT_APP_API_URL production
# Enter value when prompted: https://your-backend-url.com/api
```

### Redeploy:
```bash
vercel --prod
```

### Check Deployment Status:
```bash
vercel ls
```

---

## 🎯 Step-by-Step: Complete Fix

### 1. Add Environment Variable
```
Vercel Dashboard → Your Project → Settings → Environment Variables
Add: REACT_APP_API_URL = https://your-backend-url.com/api
```

### 2. Redeploy
```
Deployments → Latest → ... → Redeploy
```

### 3. Test
```
Visit: https://your-project.vercel.app
Open Console (F12)
Check for errors
```

### 4. Verify
```
Console should show: No errors
Page should load: Login page or dashboard
API calls should work: Check Network tab
```

---

## 🆘 Still Not Working?

### Debug Steps:

1. **Check Vercel Build Logs:**
   - Deployments → Latest → Build Logs
   - Look for errors or warnings

2. **Check Browser Console:**
   - F12 → Console tab
   - Look for red errors
   - Copy error messages

3. **Check Network Tab:**
   - F12 → Network tab
   - Reload page
   - Check if files are loading (200 status)
   - Check if API calls are failing

4. **Test API Directly:**
   ```bash
   curl https://your-backend-url.com/api/health
   ```

5. **Verify Environment Variable:**
   - Vercel Dashboard → Settings → Environment Variables
   - Make sure `REACT_APP_API_URL` exists
   - Make sure it's set for Production

---

## ✅ Success Indicators

After fixing, you should see:
- ✅ Page loads (not blank)
- ✅ No console errors
- ✅ Login page appears
- ✅ API calls succeed (check Network tab)
- ✅ Can login successfully

---

**🎉 Once `REACT_APP_API_URL` is set correctly, your app should work!**

