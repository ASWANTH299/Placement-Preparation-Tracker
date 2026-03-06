# PLACEMENT PREPARATION TRACKER - BACKEND PRD
## Version 1.0 | FAANG-Quality Implementation Guide

---

## 1. EXECUTIVE SUMMARY

This document specifies all backend requirements for the Placement Preparation Tracker platform. It is an implementation-ready guide for Node.js/Express developers covering APIs, business logic, database design, and system architecture.

**Backend Stack**: Node.js 18+, Express.js 4.18+, MongoDB 5.0+, Mongoose ODM

**Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing

**API Format**: RESTful JSON API

**Server**: Express.js on port 5000 (configurable via .env)

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Three-Tier Architecture

```
┌─────────────────────────────────────────┐
│          Frontend (React + Vite)        │
│  (Runs in Browser, calls API endpoints) │
└──────────────────┬──────────────────────┘
                   │
                   │ HTTP/HTTPS
                   │ JSON Payloads
                   ↓
┌─────────────────────────────────────────┐
│    Backend API Layer (Node/Express)     │
│  ├─ Route Handlers                      │
│  ├─ Controllers (Business Logic)        │
│  ├─ Middleware (Auth, Validation)       │
│  ├─ Services (Data Processing)          │
│  └─ Error Handlers                      │
└──────────────────┬──────────────────────┘
                   │
                   │ Query/Write
                   │ Operations
                   ↓
┌─────────────────────────────────────────┐
│      Data Layer (MongoDB + Mongoose)    │
│  ├─ Collections (User, Question, etc)   │
│  ├─ Indexes (Performance)               │
│  ├─ Validation (Schema)                 │
│  └─ Relationships                       │
└─────────────────────────────────────────┘
```

### 2.2 Request-Response Flow

1. **Frontend** sends HTTP request with JWT token to **API endpoint**
2. **Middleware** validates JWT token and checks authorization
3. **Controller** processes request, calls **service layer**
4. **Service** interacts with **database** through Mongoose models
5. **Database** returns data
6. **Service** processes response data
7. **Controller** formats response JSON
8. **Middleware** adds response headers
9. **Frontend** receives HTTP response

### 2.3 Middleware Stack (in order)

1. `cors()` - Enable CORS
2. `express.json()` - Parse JSON request bodies
3. `express.urlencoded()` - Parse URL-encoded bodies
4. `requestLogger()` - Custom: Log incoming requests
5. `errorHandler()` - Custom: Catch all errors
6. `authMiddleware()` - Custom: Verify JWT token (on protected routes)
7. `roleMiddleware()` - Custom: Check user role
8. `validationMiddleware()` - Custom: Validate request data

---

## 3. DATABASE DESIGN

### 3.1 MongoDB Collections & Schemas

#### **1. Users Collection**

**Purpose**: Store student and admin accounts

**Schema**:
```javascript
{
  _id: ObjectId (auto-generated),
  name: String (required, 2-100 chars),
  email: String (required, unique, lowercase),
  password: String (required, bcrypt hashed),
  role: Enum (required, values: "student" | "admin", default: "student"),
  bio: String (optional, max 500 chars),
  avatar: String (optional, URL to avatar image),
  university: String (optional, max 100 chars),
  graduationYear: Number (optional, YYYY format),
  department: String (optional, max 100 chars),
  isActive: Boolean (default: true),
  lastLogin: Date (optional),
  passwordResetToken: String (optional, hashed),
  passwordResetExpiry: Date (optional),
  createdAt: Date (auto, timestamps: true),
  updatedAt: Date (auto, timestamps: true)
}
```

**Indexes**:
- `email` (unique)
- `createdAt` (for sorting by recent)
- `role` (for admin queries)

**Constraints**:
- Email must be unique and validated
- Password must be min 8 chars, bcrypt hashed (cost factor: 10)
- Name must be non-empty
- Role is immutable after creation (except by admin)

---

#### **2. LearningPaths Collection**

**Purpose**: Store structured learning topics for students

**Schema**:
```javascript
{
  _id: ObjectId,
  week: Number (required, unique, 1-52),
  topic: String (required, max 100 chars),
  description: String (required, max 1000 chars),
  estimatedDurationHours: Number (optional, default: 0),
  difficulty: Enum (required, "Beginner" | "Intermediate" | "Advanced"),
  resources: [
    {
      title: String,
      url: String,
      type: String ("article" | "video" | "documentation")
    }
  ],
  subtopics: [String] (optional, comma-separated),
  status: Enum ("Active" | "Archived", default: "Active"),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `week` (unique, for sorting)
- `status` (query active paths)

---

#### **3. CompanyQuestions Collection**

**Purpose**: Store interview questions categorized by company and topic

**Schema**:
```javascript
{
  _id: ObjectId,
  title: String (required, max 200 chars),
  description: String (required, max 5000 chars, rich text),
  company: String (required, from predefined dropdown),
  topics: [String] (required, at least 1, e.g., ["Arrays", "Sorting"]),
  difficulty: Enum (required, "Easy" | "Medium" | "Hard"),
  exampleInput: String (optional),
  exampleOutput: String (optional),
  constraints: String (optional),
  hints: String (optional, rich text),
  solutionApproach: String (optional),
  solutionCode: String (optional),
  tags: [String] (optional),
  status: Enum ("Active" | "Archived", default: "Active"),
  solvedCount: Number (default: 0, incremented when student solves),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `company` (query by company)
- `difficulty` (sort/filter by difficulty)
- `topics` (query by topic)
- `solvedCount` (leaderboard queries)
- `status` (active questions only)

---

#### **4. StudentProgress Collection**

**Purpose**: Track student progress on learning paths

**Schema**:
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (required, ref: "Users"),
  weekId: Number (required, ref to LearningPaths.week),
  status: Enum ("Not Started" | "In Progress" | "Completed", default: "Not Started"),
  completionPercentage: Number (0-100, default: 0),
  notes: [
    {
      content: String (max 1000 chars),
      createdAt: Date
    }
  ],
  startedAt: Date (optional, auto-set on first access),
  completedAt: Date (optional, auto-set on completion),
  createdAt: Date,
  updatedAt: Date
}
```

**Index**:
- Compound: `(studentId, weekId)` (unique)
- `studentId` (query all progress for a student)

---

#### **5. QuestionProgress Collection**

**Purpose**: Track student performance on individual questions

**Schema**:
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (required, ref: "Users"),
  questionId: ObjectId (required, ref: "CompanyQuestions"),
  status: Enum ("Not Attempted" | "Attempted" | "Solved", default: "Not Attempted"),
  isSolved: Boolean (default: false),
  isBookmarked: Boolean (default: false),
  attemptCount: Number (default: 0),
  firstAttemptDate: Date (optional),
  lastAttemptDate: Date (optional),
  solvedDate: Date (optional),
  timeTakenMinutes: Number (optional),
  approachNotes: String (optional, student's approach, max 500 chars),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- Compound: `(studentId, questionId)` (unique)
- `studentId` (query progress)
- `isSolved` (count solved questions)
- `isBookmarked` (query bookmarks)
- `solvedDate` (recent activity)

---

#### **6. StudyActivity Collection**

**Purpose**: Track daily study sessions for study streak calculation

**Schema**:
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (required, ref: "Users"),
  activityDate: Date (required, stored as YYYY-MM-DD for consistency),
  durationMinutes: Number (required, ≥ 10 min triggered study streak),
  activityType: Enum ("question_solved" | "task_completed" | "study_session"),
  relatedEntityId: ObjectId (optional, ref to question/task if applicable),
  description: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- Compound: `(studentId, activityDate)` (unique per day per student)
- `studentId` (query student activities)
- `activityDate` (streak calculation)

**Study Streak Logic**:
- For each student, calculate consecutive days (today, yesterday, day before...) where activityDate has at least one activity with durationMinutes ≥ 10
- Streak = count of consecutive days
- Reset if date gap exists

---

#### **7. MockInterviews Collection**

**Purpose**: Record mock interview sessions with scores and feedback

**Schema**:
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (required, ref: "Users"),
  company: String (required, from standardized dropdown),
  interviewDate: Date (required, past/current date only),
  interviewTime: String (optional, HH:MM format),
  score: Number (required, 0-100, decimal allowed),
  overallFeedback: String (required, max 1000 chars),
  technicalSkills: String (optional, max 500 chars),
  communication: String (optional, max 500 chars),
  problemSolving: String (optional, max 500 chars),
  improvements: String (optional, max 500 chars),
  interviewerName: String (optional, max 100 chars),
  duration: Number (optional, in minutes),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `studentId` (query interviews)
- `company` (filter by company)
- `score` (leaderboard calculations)
- `interviewDate` (sort by date)

**Constraints**:
- Company must be from predefined list
- Score must be 0-100 (decimals allowed, e.g., 85.5)
- interviewDate cannot be future date

---

#### **8. Resumes Collection**

**Purpose**: Store resume file uploads per student

**Schema**:
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (required, ref: "Users"),
  fileName: String (required, original file name),
  filePath: String (required, storage path or S3 URL),
  fileSize: Number (required, in bytes),
  fileType: String (required, "pdf" | "doc" | "docx"),
  uploadedDate: Date (auto, timestamps: true),
  isActive: Boolean (default: false, only 1 active per student),
  customName: String (optional, user-set name for resume version),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `studentId` (query student resumes)
- `isActive` (find active resume)
- Compound: `(studentId, isActive)` (ensure only 1 active)

**Constraints**:
- Max 5 resumes per student
- File size max 5MB
- Only 1 active resume per student (checked on set-active)

---

#### **9. Notes Collection**

**Purpose**: Store student study notes with visibility control

**Schema**:
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (required, ref: "Users"),
  title: String (required, 5-200 chars),
  content: String (required, max 10000 chars, rich text),
  topics: [String] (optional, e.g., ["Arrays", "Binary Search"]),
  companies: [String] (optional),
  visibility: Enum ("Private" | "Public", default: "Private"),
  viewCount: Number (default: 0, incremented on view),
  isPinned: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `studentId` (query own notes)
- `visibility` (query public notes)
- `createdAt` (sorting by newest)
- Compound: `(visibility, createdAt)` (public notes by date)

**Note**: Public notes should be viewable by all authenticated students, but not editable/deletable.

---

#### **10. CodingProfiles Collection**

**Purpose**: Track student's linked coding platform profiles

**Schema**:
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (required, ref: "Users"),
  platform: Enum (required, "LeetCode" | "CodeChef" | "HackerRank" | "Codeforces"),
  username: String (required, platform-specific username),
  profileUrl: String (optional, generated URL to platform profile),
  problemsSolved: Number (optional, fetched from platform API),
  currentRating: Number (optional, fetched from platform API),
  lastSyncedAt: Date (optional, last time profile was refreshed),
  syncStatus: Enum ("Syncing" | "Success" | "Failed", default: "Success"),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- Compound: `(studentId, platform)` (unique per platform per student)
- `studentId` (query student's profiles)

**Constraints**:
- One profile per platform per student
- Username validation per platform

---

#### **11. Companies Collection** (Optional, for standardization)

**Purpose**: Maintain standardized list of companies

**Schema**:
```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  displayName: String (required, for UI display),
  createdAt: Date,
  updatedAt: Date
}
```

**Pre-populated Companies**:
- Amazon
- Google
- Microsoft
- Apple
- Meta Platforms
- TCS
- Infosys
- Wipro
- Cognizant
- Accenture
- etc.

---

### 3.2 Data Relationships

**User → StudentProgress**: 1 to Many (One user has many learning path progresses)

**User → QuestionProgress**: 1 to Many (One user solves many questions)

**User → StudyActivity**: 1 to Many (One user has many activities)

**User → MockInterviews**: 1 to Many (One user has many interviews)

**User → Resumes**: 1 to Many (One user has max 5 resumes)

**User → Notes**: 1 to Many (One user creates many notes)

**User → CodingProfiles**: 1 to Many (One user has profiles on multiple platforms)

**CompanyQuestions** (No direct user reference, tracked through **QuestionProgress**)

---

### 3.3 Migration Strategy

**Initial Setup** (Database initialization):
1. Create collections with Mongoose schemas
2. Create indexes for performance
3. Seed initial data (companies, learning paths, sample questions)

**Versioning**: 
- Use migration files in `src/migrations/` folder
- Example: `001-initial-schema.js`, `002-add-indexes.js`
- Track applied migrations in a `migrations` collection

---

## 4. API ENDPOINTS

### 4.1 Authentication Endpoints

#### **POST /api/v1/auth/register**

**Purpose**: Register a new student account

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Validation**:
- `name`: Required, 2-100 chars, non-empty
- `email`: Required, valid email format, must not exist in DB
- `password`: Required, min 8 chars, must contain uppercase, lowercase, number, special char
- `confirmPassword`: Must match password

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  },
  "message": "Registration successful. Please login."
}
```

**Error Responses**:
- 400 Bad Request: Validation failed
  ```json
  { "success": false, "error": "Email already exists", "errorCode": "EMAIL_EXISTS" }
  ```
- 400 Bad Request: Password doesn't meet requirements
  ```json
  { "success": false, "error": "Password must contain uppercase, lowercase, number, and special character", "errorCode": "PASSWORD_INVALID" }
  ```

**Business Logic**:
- Check email uniqueness in users collection
- Validate password strength
- Hash password with bcrypt (cost factor: 10)
- Create user document with role="student"
- Do NOT auto-login; return success and redirect to login page

---

#### **POST /api/v1/auth/login**

**Purpose**: Authenticate user and return JWT token

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**JWT Token Structure**:
```javascript
Header: { "alg": "HS256", "typ": "JWT" }
Payload: {
  "id": "user_id",
  "email": "email@example.com",
  "role": "student",
  "iat": 1234567890,
  "exp": 1234671490 // 1 hour expiry
}
Signature: HMACSHA256(secret)
```

**Error Responses**:
- 401 Unauthorized: Invalid credentials
  ```json
  { "success": false, "error": "Invalid email or password", "errorCode": "AUTH_FAILED" }
  ```

**Business Logic**:
- Find user by email in collection
- Compare provided password with stored hash using bcrypt
- If match: Generate JWT token with 1-hour expiry
- Return token to frontend (stored in localStorage)
- Update lastLogin timestamp

---

#### **POST /api/v1/auth/forgot-password**

**Purpose**: Initiate password reset flow

**Request Body**:
```json
{ "email": "john@example.com" }
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "If an account exists with this email, a reset link will be sent"
}
```

**Business Logic**:
- Find user by email
- If not found: Return success message anyway (security best practice)
- If found: Generate resetToken (random 32-char string), hash it, store in passwordResetToken field with 1-hour expiry
- Send email with reset link: `https://frontend.com/reset-password?token=<unhashed_token>`
- Email should be async (not blocking response)

---

#### **POST /api/v1/auth/reset-password**

**Purpose**: Reset password using token from email

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Validation**:
- Token must be valid and not expired
- Password meets complexity requirements
- Passwords match

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password reset successful. Please login with new password."
}
```

**Error Responses**:
- 400 Bad Request: Token invalid or expired
  ```json
  { "success": false, "error": "Reset link has expired", "errorCode": "TOKEN_EXPIRED" }
  ```

**Business Logic**:
- Hash incoming token and find user with matching passwordResetToken and passwordResetExpiry > now
- If found, hash new password, update user.password, clear passwordResetToken/Expiry
- If not found, return token expired error

---

#### **POST /api/v1/auth/logout**

**Purpose**: Logout user (client-side token removal)

**Authentication**: Required (JWT token)

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Business Logic**:
- Backend is stateless (JWT-based)
- Client removes token from localStorage
- No backend data deletion needed

---

### 4.2 Student Profile Endpoints

#### **GET /api/v1/students/:id/profile**

**Purpose**: Get student profile information

**Authentication**: Required

**Authorization**: User can only view own profile (role student) OR admin can view any

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "student_id",
    "name": "John Doe",
    "email": "john@example.com",
    "bio": "Aspiring software engineer",
    "avatar": "https://...",
    "university": "MIT",
    "graduationYear": 2026,
    "department": "Computer Science",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

---

#### **PUT /api/v1/students/:id/profile**

**Purpose**: Update student profile information

**Authentication**: Required

**Authorization**: User can only update own profile OR admin can update any

**Request Body** (all optional):
```json
{
  "name": "Jane Doe",
  "bio": "Updated bio",
  "avatar": "https://...",
  "university": "Stanford",
  "graduationYear": 2027,
  "department": "AI/ML"
}
```

**Validation**:
- name: 2-100 chars
- bio: max 500 chars
- avatar: valid URL
- graduationYear: valid year format

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { /* updated profile */ },
  "message": "Profile updated successfully"
}
```

---

#### **POST /api/v1/students/:id/change-password**

**Purpose**: Change user's password

**Authentication**: Required

**Request Body**:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

**Validation**:
- currentPassword: Must match stored password hash
- newPassword: Complexity requirements, different from current
- confirmPassword: Match newPassword

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses**:
- 401 Unauthorized: Current password incorrect
  ```json
  { "success": false, "error": "Current password is incorrect", "errorCode": "AUTH_FAILED" }
  ```

---

### 4.3 Learning Paths Endpoints

#### **GET /api/v1/learning-paths**

**Purpose**: Get all learning path topics

**Authentication**: Required

**Query Parameters**:
- `page` (int, default: 1): Pagination page
- `limit` (int, default: 15): Items per page
- `status` (enum, optional): "Active" | "Archived"
- `difficulty` (enum, optional): "Beginner" | "Intermediate" | "Advanced"

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "learning_path_id",
      "week": 1,
      "topic": "Arrays & Strings",
      "description": "Learn basic array operations...",
      "estimatedDurationHours": 10,
      "difficulty": "Beginner",
      "resources": [
        { "title": "Array Tutorial", "url": "https://...", "type": "article" }
      ],
      "subtopics": ["1D Arrays", "2D Arrays"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 52,
    "pages": 4
  }
}
```

---

#### **GET /api/v1/learning-paths/:weekId**

**Purpose**: Get specific learning path topic details

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { /* full topic details */ }
}
```

---

#### **GET /api/v1/students/:id/learning-progress**

**Purpose**: Get student's progress on all learning paths

**Authentication**: Required

**Authorization**: User can only view own progress OR admin

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "weekId": 1,
      "topic": "Arrays & Strings",
      "status": "In Progress",
      "completionPercentage": 45,
      "startedAt": "2026-02-01T10:00:00Z",
      "completedAt": null
    }
  ]
}
```

---

#### **GET /api/v1/students/:id/learning-progress/:weekId**

**Purpose**: Get student's progress on specific topic

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "weekId": 1,
    "status": "In Progress",
    "completionPercentage": 45,
    "notes": [
      { "content": "Important: two-pointer technique", "createdAt": "2026-02-05T..." }
    ],
    "startedAt": "2026-02-01T..."
  }
}
```

---

#### **POST /api/v1/students/:id/learning-progress/:weekId**

**Purpose**: Update student's progress on a topic

**Authentication**: Required

**Request Body**:
```json
{
  "status": "Completed",
  "completionPercentage": 100,
  "notes": "Mastered array operations, prefer two-pointer approach for sorting problems"
}
```

**Validation**:
- status: "Not Started" | "In Progress" | "Completed"
- completionPercentage: 0-100
- notes: max 1000 chars

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { /* updated progress */ },
  "message": "Progress updated successfully"
}
```

**Business Logic**:
- If status changes to "Completed", set completedAt = now
- If status changes from "Not Started", set startedAt = now (only first time)
- Calculate completionPercentage based on related questions solved (if not provided)

---

#### **POST /api/v1/students/:id/learning-progress/:weekId/notes**

**Purpose**: Add note to a learning path topic

**Authentication**: Required

**Request Body**:
```json
{
  "content": "Two-pointer technique is useful for sorted arrays..."
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "content": "Two-pointer technique...",
    "createdAt": "2026-02-05T14:30:00Z"
  }
}
```

---

### 4.4 Company Questions Endpoints

#### **GET /api/v1/company-questions**

**Purpose**: Get filtered list of interview questions

**Authentication**: Required

**Query Parameters**:
- `page` (int, default: 1): Pagination
- `limit` (int, default: 10): Items per page
- `company` (string, optional): Filter by company
- `topic` (string, optional): Filter by topic
- `difficulty` (enum, optional): "Easy" | "Medium" | "Hard"
- `search` (string, optional): Full-text search in title + description
- `status` (enum, optional, admin only): "Active" | "Archived"
- `sortBy` (string, optional): "difficulty", "company", "date", "popular" (solvedCount)
- `order` (enum, optional): "asc" | "desc"

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "question_id",
      "title": "Two Sum Problem",
      "company": "Amazon",
      "topics": ["Arrays", "Hash Table"],
      "difficulty": "Easy",
      "solvedCount": 1240,
      "userStatus": {
        "isSolved": true,
        "isBookmarked": false,
        "attemptCount": 2,
        "solvedDate": "2026-02-10T..."
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

**Business Logic**:
- Return compact question preview (not full description)
- Include userStatus only if authenticated user has interacted with question
- Return archived questions only if user is admin

---

#### **GET /api/v1/company-questions/:questionId**

**Purpose**: Get detailed question information

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "question_id",
    "title": "Two Sum Problem",
    "description": "Given an array of integers nums and an integer target...",
    "company": "Amazon",
    "topics": ["Arrays", "Hash Table"],
    "difficulty": "Easy",
    "exampleInput": "[2, 7, 11, 15], target = 9",
    "exampleOutput": "[0, 1]",
    "constraints": "1 <= nums.length <= 10^4",
    "hints": "Use a hash table to store visited elements...",
    "solutionApproach": "Two-pass hash table approach...",
    "solutionCode": "def twoSum(nums, target):\n  seen = {}\n  for i, num in enumerate(nums):\n    ...",
    "solvedCount": 1240,
    "userProgress": {
      "isSolved": true,
      "isBookmarked": false,
      "attemptCount": 2,
      "firstAttemptDate": "2026-02-08T...",
      "solvedDate": "2026-02-10T...",
      "timeTakenMinutes": 15,
      "approachNotes": "Used hash table with single pass..."
    }
  }
}
```

**Business Logic**:
- Increment view count for question (analytics)
- Include userProgress only if authenticated user is owner
- Return solution fields only if user has solved OR admin

---

#### **POST /api/v1/company-questions/:questionId/mark-solved**

**Purpose**: Mark question as solved by user

**Authentication**: Required

**Request Body** (optional):
```json
{
  "timeTakenMinutes": 15,
  "approachNotes": "Used hash table approach with single pass"
}
```

**Validation**:
- timeTakenMinutes: positive number (optional)
- approachNotes: max 500 chars

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "status": "Solved",
    "solvedDate": "2026-02-10T10:30:00Z"
  },
  "message": "Question marked as solved"
}
```

**Business Logic**:
- Create or update QuestionProgress record
- Set isSolved = true, status = "Solved", solvedDate = now
- Increment CompanyQuestions.solvedCount
- Possibly trigger UpdateStudyStreak (if activity >= 10 min)
- Return success regardless if already solved (idempotent)

---

#### **POST /api/v1/company-questions/:questionId/mark-attempted**

**Purpose**: Mark question as attempted (not solved)

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Question marked as attempted"
}
```

**Business Logic**:
- Create or update QuestionProgress record
- Set status = "Attempted", increment attemptCount
- Do NOT set isSolved = true
- Set lastAttemptDate = now

---

#### **POST /api/v1/company-questions/:questionId/bookmark**

**Purpose**: Bookmark/unbookmark question

**Authentication**: Required

**Request Body**:
```json
{ "isBookmarked": true }
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { "isBookmarked": true }
}
```

---

### 4.5 Mock Interviews Endpoints

#### **GET /api/v1/students/:id/mock-interviews**

**Purpose**: Get student's mock interview history

**Authentication**: Required

**Query Parameters**:
- `page` (int, default: 1): Pagination
- `limit` (int, default: 10): Items per page
- `company` (string, optional): Filter by company
- `dateRange` (string, optional): "lastMonth" | "lastWeek" | "all"
- `sortBy` (string, optional): "date" | "score"
- `order` (enum, optional): "asc" | "desc"

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "interview_id",
      "company": "Amazon",
      "interviewDate": "2026-02-15T10:00:00Z",
      "score": 85.5,
      "overallFeedback": "Strong algorithmic thinking, needs improvement in communication",
      "duration": 45
    }
  ],
  "pagination": { /* ... */ }
}
```

---

#### **GET /api/v1/students/:id/mock-interviews/:interviewId**

**Purpose**: Get detailed interview feedback

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "interview_id",
    "company": "Amazon",
    "interviewDate": "2026-02-15T10:00:00Z",
    "score": 85.5,
    "overallFeedback": "Strong algorithmic thinking...",
    "technicalSkills": "Excellent problem decomposition...",
    "communication": "Could explain approach more clearly...",
    "problemSolving": "Efficiently solved the hard problem...",
    "improvements": "Practice more on system design...",
    "interviewerName": "Bob Engineer",
    "duration": 45
  }
}
```

---

#### **POST /api/v1/students/:id/mock-interviews**

**Purpose**: Record a new mock interview

**Authentication**: Required

**Request Body**:
```json
{
  "company": "Amazon",
  "interviewDate": "2026-02-15T10:00:00Z",
  "score": 85.5,
  "overallFeedback": "Strong algorithmic thinking...",
  "technicalSkills": "Excellent decomposition",
  "communication": "Could be clearer",
  "problemSolving": "Efficient approach",
  "improvements": "Practice system design",
  "interviewerName": "Bob Engineer",
  "duration": 45
}
```

**Validation**:
- company: Required, from standardized list
- interviewDate: Past or current date only
- score: 0-100, decimal allowed
- overallFeedback: Required, max 1000 chars
- Other fields: Optional
- duration: Positive number

**Response (201 Created)**:
```json
{
  "success": true,
  "data": { /* created interview */ },
  "message": "Interview recorded successfully"
}
```

**Business Logic**:
- Validate date is not in future
- Create MockInterviews document
- Trigger UpdateStudyStreak (if not already triggered)
- Return created interview

---

#### **PUT /api/v1/students/:id/mock-interviews/:interviewId**

**Purpose**: Update interview record (edit feedback, score, etc)

**Authentication**: Required

**Authorization**: User can only edit own interviews

**Request Body**: Same as POST (partial update allowed)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { /* updated interview */ },
  "message": "Interview updated successfully"
}
```

---

#### **DELETE /api/v1/students/:id/mock-interviews/:interviewId**

**Purpose**: Delete interview record

**Authentication**: Required

**Authorization**: User can only delete own interviews

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Interview deleted successfully"
}
```

---

#### **GET /api/v1/students/:id/mock-interviews/statistics**

**Purpose**: Get aggregated interview statistics

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "totalInterviews": 12,
    "averageScore": 82.3,
    "highestScore": 95,
    "lowestScore": 65,
    "mostTestedCompany": "Amazon",
    "trend": "improving",
    "byCompany": {
      "Amazon": { "count": 5, "avgScore": 85 },
      "Google": { "count": 4, "avgScore": 82 }
    }
  }
}
```

---

### 4.6 Resume Endpoints

#### **GET /api/v1/students/:id/resumes**

**Purpose**: Get student's resume list

**Authentication**: Required

**Authorization**: User can view own, admin can view any, any student can view others

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "resume_id",
      "fileName": "Resume_John_Doe_2026.pdf",
      "customName": "Latest Resume",
      "fileSize": 204800,
      "fileType": "pdf",
      "uploadedDate": "2026-02-10T10:30:00Z",
      "isActive": true
    }
  ]
}
```

---

#### **POST /api/v1/students/:id/resumes/upload**

**Purpose**: Upload a new resume

**Authentication**: Required

**Content-Type**: multipart/form-data

**Form Data**:
- `file` (file, required): Resume file (PDF, DOC, DOCX)
- `customName` (string, optional): User-friendly name

**Validation**:
- File size: Max 5MB
- File type: PDF, DOC, DOCX only
- User has < 5 resumes (check before upload)

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "resume_id",
    "fileName": "Resume_2026.pdf",
    "customName": "Latest Resume",
    "uploadedDate": "2026-02-10T10:30:00Z",
    "isActive": false
  },
  "message": "Resume uploaded successfully"
}
```

**Business Logic**:
- Store file in cloud storage (S3, Google Cloud Storage, or local `/uploads/`)
- Save file path/URL to MongoDB
- Do NOT auto-set as active (user must explicitly set)

---

#### **DELETE /api/v1/students/:id/resumes/:resumeId**

**Purpose**: Delete a resume

**Authentication**: Required

**Authorization**: User can only delete own

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Resume deleted successfully"
}
```

**Business Logic**:
- Delete file from storage
- Remove document from MongoDB
- If resume was active, do NOT set another as active

---

#### **PUT /api/v1/students/:id/resumes/:resumeId/set-active**

**Purpose**: Set a resume as active (only one active per student)

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { "isActive": true },
  "message": "Resume set as active"
}
```

**Business Logic**:
- Find previous active resume, set isActive = false
- Set target resume isActive = true
- Ensure only 1 active per student via database constraint

---

#### **PUT /api/v1/students/:id/resumes/:resumeId/rename**

**Purpose**: Rename resume (customName)

**Authentication**: Required

**Request Body**:
```json
{ "customName": "Updated Resume Name" }
```

**Validation**:
- customName: Max 100 chars

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { "customName": "Updated Resume Name" }
}
```

---

#### **GET /api/v1/students/:id/profiles**

**Purpose**: Get student's GitHub, LinkedIn, Portfolio links

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "githubProfile": "https://github.com/johndoe",
    "linkedinProfile": "https://linkedin.com/in/johndoe",
    "portfolioLink": "https://johndoe.portfolio.com"
  }
}
```

---

#### **PUT /api/v1/students/:id/profiles**

**Purpose**: Update profile links

**Authentication**: Required

**Request Body**:
```json
{
  "githubProfile": "https://github.com/johndoe",
  "linkedinProfile": "https://linkedin.com/in/johndoe",
  "portfolioLink": "https://johndoe.portfolio.com"
}
```

**Validation**:
- All fields are valid URLs (optional)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { /* updated links */ }
}
```

**Business Logic**:
- Store links in User document (extend schema with these fields) OR create separate UserProfiles collection
- Validate URL format before saving

---

### 4.7 Notes Endpoints

#### **GET /api/v1/students/:id/notes**

**Purpose**: Get student's notes (private) + public notes from all students

**Authentication**: Required

**Query Parameters**:
- `page` (int, default: 1): Pagination
- `limit` (int, default: 12): Items per page
- `visibility` (enum, optional): "Private" | "Public" | "All" (default: "All")
- `topic` (string, optional): Filter by topic
- `company` (string, optional): Filter by company
- `search` (string, optional): Search by title/content
- `sortBy` (string, optional): "newest" | "oldest" | "mostViewed"

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "note_id",
      "title": "Binary Search Techniques",
      "content": "...",
      "author": "John Doe",
      "authorId": "author_id",
      "topics": ["Binary Search", "Arrays"],
      "visibility": "Public",
      "viewCount": 42,
      "createdAt": "2026-02-05T10:30:00Z",
      "isOwnNote": true
    }
  ],
  "pagination": { /* ... */ }
}
```

**Business Logic**:
- Show own notes (regardless of visibility) with isOwnNote = true
- Show other students' notes only if visibility = "Public"
- Admin can view all notes
- Include viewCount only for public notes

---

#### **GET /api/v1/notes/:noteId**

**Purpose**: Get public note by ID

**Authentication**: Required (to ensure student access)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "note_id",
    "title": "Binary Search",
    "content": "..." (full rich text),
    "author": "John Doe",
    "authorId": "author_id",
    "topics": ["Binary Search"],
    "companies": ["Google"],
    "visibility": "Public",
    "viewCount": 45,
    "createdAt": "2026-02-05T10:30:00Z"
  }
}
```

**Business Logic**:
- Allow view only if: note.visibility = "Public" OR authenticated user owns note
- Increment viewCount for public notes
- Return 403 Forbidden if:  user is not owner AND visibility = "Private"

---

#### **POST /api/v1/students/:id/notes**

**Purpose**: Create a new note

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Binary Search Techniques",
  "content": "Binary search is a search algorithm...",
  "topics": ["Binary Search", "Algorithms"],
  "companies": ["Google", "Amazon"],
  "visibility": "Public"
}
```

**Validation**:
- title: Required, 5-200 chars
- content: Required, max 10000 chars
- topics: Array of strings
- companies: Array of strings
- visibility: "Private" | "Public"

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "note_id",
    "title": "Binary Search Techniques",
    "visibility": "Public",
    "createdAt": "2026-02-10T10:30:00Z"
  },
  "message": "Note created successfully"
}
```

---

#### **PUT /api/v1/students/:id/notes/:noteId**

**Purpose**: Update a note

**Authentication**: Required

**Authorization**: User can only edit own notes

**Request Body**: Same as POST (partial update allowed)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { /* updated note */ },
  "message": "Note updated successfully"
}
```

---

#### **DELETE /api/v1/students/:id/notes/:noteId**

**Purpose**: Delete a note

**Authentication**: Required

**Authorization**: User can only delete own notes

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Note deleted successfully"
}
```

---

### 4.8 Leaderboard Endpoints

#### **GET /api/v1/leaderboard**

**Purpose**: Get ranked leaderboard of students

**Authentication**: Required

**Query Parameters**:
- `period` (enum, optional): "all_time" | "this_month" | "this_week" (default: "all_time")
- `view` (enum, optional): "overall" | "progress" | "questions" | "mock_interviews" (default: "overall")
- `page` (int, default: 1): Pagination
- `limit` (int, default: 100): Top N students
- `search` (string, optional): Filter by student name

**Leaderboard Calculation**:

**Overall Rankings** (default):
```
Score = (progressPercentage * 0.50) + (questionsSolvedCount * 0.30) + (avgMockScore * 0.20)

Where:
- progressPercentage: (completedWeeks / totalWeeks) * 100
- questionsSolvedCount: total questions solved by student (normalized to 0-100 scale)
- avgMockScore: average of all mock interview scores (if >= 1 interview, else 0)
```

**Progress Rankings**:
- Sort by progressPercentage descending

**Questions Rankings**:
- Sort by questionsSolvedCount descending, then by difficulty breakdown

**Mock Interviews Rankings**:
- Sort by avgMockScore descending, then by interview count

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "studentId": "student_id",
      "name": "Rahul Sharma",
      "progressPercentage": 95,
      "questionsSolved": 245,
      "avgMockScore": 85.5,
      "overallScore": 890,
      "trend": "up",
      "interviewCount": 10
    }
  ],
  "pagination": { "page": 1, "limit": 100, "total": 5432 }
}
```

**Business Logic**:
- Calculate scores on-the-fly OR cache daily (update task runs at midnight)
- Return rank for all students, sorted by score descending
- Include trend: compare current score with previous week's rank

---

#### **GET /api/v1/leaderboard/my-rank/:studentId**

**Purpose**: Get current student's rank and standings

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "currentRank": 42,
    "totalStudents": 5432,
    "progressPercentage": 78,
    "questionsSolved": 120,
    "avgMockScore": 79.5,
    "overallScore": 725,
    "trend": "up",
    "nearbyStudents": [
      { "rank": 41, "name": "Student Above" },
      { "rank": 42, "name": "You" },
      { "rank": 43, "name": "Student Below" }
    ]
  }
}
```

---

### 4.9 Coding Profiles Endpoints

#### **POST /api/v1/students/:id/coding-profiles**

**Purpose**: Link a coding platform profile

**Authentication**: Required

**Request Body**:
```json
{
  "platform": "LeetCode",
  "username": "johndoe"
}
```

**Validation**:
- platform: "LeetCode" | "CodeChef" | "HackerRank" | "Codeforces"
- username: Non-empty string, max 50 chars

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "platform": "LeetCode",
    "username": "johndoe",
    "profileUrl": "https://leetcode.com/johndoe",
    "linkedAt": "2026-02-10T10:30:00Z"
  },
  "message": "Profile linked successfully"
}
```

**Business Logic**:
- Check if profile with this (studentId, platform) already exists
- If exists, return 409 Conflict
- Store username and generate profile URL based on platform
- Do NOT fetch stats immediately; sync stats on demand

---

#### **PUT /api/v1/students/:id/coding-profiles/:platformId**

**Purpose**: Refresh/sync coding profile stats from platform

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "platform": "LeetCode",
    "username": "johndoe",
    "problemsSolved": 256,
    "currentRating": 2150,
    "lastSyncedAt": "2026-02-10T10:35:00Z"
  },
  "message": "Profile stats updated"
}
```

**Business Logic**:
- Fetch stats from platform's public API OR use scraped data
- Update problemsSolved and currentRating fields
- Update lastSyncedAt = now
- Set syncStatus = "Success" or "Failed" if API call fails

**Note**: Actual API calls to external platforms may require additional configuration; for v1, fields can be manually entered or estimated.

---

#### **DELETE /api/v1/students/:id/coding-profiles/:platformId**

**Purpose**: Unlink a coding platform profile

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile unlinked successfully"
}
```

---

#### **GET /api/v1/students/:id/coding-profiles**

**Purpose**: Get all linked coding profiles for student

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "platform": "LeetCode",
      "username": "johndoe",
      "problemsSolved": 256,
      "currentRating": 2150,
      "lastSyncedAt": "2026-02-10T10:35:00Z"
    }
  ]
}
```

---

### 4.10 Admin Endpoints

#### **GET /api/v1/admin/dashboard/stats**

**Purpose**: Get dashboard KPI metrics (admin only)

**Authentication**: Required

**Authorization**: Admin only

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 5432,
    "activeUsersThisMonth": 3210,
    "newUsersThisMonth": 450,
    "averageProgressPercentage": 62.5,
    "totalQuestionsSolved": 125430,
    "averageQuestionsPerStudent": 23.1,
    "totalMockInterviews": 8900,
    "averageMockScore": 78.5,
    "systemUptime": 99.95,
    "dbResponseTimeMs": 12.5,
    "apiRequestsPerMinute": 1240
  }
}
```

---

#### **GET /api/v1/admin/users**

**Purpose**: Get paginated list of all users with filters

**Authentication**: Required

**Authorization**: Admin only

**Query Parameters**:
- `page` (int, default: 1): Pagination
- `limit` (int, default: 25): Items per page
- `search` (string, optional): Search name/email
- `status` (enum, optional): "Active" | "Inactive" | "Pending"
- `sortBy` (string, optional): "name" | "created" | "progress"
- `order` (enum, optional): "asc" | "desc"

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "Active",
      "progressPercentage": 45,
      "questionsCount": 50,
      "createdAt": "2026-01-15T10:30:00Z",
      "lastLogin": "2026-02-10T15:20:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 25, "total": 5432, "pages": 218 }
}
```

---

#### **GET /api/v1/admin/users/:userId**

**Purpose**: Get detailed user profile (admin view)

**Authentication**: Required

**Authorization**: Admin only

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "Active",
    "progressPercentage": 45,
    "recentActivities": [
      { "type": "question_solved", "date": "2026-02-10T...", "details": "Solved Two Sum" }
    ],
    "createdAt": "2026-01-15T10:30:00Z",
    "lastLogin": "2026-02-10T15:20:00Z"
  }
}
```

---

#### **PUT /api/v1/admin/users/:userId**

**Purpose**: Update user details (admin)

**Authentication**: Required

**Authorization**: Admin only

**Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "status": "Active"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { /* updated user */ }
}
```

---

#### **POST /api/v1/admin/users/invite**

**Purpose**: Send invite email to new student

**Authentication**: Required

**Authorization**: Admin only

**Request Body**:
```json
{
  "email": "newstudent@example.com",
  "personalMessage": "Welcome to our program!"
}
```

**Validation**:
- email: Valid email format, not already registered

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Invite sent to newstudent@example.com"
}
```

**Business Logic**:
- Generate invitation token with short expiry (7 days)
- Send email with sign-up link: `https://frontend.com/register?inviteToken=<token>`
- Link pre-fills email in registration form
- Log this invitation action

---

#### **DELETE /api/v1/admin/users/:userId**

**Purpose**: Delete user account (permanent)

**Authentication**: Required

**Authorization**: Admin only

**Request Body** (confirmation):
```json
{ "confirmDelete": true }
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "User deleted permanently"
}
```

**Business Logic**:
- Delete user document
- Delete related documents: StudentProgress, QuestionProgress, MockInterviews, etc.
- Delete resume files from storage
- Cascade delete all user data

---

#### **POST /api/v1/admin/learning-paths**

**Purpose**: Create new learning topic (admin)

**Authentication**: Required

**Authorization**: Admin only

**Request Body**:
```json
{
  "week": 16,
  "topic": "Dynamic Programming",
  "description": "Master DP concepts...",
  "estimatedDurationHours": 15,
  "difficulty": "Advanced",
  "resources": [
    { "title": "DP Tutorial", "url": "https://...", "type": "article" }
  ],
  "status": "Active"
}
```

**Validation**:
- week: Unique, positive integer
- topic: Non-empty, max 100 chars
- description: Required, max 1000 chars
- difficulty: "Beginner" | "Intermediate" | "Advanced"

**Response (201 Created)**:
```json
{
  "success": true,
  "data": { /* created topic */ },
  "message": "Learning path created successfully"
}
```

---

#### **PUT /api/v1/admin/learning-paths/:topicId**

**Purpose**: Update learning topic

**Authentication**: Required

**Authorization**: Admin only

**Request Body**: Same as POST (partial update)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { /* updated topic */ }
}
```

---

#### **DELETE /api/v1/admin/learning-paths/:topicId**

**Purpose**: Delete learning topic

**Authentication**: Required

**Authorization**: Admin only

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Learning path deleted successfully"
}
```

---

#### **POST /api/v1/admin/company-questions**

**Purpose**: Create company interview question

**Authentication**: Required

**Authorization**: Admin only

**Request Body**: (See Frontend PRD for full fields)
```json
{
  "title": "Two Sum",
  "description": "Given an array of integers...",
  "company": "Amazon",
  "topics": ["Arrays", "Hash Table"],
  "difficulty": "Easy",
  "hints": "Use a hash map",
  "status": "Active"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": { /* created question */ }
}
```

---

#### **PUT /api/v1/admin/company-questions/:questionId**

**Purpose**: Update company question

**Authentication**: Required

**Authorization**: Admin only

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { /* updated question */ }
}
```

---

#### **DELETE /api/v1/admin/company-questions/:questionId**

**Purpose**: Delete company question

**Authentication**: Required

**Authorization**: Admin only

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

---

#### **POST /api/v1/admin/company-questions/bulk-upload** (Optional)

**Purpose**: Bulk import questions from CSV

**Authentication**: Required

**Authorization**: Admin only

**Content-Type**: multipart/form-data

**Form Data**:
- `file` (file): CSV file with columns: title, description, company, topics, difficulty, hints

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "imported": 45,
    "failed": 2,
    "errors": [
      { "row": 15, "error": "Invalid company" }
    ]
  }
}
```

---

## 5. BUSINESS LOGIC & CALCULATIONS

### 5.1 Study Streak Calculation

**Rules**:
- Streak increments when user has activity on consecutive calendar days
- Activity = solving question OR completing task OR ≥10 min study session
- Minimum daily activity: ≥10 minutes of study session OR ≥1 question solved/task completed

**Algorithm**:
```javascript
function calculateStreak(studentId) {
  const today = new Date().setHours(0, 0, 0, 0);
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const activity = await StudyActivity.findOne({
      studentId,
      activityDate: { $gte: currentDate, $lt: new Date(currentDate.getTime() + 86400000) }
    });
    
    if (!activity || activity.durationMinutes < 10) break; // No consecutive activity
    
    streak++;
    currentDate = new Date(currentDate.getTime() - 86400000); // Previous day
  }
  
  return streak;
}
```

---

### 5.2 Progress Percentage Calculation

**Formula**:
```
progressPercentage = (completedWeeks / totalWeeks) * 100

OR (Configurable Formula):

progressPercentage = 
  (completedWeeks / totalWeeks) * 0.40 +
  (questionsSolved / totalQuestionsInBank) * 0.40 +
  (mockInterviewsCount / targetInterviews) * 0.20

Where:
- totalWeeks = 52 (full program)
- totalQuestionsInBank = 3000 (estimated)
- targetInterviews = 20 (for full progress)
```

**Caching**:
- Recalculate on:
  - Topic completion
  - Question solved
  - Mock interview recorded
- Cache result in StudentProfile or StudentProgress collection with expiry of 1 hour

---

### 5.3 Leaderboard Scoring Formula

**Overall Score** (normalized):
```
overallScore = (progressPercentage × 0.50) + 
               (normalizedQuestionsSolved × 0.30) +  
               (avgMockScore × 0.20)

Where:
- progressPercentage: 0-100 (weighted 50%)
- normalizedQuestionsSolved: (studentQuestions / maxQuestions) × 100 
  - Example if max = 250 solved by top student: 
    - Student with 100 solved = (100/250) × 100 = 40 points
- avgMockScore: 0-100 average of all mock interviews (weighted 20%)
```

**Example Calculation**:
```
Student A:
- progressPercentage = 95
- questionsSolved = 200 (normalized to 80 out of 100)
- avgMockScore = 85
- Overall = (95 × 0.50) + (80 × 0.30) + (85 × 0.20)
          = 47.5 + 24 + 17 = 88.5 points (ranks 1st out of 5000)

Student B:
- progressPercentage = 80
- questionsSolved = 150 (normalized to 60 out of 100)
- avgMockScore = 75
- Overall = (80 × 0.50) + (60 × 0.30) + (75 × 0.20)
          = 40 + 18 + 15 = 73 points (ranks 150th)
```

---

### 5.4 Resume Visibility

**Rules**:
- Resumes are viewable by all authenticated students
- Only owner and admin can edit/delete/set-active
- When resumeFetch endpoint: return all resumes for any student

---

### 5.5 Notes Visibility

**Private Notes**:
- Only visible to owner (studentId match)
- Not visible in public queries

**Public Notes**:
- Visible to all authenticated students
- View count increments each time a different student views
- Cannot be edited by others, only owner can edit/delete

---

## 6. AUTHENTICATION & AUTHORIZATION

### 6.1 JWT Token Flow

**Token Generation**:
1. User logs in successfully
2. Server creates JWT payload: `{ id, email, role, iat, exp }`
3. Server signs token with secret: `JWT_SECRET` from .env
4. Client receives token and stores in localStorage

**Token Usage**:
1. Client includes token in Authorization header: `Authorization: Bearer <token>`
2. Server middleware `authMiddleware` extracts and verifies token
3. If valid, attach user data to `req.user`
4. If invalid/expired, return 401 Unauthorized

**Token Expiry**:
- Access token: 1 hour
- Refresh token strategy (optional for v1): Not implemented

---

### 6.2 Authorization Levels

**No Authentication Required**:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

**Student Authentication Required**:
- All `/api/v1/students/:id/*` endpoints
- Student can only access own data (/:id = req.user.id)

**Admin Authentication + Authorization Required**:
- All `/api/v1/admin/*` endpoints
- Check `req.user.role === 'admin'`
- Return 403 Forbidden if not admin

**Public Data** (Authenticated users):
- Public notes visible to all students
- Resumes visible to all students
- Leaderboard visible to all students

---

### 6.3 Role-Based Access Control (RBAC)

**Student Role**:
- Can view own data
- Can view other students' public data (notes, resumes, profiles)
- Can update own profile, password, preferences
- Cannot access admin endpoints
- Cannot modify learning paths or questions

**Admin Role**:
- Can view all user data
- Can create/update/delete learning paths
- Can create/update/delete company questions
- Can manage user accounts
- Can view analytics and system metrics

---

## 7. ERROR HANDLING

### 7.1 Standard Error Response Format

```json
{
  "success": false,
  "error": "User-friendly error message",
  "errorCode": "MACHINE_READABLE_CODE",
  "timestamp": "2026-02-10T10:30:00Z"
}
```

### 7.2 HTTP Status Codes

| Status | Use Case | Example |
|--------|----------|---------|
| 200 OK | Successful GET, PUT | Fetch user, update profile |
| 201 Created | Successful POST | Create note, upload resume |
| 400 Bad Request | Validation error | Invalid email format |
| 401 Unauthorized | Missing/invalid token | Token expired, not provided |
| 403 Forbidden | No permission | Student accessing admin endpoint |
| 404 Not Found | Resource not found | Question ID doesn't exist |
| 409 Conflict | Duplicate/constraint violation | Email already exists |
| 500 Internal Server Error | Server error | Database connection failed |
| 429 Too Many Requests | Rate limited | Too many login attempts |

### 7.3 Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| AUTH_FAILED | 401 | Login failure, wrong password |
| TOKEN_EXPIRED | 401 | JWT token expired |
| TOKEN_INVALID | 401 | JWT token malformed |
| UNAUTHORIZED | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource doesn't exist |
| EMAIL_EXISTS | 409 | Email already registered |
| PASSWORD_INVALID | 400 | Password doesn't meet requirements |
| VALIDATION_ERROR | 400 | Request data invalid |
| RATE_LIMIT | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

### 7.4 Logging

**Log all**:
- API requests (method, endpoint, timestamp)
- User actions (login, logout, resource creation)
- Errors (stack trace, error message, context)
- Admin actions (user deletion, content modification)

**Log Rotation**:
- Daily rotation
- Retention: 30 days
- Format: JSON for easy parsing

---

## 8. VALIDATION RULES

### 8.1 Common Validations

**Email**:
- Valid email format: RFC 5322
- Lowercase before storing
- Unique in Users collection

**Password**:
- Min 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character (!@#$%^&*)

**Name**:
- Min 2, max 100 characters
- Alphanumeric + spaces, hyphens, apostrophes
- No SQL injection attempts

**URL**:
- Valid URL format
- Starts with http:// or https://
- Max 2000 characters

**Date**:
- Valid ISO 8601 format
- Cannot be in future (for past events)

---

## 9. BACKEND FOLDER STRUCTURE

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection setup
│   │   ├── environment.js       # Load .env variables
│   │   └── constants.js         # App constants
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── learningPathController.js
│   │   ├── questionController.js
│   │   ├── interviewController.js
│   │   ├── resumeController.js
│   │   ├── noteController.js
│   │   ├── leaderboardController.js
│   │   ├── codingProfileController.js
│   │   └── adminController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── roleMiddleware.js     # RBAC check
│   │   ├── validationMiddleware.js # Request validation
│   │   ├── errorHandler.js       # Global error handler
│   │   └── cors.js               # CORS configuration
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── LearningPath.js
│   │   ├── CompanyQuestion.js
│   │   ├── StudentProgress.js
│   │   ├── QuestionProgress.js
│   │   ├── StudyActivity.js
│   │   ├── MockInterview.js
│   │   ├── Resume.js
│   │   ├── Note.js
│   │   ├── CodingProfile.js
│   │   └── Company.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── adminRoutes.js
│   │   └── index.js              # Router aggregator
│   ├── services/
│   │   ├── authService.js        # Auth logic
│   │   ├── userService.js
│   │   ├── progressService.js    # Calculate progress
│   │   ├── leaderboardService.js # Ranking logic
│   │   ├── streakService.js      # Streak calculation
│   │   ├── resumeService.js      # File handling
│   │   └── emailService.js       # Send emails
│   ├── utils/
│   │   ├── validators.js         # Validation functions
│   │   ├── formatters.js         # Format responses
│   │   ├── errorHandler.js       # Error utilities
│   │   ├── jwt.js                # JWT utilities
│   │   └── logger.js             # Logging utility
│   ├── migrations/
│   │   ├── 001-initial-schema.js # Initial collections
│   │   └── 002-add-indexes.js    # Create indexes
│   └── app.js                    # Express app setup
├── tests/
│   ├── unit/                     # Unit tests for services
│   ├── integration/              # API integration tests
│   └── fixtures/                 # Test data
├── uploads/                      # Resume file storage (local)
├── logs/                         # Rotated log files
├── .env.example
├── .gitignore
├── package.json
├── server.js                     # Entry point
└── README.md
```

---

## 10. DATABASE INDEXES

**Indexes to Create**:

```javascript
// Users
Users.createIndex({ email: 1 }, { unique: true });
Users.createIndex({ createdAt: -1 });
Users.createIndex({ role: 1 });

// LearningPaths
LearningPaths.createIndex({ week: 1 }, { unique: true });
LearningPaths.createIndex({ status: 1 });

// CompanyQuestions
CompanyQuestions.createIndex({ company: 1 });
CompanyQuestions.createIndex({ difficulty: 1 });
CompanyQuestions.createIndex({ topics: 1 });
CompanyQuestions.createIndex({ solvedCount: -1 });
CompanyQuestions.createIndex({ status: 1 });
CompanyQuestions.createIndex({ createdAt: -1 });

// StudentProgress
StudentProgress.createIndex({ studentId: 1, weekId: 1 }, { unique: true });
StudentProgress.createIndex({ studentId: 1 });
StudentProgress.createIndex({ status: 1 });

// QuestionProgress
QuestionProgress.createIndex({ studentId: 1, questionId: 1 }, { unique: true });
QuestionProgress.createIndex({ studentId: 1 });
QuestionProgress.createIndex({ isSolved: 1 });
QuestionProgress.createIndex({ isBookmarked: 1 });
QuestionProgress.createIndex({ solvedDate: -1 });

// StudyActivity
StudyActivity.createIndex({ studentId: 1, activityDate: 1 }, { unique: true });
StudyActivity.createIndex({ studentId: 1 });
StudyActivity.createIndex({ activityDate: -1 });

// MockInterviews
MockInterviews.createIndex({ studentId: 1 });
MockInterviews.createIndex({ company: 1 });
MockInterviews.createIndex({ score: -1 });
MockInterviews.createIndex({ interviewDate: -1 });

// Resumes
Resumes.createIndex({ studentId: 1 });
Resumes.createIndex({ isActive: 1 });
Resumes.createIndex({ studentId: 1, isActive: 1 }, { unique: true, sparse: true });

// Notes
Notes.createIndex({ studentId: 1 });
Notes.createIndex({ visibility: 1 });
Notes.createIndex({ createdAt: -1 });
Notes.createIndex({ visibility: 1, createdAt: -1 });
Notes.createIndex({ topics: 1 });

// CodingProfiles
CodingProfiles.createIndex({ studentId: 1, platform: 1 }, { unique: true });
CodingProfiles.createIndex({ studentId: 1 });
```

---

## 11. DEPLOYMENT CHECKLIST

**Pre-Deployment**:
- [ ] Environment variables configured (.env)
- [ ] MongoDB connection tested
- [ ] All API endpoints tested with Postman/Insomnia
- [ ] Authentication flow tested
- [ ] Role-based access control verified
- [ ] Error handling implemented for all endpoints
- [ ] Input validation on all user data
- [ ] Password hashing with bcrypt confirmed
- [ ] JWT token expiry configured
- [ ] Database indexes created
- [ ] Initial data seeding (companies, learning paths, sample questions)
- [ ] Unit tests passing (services, utilities)
- [ ] Integration tests passing (API flows)
- [ ] Rate limiting configured (optional for v1)
- [ ] Logging configured (local files)
- [ ] CORS configuration verified

**Deployment**:
- [ ] Build: Source code ready
- [ ] Server: Deploy to AWS EC2 / Heroku / Docker
- [ ] Database: MongoDB Atlas cluster configured
- [ ] Environment: Set production API URL, JWT_SECRET, DB connection
- [ ] SSL/TLS: Enable HTTPS
- [ ] Domain: Configure custom domain
- [ ] CDN: Configure for static assets (optional)
- [ ] Email Service: Nodemailer / SendGrid configured for password reset
- [ ] File Storage: S3 or local `/uploads/` for resumes
- [ ] Monitoring: Set up logging/alerting (Sentry, Datadog)
- [ ] Backup: Database backup strategy

---

## APPENDIX A: Environment Variables Template

**`.env` File **:
```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/placement_tracker
MONGODB_PROD_URI=mongodb+srv://user:password@cluster.mongodb.net/placement_tracker

# JWT
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRY=1h

# Email Service (Optional for v1, full in v2)
EMAIL_SERVICE=gmail
EMAIL_USER=noreply@placementtracker.com
EMAIL_PASSWORD=app_specific_password
EMAIL_FROM_NAME=Placement Tracker

# Frontend URL
FRONTEND_URL=http://localhost:3000
FRONTEND_PROD_URL=https://placementtracker.com

# File Storage
UPDATE_FILE_STORAGE=local
UPLOAD_DIR=./uploads
# OR for S3
AWS_S3_BUCKET=placement-tracker-resumes
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1

# Logging
LOG_LEVEL=debug
LOG_DIR=./logs

# Bcrypt
BCRYPT_ROUNDS=10

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

**END OF BACKEND PRD**

