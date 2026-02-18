// Test the compiled AI service
require('dotenv').config();

const AIService = require('./dist/services/aiService').default;

console.log('=== Testing Compiled AI Service ===');

// Create AI service instance
const aiService = new AIService();

console.log('AI Provider:', aiService.aiProvider);
console.log('Has Gemini:', !!aiService.gemini);
console.log('Has OpenAI:', !!aiService.openai);

// Try to generate a simple question
async function testAI() {
  try {
    console.log('\n🧪 Testing question generation...');
    const questions = await aiService.generateQuestions({
      topic: 'JavaScript basics',
      type: 'programming',
      difficulty: 'beginner',
      count: 1,
      language: 'javascript'
    });
    
    console.log('✅ Questions generated:', questions.length);
    if (questions.length > 0) {
      console.log('Sample question:', questions[0].title);
    }
  } catch (error) {
    console.error('❌ Error generating questions:', error.message);
  }
}

testAI();
