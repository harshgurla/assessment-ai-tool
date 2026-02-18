# Assessment Platform

A comprehensive MERN stack assessment platform that allows teachers to create AI-powered assessments and students to solve programming and theory questions in an interactive environment.

## Features

### For Teachers
- **Simple Authentication**: Single email/password login system
- **AI-Powered Assessment Creation**: Generate questions based on topics, difficulty levels, and question types
- **Flexible Question Types**: Support for programming, theory, and mixed assessments
- **Student Assignment**: Assign assessments to specific students via email
- **Real-time Monitoring**: Track student progress and submissions

### For Students
- **Easy Registration**: Simple email-based account creation
- **Interactive Code Editor**: Monaco Editor integration with syntax highlighting
- **Multi-language Support**: Support for various programming languages
- **Theory Questions**: Rich text editor for written responses
- **Real-time Feedback**: AI-powered evaluation with detailed feedback
- **Progress Tracking**: View assessment history and scores

### Technical Features
- **AI Integration**: OpenAI API for question generation and answer evaluation
- **Modern UI/UX**: Responsive design with Tailwind CSS
- **TypeScript**: Full type safety across frontend and backend
- **Real-time Updates**: Live assessment progress tracking
- **Secure Authentication**: JWT-based authentication with role separation
- **MongoDB Database**: Scalable document-based storage

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing
- **Axios** for API communication
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **OpenAI API** for AI features
- **Bcrypt** for password hashing

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Module-checker
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   
   Create `.env` files:

   **Server** (`/server/.env`):
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   MONGODB_URI=mongodb://localhost:27017/assessment-platform
   JWT_SECRET=your-super-secret-jwt-key
   TEACHER_EMAIL=teacher@assessment.com
   TEACHER_PASSWORD=admin123
   OPENAI_API_KEY=your-openai-api-key-here
   AI_MODEL=gpt-3.5-turbo
   MAX_TOKENS=2000
   ```

   **Client** (`/client/.env`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. **Start MongoDB**
   Make sure MongoDB is running on your system.

6. **Run the application**
   
   **Terminal 1 (Server)**:
   ```bash
   cd server
   npm run dev
   ```

   **Terminal 2 (Client)**:
   ```bash
   cd client
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

## Default Credentials

### Teacher Login
- **Email**: teacher@assessment.com
- **Password**: admin123

### Student Registration
Students can register with any email address through the registration page.

## API Documentation

### Authentication Endpoints
- `POST /api/auth/teacher/login` - Teacher login
- `POST /api/auth/student/login` - Student login
- `POST /api/auth/student/register` - Student registration
- `GET /api/auth/verify` - Token verification

### Assessment Endpoints
- `POST /api/assessments` - Create assessment (Teacher)
- `GET /api/assessments/teacher` - Get teacher's assessments
- `GET /api/assessments/student` - Get student's assigned assessments
- `GET /api/assessments/:id` - Get assessment details
- `POST /api/assessments/:id/start` - Start assessment (Student)

### Submission Endpoints
- `POST /api/submissions/code` - Submit programming solution
- `POST /api/submissions/answer` - Submit theory answer
- `POST /api/submissions/run` - Run code without submitting
- `GET /api/submissions/assessment/:id` - Get assessment submissions

## Database Schema

### User Model
```typescript
{
  email: string;
  password: string;
  role: 'teacher' | 'student';
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Assessment Model
```typescript
{
  title: string;
  topic: string;
  language: string;
  questionType: 'programming' | 'theory' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // hours
  questions: Question[];
  assignedStudents: string[]; // emails
  createdBy: string; // teacher ID
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Question Model
```typescript
{
  type: 'programming' | 'theory';
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language?: string;
  testCases?: TestCase[];
  sampleInput?: string;
  sampleOutput?: string;
  constraints?: string;
  timeLimit?: number;
  memoryLimit?: number;
  points: number;
}
```

## Development

### Building for Production

**Server**:
```bash
cd server
npm run build
npm start
```

**Client**:
```bash
cd client
npm run build
```

### Testing
```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email [support@assessmentplatform.com] or create an issue in the repository.

## Roadmap

- [ ] Code execution sandbox integration
- [ ] Advanced analytics and reporting
- [ ] Plagiarism detection
- [ ] Video proctoring
- [ ] Mobile application
- [ ] LMS integration
- [ ] Advanced question types (drag-drop, fill-in-the-blank)
- [ ] Collaborative coding assessments
