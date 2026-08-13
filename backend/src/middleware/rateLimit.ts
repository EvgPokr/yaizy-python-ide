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
 * Session creation rate limiter
 */
export const sessionCreationLimiter = rateLimit({
  windowMs: parseInt(process.env.SESSION_CREATE_RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.SESSION_CREATE_RATE_LIMIT_MAX || '20', 10),
  message: 'Too many session creation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Code execution rate limiter
 */
export const executionLimiter = rateLimit({
  windowMs: parseInt(process.env.EXECUTION_RATE_LIMIT_WINDOW_MS || '10000', 10),
  max: parseInt(process.env.EXECUTION_RATE_LIMIT_MAX || '30', 10),
  message: 'Please wait before executing code again.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
