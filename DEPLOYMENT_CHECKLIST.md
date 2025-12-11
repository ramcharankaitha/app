# Deployment Checklist

Use this checklist before deploying your application to production.

## ✅ Pre-Deployment Checklist

### Frontend
- [ ] Build React app: `npm run build`
- [ ] Test production build locally
- [ ] Set `REACT_APP_API_URL` environment variable
- [ ] Verify all API calls use environment variable
- [ ] Check for console errors
- [ ] Test all navigation flows
- [ ] Verify responsive design works

### Backend
- [ ] Set `NODE_ENV=production`
- [ ] Configure all environment variables
- [ ] Test database connection
- [ ] Run database migrations/initialization
- [ ] Verify CORS allows frontend domain
- [ ] Set strong JWT_SECRET
- [ ] Remove console.logs or use proper logging
- [ ] Test all API endpoints
- [ ] Set up error handling

### Database
- [ ] Create production database
- [ ] Backup existing data (if migrating)
- [ ] Test database connection
- [ ] Run initialization scripts
- [ ] Set up database backups
- [ ] Configure connection pooling

### Security
- [ ] Remove hardcoded credentials
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Review and secure API endpoints
- [ ] Set up rate limiting (optional)

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Configure alerts for downtime
- [ ] Monitor database performance

---

## 🚀 Quick Deploy Commands

### Build Frontend
```bash
npm run build
```

### Test Production Build Locally
```bash
# Install serve globally
npm install -g serve

# Serve the build
serve -s build -l 3000
```

### Test Backend Locally
```bash
cd server
npm start
```

---

## 📝 Environment Variables Template

### Frontend (.env.production)
```
REACT_APP_API_URL=https://your-backend-url.com/api
```

### Backend (.env)
```
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-very-secure-secret-key-min-32-chars
```

---

## 🔍 Post-Deployment Testing

- [ ] Test login functionality
- [ ] Test all CRUD operations
- [ ] Verify data persistence
- [ ] Check API response times
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Verify SSL certificate
- [ ] Check error pages
- [ ] Test navigation flows
- [ ] Verify form submissions

---

## 🐛 Common Issues & Solutions

### Issue: CORS errors
**Solution:** Update CORS in `server/server.js` to allow your frontend domain

### Issue: API calls failing
**Solution:** Check `REACT_APP_API_URL` is set correctly

### Issue: Database connection errors
**Solution:** Verify database credentials and network access

### Issue: Build fails
**Solution:** Check for TypeScript/ESLint errors, update dependencies

### Issue: Routes not working
**Solution:** Configure server to serve `index.html` for all routes (SPA routing)

---

## 📞 Support Resources

- Check server logs for errors
- Review browser console for frontend errors
- Test API endpoints with Postman/curl
- Verify environment variables are set
- Check database connection status

Good luck! 🎉

