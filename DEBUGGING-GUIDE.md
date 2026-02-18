# 🐛 Assessment Creation Debugging Guide

## 📋 **Quick Fix Applied:**

### ✅ **Issues Fixed:**
1. **Validation Schema Mismatch**: Updated to match frontend data structure
2. **Field Name Conflicts**: Changed `easy/medium/hard` to `beginner/intermediate/advanced`
3. **Response Format**: Added `success` field for consistent API responses
4. **Debugging Logs**: Added console logs to track request data

### 🔧 **Changes Made:**

#### **Backend (server/src/routes/assessment.ts):**
```typescript
// OLD Validation Schema:
questionType: Joi.string().valid('programming', 'theory', 'mixed').required(),
difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
assignedStudents: Joi.array().items(Joi.string().email()).min(1).required(),

// NEW Validation Schema:
title: Joi.string().required(),
difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
questions: Joi.array().items(Joi.object()).min(1).required(),
studentEmails: Joi.array().items(Joi.string().email()).optional()
```

## 🧪 **Test Steps:**

### **Step 1: Login as Teacher**
1. Go to http://localhost:5173
2. Login with: `teacher@assessment.com` / `admin123`
3. You should see the Teacher Dashboard

### **Step 2: Create Assessment**
1. Click "Create Assessment" button
2. Fill out Step 1 (Basic Info):
   - Title: "JavaScript Basics Test"
   - Topic: "Variables and Functions" 
   - Language: "javascript"
   - Difficulty: "intermediate"
   - Duration: 60
   - Select question types: ✅ Programming, ✅ Theory
   - Set counts: Programming: 2, Theory: 3
3. Click "Next"

### **Step 3: Generate Questions**
1. Click "Generate Questions with AI"
2. Should show mock questions (since OpenAI API key not configured)
3. Click "Next"

### **Step 4: Review and Create**
1. Review the summary
2. Optional: Add student emails
3. Click "Create Assessment"

## 🔍 **Debugging Information:**

### **Check Backend Logs:**
When you try to create an assessment, check the server terminal for:
```
Create assessment request body: {
  "title": "JavaScript Basics Test",
  "topic": "Variables and Functions",
  "language": "javascript",
  "difficulty": "intermediate",
  ...
}
```

### **Check Browser Console:**
Open browser DevTools (F12) → Console tab for any JavaScript errors.

### **Check Network Tab:**
In DevTools → Network tab:
1. Look for POST request to `/api/assessments`
2. Check if status is 400, 401, or 500
3. View response for error details

## 🚨 **Common Error Scenarios:**

### **400 Bad Request:**
- **Cause**: Validation failed
- **Fix**: Check if all required fields are provided
- **Debug**: Look at server logs for validation error message

### **401 Unauthorized:**
- **Cause**: JWT token invalid or expired
- **Fix**: Logout and login again
- **Debug**: Check if token exists in localStorage

### **500 Internal Server Error:**
- **Cause**: Server-side error
- **Fix**: Check server logs for detailed error
- **Debug**: Database connection or code execution error

## 🏃‍♂️ **Quick Test Command:**
Run this in terminal to verify servers are working:
```bash
./health-check.sh
```

## ⚡ **Expected Behavior:**
After clicking "Create Assessment", you should:
1. See a success message
2. Modal closes automatically
3. New assessment appears in the assessments list
4. Assessment has status "draft" or "active"

---

**If you're still getting a 400 error, please:**
1. Check the browser console for detailed error messages
2. Check the server terminal for the logged request data
3. Let me know what specific error message you see

The fix should resolve the validation issues that were causing the 400 error! 🎉
