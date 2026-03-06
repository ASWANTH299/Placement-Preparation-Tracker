# PLACEMENT PREPARATION TRACKER - FRONTEND PRD
## Version 1.0 | FAANG-Quality Implementation Guide

---

## 1. EXECUTIVE SUMMARY

This document specifies all frontend requirements for the Placement Preparation Tracker platform. It is an implementation-ready guide for React/Vite developers covering UI components, pages, interactions, APIs, and architecture.

**Frontend Stack**: React 18+, Vite, React Router v6, TailwindCSS (or Material-UI)

**Supported Browsers**: Chrome (latest), Firefox (latest), Safari (latest), Edge (latest)

**Responsive Breakpoints**: Mobile (320px), Tablet (768px), Desktop (1024px+)

---

## 2. AUTHENTICATION PAGES

### 2.1 Register Page (`/register`)

**Purpose**: Allow new students to create an account.

**Page Layout**:
- Centered form container (max-width: 500px)
- Header: "Create Your Account"
- Form fields (below)
- Footer: "Already have an account? Login here" (link to `/login`)

**Form Fields**:
| Field | Type | Validation | Constraint |
|-------|------|-----------|-----------|
| Full Name | Text Input | Non-empty, 2-100 chars | Required |
| Email | Email Input | Valid email format, unique | Required |
| Password | Password Input | Min 8 chars, uppercase, lowercase, number, special char | Required |
| Confirm Password | Password Input | Must match password field | Required |
| Role | Dropdown | Fixed: "Student" | Pre-selected, non-editable |

**Buttons**:
- **Register** (Primary) - Submit form
- **Sign up with Google** (Optional) - OAuth integration
- **Sign up with GitHub** (Optional) - OAuth integration

**Form Validation & Error Handling**:
- Real-time email uniqueness check (debounced 500ms API call)
- Password strength indicator (visual bar: Red → Orange → Yellow → Green)
- Password mismatch error message
- Display all validation errors below respective fields
- Disable Register button while submitting
- Show loading spinner during submission
- Error toast notification on API failure (persist for 5 seconds)
- Success toast notification on registration completion
- Auto-redirect to `/login` after successful registration (2-second delay for UX)

**UI States**:
- **Normal**: All fields enabled, Register button enabled
- **Loading**: Inputs disabled, loading spinner in button, "Registering..."
- **Success**: Toast message, redirect after delay
- **Error**: Error messages below fields, inline error styling (red border)

**Responsive**:
- Mobile: Full-width form with 16px padding
- Tablet+: Centered 500px form container

---

### 2.2 Login Page (`/login`)

**Purpose**: Authenticate existing students and administrators.

**Page Layout**:
- Centered form container (max-width: 500px)
- Header: "Welcome Back"
- Form fields
- Footer: "Don't have an account? Register here" (link to `/register`)

**Form Fields**:
| Field | Type | Validation | Constraint |
|-------|------|-----------|-----------|
| Email | Email Input | Valid email format | Required |
| Password | Password Input | Non-empty | Required |
| Remember Me | Checkbox | Boolean | Optional, default unchecked |

**Buttons**:
- **Login** (Primary) - Submit form
- **Forgot Password?** (Link) - Navigate to password reset flow

**Form Validation & Error Handling**:
- Disable Login button while submitting
- Show loading spinner: "Logging in..."
- On API 401/403: Display error message "Invalid email or password"
- On API error: Display generic error message with retry option
- On success: Store JWT token in localStorage and redirect based on role:
  - **Student** → `/dashboard`
  - **Admin** → `/admin-dashboard`
- Remember Me: If checked, persist email in localStorage (non-sensitive data only)

**UI States**:
- **Normal**: All fields enabled, Login button enabled
- **Loading**: Inputs disabled, loading spinner in button
- **Error**: Error message displayed prominently, retry option

**Responsive**:
- Mobile: Full-width form with 16px padding
- Tablet+: Centered 500px form container

---

### 2.3 Password Reset Flow

**Page 1: Email Input (`/forgot-password`)**
- Single email input field
- Validation: Valid email format
- Button: "Send Reset Link"
- Error message if email not found
- Success: "Check your email for reset instructions"

**Page 2: Reset Password (`/reset-password?token=<TOKEN>`)**
- New Password field (with strength indicator)
- Confirm Password field
- Validation: Match, min 8 chars, complexity requirements
- Button: "Reset Password"
- On success: Redirect to `/login` with success message

---

## 3. STUDENT DASHBOARD

### 3.1 Dashboard Page (`/dashboard`)

**Purpose**: Central hub showing preparation progress, activities, and quick navigation.

**Navbar**:
- Logo/Platform name (left)
- Navigation menu:
  - Dashboard
  - Learning Path
  - Company Questions
  - Practice
  - Resume Tracker
  - Notes
  - Leaderboard
  - Coding Profiles
- User profile dropdown (right):
  - Profile
  - Settings
  - Logout

**Main Dashboard Grid** (Responsive: 1 col mobile, 2 col tablet, 3+ col desktop):

**Card 1: Study Streak Widget**
- Display: 🔥 [Number] Day Streak
- Subtext: "Keep it going!"
- Background: Gradient (orange to red)
- Action: Shows "Last studied: [time]"
- Streak counter updates on page load

**Card 2: Progress Overview**
- Circular progress indicator (SVG) showing overall progress %
- Breakdown labels:
  - Learning Paths Completed: [X/Y]
  - Questions Solved: [X/Y]
  - Mock Interviews: [X/Y]
- Color: Green (#22c55e) when >70%, Yellow (#eab308) when 40-70%, Red (#ef4444) when <40%

**Card 3: Daily Activity**
- Bar chart or simple log of today's activities:
  - Questions solved: [count]
  - Time studied: [duration]
  - Tasks completed: [count]
- Action button: "Log Activity" (opens modal)

**Card 4: Learning Path Progress**
- Current week topic display
- Progress bar showing completion %
- Next topic preview
- Quick button: "Continue Learning"

**Card 5: Recent Mock Interviews**
- Table showing last 3 mock interviews:
  - Company | Date | Score | Feedback (truncated)
- Sortable by date (newest first)
- Action buttons: View Full, Edit, Delete
- Empty state: "No mock interviews yet. Schedule one!"

**Card 6: Quick Actions**
- Buttons grid:
  - Practice Questions
  - Record Mock Interview
  - Upload Resume
  - Add Notes
  - View Leaderboard
  - Update Coding Profiles

**Footer**: Last updated timestamp, refresh button

**API Calls Required**:
- `GET /api/v1/students/:id/progress` - Overall progress data
- `GET /api/v1/students/:id/streak` - Current streak information
- `GET /api/v1/students/:id/activity` - Today's activities
- `GET /api/v1/students/:id/learning-path` - Current learning path
- `GET /api/v1/students/:id/mock-interviews?limit=3` - Recent mock interviews

**Polling/Refresh**: Data refreshes on page load. No real-time polling for v1 (manual refresh available).

---

## 4. LEARNING PATH PAGES

### 4.1 Learning Path List Page (`/learning-path`)

**Page Layout**:
- Header: "Your Learning Journey"
- Subheader: "Complete topics week by week"

**Content**:
- Timeline view OR Card view (toggle button: List/Timeline)

**Card View**:
- Grid of cards (1 col mobile, 2 col tablet, 3+ col desktop)
- Each card represents a week:
  - **Header**: Week [N]
  - **Topic**: [Topic Name]
  - **Description**: [Description text, 100 chars max]
  - **Progress Bar**: Shows completion percentage
  - **Status Badge**: "Not Started", "In Progress", "Completed"
  - **Resources**: Optional list of resource links
  - **Button**: "Start Learning" / "Continue" / "Review"

**Timeline View**:
- Vertical timeline
- Week blocks connected by lines
- Visual indicator for completed/current/pending
- Click to expand details

**Sorting/Filtering**:
- Filter by status: All, Not Started, In Progress, Completed
- Sort by: Week (ASC, default), Difficulty
- Search box: Filter topics by name

**Features**:
- Clicking a week card navigates to `/learning-path/:weekId` (detail page)
- Progress indicator at top: "3/15 weeks completed"
- Estimated time to complete: Display total hours across all remaining topics

**API Calls**:
- `GET /api/v1/learning-paths` - All learning paths
- `GET /api/v1/students/:id/learning-progress` - Student's progress for each path

---

### 4.2 Learning Path Detail Page (`/learning-path/:weekId`)

**Page Layout**:
- Breadcrumb: Dashboard > Learning Path > Week [N]
- Header: Week [N] - [Topic Name]

**Content Sections**:

**1. Overview Card**:
- Description: Full topic description
- Estimated duration: [X hours]
- Difficulty: Beginner, Intermediate, Advanced
- Prerequisites: Links to previous topics (if any)
- Resources: List of links (articles, videos, documentation)

**2. Sub-Topics Section** (if applicable):
- Collapsible sections for each sub-topic
- Checkbox to mark sub-topic complete
- Notes input field for each sub-topic

**3. Practice Questions Section**:
- "Suggested Questions" for this topic
- Display up to 10 questions with:
  - Question ID
  - Company
  - Difficulty
  - Topics covered
  - Action buttons: "Practice", "View Solution"
- Link to full company question bank filtered by topic

**4. Study Notes Section**:
- Display student's own notes (if any)
- Button: "Add New Note"
- Notes displayed with:
  - Title
  - Content (preview, 200 chars)
  - Created/Updated date
  - Edit/Delete buttons

**Buttons/Actions**:
- **Mark Week Complete** (Primary) - Sets status to "Completed"
- **Mark In Progress** (Secondary) - Updates progress tracking
- **Add Note** - Opens modal
- **Resources** dropdown - Links to external resources

**UI States**:
- Not Started: All content visible, "Start Learning" prominent
- In Progress: Show progress percentage, "Mark Complete" button
- Completed: Visual success indicator, "Move to Next Week" suggestion

**API Calls**:
- `GET /api/v1/learning-paths/:weekId` - Topic details
- `GET /api/v1/students/:id/learning-progress/:weekId` - Student's progress
- `POST /api/v1/students/:id/learning-progress/:weekId` - Update progress
- `GET /api/v1/company-questions?topic=:topicId&limit=10` - Related questions

---

## 5. COMPANY QUESTIONS PAGES

### 5.1 Company Questions List Page (`/company-questions`)

**Page Layout**:
- Header: "Interview Question Bank"
- Filters section (sticky on scroll)
- Questions table/list

**Filters Panel** (Left sidebar on desktop, collapsible on mobile):
| Filter | Type | Options |
|--------|------|---------|
| Company | Checkbox group | List of all companies (dropdown on mobile) |
| Topic | Checkbox group | Arrays, Linked Lists, Trees, Graphs, etc. |
| Difficulty | Radio group | Easy, Medium, Hard |
| Status | Radio group | All, Solved, Not Solved, Bookmarked |
| Date Range | Picker (optional) | Filter by when question was added |

**Filter Actions**:
- Apply filters button (mobile)
- Clear all filters button
- Save filter preset button (optional)

**Questions Display**:
- Table view (desktop) OR Card view (mobile)

**Table Columns** (Desktop):
| Column | Content | Sortable |
|--------|---------|----------|
| # | Question ID | No |
| Question | Title (truncated, full on hover) | Yes (A-Z) |
| Company | Company name | Yes |
| Topic | Primary topic | Yes |
| Difficulty | Easy/Medium/Hard badge | Yes |
| User Status | ✓ Solved / ✗ Not Solved / ⭐ Bookmarked | No |
| Actions | View / Edit / Delete | No |

**Card View** (Mobile):
- Each question as a card
- Card contains: Title, Company, Topic, Difficulty, Status indicators
- Swipeable actions: View, Bookmark, Delete

**Pagination**:
- Records per page: 10, 25, 50 options
- Show total count: "1-10 of 1,245 questions"
- Navigation: Previous/Next buttons, page jump input

**Search**:
- Global search box (top of filter panel)
- Searches question titles and descriptions
- Real-time search with debounce (300ms)
- Search suggestions dropdown (if implemented)

**Quick Actions**:
- Input field: "Quick Add Question" for admins
- Export button: CSV export of filtered questions (optional)

**Empty States**:
- No filters applied: Show all questions with hint "Use filters to narrow down"
- No results: "No questions match your filters. Try adjusting filters."
- No questions in database: "Question bank empty. Check back soon!"

**API Calls**:
- `GET /api/v1/company-questions?page=1&limit=10&company=X&topic=Y&difficulty=Z` - Filtered questions
- `GET /api/v1/companies` - List of all companies (for filter dropdown)
- `GET /api/v1/topics` - List of all topics (for filter dropdown)

---

### 5.2 Company Question Detail Page (`/company-questions/:questionId`)

**Page Layout**:
- Breadcrumb: Dashboard > Company Questions > [Company] > [Question Title]
- Header with back button

**Content Sections**:

**1. Question Header Card**:
- Question title
- Company badge
- Topic badges
- Difficulty badge (with color)
- Asked by [count] students, Solved by [count] students (stats)

**2. Question Content**:
- Full problem statement (rich text)
- Example input/output (if applicable, formatted in code blocks)
- Constraints (formatted list)
- Notes (additional context)

**3. Student History Section** (if student has solved):
- Date solved: [Date]
- Time taken: [Duration]
- Approach used: Free text field
- Performance notes: Free text field
- Last reviewed: [Date]
- Attempt count: [N]

**4. Actions Panel**:
| Action | Type | Behavior |
|--------|------|----------|
| Mark as Solved | Button | Toggles status, records timestamp |
| Mark as Attempted | Button | Records attempt without solve |
| Bookmark Question | Button/Icon | Toggles bookmark status |
| View Solution Hint | Button | Shows hint (if available) |
| Add Personal Notes | Button | Opens modal to add/edit notes |
| Share | Button | Copy sharable link (optional) |
| Report Issue | Button | Opens feedback form |

**5. Related Questions Section**:
- Show 5 similar questions (same company/topic, different difficulty)
- Display as compact cards
- "View all similar questions" link

**6. Discussion Section** (Optional for v1):
- Show 5 latest comments
- Comment input field
- Nested reply support (if implemented)

**Modal: Add Personal Notes**:
- Text area: Write notes for this question
- Visibility toggle: Public / Private
- Tags: Add tags for organization
- Save button

**UI States**:
- Not solved: Emphasis on "Mark as Solved" button
- Solved: Show solution path, "Solved" badge, option to mark unsolved
- Bookmarked: Star icon filled/highlighted

**Loading States**:
- Skeleton loaders for content sections
- Loading spinner for related questions

**API Calls**:
- `GET /api/v1/company-questions/:questionId` - Question details
- `POST /api/v1/students/:id/question-progress/:questionId` - Mark solved/attempted
- `POST /api/v1/students/:id/bookmarks/:questionId` - Bookmark/unbookmark
- `GET /api/v1/company-questions?topic=X&difficulty=Y&limit=5` - Related questions
- `POST /api/v1/students/:id/notes` - Save personal notes
- `GET /api/v1/company-questions/:questionId/discussion?limit=5` - Comments (optional)

---

## 6. MOCK INTERVIEW PAGES

### 6.1 Mock Interviews List Page (`/mock-interviews`)

**Page Layout**:
- Header: "Mock Interview Tracker"
- Action button (top right): "+ Record New Interview"

**Filters** (Optional):
- Company filter (dropdown)
- Date range filter
- Score range filter
- Sort: By date (newest first), By company, By score

**Interviews Display**:
- Table view (desktop) OR List view (mobile)

**Table Columns**:
| Column | Content | Sortable |
|--------|---------|----------|
| Company | Company name | Yes |
| Date | Interview date (formatted) | Yes |
| Score | Numerical score | Yes |
| Feedback | Feedback summary (first 100 chars) | No |
| Actions | View Full / Edit / Delete | No |

**Card View** (Mobile):
- Company (prominent)
- Date
- Score with visual indicator (bar, color-coded)
- First line of feedback
- Action buttons

**Statistics Section** (Top):
- Total interviews conducted: [N]
- Average score: [X.XX]
- Best score: [X]
- Most tested company: [Company]
- Improvement trend: Arrow (↑ improving, ↓ declining, → no change)

**Empty State**:
- Icon + message: "No mock interviews yet. Schedule your first one!"
- Button: "Record Interview"

**API Calls**:
- `GET /api/v1/students/:id/mock-interviews?page=1&limit=10&company=X&dateRange=Y` - List of interviews
- `GET /api/v1/students/:id/mock-interviews/statistics` - Interview stats

---

### 6.2 Record Mock Interview Modal (`/mock-interviews/new` OR modal)

**Modal Layout**:
- Header: "Record Mock Interview"
- Form fields:
  
| Field | Type | Validation | Constraint |
|-------|------|-----------|-----------|
| Company | Dropdown | Select from predefined list | Required |
| Interview Date | Date picker | Past/current date only | Required |
| Interview Time | Time picker | Optional | Optional |
| Score | Number input | 0-100, decimal allowed | Required |
| Overall Feedback | Text area | Max 1000 chars | Required |
| Technical Skills | Text area | Max 500 chars | Optional |
| Communication | Text area | Max 500 chars | Optional |
| Problem-Solving | Text area | Max 500 chars | Optional |
| Improvements | Text area | Max 500 chars | Optional |
| Interviewer Name | Text input | Max 100 chars | Optional |

**UI Elements**:
- Star rating for score (visual alternative to number input)
- Character counters for text areas
- Validation messages below fields
- Save draft option (localStorage)

**Buttons**:
- **Save Interview** (Primary) - Submits form
- **Save as Draft** (Secondary) - Saves to localStorage only
- **Cancel** (Tertiary) - Closes modal

**API Calls**:
- `POST /api/v1/students/:id/mock-interviews` - Create interview record

---

### 6.3 Mock Interview Detail Page (`/mock-interviews/:interviewId`)

**Page Layout**:
- Breadcrumb: Dashboard > Mock Interviews > [Company] [Date]
- Header with back button

**Content**:

**1. Interview Summary Card**:
- Company (large)
- Date & Time
- Score (large, color-coded)
- Duration (if tracked)
- Pass/Fail indicator (optional threshold comparison)

**2. Interview Feedback Sections**:
| Section | Content |
|---------|---------|
| Overall Feedback | Full text display |
| Technical Skills | Full text + rating bars (if applicable) |
| Communication | Full text + rating bars |
| Problem-Solving | Full text + rating bars |
| Areas to Improve | Full text display |
| Interviewer Notes | Display if provided |

**3. Action Panel**:
- Edit button - Re-open form for editing
- Delete button - Removes interview (with confirmation)
- Export button - Download as PDF (optional)
- Share button - Generate shareable link (optional)

**4. Timeline Section** (Optional):
- "Interview History for [Company]"
- Show all interviews with this company
- Mini cards with score, date, trend indicator

**API Calls**:
- `GET /api/v1/students/:id/mock-interviews/:interviewId` - Interview details
- `PUT /api/v1/students/:id/mock-interviews/:interviewId` - Update interview
- `DELETE /api/v1/students/:id/mock-interviews/:interviewId` - Delete interview

---

## 7. RESUME TRACKER PAGES

### 7.1 Resume List Page (`/resume-tracker`)

**Page Layout**:
- Header: "Resume Management"
- Subheader: "Manage multiple versions of your resume"
- Action button: "+ Upload New Resume"

**Content**:

**Upload Section** (Drag-and-drop area):
- Drag & drop zone with icon
- Text: "Drag resume here or click to browse"
- Accepted formats: PDF, DOC, DOCX
- File size: Max 5MB
- Button: "Choose File"
- Progress bar during upload
- Success/error message after upload

**Active Resume Indicator**:
- Show which resume is marked as "Active"
- Visual badge: "Active" or "Set as Active" button

**Resume Cards** (Grid layout):
- Each card displays:
  - File name
  - Upload date
  - File size
  - Actions dropdown:
    - Download
    - Preview
    - Set as Active
    - Delete
    - Rename (inline edit)
  - Status: Active / Inactive

**Resume Limit Indicator**:
- "You have 2/5 resumes. 3 more allowed"
- Progress bar showing usage

**Additional Information** (If included):
- GitHub Profile: Text input + validation
- LinkedIn Profile: Text input + validation
- Portfolio Link: Text input + validation
- Save button for profile links

**Empty State**:
- Icon + message: "No resumes uploaded yet. Upload your first resume!"
- Large upload button

**Preview Modal**:
- On click "Preview"
- Display PDF preview (using PDF.js or similar)
- If DOC/DOCX: Show first page preview + "View Full Document" link
- Navigation: Prev/Next page buttons (for multi-page)
- Download button in modal footer

**API Calls**:
- `GET /api/v1/students/:id/resumes` - List resumes
- `POST /api/v1/students/:id/resumes/upload` - Upload resume (multipart/form-data)
- `DELETE /api/v1/students/:id/resumes/:resumeId` - Delete resume
- `PUT /api/v1/students/:id/resumes/:resumeId/set-active` - Set as active
- `PUT /api/v1/students/:id/resumes/:resumeId/rename` - Rename resume
- `GET /api/v1/students/:id/profiles` - Get GitHub/LinkedIn/Portfolio links
- `PUT /api/v1/students/:id/profiles` - Update profile links

---

## 8. NOTES PAGES

### 8.1 Notes List Page (`/notes`)

**Page Layout**:
- Header: "Study Notes"
- Action button: "+ Create New Note"
- Search & filter panel

**Search & Filter**:
| Element | Type |
|---------|------|
| Search | Text input (searches title & content) |
| Topic Filter | Checkbox group (Arrays, Linked Lists, etc.) |
| Company Filter | Checkbox group |
| Visibility | Radio group: All / Public / Private |
| Sort | Dropdown: Newest, Oldest, Alphabetical, Most Viewed |

**Notes Display** (Grid or List):

**Grid View** (2-3 columns):
- Each note as a card:
  - Title
  - Content preview (100 chars + "...")
  - Topic tags
  - Company tags
  - Created date
  - View count (optional)
  - Visibility badge: 🔓 Public / 🔒 Private
  - Hover actions: View, Edit, Delete, Share

**List View**:
- Title (bold)
- Preview (2 lines)
- Meta: Created date, Topic, Company, Visibility
- Right-aligned actions

**Empty State**:
- "No notes yet. Create your first note!"
- Button: "Create Note"

**Pagination**:
- 12 notes per page
- Navigation buttons

**API Calls**:
- `GET /api/v1/students/:id/notes?page=1&limit=12&topic=X&company=Y&visibility=Z` - List notes
- `GET /api/v1/students/:id/notes?search=:query` - Search notes

---

### 8.2 Create/Edit Note Modal

**Modal Layout**:
- Header: "Create New Note" OR "Edit Note"
- Form fields:

| Field | Type | Validation | Constraint |
|-------|------|-----------|-----------|
| Title | Text input | Non-empty, 5-200 chars | Required |
| Content | Rich text editor | Max 10,000 chars | Required |
| Topic | Multi-select dropdown | Select from topics | Optional |
| Company | Multi-select dropdown | Select from companies | Optional |
| Visibility | Radio buttons | Public / Private | Default: Private |

**Rich Text Editor Features**:
- Formatting: Bold, Italic, Underline, Strikethrough
- List: Bullet list, Numbered list
- Code block: Syntax highlighting
- Headings: H1-H3
- Links: Insert/edit links
- Character counter: Shows "XXX / 10000"
- Auto-save to localStorage (draft every 10 seconds)

**UI Elements**:
- Save to draft icon (auto-save indicator)
- Undo/Redo buttons
- Clear formatting button

**Buttons**:
- **Save Note** (Primary) - Submits form
- **Delete Draft** (Secondary) - If in draft mode
- **Cancel** (Tertiary)

**Behaviors**:
- Show warning if leaving without saving
- Auto-fill form with note data if editing existing note
- Show character counter below editor
- Disable Save button if title is empty

**API Calls**:
- `POST /api/v1/students/:id/notes` - Create note
- `PUT /api/v1/students/:id/notes/:noteId` - Update note
- `DELETE /api/v1/students/:id/notes/:noteId` - Delete note

---

### 8.3 Note Detail Page (`/notes/:noteId`)

**Page Layout**:
- Breadcrumb: Dashboard > Notes > [Note Title]
- Header with back button

**Content**:

**1. Note Header**:
- Title (large)
- Created: [Date]
- Last updated: [Date]
- Author: [Student name]
- Visibility badge: Public / Private
- View count: [N] views (if public)

**2. Note Content**:
- Rendered rich text
- Code blocks with syntax highlighting
- Embedded links (clickable)

**3. Metadata**:
- Topics: Tag badges
- Companies: Tag badges
- Share button (if public)

**4. Action Panel**:
- Edit button (only own notes)
- Delete button (only own notes, with confirmation)
- Share button (if public)
- Copy link button

**5. Comments Section** (Optional for v1, if public notes):
- Show recent comments if enabled
- Comment input field
- Nested replies

**6. Related Notes** (If public):
- Show 5 notes with same topic/company
- Mini cards with title, author, view count

**API Calls**:
- `GET /api/v1/notes/:noteId` - Public note details
- `GET /api/v1/students/:id/notes/:noteId` - Own note details

---

## 9. LEADERBOARD PAGE

### 9.1 Leaderboard Page (`/leaderboard`)

**Page Layout**:
- Header: "Leaderboard"
- Subheader: "Top placement preparation performers"
- Filter & view options (top right)

**Filters**:
| Filter | Type | Options |
|--------|------|---------|
| Time Period | Radio buttons | All Time, This Month, This Week |
| View | Radio buttons | Overall, Progress %, Questions, Mock Interviews |

**Leaderboard View**:

**Overall Leaderboard** (Default):
- Ranking calculation: (Progress % × 0.50) + (Questions Solved × 0.30) + (Mock Interview Score × 0.20)
- Normalized formula applied

**Table Structure** (Desktop):
| Rank | Student Name | Progress % | Questions | Avg Mock Score | Overall Score |
|------|--------------|-----------|-----------|---|--------|
| 1 🥇 | Rahul Sharma | 95% ▀▀▀▀▀ | 245 ✓ | 85.5 ★★★★★ | 890 pts |
| 2 🥈 | Priya Patel | 90% ▀▀▀▀  | 220 ✓ | 82.0 ★★★★ | 850 pts |
| ... | ... | ... | ... | ... | ... |

**Mobile View** (Card layout):
- Rank (large, with medal emoji)
- Student name (large, clickable to profile)
- Overall score (prominent)
- Three sub-metrics listed
- Trend indicator: ↑ (moved up), ↓ (moved down), → (same)

**List View Options**:

**Progress % Leaderboard**:
- Sorted by progress percentage
- Show: Rank, Student, Progress %, Topics Completed

**Questions Leaderboard**:
- Sorted by total questions solved
- Show: Rank, Student, Questions Solved, Easy/Medium/Hard breakdown

**Mock Interviews Leaderboard**:
- Sorted by average mock interview score
- Show: Rank, Student, Avg Score, Interview Count, Highest Score

**Student's Own Position**:
- Highlight own row (light blue background)
- Show rank, score, and change from previous update
- "You are ranked #XX out of 1,245 students"

**Search**:
- Search by student name (filters list in real-time)
- Autocomplete suggestions

**Pagination**:
- Top 100 by default
- Load more button OR pagination

**Refresh Mechanism**:
- "Last updated: [timestamp]" with refresh button
- Manual refresh available (page refresh acceptable for v1)

**Empty State**:
- If no data: "Leaderboard data coming soon"

**API Calls**:
- `GET /api/v1/leaderboard?period=all_time&view=overall&page=1&limit=100` - Leaderboard data
- `GET /api/v1/leaderboard/my-rank/:studentId` - Current student's rank

---

## 10. CODING PROFILES PAGE

### 10.1 Coding Profiles Page (`/coding-profiles`)

**Page Layout**:
- Header: "Coding Platform Profiles"
- Subheader: "Link your coding profiles to track progress"

**Content**:

**Platform Cards** (Grid or List):

Each card for platform (LeetCode, CodeChef, HackerRank, Codeforces):

**Card Content**:
- Platform icon/logo
- Platform name
- Status: Linked / Not Linked (badge color)
- If Not Linked:
  - Input field: "Enter your username"
  - Button: "Link Profile"
  - Help text: "How to find your username"
- If Linked:
  - Username display (with copy button)
  - Profile link (clickable, opens in new tab)
  - Stats (if fetched):
    - Problems solved
    - Current rating/rank
    - Last update date
  - Button: "Update" (refresh stats)
  - Button: "Unlink" (remove profile)

**Link Profile Flow**:

1. User enters username
2. Validation: Username format check
3. Click "Link Profile"
4. Loading spinner: "Verifying..."
5. If success: Show profile stats, save to DB
6. If error: "Username not found or profile private. Check and try again."

**Update Stats**:
- Click "Update" button
- Loading spinner
- Refresh stats from platform API
- Show "Last updated: [date/time]"

**Sync Frequency**:
- Manual update via button (no automatic sync for v1)
- Data displayed: Last sync result

**API Calls**:
- `POST /api/v1/students/:id/coding-profiles` - Link profile
- `PUT /api/v1/students/:id/coding-profiles/:platformId` - Update profile/refresh stats
- `DELETE /api/v1/students/:id/coding-profiles/:platformId` - Unlink profile
- `GET /api/v1/students/:id/coding-profiles` - Get all linked profiles

---

## 11. USER PROFILE & SETTINGS

### 11.1 Profile Page (`/profile`)

**Page Layout**:
- Breadcrumb: Dashboard > Profile
- Profile section (left) and Account section (right) on desktop
- Stacked on mobile

**Profile Management Section**:
| Field | Type | Editable | Constraint |
|-------|------|----------|-----------|
| Full Name | Text input | Yes | Max 100 chars |
| Email | Email input | No | Display only |
| Bio/About Me | Text area | Yes | Max 500 chars |
| Avatar | Image upload | Yes | 2MB max, JPG/PNG |
| University | Text input | Yes | Max 100 chars |
| Graduation Year | Dropdown | Yes | YYYY format |
| Department | Text input | Yes | Max 100 chars |

**Edit Profile Button**:
- Opens form in edit mode
- Submit & Cancel buttons
- Validation messages
- Success toast on save

**Account Settings Section**:
| Setting | Type | Action |
|---------|------|--------|
| Email | Display | Change Email (link) → Form modal |
| Password | Display | Change Password (link) → Form modal |
| Two-Factor Auth | Toggle | Enable/Disable with verification |
| Session Management | List | Logout from other devices button |
| Notification Preferences | Checkboxes | Email notifications settings |
| Account Deletion | Danger button | "Delete Account (irreversible)" |

**Change Password Modal**:
- Current password field
- New password field (with strength indicator)
- Confirm password field
- Validation: Min 8 chars, complexity rules
- Submit button

**Change Email Modal**:
- New email field
- Verification code sent to email
- Verification code input field
- Submit button

**Account Deletion Modal**:
- Warning: "This action is permanent"
- Confirmation: Type "I understand"
- Final confirmation button
- Redirects to login after deletion

**API Calls**:
- `GET /api/v1/students/:id/profile` - Get profile
- `PUT /api/v1/students/:id/profile` - Update profile
- `POST /api/v1/students/:id/change-password` - Change password
- `POST /api/v1/students/:id/change-email` - Change email
- `POST /api/v1/students/:id/enable-2fa` - Enable 2FA
- `DELETE /api/v1/students/:id` - Delete account

---

## 12. ADMIN PAGES

### 12.1 Admin Dashboard (`/admin-dashboard`)

**Access Control**: Only accessible to admin role

**Page Layout**:
- Admin navbar (similar to student, but admin-specific routes)
- Navigation: Dashboard, Users, Learning Paths, Company Questions, Analytics

**Dashboard Content** (KPI Cards):

**Card 1: Total Users**
- Large number: [Total]
- Trend: up/down percentage from last month
- Subtext: "Active this month: [X]"

**Card 2: Study Streaks**
- Average streak: [X] days
- Students with active streaks: [X]
- Longest streak: [X] days

**Card 3: Questions Solved**
- Total questions solved: [X]
- Average per student: [X.XX]
- Growth: ↑ [X]% from last month

**Card 4: Mock Interviews**
- Total conducted: [X]
- Average score: [X.XX]
- Top company: [Company name]

**Card 5: Learning Progress**
- Average completion: [X]%
- Students on track: [X%]
- Students behind: [X%]

**Card 6: Platform Health**
- System uptime: [X]%
- DB response time: [X]ms
- API requests/min: [X]

**Charts/Graphs** (if dashboard space allows):
- User registration trend (line chart)
- Daily active users (bar chart)
- Topics completed (pie chart)

**Recent Activity Feed**:
- Latest user registrations
- Latest mock interviews
- Recently solved questions
- Recently uploaded resumes

**API Calls**:
- `GET /api/v1/admin/dashboard/stats` - All KPI stats
- `GET /api/v1/admin/dashboard/activity?limit=10` - Recent activity

---

### 12.2 Users Management Page (`/admin-users`)

**Page Layout**:
- Header: "User Management"
- Action button: "+ Send Invite" (for admin to invite students)

**Content**:

**Search & Filter**:
| Filter | Type |
|--------|------|
| Search | Text input (name, email) |
| Status | Dropdown: All, Active, Inactive, Pending |
| Creation Date | Date range picker |
| Sort | Dropdown: Name (A-Z), Created (newest), Progress |

**Users Table**:
| Column | Content | Sortable |
|--------|---------|----------|
| Name | Full name | Yes |
| Email | Email address | Yes |
| Status | Active / Inactive / Pending Invite | Yes |
| Progress | Progress percentage | Yes |
| Joined | Date user registered | Yes |
| Last Active | Last login date | Yes |
| Actions | View / Edit / Invite / Deactivate / Delete | No |

**Row Actions Dropdown**:
- View Profile - Navigate to student profile (admin view)
- Edit Details - Edit name, email, etc.
- Send Invite - Resend invite email
- Deactivate Account - Disable login (reversible)
- Delete Account - Permanent deletion (with confirmation)
- Reset Password - Force password reset on next login
- Download Data - GDPR data export (optional)

**Invite Modal**:
- Email input field
- Personal message (optional)
- Button: "Send Invite"
- Success: "Invite sent to [email]"

**Admin Profile View** (Modal):
- Student name, email, status
- Progress stats: Overall %, Questions, Mock Interviews
- Recent activities
- Account created: [Date]
- Last active: [Date]
- Admin actions available

**Pagination**:
- 25 users per page
- Total count: "Showing 1-25 of 5,432 users"

**Export**:
- Export as CSV button (optional)
- Includes selected columns

**Bulk Actions** (Optional):
- Checkbox to select multiple users
- Bulk action dropdown: Deactivate, Activate, Delete, Export

**API Calls**:
- `GET /api/v1/admin/users?page=1&limit=25&search=X&status=Y&sort=Z` - List users
- `GET /api/v1/admin/users/:userId` - User details
- `PUT /api/v1/admin/users/:userId` - Edit user
- `POST /api/v1/admin/users/invite` - Send invite
- `PUT /api/v1/admin/users/:userId/deactivate` - Deactivate user
- `DELETE /api/v1/admin/users/:userId` - Delete user

---

### 12.3 Learning Paths Management (`/admin-learning-path`)

**Page Layout**:
- Header: "Manage Learning Paths"
- Action button: "+ Add New Topic"

**Content**:

**Learning Paths Table**:
| Column | Content | Editable |
|--------|---------|----------|
| Week | Week number | No |
| Topic | Topic name | Yes (inline) |
| Description | Brief description | Yes (inline) |
| Status | Active / Archived | Yes |
| Created | Creation date | No |
| Actions | Edit / Delete / Archive | No |

**Inline Editing**:
- Click field to edit
- Save/Cancel buttons appear
- Validation on save

**Add New Topic Modal**:
| Field | Type |
|-------|------|
| Week Number | Number input |
| Topic Name | Text input |
| Description | Text area |
| Duration (hours) | Number input |
| Difficulty | Dropdown: Beginner, Intermediate, Advanced |
| Resources | Multi-input (links) |
| Status | Toggle: Active / Inactive |

**Delete Topic Modal**:
- Warning: "This will affect all students following this path"
- Checkbox: "I understand this is permanent"
- Delete button

**Reorder Topics**:
- Drag-and-drop to reorder weeks (optional)
- Save order button

**Bulk Actions** (Optional):
- Archive multiple topics at once
- Activate multiple topics

**API Calls**:
- `GET /api/v1/admin/learning-paths` - Get all topics
- `POST /api/v1/admin/learning-paths` - Create topic
- `PUT /api/v1/admin/learning-paths/:topicId` - Update topic
- `DELETE /api/v1/admin/learning-paths/:topicId` - Delete topic
- `PUT /api/v1/admin/learning-paths/reorder` - Reorder topics (optional)

---

### 12.4 Company Questions Management (`/admin-company-questions`)

**Page Layout**:
- Header: "Manage Interview Questions"
- Action button: "+ Add New Question"
- Import button: "Bulk Upload (CSV)" (optional)

**Content**:

**Questions Table**:
| Column | Content | Sortable |
|--------|---------|----------|
| Question ID | Auto-ID | No |
| Question Text | Title (truncated) | No |
| Company | Company name | Yes |
| Topic | Primary topic | Yes |
| Difficulty | Easy / Medium / Hard | Yes |
| Status | Active / Archived | Yes |
| Solved Count | [N] students | Yes |
| Created | Creation date | Yes |
| Actions | View / Edit / Delete / Archive | No |

**Search & Filter**:
- Search by question text
- Filter by company
- Filter by topic
- Filter by difficulty
- Filter by status

**Add New Question Modal**:
| Field | Type | Constraint |
|-------|------|-----------|
| Question Title | Text input | Required, max 200 chars |
| Question Statement | Rich text editor | Max 5000 chars |
| Company | Dropdown | Required |
| Topic | Multi-select | At least 1 required |
| Difficulty | Dropdown | Required |
| Example Input | Code block (optional) | |
| Example Output | Code block (optional) | |
| Constraints | Text area (optional) | |
| Hints | Rich text (optional) | |
| Solution Approach | Rich text (optional) | |
| Solution Code | Code block (optional) | |
| Tags | Multi-input | Optional |
| Status | Toggle: Active / Draft | Default: Active |

**Edit Question**:
- Same form as Add, pre-filled with question data
- Timestamp: "Last edited by [Admin name] on [Date]"

**Delete Question Modal**:
- Warning: "[X] students have solved this question"
- Confirmation checkbox
- Delete button

**Bulk Upload (Optional)**:
- CSV format with columns: Question, Company, Topic, Difficulty, Solution
- Error handling for malformed CSV
- Preview before import
- Import button

**Manage Companies**:
- Dropdown of companies in form should be editable
- Option to add new company during question creation
- Manage Companies link → separate page with CRUD for companies

**API Calls**:
- `GET /api/v1/admin/company-questions?page=1&limit=25&company=X&topic=Y` - List questions
- `GET /api/v1/admin/company-questions/:questionId` - Question details
- `POST /api/v1/admin/company-questions` - Create question
- `PUT /api/v1/admin/company-questions/:questionId` - Update question
- `DELETE /api/v1/admin/company-questions/:questionId` - Delete question
- `GET /api/v1/admin/companies` - List companies
- `POST /api/v1/admin/companies` - Add company
- `POST /api/v1/admin/company-questions/bulk-upload` - Bulk import (optional)

---

## 13. ERROR PAGES

### 13.1 404 Not Found Page

**Path**: `/404` or catch-all route

**Content**:
- Large "404" text
- Message: "Page Not Found"
- Description: "The page you're looking for doesn't exist."
- Suggestions: Links to Dashboard, Learning Path, Help
- Button: "Go Back Home"

---

### 13.2 500 Server Error Page

**Path**: `/500`

**Content**:
- Large "500" text
- Message: "Something Went Wrong"
- Description: "We encountered an unexpected error. Our team is working on it."
- Contact support: "Contact support@placementtracker.com"
- Button: "Go Back Home"
- Optional: Error reference ID

---

### 13.3 Unauthorized/Forbidden Page

**Path**: `/403`

**Content**:
- Message: "Access Denied"
- Description: "You don't have permission to access this page."
- Button: "Go Back Home"

---

## 14. GLOBAL UI COMPONENTS

### 14.1 Navigation Bar

**Navigation Structure**:

**Student Navbar** (Desktop):
- Logo (left)
- Menu items (center-left): Dashboard, Learning Path, Company Questions, Practice, Resume, Notes, Leaderboard, Coding Profiles
- User profile icon (right) → Dropdown menu

**Student Navbar** (Mobile):
- Logo (left)
- Hamburger menu icon (right) → Offcanvas drawer
- Drawer items: All navigation items + Settings, Logout

**Admin Navbar** (Desktop):
- Logo (left)
- Menu items: Dashboard, Users, Learning Paths, Company Questions, Analytics (if available)
- Settings icon, Notification icon, User profile icon (right)

**Admin Navbar** (Mobile):
- Logo (left)
- Hamburger menu (right) → Drawer

**Active Page Highlighting**:
- Current page menu item highlighted (color or underline)

**Responsive Behavior**:
- Desktop: Full horizontal menu
- Tablet: Abbreviated labels
- Mobile: Hamburger menu with drawer

---

### 14.2 Modals/Dialogs

**Standard Modal Behavior**:
- Backdrop: Semi-transparent overlay (rgba 0,0,0,0.5)
- Modal size: 90vw on mobile, 600px max on desktop
- Close button: X icon in top-right
- Click outside modal: Close modal (with escape key)
- Animation: Fade in/out (200ms)

**Confirmation Modal** (Delete, Reset, etc.):
- Icon: Warning icon (⚠️)
- Title: "Confirm Action"
- Message: Specific action being confirmed
- Buttons: "Cancel" (Secondary), "Confirm" (Primary, danger color if destructive)

---

### 14.3 Toast Notifications

**Toast Positioning**: Top-right corner (adjustable)

**Toast Types**:
| Type | Color | Icon | Duration |
|------|-------|------|----------|
| Success | Green (#22c55e) | ✓ | 3 seconds |
| Error | Red (#ef4444) | ✗ | 5 seconds |
| Warning | Yellow (#eab308) | ⚠️ | 4 seconds |
| Info | Blue (#0284c7) | ℹ️ | 3 seconds |

**Toast Features**:
- Dismiss button (X icon)
- Action button (optional, for undo/retry)
- Auto-dismiss after duration
- Stack multiple toasts (max 3)

---

### 14.4 Loading States

**Skeleton Loaders**:
- Use for cards, tables, lists
- Shimmer animation (optional)
- Pulse effect (alternative)

**Spinners**:
- Circular spinner for page-level loading
- Inline spinner for button loading: "Loading..."

**Loading Messages**:
- "Loading..." (generic)
- "Fetching data..." (data fetch)
- "Saving changes..." (submission)

---

### 14.5 Form Validation Messages

**Real-time Validation**:
- Shows on blur, after user interaction
- Red text below field
- Icon: ⚠️ or ✗

**Examples**:
- "Email already exists"
- "Password must be at least 8 characters"
- "This field is required"
- "Invalid email format"

**Success Validation** (Optional):
- Green checkmark when field is valid
- Only if field was previously invalid

---

### 14.6 Dropdown/Select Components

**Single Select**:
- Placeholder: "Select an option"
- Keyboard navigation: Arrow keys, Enter to select
- Search enabled for large lists (>10 items)

**Multi-Select**:
- Checkbox next to each option
- Show selected count: "[X] selected"
- "Select All" / "Clear All" buttons (if >5 items)
- Hover effect on options

**Searchable Dropdowns**:
- Search input in dropdown
- Real-time filtering
- Highlight matching text

---

### 14.7 Pagination

**Pagination Controls**:
- Previous / Next buttons
- Page numbers: 1, 2, 3... (max 5 page numbers visible)
- Jump to page input (optional)
- Items per page selector: 10, 25, 50

**Pagination State**:
- Disabled Previous on page 1
- Disabled Next on last page
- Current page highlighted

**Pagination Display**:
- "Showing 1-10 of 245 items"

---

## 15. RESPONSIVE DESIGN

### 15.1 Breakpoints

| Device | Width | Columns | Layout |
|--------|-------|---------|--------|
| Mobile | < 768px | 1 | Stacked vertical |
| Tablet | 768px - 1024px | 2 | Two columns |
| Desktop | ≥ 1024px | 3+ | Full layout |

### 15.2 Mobile-First Strategy

- Design base styles for mobile
- Use CSS media queries for tablet+
- Touch targets: Min 44x44px

### 15.3 Touch Interactions (Mobile)

- Swipe left/right: Navigate pages (optional)
- Long press: Context menu (for delete, etc.)
- Tap to select, double-tap for actions

---

## 16. FRONTEND FOLDER STRUCTURE

```
frontend/
├── public/
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── PasswordResetForm.jsx
│   │   │   └── __tests__/
│   │   ├── Dashboard/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── __tests__/
│   │   ├── LearningPath/
│   │   │   ├── LearningPathList.jsx
│   │   │   ├── LearningPathDetail.jsx
│   │   │   └── __tests__/
│   │   ├── CompanyQuestions/
│   │   │   ├── QuestionsList.jsx
│   │   │   ├── QuestionDetail.jsx
│   │   │   └── __tests__/
│   │   ├── MockInterviews/
│   │   │   ├── InterviewsList.jsx
│   │   │   ├── InterviewDetail.jsx
│   │   │   ├── RecordInterviewModal.jsx
│   │   │   └── __tests__/
│   │   ├── Resume/
│   │   │   ├── ResumeTracker.jsx
│   │   │   ├── ResumePreview.jsx
│   │   │   └── __tests__/
│   │   ├── Notes/
│   │   │   ├── NotesList.jsx
│   │   │   ├── NoteDetail.jsx
│   │   │   ├── NoteEditor.jsx
│   │   │   └── __tests__/
│   │   ├── Leaderboard/
│   │   │   ├── LeaderboardView.jsx
│   │   │   └── __tests__/
│   │   ├── CodingProfiles/
│   │   │   ├── CodingProfilesPage.jsx
│   │   │   └── __tests__/
│   │   ├── Admin/
│   │   │   ├── UserManagement.jsx
│   │   │   ├── LearningPathManagement.jsx
│   │   │   ├── QuestionManagement.jsx
│   │   │   └── __tests__/
│   │   ├── Common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── SkeletonLoader.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── __tests__/
│   │   ├── Profile/
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── __tests__/
│   │   └── ErrorPages/
│   │       ├── NotFound.jsx
│   │       ├── ServerError.jsx
│   │       └── Unauthorized.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── AdminDashboardPage.jsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useFetch.js
│   │   ├── useForm.js
│   │   ├── useLocalStorage.js
│   │   └── ...
│   ├── services/
│   │   ├── api.js (axios instance)
│   │   ├── authService.js
│   │   ├── learningPathService.js
│   │   ├── questionService.js
│   │   ├── interviewService.js
│   │   ├── resumeService.js
│   │   ├── noteService.js
│   │   ├── leaderboardService.js
│   │   └── ...
│   ├── store/
│   │   ├── authSlice.js
│   │   ├── userSlice.js
│   │   ├── dataSlice.js
│   │   └── store.js (Redux store configuration)
│   ├── utils/
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── errorHandler.js
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── ...
│   ├── App.jsx
│   ├── App.css
│   └── index.jsx
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

---

## 17. API INTEGRATION CHECKLIST

**Base URL**: `http://localhost:5000/api/v1` (development)

All API calls require:
- JWT token in Authorization header: `Authorization: Bearer <token>`
- Content-Type: `application/json`

**API Response Format**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "timestamp": "2026-03-06T10:30:00Z"
}
```

**Error Response Format**:
```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "INVALID_INPUT",
  "timestamp": "2026-03-06T10:30:00Z"
}
```

**HTTP Status Codes**:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

---

## 18. PERFORMANCE REQUIREMENTS

- Page load time: < 2 seconds
- Time to Interactive (TTI): < 3 seconds
- Lighthouse Performance score: > 85

**Optimization Strategies**:
- Code splitting by route (Lazy loading with React.lazy)
- Image optimization: Use next-gen formats (WebP), lazy load images
- Bundling: Minify, tree-shake unused code
- Caching: Cache API responses with React Query or SWR
- Debounce search/filter inputs

---

## 19. ACCESSIBILITY (WCAG 2.1 AA)

- Color contrast ratio: Min 4.5:1
- Focus indicators: Visible focus rings on all interactive elements
- Keyboard navigation: All features accessible via keyboard (Tab, Enter, Arrow keys)
- Screen reader support: Proper ARIA labels and semantic HTML
- Form labels: All form inputs have associated label elements
- Error messages: Associated with form fields using aria-describedby

---

## 20. DEPLOYMENT CHECKLIST

**Pre-Deployment**:
- [ ] All environment variables configured (.env)
- [ ] API endpoints verified
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Form validations complete
- [ ] Responsive design tested on mobile/tablet/desktop
- [ ] Accessibility audit passed
- [ ] Performance optimizations complete
- [ ] Unit tests passing (snapshots, component logic)
- [ ] E2E tests passing (critical user flows)

**Deployment**:
- [ ] Build: `npm run build` produces optimized dist/
- [ ] Platform: Deploy to Vercel / Netlify / AWS S3+CloudFront
- [ ] Domain: Configure custom domain
- [ ] SSL certificate: Enable HTTPS
- [ ] Environment: Set production API URL
- [ ] Monitoring: Set up error tracking (Sentry)
- [ ] Analytics: Configure user analytics (Google Analytics)

---

## APPENDIX A: Design Tokens

**Colors**:
- Primary: #3b82f6 (Blue)
- Secondary: #06b6d4 (Cyan)
- Success: #22c55e (Green)
- Warning: #eab308 (Yellow)
- Danger: #ef4444 (Red)
- Text Primary: #1f2937 (Dark gray)
- Text Secondary: #6b7280 (Medium gray)
- Background: #ffffff (White)
- Background Secondary: #f9fafb (Light gray)

**Typography**:
- Font: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- Heading 1: 32px, bold, line-height 1.2
- Heading 2: 24px, bold, line-height 1.3
- Heading 3: 20px, semibold, line-height 1.4
- Body: 16px, regular, line-height 1.5
- Caption: 12px, regular, line-height 1.4

**Spacing**:
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px

**Border Radius**:
- sm: 4px
- md: 8px
- lg: 12px

**Shadows**:
- sm: 0 1px 2px rgba(0,0,0,0.05)
- md: 0 4px 6px rgba(0,0,0,0.1)
- lg: 0 10px 15px rgba(0,0,0,0.15)

---

**END OF FRONTEND PRD**

