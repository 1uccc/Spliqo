// In-memory sliding-window rate limiter (Zero external dependencies)
// Protects Spliqo API from spam, brute-force, and DoS attacks

class RateLimiter {
  constructor() {
    this.hits = new Map();
    // Periodically clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, records] of this.hits.entries()) {
      const valid = records.filter(timestamp => now - timestamp < 15 * 60 * 1000);
      if (valid.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, valid);
      }
    }
  }

  limit({ windowMs = 60 * 1000, max = 60, message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }) {
    return (req, res, next) => {
      // Get client identifier (IP or User ID)
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown-ip';
      const userKey = req.user?.uid ? `user:${req.user.uid}` : `ip:${ip}`;
      const routeKey = `${req.method}:${req.baseUrl || ''}${req.path}`;
      const bucketKey = `${userKey}:${routeKey}`;

      const now = Date.now();
      const timestamps = this.hits.get(bucketKey) || [];

      // Filter timestamps within the current sliding window
      const validTimestamps = timestamps.filter(t => now - t < windowMs);

      if (validTimestamps.length >= max) {
        const oldest = validTimestamps[0];
        const retryAfterSec = Math.ceil((windowMs - (now - oldest)) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', 0);
        return res.status(429).json({
          error: message,
          retryAfter: retryAfterSec
        });
      }

      validTimestamps.push(now);
      this.hits.set(bucketKey, validTimestamps);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - validTimestamps.length));

      next();
    };
  }
}

export const rateLimiterInstance = new RateLimiter();

// General API Rate Limiter: max 120 reqs / 1 min per IP/User
export const apiLimiter = rateLimiterInstance.limit({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Bạn đang gửi quá nhiều yêu cầu đến hệ thống. Vui lòng thử lại sau ít phút.'
});

// Strict Limiter for sensitive actions (Join trip code, add friend, upload): max 20 reqs / 1 min
export const strictActionLimiter = rateLimiterInstance.limit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Thao tác quá nhanh! Vui lòng đợi 1 phút trước khi tiếp tục.'
});

// Upload Limiter: max 10 uploads / 1 min
export const uploadLimiter = rateLimiterInstance.limit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Bạn đã tải lên quá nhiều hình ảnh trong thời gian ngắn. Vui lòng đợi 1 phút.'
});
