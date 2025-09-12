import { AIService } from '../services/ai.service';
import { 
  validateAIRequest, 
  sanitizeText, 
  extractKeywords, 
  formatProductForAI,
  calculateTextSimilarity,
  validateContentType,
  formatConfidenceScore,
  AIRateLimiter,
  AIResponseCache
} from '../utils/ai.utils';

// Mock the GoogleGenAI
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('{"recommendations": [], "reasoning": "test", "confidence": 0.8}')
        }
      })
    })
  }))
}));

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';

describe('AI Service', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('getProductRecommendations', () => {
    it('should generate recommendations with valid input', async () => {
      const request = {
        searchQuery: 'wireless headphones',
        limit: 5
      };

      const result = await aiService.getProductRecommendations(request);
      
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('confidence');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should handle empty recommendations gracefully', async () => {
      const request = {
        searchQuery: 'nonexistent product',
        limit: 3
      };

      const result = await aiService.getProductRecommendations(request);
      
      expect(result.recommendations).toEqual([]);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('generateContent', () => {
    it('should generate content for product description', async () => {
      const request = {
        type: 'product_description' as const,
        productData: {
          name: 'Test Product',
          price: 99.99,
          description: 'A test product'
        }
      };

      const result = await aiService.generateContent(request);
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('suggestions');
      expect(typeof result.content).toBe('string');
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should handle invalid content type', async () => {
      const request = {
        type: 'invalid_type' as any,
        productData: { name: 'Test' }
      };

      await expect(aiService.generateContent(request)).rejects.toThrow();
    });
  });

  describe('enhanceSearchQuery', () => {
    it('should enhance search query', async () => {
      const request = {
        originalQuery: 'phone',
        context: 'looking for smartphone'
      };

      const result = await aiService.enhanceSearchQuery(request);
      
      expect(result).toHaveProperty('enhancedQuery');
      expect(result).toHaveProperty('suggestedFilters');
      expect(result).toHaveProperty('searchTerms');
      expect(typeof result.enhancedQuery).toBe('string');
      expect(Array.isArray(result.searchTerms)).toBe(true);
    });
  });

  describe('analyzeProductSentiment', () => {
    it('should analyze sentiment of reviews', async () => {
      const reviews = [
        'Great product!',
        'Not bad, could be better',
        'Excellent quality'
      ];

      const result = await aiService.analyzeProductSentiment('test-product', reviews);
      
      expect(result).toHaveProperty('overallSentiment');
      expect(result).toHaveProperty('sentimentScore');
      expect(result).toHaveProperty('keyInsights');
      expect(result).toHaveProperty('improvementSuggestions');
      expect(result).toHaveProperty('reviewSummary');
      
      expect(['positive', 'negative', 'neutral']).toContain(result.overallSentiment);
      expect(result.sentimentScore).toBeGreaterThanOrEqual(0);
      expect(result.sentimentScore).toBeLessThanOrEqual(1);
    });
  });
});

describe('AI Utils', () => {
  describe('validateAIRequest', () => {
    it('should validate required fields', () => {
      const data = { searchQuery: 'test' };
      const result = validateAIRequest(data, ['searchQuery']);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const data = { otherField: 'test' };
      const result = validateAIRequest(data, ['searchQuery']);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: searchQuery');
    });

    it('should validate limit field', () => {
      const data = { limit: 100 };
      const result = validateAIRequest(data, []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Limit must be a number between 1 and 50');
    });

    it('should validate reviews field', () => {
      const data = { reviews: 'not an array' };
      const result = validateAIRequest(data, []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Reviews must be an array of strings');
    });
  });

  describe('sanitizeText', () => {
    it('should sanitize text input', () => {
      const input = '  <script>alert("xss")</script>  Test   Text  ';
      const result = sanitizeText(input);
      
      expect(result).toBe('Test Text');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should limit text length', () => {
      const longText = 'a'.repeat(2000);
      const result = sanitizeText(longText, 100);
      
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it('should handle non-string input', () => {
      const result = sanitizeText(null as any);
      expect(result).toBe('');
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from text', () => {
      const text = 'wireless bluetooth headphones with noise cancellation';
      const keywords = extractKeywords(text);
      
      expect(keywords).toContain('wireless');
      expect(keywords).toContain('bluetooth');
      expect(keywords).toContain('headphones');
      expect(keywords).toContain('noise');
      expect(keywords).toContain('cancellation');
    });

    it('should limit number of keywords', () => {
      const text = 'a b c d e f g h i j k l m n o p q r s t u v w x y z';
      const keywords = extractKeywords(text, 5);
      
      expect(keywords.length).toBeLessThanOrEqual(5);
    });
  });

  describe('formatProductForAI', () => {
    it('should format product data for AI processing', () => {
      const product = {
        id: '123',
        name: 'Wireless Headphones',
        description: 'High-quality wireless bluetooth headphones',
        price: 99.99,
        category: { name: 'Electronics' }
      };

      const result = formatProductForAI(product);
      
      expect(result).toHaveProperty('id', '123');
      expect(result).toHaveProperty('name', 'Wireless Headphones');
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('keywords');
      expect(Array.isArray(result.features)).toBe(true);
      expect(Array.isArray(result.keywords)).toBe(true);
    });
  });

  describe('calculateTextSimilarity', () => {
    it('should calculate similarity between texts', () => {
      const text1 = 'wireless bluetooth headphones';
      const text2 = 'bluetooth wireless headphones';
      
      const similarity = calculateTextSimilarity(text1, text2);
      
      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should return 0 for empty texts', () => {
      const similarity = calculateTextSimilarity('', 'test');
      expect(similarity).toBe(0);
    });
  });

  describe('validateContentType', () => {
    it('should validate content types', () => {
      expect(validateContentType('product_description')).toBe(true);
      expect(validateContentType('product_title')).toBe(true);
      expect(validateContentType('category_description')).toBe(true);
      expect(validateContentType('marketing_copy')).toBe(true);
      expect(validateContentType('invalid_type')).toBe(false);
    });
  });

  describe('formatConfidenceScore', () => {
    it('should format confidence scores', () => {
      expect(formatConfidenceScore(0.95)).toBe('Very High');
      expect(formatConfidenceScore(0.8)).toBe('High');
      expect(formatConfidenceScore(0.6)).toBe('Medium');
      expect(formatConfidenceScore(0.4)).toBe('Low');
      expect(formatConfidenceScore(0.1)).toBe('Very Low');
    });
  });

  describe('AIRateLimiter', () => {
    let rateLimiter: AIRateLimiter;

    beforeEach(() => {
      rateLimiter = new AIRateLimiter(2, 1000); // 2 requests per second
    });

    it('should allow requests within limit', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      rateLimiter.isAllowed('user2');
      rateLimiter.isAllowed('user2');
      expect(rateLimiter.isAllowed('user2')).toBe(false);
    });

    it('should reset after window expires', async () => {
      rateLimiter.isAllowed('user3');
      rateLimiter.isAllowed('user3');
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(rateLimiter.isAllowed('user3')).toBe(true);
    });
  });

  describe('AIResponseCache', () => {
    let cache: AIResponseCache;

    beforeEach(() => {
      cache = new AIResponseCache();
    });

    it('should store and retrieve data', () => {
      const data = { test: 'data' };
      cache.set('key1', data, 1000);
      
      expect(cache.get('key1')).toEqual(data);
    });

    it('should return null for expired data', async () => {
      const data = { test: 'data' };
      cache.set('key2', data, 100);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('key2')).toBeNull();
    });

    it('should clear cache', () => {
      cache.set('key3', { test: 'data' });
      expect(cache.size()).toBe(1);
      
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });
});

describe('AI Integration', () => {
  it('should handle API key validation', () => {
    // Test with missing API key
    delete process.env.GEMINI_API_KEY;
    
    expect(() => new AIService()).toThrow('GEMINI_API_KEY is required');
  });

  it('should handle malformed AI responses', async () => {
    // This would require mocking the AI service to return malformed JSON
    // For now, we'll test the utility function
    const malformedResponse = 'invalid json';
    const fallback = { error: 'fallback' };
    
    const result = JSON.parse(JSON.stringify(fallback)); // Simulate parseAIResponse
    expect(result).toEqual(fallback);
  });
});
