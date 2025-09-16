import { Request, Response } from "express";
import { AIService } from "../services/ai.service";
import { ProductService } from "../services/product.service";
import { createModuleLogger, errorLogger, auditLogger } from "../config/logger";

const logger = createModuleLogger('ai-controller');

const aiService = new AIService();
const productService = new ProductService();

/**
 * @openapi
 * components:
 *   schemas:
 *     AIRecommendationRequest:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID for personalized recommendations
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         productId:
 *           type: string
 *           description: Product ID to base recommendations on
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         categoryId:
 *           type: string
 *           description: Category ID to filter recommendations
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         searchQuery:
 *           type: string
 *           description: Search query for context
 *           example: "wireless headphones"
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *           description: Number of recommendations to return
 *     AIRecommendationResponse:
 *       type: object
 *       properties:
 *         recommendations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Recommended product ID
 *               reasoning:
 *                 type: string
 *                 description: Why this product was recommended
 *               confidence:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Confidence score for the recommendation
 *         reasoning:
 *           type: string
 *           description: Overall reasoning for recommendations
 *         confidence:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: Overall confidence score
 *     AIContentRequest:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           enum: [product_description, product_title, category_description, marketing_copy]
 *           description: Type of content to generate
 *         productData:
 *           type: object
 *           description: Product data for content generation
 *         categoryName:
 *           type: string
 *           description: Category name for category descriptions
 *         additionalContext:
 *           type: string
 *           description: Additional context for content generation
 *     AIContentResponse:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           description: Generated content
 *         suggestions:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional suggestions
 *     AISearchEnhancementRequest:
 *       type: object
 *       required:
 *         - originalQuery
 *       properties:
 *         originalQuery:
 *           type: string
 *           description: Original search query
 *         context:
 *           type: string
 *           description: Additional context for search enhancement
 *         filters:
 *           type: object
 *           description: Current search filters
 *     AISearchEnhancementResponse:
 *       type: object
 *       properties:
 *         enhancedQuery:
 *           type: string
 *           description: Enhanced search query
 *         suggestedFilters:
 *           type: object
 *           description: Suggested search filters
 *         searchTerms:
 *           type: array
 *           items:
 *             type: string
 *           description: Extracted search terms
 *     AISentimentAnalysisRequest:
 *       type: object
 *       required:
 *         - productId
 *         - reviews
 *       properties:
 *         productId:
 *           type: string
 *           description: Product ID for sentiment analysis
 *         reviews:
 *           type: array
 *           items:
 *             type: string
 *           description: Product reviews to analyze
 *     AISentimentAnalysisResponse:
 *       type: object
 *       properties:
 *         overallSentiment:
 *           type: string
 *           enum: [positive, negative, neutral]
 *           description: Overall sentiment of reviews
 *         sentimentScore:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: Sentiment score (0 = negative, 1 = positive)
 *         keyInsights:
 *           type: array
 *           items:
 *             type: string
 *           description: Key insights from reviews
 *         improvementSuggestions:
 *           type: array
 *           items:
 *             type: string
 *           description: Suggestions for product improvement
 *         reviewSummary:
 *           type: string
 *           description: Summary of review themes
 */

/**
 * @openapi
 * tags:
 *   - name: AI
 *     description: AI-powered features and recommendations
 */

/**
 * @openapi
 * /api/v1/ai/recommendations:
 *   post:
 *     tags:
 *       - AI
 *     summary: Get AI-powered product recommendations
 *     description: Generate personalized product recommendations using AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIRecommendationRequest'
 *           example:
 *             productId: "123e4567-e89b-12d3-a456-426614174000"
 *             searchQuery: "wireless headphones"
 *             limit: 5
 *     responses:
 *       200:
 *         description: Recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIRecommendationResponse'
 *       400:
 *         description: Invalid request data
 *       429:
 *         description: Rate limit exceeded
 *       503:
 *         description: AI service unavailable
 */
export async function getRecommendations(req: Request, res: Response) {
  try {
    const request = {
      userId: req.body.userId,
      productId: req.body.productId,
      categoryId: req.body.categoryId,
      searchQuery: req.body.searchQuery,
      limit: req.body.limit || 5
    };

    logger.info('Processing recommendation request', { 
      userId: request.userId,
      productId: request.productId,
      categoryId: request.categoryId,
      searchQuery: request.searchQuery,
      limit: request.limit,
      requestId: (req as any).requestId
    });

    const recommendations = await aiService.getProductRecommendations(request);
    
    auditLogger('recommendation_request_completed', request.userId, 'ai_controller', {
      productId: request.productId,
      categoryId: request.categoryId,
      searchQuery: request.searchQuery,
      limit: request.limit,
      recommendationsCount: recommendations.recommendations.length,
      confidence: recommendations.confidence,
      requestId: (req as any).requestId
    });

    res.json(recommendations);
  } catch (error: any) {
    errorLogger(error, { 
      context: 'get_recommendations',
      userId: req.body.userId,
      requestId: (req as any).requestId
    });
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
}

/**
 * @openapi
 * /api/v1/ai/content:
 *   post:
 *     tags:
 *       - AI
 *     summary: Generate AI content
 *     description: Generate various types of content using AI (descriptions, titles, etc.)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIContentRequest'
 *           example:
 *             type: "product_description"
 *             productData:
 *               name: "Wireless Headphones"
 *               price: 99.99
 *               description: "High-quality wireless headphones"
 *     responses:
 *       200:
 *         description: Content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIContentResponse'
 *       400:
 *         description: Invalid request data
 *       429:
 *         description: Rate limit exceeded
 *       503:
 *         description: AI service unavailable
 */
export async function generateContent(req: Request, res: Response) {
  try {
    const request = {
      type: req.body.type,
      productData: req.body.productData,
      categoryName: req.body.categoryName,
      additionalContext: req.body.additionalContext
    };

    if (!request.type) {
      logger.warn('Content generation request missing type', { 
        requestId: (req as any).requestId,
        body: req.body 
      });
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Content type is required'
      });
    }

    logger.info('Processing content generation request', { 
      type: request.type,
      requestId: (req as any).requestId
    });

    const content = await aiService.generateContent(request);
    
    auditLogger('content_generation_completed', (req.session as any)?.userId, 'ai_controller', {
      type: request.type,
      contentLength: content.content.length,
      requestId: (req as any).requestId
    });

    res.json(content);
  } catch (error: any) {
    errorLogger(error, { 
      context: 'generate_content',
      type: req.body.type,
      requestId: (req as any).requestId
    });
    res.status(500).json({
      error: 'Failed to generate content',
      message: error.message
    });
  }
}

/**
 * @openapi
 * /api/v1/ai/search/enhance:
 *   post:
 *     tags:
 *       - AI
 *     summary: Enhance search query
 *     description: Improve search queries using AI for better results
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AISearchEnhancementRequest'
 *           example:
 *             originalQuery: "phone"
 *             context: "looking for smartphone"
 *     responses:
 *       200:
 *         description: Search query enhanced successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AISearchEnhancementResponse'
 *       400:
 *         description: Invalid request data
 *       429:
 *         description: Rate limit exceeded
 *       503:
 *         description: AI service unavailable
 */
export async function enhanceSearchQuery(req: Request, res: Response) {
  try {
    const request = {
      originalQuery: req.body.originalQuery,
      context: req.body.context,
      filters: req.body.filters
    };

    if (!request.originalQuery) {
      logger.warn('Search enhancement request missing original query', { 
        requestId: (req as any).requestId,
        body: req.body 
      });
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Original query is required'
      });
    }

    logger.info('Processing search enhancement request', { 
      originalQuery: request.originalQuery,
      requestId: (req as any).requestId
    });

    const enhancement = await aiService.enhanceSearchQuery(request);
    
    auditLogger('search_enhancement_completed', (req.session as any)?.userId, 'ai_controller', {
      originalQuery: request.originalQuery,
      enhancedQuery: enhancement.enhancedQuery,
      requestId: (req as any).requestId
    });

    res.json(enhancement);
  } catch (error: any) {
    errorLogger(error, { 
      context: 'enhance_search_query',
      originalQuery: req.body.originalQuery,
      requestId: (req as any).requestId
    });
    res.status(500).json({
      error: 'Failed to enhance search query',
      message: error.message
    });
  }
}

/**
 * @openapi
 * /api/v1/ai/sentiment:
 *   post:
 *     tags:
 *       - AI
 *     summary: Analyze product sentiment
 *     description: Analyze sentiment of product reviews using AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AISentimentAnalysisRequest'
 *           example:
 *             productId: "123e4567-e89b-12d3-a456-426614174000"
 *             reviews: ["Great product!", "Not worth the price", "Excellent quality"]
 *     responses:
 *       200:
 *         description: Sentiment analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AISentimentAnalysisResponse'
 *       400:
 *         description: Invalid request data
 *       429:
 *         description: Rate limit exceeded
 *       503:
 *         description: AI service unavailable
 */
export async function analyzeSentiment(req: Request, res: Response) {
  try {
    const { productId, reviews } = req.body;

    if (!productId || !reviews || !Array.isArray(reviews)) {
      logger.warn('Sentiment analysis request missing required fields', { 
        requestId: (req as any).requestId,
        productId,
        reviewsCount: reviews?.length || 0
      });
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Product ID and reviews array are required'
      });
    }

    logger.info('Processing sentiment analysis request', { 
      productId,
      reviewsCount: reviews.length,
      requestId: (req as any).requestId
    });

    const analysis = await aiService.analyzeProductSentiment(productId, reviews);
    
    auditLogger('sentiment_analysis_completed', (req.session as any)?.userId, 'ai_controller', {
      productId,
      reviewsCount: reviews.length,
      sentimentScore: analysis.sentimentScore,
      overallSentiment: analysis.overallSentiment,
      requestId: (req as any).requestId
    });

    res.json(analysis);
  } catch (error: any) {
    errorLogger(error, { 
      context: 'analyze_sentiment',
      productId: req.body.productId,
      reviewsCount: req.body.reviews?.length || 0,
      requestId: (req as any).requestId
    });
    res.status(500).json({
      error: 'Failed to analyze sentiment',
      message: error.message
    });
  }
}

/**
 * @openapi
 * /api/v1/ai/products/{id}/recommendations:
 *   get:
 *     tags:
 *       - AI
 *     summary: Get recommendations for a specific product
 *     description: Get AI-powered recommendations based on a specific product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIRecommendationResponse'
 *       404:
 *         description: Product not found
 *       429:
 *         description: Rate limit exceeded
 *       503:
 *         description: AI service unavailable
 */
export async function getProductRecommendations(req: Request, res: Response) {
  try {
    const productId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 5;

    logger.info('Processing product recommendation request', { 
      productId,
      limit,
      requestId: (req as any).requestId
    });

    // Verify product exists
    const product = await productService.findById(productId);
    if (!product) {
      logger.warn('Product not found for recommendations', { 
        productId,
        requestId: (req as any).requestId
      });
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${productId} does not exist`
      });
    }

    const recommendations = await aiService.getProductRecommendations({
      productId,
      limit
    });

    auditLogger('product_recommendation_completed', (req.session as any)?.userId, 'ai_controller', {
      productId,
      limit,
      recommendationsCount: recommendations.recommendations.length,
      confidence: recommendations.confidence,
      requestId: (req as any).requestId
    });

    res.json(recommendations);
  } catch (error: any) {
    errorLogger(error, { 
      context: 'get_product_recommendations',
      productId: req.params.id,
      limit: req.query.limit,
      requestId: (req as any).requestId
    });
    res.status(500).json({
      error: 'Failed to generate product recommendations',
      message: error.message
    });
  }
}

/**
 * @openapi
 * /api/v1/ai/categories/{id}/recommendations:
 *   get:
 *     tags:
 *       - AI
 *     summary: Get recommendations for a category
 *     description: Get AI-powered recommendations for products in a specific category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIRecommendationResponse'
 *       404:
 *         description: Category not found
 *       429:
 *         description: Rate limit exceeded
 *       503:
 *         description: AI service unavailable
 */
export async function getCategoryRecommendations(req: Request, res: Response) {
  try {
    const categoryId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 5;

    logger.info('Processing category recommendation request', { 
      categoryId,
      limit,
      requestId: (req as any).requestId
    });

    const recommendations = await aiService.getProductRecommendations({
      categoryId,
      limit
    });

    auditLogger('category_recommendation_completed', (req.session as any)?.userId, 'ai_controller', {
      categoryId,
      limit,
      recommendationsCount: recommendations.recommendations.length,
      confidence: recommendations.confidence,
      requestId: (req as any).requestId
    });

    res.json(recommendations);
  } catch (error: any) {
    errorLogger(error, { 
      context: 'get_category_recommendations',
      categoryId: req.params.id,
      limit: req.query.limit,
      requestId: (req as any).requestId
    });
    res.status(500).json({
      error: 'Failed to generate category recommendations',
      message: error.message
    });
  }
}

/**
 * @openapi
 * /api/v1/ai/health:
 *   get:
 *     tags:
 *       - AI
 *     summary: Check AI service health
 *     description: Check if AI service is available and configured
 *     responses:
 *       200:
 *         description: AI service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 service:
 *                   type: string
 *                   example: "gemini"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: AI service unavailable
 */
export async function checkAIHealth(req: Request, res: Response) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        status: 'unhealthy',
        service: 'gemini',
        error: 'API key not configured',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: 'healthy',
      service: 'gemini',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'gemini',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
