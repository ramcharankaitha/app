# ✅ Vercel + Render Setup Guide

## 🎯 Your Configuration

- **Frontend:** Vercel
- **Backend:** Render (`https://anitha-stores-backend.onrender.com/api`)

---

## 📋 Step 1: Add Environment Variable to Vercel

### 1.1 Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Click on your project

### 1.2 Navigate to Environment Variables
1. Click **"Settings"** tab (top navigation)
2. Click **"Environment Variables"** (left sidebar)

### 1.3 Add the Variable
1. Click **"Add New"** button
2. Fill in:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://anitha-stores-backend.onrender.com/api`
   - **Environment:** Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Click **"Save"**

### 1.4 Verify
You should see:
```
REACT_APP_API_URL = https://anitha-stores-backend.onrender.com/api
```

---

## 📋 Step 2: Redeploy on Vercel

### Option A: Via Dashboard
1. Go to **"Deployments"** tab
2. Find your latest deployment
3. Click **"..."** (three dots) on the right
4. Click **"Redeploy"**
5. Wait for deployment to complete (1-2 minutes)

### Option B: Via CLI
```bash
cd D:\projects\app
vercel --prod
```

### Option C: Push to Git
```bash
git add .
git commit -m "Add REACT_APP_API_URL"
git push
```
(Vercel will auto-deploy)

---

## 📋 Step 3: Verify Backend CORS (Optional)

Your backend on Render should allow Vercel domains. To verify:

### 3.1 Check Render Environment Variables
1. Go to: https://dashboard.render.com
2. Click your backend service
3. Go to **"Environment"** tab
4. Check if `FRONTEND_URL` is set

### 3.2 Set FRONTEND_URL (if not set)
1. In Render Dashboard → Your Backend → **"Environment"**
2. Click **"Add Environment Variable"**
3. Add:
   - **Key:** `FRONTEND_URL`
   - **Value:** `https://your-vercel-project.vercel.app`
   - Replace with your actual Vercel URL
4. Click **"Save Changes"**
5. Render will automatically redeploy

**Note:** Your backend code already allows all `.vercel.app` domains, so this is optional but recommended.

---

## ✅ Step 4: Test Your Application

### 4.1 Open Your Vercel Site
Visit: `https://your-project.vercel.app`

### 4.2 Check Browser Console
1. Press `F12` to open Developer Tools
2. Go to **"Console"** tab
3. Should see: **No red errors**
4. Should see: API calls succeeding

### 4.3 Test Login
1. Use default credentials:
   - **Email:** `admin@anithastores.com`
   - **Password:** `admin123`
2. Should login successfully
3. Dashboard should load

### 4.4 Check Network Tab
1. Press `F12` → **"Network"** tab
2. Reload page
3. Look for API calls to `anitha-stores-backend.onrender.com`
4. Should see status `200` (success)

---

## 🔍 Troubleshooting

### Issue: Still seeing blank page

**Check:**
1. ✅ Environment variable added in Vercel
2. ✅ Redeployed after adding variable
3. ✅ Check browser console (F12) for errors

**Solution:**
- Wait 1-2 minutes after redeploy
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache

---

### Issue: "Failed to fetch" or CORS error

**Check:**
1. Backend is running on Render
2. Backend URL is correct: `https://anitha-stores-backend.onrender.com/api`
3. Test backend directly:
   ```bash
   curl https://anitha-stores-backend.onrender.com/api/health
   ```

**Solution:**
- If backend is down, restart it in Render Dashboard
- Check Render logs for errors
- Verify backend environment variables

---

### Issue: "REACT_APP_API_URL is not set"

**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Verify `REACT_APP_API_URL` exists
3. Make sure it's set for **Production** environment
4. Redeploy

---

### Issue: Login works but API calls fail

**Check:**
1. Backend is running (check Render Dashboard)
2. Backend logs (Render → Logs tab)
3. Network tab in browser (F12)

**Solution:**
- Check backend logs for errors
- Verify database connection in backend
- Check if backend needs environment variables

---

## 📊 Quick Checklist

- [ ] Added `REACT_APP_API_URL` in Vercel
- [ ] Value is: `https://anitha-stores-backend.onrender.com/api`
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed on Vercel
- [ ] Backend is running on Render
- [ ] Tested login with `admin@anithastores.com` / `admin123`
- [ ] No console errors (F12)
- [ ] API calls working (Network tab)

---

## 🎉 Success Indicators

After setup, you should see:
- ✅ Page loads (not blank)
- ✅ Login page appears
- ✅ Can login successfully
- ✅ Dashboard loads
- ✅ No console errors
- ✅ API calls succeed (200 status)

---

## 📞 Next Steps

1. **Change default password:**
   - Login with `admin@anithastores.com` / `admin123`
   - Go to Profile → Change Password

2. **Monitor deployments:**
   - Vercel: Auto-deploys on Git push
   - Render: Check if auto-deploy is enabled

3. **Set up custom domain (optional):**
   - Vercel: Settings → Domains
   - Render: Settings → Custom Domain

---

**🚀 Your app should now work! If you see any issues, check the troubleshooting section above.**

