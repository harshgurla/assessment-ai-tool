require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiKey);

async function testModels() {
  const modelsToTest = [
    'gemini-2.5-flash',
    'gemini-flash-latest', 
    'gemini-2.5-pro'
  ];
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`\n🧪 Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "Hello World" and nothing else.');
      const response = await result.response;
      const text = response.text();
      console.log(`✅ SUCCESS with ${modelName}: "${text.trim()}"`);
      
      // Return the first working model
      return modelName;
    } catch (error) {
      console.log(`❌ Failed with ${modelName}: ${error.message.substring(0, 100)}...`);
    }
  }
  
  return null;
}

testModels().then(workingModel => {
  if (workingModel) {
    console.log(`\n🎉 Working model found: ${workingModel}`);
  } else {
    console.log('\n❌ No working models found');
  }
});
