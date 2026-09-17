import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for public endpoints (e.g. check results).
 * 10 requests per minute per IP to prevent code-guessing.
 */
export const publicRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Please wait a moment before trying again.',
  },
});

/**
 * General API rate limiter — more lenient for authenticated routes.
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
