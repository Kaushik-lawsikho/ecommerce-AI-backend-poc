# Centralized Logging Implementation

This document describes the centralized logging system implemented using Pino for the ecommerce backend application.

## Overview

The logging system provides:
- **Structured JSON logging** for easy parsing and filtering
- **Centralized configuration** with module-specific loggers
- **Performance monitoring** with timing metrics
- **Audit trails** for security and compliance
- **Error tracking** with detailed context
- **Application events** for monitoring and analytics

## Architecture

### Core Components

1. **Logger Configuration** (`src/config/logger.ts`)
   - Main Pino logger instance
   - Request/response serializers
   - Module-specific logger factory
   - Specialized logging functions

2. **Request Logging Middleware**
   - Automatic request/response logging
   - Request ID generation and tracking
   - Performance timing

3. **Module Loggers**
   - Service-specific loggers with context
   - Consistent logging patterns across modules

## Log Types

### 1. Application Events
```typescript
eventLogger('user_login', { userId: '123', email: 'user@example.com' });
eventLogger('product_viewed', { productId: '456', userId: '123' });
eventLogger('order_created', { orderId: '789', total: 99.99 });
```

### 2. Performance Monitoring
```typescript
performanceLogger('database_query', duration, { 
  table: 'users', 
  operation: 'SELECT',
  recordsAffected: 1 
});
performanceLogger('ai_request', duration, {
  operation: 'recommendation',
  confidence: 0.85
});
```

### 3. Error Logging
```typescript
errorLogger(error, { 
  context: 'user_authentication',
  userId: '123',
  operation: 'login'
});
```

### 4. Audit Trails
```typescript
auditLogger('user_action', '123', 'user_profile', { 
  action: 'update_profile',
  changes: { firstName: 'John' }
});
auditLogger('ai_request', '123', 'ai_service', {
  operation: 'recommendation',
  query: 'wireless headphones'
});
```

## Usage Examples

### Basic Module Logging
```typescript
import { createModuleLogger } from '../config/logger';

const logger = createModuleLogger('my-service');

logger.info('Processing request', { requestId: '123' });
logger.warn('Deprecated API used', { endpoint: '/old-api' });
logger.error('Operation failed', { error: 'Database connection lost' });
```

### Service Integration
```typescript
import { createModuleLogger, performanceLogger, auditLogger } from '../config/logger';

export class ProductService {
  private logger = createModuleLogger('product-service');

  async getProduct(id: string) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Fetching product', { productId: id });
      
      const product = await this.database.findById(id);
      
      const duration = Date.now() - startTime;
      performanceLogger('product_fetch', duration, { productId: id });
      
      auditLogger('product_accessed', undefined, 'product', { productId: id });
      
      return product;
    } catch (error) {
      errorLogger(error, { context: 'get_product', productId: id });
      throw error;
    }
  }
}
```

## Log Structure

All logs follow a consistent JSON structure:

```json
{
  "level": "INFO",
  "time": "2024-01-15T10:30:00.000Z",
  "module": "ai-service",
  "type": "application_event",
  "event": "ai_recommendation_generated",
  "userId": "123",
  "productId": "456",
  "confidence": 0.85,
  "recommendationsCount": 5,
  "duration": 150,
  "requestId": "req_1234567890_abc123"
}
```

## Configuration

### Environment Variables
```bash
LOG_LEVEL=info          # Log level (fatal, error, warn, info, debug, trace)
NODE_ENV=development    # Environment (affects log formatting)
```

### Log Levels
- **FATAL**: System is unusable
- **ERROR**: Error events that might still allow the application to continue
- **WARN**: Warning events
- **INFO**: Informational messages
- **DEBUG**: Debug-level messages
- **TRACE**: Very detailed messages

## Monitoring Integration

The structured JSON format makes it easy to integrate with monitoring tools:

### ELK Stack (Elasticsearch, Logstash, Kibana)
```bash
# Logs are automatically in JSON format for Logstash parsing
# Use Kibana to create dashboards and alerts
```

### Prometheus/Grafana
```bash
# Extract metrics from performance logs
# Create alerts based on error rates
```

### CloudWatch/DataDog
```bash
# Ship logs to cloud monitoring services
# Set up log-based metrics and alerts
```

## Performance Considerations

- **Async Logging**: Pino uses async logging by default for better performance
- **Minimal Overhead**: Structured logging adds minimal performance impact
- **Memory Efficient**: Pino is designed for high-performance logging

## Security Considerations

- **Sensitive Data**: Never log passwords, tokens, or PII
- **Data Sanitization**: Sanitize user inputs before logging
- **Access Control**: Secure log storage and access

## Best Practices

1. **Use Appropriate Log Levels**
   - ERROR for actual errors
   - WARN for concerning but non-critical issues
   - INFO for important business events
   - DEBUG for development debugging

2. **Include Context**
   - Always include relevant IDs (userId, requestId, etc.)
   - Add operation context
   - Include timing information for performance logs

3. **Structured Data**
   - Use consistent field names
   - Include metadata for filtering
   - Avoid logging large objects

4. **Error Handling**
   - Log errors with full context
   - Include stack traces for debugging
   - Don't log the same error multiple times

## Testing

The logging system can be tested by running the example:

```bash
npm run build
node dist/examples/logging-example.js
```

This will demonstrate all logging types and show the structured JSON output.

## Migration from Console.log

All `console.log` statements have been replaced with structured logging:

- ✅ Server startup/shutdown events
- ✅ Database connection events  
- ✅ AI service operations
- ✅ Error handling
- ✅ Performance monitoring
- ✅ Audit trails

The system now provides comprehensive logging for debugging, performance monitoring, and auditing as required.
