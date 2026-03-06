# Frontend Deployment Checklist

## Build and Runtime

- [ ] `npm install` completes with no dependency errors
- [ ] `npm run build` passes without compile errors
- [ ] Static assets generated in `dist/`
- [ ] Production server serves SPA routes correctly (fallback to `index.html`)

## Configuration

- [ ] API base URL is set for target environment
- [ ] CORS is configured correctly on backend
- [ ] Environment variables (if used) are documented
- [ ] Browser cache strategy is configured by hosting platform

## Security and Auth

- [ ] JWT auth flow verified in production-like environment
- [ ] Protected routes redirect unauthenticated users to `/login`
- [ ] Admin routes block non-admin users with `/403`
- [ ] Sensitive tokens are not logged in console

## UX Quality

- [ ] Login/register/forgot/reset flows tested end-to-end
- [ ] Mobile layout tested for key pages
- [ ] Keyboard navigation and focus visibility verified
- [ ] Error pages (`/403`, `/404`, `/500`) render as expected

## API Integration

- [ ] Learning paths page reads backend data
- [ ] Company questions page reads backend data
- [ ] Mock interviews page reads backend data
- [ ] Notes page reads backend data
- [ ] Leaderboard page reads backend data

## Release

- [ ] Version/tag prepared
- [ ] Smoke test performed on deployed URL
- [ ] Rollback plan documented
