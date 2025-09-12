const fetch = require('node-fetch');

async function testAI() {
  try {
    console.log('Testing AI Recommendations...');
    
    const response = await fetch('http://localhost:4000/api/v1/ai/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchQuery: 'wireless headphones',
        limit: 3
      })
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAI();
