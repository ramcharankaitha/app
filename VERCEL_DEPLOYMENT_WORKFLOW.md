# Vercel Deployment Workflow Guide

## 🔄 How Vercel Deployments Work

### **Automatic Deployments (Recommended)**

When you connect Vercel to your **Git repository** (GitHub, GitLab, or Bitbucket), Vercel will **automatically deploy** your changes whenever you push code to your repository.

### **The Workflow:**

```
1. Make changes in Cursor (your code editor)
   ↓
2. Commit changes to Git
   git add .
   git commit -m "Your changes"
   ↓
3. Push to GitHub/GitLab/Bitbucket
   git push origin main
   ↓
4. Vercel automatically detects the push
   ↓
5. Vercel builds your app (runs npm run build)
   ↓
6. Vercel deploys the new version
   ↓
7. Your changes are live! 🎉
```

---

## ✅ Setting Up Automatic Deployments

### **Step 1: Push Your Code to GitHub**

If you haven't already:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repository on GitHub, then:
git remote add origin https://github.com/yourusername/your-repo.git
git branch -M main
git push -u origin main
```

### **Step 2: Connect Vercel to GitHub**

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login (use "Continue with GitHub")
3. Click **"Add New Project"**
4. Select your repository
5. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`
6. Add Environment Variable:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://your-backend-url.com/api`
7. Click **"Deploy"**

### **Step 3: Automatic Deployments Are Now Active!**

Now, every time you push to your main branch, Vercel will automatically:
- ✅ Detect the changes
- ✅ Build your app
- ✅ Deploy the new version
- ✅ Update your live site

---

## 📝 Daily Workflow

### **Making Changes:**

```bash
# 1. Make your changes in Cursor
# (Edit files, save, etc.)

# 2. Stage your changes
git add .

# 3. Commit with a message
git commit -m "Add new feature" 
# or
git commit -m "Fix navigation bug"

# 4. Push to GitHub
git push origin main

# 5. Wait 1-2 minutes
# Vercel will automatically build and deploy!

# 6. Check Vercel dashboard to see deployment status
```

---

## 🔍 Checking Deployment Status

### **In Vercel Dashboard:**

1. Go to your project on Vercel
2. Click on **"Deployments"** tab
3. You'll see:
   - ✅ **Building** - Vercel is building your app
   - ✅ **Ready** - Deployment successful
   - ❌ **Error** - Something went wrong (check logs)

### **Deployment URLs:**

- **Production:** `your-app.vercel.app` (main branch)
- **Preview:** Each push creates a preview URL for testing

---

## 🎯 Branch-Based Deployments

Vercel automatically creates preview deployments for **every branch**:

- **Main branch** → Production deployment
- **Feature branches** → Preview deployments (for testing)

**Example:**
```bash
# Create a feature branch
git checkout -b feature/new-dashboard

# Make changes and push
git push origin feature/new-dashboard

# Vercel creates a preview URL like:
# feature-new-dashboard-abc123.vercel.app
```

---

## ⚙️ Manual Deployment (Alternative)

If you don't want automatic deployments, you can deploy manually:

### **Option 1: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Or deploy to production
vercel --prod
```

### **Option 2: Vercel Dashboard**

1. Go to your project
2. Click **"Deployments"**
3. Click **"Redeploy"** on any previous deployment

---

## 🔧 Configuration Options

### **vercel.json** (Optional)

Create `vercel.json` in your project root for custom settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "devCommand": "npm start",
  "installCommand": "npm install",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures React Router works correctly (SPA routing).

---

## 🚨 Important Notes

### **1. Changes in Cursor ≠ Live Changes**

**NO** - Changes in Cursor are **NOT automatically** on Vercel. You must:
- ✅ Commit changes to Git
- ✅ Push to GitHub
- ✅ Then Vercel deploys

### **2. Environment Variables**

If you change environment variables:
1. Update in Vercel Dashboard → Settings → Environment Variables
2. Redeploy (or push a new commit)

### **3. Build Time**

- First deployment: ~2-3 minutes
- Subsequent deployments: ~1-2 minutes
- Large apps: May take longer

### **4. Caching**

Vercel caches:
- ✅ Dependencies (node_modules)
- ✅ Build outputs
- This speeds up subsequent deployments

---

## 🔄 Updating Backend API URL

If your backend URL changes:

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Update `REACT_APP_API_URL`
4. Redeploy (or push a commit)

---

## 📊 Deployment History

Vercel keeps a history of all deployments:
- ✅ See what changed
- ✅ Rollback to previous versions
- ✅ View build logs
- ✅ Check deployment status

---

## 🐛 Troubleshooting

### **Issue: Changes not appearing**

**Solutions:**
1. Check if you pushed to GitHub
2. Check Vercel deployment status
3. Clear browser cache (Ctrl+Shift+R)
4. Check build logs in Vercel dashboard

### **Issue: Build failing**

**Solutions:**
1. Check build logs in Vercel
2. Test build locally: `npm run build`
3. Fix any errors shown in logs
4. Ensure all dependencies are in `package.json`

### **Issue: Environment variables not working**

**Solutions:**
1. Verify variable name starts with `REACT_APP_`
2. Redeploy after adding variables
3. Check variable is set for correct environment (Production/Preview)

---

## ✅ Best Practices

1. **Always test locally first:**
   ```bash
   npm run build
   npm install -g serve
   serve -s build
   ```

2. **Use meaningful commit messages:**
   ```bash
   git commit -m "Fix: Navigation issue on mobile"
   git commit -m "Feature: Add product search"
   ```

3. **Push frequently:**
   - Don't wait days to push
   - Push after each feature/bug fix
   - This creates a deployment history

4. **Use preview deployments:**
   - Test on preview URLs before merging to main
   - Share preview URLs with team for feedback

5. **Monitor deployments:**
   - Check Vercel dashboard regularly
   - Set up email notifications for failed builds

---

## 🎓 Quick Reference

| Action | Command | Result |
|--------|---------|--------|
| Make changes | Edit in Cursor | Local only |
| Commit | `git commit -m "message"` | Saved to Git |
| Push | `git push origin main` | **Triggers Vercel deploy** |
| Check status | Vercel Dashboard | See deployment progress |
| Rollback | Vercel Dashboard | Revert to previous version |

---

## 📝 Summary

**Question:** Will changes in Cursor automatically appear on Vercel?

**Answer:** **NO** - You need to:
1. ✅ Commit changes: `git commit`
2. ✅ Push to GitHub: `git push`
3. ✅ Then Vercel automatically deploys (if connected to Git)

**If you want automatic deployments:**
- Connect Vercel to your GitHub repository
- Push changes to trigger deployments
- Vercel will build and deploy automatically

**If you want manual control:**
- Use Vercel CLI: `vercel --prod`
- Or use Vercel Dashboard to redeploy

---

## 🚀 Quick Start Checklist

- [ ] Code is in a Git repository (GitHub/GitLab/Bitbucket)
- [ ] Vercel account created
- [ ] Project connected to Git repository
- [ ] Environment variables configured
- [ ] First deployment successful
- [ ] Automatic deployments enabled

Now you're ready! Every `git push` will automatically deploy to Vercel! 🎉

