// AI Integration Test Script
// This file demonstrates how to use the AI service in your ecommerce backend

import { AIService } from './src/services/ai.service';
import { ProductService } from './src/services/product.service';
import dotenv from 'dotenv';

dotenv.config();

async function testAIIntegration() {
  try {
    console.log('🤖 Testing AI Integration...\n');

    // Initialize services
    const aiService = new AIService();
    const productService = new ProductService();

    // Test 1: Get product recommendations
    console.log('📦 Testing Product Recommendations...');
    const recommendations = await aiService.getProductRecommendations({
      searchQuery: 'wireless headphones',
      limit: 3
    });
    console.log('Recommendations:', JSON.stringify(recommendations, null, 2));

    // Test 2: Generate product content
    console.log('\n✍️ Testing Content Generation...');
    const content = await aiService.generateContent({
      type: 'product_description',
      productData: {
        name: 'Wireless Bluetooth Headphones',
        price: 99.99,
        description: 'High-quality wireless headphones with noise cancellation'
      }
    });
    console.log('Generated Content:', JSON.stringify(content, null, 2));

    // Test 3: Enhance search query
    console.log('\n🔍 Testing Search Enhancement...');
    const searchEnhancement = await aiService.enhanceSearchQuery({
      originalQuery: 'phone',
      context: 'looking for smartphone'
    });
    console.log('Search Enhancement:', JSON.stringify(searchEnhancement, null, 2));

    // Test 4: Analyze sentiment
    console.log('\n😊 Testing Sentiment Analysis...');
    const sentiment = await aiService.analyzeProductSentiment('test-product-id', [
      'Great product, love it!',
      'Not bad, could be better',
      'Excellent quality and fast delivery'
    ]);
    console.log('Sentiment Analysis:', JSON.stringify(sentiment, null, 2));

    console.log('\n✅ AI Integration test completed successfully!');
    console.log('\n🚀 Your AI endpoints are ready at:');
    console.log('   - POST /api/v1/ai/recommendations');
    console.log('   - POST /api/v1/ai/content');
    console.log('   - POST /api/v1/ai/search/enhance');
    console.log('   - POST /api/v1/ai/sentiment');
    console.log('   - GET  /api/v1/ai/health');

  } catch (error) {
    console.error('❌ AI Integration test failed:', error);
    console.log('\n🔧 Make sure to:');
    console.log('   1. Set GEMINI_API_KEY in your .env file');
    console.log('   2. Run: npm install @google/genai');
    console.log('   3. Start your database and Redis services');
  }
}

// Run the test
testAIIntegration();
  