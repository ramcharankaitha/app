# 🚀 Quick Deployment Steps

## Step-by-Step Guide to Deploy Backend & Database

---

## 📍 Current Status

✅ **Database**: Already on Railway  
✅ **Frontend**: Already on Vercel  
⏳ **Backend**: Needs deployment

---

## 🎯 Option 1: Deploy to Render (Recommended - Free)

### Step 1: Prepare Your Code
1. Make sure all changes are committed to GitHub
2. Push to your repository

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 3: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the repository with your backend code

### Step 4: Configure Service
Fill in these details:

- **Name**: `anitha-stores-backend`
- **Region**: `Singapore` (or closest to India)
- **Branch**: `main` (or `master`)
- **Root Directory**: `server` ⚠️ **Important!**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 5: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"** and add:

```
NODE_ENV = production
PORT = 10000
DATABASE_URL = postgresql://postgres:bJFCmXuzhGDhhbajJnJhtkzJLXzEpUYx@shinkansen.proxy.rlwy.net:32058/railway
FRONTEND_URL = https://your-vercel-app.vercel.app
```

⚠️ Replace `your-vercel-app.vercel.app` with your actual Vercel frontend URL!

### Step 6: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for build and deployment
3. Copy your backend URL (e.g., `https://anitha-stores-backend.onrender.com`)

### Step 7: Update Frontend
1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add/Update:
   ```
   REACT_APP_API_URL = https://anitha-stores-backend.onrender.com/api
   ```
3. **Redeploy** your frontend

### Step 8: Test
1. Visit: `https://anitha-stores-backend.onrender.com/api/health`
2. Should see: `{"status":"OK","message":"Server is running"}`
3. Test login from your frontend

---

## 🎯 Option 2: Deploy to Railway

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository

### Step 3: Configure Service
1. Railway auto-detects Node.js
2. Set **Root Directory** to `server` if needed
3. Set **Start Command** to `npm start`

### Step 4: Add Environment Variables
In Railway dashboard, go to **Variables** tab and add:

```
NODE_ENV = production
DATABASE_URL = postgresql://postgres:bJFCmXuzhGDhhbajJnJhtkzJLXzEpUYx@shinkansen.proxy.rlwy.net:32058/railway
FRONTEND_URL = https://your-vercel-app.vercel.app
```

### Step 5: Deploy
1. Railway automatically deploys
2. Get your backend URL from the service dashboard
3. Update frontend `REACT_APP_API_URL` with this URL

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend URL is accessible
- [ ] `/api/health` endpoint returns OK
- [ ] Database connection works (check logs)
- [ ] Frontend `REACT_APP_API_URL` is updated
- [ ] Frontend redeployed on Vercel
- [ ] Can login from frontend
- [ ] No CORS errors in browser console

---

## 🔧 Common Issues & Fixes

### ❌ "Cannot connect to database"
**Fix**: 
- Verify `DATABASE_URL` is correct in Render/Railway
- Check Railway database is running
- Ensure SSL is enabled (already in code)

### ❌ "CORS error"
**Fix**:
- Add `FRONTEND_URL` environment variable in backend
- Update CORS config in `server/server.js` (already done)
- Redeploy backend

### ❌ "Build failed"
**Fix**:
- Check Root Directory is set to `server`
- Verify `package.json` exists in server folder
- Check build logs for specific errors

### ❌ "Environment variable not working"
**Fix**:
- Variables must be set in hosting platform (not just `.env`)
- Redeploy after adding variables
- Check variable names are exact (case-sensitive)

---

## 📝 Important Notes

1. **Root Directory**: Must be `server` (not root of repo)
2. **DATABASE_URL**: Use full connection string from Railway
3. **FRONTEND_URL**: Your Vercel app URL (without trailing slash)
4. **REACT_APP_API_URL**: Backend URL + `/api` (e.g., `https://backend.onrender.com/api`)
5. **Never commit** `.env` files to Git

---

## 🎉 Success!

Once deployed:
- Your backend will be live at: `https://your-backend-url.onrender.com`
- Your API will be at: `https://your-backend-url.onrender.com/api`
- Your frontend will connect to the live backend
- All users can access the application!

---

## 📞 Need Help?

Check:
1. Backend logs in Render/Railway dashboard
2. Browser console for frontend errors
3. Network tab in browser DevTools
4. Verify all environment variables are set

