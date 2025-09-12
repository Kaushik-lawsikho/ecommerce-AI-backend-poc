import { Router } from 'express';
import {
  getRecommendations,
  generateContent,
  enhanceSearchQuery,
  analyzeSentiment,
  getProductRecommendations,
  getCategoryRecommendations,
  checkAIHealth
} from '../controllers/ai.controller';
import {
  addAIContext,
  validateAIKey,
  aiRateLimit,
  validateAIRequest,
  validateAtLeastOne,
  logAIRequest,
  sanitizeAIInput,
  aiErrorHandler
} from '../middlewares/ai.middleware';

const router = Router();

// Health check endpoint (minimal middleware)
router.get('/health', 
  addAIContext,
  validateAIKey,
  logAIRequest,
  checkAIHealth
);

// Apply AI middleware to all other routes
router.use(addAIContext);
router.use(validateAIKey);
router.use(aiRateLimit(50, 15 * 60 * 1000)); // 50 requests per 15 minutes
router.use(logAIRequest);
router.use(sanitizeAIInput);

// Recommendation endpoints
router.post('/recommendations', 
  validateAtLeastOne(['productId', 'categoryId', 'searchQuery']), // At least one required
  getRecommendations
);

router.get('/products/:id/recommendations', getProductRecommendations);
router.get('/categories/:id/recommendations', getCategoryRecommendations);

// Content generation endpoints
router.post('/content',
  validateAIRequest(['type']),
  generateContent
);

// Search enhancement endpoints
router.post('/search/enhance',
  validateAIRequest(['originalQuery']),
  enhanceSearchQuery
);

// Sentiment analysis endpoints
router.post('/sentiment',
  validateAIRequest(['productId', 'reviews']),
  analyzeSentiment
);

// Error handling for AI routes
router.use(aiErrorHandler);

export default router;
