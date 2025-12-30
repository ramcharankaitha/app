# Security Fix for Vercel Deployment

## Issue
Chrome was showing a "Dangerous site" warning when accessing the Vercel-hosted website. This was caused by:
1. Missing security headers
2. Potential mixed content (HTTP resources on HTTPS page)
3. No Content Security Policy configured

## Changes Made

### 1. Added Security Headers to Server (`server/server.js`)
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `Strict-Transport-Security` - Forces HTTPS in production
- `Content-Security-Policy` - Restricts resource loading
- `Referrer-Policy` - Controls referrer information
- `Permissions-Policy` - Restricts browser features

### 2. Added Security Headers to Vercel Config (`vercel.json`)
- Configured headers at the Vercel level for all routes
- Ensures headers are applied even before requests reach the server

### 3. Updated API Base URL Logic (`src/services/api.js`)
- Auto-converts HTTP to HTTPS in production
- Warns if HTTP is used in production

## Next Steps

### 1. Set Environment Variables in Vercel
Make sure you have set the following environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Ensure `REACT_APP_API_URL` is set to your **HTTPS** backend URL (not HTTP)
   - Example: `https://your-backend.vercel.app/api` or `https://your-custom-domain.com/api`

### 2. Verify Backend is Using HTTPS
- If your backend is also on Vercel, it should automatically use HTTPS
- If using a different hosting service, ensure it supports HTTPS

### 3. Clear Browser Cache
After deploying:
1. Clear your browser cache
2. Try accessing the site in an incognito/private window
3. The security warning should be gone

### 4. Test Security Headers
You can test if headers are working by:
1. Opening browser DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Click on any request
5. Check the Response Headers section - you should see all the security headers

### 5. Submit to Google Safe Browsing (if needed)
If the warning persists after 24-48 hours:
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property
3. Request a security review

## Additional Security Recommendations

1. **Use HTTPS everywhere** - Never use HTTP in production
2. **Keep dependencies updated** - Run `npm audit` regularly
3. **Use environment variables** - Never hardcode secrets
4. **Enable Vercel's security features** - Check Vercel dashboard for additional security options

## Troubleshooting

If you still see the warning:
1. Check browser console for any mixed content errors
2. Verify all API calls are using HTTPS
3. Check Vercel deployment logs for any errors
4. Ensure `REACT_APP_API_URL` environment variable is set correctly in Vercel

