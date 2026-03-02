import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Session creation rate limiter (effectively disabled)
 */
export const sessionCreationLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 999999, // Effectively unlimited
  message: 'Too many session creation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Code execution rate limiter (disabled for unlimited executions)
 */
export const executionLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 999999, // Unlimited executions
  message: 'Please wait before executing code again.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
