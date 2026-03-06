# Placement-Preparation-Tracker

Full-stack Placement Preparation Tracker (React + Vite frontend, Node + Express backend, MongoDB database).

## Project Structure

- `frontend/` - React + Vite + Tailwind frontend app
- `backend/` - Node.js + Express + MongoDB API server
- `frontend_prd.md` - frontend product requirements
- `backend_prd.md` - backend product requirements
- `frontend_task_checklist.md` - implementation audit tracker

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local installation or MongoDB Atlas)
- Git

## 1) Clone and Open

1. Clone the repository.
2. Open the project root folder:
	- `Placement-Preparation-Tracker`
3. Install root dependencies (for one-command start):
	- `npm install`

## 2) Database Setup (MongoDB)

### Option A: Local MongoDB

1. Start MongoDB service on your machine.
2. Use this URI in backend `.env`:
	- `MONGODB_URI=mongodb://localhost:27017/placement_tracker`

### Option B: MongoDB Atlas

1. Create a cluster and database user in Atlas.
2. Get connection string and set in backend `.env`:
	- `MONGODB_URI=<your-atlas-uri>`

## 3) Backend Setup

1. Open terminal in `backend`.
2. Install dependencies:
	- `npm install`
3. Create `.env` (copy from `.env.example`):
	- Windows PowerShell: `Copy-Item .env.example .env`
4. Update required `.env` values:
	- `PORT=5000`
	- `NODE_ENV=development`
	- `MONGODB_URI=<your-mongodb-uri>`
	- `JWT_SECRET=<your-strong-secret>`
5. Start backend server:
	- `npm run start`

Backend runs at:
- `http://localhost:5000`
- Health check: `http://localhost:5000/api/v1/health`

## 4) Frontend Setup

1. Open terminal in `frontend`.
2. Install dependencies:
	- `npm install`
3. Run development server:
	- `npm run dev`
4. Build production bundle:
	- `npm run build`

Frontend runs at:
- `http://localhost:5173` (default Vite port)

## Environment

- API base URL is configured in `frontend/src/services/api.js`.
- Default base URL: `http://localhost:5000/api/v1`.

## 5) First Run Verification

1. Confirm backend health:
	- `GET http://localhost:5000/api/v1/health`
2. Open frontend app and test:
	- Register as Student or Admin
	- Login with selected role
	- Verify dashboard loads after login

## 6) Useful Commands

### Backend
- `npm run start` - start backend server
- `npm run dev` - start backend with nodemon

### Frontend
- `npm run dev` - start frontend dev server
- `npm run build` - production build

## 7) Quick Start (2 Terminals)

Use this when you want to run the full stack quickly.

### Terminal 1 (Backend)

```powershell
Set-Location backend
if (-not (Test-Path ".env")) { Copy-Item .env.example .env }
npm install
npm run start
```

### Terminal 2 (Frontend)

```powershell
Set-Location frontend
npm install
npm run dev
```

Open:
- Frontend: `http://localhost:5173`
- Backend Health: `http://localhost:5000/api/v1/health`

## 8) Quick Start (Single Command)

After running `npm install` in project root, use:

```powershell
npm run dev:all:
```

Additional root scripts:
- `npm run dev:backend` - run backend only
- `npm run dev:frontend` - run frontend only

## Deployment Readiness

Use the deployment checklist in `frontend/DEPLOYMENT_CHECKLIST.md` before publishing.