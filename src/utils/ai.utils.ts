/**
 * AI Utility Functions
 * Helper functions for AI response formatting, validation, and processing
 */

export interface AIResponseFormat {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}

export interface AIValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Format AI responses consistently
 */
export function formatAIResponse(
  data: any,
  success: boolean = true,
  error?: string,
  metadata?: any
): AIResponseFormat {
  return {
    success,
    data: success ? data : undefined,
    error: success ? undefined : error,
    metadata: {
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
      processingTime: metadata?.processingTime || 0,
      ...metadata
    }
  };
}

/**
 * Validate AI request parameters
 */
export function validateAIRequest(
  data: any,
  requiredFields: string[] = [],
  optionalFields: string[] = []
): AIValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of requiredFields) {
    if (!data[field] && data[field] !== 0) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check for unknown fields
  const allowedFields = [...requiredFields, ...optionalFields];
  const unknownFields = Object.keys(data).filter(key => !allowedFields.includes(key));
  if (unknownFields.length > 0) {
    warnings.push(`Unknown fields detected: ${unknownFields.join(', ')}`);
  }

  // Validate specific field types
  if (data.limit && (typeof data.limit !== 'number' || data.limit < 1 || data.limit > 50)) {
    errors.push('Limit must be a number between 1 and 50');
  }

  if (data.searchQuery && typeof data.searchQuery !== 'string') {
    errors.push('Search query must be a string');
  }

  if (data.reviews && (!Array.isArray(data.reviews) || !data.reviews.every((r: any) => typeof r === 'string'))) {
    errors.push('Reviews must be an array of strings');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Sanitize AI input text
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[^\w\s.,!?@#$%^&*()_+\-=\[\]{}|;':"\\,.<>?/~`]/g, '') // Remove special characters
    .substring(0, maxLength) // Limit length
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  if (!text || typeof text !== 'string') return [];
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  // Count word frequency
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Sort by frequency and return top keywords
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Format product data for AI processing
 */
export function formatProductForAI(product: any): any {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category?.name || product.categoryName,
    features: extractProductFeatures(product),
    keywords: extractKeywords(`${product.name} ${product.description || ''}`)
  };
}

/**
 * Extract product features from description
 */
export function extractProductFeatures(product: any): string[] {
  const features: string[] = [];
  const text = `${product.name} ${product.description || ''}`.toLowerCase();
  
  // Common product features
  const featureKeywords = [
    'wireless', 'bluetooth', 'waterproof', 'durable', 'lightweight',
    'premium', 'advanced', 'smart', 'digital', 'portable', 'rechargeable',
    'noise-cancelling', 'fast-charging', 'high-resolution', 'ultra-thin',
    'ergonomic', 'anti-bacterial', 'shockproof', 'weather-resistant'
  ];
  
  for (const keyword of featureKeywords) {
    if (text.includes(keyword)) {
      features.push(keyword);
    }
  }
  
  // Price-based features
  if (product.price) {
    if (product.price < 50) features.push('budget-friendly');
    else if (product.price > 500) features.push('premium');
    else if (product.price > 1000) features.push('luxury');
  }
  
  return [...new Set(features)]; // Remove duplicates
}

/**
 * Calculate similarity between two texts
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * Format error messages for AI responses
 */
export function formatAIError(error: any, context?: string): string {
  if (typeof error === 'string') return error;
  
  if (error.message) {
    return context ? `${context}: ${error.message}` : error.message;
  }
  
  return context ? `${context}: Unknown error occurred` : 'Unknown error occurred';
}

/**
 * Generate request ID
 */
export function generateRequestId(): string {
  return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate AI content type
 */
export function validateContentType(type: string): boolean {
  const validTypes = [
    'product_description',
    'product_title',
    'category_description',
    'marketing_copy'
  ];
  return validTypes.includes(type);
}

/**
 * Format confidence score
 */
export function formatConfidenceScore(score: number): string {
  if (score >= 0.9) return 'Very High';
  if (score >= 0.7) return 'High';
  if (score >= 0.5) return 'Medium';
  if (score >= 0.3) return 'Low';
  return 'Very Low';
}

/**
 * Parse AI response safely
 */
export function parseAIResponse<T>(response: string, fallback: T): T {
  try {
    return JSON.parse(response);
  } catch (error) {
    // Note: This utility function doesn't have access to logger, so we'll keep console.warn
    // In a real implementation, you might want to pass a logger instance or use a global logger
    console.warn('Failed to parse AI response:', error);
    return fallback;
  }
}

/**
 * Rate limit helper
 */
export class AIRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clean up old entries
    for (const [k, v] of this.requests.entries()) {
      if (v.resetTime < windowStart) {
        this.requests.delete(k);
      }
    }
    
    const userRequests = this.requests.get(key);
    
    if (!userRequests) {
      this.requests.set(key, { count: 1, resetTime: now });
      return true;
    }
    
    if (userRequests.resetTime < windowStart) {
      this.requests.set(key, { count: 1, resetTime: now });
      return true;
    }
    
    if (userRequests.count >= this.maxRequests) {
      return false;
    }
    
    userRequests.count++;
    return true;
  }
  
  getRemainingRequests(key: string): number {
    const userRequests = this.requests.get(key);
    if (!userRequests) return this.maxRequests;
    
    const now = Date.now();
    if (userRequests.resetTime < now - this.windowMs) {
      return this.maxRequests;
    }
    
    return Math.max(0, this.maxRequests - userRequests.count);
  }
  
  getResetTime(key: string): number {
    const userRequests = this.requests.get(key);
    if (!userRequests) return 0;
    
    return userRequests.resetTime + this.windowMs;
  }
}

/**
 * AI response cache helper
 */
export class AIResponseCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}
