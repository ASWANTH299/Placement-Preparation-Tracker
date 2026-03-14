# Placement Preparation Tracker - Backend

A comprehensive Node.js/Express REST API backend for the Placement Preparation Tracker platform.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: MongoDB with Mongoose ODM
- **11 Collections**: User, LearningPath, CompanyQuestion, StudentProgress, QuestionProgress, StudyActivity, MockInterview, Resume, Note, CodingProfile, Company
- **40+ API Endpoints**: Complete REST API for student and admin operations
- **Role-Based Access Control**: Student and Admin roles
- **File Uploads**: Resume management with local/S3 storage
- **Leaderboard**: Ranking system with multiple scoring formulas
- **Error Handling**: Comprehensive error handling and validation
- **Middleware Stack**: CORS, JSON parsing, authentication, authorization, error handling

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: MongoDB 5.0+
- **ODM**: Mongoose 7.0+
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: multer
- **Environment**: dotenv

## Installation

1. **Clone the repository**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure:
- MongoDB connection URI
- JWT secret key
- Email service (optional)
- File storage settings

4. **Start the server**
```bash
# Development with hot reload
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000` by default.

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   ├── controllers/         # Route handlers (10 controllers)
│   ├── middlewares/         # Express middleware
│   ├── models/              # Mongoose schemas (11 models)
│   ├── routes/              # API routes
│   ├── services/            # Business logic (optional)
│   ├── utils/               # Utility functions
│   ├── migrations/          # Database migrations
│   └── app.js              # Express app setup
├── uploads/                 # Resume file storage
├── logs/                    # Application logs
├── server.js               # Entry point
├── package.json
├── .env.example
└── README.md
```

## API Endpoints

### Authentication (Public)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/logout` - Logout

### Student Profile (Protected)
- `GET /api/v1/students/:id/profile` - Get profile
- `PUT /api/v1/students/:id/profile` - Update profile
- `POST /api/v1/students/:id/change-password` - Change password

### Learning Paths
- `GET /api/v1/learning-paths` - Get all topics
- `GET /api/v1/learning-paths/:weekId` - Get topic details
- `GET /api/v1/students/:id/learning-progress` - Get student progress
- `GET /api/v1/students/:id/learning-progress/:weekId` - Get week progress
- `POST /api/v1/students/:id/learning-progress/:weekId` - Update progress

### Company Questions
- `GET /api/v1/company-questions` - Get questions (filtered, paginated)
- `GET /api/v1/company-questions/:questionId` - Get question details
- `POST /api/v1/company-questions/:questionId/mark-solved` - Mark as solved
- `POST /api/v1/company-questions/:questionId/mark-attempted` - Mark as attempted
- `POST /api/v1/company-questions/:questionId/bookmark` - Bookmark question

### Mock Interviews
- `GET /api/v1/students/:id/mock-interviews` - Get interviews
- `GET /api/v1/students/:id/mock-interviews/:interviewId` - Get details
- `POST /api/v1/students/:id/mock-interviews` - Create interview
- `PUT /api/v1/students/:id/mock-interviews/:interviewId` - Update interview
- `DELETE /api/v1/students/:id/mock-interviews/:interviewId` - Delete interview
- `GET /api/v1/students/:id/mock-interviews/statistics` - Get stats

### Resumes
- `GET /api/v1/students/:id/resumes` - Get resumes
- `POST /api/v1/students/:id/resumes/upload` - Upload resume
- `DELETE /api/v1/students/:id/resumes/:resumeId` - Delete resume
- `PUT /api/v1/students/:id/resumes/:resumeId/set-active` - Set as active
- `PUT /api/v1/students/:id/resumes/:resumeId/rename` - Rename

### Notes
- `GET /api/v1/students/:id/notes` - Get notes
- `GET /api/v1/notes/:noteId` - Get public note
- `POST /api/v1/students/:id/notes` - Create note
- `PUT /api/v1/students/:id/notes/:noteId` - Update note
- `DELETE /api/v1/students/:id/notes/:noteId` - Delete note

### Leaderboard
- `GET /api/v1/leaderboard` - Get leaderboard
- `GET /api/v1/leaderboard/my-rank/:studentId` - Get personal rank

### Coding Profiles
- `GET /api/v1/students/:id/coding-profiles` - Get profiles
- `POST /api/v1/students/:id/coding-profiles` - Link profile
- `PUT /api/v1/students/:id/coding-profiles/:platformId` - Refresh stats
- `DELETE /api/v1/students/:id/coding-profiles/:platformId` - Unlink profile

### Admin (Protected - Admin Only)
- `GET /api/v1/admin/dashboard/stats` - Dashboard metrics
- `GET /api/v1/admin/users` - List users
- `GET /api/v1/admin/users/:userId` - Get user details
- `PUT /api/v1/admin/users/:userId` - Update user
- `DELETE /api/v1/admin/users/:userId` - Delete user
- `POST /api/v1/admin/learning-paths` - Create topic
- `PUT /api/v1/admin/learning-paths/:topicId` - Update topic
- `DELETE /api/v1/admin/learning-paths/:topicId` - Delete topic
- `POST /api/v1/admin/company-questions` - Create question
- `PUT /api/v1/admin/company-questions/:questionId` - Update question
- `DELETE /api/v1/admin/company-questions/:questionId` - Delete question

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

Token is returned on successful login and expires in 1 hour.

### Password Reset Email Setup

Reset emails are sent using Nodemailer with Gmail SMTP.

Configure these variables in `backend/.env`:

```env
FRONTEND_URL=http://localhost:5173
FRONTEND_PROD_URL=https://your-frontend-domain.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
EMAIL_FROM_NAME=Placement Tracker
```

Notes:
- For Gmail, use an App Password (not your normal account password).
- Restart the backend after updating `.env`.

### Password Reset OTP Setup (Mobile)

Mobile OTP reset is implemented using Twilio SMS.

Configure these variables in `backend/.env`:

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

Notes:
- Keep the phone number in E.164 format (example: `+919876543210`).
- In trial mode, Twilio can only send to verified recipient numbers.
- Restart the backend after updating `.env`.

## Database Collections

1. **Users** - Student and admin accounts
2. **LearningPaths** - 52-week curriculum topics
3. **CompanyQuestions** - Interview questions database
4. **StudentProgress** - Track progress on learning paths
5. **QuestionProgress** - Track solving status per question
6. **StudyActivity** - Daily study sessions for streaks
7. **MockInterviews** - Interview records with feedback
8. **Resumes** - Resume file uploads
9. **Notes** - Study notes (public/private)
10. **CodingProfiles** - Linked coding platform profiles
11. **Companies** - Standardized company list

## Error Handling

All endpoints return standardized JSON responses:

**Success Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "ERROR_CODE",
  "timestamp": "2026-02-10T10:30:00Z"
}
```

## Validation

- Email validation with RFC 5322 format
- Password complexity requirements
- File size and type validation
- Date validation (past dates only for events)
- Numeric range validation

## Security Features

- JWT token-based authentication
- Bcrypt password hashing (cost factor: 10)
- Password reset token expiry (1 hour)
- Role-based access control
- Input validation on all endpoints
- Error messages don't leak sensitive information
- CORS protection
- Environment variable management

## Development

```bash
# Run with hot reload
npm run dev

# Run tests
npm test

# Run migrations
npm run migrate
```

## Deployment Checklist

- [ ] Set environment variables
- [ ] MongoDB connection configured
- [ ] JWT_SECRET changed
- [ ] Error logging configured
- [ ] File storage (S3 or local) set up
- [ ] CORS origins configured
- [ ] API rate limiting enabled
- [ ] HTTPS enabled
- [ ] Database backups configured
- [ ] Monitoring and alerting set up

## License

ISC

## Support

For issues and questions, please refer to the main project documentation.
