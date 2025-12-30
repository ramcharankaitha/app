# Switch Vercel Account via CLI

## 🔄 Quick Steps

### Step 1: Logout from Current Account
```bash
vercel logout
```

### Step 2: Login to New Account
```bash
vercel login
```

This will:
- Open your browser
- Ask you to authorize the CLI
- Link to your new Vercel account

**OR use email method:**
```bash
vercel login your-email@example.com
```

### Step 3: Link Project to New Account
```bash
# Navigate to your project
cd D:\projects\app

# Link to new account
vercel link
```

**You'll be asked:**
- **Set up and deploy?** → `Y`
- **Which scope?** → Select your new account/team
- **Link to existing project?** → `N` (to create new) or `Y` (to link existing)
- **Project name?** → Enter name or press Enter for default

### Step 4: Deploy
```bash
vercel --prod
```

---

## 🔍 Verify Connection

### Check Current Account
```bash
vercel whoami
```

### List Projects
```bash
vercel ls
```

### Check Project Info
```bash
vercel inspect
```

---

## 🆘 Troubleshooting

### Issue: "Already linked to different account"

**Solution:**
```bash
# Remove existing link
rm .vercel

# Re-link
vercel link
```

### Issue: "Not logged in"

**Solution:**
```bash
vercel login
```

### Issue: "Permission denied"

**Solution:**
- Make sure you're logged into the correct account
- Check if you have access to the team/project
- Try: `vercel logout` then `vercel login` again

---

## 📋 Complete Command Sequence

```bash
# 1. Logout
vercel logout

# 2. Login to new account
vercel login

# 3. Navigate to project
cd D:\projects\app

# 4. Remove old link (if exists)
rm .vercel

# 5. Link to new account
vercel link

# 6. Deploy
vercel --prod
```

---

## 🔐 Using Teams

If you're switching to a team account:

```bash
# Login
vercel login

# Link with team
vercel link --scope team-name

# Or during vercel link, select the team when prompted
```

---

## ✅ Success Indicators

After `vercel link`, you should see:
```
✅ Linked to [your-account]/[project-name]
```

After `vercel --prod`, you should see:
```
✅ Production: https://your-project.vercel.app
```

---

**🎉 Your project is now connected to the new Vercel account!**

