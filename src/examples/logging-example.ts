/**
 * Example demonstrating the centralized logging system
 * This file shows how to use the different logging functions
 */

import { createModuleLogger, eventLogger, errorLogger, performanceLogger, auditLogger } from '../config/logger';

// Create a module-specific logger
const logger = createModuleLogger('example-module');

export function demonstrateLogging() {
  // Basic logging with different levels
  logger.info('Application started', { version: '1.0.0', environment: 'development' });
  logger.warn('This is a warning message', { code: 'WARN001' });
  logger.error('This is an error message', { code: 'ERR001', details: 'Something went wrong' });
  logger.debug('Debug information', { data: { key: 'value' } });

  // Application events
  eventLogger('user_login', { userId: '123', email: 'user@example.com' });
  eventLogger('product_viewed', { productId: '456', userId: '123', category: 'electronics' });
  eventLogger('order_created', { orderId: '789', userId: '123', total: 99.99 });

  // Performance monitoring
  const startTime = Date.now();
  // Simulate some work
  setTimeout(() => {
    const duration = Date.now() - startTime;
    performanceLogger('database_query', duration, { 
      table: 'users', 
      operation: 'SELECT', 
      recordsAffected: 1 
    });
  }, 100);

  // Error logging with context
  try {
    throw new Error('Simulated error for demonstration');
  } catch (error) {
    errorLogger(error as Error, { 
      context: 'demonstration',
      userId: '123',
      operation: 'simulate_error'
    });
  }

  // Audit trail logging
  auditLogger('user_action', '123', 'user_profile', { 
    action: 'update_profile',
    changes: { firstName: 'John', lastName: 'Doe' }
  });
  
  auditLogger('admin_action', 'admin-456', 'system_config', { 
    action: 'update_config',
    configKey: 'max_users',
    oldValue: 100,
    newValue: 200
  });

  // AI-specific logging
  auditLogger('ai_request', '123', 'ai_service', {
    operation: 'recommendation',
    query: 'wireless headphones',
    confidence: 0.85,
    recommendationsCount: 5
  });

  console.log('Logging demonstration completed. Check the console output for structured JSON logs.');
}

// Example of how to use in a service
export class ExampleService {
  private logger = createModuleLogger('example-service');

  async processData(data: any) {
    this.logger.info('Processing data', { dataSize: data.length });
    
    try {
      // Simulate processing
      const result = await this.simulateProcessing(data);
      
      performanceLogger('data_processing', Date.now(), { 
        inputSize: data.length,
        outputSize: result.length 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to process data', { error: (error as Error).message });
      throw error;
    }
  }

  private async simulateProcessing(data: any): Promise<any> {
    // Simulate async work
    return new Promise(resolve => {
      setTimeout(() => resolve(data), 100);
    });
  }
}
