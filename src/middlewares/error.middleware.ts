import { Request, Response, NextFunction } from "express";
import { errorLogger, eventLogger } from "../config/logger";

/**
 * Secure error handling middleware
 * Prevents sensitive information leakage while providing useful error responses
 */

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  keyValue?: any;
  errors?: any;
}

/**
 * Custom error class for application errors
 */
export class ApplicationError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends ApplicationError {
  public errors: any;

  constructor(message: string, errors: any) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends ApplicationError {
  constructor(message: string = "Authentication required") {
    super(message, 401);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends ApplicationError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends ApplicationError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends ApplicationError {
  constructor(message: string = "Resource conflict") {
    super(message, 409);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends ApplicationError {
  constructor(message: string = "Too many requests") {
    super(message, 429);
  }
}

/**
 * Security error class for security-related issues
 */
export class SecurityError extends ApplicationError {
  constructor(message: string = "Security violation detected") {
    super(message, 400);
  }
}

/**
 * Handle different types of errors
 */
function handleError(error: AppError, req: Request): {
  statusCode: number;
  message: string;
  error?: string;
  details?: any;
} {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";
  let errorType = "INTERNAL_ERROR";
  let details: any = undefined;

  // Handle specific error types
  if (error.name === "ValidationError") {
    statusCode = 400;
    errorType = "VALIDATION_ERROR";
    details = error.errors;
  } else if (error.name === "CastError") {
    statusCode = 400;
    errorType = "INVALID_ID";
    message = "Invalid ID format";
  } else if (error.name === "MongoError" || error.name === "MongooseError") {
    statusCode = 500;
    errorType = "DATABASE_ERROR";
    message = "Database operation failed";
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    errorType = "INVALID_TOKEN";
    message = "Invalid token";
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    errorType = "TOKEN_EXPIRED";
    message = "Token expired";
  } else if (error.name === "MulterError") {
    statusCode = 400;
    errorType = "FILE_UPLOAD_ERROR";
    message = "File upload failed";
  } else if (error.code === "11000") {
    // MongoDB duplicate key error
    statusCode = 409;
    errorType = "DUPLICATE_KEY";
    message = "Resource already exists";
    details = error.keyValue;
  } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
    statusCode = 503;
    errorType = "SERVICE_UNAVAILABLE";
    message = "External service unavailable";
  }

  // Log security-related errors with more detail
  if (error instanceof SecurityError || errorType.includes("SECURITY")) {
    eventLogger("security_error", {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      errorType,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  return {
    statusCode,
    message,
    error: errorType,
    details
  };
}

/**
 * Main error handling middleware
 */
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  errorLogger(error, {
    context: "error_handler",
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Handle the error
  const { statusCode, message, error: errorType, details } = handleError(error, req);

  // Prepare response
  const response: any = {
    message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add error type in development
  if (process.env.NODE_ENV === "development") {
    response.error = errorType;
    response.details = details;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    response.requestId = req.headers['x-request-id'];
  }

  // Send response
  res.status(statusCode).json(response);
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  
  eventLogger("route_not_found", {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    message: "Route not found",
    error: "NOT_FOUND",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global uncaught exception handler
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    errorLogger(error, {
      context: "uncaught_exception",
      type: "uncaught_exception"
    });
    
    // Graceful shutdown
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    errorLogger(new Error(`Unhandled Rejection: ${reason}`), {
      context: "unhandled_rejection",
      type: "unhandled_rejection",
      reason: reason?.toString(),
      promise: promise?.toString()
    });
    
    // Graceful shutdown
    process.exit(1);
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    eventLogger("process_termination", {
      context: "sigterm",
      signal: "SIGTERM"
    });
    process.exit(0);
  });

  // Handle SIGINT
  process.on('SIGINT', () => {
    eventLogger("process_termination", {
      context: "sigint",
      signal: "SIGINT"
    });
    process.exit(0);
  });
}

/**
 * Security-focused error responses
 */
export const securityErrorResponses = {
  sqlInjection: {
    message: "Invalid request data",
    error: "SECURITY_VIOLATION"
  },
  xssAttempt: {
    message: "Invalid request data",
    error: "SECURITY_VIOLATION"
  },
  rateLimitExceeded: {
    message: "Too many requests",
    error: "RATE_LIMIT_EXCEEDED"
  },
  fileUploadViolation: {
    message: "File upload not allowed",
    error: "SECURITY_VIOLATION"
  },
  invalidToken: {
    message: "Invalid or expired token",
    error: "AUTHENTICATION_FAILED"
  },
  accessDenied: {
    message: "Access denied",
    error: "AUTHORIZATION_FAILED"
  }
};
