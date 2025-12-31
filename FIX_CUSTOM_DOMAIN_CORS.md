# Fix: Custom Domain Not Working (CORS Issue)

## 🔍 Problem

Your backend works with Vercel domain (`*.vercel.app`) but **NOT** with your custom domain.

**Cause:** Backend CORS is blocking your custom domain.

---

## ✅ Solution: Update Backend Environment Variables

### Step 1: Get Your Custom Domain

Your custom domain is the one you connected to Vercel. Examples:
- `https://yourdomain.com`
- `https://www.yourdomain.com`
- `https://app.yourdomain.com`

---

### Step 2: Update Render Environment Variables

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Click your backend service (`anitha-stores-backend`)

2. **Go to Environment Tab:**
   - Click **"Environment"** tab (left sidebar)

3. **Update FRONTEND_URL:**
   - Find `FRONTEND_URL` variable
   - **Current value:** Probably `https://your-project.vercel.app`
   - **New value:** Your custom domain (e.g., `https://yourdomain.com`)
   - Click **"Save Changes"**

   **OR** if you want to support BOTH Vercel and custom domain:

4. **Add FRONTEND_URLS (Alternative):**
   - Click **"Add Environment Variable"**
   - **Key:** `FRONTEND_URLS`
   - **Value:** `https://your-project.vercel.app,https://yourdomain.com,https://www.yourdomain.com`
   - (Comma-separated list of all your domains)
   - Click **"Save Changes"**

5. **Render will auto-redeploy:**
   - Wait 1-2 minutes for redeploy
   - Check **"Logs"** tab to see deployment progress

---

## 📋 Quick Setup Options

### Option A: Single Domain (Recommended)

**Set `FRONTEND_URL` to your custom domain:**
```
FRONTEND_URL=https://yourdomain.com
```

**Pros:**
- Simple
- Works with your custom domain
- Also works with Vercel domain (code allows both)

**Cons:**
- If you have multiple domains, use Option B

---

### Option B: Multiple Domains

**Set `FRONTEND_URLS` (comma-separated):**
```
FRONTEND_URLS=https://your-project.vercel.app,https://yourdomain.com,https://www.yourdomain.com
```

**Pros:**
- Supports multiple domains
- Both Vercel and custom domain work

**Cons:**
- Slightly more complex

---

## ✅ Step 3: Verify It Works

### 3.1 Check Backend Logs

1. Go to Render → Your Backend → **"Logs"** tab
2. Look for CORS warnings
3. Should see: No CORS errors for your custom domain

### 3.2 Test Your Custom Domain

1. **Open your custom domain:** `https://yourdomain.com`
2. **Open Browser Console:** Press `F12`
3. **Go to Console tab:**
   - Should see: **No CORS errors**
   - Should see: API calls succeeding

4. **Go to Network tab:**
   - Reload page
   - Look for API calls to `anitha-stores-backend.onrender.com`
   - Should see status `200` (success)

### 3.3 Test Login

1. Use default credentials:
   - **Email:** `admin@anithastores.com`
   - **Password:** `admin123`
2. Should login successfully
3. Dashboard should load

---

## 🔍 Troubleshooting

### Issue: Still getting CORS error

**Check:**
1. ✅ `FRONTEND_URL` or `FRONTEND_URLS` set in Render
2. ✅ Value matches your custom domain exactly
3. ✅ Include `https://` (not `http://`)
4. ✅ No trailing slash
5. ✅ Backend redeployed after change

**Solution:**
- Check Render logs for CORS warnings
- Verify domain spelling
- Try both `https://yourdomain.com` and `https://www.yourdomain.com`

---

### Issue: Works with www but not without (or vice versa)

**Solution:**
Add both variants to `FRONTEND_URLS`:
```
FRONTEND_URLS=https://yourdomain.com,https://www.yourdomain.com
```

---

### Issue: Backend not redeploying

**Solution:**
1. Go to Render → Your Backend
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Or make a small change to trigger auto-deploy

---

## 📊 Environment Variables Summary

### In Render (Backend):

**Required:**
- `FRONTEND_URL` = `https://yourdomain.com` (your custom domain)

**OR**

- `FRONTEND_URLS` = `https://your-project.vercel.app,https://yourdomain.com` (comma-separated)

**Other variables (should already be set):**
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `PORT=5000`
- `NODE_ENV=production`
- `JWT_SECRET`

---

### In Vercel (Frontend):

**Required:**
- `REACT_APP_API_URL` = `https://anitha-stores-backend.onrender.com/api`

---

## 🎯 Complete Checklist

- [ ] Updated `FRONTEND_URL` in Render to your custom domain
- [ ] OR added `FRONTEND_URLS` with all domains
- [ ] Backend redeployed (check Render logs)
- [ ] Tested custom domain (no CORS errors)
- [ ] Login works on custom domain
- [ ] API calls succeed (Network tab shows 200)

---

## 🎉 Success Indicators

After fixing, you should see:
- ✅ Custom domain loads (not blank)
- ✅ No CORS errors in console
- ✅ Can login successfully
- ✅ Dashboard loads
- ✅ API calls work (200 status)

---

## 📝 Example Configuration

### Render Environment Variables:

```
FRONTEND_URL=https://anithastores.com
```

**OR**

```
FRONTEND_URLS=https://app-one-theta-14.vercel.app,https://anithastores.com,https://www.anithastores.com
```

### Vercel Environment Variables:

```
REACT_APP_API_URL=https://anitha-stores-backend.onrender.com/api
```

---

**🚀 After updating `FRONTEND_URL` in Render, your custom domain should work!**

