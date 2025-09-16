import pino from 'pino';
import { Request, Response } from 'express';

// Logger configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  serializers: {
    req: (req: Request) => ({
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
      remoteAddress: req.ip,
      remotePort: req.connection?.remotePort,
    }),
    res: (res: Response) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders(),
    }),
    err: pino.stdSerializers.err,
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
      hideObject: false
    }
  }
});

// Create child loggers for different modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module }) as any;
};

// Request logger middleware
export const requestLogger = (req: Request, res: Response, next: Function) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to request object
  (req as any).requestId = requestId;
  
  // Log request start
  logger.info({
    type: 'request_start',
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  }, 'Request started');

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[logLevel]({
      type: 'request_end',
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    }, 'Request completed');
  });

  next();
};

// Error logger
export const errorLogger = (error: Error, context?: any) => {
  logger.error({
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
  }, 'Application error occurred');
};

// Performance logger
export const performanceLogger = (operation: string, duration: number, metadata?: any) => {
  logger.info({
    type: 'performance',
    operation,
    duration,
    metadata,
  }, 'Performance metric');
};

// Audit logger
export const auditLogger = (action: string, userId?: string, resource?: string, details?: any) => {
  logger.info({
    type: 'audit',
    action,
    userId,
    resource,
    details,
    timestamp: new Date().toISOString(),
  }, 'Audit event');
};

// Application event logger
export const eventLogger = (event: string, data?: any) => {
  logger.info({
    type: 'application_event',
    event,
    data,
    timestamp: new Date().toISOString(),
  }, 'Application event');
};

export default logger;
