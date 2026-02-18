require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
console.log('Testing with API key:', geminiKey ? `${geminiKey.substring(0, 15)}...` : 'Not found');

const genAI = new GoogleGenerativeAI(geminiKey);

async function testBasic() {
  try {
    console.log('🧪 Testing gemini-1.5-flash model...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Hello, can you respond with just "Hi"?');
    const response = await result.response;
    const text = response.text();
    console.log('✅ SUCCESS:', text);
  } catch (error) {
    console.error('❌ Full error details:');
    console.error('Message:', error.message);
    console.error('Status:', error.status);
    console.error('Code:', error.code);
    console.error('Details:', JSON.stringify(error.details, null, 2));
    
    // Check if it's an API key issue
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('403') || error.message.includes('unauthorized')) {
      console.error('\n🔑 This appears to be an API key issue.');
      console.error('Please:');
      console.error('1. Go to https://makersuite.google.com/app/apikey');
      console.error('2. Generate a new API key');
      console.error('3. Replace the key in your .env file');
      console.error('4. Make sure the API is enabled in your Google Cloud Console');
    }
  }
}

testBasic();
