# CollabTask v2 — Team Project Management Platform

A full-stack, production-grade project management app built with **React**, **Node.js**, **Express**, **MongoDB**, and **Socket.IO**.

---

## What's Inside

| Feature | Details |
|---|---|
| **Kanban Board** | Drag & drop tasks across To Do / In Progress / Completed columns using `@dnd-kit` |
| **Real-time Updates** | Socket.IO — task moves, new tasks, and member additions sync live across all open browsers |
| **Team Invites** | Invite teammates to projects by email — they're notified instantly |
| **Task Comments** | Add, view, and delete comments on any task with a full activity log |
| **Smart Notifications** | In-app toasts + persistent notification center on Profile page |
| **Search & Filter** | Search tasks by title/description; filter by priority and assignee |
| **Dashboard Stats** | 5 stat cards: total tasks, completed, in-progress, overdue, projects |
| **Auth** | JWT-based signup/login — tokens stored in localStorage |

---

## Tech Stack

```
Frontend                  Backend
────────────────────────  ─────────────────────────
React 18                  Node.js + Express
React Router v6           Socket.IO (real-time)
@dnd-kit (drag & drop)    MongoDB + Mongoose
Socket.IO client          JWT + bcryptjs
Axios                     REST API
date-fns                  
Plus Jakarta Sans (font)  
```

---

## Project Structure

```
collabtask/
├── backend/
│   ├── config/db.js
│   ├── middleware/auth.js          # JWT protection
│   ├── models/
│   │   ├── User.js                 # Notifications array
│   │   ├── Project.js              # inviteCode, members[]
│   │   └── Task.js                 # comments[], activity[], position
│   ├── routes/
│   │   ├── auth.js                 # signup, login, /me, /users
│   │   ├── projects.js             # CRUD + /invite + /members/:id
│   │   ├── tasks.js                # CRUD + /comments + /bulk/reorder + /stats/me
│   │   └── notifications.js
│   ├── server.js                   # Express + Socket.IO with JWT room auth
│   ├── .env
│   └── .env.example
│
├── frontend/
│   ├── public/index.html
│   └── src/
│       ├── components/
│       │   ├── layout/             # Sidebar + live toast system
│       │   ├── projects/           # ProjectModal, MembersPanel
│       │   └── tasks/              # TaskModal (details + comments + activity)
│       ├── hooks/
│       │   ├── useAuth.js          # Auth context
│       │   └── useSocket.js        # Socket.IO hooks (useProjectSocket, useNotificationSocket)
│       ├── pages/
│       │   ├── LoginPage.js / SignupPage.js
│       │   ├── DashboardPage.js    # Stats, search, filter, project grid
│       │   ├── ProjectPage.js      # Kanban board with DnD
│       │   └── ProfilePage.js      # Notification center + stats
│       ├── styles/global.css       # Design tokens + utility classes
│       ├── utils/
│       │   ├── api.js              # Axios instance with auto-token
│       │   └── helpers.js          # initials, greeting, formatDate, colors
│       └── App.js
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally **or** a MongoDB Atlas URI

---

### 1. Clone & enter

```bash
git clone https://github.com/yourusername/collabtask.git
cd collabtask
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collabtask
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev    # uses nodemon for auto-reload
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

`frontend/.env` (defaults work out of the box):

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_NAME=CollabTask
```

Start the frontend:

```bash
npm start
```

Open **http://localhost:3000** — create an account and start building.

---

## API Reference

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/signup` | ❌ | Register |
| POST | `/login` | ❌ | Login, returns JWT |
| GET | `/me` | ✅ | Current user |
| GET | `/users?search=` | ✅ | Search users |

### Projects — `/api/projects`

| Method | Path | Description |
|---|---|---|
| POST | `/` | Create project |
| GET | `/` | My projects (with task stats) |
| GET | `/:id` | Single project |
| PUT | `/:id` | Update project |
| DELETE | `/:id` | Delete project + all tasks |
| POST | `/:id/invite` | Invite member by email |
| DELETE | `/:id/members/:userId` | Remove member |

### Tasks — `/api/tasks`

| Method | Path | Description |
|---|---|---|
| POST | `/` | Create task (notifies assignee) |
| GET | `/?project=&assignedTo=&status=&priority=&search=` | Filtered list |
| PUT | `/:id` | Update task (auto activity log) |
| DELETE | `/:id` | Delete task |
| POST | `/:id/comments` | Add comment |
| DELETE | `/:id/comments/:commentId` | Remove comment |
| PUT | `/bulk/reorder` | Persist drag-drop order |
| GET | `/stats/me` | My task stats (total, completed, inprogress, todo, overdue) |

### Notifications — `/api/notifications`

| Method | Path | Description |
|---|---|---|
| GET | `/` | All notifications + unreadCount |
| PUT | `/read-all` | Mark all read |
| PUT | `/:notifId/read` | Mark one read |

---

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join:project` | `projectId` | Join project room |
| `leave:project` | `projectId` | Leave project room |

### Server → Client (project room)
| Event | Payload |
|---|---|
| `task:created` | Full task object |
| `task:updated` | Full task object |
| `task:deleted` | `{ taskId }` |
| `task:reordered` | `{ updates }` |
| `project:member_added` | `{ member }` |

### Server → Client (user room)
| Event | Payload |
|---|---|
| `notification:new` | `{ message }` |

---

## Environment Variables

### Backend

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `5000` | |
| `MONGODB_URI` | `mongodb://localhost:27017/collabtask` | Use Atlas URI for production |
| `JWT_SECRET` | — | **Change this** in production |
| `JWT_EXPIRES_IN` | `7d` | |
| `FRONTEND_URL` | `http://localhost:3000` | For CORS + Socket.IO |

### Frontend

| Variable | Default |
|---|---|
| `REACT_APP_API_URL` | `http://localhost:5000/api` |
| `REACT_APP_SOCKET_URL` | `http://localhost:5000` |
| `REACT_APP_NAME` | `CollabTask` |

---

## Deployment

### Backend → Railway / Render
1. Push to GitHub
2. Connect repo, set env vars in dashboard
3. Start command: `npm start`
4. Set `FRONTEND_URL` to your deployed frontend URL

### Frontend → Vercel / Netlify
1. Set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` to deployed backend
2. Build command: `npm run build`
3. Publish directory: `build`

---


## License

MIT — free to use, fork, and deploy.
