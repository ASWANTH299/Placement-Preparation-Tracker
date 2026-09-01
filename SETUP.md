# Placement Preparation Tracker — Setup Guide

Get the project running locally in under 5 minutes.

---

## ⚡ Quickstart (TL;DR)

Open your terminal in the project root directory and run:


# Placement Preparation Tracker — Setup Guide

Get the project running locally in under 5 minutes.

---

## ⚡ Quickstart (TL;DR)

Open your terminal in the project root directory and run the commands for your specific shell:

### Option 1: Windows PowerShell (Default Terminal)

```powershell
# 1. Install all dependencies
npm install; cd backend; npm ci; cd ../frontend; npm ci; cd ..

# 2. Copy environment files
Copy-Item backend\.env.example backend\.env; Copy-Item frontend\.env.example frontend\.env

# 3. Initialize database and seed admin account
cd backend; npm run fix:db; npm run seed:admin; cd ..

# 4. Start both servers concurrently
npm run dev:all
```

- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Admin Login:** `admin@placementtracker.dev` | `<ADMIN_PASSWORD_FROM_ENV>` (configured in `backend/.env`)

---

## 📋 Prerequisites

Before starting, ensure you have installed:

| Requirement | Minimum Version | Check Command |
| :--- | :--- | :--- |
| **Node.js** | `v18.0.0+` (v24+ recommended) | `node -v` |
| **NPM** | `v9.0.0+` | `npm -v` |
| **MongoDB** | `v6.0+` (running locally or MongoDB Atlas URI) | `mongod --version` or `mongosh` |

---

## 🛠️ Step-by-Step Setup

### Step 1: Install Dependencies

```bash
# Root tooling
npm install

# Backend dependencies
cd backend
npm ci

# Frontend dependencies
cd ../frontend
npm ci

# Return to root
cd ..
```

---

### Step 2: Configure Environment Files (`.env`)

#### 1. Copy the sample files:

**Windows (Command Prompt / PowerShell):**
```cmd
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

**macOS / Linux:**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

#### 2. Key Environment Variables to Check:

* **`backend/.env`**:
  - `MONGODB_URI` — Default: `mongodb://localhost:27017/placement_tracker`
  - `JWT_SECRET` — Must be **at least 32 characters long**.
  - `ENABLE_CLOUD_COMPILER_FALLBACK` — Set to `true` to execute code in browser without installing local compilers (GCC/Java).
* **`frontend/.env`**:
  - `VITE_API_BASE_URL` — Must be `http://localhost:5000/api/v1`

---

### Step 3: Database Migration & Admin Seeding

From the `backend` folder:

```bash
cd backend

# 1. Clean legacy indexes / fields
npm run fix:db

# 2. Create the initial Admin user
npm run seed:admin

# 3. (Optional) Seed sample practice questions & mock data
npm run seed:questions
npm run seed:mock-interviews

cd ..
```

#### Default Credentials:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@placementtracker.dev` | Value set in `ADMIN_PASSWORD` in `backend/.env` |
| **Student** | Create a new account via the UI `/register` | User-defined |

---

### Step 4: Run the Application

#### Option A: One Command (Recommended)
From the root directory:
```bash
npm run dev:all
```

#### Option B: Separate Terminals

**Terminal 1 (Backend API):**
```bash
cd backend
npm start        # runs on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev      # runs on http://localhost:5173
```

---

## 👥 User Roles & Features

### 👑 Admin (`role: 'admin'`)
- **Dashboard:** Platform analytics, student completion rates, mock scores.
- **Student Management:** View, search, create, and manage student accounts.
- **Curriculum & Questions:** Manage 20-topic DSA tracks and curated company questions.
- **Mock Interviews:** Grade student mock interviews and leave feedback.
- **Daily Tasks & Resources:** Post daily challenges, YouTube lectures, and HR STAR prep guides.

### 🎓 Student (`role: 'student'`)
- **Learning Tracks:** 20 structured DSA/System Design topics with memory sheets.
- **In-Browser IDE:** Monaco editor with multi-language execution (Java, Python, C++, JS, etc.).
- **Mock Interviews & Quizzes:** Timed practice quizzes and mock interview score breakdowns.
- **Resume & Projects:** Resume ATS scoring parser and multi-file project viewer with ZIP export.
- **Leaderboard & Community:** Global ranking board and discussion forums.

---

## 🔍 Common Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB is not running | Start MongoDB service (`net start MongoDB` on Windows or `sudo systemctl start mongod` on Linux). |
| `JWT_SECRET must be at least 32 characters` | Short secret key | Set `JWT_SECRET=super_secure_placement_tracker_jwt_secret_key_2026_x99!` in `backend/.env`. |
| `Port 5000 already in use` | Zombie process running | Kill process on port 5000 or change `PORT=5001` in `backend/.env` and update `frontend/.env`. |
| "Compiler not found" on code execution | Missing local GCC/Java | Set `ENABLE_CLOUD_COMPILER_FALLBACK=true` in `backend/.env` to use the cloud sandbox. |
