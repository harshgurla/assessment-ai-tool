// Test the AI generation endpoint
const https = require('https');
const http = require('http');

const testData = {
  topic: "JavaScript basics",
  language: "javascript", 
  difficulty: "beginner",
  questionTypes: ["programming"],
  counts: {
    programming: 1,
    theory: 0,
    mcq: 0
  }
};

function makeRequest() {
  const data = JSON.stringify(testData);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/assessments/generate-questions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      // You'll need a valid auth token - let's try without for now to see the error
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(responseData);
        console.log('\n=== Response ===');
        console.log(JSON.stringify(response, null, 2));
        
        if (response.questions && response.questions.length > 0) {
          console.log('\n✅ AI Generation Working!');
          console.log('Generated questions:', response.questions.length);
          console.log('Sample question title:', response.questions[0].title);
        } else if (response.error) {
          console.log('\n❌ Error:', response.error);
        }
      } catch (error) {
        console.log('\n❌ Failed to parse response:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.write(data);
  req.end();
}

console.log('🧪 Testing AI generation endpoint...');
makeRequest();
