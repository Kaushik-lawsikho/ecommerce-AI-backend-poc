import { GoogleGenAI } from '@google/genai';
import { Product } from '../entities/product.entity';
import { ProductService } from './product.service';
import { createModuleLogger, errorLogger, performanceLogger, auditLogger } from '../config/logger';

const logger = createModuleLogger('ai-service');

export interface AIRecommendationRequest {
  userId?: string;
  productId?: string;
  categoryId?: string;
  searchQuery?: string;
  limit?: number;
}

export interface AIRecommendationResponse {
  recommendations: Product[];
  reasoning: string;
  confidence: number;
}

export interface AIContentRequest {
  type: 'product_description' | 'product_title' | 'category_description' | 'marketing_copy';
  productData?: Partial<Product>;
  categoryName?: string;
  additionalContext?: string;
}

export interface AIContentResponse {
  content: string;
  suggestions?: string[];
}

export interface AISearchEnhancementRequest {
  originalQuery: string;
  context?: string;
  filters?: Record<string, any>;
}

export interface AISearchEnhancementResponse {
  enhancedQuery: string;
  suggestedFilters: Record<string, any>;
  searchTerms: string[];
}

export class AIService {
  private genAI: GoogleGenAI;
  private productService: ProductService;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    this.genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    this.productService = new ProductService();
  }

  /**
   * Generate product recommendations using AI
   */
  async getProductRecommendations(request: AIRecommendationRequest): Promise<AIRecommendationResponse> {
    const startTime = Date.now();
    try {
      const { userId, productId, categoryId, searchQuery, limit = 5 } = request;
      
      logger.info('Starting AI recommendation generation', { 
        userId, 
        productId, 
        categoryId, 
        searchQuery, 
        limit 
      });
      
      // Get context products
      let contextProducts: Product[] = [];
      if (productId) {
        const product = await this.productService.findById(productId);
        if (product) contextProducts = [product];
      } else if (categoryId) {
        contextProducts = await this.productService.getProductsByCategory(categoryId);
      } else {
        contextProducts = await this.productService.getFeaturedProducts(10);
      }

      // If no products found, return empty recommendations with explanation
      if (contextProducts.length === 0) {
        logger.warn('No products found for recommendations', { productId, categoryId });
        return {
          recommendations: [],
          reasoning: 'No products available for recommendations. Please add some products to the database first.',
          confidence: 0
        };
      }

      const productContext = contextProducts.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category?.name,
        features: this.extractProductFeatures(p)
      }));

      const prompt = this.buildRecommendationPrompt(productContext, searchQuery, limit);
      
      const response = await this.genAI.models.generateContentStream({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      let text = '';
      for await (const chunk of response) {
        text += chunk.text || '';
      }

      const result = this.parseRecommendationResponse(text, limit);
      const duration = Date.now() - startTime;
      
      performanceLogger('ai_recommendation_generation', duration, {
        userId,
        productId,
        categoryId,
        searchQuery,
        limit,
        recommendationsCount: result.recommendations.length,
        confidence: result.confidence
      });
      
      auditLogger('ai_recommendation_generated', userId, 'ai_service', {
        productId,
        categoryId,
        searchQuery,
        limit,
        recommendationsCount: result.recommendations.length,
        confidence: result.confidence
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      errorLogger(error as Error, { 
        context: 'ai_recommendation_generation',
        userId: request.userId,
        productId: request.productId,
        categoryId: request.categoryId,
        searchQuery: request.searchQuery,
        limit: request.limit,
        duration
      });
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Generate content using AI
   */
  async generateContent(request: AIContentRequest): Promise<AIContentResponse> {
    const startTime = Date.now();
    try {
      logger.info('Starting AI content generation', { type: request.type });
      
      const prompt = this.buildContentPrompt(request);
      
      const response = await this.genAI.models.generateContentStream({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      let text = '';
      for await (const chunk of response) {
        text += chunk.text || '';
      }

      const result = this.parseContentResponse(text);
      const duration = Date.now() - startTime;
      
      performanceLogger('ai_content_generation', duration, {
        type: request.type,
        contentLength: result.content.length
      });
      
      auditLogger('ai_content_generated', undefined, 'ai_service', {
        type: request.type,
        contentLength: result.content.length
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      errorLogger(error as Error, { 
        context: 'ai_content_generation',
        type: request.type,
        duration
      });
      throw new Error('Failed to generate content');
    }
  }

  /**
   * Enhance search queries using AI
   */
  async enhanceSearchQuery(request: AISearchEnhancementRequest): Promise<AISearchEnhancementResponse> {
    const startTime = Date.now();
    try {
      logger.info('Starting AI search enhancement', { originalQuery: request.originalQuery });
      
      const prompt = this.buildSearchEnhancementPrompt(request);
      
      const response = await this.genAI.models.generateContentStream({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      let text = '';
      for await (const chunk of response) {
        text += chunk.text || '';
      }

      const result = this.parseSearchEnhancementResponse(text);
      const duration = Date.now() - startTime;
      
      performanceLogger('ai_search_enhancement', duration, {
        originalQuery: request.originalQuery,
        enhancedQuery: result.enhancedQuery
      });
      
      auditLogger('ai_search_enhanced', undefined, 'ai_service', {
        originalQuery: request.originalQuery,
        enhancedQuery: result.enhancedQuery
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      errorLogger(error as Error, { 
        context: 'ai_search_enhancement',
        originalQuery: request.originalQuery,
        duration
      });
      throw new Error('Failed to enhance search query');
    }
  }

  /**
   * Analyze product sentiment and provide insights
   */
  async analyzeProductSentiment(productId: string, reviews: string[]): Promise<any> {
    const startTime = Date.now();
    try {
      logger.info('Starting AI sentiment analysis', { productId, reviewsCount: reviews.length });
      
      const prompt = this.buildSentimentAnalysisPrompt(productId, reviews);
      
      const response = await this.genAI.models.generateContentStream({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      let text = '';
      for await (const chunk of response) {
        text += chunk.text || '';
      }

      const result = this.parseSentimentAnalysisResponse(text);
      const duration = Date.now() - startTime;
      
      performanceLogger('ai_sentiment_analysis', duration, {
        productId,
        reviewsCount: reviews.length,
        sentimentScore: result.sentimentScore
      });
      
      auditLogger('ai_sentiment_analyzed', undefined, 'ai_service', {
        productId,
        reviewsCount: reviews.length,
        sentimentScore: result.sentimentScore,
        overallSentiment: result.overallSentiment
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      errorLogger(error as Error, { 
        context: 'ai_sentiment_analysis',
        productId,
        reviewsCount: reviews.length,
        duration
      });
      throw new Error('Failed to analyze sentiment');
    }
  }

  private extractProductFeatures(product: Product): string[] {
    const features: string[] = [];
    
    if (product.description) {
      // Extract key features from description
      const words = product.description.toLowerCase().split(/\s+/);
      const featureKeywords = ['wireless', 'bluetooth', 'waterproof', 'durable', 'lightweight', 'premium', 'advanced', 'smart', 'digital', 'portable'];
      features.push(...words.filter(word => featureKeywords.includes(word)));
    }
    
    if (product.price) {
      if (product.price < 50) features.push('budget-friendly');
      else if (product.price > 500) features.push('premium');
    }
    
    return [...new Set(features)]; // Remove duplicates
  }

  private buildRecommendationPrompt(products: any[], searchQuery?: string, limit: number = 5): string {
    return `
You are an AI assistant for an ecommerce platform. Based on the following product context, provide ${limit} product recommendations.

Product Context:
${JSON.stringify(products, null, 2)}

${searchQuery ? `User Search Query: "${searchQuery}"` : ''}

Please provide recommendations in the following JSON format:
{
  "recommendations": [
    {
      "productId": "string",
      "reasoning": "Why this product is recommended",
      "confidence": 0.85
    }
  ],
  "overallReasoning": "Overall recommendation strategy",
  "confidence": 0.8
}

Focus on:
1. Product compatibility and complementary items
2. Price range appropriateness
3. User preferences based on search query
4. Product quality and features
5. Category relevance

Return only valid JSON, no additional text.
    `.trim();
  }

  private buildContentPrompt(request: AIContentRequest): string {
    const { type, productData, categoryName, additionalContext } = request;
    
    let basePrompt = `You are a professional copywriter for an ecommerce platform. Generate ${type.replace('_', ' ')} content.`;
    
    switch (type) {
      case 'product_description':
        basePrompt += `\n\nProduct Data: ${JSON.stringify(productData, null, 2)}`;
        basePrompt += `\n\nGenerate an engaging, SEO-friendly product description (150-300 words) that highlights key features, benefits, and value proposition.`;
        break;
      case 'product_title':
        basePrompt += `\n\nProduct Data: ${JSON.stringify(productData, null, 2)}`;
        basePrompt += `\n\nGenerate 3-5 compelling product titles (50-80 characters each) that are SEO-optimized and conversion-focused.`;
        break;
      case 'category_description':
        basePrompt += `\n\nCategory: ${categoryName}`;
        basePrompt += `\n\nGenerate a category description (100-200 words) that explains the category and its benefits.`;
        break;
      case 'marketing_copy':
        basePrompt += `\n\nContext: ${additionalContext}`;
        basePrompt += `\n\nGenerate marketing copy for promotional materials (50-150 words).`;
        break;
    }
    
    basePrompt += `\n\nReturn in JSON format: {"content": "generated content", "suggestions": ["suggestion1", "suggestion2"]}`;
    
    return basePrompt;
  }

  private buildSearchEnhancementPrompt(request: AISearchEnhancementRequest): string {
    const { originalQuery, context, filters } = request;
    
    return `
You are an AI assistant that enhances ecommerce search queries. 

Original Query: "${originalQuery}"
${context ? `Context: ${context}` : ''}
${filters ? `Current Filters: ${JSON.stringify(filters)}` : ''}

Enhance the search query to be more specific, relevant, and likely to return better results. Consider:
1. Synonyms and related terms
2. Common misspellings
3. Product categories and attributes
4. Price ranges and specifications

Return in JSON format:
{
  "enhancedQuery": "improved search query",
  "suggestedFilters": {
    "category": "suggested category",
    "priceRange": {"min": 0, "max": 1000},
    "attributes": ["attribute1", "attribute2"]
  },
  "searchTerms": ["term1", "term2", "term3"]
}
    `.trim();
  }

  private buildSentimentAnalysisPrompt(productId: string, reviews: string[]): string {
    return `
Analyze the sentiment of these product reviews for product ID: ${productId}

Reviews:
${reviews.map((review, index) => `${index + 1}. ${review}`).join('\n')}

Provide sentiment analysis in JSON format:
{
  "overallSentiment": "positive|negative|neutral",
  "sentimentScore": 0.75,
  "keyInsights": ["insight1", "insight2"],
  "improvementSuggestions": ["suggestion1", "suggestion2"],
  "reviewSummary": "Brief summary of review themes"
}
    `.trim();
  }

  private parseRecommendationResponse(text: string, limit: number): AIRecommendationResponse {
    let cleanText = '';
    try {
      // Clean the response text - remove markdown formatting
      cleanText = text.trim();
      
      // Remove markdown code blocks
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON object in the text
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      logger.debug('Cleaned AI response', { cleanText });
      
      const parsed = JSON.parse(cleanText);
      return {
        recommendations: parsed.recommendations || [],
        reasoning: parsed.overallReasoning || parsed.reasoning || 'AI-generated recommendations',
        confidence: parsed.confidence || 0.5
      };
    } catch (error) {
      errorLogger(error as Error, { 
        context: 'parse_recommendation_response',
        rawResponse: text,
        cleanText: cleanText
      });
      return {
        recommendations: [],
        reasoning: `Failed to parse AI response: ${error instanceof Error ? error.message : String(error)}`,
        confidence: 0
      };
    }
  }

  private parseContentResponse(text: string): AIContentResponse {
    try {
      const parsed = JSON.parse(text);
      return {
        content: parsed.content || text,
        suggestions: parsed.suggestions || []
      };
    } catch (error) {
      errorLogger(error as Error, { 
        context: 'parse_content_response',
        rawResponse: text
      });
      return {
        content: text,
        suggestions: []
      };
    }
  }

  private parseSearchEnhancementResponse(text: string): AISearchEnhancementResponse {
    try {
      const parsed = JSON.parse(text);
      return {
        enhancedQuery: parsed.enhancedQuery || text,
        suggestedFilters: parsed.suggestedFilters || {},
        searchTerms: parsed.searchTerms || []
      };
    } catch (error) {
      errorLogger(error as Error, { 
        context: 'parse_search_enhancement_response',
        rawResponse: text
      });
      return {
        enhancedQuery: text,
        suggestedFilters: {},
        searchTerms: []
      };
    }
  }

  private parseSentimentAnalysisResponse(text: string): any {
    try {
      return JSON.parse(text);
    } catch (error) {
      errorLogger(error as Error, { 
        context: 'parse_sentiment_analysis_response',
        rawResponse: text
      });
      return {
        overallSentiment: 'neutral',
        sentimentScore: 0.5,
        keyInsights: [],
        improvementSuggestions: [],
        reviewSummary: 'Unable to analyze reviews'
      };
    }
  }
}
