# Product Requirements Document (PRD)
# Placement Preparation Tracker

**Version:** 2.0 (Production Release Synchronized)  
**Status:** Completed & Production Ready  
**Last Updated:** September 2026  
**Owner:** Technical Architecture & Product Team  

---

## Document Revision & Sync History

| Version | Date | Description of Changes | Author |
| :--- | :--- | :--- | :--- |
| **v1.0** | March 2026 | Initial draft covering basic progress tracking, 4-week roadmap, and user stories. | Product Team |
| **v2.0** | September 2026 | **Full-Stack Pre-Production Sync:**<br>• Promoted multi-language Monaco Code IDE (10 languages + Piston cloud fallback) to In-Scope.<br>• Added Multi-Platform Coding Profile Sync (LeetCode GraphQL, Codeforces, CodeChef, HackerRank).<br>• Added Student Project Portfolio with dynamic multi-file ZIP bundle exporter.<br>• Added ATS Resume Keyword Analyzer (`pdf-parse` + `mammoth`).<br>• Added Interactive Placement Quiz Engine with live timers & analytics.<br>• Added YouTube Concept Video Library & HR/STAR Behavioral Question Banks.<br>• Added Daily Task Manager with LeetCode/CodeChef link verification.<br>• Added Peer Discussion Community Forum.<br>• Synchronized all 15 Mongoose database models & 3-tier rate limiting security defenses. | Architecture & Lead TPM |

---

## 1. Executive Summary & Overview

### 1.1 Product Name
**Placement Preparation Tracker (PPT)**

### 1.2 Problem Statement
Students preparing for technical campus placements and software engineering interviews struggle with fragmented workflows across disconnected coding platforms, spreadsheets, disparate YouTube playlists, resume drafts, and unorganized notes. This leads to:
- **Lack of structured preparation** and clear milestone tracking.
- **Inconsistent study discipline** and difficulty sustaining daily momentum.
- **Scattered company-specific resources** without target difficulty benchmarks.
- **Lack of mock interview metrics** and resume ATS validation before applying.
- **Administrative blind spots** for placement cells unable to monitor batch-wide preparation readiness.

### 1.3 Solution
Placement Preparation Tracker is a unified, full-stack placement acceleration platform featuring:
1. **20-Topic Structured Learning Path** with curated patterns, memory cheat sheets, and Java reference templates.
2. **In-Browser Multi-Language Monaco Code IDE** with local process execution and Piston cloud fallback.
3. **Automated Coding Profile Sync** for LeetCode, Codeforces, CodeChef, and HackerRank.
4. **ATS Resume Keyword & Quality Analyzer** supporting PDF and DOCX uploads.
5. **Multi-File Student Project Showcase & ZIP Exporter**.
6. **Company-Tagged DSA Question Bank** (Amazon, Google, Meta, Microsoft, etc.) with bookmarks and attempt history.
7. **Mock Interview Evaluation & Scoring Suite** with radar breakdowns.
8. **Interactive Timed Quiz Module** with categorized question banks.
9. **Daily Placement Challenges** with automated submission link verification.
10. **Concept Video & HR Interview Preparation Banks** (STAR method responses).
11. **Peer Discussion Forum** with threaded discussions.
12. **Executive Admin Dashboard** with batch analytics, temporary student account provisioning, and security audit logs.

---

## 2. Goals & Product Scope

### 2.1 Goals (In-Scope — 100% Implemented)
- [x] **Centralized Placement Workspace:** Single hub for learning paths, coding, mock interviews, resumes, and projects.
- [x] **20-Topic DSA & System Design Curriculum:** Step-by-step progress tracking across all foundational DSA topics.
- [x] **Live Multi-Language Code Sandbox:** In-browser code runner supporting Java, Python, C, C++, JavaScript, TypeScript, C#, Go, Rust, and Kotlin.
- [x] **Profile & Social Synchronization:** Live statistic fetching for LeetCode, Codeforces, CodeChef, and HackerRank handles.
- [x] **ATS Resume Intelligence:** Automated scoring on contact details, action verbs, measurable impact, and tech keywords.
- [x] **Project Portfolio & Bundle Exporter:** Upload multi-file codebases and export ZIP packages on-demand.
- [x] **Daily Habit & Streak Engine:** Automated streak calculation based on daily study session activity logs.
- [x] **Role-Based Security & Governance:** Robust JWT-based RBAC with dedicated student and admin portals, 3-tier rate limiting, and security audit logs.

### 2.2 Future Roadmap (v2.1+)
- Direct OAuth2 Social Logins (Google / GitHub).
- Real-Time WebSocket Video Mock Interview Rooms.
- AI-Powered Customized Question Recommendation Engine.

---

## 3. System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Client Layer (Port 5173)                             │
│       React 19.2 + Vite 7.3 + TailwindCSS 4.2 + Redux Toolkit + Monaco Editor   │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ REST API (JSON / Multipart Form-Data)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Server Layer (Port 5000)                             │
│          Node.js (v24+) + Express 4.18 + Mongoose 7.0 + Multer + Nodemailer     │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│    Security & Rate Limiting Engine    │      Multi-Language Compiler Sandbox    │
│  - Auth Rate Limiter (20 req/15m)     │  - Local Process Spawner (spawn/exec)   │
│  - Reset Rate Limiter (5 req/15m)     │  - Piston Cloud Sandbox Fallback API    │
│  - Code Exec Rate Limiter (15 req/1m) │  - GCC/Clang, Javac, Python, Go, Rust   │
│  - Admin Rate Limiter (120 req/15m)   │  - Temporary Directory Sandbox Isolation│
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ Mongoose ODM
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Database Layer (Port 27017)                          │
│          MongoDB Community / Atlas (15 Indexed Schemas & Automated Seeders)     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. User Roles & RBAC Matrix

| Feature / Resource | Student Role | Admin Role | Security & Access Rule |
| :--- | :---: | :---: | :--- |
| **Authentication & Password Reset** | ✅ Full Access | ✅ Full Access | Rate-limited public endpoints; JWT token verification. |
| **Personal Dashboard & Streak** | ✅ Own Data | ✅ Any Student | Student restricted to own ID; Admin unrestricted. |
| **20-Topic Learning Roadmap** | ✅ Full Access | ✅ Edit/Manage | Students update progress; Admin manages topics & templates. |
| **Monaco Code IDE & Execution** | ✅ Full Access | ✅ Full Access | Rate-limited (15/min); sandboxed temp folder execution. |
| **Company Questions Bank** | ✅ Solve/Bookmark | ✅ CRUD Questions | Admin curates test cases, hints, and supported languages. |
| **Daily Tasks & Link Validator** | ✅ Submit & Verify | ✅ CRUD Tasks | Server-side URL pattern & reachability verification. |
| **Concept Videos & HR Question Banks** | ✅ View & Study | ✅ CRUD Content | Embedded YouTube curation & STAR answer curation. |
| **Mock Interview Performance** | ✅ View Own Stats | ✅ Log/Score/Manage | Admin grades performance across Rubric (0–100). |
| **Resume ATS Review & Download** | ✅ Own Resumes | ✅ Full Access | 5MB upload cap, MIME validation, keyword analysis. |
| **Student Project Portfolio & ZIP** | ✅ Own Projects | ✅ Full Access | Multi-file upload (up to 200 files), on-the-fly ZIP generation. |
| **Markdown Notes Workspace** | ✅ CRUD Notes | ✅ Admin Moderation | Private vs Public visibility; XSS-safe text rendering. |
| **Discussion Community Forum** | ✅ Post & Reply | ✅ Admin Moderation | Threaded message hierarchy with cascade deletion. |
| **Coding Profile Platform Sync** | ✅ Link & Sync | ✅ Admin Manage | Asynchronous external API sync (LeetCode, CF, CC, HR). |
| **Leaderboard & Global Ranks** | ✅ View Ranks | ✅ Full Access | Aggregated score (50% progress, 30% questions, 20% mock). |
| **User Management & Audit Logs** | ❌ Forbidden | ✅ Full Access | Protected by `roleMiddleware(['admin'])` + `adminRateLimit`. |

---

## 5. Detailed Functional Specifications

### 5.1 Authentication & Security (`/api/v1/auth`)
- **User Registration:** Name, valid email, strong password (min 8 chars, 1 uppercase, 1 special char). Auto-assigns `student` role.
- **Login Flow:** Returns signed JWT (1-hour expiry) with user profile object (excludes password and reset tokens).
- **Password Reset Pipeline:** 15-minute expiration single-use JWT reset link dispatched via Gmail/SMTP (`nodemailer`). Tokens stored as SHA-256 hashes in MongoDB with `{ select: false }`.
- **Abuse Prevention:** `authRateLimit` (20 req/15m) and `passwordResetRateLimit` (5 req/15m).

### 5.2 20-Topic Structured Learning Path (`/api/v1/learning-paths`)
- **Pre-Seeded Curriculum:** 20 core topics covering Arrays, Linked Lists, Stacks, Queues, Trees, BST, Heaps, Graphs, Dynamic Programming, Greedy Algorithms, Recursion, Backtracking, Trie, Segment Trees, Bit Manipulation, Sliding Window, Two Pointer, Binary Search, System Design Basics, and Concurrency Basics.
- **Rich Educational Resources:** Each topic includes algorithmic overviews, visual memory cheat sheets, edge case traps, interview strategies, and Java pattern implementations.
- **Progress Tracking:** Problem checklists per topic recalculate student completion percentages dynamically.

### 5.3 Multi-Language Monaco Code IDE (`/api/v1/practice`)
- **Supported Languages:** Java, Python, JavaScript, TypeScript, C, C++, C#, Go, Rust, and Kotlin.
- **Compiler Sandbox:** Isolated temporary directories (`mkdtemp`) with strict process timeouts (20s) and automatic file cleanup.
- **Cloud Fallback:** Seamlessly delegates execution to the Piston Cloud API when local toolchains are unavailable.
- **Execution Rate Limiting:** `codeExecutionRateLimit` limits requests to 15 runs/min per user to protect server resources.

### 5.4 Coding Profile Live Sync (`/api/v1/students/:id/coding-profiles`)
- **LeetCode:** Fetches solved counts and contest rating via official GraphQL endpoint.
- **Codeforces:** Queries `user.info` and `user.status` APIs to parse unique accepted submissions and rating.
- **CodeChef:** Extracts rating and verified solved problem metrics.
- **HackerRank:** Fetches challenges solved and badge scores via hacker REST API.
- **Auto-Sync:** Lazy background synchronization triggers on profile view.

### 5.5 Resume ATS Reviewer (`/api/v1/students/:id/resumes`)
- **File Management:** Supports PDF and DOCX uploads (up to 5MB) with active resume toggling.
- **Automated ATS Parser:** Analyzes extracted plain text via `pdf-parse` and `mammoth` across:
  - Contact details (email, phone, LinkedIn/GitHub links).
  - Essential resume sections (Summary, Skills, Experience, Projects, Education).
  - Action verb density, quantifiable impact metrics, and target technical keywords.
  - Generates comprehensive ATS score (0–100) with actionable improvement suggestions.

### 5.6 Student Project Portfolio & ZIP Exporter (`/api/v1/students/:id/projects`)
- **Multi-File Uploads:** Upload up to 200 project source files (5MB folder cap).
- **Interactive Code Inspector:** In-browser file tree navigation with syntax-highlighted previews.
- **ZIP Bundle Download:** Server-side streaming ZIP compilation via `archiver` with path sanitization against Zip-Slip attacks.

### 5.7 Mock Interview Suite (`/api/v1/students/:id/mock-interviews`)
- **Session Evaluation:** Records company, interview date, total score (0–100), duration, interviewer name, and specific qualitative feedback.
- **Rubric Dimensions:** Technical Skills, Communication, Problem Solving, and Actionable Areas for Improvement.
- **Performance Analytics:** Historical trends, company-specific score distributions, and radar metrics.

### 5.8 Daily Tasks & Submission Validation (`/api/v1/admin/daily-tasks`)
- **Daily Challenges:** Curated problems with external practice URLs (LeetCode, CodeChef, GeeksforGeeks), company tags, and estimated completion time.
- **Link Validator:** Client/server verification validating accepted submission URLs with problem slug matching.

### 5.9 Timed Quiz Engine (`frontend/src/pages/QuizPage.jsx`)
- **Interactive Quizzes:** Multi-category placement quizzes with real-time countdown timer, question navigation grid, instant scoring, and comprehensive answer review.

### 5.10 Peer Discussion Forum (`/api/v1/forum/messages`)
- **Community Chat:** Threaded discussion boards with parent-child message relationships, author badges, and administrator moderation.

### 5.11 Admin Management & Security Audit Logging (`/api/v1/admin/*`)
- **Batch User Management:** Create student accounts with auto-generated temporary passwords (`mustResetPassword: true`), edit profiles, or perform permanent cascade deletion.
- **Cascade Deletion:** Full cleanup removes student progress, question progress, mock interviews, notes, activities, coding profiles, forum posts, and unlinks physical resume/project files from disk.
- **Security Audit Logger:** Server-side audit logging for administrative mutations with IP tracking and timestamps.

---

## 6. Complete Database Schema Reference (15 Models)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │  LearningPath   │       │ CompanyQuestion │
│─────────────────│       │─────────────────│       │─────────────────│
│ _id             │◄──┐   │ _id             │◄──┐   │ _id             │◄──┐
│ name            │   │   │ topic           │   │   │ title           │   │
│ email           │   │   │ week            │   │   │ company         │   │
│ password        │   │   │ overview        │   │   │ difficulty      │   │
│ role            │   │   │ problems        │   │   │ description     │   │
│ mustResetPassword│  │   │ javaExample     │   │   │ testCases       │   │
│ githubProfile   │   │   │ memorySheet     │   │   └────────┬────────┘   │
│ linkedinProfile │   │   └────────┬────────┘   │            │            │
└────────┬────────┘   │            │            │            │            │
         │            │            │            │            │            │
         ├────────────┼────────────┼────────────┼────────────┘            │
         │            │            │            │                         │
         ▼            │            ▼            │                         │
┌─────────────────┐   │   ┌─────────────────┐   │   ┌─────────────────┐   │
│ StudentProgress │   │   │QuestionProgress │   │   │  MockInterview  │   │
│─────────────────│   │   │─────────────────│   │   │─────────────────│   │
│ studentId (ref) ├───┘   │ studentId (ref) ├───┤   │ studentId (ref) ├───┤
│ topicId (ref)   ├───────┘ questionId (ref)├───┴───┤ company         │   │
│ completionPct   │       │ isSolved        │       │ score (0-100)   │   │
│ completedIndexes│       │ isBookmarked    │       │ overallFeedback │   │
└─────────────────┘       └─────────────────┘       └─────────────────┘   │
         │                                                                │
         ├────────────────────────────────────────────────────────────────┤
         │            │            │            │            │            │
         ▼            ▼            ▼            ▼            ▼            ▼
┌─────────────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│     Resume      │ │StudentProj│ │   Note    │ │CodingProf │ │StudyActiv │ │ForumMessg │
│─────────────────│ │───────────│ │───────────│ │───────────│ │───────────│ │───────────│
│ studentId (ref) │ │studentId  │ │studentId  │ │studentId  │ │studentId  │ │userId(ref)│
│ filePath        │ │files[]    │ │title      │ │platform   │ │activityTyp│ │message    │
│ isActive        │ │totalSize  │ │content    │ │problemsSlv│ │durationMin│ │parentMsgId│
│ atsScore        │ │uploadDate │ │visibility │ │lastSynced │ │date       │ │created_at │
└─────────────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘
```

1. **`User`**: Core user accounts with role, bio, university, graduation year, links, and hashed reset tokens.
2. **`LearningPath`**: 20 DSA/System Design roadmap topics with code examples and memory sheets.
3. **`CompanyQuestion`**: Company-tagged DSA problems with difficulty, topics, constraints, and test cases.
4. **`StudentProgress`**: Progress records per topic/week with completed problem indices and notes.
5. **`QuestionProgress`**: Problem-level tracking (isSolved, isBookmarked, attemptCount, solvedDate).
6. **`MockInterview`**: Mock interview scoring, feedback, ratings, and interviewer metadata.
7. **`Resume`**: Resumes with physical paths, active flag, custom names, and ATS ratings.
8. **`StudentProject`**: Multi-file project portfolios with sanitized relative file paths and sizes.
9. **`Note`**: Personal study notes with Public/Private visibility and Markdown support.
10. **`DailyTask`**: Daily challenges with platform metadata and practice links.
11. **`ConceptVideo`**: Curated YouTube educational videos mapped to DSA topics and levels.
12. **`HRInterviewQuestion`**: Behavioral questions with STAR model answers and tips.
13. **`CodingProfile`**: External coding platform handles, problem counts, ratings, and sync status.
14. **`StudyActivity`**: Daily study activity logs powering the study streak engine.
15. **`ForumMessage`**: Peer discussion messages with threaded reply relationships.

---

## 7. Complete API Route Catalog

### 7.1 Public & Authentication Routes (`/api/v1/auth`)
- `POST /register` — Student account registration (`authRateLimit`).
- `POST /login` — User authentication returning JWT (`authRateLimit`).
- `POST /forgot-password` — Generates 15-min reset link via email (`passwordResetRateLimit`).
- `POST /reset-password` — Verifies hashed token & sets new password (`passwordResetRateLimit`).
- `POST /logout` — Client session invalidation.

### 7.2 Protected Student & Preparation Routes (`/api/v1`)
- **Dashboard & Streaks:**
  - `GET /students/:id/progress` — Dashboard summary metrics.
  - `GET /students/:id/streak` — Current study streak count.
  - `GET /students/:id/activity` — Today's activity log summary.
  - `POST /students/:id/activity` — Log today's study activity.
  - `GET /students/:id/learning-path` — Current active topic and next topic.
  - `GET /students/:id/public-overview` — Public student profile metrics.
- **Profiles & Links:**
  - `GET /students/:id/profile` & `PUT /students/:id/profile` — Profile management.
  - `POST /students/:id/profile/avatar` — Upload avatar image.
  - `POST /students/:id/change-password` — Update account password.
  - `GET /students/:id/profiles` & `PUT /students/:id/profiles` — Social links.
- **Learning Paths:**
  - `GET /learning-paths` — Retrieve all 20 roadmap topics with user progress.
  - `GET /learning-paths/:weekId` — Single topic detail with code patterns.
  - `GET /students/:id/learning-progress` — Overall roadmap completion overview.
  - `POST /students/:id/learning-progress/:weekId` — Update problem completion state.
- **Company Questions & Code Execution Sandbox:**
  - `GET /company-questions` — Filterable questions (company, difficulty, topic).
  - `GET /company-questions/:questionId` — Problem description and test cases.
  - `POST /company-questions/:questionId/mark-solved` — Mark question solved.
  - `POST /company-questions/:questionId/bookmark` — Toggle question bookmark.
  - `GET /practice/toolchains` — Probe available server compilers.
  - `POST /practice/run-code` — Compile & execute code (`codeExecutionRateLimit`).
  - `POST /practice/submit-code` — Submit code & mark attempt (`codeExecutionRateLimit`).
  - `POST /practice/validate-submission-link` — Verify external accepted link.
- **Mock Interviews:**
  - `GET /students/:id/mock-interviews` — List mock interview records.
  - `GET /students/:id/mock-interviews/statistics` — Radar & historical stats.
  - `POST /students/:id/mock-interviews` — Record new mock interview.
- **Resumes & ATS Reviewer:**
  - `POST /students/:id/resumes/upload` — Upload PDF/DOCX resume (max 5MB).
  - `GET /students/:id/resumes` — List uploaded resumes.
  - `PUT /students/:id/resumes/:resumeId/set-active` — Set active resume.
  - `GET /students/:id/resumes/:resumeId/review` — Run ATS keyword analysis.
  - `GET /students/:id/resumes/:resumeId/download` — Download resume file.
  - `DELETE /students/:id/resumes/:resumeId` — Delete resume & unlink file.
- **Student Projects & ZIP Exporter:**
  - `POST /students/:id/projects/upload` — Multi-file project upload (max 200 files).
  - `GET /students/:id/projects` — List student projects.
  - `GET /students/:id/projects/:projectId` — Project file tree & code preview.
  - `GET /students/:id/projects/:projectId/download` — Download project `.zip` bundle.
  - `DELETE /students/:id/projects/:projectId` — Delete project & unlink files.
- **Coding Profiles:**
  - `GET /students/:id/coding-profiles` — List linked coding handles.
  - `POST /students/:id/coding-profiles` — Link handle & perform initial sync.
  - `PUT /students/:id/coding-profiles/:platformId` — Refresh stats from external API.
  - `DELETE /students/:id/coding-profiles/:platformId` — Unlink profile.
- **Notes, Leaderboard & Forum:**
  - `GET /students/:id/notes` & `POST /students/:id/notes` — Markdown notes.
  - `GET /leaderboard` & `GET /leaderboard/my-rank/:studentId` — Global rankings.
  - `GET /forum/messages` & `POST /forum/messages` — Threaded peer discussion.

### 7.3 Admin Management Routes (`/api/v1/admin/*` — Rate Limited)
- `GET /admin/dashboard/stats` & `GET /admin/analytics` — Executive batch analytics.
- `GET /admin/users`, `POST /admin/users`, `PUT /admin/users/:userId`, `DELETE /admin/users/:userId` — Full student lifecycle & cascade deletion.
- `POST /admin/learning-paths`, `PUT /admin/learning-paths/:topicId`, `DELETE /admin/learning-paths/:topicId` — Roadmap curation.
- `POST /admin/company-questions`, `PUT /admin/company-questions/:questionId`, `DELETE /admin/company-questions/:questionId` — Questions bank.
- `GET /admin/daily-tasks`, `POST /admin/daily-tasks`, `PUT /admin/daily-tasks/:taskId`, `DELETE /admin/daily-tasks/:taskId` — Daily tasks.
- `GET /admin/concept-videos`, `POST /admin/concept-videos`, `PUT /admin/concept-videos/:videoId`, `DELETE /admin/concept-videos/:videoId` — YouTube library.
- `GET /admin/hr-interview-questions`, `POST /admin/hr-interview-questions`, `PUT /admin/hr-interview-questions/:questionId` — HR interview bank.
- `GET /admin/mock-interviews`, `POST /admin/mock-interviews`, `PUT /admin/mock-interviews/:interviewId` — Batch mock interview scoring.

---

## 8. Non-Functional & Security Requirements

| Dimension | Specification | Verification Result |
| :--- | :--- | :--- |
| **Response Times** | Sub-200ms API response for cached & indexed queries; sub-2s page transitions. | Verified via Vite bundle optimization and indexed MongoDB lookups. |
| **Rate Limiting** | Multi-tiered limits protecting Auth (20/15m), Reset (5/15m), Code Runner (15/min), and Admin (120/15m). | Enforced via `express-rate-limit` middleware. |
| **Data Privacy** | Passwords hashed with Bcrypt (10 salt rounds); reset tokens hashed with SHA-256 and `{ select: false }`. | Password and reset tokens hidden from all JSON outputs and queries. |
| **Sandbox Safety** | Isolated temp execution folders, sanitization of relative paths, and cloud runner fallback. | Tested against path traversal and CPU starvation. |
| **Cascade Integrity** | Deleting users or learning paths automatically cleans up child documents and deletes physical disk files. | Implemented and verified in `adminController.js`. |
| **Build Stability** | Clean production build bundle with zero compiler/transpiler errors. | `vite build` passes in 2.38s. |