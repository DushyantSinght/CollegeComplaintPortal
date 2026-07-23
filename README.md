# College Complaint Portal — MEAN Stack Project

A role-based complaint management system for college campuses. Students file
complaints (hostel, academics, facilities, other) with a priority level;
admins track and update status, reply in a discussion thread, and view
portal-wide analytics. Every status change and admin reply triggers an
email notification to the student.

## Features
- Role-based auth (student / admin) with JWT + bcrypt
- File, track, and filter complaints by status, category, and priority
- Per-complaint discussion thread (student ↔ admin back-and-forth notes)
- Admin analytics dashboard: totals, resolution rate, avg. resolution time,
  breakdowns by status/category/priority, and an 8-week trend chart
- Student "My Stats" summary on the dashboard
- Full profile page: edit account details, change password
- Light / dark mode toggle (persists across sessions)
- Email notifications on status changes and admin replies (Nodemailer)

## Tech Stack
- **M**ongoDB — data storage (users, complaints)
- **E**xpress.js — REST API
- **A**ngular — frontend SPA (standalone components, Angular 19)
- **N**ode.js — server runtime
- JWT for auth, bcrypt for password hashing, Nodemailer for email
- Charts are hand-rolled SVG/CSS components — no charting library dependency

---

## 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — point to your local MongoDB or a MongoDB Atlas cluster
- `JWT_SECRET` — any long random string
- `EMAIL_USER` / `EMAIL_PASS` — a Gmail address + an **App Password**
  (not your normal password — generate one at
  https://myaccount.google.com/apppasswords).
  If you skip this, the app still works — emails are just logged to the
  console instead of sent, so you can demo without setting up email.

Run it:
```bash
npm run dev      # with nodemon, auto-restarts
# or
npm start
```

Server runs on `http://localhost:5001` (set by `PORT` in `.env.example`;
falls back to 5000 if `PORT` isn't set at all). You should see:
```
MongoDB connected: ...
Server running on port 5001
```

### API Endpoints
| Method | Route                          | Access        | Description                        |
|--------|---------------------------------|---------------|-------------------------------------|
| POST   | /api/auth/register              | Public        | Register (student or admin)        |
| POST   | /api/auth/login                 | Public        | Login, returns JWT                 |
| GET    | /api/auth/me                    | Logged in     | Current user profile               |
| PUT    | /api/auth/profile                | Logged in     | Update name/email/studentId/department |
| PUT    | /api/auth/password                | Logged in     | Change password                    |
| POST   | /api/complaints                 | Student       | File a complaint (with priority)   |
| GET    | /api/complaints                 | Logged in     | List complaints (own/all, filterable by status/category/priority) |
| GET    | /api/complaints/stats           | Logged in     | Analytics: totals, breakdowns, weekly trend |
| GET    | /api/complaints/:id             | Logged in     | Get one complaint                  |
| PUT    | /api/complaints/:id/status      | Admin         | Update status (sends email)        |
| PUT    | /api/complaints/:id/priority     | Admin         | Update priority                    |
| POST   | /api/complaints/:id/comments      | Logged in     | Add a discussion note (admin replies email the student) |
| DELETE | /api/complaints/:id             | Owner/Admin   | Delete (student: pending only)      |

> Note: `/api/complaints/stats` is registered before `/api/complaints/:id` in
> the router — otherwise Express would treat "stats" as an `:id` param.

---

## 2. Frontend Setup

The `frontend/` folder is a complete, ready-to-run Angular CLI project
(standalone components, Angular 19 — no NgModule, using `app.config.ts` +
`app.routes.ts` + `provideHttpClient`). `node_modules` isn't included in
this package to keep it small, so just install and serve:

```bash
cd frontend
npm install
ng serve -o
# or: npm start
```

Visit `http://localhost:4200`. Register a student account, then register a
second account with role "admin" (the register form has a role dropdown —
in a real deployment you'd lock this down, but for a college demo it's the
simplest way to create your first admin).

`frontend-src/` is a mirror of `frontend/src/` kept as the "source of
truth" for the app code (no build tooling, just the Angular source files).
If you ever regenerate the Angular project from scratch with `ng new`, copy
`frontend-src/app/*` and `frontend-src/styles.css` back into `frontend/src/`
to restore all functionality.

---

## 3. Deploying to Vercel

The backend and frontend deploy as **two separate Vercel projects** from the same repo (Root Directory set per-project). MongoDB needs to be Atlas (cloud), since Vercel has no persistent local storage for a self-hosted `mongod`.

**A. MongoDB Atlas**
1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register).
2. Database Access → add a database user (username/password).
3. Network Access → allow `0.0.0.0/0` (Vercel's serverless IPs are dynamic, so you can't whitelist a fixed IP).
4. Get your connection string (Atlas UI → Connect → Drivers) and add a database name to the path, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/complaint-portal`.

**B. Push to GitHub**
```bash
cd complaint-portal2
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<you>/complaint-portal2.git
git push -u origin main
```
(`.env` and `node_modules` are already excluded via `.gitignore` in both `backend/` and `frontend/` — don't remove those entries.)

**C. Deploy the backend**
1. [vercel.com/new](https://vercel.com/new) → import the repo → **Root Directory: `backend`**.
2. Vercel auto-detects Express and needs zero build configuration — `backend/server.js` matches Vercel's expected entry-file convention directly.
3. Before deploying, add Environment Variables (Project Settings → Environment Variables): `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, and optionally `EMAIL_HOST`/`EMAIL_PORT`/`EMAIL_USER`/`EMAIL_PASS`/`EMAIL_FROM`. (`PORT` isn't needed — Vercel wraps the Express app as a function regardless of what port `app.listen()` requests.)
4. Deploy, then copy the resulting URL (e.g. `https://complaint-portal-backend.vercel.app`).

**D. Point the frontend at the backend**
1. Open `frontend/src/environments/environment.production.ts` and replace the placeholder with your real backend URL + `/api`:
   ```ts
   export const environment = {
     production: true,
     apiUrl: 'https://complaint-portal-backend.vercel.app/api'
   };
   ```
2. Commit and push this change.

**E. Deploy the frontend**
1. [vercel.com/new](https://vercel.com/new) again → same repo → **Root Directory: `frontend`**.
2. Vercel auto-detects Angular. `frontend/vercel.json` is already set up with the two things Angular 19 needs that don't auto-detect cleanly:
   - `outputDirectory: "dist/frontend/browser"` — Angular's newer build system nests output one level deeper than older Angular versions, which otherwise causes a 404 after a successful build.
   - a rewrite rule sending every path to `index.html`, so refreshing on `/dashboard` or `/admin` doesn't 404 (Angular's client-side router needs `index.html` loaded first before it can take over).
3. Deploy. Visit the resulting URL — register a student and an admin account and test the full flow.

**Troubleshooting**
| Symptom | Likely cause |
|---|---|
| Frontend loads but API calls fail (CORS or network error in browser console) | `environment.production.ts` still has the placeholder URL, or you forgot to redeploy after changing it |
| 404 on any route except `/` | `vercel.json`'s `outputDirectory`/rewrite didn't apply — check it's in the `frontend` root, not `frontend/src` |
| Backend `MongoDB connection error` in Vercel's function logs | Atlas Network Access doesn't allow `0.0.0.0/0`, or `MONGO_URI` env var has a typo/wrong password |
| Env vars seem ignored | Vercel only applies new/changed env vars on the *next* deploy — trigger a redeploy after adding them |

---

## 4. Demo Flow for Viva

1. Register as a student → login → file a complaint, pick a category and priority
2. Check the "My Stats" row on the student dashboard update live
3. Register as admin (or login as admin) → open Admin Dashboard → see the complaint
4. Change status to "In Progress" then "Resolved", add a remark, bump the priority
5. Open the "Discussion" thread on the complaint and post a reply
6. Check the student's email inbox (or backend console log if email isn't configured) for the status/reply notifications
7. Switch to the "Analytics" tab to show the status/category/priority charts and the weekly trend
8. Login back as student → see updated status, priority, and the admin's reply in "My Complaints"
9. Open the Profile page (top nav) → update account details, change password
10. Toggle the sun/moon icon in the navbar to demo dark mode

## 5. Things You Can Say in the Viva
- **Auth**: JWT-based, password hashed with bcrypt, role stored in the token payload's user record and checked server-side on every protected route (not just hidden in the UI).
- **Authorization**: `protect` middleware verifies the JWT; `authorize('admin')` middleware restricts status/priority updates to admins only — enforced at the API level, so even a direct API call from a student would be rejected.
- **Notifications**: Nodemailer fires asynchronously on status change and on admin replies, so the API response isn't blocked waiting on the email server.
- **Data model**: Complaint references the User via ObjectId; populated on read for student name/email display in the admin view. Comments are embedded subdocuments so the whole discussion thread comes back in one query.
- **Analytics**: `/api/complaints/stats` computes everything in a single pass over the (role-filtered) complaint list — no separate aggregation pipeline needed at this scale, which keeps the logic easy to read and explain.
- **Charts**: the donut and bar charts are plain SVG/CSS components with no external charting library — the donut uses the classic `stroke-dasharray`/`stroke-dashoffset` percentage-circle trick.
- **Theming**: dark mode swaps a set of CSS custom properties via a `data-theme` attribute on `<html>`; the choice is persisted to `localStorage` and falls back to the OS-level `prefers-color-scheme` on first visit.

## 6. Possible Extensions (mention as "future work" if asked)
- File attachments for complaints (multer + cloud storage)
- Pagination on the admin dashboard for large complaint volumes
- SMS notifications alongside email
- Push notifications / in-app notification bell for new replies
