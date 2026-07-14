# Campus Service Request Management System

A web app where students can submit service requests (like fixing a printer or cleaning a spill) and staff can track and manage them.

Built with: **React** (frontend), **Express** (backend), **SQLite** (database)

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
- **Comments** — Staff can add public replies or **internal notes** (hidden from students)
- **File uploads** — Attach images, documents, or any file (max 10MB)
- **Notifications** — Bell icon in the navbar. Get notified when status changes or someone comments

### Upcoming
- Analytics dashboard with charts
- Request templates and auto-routing
- Approval workflows
- Mobile-friendly design

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
        ├── context/       # Auth state management
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

---

## Tech Stack

- **Frontend:** React, React Router, Axios, Vite
- **Backend:** Node.js, Express, better-sqlite3, JWT, multer
- **Database:** SQLite (swap to PostgreSQL by changing `backend/src/db/pool.js`)
