# 🚀 Placement Preparation Tracker

A comprehensive, full-stack web platform designed to streamline, track, and accelerate student placement preparation across Data Structures & Algorithms, System Design, Company-Specific Interview Problems, Mock Interviews, ATS Resume Parsing, and Coding Projects.

---

## ✨ Key Features

### 🎓 For Students
- **Structured 20-Topic Learning Paths:** Step-by-step DSA and System Design roadmaps with visual memory sheets, algorithmic patterns, and curated question checklists.
- **In-Browser Multi-Language IDE:** Practice coding directly in the browser via Monaco Editor supporting Java, Python, C, C++, JavaScript, TypeScript, Go, Rust, and Kotlin with local and cloud execution fallbacks.
- **Timed Practice Quizzes:** Topic-wise placement quizzes with live timers, review breakdowns, and score histories.
- **ATS Resume Analyzer:** Upload PDF/DOCX resumes for keyword analysis and placement readiness scoring.
- **Mock Interview Tracker:** View interview feedback, radar scoring charts (Technical, Communication, Problem Solving), and improvement notes.
- **Project Portfolio Manager:** Upload multi-file codebases, view files in-browser with syntax highlighting, and export bundles as `.zip` archives.
- **Peer Collaboration & Leaderboard:** Discussion forums and global rank tracking based on consistency, solved problems, and quiz results.

### 👑 For Administrators
- **Executive Analytics Dashboard:** Real-time visibility into student counts, active users, topic completion rates, and average mock scores.
- **Student Registry Management:** Create, search, audit, and manage student accounts with password reset workflows.
- **Curriculum & Question Bank:** Author weekly DSA tracks, memory cheat sheets, and curated company-tagged problem sets.
- **Mock Interview Evaluation:** Grade student mock interviews using structured scoring rubrics and log actionable feedback.
- **Task Scheduling & Curated Media:** Assign daily coding challenges, index YouTube concept lectures, and manage STAR-method HR interview questions.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 7, TailwindCSS 4, Redux Toolkit, React Router DOM v7, Monaco Editor |
| **Backend** | Node.js (v24+), Express 4, Mongoose 7, Multer, Nodemailer, Archiver |
| **Database** | MongoDB (Local Community Server / MongoDB Atlas) |
| **Security** | JWT Authentication, Bcryptjs password hashing, Rate Limiting, Role-Based Access Control (RBAC) |
| **Execution Sandbox** | Local process execution (GCC, Python, Java, etc.) + Piston Cloud API Fallback |

---

## ⚡ Quickstart

### 1. Clone the Repository
```bash
git clone https://github.com/ASWANTH299/Placement-Preparation-Tracker.git
cd Placement-Preparation-Tracker
```

### 2. Install Dependencies
```bash
npm install
cd backend && npm ci
cd ../frontend && npm ci
cd ..
```

### 3. Configure Environment Variables
Copy the sample `.env` files:

- **Windows PowerShell:**
  ```powershell
  Copy-Item backend\.env.example backend\.env
  Copy-Item frontend\.env.example frontend\.env
  ```
- **macOS / Linux / Git Bash:**
  ```bash
  cp backend/.env.example backend/.env
  cp frontend/.env.example frontend/.env
  ```

> *Ensure `MONGODB_URI` and a 32+ character `JWT_SECRET` are configured in `backend/.env`.*

### 4. Initialize Database & Seed Admin
```bash
cd backend
npm run fix:db
npm run seed:admin
cd ..
```

### 5. Run the Application

```bash
npm run dev:all
```

- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Health Check:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 🔑 Default Admin Credentials

| Parameter | Value |
| :--- | :--- |
| **Email** | `admin@placementtracker.dev` |
| **Password** | `ChangeThisStrongPassword123!` |
| **Role** | `admin` |

*(Students can self-register at `/register` on the frontend).*

---

## 📖 Detailed Documentation

For full step-by-step setup guides, troubleshooting tables, Windows PowerShell-specific fixes, and environment reference variables, refer to **[SETUP.md](./SETUP.md)**.

---

## 📂 Project Structure

```text
├── backend/                  # Express REST API, Mongoose Models, Controllers, Seeders
│   ├── src/                  # Application source code
│   ├── .env.example          # Backend environment template
│   └── package.json
├── frontend/                 # React 19 SPA (Vite + TailwindCSS)
│   ├── src/                  # Pages, Components, Redux Store
│   ├── .env.example          # Frontend environment template
│   └── package.json
├── SETUP.md                  # Comprehensive local development and setup guide
└── package.json              # Root workspace orchestration
```

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.