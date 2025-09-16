import { Request, Response, NextFunction } from "express";
import { validate, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";
import { sanitize } from "class-sanitizer";
import { errorLogger } from "../config/logger";

/**
 * Security-focused input validation middleware
 * Implements comprehensive validation, sanitization, and security checks
 */

export interface ValidationOptions {
  skipMissingProperties?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  transform?: boolean;
  sanitize?: boolean;
}

export class ValidationErrorResponse {
  message: string = "Validation failed";
  errors: Array<{
    field: string;
    value: any;
    constraints: string[];
  }> = [];
}

/**
 * Centralized validation middleware factory
 * Creates validation middleware for specific DTO classes
 */
export function createValidationMiddleware<T>(
  dtoClass: new () => T,
  options: ValidationOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Default security-focused options
      const validationOptions: ValidationOptions = {
        skipMissingProperties: false,
        whitelist: true, // Remove properties not defined in DTO
        forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
        transform: true, // Transform plain objects to class instances
        sanitize: true, // Sanitize input data
        ...options
      };

      // Create a new instance of the DTO class
      const dto = new dtoClass();
      
      // Manually assign properties from request body
      Object.assign(dto, req.body);

      // Sanitize the object if enabled
      if (validationOptions.sanitize) {
        sanitize(dto);
      }

      // Validate the DTO
      const errors = await validate(dto as any, {
        skipMissingProperties: validationOptions.skipMissingProperties,
        whitelist: validationOptions.whitelist,
        forbidNonWhitelisted: validationOptions.forbidNonWhitelisted
      });

      if (errors.length > 0) {
        const errorResponse = new ValidationErrorResponse();
        errorResponse.errors = errors.map((error: ValidationError) => ({
          field: error.property,
          value: error.value,
          constraints: error.constraints ? Object.values(error.constraints) : []
        }));

        errorLogger(new Error("Validation failed"), {
          context: "validation_middleware",
          errors: errorResponse.errors,
          body: req.body
        });

        res.status(400).json(errorResponse);
        return;
      }

      // Replace request body with validated and sanitized data
      req.body = dto;
      next();
    } catch (error) {
      errorLogger(error as Error, {
        context: "validation_middleware",
        body: req.body
      });
      res.status(400).json({
        message: "Invalid request data",
        error: "Validation processing failed"
      });
      return;
    }
  };
}

/**
 * Query parameter validation middleware
 * Validates and sanitizes query parameters
 */
export function validateQueryParams(
  allowedParams: string[],
  maxLength: number = 100
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query;
      const sanitizedQuery: any = {};

      // Check for unknown parameters
      const unknownParams = Object.keys(query).filter(
        param => !allowedParams.includes(param)
      );

      if (unknownParams.length > 0) {
        res.status(400).json({
          message: "Invalid query parameters",
          errors: [`Unknown parameters: ${unknownParams.join(", ")}`]
        });
        return;
      }

      // Sanitize and validate each parameter
      for (const [key, value] of Object.entries(query)) {
        if (typeof value === "string") {
          // Check length
          if (value.length > maxLength) {
            res.status(400).json({
              message: "Query parameter too long",
              errors: [`Parameter '${key}' exceeds maximum length of ${maxLength}`]
            });
            return;
          }

          // Basic XSS prevention - remove script tags and dangerous characters
          const sanitized = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/[<>]/g, "")
            .trim();

          if (sanitized !== value) {
            errorLogger(new Error("Potential XSS attempt detected"), {
              context: "query_validation",
              parameter: key,
              originalValue: value,
              sanitizedValue: sanitized
            });
          }

          sanitizedQuery[key] = sanitized;
        } else {
          sanitizedQuery[key] = value;
        }
      }

      req.query = sanitizedQuery;
      next();
    } catch (error) {
      errorLogger(error as Error, {
        context: "query_validation",
        query: req.query
      });
      res.status(400).json({
        message: "Query parameter validation failed",
        error: "Invalid query parameters"
      });
      return;
    }
  };
}

/**
 * Path parameter validation middleware
 * Validates UUID and other path parameters
 */
export function validatePathParams(
  paramValidators: { [key: string]: (value: string) => boolean }
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const [paramName, validator] of Object.entries(paramValidators)) {
        const value = req.params[paramName];
        if (value && !validator(value)) {
          res.status(400).json({
            message: "Invalid path parameter",
            errors: [`Parameter '${paramName}' has invalid format`]
          });
          return;
        }
      }
      next();
    } catch (error) {
      errorLogger(error as Error, {
        context: "path_validation",
        params: req.params
      });
      res.status(400).json({
        message: "Path parameter validation failed",
        error: "Invalid path parameters"
      });
      return;
    }
  };
}

/**
 * Common validation functions
 */
export const validators = {
  uuid: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) && value.length <= 255;
  },

  username: (value: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    return usernameRegex.test(value);
  },

  phone: (value: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value) && value.length <= 20;
  },

  positiveNumber: (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  },

  nonNegativeNumber: (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  },

  pageNumber: (value: string): boolean => {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 1000;
  },

  limit: (value: string): boolean => {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 100;
  }
};

/**
 * Request size validation middleware
 * Prevents DoS attacks through large payloads
 */
export function validateRequestSize(maxSize: number = 1024 * 1024): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      errorLogger(new Error("Request size exceeded"), {
        context: "request_size_validation",
        contentLength,
        maxSize,
        ip: req.ip
      });
      
      res.status(413).json({
        message: "Request too large",
        error: `Request size exceeds maximum allowed size of ${maxSize} bytes`
      });
      return;
    }
    
    next();
  };
}
