# AI Integration Documentation

This document provides comprehensive information about the AI capabilities integrated into the ecommerce backend using Google Gemini AI.

## Overview

The AI integration adds intelligent features to enhance user experience and automate content generation:

- **Product Recommendations**: AI-powered personalized product suggestions
- **Content Generation**: Automated product descriptions, titles, and marketing copy
- **Search Enhancement**: Improved search queries for better results
- **Sentiment Analysis**: Analysis of product reviews and feedback

## Architecture

```
src/
├── services/
│   └── ai.service.ts          # Core AI service with Gemini integration
├── controllers/
│   └── ai.controller.ts       # AI endpoints and request handling
├── middlewares/
│   └── ai.middleware.ts       # AI-specific middleware (rate limiting, validation)
├── routes/
│   └── ai.routes.ts           # AI route definitions
├── utils/
│   └── ai.utils.ts            # Utility functions for AI operations
└── tests/
    └── ai.test.ts             # Unit tests for AI functionality
```

## API Endpoints

### Base URL: `/api/v1/ai`

#### 1. Health Check
```http
GET /api/v1/ai/health
```
Check if AI service is available and configured.

**Response:**
```json
{
  "status": "healthy",
  "service": "gemini",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 2. Product Recommendations
```http
POST /api/v1/ai/recommendations
```

Generate AI-powered product recommendations.

**Request Body:**
```json
{
  "userId": "optional-user-id",
  "productId": "optional-product-id",
  "categoryId": "optional-category-id",
  "searchQuery": "wireless headphones",
  "limit": 5
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "productId": "product-uuid",
      "reasoning": "Similar features and price range",
      "confidence": 0.85
    }
  ],
  "reasoning": "Based on product features and user preferences",
  "confidence": 0.8
}
```

#### 3. Content Generation
```http
POST /api/v1/ai/content
```

Generate various types of content using AI.

**Request Body:**
```json
{
  "type": "product_description",
  "productData": {
    "name": "Wireless Headphones",
    "price": 99.99,
    "description": "High-quality wireless headphones"
  },
  "additionalContext": "Target audience: professionals"
}
```

**Content Types:**
- `product_description`: SEO-friendly product descriptions
- `product_title`: Compelling product titles
- `category_description`: Category page descriptions
- `marketing_copy`: Promotional content

**Response:**
```json
{
  "content": "Generated content here...",
  "suggestions": ["Alternative suggestion 1", "Alternative suggestion 2"]
}
```

#### 4. Search Enhancement
```http
POST /api/v1/ai/search/enhance
```

Improve search queries for better results.

**Request Body:**
```json
{
  "originalQuery": "phone",
  "context": "looking for smartphone",
  "filters": {
    "category": "electronics"
  }
}
```

**Response:**
```json
{
  "enhancedQuery": "smartphone mobile phone",
  "suggestedFilters": {
    "category": "electronics",
    "priceRange": {"min": 100, "max": 1000}
  },
  "searchTerms": ["smartphone", "mobile", "phone"]
}
```

#### 5. Sentiment Analysis
```http
POST /api/v1/ai/sentiment
```

Analyze sentiment of product reviews.

**Request Body:**
```json
{
  "productId": "product-uuid",
  "reviews": [
    "Great product!",
    "Not bad, could be better",
    "Excellent quality"
  ]
}
```

**Response:**
```json
{
  "overallSentiment": "positive",
  "sentimentScore": 0.75,
  "keyInsights": ["Quality praised", "Price concerns"],
  "improvementSuggestions": ["Improve packaging", "Add more color options"],
  "reviewSummary": "Generally positive with some quality concerns"
}
```

#### 6. Product-Specific Recommendations
```http
GET /api/v1/ai/products/{id}/recommendations?limit=5
```

Get recommendations based on a specific product.

#### 7. Category-Specific Recommendations
```http
GET /api/v1/ai/categories/{id}/recommendations?limit=5
```

Get recommendations for products in a specific category.

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: AI Rate Limiting
AI_RATE_LIMIT_REQUESTS=50
AI_RATE_LIMIT_WINDOW_MS=900000
```

### Dependencies

The AI integration requires these packages (already included in package.json):

```json
{
  "@google/genai": "^1.19.0",
  "dotenv": "^16.0.0"
}
```

## Rate Limiting

AI endpoints are protected by rate limiting:
- **Default**: 50 requests per 15 minutes per IP
- **Configurable**: Via environment variables
- **Response**: 429 status code when limit exceeded

## Error Handling

The AI integration includes comprehensive error handling:

- **401**: Invalid or missing API key
- **429**: Rate limit exceeded
- **503**: AI service unavailable
- **502**: AI service error

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run AI tests only
npm run test:ai

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test AI Integration
```bash
# Test AI functionality with real API
npm run ai:test
```

## Usage Examples

### Frontend Integration

```javascript
// Get product recommendations
const getRecommendations = async (searchQuery) => {
  const response = await fetch('/api/v1/ai/recommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      searchQuery,
      limit: 5
    })
  });
  
  return response.json();
};

// Generate product description
const generateDescription = async (productData) => {
  const response = await fetch('/api/v1/ai/content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'product_description',
      productData
    })
  });
  
  return response.json();
};
```

### Backend Integration

```typescript
import { AIService } from './services/ai.service';

const aiService = new AIService();

// Get recommendations
const recommendations = await aiService.getProductRecommendations({
  searchQuery: 'wireless headphones',
  limit: 5
});

// Generate content
const content = await aiService.generateContent({
  type: 'product_description',
  productData: {
    name: 'Wireless Headphones',
    price: 99.99
  }
});
```

## Security Considerations

1. **API Key Protection**: Store Gemini API key in environment variables
2. **Rate Limiting**: Implemented to prevent abuse
3. **Input Sanitization**: All inputs are sanitized before processing
4. **Error Handling**: Sensitive information is not exposed in error messages

## Performance Optimization

1. **Caching**: AI responses can be cached for repeated queries
2. **Rate Limiting**: Prevents service overload
3. **Async Processing**: Non-blocking AI operations
4. **Request Validation**: Early validation prevents unnecessary API calls

## Monitoring and Logging

The AI integration includes comprehensive logging:
- Request/response logging
- Error tracking
- Performance metrics
- Rate limit monitoring

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   ```
   Error: GEMINI_API_KEY is required
   ```
   Solution: Set the GEMINI_API_KEY in your .env file

2. **Rate Limit Exceeded**
   ```
   Error: Rate limit exceeded
   ```
   Solution: Wait for the rate limit window to reset or increase limits

3. **AI Service Unavailable**
   ```
   Error: AI service is temporarily unavailable
   ```
   Solution: Check your internet connection and API key validity

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Future Enhancements

Potential improvements for the AI integration:

1. **Caching Layer**: Redis-based caching for AI responses
2. **Batch Processing**: Process multiple requests together
3. **Custom Models**: Fine-tuned models for specific use cases
4. **Analytics**: Track AI usage and performance metrics
5. **A/B Testing**: Compare AI vs non-AI recommendations

## Support

For issues or questions about the AI integration:

1. Check the logs for error details
2. Verify API key configuration
3. Test with the provided test script
4. Review the unit tests for expected behavior

## License

This AI integration is part of the ecommerce backend project and follows the same license terms.
