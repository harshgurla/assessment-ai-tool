// Test assessment creation with mock data to verify the fix
require('dotenv').config();

async function testAssessmentCreation() {
  const http = require('http');
  
  // Mock assessment data with proper test case structure
  const testAssessment = {
    title: "Test Assessment - Fixed",
    topic: "JavaScript Basics",
    language: "javascript",
    difficulty: "beginner",
    duration: 60,
    instructions: "",
    questions: [
      {
        type: "programming",
        title: "Simple Sum",
        description: "Write a function that adds two numbers",
        difficulty: "beginner",
        points: 10,
        timeLimit: 30,
        memoryLimit: 128,
        sampleInput: "1, 2",
        sampleOutput: "3",
        constraints: "Numbers will be integers",
        language: "javascript",
        testCases: [
          {
            input: "1, 2",
            output: "3",  // Note: using 'output' not 'expectedOutput'
            isHidden: false
          },
          {
            input: "5, 7",
            output: "12",
            isHidden: true
          }
        ]
      },
      {
        type: "theory",
        title: "What is JavaScript?",
        description: "Explain what JavaScript is and its main uses",
        difficulty: "beginner",
        points: 15
      }
    ],
    studentEmails: ["test-student@example.com"]
  };

  // First, we need to login as teacher to get the token
  console.log('🔑 Testing teacher authentication...');
  
  const loginData = JSON.stringify({
    email: 'teacher@assessment.com',
    password: 'admin123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length,
    },
  };

  try {
    const token = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            resolve(response.token);
          } else {
            reject(new Error(`Login failed: ${res.statusCode} - ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    console.log('✅ Teacher authentication successful');

    // Now test assessment creation
    console.log('📝 Testing assessment creation...');
    
    const assessmentData = JSON.stringify(testAssessment);
    const createOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/assessments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': assessmentData.length,
        'Authorization': `Bearer ${token}`,
      },
    };

    const result = await new Promise((resolve, reject) => {
      const req = http.request(createOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 201) {
              resolve(response);
            } else {
              reject(new Error(`Assessment creation failed: ${res.statusCode} - ${JSON.stringify(response, null, 2)}`));
            }
          } catch (e) {
            reject(new Error(`Response parsing failed: ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.write(assessmentData);
      req.end();
    });

    console.log('✅ Assessment created successfully!');
    console.log('📊 Assessment details:');
    console.log(`  - ID: ${result.assessment._id}`);
    console.log(`  - Title: ${result.assessment.title}`);
    console.log(`  - Questions: ${result.assessment.questions.length}`);
    console.log(`  - Duration: ${result.assessment.duration} minutes`);
    
    console.log('\n🎉 Fix successful! Assessment creation is now working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAssessmentCreation();
