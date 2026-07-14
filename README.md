# Campus Service Request Management System

A web app where students can submit service requests (like fixing a printer or cleaning a spill) and staff can track and manage them.

Built with: **React** (frontend), **Express** (backend), **SQLite** (database)

---

**Created by Mr. Lloyd Christopher F. Dacles, MIS, CITSMP, DBMP, CPAA, ITPO, CDSA**

---

## Features

### Phase 1 — Core
- **User accounts** — Sign up and log in. Three roles: Student, Staff, Admin
- **Submit requests** — Pick a category (IT, Facilities, Cleaning, etc.), describe the issue, set priority
- **Dashboard** — See all your requests. Filter by status or priority
- **Status tracking** — Requests move through: Submitted → In Progress → Resolved → Closed
- **Admin panel** — Staff/Admin can change status and assign requests to people

### Phase 2 — Communication
- **Request detail page** — Click any request to see full info, comments, and files
- **Status timeline** — Visual progress bar showing where your request is at
- **Comments** — Staff can add public replies or **internal notes** (hidden from students)
- **File uploads** — Attach images, documents, or any file (max 10MB)
- **Notifications** — Bell icon in the navbar. Get notified when status changes or someone comments

### UI Enhancements
- **Dark mode** — Toggle in the navbar, remembers your preference
- **Toast notifications** — Smooth pop-up messages when you submit, comment, upload, or change status
- **Skeleton loaders** — Animated placeholders while data loads (no more "Loading..." text)
- **Smooth animations** — Cards fade and slide in, buttons respond on click
- **Empty states** — Friendly messages with icons when there's nothing to show
- **Mobile friendly** — Hamburger menu, responsive layout
- **Live notification polling** — Bell icon checks for updates every 15 seconds

### Phase 3 — Analytics & Admin Power
- **Analytics dashboard** — Stats overview (total, resolved, avg time), bar charts by status/priority/category, and a 30-day activity chart. Only staff/admin can view
- **Request templates** — Admins can create reusable templates. Staff can browse them when creating requests
- **Auto-routing** — Set rules to auto-assign requests based on category (e.g., all IT issues go to the IT staff member)
- **Approval workflow** — Critical requests from students go to a "pending approval" state. Staff/admin can approve or reject them
- **New admin nav links** — Analytics, Templates, and Approvals pages in the navbar for staff/admin

### Phase 4 — Scale & Polish
- **Pagination** — Request lists are paginated (20 per page). Navigate with Prev/Next buttons
- **Search** — Search requests by title, description, or ID number. Works with filters
- **Mobile responsive** — Fully responsive design with two breakpoints (768px tablet, 420px phone). All pages work on mobile including auth, dashboard, detail, analytics, templates, and approvals
- **Dynamic API URL** — Automatically detects the correct server IP so mobile devices and the Xcode Simulator can connect
- **Pending Approval** — Added to status filters and badge colors
- **Admin page renamed** to "Manage" for clarity
- **Analytics dashboard** — Stats overview (total, resolved, avg time), bar charts by status/priority/category, and a 30-day activity chart. Only staff/admin can view
- **Request templates** — Admins can create reusable templates. Staff can browse them when creating requests
- **Auto-routing** — Set rules to auto-assign requests based on category (e.g., all IT issues go to the IT staff member)
- **Approval workflow** — Critical requests from students go to a "pending approval" state. Staff/admin can approve or reject them
- **New admin nav links** — Analytics, Templates, and Approvals pages in the navbar for staff/admin

---

## How to Run

### 1. Start the Backend
```bash
cd backend
npm install
node src/db/init.js    # creates the database tables
npm run dev            # starts on http://localhost:5001
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173
```

### 3. Open the App
Go to **http://localhost:5173** in your browser.

---

## Test Accounts

| Email | Password | Role |
|---|---|---|
| student@test.com | pass123 | Student — can create and view own requests |
| admin@test.com | pass123 | Admin — can see everything, assign, update status |
| staff@test.com | pass123 | Staff — same as admin for now |

---

## Project Structure

```
Campus-Service-RMS/
├── backend/
│   ├── src/
│   │   ├── db/            # Database setup
│   │   ├── middleware/     # Auth & permission checks
│   │   ├── routes/        # API endpoints
│   │   └── index.js       # Server entry point
│   ├── uploads/           # Uploaded files stored here
│   └── data/              # SQLite database file
└── frontend/
    └── src/
        ├── components/    # Reusable UI pieces (Navbar, NotificationBell)
        ├── context/       # Auth state + Toast notifications
        ├── pages/         # Each page of the app
        └── api.js         # Connects frontend to backend
```

---

## API Endpoints

| Method | Endpoint | What it does |
|---|---|---|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Log in |
| GET | /api/auth/me | Get current user |
| GET | /api/requests | List requests (with filters) |
| POST | /api/requests | Submit a request |
| GET | /api/requests/:id | Get one request |
| PATCH | /api/requests/:id/status | Change status (staff/admin) |
| PATCH | /api/requests/:id/assign | Assign to someone (staff/admin) |
| GET | /api/comments/request/:id | Get comments |
| POST | /api/comments/request/:id | Add comment |
| POST | /api/attachments/request/:id | Upload file |
| GET | /api/attachments/request/:id | List files |
| GET | /api/attachments/:id/download | Download file |
| GET | /api/notifications | Get notifications |
| GET | /api/notifications/unread-count | Unread count |
| PATCH | /api/notifications/:id/read | Mark one as read |
| PATCH | /api/notifications/read-all | Mark all as read |
| GET | /api/analytics | Get stats (staff/admin) |
| GET | /api/templates | List templates (staff/admin) |
| GET | /api/templates/public | List templates (all users) |
| POST | /api/templates | Create template (admin) |
| DELETE | /api/templates/:id | Delete template (admin) |
| GET | /api/routing | List routing rules (staff/admin) |
| POST | /api/routing | Create rule (admin) |
| DELETE | /api/routing/:category | Delete rule (admin) |
| GET | /api/approvals/pending | List pending approvals |
| PATCH | /api/approvals/:id/review | Approve or reject |

---

## Tech Stack

- **Frontend:** React, React Router, Axios, Vite
- **Backend:** Node.js, Express, better-sqlite3, JWT, multer
- **Database:** SQLite (swap to PostgreSQL by changing `backend/src/db/pool.js`)
