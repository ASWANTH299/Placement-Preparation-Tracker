# Admin System Implementation — Task Tracker

## 1. Admin Seed Script
- [ ] Add `ADMIN_NAME` to `.env` and `.env.example`
- [ ] Create `scripts/createAdmin.js` (CLI-only, no auto-seed)
- [ ] Add `seed:admin` npm script to backend `package.json`

## 2. Backend API Completion
- [ ] Remove redundant role checks from `adminController.js`
- [ ] Add `createUser` handler (POST /admin/users) with temp password & mustResetPassword flag
- [ ] Add admin audit logging utility
- [ ] Add rate limiting for `/admin/*` routes
- [ ] Update admin routes with new endpoints

## 3. Analytics Enhancement
- [ ] Add `getAnalytics` handler (GET /admin/analytics) with 8 metrics
- [ ] Wire analytics route

## 4. Frontend Service Updates
- [ ] Expand `adminService.js` with full CRUD + analytics

## 5. Admin UI Implementation
- [ ] Admin Dashboard — premium redesign with 8 metrics + activity feed
- [ ] User Management — full CRUD with modals, pagination, search, toast
- [ ] Learning Path Management — edit/delete modals, search, toast
- [ ] Question Management — edit/delete modals, search, filtering, toast
- [ ] Admin Navbar — logout, mobile menu, premium styling
- [ ] Admin CSS — glassmorphism, dark mode, modals, badges
