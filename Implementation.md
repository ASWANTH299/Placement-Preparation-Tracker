# Admin Role System — Implementation Plan

## Summary

Implement a complete admin system with secure admin creation, role-based access control (RBAC), admin API routes, and fully functional admin frontend pages with a premium design.

## Current State Assessment

The codebase already has **significant scaffolding** in place:

| Component | Status | Gap |
|---|---|---|
| User model `role` field | ✅ Already has `role: enum ['student', 'admin']` | None |
| JWT with role in payload | ✅ `generateToken(id, email, role)` already includes role | None |
| Auth middleware | ✅ Extracts user from JWT, attaches to `req.user` | None |
| Role middleware (`isAdmin`) | ✅ `roleMiddleware(['admin'])` exists | None |
| Admin routes mounting | ✅ `app.use('/api/v1/admin', authMiddleware, roleMiddleware(['admin']), adminRoutes)` | None |
| Admin controller | ⚠️ Has all CRUD + analytics but redundantly checks `req.user.role` inside every handler | Remove redundant checks (middleware already handles it) |
| Admin seeding script | ❌ Missing | Create `scripts/createAdmin.js` |
| `ADMIN_NAME` env var | ❌ Missing from `.env` | Add `ADMIN_NAME` |
| `POST /admin/users` (create user) | ❌ Missing from routes/controller | Add endpoint |
| `GET /admin/analytics` dedicated route | ❌ Missing (dashboard stats exist but not at `/analytics`) | Add route alias |
| Admin service (frontend) | ⚠️ Minimal — only 4 functions | Expand with full CRUD |
| Admin Dashboard UI | ⚠️ Basic metric cards only | Upgrade to premium UI |
| User Management UI | ⚠️ Read-only table, no edit/delete | Add full CRUD |
| Learning Path Management UI | ⚠️ Create-only, no edit/delete | Add edit/delete |
| Question Management UI | ⚠️ Create-only, no edit/delete | Add edit/delete |
| Admin Navbar | ⚠️ Functional but basic | Add logout + mobile menu |
| Login redirect for admin | ✅ Already routes admin → `/admin-dashboard` | None |
| Frontend admin route protection | ✅ `AdminRoute` component exists | None |

## Proposed Changes

### Backend — Admin Seed Script

#### [NEW] [createAdmin.js](file:///e:/Project/Placement-Preparation-Tracker/backend/scripts/createAdmin.js)
- Standalone Node.js script that reads `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` from `.env`
- Connects to MongoDB, checks if admin email already exists
- Hashes password with bcrypt, creates user with `role: 'admin'`
- Prevents duplicate creation; logs result and exits
- Add `npm run seed:admin` script to `package.json`

---

### Backend — Environment Config

#### [MODIFY] [.env](file:///e:/Project/Placement-Preparation-Tracker/backend/.env)
- Add `ADMIN_NAME=Admin` alongside existing `ADMIN_EMAIL` and `ADMIN_PASSWORD`

#### [MODIFY] [.env.example](file:///e:/Project/Placement-Preparation-Tracker/backend/.env.example)
- Add `ADMIN_NAME=Admin`

---

### Backend — Controller & Routes Cleanup

#### [MODIFY] [adminController.js](file:///e:/Project/Placement-Preparation-Tracker/backend/src/controllers/adminController.js)
- Remove redundant `if (req.user.role !== 'admin')` checks from **every handler** (the `roleMiddleware` already enforces this at the route level)
- Add `createUser` handler for `POST /admin/users` — creates a student user with hashed password
- Add `getAnalytics` handler for `GET /admin/analytics` — returns `{ totalUsers, activeUsers, averageProgress }`

#### [MODIFY] [adminRoutes.js](file:///e:/Project/Placement-Preparation-Tracker/backend/src/routes/adminRoutes.js)
- Add `POST /users` → `adminController.createUser`
- Add `GET /analytics` → `adminController.getAnalytics`

#### [MODIFY] [package.json](file:///e:/Project/Placement-Preparation-Tracker/backend/package.json)
- Add `"seed:admin": "node scripts/createAdmin.js"` to scripts

---

### Frontend — Admin Service Expansion

#### [MODIFY] [adminService.js](file:///e:/Project/Placement-Preparation-Tracker/frontend/src/services/adminService.js)
- Add: `createUser`, `updateUser`, `deleteUser`
- Add: `getUserDetail`
- Add: `updateLearningPath`, `deleteLearningPath`
- Add: `updateCompanyQuestion`, `deleteCompanyQuestion`
- Add: `getAnalytics`

---

### Frontend — Premium Admin Dashboard

#### [MODIFY] [AdminDashboard.jsx](file:///e:/Project/Placement-Preparation-Tracker/frontend/src/components/Dashboard/AdminDashboard.jsx)
- Redesign with premium glassmorphism stat cards with icons and gradient accents
- Add animated number counters
- Add charts section placeholder with styled cards
- Show 8 key metrics from the API (total users, active users, new users, avg progress, questions solved, avg questions/student, mock interviews, avg score)
- Add recent activity feed with styled timeline

---

### Frontend — User Management (Full CRUD)

#### [MODIFY] [UserManagement.jsx](file:///e:/Project/Placement-Preparation-Tracker/frontend/src/components/Admin/UserManagement.jsx)
- Add Create User modal with form (name, email, password, university, department)
- Add Edit User modal (pre-filled form)
- Add Delete User confirmation dialog with `confirmDelete: true`
- Add pagination controls
- Add status badge styling
- Premium table design with hover effects

---

### Frontend — Learning Path Management (Full CRUD)

#### [MODIFY] [LearningPathManagement.jsx](file:///e:/Project/Placement-Preparation-Tracker/frontend/src/components/Admin/LearningPathManagement.jsx)
- Add Edit modal for existing learning paths
- Add Delete confirmation
- Improve card layout with status badges and action buttons

---

### Frontend — Question Management (Full CRUD)

#### [MODIFY] [QuestionManagement.jsx](file:///e:/Project/Placement-Preparation-Tracker/frontend/src/components/Admin/QuestionManagement.jsx)
- Add Edit modal for existing questions
- Add Delete confirmation
- Add difficulty badge styling (Easy=green, Medium=amber, Hard=red)
- Add company filter/search

---

### Frontend — Admin Navbar Enhancement

#### [MODIFY] [AdminNavbar.jsx](file:///e:/Project/Placement-Preparation-Tracker/frontend/src/components/Common/AdminNavbar.jsx)
- Add logout button with icon
- Add mobile hamburger menu
- Style with premium admin gradient theme

---

### Frontend — Admin Styles

#### [MODIFY] [index.css](file:///e:/Project/Placement-Preparation-Tracker/frontend/src/index.css)
- Add admin-specific utility classes (admin stat cards, admin tables, modals, badges)
- Add glassmorphism styles for admin panels
- Dark mode support for admin components

## Open Questions

> [!IMPORTANT]
> **Admin seeding approach**: The `.env` already has `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Should the admin also be auto-seeded on server startup (like the existing `seedDefaultContent` does for learning paths/questions), or strictly only via the `scripts/createAdmin.js` CLI script? I'll implement **both** — CLI script for explicit control + auto-seed on startup if no admin exists.

> [!NOTE]
> The existing registration endpoint already safely ignores any `role` field from the request body (line 72-78 of authController.js), so no changes are needed there.

## Verification Plan

### Automated Tests
- Run `node scripts/createAdmin.js` and verify admin user is created in DB
- Run backend server (`npm run dev`) and confirm no startup errors
- Test login with admin credentials and verify JWT contains `role: "admin"`
- Test admin API endpoints (GET `/admin/users`, POST `/admin/users`, etc.) with admin token
- Test that student token gets 403 on admin endpoints
- Run frontend dev server and verify admin dashboard renders with real data

### Manual Verification
- Login as admin → redirected to `/admin-dashboard`
- Test full CRUD on Users, Learning Paths, Questions pages
- Test logout from admin navbar
- Verify responsive design on mobile viewport
- Test dark mode toggle for admin pages
