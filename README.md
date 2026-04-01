# Placement-Preparation-Tracker

A full-stack Placement Preparation Tracker (React + Vite frontend, Node + Express backend, MongoDB database) optimized for seamless multi-developer collaboration.

## 🚀 Quick Setup (4 Steps)

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/ASWANTH299/Placement-Preparation-Tracker.git
cd Placement-Preparation-Tracker
```

### 2️⃣ Install Dependencies Natively
Ensure you have **Node v24+** installed. Install both frontend and backend dependencies using the deterministic lockfiles:
```bash
cd backend && npm ci
cd ../frontend && npm ci
```

### 3️⃣ Setup Environment Secrets (`.env`)
You must construct the secure environment files out of the safe `.example` templates.
- **Backend (.env)**
  ```bash
  cd ../backend
  cp .env.example .env
  ```
  Open `backend/.env` and insert your **`MONGODB_URI`** connection string (either Localhost `mongodb://localhost:27017/placement_tracker` or Atlas Cluster) and a strong **`JWT_SECRET`**.

- **Frontend (.env)**
  ```bash
  cd ../frontend
  cp .env.example .env
  ```
  Open `frontend/.env` and ensure `VITE_API_BASE_URL` correctly targets your local node server port (`http://localhost:5000/api/v1`).

### 4️⃣ Boot the Platform 

**Terminal 1 (Backend Initialization & Server)**:
```bash
cd backend
npm run fix:db       # Destroys legacy schema models
npm run seed:admin   # Seeds the highest-level Admin payload natively (Requires MONGODB_URI)
npm start            # Starts the Node Server (Port 5000)
```

**Terminal 2 (Frontend Interface)**:
```bash
cd frontend
npm run dev          # Fires up Vite Native Server (Port 5173)
```

Done! You can verify backend compilation is healthy by navigating to [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health). The main application interface lives at [http://localhost:5173](http://localhost:5173).

---
## 📦 Project Structure overview

- `frontend/` - React + Vite + Tailwind frontend application
- `backend/` - Node.js + Express + MongoDB securely locked API
- `frontend_prd.md` / `backend_prd.md` - Product requirements trackers
- `frontend_task_checklist.md` - Implementation progression tracker
- `.nvmrc` - Native node-version locking

*Ensure you consult `frontend/DEPLOYMENT_CHECKLIST.md` before physically publishing any production builds to Vercel/Render!*