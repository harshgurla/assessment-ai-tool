# Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to create assessment"

**Possible Causes:**
- Missing or invalid questions
- Backend validation errors
- Database connection issues
- Authentication token expired

**Solutions:**
1. Check browser console for detailed error message
2. Verify you have at least one question added
3. Check Render backend logs for specific error details
4. Try logging out and logging back in

### 2. "AI didn't create questions"

**Possible Causes:**
- Invalid or expired Google Gemini API key
- API quota exceeded
- Network issues connecting to Gemini API
- Model name incorrect

**Solutions:**

#### Verify API Key on Render:
1. Go to your backend service on Render
2. Check Environment Variables
3. Ensure `GOOGLE_GEMINI_API_KEY` is set correctly
4. Key should start with `AIza` and be ~39 characters long
5. Get a FREE key at: https://makersuite.google.com/app/apikey

#### Check Backend Logs:
1. Render → Your backend service → Logs tab
2. Look for these messages:
   - ✅ "Using Google Gemini AI" = Good!
   - ❌ "No valid AI service available" = Bad API key
   - ⚠️ "Using mock questions" = AI failed, fallback used

#### Test API Key Validity:
```bash
# Test your Gemini API key locally:
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

If it returns an error, your API key is invalid.

#### Common API Key Issues:
- **"API_KEY_INVALID"**: Key is wrong or expired - get a new one
- **"RESOURCE_EXHAUSTED"**: Free tier quota exceeded - wait or upgrade
- **"PERMISSION_DENIED"**: API not enabled in Google Cloud Console

### 3. CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Go to Render → Backend Service → Environment
2. Update `CLIENT_URL` to your exact frontend URL:
   ```
   CLIENT_URL=https://your-frontend-name.onrender.com
   ```
3. No trailing slash!
4. Save and redeploy

### 4. 404 Errors on API Calls

**Error:** `Failed to load resource: 404`

**Solution:**
1. Check `VITE_API_URL` in frontend environment on Render
2. Should be: `https://your-backend.onrender.com/api`
3. Must include `/api` at the end
4. Save and redeploy frontend

### 5. MongoDB Connection Errors

**Error:** `MongoServerError: bad auth`

**Solutions:**
1. **Create new MongoDB user:**
   - Atlas → Database Access
   - Add Database User
   - Choose password (no special chars recommended)
   - Database User Privileges: Read and write to any database

2. **Update connection string on Render:**
   ```
   MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/assessment-platform?retryWrites=true&w=majority
   ```

3. **Allow network access:**
   - Atlas → Network Access
   - Add IP Address → Allow Access from Anywhere (0.0.0.0/0)

### 6. Environment Variables Not Updating

**Issue:** Changed env vars but app still uses old values

**Solution:**
1. After changing any environment variable on Render
2. **Manual Redeploy** is sometimes needed
3. Render → Service → Manual Deploy → Deploy latest commit
4. Wait 2-3 minutes for deployment

### 7. Render Free Tier Limitations

**Issue:** App is slow or times out on first request

**Explanation:**
- Render free tier "spins down" after 15 minutes of inactivity
- First request takes 50+ seconds to wake up
- This is NORMAL for free tier

**Solutions:**
- Be patient on first request
- Upgrade to paid tier ($7/month) for always-on
- Use a service like UptimeRobot to ping your app every 14 minutes

### 8. "Failed to fetch progress data"

**Error in console:** Network error or 404/500

**Solution:**
1. Verify backend is deployed and running
2. Check backend health: `https://your-backend.onrender.com/api/health`
3. Should return: `{"status":"OK","message":"Assessment Platform Server is running"}`
4. If 404, check backend routes are correct
5. Verify `/api/users/stats` endpoint exists in backend

### 9. Student Can't See Assigned Assessments

**Possible Causes:**
- Student email not added to assessment
- Student not registered yet
- Case-sensitive email mismatch

**Solutions:**
1. Teacher: When creating assessment, select students from dropdown
2. Student must be registered and logged in first
3. Verify emails match exactly (case-sensitive)
4. Check backend logs for assigned students list

## Debugging Checklist

### Frontend Issues:
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for errors
- [ ] Check Network tab for failed requests
- [ ] Verify `VITE_API_URL` in Render environment
- [ ] Check if authentication token is present in requests

### Backend Issues:
- [ ] Check Render backend logs
- [ ] Verify all environment variables are set
- [ ] Test `/api/health` endpoint
- [ ] Check MongoDB connection in logs
- [ ] Verify API keys (Gemini/OpenAI)

### Database Issues:
- [ ] MongoDB Atlas → Network Access allows 0.0.0.0/0
- [ ] Database user has correct permissions
- [ ] Connection string includes database name
- [ ] Password doesn't have special characters

## Getting More Help

### View Logs:
**Frontend (Render):**
- Render → Static Site → Logs (shows build logs only)
- Use browser console for runtime errors

**Backend (Render):**
- Render → Web Service → Logs
- Real-time server logs with console.log output

### Test Endpoints Manually:
```bash
# Health check
curl https://your-backend.onrender.com/api/health

# Login (get token)
curl -X POST https://your-backend.onrender.com/api/auth/teacher/login \
  -H "Content-Type: application/json" \
  -d '{"email":"harsh@gmail.com","password":"harsh123"}'

# Get assessments (use token from login)
curl https://your-backend.onrender.com/api/assessments/teacher \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Contact Support:
If issues persist:
1. Share Render backend logs (last 50 lines)
2. Share browser console errors (screenshot)
3. Share exact steps to reproduce the issue
4. Include your Render URLs (frontend and backend)

## Quick Reference: Environment Variables

### Backend (Web Service):
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/assessment-platform?retryWrites=true&w=majority
JWT_SECRET=<your-64-char-random-string>
CLIENT_URL=https://your-frontend.onrender.com
TEACHER_EMAIL=harsh@gmail.com
TEACHER_PASSWORD=harsh123
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
GOOGLE_GEMINI_API_KEY=AIzaSy...
NODE_ENV=production
```

### Frontend (Static Site):
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

## Success Indicators

✅ **Backend Healthy:**
- Logs show "MongoDB connected successfully"
- Logs show "Using Google Gemini AI"
- `/api/health` returns 200 OK

✅ **Frontend Working:**
- App loads without errors
- Login works (no CORS errors)
- Can create and view assessments

✅ **AI Working:**
- Questions generate with real content
- No "mock questions" warning
- Gemini API calls succeed in logs
