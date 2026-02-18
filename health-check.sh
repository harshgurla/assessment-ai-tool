#!/bin/bash

# MERN Stack Assessment Platform - Safety Check Script
# This script ensures all components are working correctly

echo "🔍 MERN Stack Assessment Platform - Health Check"
echo "================================================="

# Check Node.js version
echo "📊 Node.js Version:"
node --version

# Check if MongoDB is accessible
echo "📊 MongoDB Connection Test:"
curl -s http://localhost:5000/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend server is running on port 5000"
else
    echo "❌ Backend server is not accessible"
fi

# Check if frontend is accessible
echo "📊 Frontend Connection Test:"
curl -s http://localhost:5173 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Frontend server is running on port 5173"
else
    echo "❌ Frontend server is not accessible"
fi

# Check for critical files
echo "📊 Critical Files Check:"
files=(
    "/home/navgurukul/Desktop/Module-checker/server/package.json"
    "/home/navgurukul/Desktop/Module-checker/client/package.json"
    "/home/navgurukul/Desktop/Module-checker/server/src/index.ts"
    "/home/navgurukul/Desktop/Module-checker/client/src/App.tsx"
    "/home/navgurukul/Desktop/Module-checker/client/tailwind.config.js"
    "/home/navgurukul/Desktop/Module-checker/client/postcss.config.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
    fi
done

echo "================================================="
echo "🎯 Quick Start Guide:"
echo "1. Frontend: http://localhost:5173"
echo "2. Backend API: http://localhost:5000"
echo "3. Teacher Login: teacher@assessment.com / admin123"
echo "4. Student: Register with any email"
echo "================================================="
