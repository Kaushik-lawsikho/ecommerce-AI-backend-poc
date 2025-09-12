import { Request, Response, NextFunction } from 'express';

export interface AIRequest extends Request {
  aiContext?: {
    userId?: string;
    sessionId?: string;
    requestId: string;
    timestamp: Date;
  };
}

/**
 * Middleware to add AI context to requests
 */
export const addAIContext = (req: AIRequest, res: Response, next: NextFunction) => {
  req.aiContext = {
    userId: (req.session as any)?.userId,
    sessionId: req.sessionID,
    requestId: generateRequestId(),
    timestamp: new Date()
  };
  next();
};

/**
 * Middleware to validate AI API key
 */
export const validateAIKey = (req: Request, res: Response, next: NextFunction) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'AI service unavailable',
      message: 'AI API key not configured'
    });
  }
  next();
};

/**
 * Middleware to handle AI rate limiting
 */
export const aiRateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [k, v] of requests.entries()) {
      if (v.resetTime < windowStart) {
        requests.delete(k);
      }
    }
    
    const userRequests = requests.get(key);
    
    if (!userRequests) {
      requests.set(key, { count: 1, resetTime: now });
      return next();
    }
    
    if (userRequests.resetTime < windowStart) {
      requests.set(key, { count: 1, resetTime: now });
      return next();
    }
    
    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Maximum ${maxRequests} AI requests per ${windowMs / 1000 / 60} minutes`,
        retryAfter: Math.ceil((userRequests.resetTime + windowMs - now) / 1000)
      });
    }
    
    userRequests.count++;
    next();
  };
};

/**
 * Middleware to validate AI request parameters
 */
export const validateAIRequest = (requiredFields: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = requiredFields.filter(field => {
      const bodyValue = req.body && req.body[field];
      const queryValue = req.query && req.query[field];
      return !bodyValue && !queryValue;
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: `Required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }
    
    next();
  };
};

/**
 * Middleware to validate that at least one of the specified fields is present
 */
export const validateAtLeastOne = (fields: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const hasAtLeastOne = fields.some(field => {
      const bodyValue = req.body && req.body[field];
      const queryValue = req.query && req.query[field];
      return bodyValue || queryValue;
    });
    
    if (!hasAtLeastOne) {
      return res.status(400).json({
        error: 'Missing required field',
        message: `At least one of these fields is required: ${fields.join(', ')}`,
        requiredFields: fields
      });
    }
    
    next();
  };
};

/**
 * Error handler for AI-related errors
 */
export const aiErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('AI Error:', error);
  
  // Handle specific AI errors
  if (error.message?.includes('API key')) {
    return res.status(401).json({
      error: 'AI authentication failed',
      message: 'Invalid or missing AI API key'
    });
  }
  
  if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
    return res.status(429).json({
      error: 'AI service rate limited',
      message: 'AI service is temporarily unavailable due to rate limits'
    });
  }
  
  if (error.message?.includes('timeout')) {
    return res.status(504).json({
      error: 'AI service timeout',
      message: 'AI service request timed out'
    });
  }
  
  // Generic AI error
  if (error.message?.includes('AI') || error.message?.includes('Gemini')) {
    return res.status(502).json({
      error: 'AI service error',
      message: 'AI service is temporarily unavailable'
    });
  }
  
  // Pass to next error handler
  next(error);
};

/**
 * Middleware to log AI requests
 */
export const logAIRequest = (req: AIRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      aiContext: req.aiContext,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };
    
    console.log('AI Request:', JSON.stringify(logData, null, 2));
  });
  
  next();
};

/**
 * Utility function to generate request ID
 */
function generateRequestId(): string {
  return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware to sanitize AI input
 */
export const sanitizeAIInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize text inputs from body (only if body exists)
  if (req.body && typeof req.body === 'object') {
    if (req.body.searchQuery) {
      req.body.searchQuery = sanitizeText(req.body.searchQuery);
    }
    
    if (req.body.additionalContext) {
      req.body.additionalContext = sanitizeText(req.body.additionalContext);
    }
  }
  
  // Sanitize query parameters
  if (req.query && req.query.search) {
    req.query.search = sanitizeText(req.query.search as string);
  }
  
  next();
};

/**
 * Utility function to sanitize text input
 */
function sanitizeText(text: string): string {
  if (typeof text !== 'string') return text;
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
    .replace(/\s+/g, ' '); // Normalize whitespace
}
