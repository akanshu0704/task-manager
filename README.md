# TaskFlow — Team Task Manager

A full-stack team task management app with role-based access, 3D interactive UI, Kanban board, and real-time task tracking.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite, Tailwind CSS v4, Framer Motion |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (7-day tokens) |
| UI Style | Glassmorphism + 3D CSS transforms + animated gradients |

## Features

- **Authentication** — Signup/Login with JWT, role-based (Admin/Member)
- **Dashboard** — Live stats, progress bars, recent tasks, active projects
- **Projects** — Create/manage projects with colors, deadlines, members
- **Kanban Board** — Per-project task board with columns: To Do / In Progress / Review / Done
- **Task Management** — Full CRUD, priority levels, due dates, assignment, status tracking
- **Team View** — See all team members with roles
- **3D UI** — Mouse-tracking 3D card tilt, glassmorphism, glowing orbs, gradient animations

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Backend

```bash
cd backend
npm install
# Edit .env — set your MONGO_URI
npm run dev        # runs on :5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # runs on :5173
```

### 3. MongoDB Options

**Local:** Install MongoDB Community at https://www.mongodb.com/try/download/community

**Atlas (free cloud):**
1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Get your connection string
4. Replace `MONGO_URI` in `backend/.env`

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/projects | List user's projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| PATCH | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| GET | /api/tasks | List tasks (filterable) |
| POST | /api/tasks | Create task |
| PATCH | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/tasks/dashboard/stats | Dashboard statistics |
| GET | /api/users | List all users |

## Deployment (Railway)

1. Push this repo to GitHub
2. Create a Railway project at https://railway.app
3. Add two services: one for backend, one for frontend
4. Set environment variables (MONGO_URI, JWT_SECRET) in Railway
5. For MongoDB: use Railway's MongoDB plugin or Atlas
