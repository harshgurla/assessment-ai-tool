require('dotenv').config();

const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
console.log('Testing with API key:', geminiKey ? `${geminiKey.substring(0, 15)}...` : 'Not found');

// Let's try a direct HTTP approach to list models
const https = require('https');

function listModels() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models?key=${geminiKey}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 Fetching available models...');
    const response = await listModels();
    
    if (response.models) {
      console.log('\n✅ Available models:');
      response.models.forEach(model => {
        console.log(`- ${model.name} (${model.displayName})`);
        if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
          console.log('  ✅ Supports generateContent');
        }
      });
    } else {
      console.log('❌ No models found in response');
      console.log('Response:', JSON.stringify(response, null, 2));
    }
  } catch (error) {
    console.error('❌ Error fetching models:');
    console.error('Message:', error.message);
    
    if (error.message.includes('403') || error.message.includes('unauthorized')) {
      console.error('\n🔑 API key appears to be invalid or unauthorized');
      console.error('Please generate a new API key from: https://makersuite.google.com/app/apikey');
    }
  }
}

main();
