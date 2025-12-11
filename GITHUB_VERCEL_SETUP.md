# Complete Guide: Connect Cursor to GitHub & Auto-Deploy to Vercel

This guide will walk you through connecting your project to GitHub from Cursor and setting up automatic deployments to Vercel.

---

## 📋 Prerequisites

- ✅ Cursor IDE installed
- ✅ GitHub account (create at [github.com](https://github.com))
- ✅ Vercel account (create at [vercel.com](https://vercel.com))
- ✅ Your project code ready

---

## 🔧 Part 1: Setting Up Git in Cursor

### **Step 1: Initialize Git Repository**

1. **Open Terminal in Cursor:**
   - Press `Ctrl + `` (backtick) or `Ctrl + J`
   - Or go to: **Terminal → New Terminal**

2. **Check if Git is installed:**
   ```bash
   git --version
   ```
   If not installed, download from [git-scm.com](https://git-scm.com)

3. **Initialize Git in your project:**
   ```bash
   git init
   ```

4. **Configure Git (if first time):**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

### **Step 2: Create .gitignore File**

Create a `.gitignore` file in your project root to exclude unnecessary files:

```bash
# In Cursor, create new file: .gitignore
```

Add this content:
```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Server
server/node_modules/
server/.env
```

---

## 🔗 Part 2: Connect to GitHub

### **Step 1: Create GitHub Repository**

1. **Go to [github.com](https://github.com)** and sign in
2. **Click the "+" icon** (top right) → **"New repository"**
3. **Repository settings:**
   - **Name:** `anitha-stores-app` (or your preferred name)
   - **Description:** "Anitha Stores Management Application"
   - **Visibility:** Public or Private (your choice)
   - **DO NOT** check "Initialize with README" (we already have code)
4. **Click "Create repository"**

### **Step 2: Connect Local Project to GitHub**

1. **In Cursor Terminal, run these commands:**

   ```bash
   # Add all files to Git
   git add .

   # Create first commit
   git commit -m "Initial commit: Anitha Stores application"

   # Rename branch to main (if needed)
   git branch -M main

   # Add GitHub repository as remote
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   # Replace YOUR_USERNAME and YOUR_REPO_NAME with your actual values

   # Push to GitHub
   git push -u origin main
   ```

2. **If prompted for credentials:**
   - Use **Personal Access Token** (recommended)
   - Or use GitHub username and password

### **Step 3: Create GitHub Personal Access Token**

If you need authentication:

1. **Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. **Click "Generate new token (classic)"**
3. **Settings:**
   - **Note:** "Cursor Git Access"
   - **Expiration:** 90 days (or your preference)
   - **Scopes:** Check `repo` (full control)
4. **Click "Generate token"**
5. **Copy the token** (you won't see it again!)
6. **Use this token as password** when Git asks for credentials

---

## 🚀 Part 3: Set Up Vercel Auto-Deployment

### **Step 1: Connect Vercel to GitHub**

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** (use "Continue with GitHub" - easiest option)
3. **Click "Add New Project"**
4. **Import Git Repository:**
   - You'll see your GitHub repositories
   - Click **"Import"** next to your project

### **Step 2: Configure Vercel Project**

1. **Project Settings:**
   - **Project Name:** `anitha-stores` (or your choice)
   - **Framework Preset:** **Create React App**
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`

2. **Environment Variables:**
   - Click **"Environment Variables"**
   - Add:
     - **Name:** `REACT_APP_API_URL`
     - **Value:** `https://your-backend-url.com/api`
     - **Environment:** Production, Preview, Development (select all)

3. **Click "Deploy"**

### **Step 3: Verify Auto-Deployment**

1. **Wait for first deployment** (1-2 minutes)
2. **Check deployment status** in Vercel dashboard
3. **Visit your live site** (you'll get a URL like `your-app.vercel.app`)

---

## 🔄 Part 4: Making Changes & Auto-Deployment

### **Daily Workflow in Cursor:**

#### **1. Make Your Changes**

- Edit files in Cursor
- Save files (`Ctrl + S`)
- Test locally if needed

#### **2. Stage Your Changes**

**Option A: Using Terminal**
```bash
# Stage all changes
git add .

# Or stage specific files
git add src/components/Login.jsx
```

**Option B: Using Cursor UI**
1. Click **Source Control icon** (left sidebar) or press `Ctrl + Shift + G`
2. You'll see changed files
3. Click **"+"** next to files to stage them
4. Or click **"+"** next to "Changes" to stage all

#### **3. Commit Your Changes**

**Option A: Using Terminal**
```bash
git commit -m "Fix: Updated login form alignment"
```

**Option B: Using Cursor UI**
1. In Source Control panel
2. Type commit message in the box at top
3. Press `Ctrl + Enter` or click checkmark

**Good Commit Messages:**
- `"Fix: Removed Google sign-in button"`
- `"Feature: Added confirmation dialog before save"`
- `"Update: Improved login form spacing"`
- `"Fix: Navigation issue on Stores button"`

#### **4. Push to GitHub**

**Option A: Using Terminal**
```bash
git push origin main
```

**Option B: Using Cursor UI**
1. In Source Control panel
2. Click **"..."** (three dots) at top
3. Click **"Push"** or **"Push to..."**
4. Select `origin/main`

#### **5. Vercel Automatically Deploys!**

- ✅ Vercel detects the push to GitHub
- ✅ Automatically starts building (1-2 minutes)
- ✅ Deploys new version
- ✅ Your changes are live!

---

## 📊 Part 5: Monitoring Deployments

### **In Vercel Dashboard:**

1. **Go to your project** on Vercel
2. **Click "Deployments" tab**
3. **You'll see:**
   - ✅ **Building** - Currently building
   - ✅ **Ready** - Successfully deployed
   - ❌ **Error** - Build failed (check logs)

### **Deployment Status:**

- **Production:** Deployments from `main` branch
- **Preview:** Deployments from other branches (for testing)

### **View Build Logs:**

1. Click on any deployment
2. Click **"Build Logs"** tab
3. See what happened during build

---

## 🎯 Quick Reference Commands

### **Essential Git Commands:**

```bash
# Check status
git status

# Stage all changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# See commit history
git log

# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main
```

---

## 🔍 Troubleshooting

### **Issue: "Repository not found"**

**Solution:**
- Check repository name is correct
- Verify you have access to the repository
- Re-add remote: `git remote set-url origin https://github.com/USERNAME/REPO.git`

### **Issue: "Authentication failed"**

**Solution:**
- Use Personal Access Token instead of password
- Update credentials: `git config --global credential.helper store`
- Re-enter credentials when prompted

### **Issue: "Changes not deploying"**

**Solution:**
1. Verify you pushed to GitHub: `git push origin main`
2. Check Vercel is connected to correct repository
3. Check Vercel deployment logs for errors
4. Verify build settings in Vercel

### **Issue: "Build failing on Vercel"**

**Solution:**
1. Test build locally: `npm run build`
2. Check build logs in Vercel
3. Verify all dependencies in `package.json`
4. Check environment variables are set

---

## 📝 Step-by-Step Example

### **Example: Making a Change to Login Form**

1. **Edit file in Cursor:**
   - Open `src/components/Login.jsx`
   - Make your changes
   - Save (`Ctrl + S`)

2. **Stage changes:**
   ```bash
   git add src/components/Login.jsx
   ```

3. **Commit:**
   ```bash
   git commit -m "Update: Improved login form styling"
   ```

4. **Push:**
   ```bash
   git push origin main
   ```

5. **Wait 1-2 minutes:**
   - Vercel detects the push
   - Builds automatically
   - Deploys new version

6. **Check Vercel dashboard:**
   - See deployment status
   - Visit live site to verify changes

---

## ✅ Checklist

### **Initial Setup:**
- [ ] Git initialized in project
- [ ] `.gitignore` file created
- [ ] GitHub repository created
- [ ] Local project connected to GitHub
- [ ] First commit pushed to GitHub
- [ ] Vercel account created
- [ ] Vercel connected to GitHub repository
- [ ] Vercel project configured
- [ ] Environment variables set
- [ ] First deployment successful

### **Daily Workflow:**
- [ ] Make changes in Cursor
- [ ] Stage changes (`git add .`)
- [ ] Commit with message (`git commit -m "message"`)
- [ ] Push to GitHub (`git push origin main`)
- [ ] Check Vercel deployment status
- [ ] Verify changes on live site

---

## 🎓 Best Practices

### **1. Commit Frequently**
- Don't wait days to commit
- Commit after each feature/fix
- Creates better history

### **2. Meaningful Commit Messages**
- ✅ Good: `"Fix: Login button alignment issue"`
- ✅ Good: `"Feature: Add confirmation dialog"`
- ❌ Bad: `"update"`
- ❌ Bad: `"changes"`

### **3. Test Before Pushing**
- Test locally: `npm start`
- Build test: `npm run build`
- Fix errors before pushing

### **4. Use Branches for Features**
```bash
# Create feature branch
git checkout -b feature/new-dashboard

# Make changes, commit
git add .
git commit -m "Add new dashboard"

# Push branch
git push origin feature/new-dashboard

# Vercel creates preview deployment!
# Test on preview URL before merging
```

### **5. Monitor Deployments**
- Check Vercel dashboard regularly
- Review build logs if errors occur
- Set up email notifications

---

## 🔗 Quick Links

- **GitHub:** [github.com](https://github.com)
- **Vercel:** [vercel.com](https://vercel.com)
- **Git Documentation:** [git-scm.com/doc](https://git-scm.com/doc)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)

---

## 📞 Need Help?

### **Common Questions:**

**Q: Do I need to push every time I save?**
A: No! Only push when you want to deploy. Save files locally as much as you want.

**Q: How long does deployment take?**
A: Usually 1-2 minutes. First deployment may take longer.

**Q: Can I deploy manually?**
A: Yes! In Vercel dashboard, click "Redeploy" on any previous deployment.

**Q: What if I make a mistake?**
A: You can rollback in Vercel dashboard or fix and push again.

**Q: Can I test before deploying?**
A: Yes! Use branches - Vercel creates preview URLs for each branch.

---

## 🎉 Summary

**The Complete Flow:**

```
1. Make changes in Cursor ✏️
   ↓
2. Stage: git add . 📦
   ↓
3. Commit: git commit -m "message" 💾
   ↓
4. Push: git push origin main 🚀
   ↓
5. Vercel auto-detects & builds 🔍
   ↓
6. Changes are live! ✅
```

**That's it!** Once set up, every `git push` automatically deploys to Vercel. No manual steps needed! 🎊

---

Good luck with your deployments! 🚀

