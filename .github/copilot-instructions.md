<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Assessment Platform Development Guidelines

This is a MERN stack assessment platform with TypeScript. The project consists of:

## Architecture
- **Frontend**: React with TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript, MongoDB
- **Authentication**: JWT-based with role separation (teacher/student)
- **AI Integration**: OpenAI API for question generation and evaluation

## Code Style
- Use TypeScript for type safety
- Follow functional component patterns in React
- Use proper type imports (`import type { }`)
- Implement proper error handling
- Use consistent naming conventions

## Key Features
1. **Teacher Authentication**: Single email/password login
2. **Student Authentication**: Email-based registration and login
3. **Assessment Creation**: AI-powered question generation
4. **Code Editor**: Monaco Editor integration for programming questions
5. **Real-time Evaluation**: AI-based code and theory answer checking

## File Structure
- `/client` - React frontend
- `/server` - Express backend
- Shared TypeScript interfaces for API communication
- Proper separation of concerns with services, controllers, and middleware

## Best Practices
- Use proper TypeScript types for all API responses
- Implement loading states and error handling in UI
- Follow REST API conventions
- Use environment variables for configuration
- Implement proper authentication middleware
