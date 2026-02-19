// Test Groq API Integration
require('dotenv').config();
const Groq = require('groq-sdk').default;

async function testGroqAPI() {
  console.log('\n🧪 Testing Groq Llama 3.3 70B Integration\n');
  console.log('=' .repeat(60));
  
  // Check if API key exists
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey || apiKey === 'your-groq-api-key-here') {
    console.log('❌ GROQ_API_KEY not found in .env file');
    console.log('\n📝 Setup Instructions:');
    console.log('1. Visit: https://console.groq.com/keys');
    console.log('2. Create a new API key');
    console.log('3. Add to .env file: GROQ_API_KEY=gsk_...');
    console.log('4. Restart and run this test again');
    process.exit(1);
  }
  
  if (!apiKey.startsWith('gsk_')) {
    console.log('⚠️  Warning: Groq API keys typically start with "gsk_"');
    console.log('   Your key:', apiKey.substring(0, 10) + '...');
  }
  
  console.log('✅ API Key detected:', apiKey.substring(0, 10) + '...\n');
  
  try {
    console.log('🚀 Initializing Groq client...');
    const groq = new Groq({ apiKey });
    console.log('✅ Client initialized\n');
    
    console.log('📝 Sending test request to Llama 3.3 70B...');
    console.log('   Request: Generate a simple programming question\n');
    
    const startTime = Date.now();
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert programming instructor. Generate educational questions. Respond with valid JSON only.'
        },
        {
          role: 'user',
          content: `Generate 1 beginner level programming question about arrays in JavaScript. 
          
Format as JSON array:
[{
  "type": "programming",
  "title": "Question Title",
  "description": "Detailed problem description",
  "points": 10
}]`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('✅ API Response received!\n');
    console.log('=' .repeat(60));
    console.log('📊 PERFORMANCE METRICS');
    console.log('=' .repeat(60));
    console.log(`⚡ Response Time: ${responseTime}ms`);
    console.log(`🔢 Tokens Used: ${completion.usage?.total_tokens || 'N/A'}`);
    console.log(`📤 Prompt Tokens: ${completion.usage?.prompt_tokens || 'N/A'}`);
    console.log(`📥 Completion Tokens: ${completion.usage?.completion_tokens || 'N/A'}`);
    console.log(`⏱️  Tokens/Second: ${completion.usage?.completion_tokens ? 
      Math.round((completion.usage.completion_tokens / responseTime) * 1000) : 'N/A'}`);
    console.log('=' .repeat(60));
    
    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      console.log('❌ No content in response');
      return;
    }
    
    console.log('\n📄 RAW RESPONSE:');
    console.log('=' .repeat(60));
    console.log(content);
    console.log('=' .repeat(60));
    
    // Try to parse as JSON
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const jsonMatch = cleanContent.match(/\[.*\]/s);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanContent;
      const questions = JSON.parse(jsonString);
      
      console.log('\n✅ JSON PARSING SUCCESSFUL!\n');
      console.log('📋 GENERATED QUESTION:');
      console.log('=' .repeat(60));
      console.log(JSON.stringify(questions, null, 2));
      console.log('=' .repeat(60));
      
      console.log('\n🎉 SUCCESS! Groq Llama 3.3 70B is working perfectly!');
      console.log('⚡ Ultra-fast response in', responseTime, 'ms');
      console.log('✅ Your assessment platform is ready to use Groq AI!\n');
      
    } catch (parseError) {
      console.log('\n⚠️  JSON parsing warning:', parseError.message);
      console.log('   Response was received but format needs adjustment');
      console.log('   This is normal - the AI service will handle formatting\n');
    }
    
  } catch (error) {
    console.log('\n❌ ERROR OCCURRED:\n');
    console.log('Error:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n🔧 Solution:');
      console.log('1. Verify your API key is correct');
      console.log('2. Get a new key from: https://console.groq.com/keys');
      console.log('3. Update GROQ_API_KEY in .env file');
    } else if (error.message.includes('rate limit')) {
      console.log('\n🔧 Solution:');
      console.log('Rate limit reached. Free tier: 30 requests/minute');
      console.log('Wait a moment and try again');
    } else {
      console.log('\n🔧 Debug Info:');
      console.log(error);
    }
    
    process.exit(1);
  }
}

// Run the test
testGroqAPI().catch(console.error);
