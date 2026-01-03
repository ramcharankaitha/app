// Simple in-memory rate limiter (for production, consider Redis-based solution)
const rateLimitStore = new Map();

const rateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      for (const [k, v] of rateLimitStore.entries()) {
        if (now - v.resetTime > windowMs) {
          rateLimitStore.delete(k);
        }
      }
    }
    
    const record = rateLimitStore.get(key);
    
    if (!record || now - record.resetTime > windowMs) {
      // New window or expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now
      });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again after ${Math.ceil((windowMs - (now - record.resetTime)) / 1000)} seconds.`,
        retryAfter: Math.ceil((windowMs - (now - record.resetTime)) / 1000)
      });
    }
    
    record.count++;
    next();
  };
};

// Different rate limits for different endpoints
const createRateLimiter = (windowMs, maxRequests) => {
  return rateLimiter(windowMs, maxRequests);
};

// Standard API rate limiter: 200 requests per 15 minutes (increased for better UX)
const apiLimiter = createRateLimiter(15 * 60 * 1000, 200);

// Strict limiter for auth endpoints: 5 requests per 15 minutes
const authLimiter = createRateLimiter(15 * 60 * 1000, 5);

// Moderate limiter for heavy operations: 20 requests per 15 minutes
const moderateLimiter = createRateLimiter(15 * 60 * 1000, 20);

module.exports = {
  rateLimiter,
  apiLimiter,
  authLimiter,
  moderateLimiter
};

