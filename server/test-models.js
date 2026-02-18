require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiKey);

async function listModels() {
  try {
    console.log('🔍 Listing available Gemini models...');
    
    // Try different model names that are commonly available
    const modelNamesToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-flash',
      'gemini'
    ];
    
    for (const modelName of modelNamesToTry) {
      try {
        console.log(`\n🧪 Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ SUCCESS with ${modelName}:`, text.substring(0, 100));
        return modelName; // Return the first working model
      } catch (error) {
        console.log(`❌ Failed with ${modelName}:`, error.message.substring(0, 100));
      }
    }
    
    console.log('\n❌ No working models found');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
