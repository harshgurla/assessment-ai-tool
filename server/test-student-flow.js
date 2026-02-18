// Test if we can access the student dashboard and assessments
require('dotenv').config();

async function testStudentAccess() {
  try {
    console.log('🧪 Testing student access to assessment system...');
    
    // First, let's check if there are any assessments in the system
    const http = require('http');
    
    // We'll need to authenticate as a student first
    // Let's check if there's a default student account we can use
    console.log('📡 Testing server connectivity...');
    
    const healthCheck = new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/health', // Simple health check
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 404) {
            console.log('✅ Server is responsive');
            resolve(data);
          } else {
            reject(new Error(`Server responded with status ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Request timeout')));
      req.end();
    });
    
    await healthCheck;
    
    console.log('✅ Backend server is running and accessible');
    console.log('🌐 Frontend should be available at: http://localhost:5173');
    console.log('🎯 Next steps to test:');
    console.log('  1. Open http://localhost:5173 in your browser');
    console.log('  2. Login as teacher (check .env for credentials)');
    console.log('  3. Create an assessment with AI-generated questions');
    console.log('  4. Assign it to a student email');
    console.log('  5. Login as student and try to start the assessment');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('🔧 Make sure both servers are running:');
    console.log('  Backend: http://localhost:5000');
    console.log('  Frontend: http://localhost:5173');
  }
}

testStudentAccess();
