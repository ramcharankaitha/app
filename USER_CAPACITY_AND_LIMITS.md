# 👥 Application User Capacity & Limits

## 🎯 Current Configuration

Based on your current setup, here's what your application can handle:

---

## 📊 **Concurrent Users**

### **Theoretical Capacity: 100+ Active Users**

**However, actual capacity depends on several factors:**

1. **Database Connection Pool**: **10 concurrent connections** (Railway-optimized)
   - Each user request may use 1 database connection
   - With connection pooling, 10 connections can serve many users
   - **Realistic capacity: 50-100 concurrent users** (depending on request patterns)

2. **Rate Limiting**:
   - **API Requests**: **200 requests per 15 minutes per IP address**
   - **Auth Requests**: **5 requests per 15 minutes per IP address**
   - This prevents abuse but doesn't limit total users

3. **Server Resources** (Render):
   - **Free Tier**: 512MB RAM, spins down after 15 min inactivity
   - **Starter Plan ($7/month)**: 512MB RAM, always-on
   - **Standard Plan ($25/month)**: 2GB RAM, recommended for 50+ users

4. **Database Provider** (Railway):
   - **Free Tier**: Limited connections, may pause after inactivity
   - **Pro Plan ($5/month)**: Better connection limits

---

## 🔢 **Actual User Capacity Breakdown**

### **Scenario 1: Light Usage (Viewing Data)**
- **Concurrent Users**: **100-200 users**
- **Why**: Most requests are read-only, connections are reused quickly
- **Database Load**: Low (mostly SELECT queries)

### **Scenario 2: Moderate Usage (Mixed Operations)**
- **Concurrent Users**: **50-100 users**
- **Why**: Mix of reads and writes, some connections held longer
- **Database Load**: Medium

### **Scenario 3: Heavy Usage (Many Writes)**
- **Concurrent Users**: **20-50 users**
- **Why**: Write operations hold connections longer
- **Database Load**: High

### **Scenario 4: Peak Load (All Users Active)**
- **Concurrent Users**: **10-20 users** (limited by connection pool)
- **Why**: All 10 database connections in use
- **Database Load**: Maximum

---

## ⚠️ **Current Limitations**

### **1. Database Connection Pool: 10 Connections**
```javascript
// server/config/database.js
max: 10, // Reduced for Railway compatibility
```

**Impact:**
- Only 10 database operations can run simultaneously
- If all 10 connections are busy, new requests wait
- **Solution**: Increase to 20-50 for more users (requires better database plan)

### **2. Rate Limiting: 200 Requests/15min per IP**
```javascript
// server/middleware/rateLimiter.js
const apiLimiter = createRateLimiter(15 * 60 * 1000, 200);
```

**Impact:**
- Each user can make 200 requests every 15 minutes
- This is per IP address, not per user account
- **For 100 users**: 20,000 requests/15min total (if all active)

### **3. Render Free Tier Limitations**
- **Spins down after 15 min inactivity**: First request after sleep takes 30-60 seconds
- **512MB RAM**: Limited for Node.js clustering
- **750 hours/month**: Enough for 1 instance

### **4. Railway Free Tier Limitations**
- **Connection limits**: May restrict concurrent connections
- **May pause after inactivity**: Database becomes unavailable

---

## 🚀 **How to Increase Capacity**

### **Option 1: Increase Database Connection Pool** (Quick Fix)

**Edit `server/config/database.js`:**
```javascript
max: 20, // Increase from 10 to 20
```

**Impact:**
- Can handle 2x more concurrent database operations
- **New capacity: 100-200 concurrent users** (light usage)

**⚠️ Warning**: Railway free tier may not support 20 connections. Consider upgrading.

### **Option 2: Upgrade Hosting Plans** (Recommended)

**For 100+ Users:**
```
✅ Render Backend: Standard Plan ($25/month) - 2GB RAM
✅ Railway Database: Pro Plan ($5/month) - Better connection limits
─────────────────────────────────────────────────────
Total: $30/month
```

**Benefits:**
- More RAM for Node.js clustering
- Better database connection limits
- Always-on (no spin-down delays)
- Better performance

### **Option 3: Optimize Application** (Free)

1. **Enable Caching**: Reduce database queries
2. **Optimize Queries**: Use indexes, reduce N+1 queries
3. **Use Connection Pooling Efficiently**: Reuse connections quickly

---

## 📈 **Capacity by Hosting Plan**

### **Free Tier Setup**
- **Concurrent Users**: 10-20 (limited by connection pool)
- **Issues**: Spins down, slow first request, connection limits
- **Cost**: $0/month

### **Starter Setup ($14/month)**
- **Concurrent Users**: 50-100
- **Benefits**: Always-on, no spin-down
- **Cost**: $14/month (Render Starter + Railway Starter)

### **Standard Setup ($30/month)**
- **Concurrent Users**: 100-200
- **Benefits**: More RAM, better performance
- **Cost**: $30/month (Render Standard + Railway Pro)

### **Enterprise Setup ($100+/month)**
- **Concurrent Users**: 500+
- **Benefits**: Multiple servers, load balancing, Redis caching
- **Cost**: $100+/month

---

## 🎯 **Recommendations**

### **For Your Current Setup (Railway + Render Free Tier):**

**Realistic Capacity:**
- **10-50 concurrent users** (depending on usage patterns)
- **100+ total registered users** (not all active at once)

**To Support 100+ Concurrent Users:**
1. ✅ Increase database connection pool to 20-50
2. ✅ Upgrade Render to Starter ($7/month) or Standard ($25/month)
3. ✅ Upgrade Railway to Pro ($5/month) for better connection limits
4. ✅ Monitor connection pool usage in logs

---

## 📊 **Monitoring Capacity**

### **Check Current Usage:**

**1. Database Connection Pool:**
```javascript
// Logs show connection pool stats every minute
// Look for: "High database connection usage"
```

**2. Rate Limiting:**
- Check logs for "Rate limit exceeded" messages
- Monitor API response times

**3. Server Resources:**
- Check Render dashboard for CPU/RAM usage
- Monitor response times

---

## 🔧 **Quick Capacity Test**

**To test your current capacity:**

1. **Monitor Database Connections:**
   - Watch logs for "High database connection usage"
   - If you see this frequently, you're near capacity

2. **Monitor Response Times:**
   - If response times increase significantly, you're hitting limits

3. **Check Error Rates:**
   - Connection timeout errors = too many concurrent requests
   - Rate limit errors = too many requests from same IP

---

## 📝 **Summary**

| Metric | Current Value | Capacity Impact |
|--------|--------------|-----------------|
| **Database Connections** | 10 | Limits to ~50-100 concurrent users |
| **Rate Limit (API)** | 200/15min per IP | Prevents abuse, not a hard limit |
| **Rate Limit (Auth)** | 5/15min per IP | Prevents brute force |
| **Server RAM** | 512MB (free) | Limits clustering effectiveness |
| **Realistic Capacity** | **50-100 concurrent users** | With current setup |

**To support more users:**
- Increase connection pool (quick fix)
- Upgrade hosting plans (recommended)
- Optimize queries and caching (free)

---

**Last Updated:** Based on current configuration in `server/config/database.js` and `server/middleware/rateLimiter.js`

