import { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis";
import { errorLogger, eventLogger } from "../config/logger";
import * as crypto from "crypto";

/**
 * Comprehensive security middleware for protecting against common vulnerabilities
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface SecurityHeaders {
  [key: string]: string;
}

/**
 * Rate limiting middleware using Redis
 * Prevents DoS attacks and brute force attempts
 */
export function createRateLimit(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = config.keyGenerator ? config.keyGenerator(req) : `rate_limit:${req.ip}`;
      const window = Math.floor(Date.now() / config.windowMs);
      const redisKey = `${key}:${window}`;

      // Get current request count
      const current = await redisClient.get(redisKey);
      const count = current ? parseInt(current) : 0;

      if (count >= config.maxRequests) {
        errorLogger(new Error("Rate limit exceeded"), {
          context: "rate_limiting",
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          count,
          limit: config.maxRequests
        });

        return res.status(429).json({
          message: "Too many requests",
          error: "Rate limit exceeded",
          retryAfter: Math.ceil(config.windowMs / 1000)
        });
      }

      // Increment counter
      await redisClient.incr(redisKey);
      await redisClient.expire(redisKey, Math.ceil(config.windowMs / 1000));

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, config.maxRequests - count - 1).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
      });

      next();
    } catch (error) {
      errorLogger(error as Error, {
        context: "rate_limiting",
        ip: req.ip
      });
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

/**
 * XSS Protection middleware
 * Sanitizes input and sets security headers
 */
export function xssProtection(req: Request, res: Response, next: NextFunction) {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize path parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    errorLogger(error as Error, {
      context: "xss_protection",
      ip: req.ip
    });
    next();
  }
}

/**
 * Recursively sanitize objects to prevent XSS
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize string to prevent XSS attacks
 */
function sanitizeString(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embed tags
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '') // Remove link tags
    .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '') // Remove meta tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>]/g, '') // Remove remaining angle brackets
    .trim();
}

/**
 * Security headers middleware
 * Sets comprehensive security headers
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  const headers: SecurityHeaders = {
    // Prevent XSS attacks
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Content Security Policy
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';",
    
    // HSTS (only in production)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),
    
    // Prevent MIME type sniffing
    'X-Download-Options': 'noopen',
    
    // Cache control for sensitive endpoints
    ...(req.path.includes('/auth') && {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
  };

  // Set headers
  Object.entries(headers).forEach(([key, value]) => {
    res.set(key, value);
  });

  next();
}

/**
 * Request size validation middleware
 * Prevents DoS attacks through large payloads
 */
export function requestSizeLimit(maxSize: number = 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      errorLogger(new Error("Request size exceeded"), {
        context: "request_size_validation",
        contentLength,
        maxSize,
        ip: req.ip,
        path: req.path
      });
      
      return res.status(413).json({
        message: "Request too large",
        error: `Request size exceeds maximum allowed size of ${Math.round(maxSize / 1024)}KB`
      });
    }
    
    next();
  };
}

/**
 * SQL Injection protection middleware
 * Validates and sanitizes database-related inputs
 */
export function sqlInjectionProtection(req: Request, res: Response, next: NextFunction) {
  try {
    const dangerousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(\b(OR|AND)\s+'.*?'\s*=\s*'.*?')/gi,
      /(;|\-\-|\/\*|\*\/)/g,
      /(\b(UNION|UNION ALL)\b)/gi,
      /(\b(INFORMATION_SCHEMA|SYS\.|SYSTEM\.)\b)/gi
    ];

    const checkValue = (value: any, path: string = ''): boolean => {
      if (typeof value === 'string') {
        for (const pattern of dangerousPatterns) {
          if (pattern.test(value)) {
            errorLogger(new Error("Potential SQL injection attempt detected"), {
              context: "sql_injection_protection",
              pattern: pattern.toString(),
              value: value.substring(0, 100), // Log first 100 chars
              path,
              ip: req.ip,
              userAgent: req.get('User-Agent')
            });
            return true;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const [key, val] of Object.entries(value)) {
          if (checkValue(val, `${path}.${key}`)) {
            return true;
          }
        }
      }
      return false;
    };

    // Check request body, query, and params
    if (checkValue(req.body, 'body') || 
        checkValue(req.query, 'query') || 
        checkValue(req.params, 'params')) {
      return res.status(400).json({
        message: "Invalid request data",
        error: "Request contains potentially malicious content"
      });
    }

    next();
  } catch (error) {
    errorLogger(error as Error, {
      context: "sql_injection_protection",
      ip: req.ip
    });
    next();
  }
}

/**
 * File upload security middleware
 * Validates file uploads for type, size, and content
 */
export function fileUploadSecurity(options: {
  maxFileSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // This would typically work with multer or similar file upload middleware
      // For now, we'll validate the file data if it exists in the request
      if (req.body && req.body.file) {
        const fileData = req.body.file;
        
        // Check file size (assuming base64 encoded)
        const fileSize = Buffer.from(fileData, 'base64').length;
        if (fileSize > options.maxFileSize) {
          return res.status(400).json({
            message: "File too large",
            error: `File size exceeds maximum allowed size of ${Math.round(options.maxFileSize / 1024)}KB`
          });
        }

        // Check file type by magic bytes
        const buffer = Buffer.from(fileData, 'base64');
        const fileType = detectFileType(buffer);
        
        if (!fileType || !options.allowedTypes.includes(fileType)) {
          return res.status(400).json({
            message: "File type not allowed",
            error: `File type '${fileType}' is not permitted. Allowed types: ${options.allowedTypes.join(', ')}`
          });
        }

        // Check file extension if provided
        if (req.body.fileName) {
          const extension = req.body.fileName.split('.').pop()?.toLowerCase();
          if (!extension || !options.allowedExtensions.includes(extension)) {
            return res.status(400).json({
              message: "File extension not allowed",
              error: `File extension '.${extension}' is not permitted. Allowed extensions: ${options.allowedExtensions.join(', ')}`
            });
          }
        }
      }

      next();
    } catch (error) {
      errorLogger(error as Error, {
        context: "file_upload_security",
        ip: req.ip
      });
      res.status(400).json({
        message: "File upload validation failed",
        error: "Invalid file data"
      });
    }
  };
}

/**
 * Detect file type from magic bytes
 */
function detectFileType(buffer: Buffer): string | null {
  const magicNumbers: { [key: string]: number[] } = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
    'application/zip': [0x50, 0x4B, 0x03, 0x04],
    'text/plain': [0xEF, 0xBB, 0xBF] // UTF-8 BOM
  };

  for (const [mimeType, magic] of Object.entries(magicNumbers)) {
    if (buffer.length >= magic.length) {
      const matches = magic.every((byte, index) => buffer[index] === byte);
      if (matches) {
        return mimeType;
      }
    }
  }

  return null;
}

/**
 * IP whitelist/blacklist middleware
 */
export function ipFilter(allowedIPs?: string[], blockedIPs?: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    // Check blacklist first
    if (blockedIPs && blockedIPs.includes(clientIP)) {
      errorLogger(new Error("Blocked IP attempted access"), {
        context: "ip_filter",
        ip: clientIP,
        path: req.path
      });
      return res.status(403).json({
        message: "Access denied",
        error: "Your IP address is not allowed"
      });
    }

    // Check whitelist if provided
    if (allowedIPs && !allowedIPs.includes(clientIP)) {
      errorLogger(new Error("Non-whitelisted IP attempted access"), {
        context: "ip_filter",
        ip: clientIP,
        path: req.path
      });
      return res.status(403).json({
        message: "Access denied",
        error: "Your IP address is not authorized"
      });
    }

    next();
  };
}

/**
 * Request logging for security monitoring
 */
export function securityLogging(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script/gi, // XSS attempts
    /union\s+select/gi, // SQL injection
    /eval\s*\(/gi, // Code injection
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi // Event handlers
  ];

  const requestString = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      eventLogger("suspicious_request_detected", {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        pattern: pattern.toString(),
        timestamp: new Date().toISOString()
      });
      break;
    }
  }

  // Log response time for performance monitoring
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 5000) { // Log slow requests
      eventLogger("slow_request", {
        ip: req.ip,
        path: req.path,
        method: req.method,
        duration,
        statusCode: res.statusCode
      });
    }
  });

  next();
}

/**
 * CSRF protection middleware (basic implementation)
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET requests and API endpoints that don't modify data
  if (req.method === 'GET' || req.path.startsWith('/api/v1/')) {
    return next();
  }

  // For state-changing operations, require CSRF token
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = (req.session as any)?.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return res.status(403).json({
      message: "CSRF token required",
      error: "Invalid or missing CSRF token"
    });
  }

  next();
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
