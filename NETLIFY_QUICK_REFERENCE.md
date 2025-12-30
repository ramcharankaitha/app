# Netlify Deployment - Quick Reference Card

## 📝 Fill These Fields in Netlify

Copy and paste these exact values into the Netlify deployment form:

---

### **Team**
```
RAM CHARAN
```

---

### **Project name**
```
app12121
```

**Resulting URL:** `https://app12121.netlify.app`

---

### **Branch to deploy**
```
main
```

*(Or your default Git branch name)*

---

### **Base directory**
```
(Leave this field EMPTY)
```

*Since `package.json` is in the root directory, leave this empty*

---

### **Build command**
```
npm run build
```

---

### **Publish directory**
```
build
```

---

### **Functions directory**
```
netlify/functions
```

*(Optional - only if using Netlify Functions)*

---

## 🔑 Environment Variables

**⚠️ CRITICAL: You MUST add this before deploying!**

Click **"Add environment variables"** and add:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://your-backend-url.com/api` |

**Replace `your-backend-url.com` with your actual backend URL**

**Examples:**
- `https://your-backend.vercel.app/api`
- `https://your-app.herokuapp.com/api`
- `https://api.yourdomain.com/api`

**⚠️ Important:**
- ✅ Must use `https://` (not `http://`)
- ✅ Must include `/api` at the end
- ❌ No trailing slash after `/api`

---

## ✅ Final Checklist

Before clicking **"Deploy app12121"**, verify:

- [x] Team: `RAM CHARAN`
- [x] Project name: `app12121`
- [x] Branch: `main`
- [x] Base directory: *(empty)*
- [x] Build command: `npm run build`
- [x] Publish directory: `build`
- [x] Environment variable: `REACT_APP_API_URL` = `https://your-backend-url.com/api`

---

## 🚀 After Deployment

1. **Wait 2-5 minutes** for build to complete
2. **Visit:** https://app12121.netlify.app
3. **Test login** and verify API calls work
4. **Check browser console** (F12) for any errors

---

## 📚 Full Documentation

See `NETLIFY_DEPLOYMENT_GUIDE.md` for complete instructions and troubleshooting.

