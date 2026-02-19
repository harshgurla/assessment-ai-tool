# 🚀 Groq AI Integration - Setup Guide

## Overview
Your assessment platform now uses **Groq's Llama 3.3 70B** as the primary AI model for ultra-fast question generation and code evaluation!

## ✨ Why Groq?

### Speed ⚡
- **500-800+ tokens/second** (World's fastest LPU inference)
- **Sub-second response times** - Students get instant feedback
- **30 requests/minute** on free tier (2x more than Gemini)

### Quality 🎯
- **Llama 3.3 70B** matches Llama 3.1 405B performance
- Excellent code generation and understanding
- Superior reasoning capabilities
- Better instruction following

### Cost 💰
- **FREE tier**: 30 requests/min, 14,400 requests/day
- Perfect for classroom and assessment use
- No credit card required for free tier

## 🔧 Setup Instructions

### Step 1: Get Your Groq API Key (FREE)

1. Visit: [https://console.groq.com](https://console.groq.com)
2. Sign up with your email or GitHub account
3. Navigate to **API Keys** section
4. Click **"Create API Key"**
5. Give it a name (e.g., "Assessment Platform")
6. Copy your API key (starts with `gsk_`)

### Step 2: Add API Key to Your Project

Open your `/server/.env` file and add:

```env
# Groq AI Configuration (Primary - Fastest!)
GROQ_API_KEY=gsk_your_api_key_here

# Optional: Backup providers
GOOGLE_GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here

# AI Provider Priority (optional)
AI_PROVIDER=groq
```

### Step 3: Restart Your Server

```bash
cd server
npm run dev
```

You should see:
```
✅ Using Groq Llama 3.3 70B (Ultra-Fast, Free Tier: 30 req/min)
```

## 🔄 Fallback Strategy

The system automatically falls back in this order:
1. **Groq Llama 3.3 70B** (Primary - Fastest)
2. **Google Gemini 2.5 Flash** (Backup - If Groq fails)
3. **Mock Questions** (Final fallback)

## 📊 Model Information

**Model Name**: `llama-3.3-70b-versatile`
- **Parameters**: 70 billion
- **Context Window**: 128K tokens
- **Specialties**: Code generation, reasoning, instruction following
- **Best For**: Real-time assessment generation and evaluation

## 🎮 Testing Your Setup

Test if Groq is working:

```bash
cd server
node test-models.js
```

Or make a test API call from your frontend.

## 📝 Rate Limits (Free Tier)

- **Requests**: 30 per minute
- **Daily Limit**: 14,400 requests
- **Tokens**: ~6,000 per minute

Perfect for classroom use with multiple students!

## 🆘 Troubleshooting

### "Invalid Groq API key"
- Verify your API key starts with `gsk_`
- Check for extra spaces in .env file
- Regenerate key from Groq console

### "Rate limit exceeded"
- Free tier: 30 requests/min
- System automatically falls back to Gemini
- Consider spreading assessment creation over time

### Groq Not Detected
- Restart your server after adding API key
- Check .env file is in /server directory
- Verify GROQ_API_KEY is spelled correctly

## 🔗 Useful Links

- [Groq Console](https://console.groq.com)
- [Groq Documentation](https://console.groq.com/docs)
- [Llama 3.3 Model Card](https://www.llama.com/docs/model-cards-and-prompt-formats/llama3_3)

## 🎉 Benefits for Your Assessment Platform

✅ **Instant Question Generation**: Students see questions in <1 second  
✅ **Fast Code Evaluation**: Real-time feedback on submissions  
✅ **Higher Throughput**: Handle more concurrent users  
✅ **Better Code Quality**: Superior understanding of programming concepts  
✅ **Cost Effective**: Free tier perfect for educational use  
✅ **Automatic Fallback**: Never fails - always has backup options  

---

**Need Help?** Check the console logs when starting the server - they'll guide you through setup!
