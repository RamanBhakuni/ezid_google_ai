/**
 * Minimal in-memory rate limiter (fixed window per key).
 * Good for a single API instance. For multiple instances behind a load
 * balancer, back this with Redis instead of the in-process Map.
 */
const hits = new Map(); // key -> last-allowed timestamp (ms)

export function rateLimit({ windowMs, keyFn, message }) {
  return (req, res, next) => {
    const key = keyFn(req);
    if (!key) return next(); // nothing to key on — let the handler validate

    const now = Date.now();
    const last = hits.get(key);

    if (last && now - last < windowMs) {
      const retryAfter = Math.ceil((windowMs - (now - last)) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: message || `Too many requests. Try again in ${retryAfter}s.`,
        retryAfter,
      });
    }

    hits.set(key, now);

    // Opportunistic cleanup so the Map can't grow unbounded.
    if (hits.size > 5000) {
      for (const [k, t] of hits) if (now - t > windowMs) hits.delete(k);
    }
    next();
  };
}
