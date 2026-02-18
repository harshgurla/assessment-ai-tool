// Test environment loading in the compiled JS
require('dotenv').config();

console.log('=== Environment Test ===');
console.log('GOOGLE_GEMINI_API_KEY exists:', !!process.env.GOOGLE_GEMINI_API_KEY);
console.log('Key starts with AIza:', process.env.GOOGLE_GEMINI_API_KEY?.startsWith('AIza'));
console.log('Key length:', process.env.GOOGLE_GEMINI_API_KEY?.length);
console.log('AI_PROVIDER:', process.env.AI_PROVIDER);

const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
const hasValidGemini = geminiKey && 
  geminiKey !== 'YOUR_GEMINI_API_KEY_HERE' && 
  geminiKey.startsWith('AIza') && 
  geminiKey.length > 20;

console.log('hasValidGemini:', hasValidGemini);

// Test the actual validation logic from aiService
if (hasValidGemini) {
  console.log('✅ Validation should pass');
} else {
  console.log('❌ Validation failed');
  console.log('Key value:', geminiKey ? `${geminiKey.substring(0, 10)}...` : 'undefined');
}
