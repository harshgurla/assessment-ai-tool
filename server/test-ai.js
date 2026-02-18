require('dotenv').config();

const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
console.log('=== AI Service Debug Info ===');
console.log('Gemini Key:', geminiKey ? `${geminiKey.substring(0, 10)}...` : 'Not found');
console.log('Key length:', geminiKey?.length);
console.log('Starts with AIza:', geminiKey?.startsWith('AIza'));
console.log('Length > 20:', geminiKey && geminiKey.length > 20);

const hasValidGemini = geminiKey && 
  geminiKey !== 'YOUR_GEMINI_API_KEY_HERE' && 
  geminiKey.startsWith('AIza') && 
  geminiKey.length > 20;

console.log('Has valid Gemini:', hasValidGemini);

if (hasValidGemini) {
  console.log('✅ Gemini API key validation passed');
  
  // Test Gemini API
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(geminiKey);
  
  async function testGemini() {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Say hello');
      const response = await result.response;
      console.log('✅ Gemini API test successful:', response.text().substring(0, 100));
    } catch (error) {
      console.error('❌ Gemini API test failed:', error.message);
      if (error.message.includes('API_KEY_INVALID')) {
        console.error('🔑 API key is invalid. Please get a new one from: https://makersuite.google.com/app/apikey');
      }
    }
  }
  
  testGemini();
} else {
  console.log('❌ Gemini API key validation failed');
}
