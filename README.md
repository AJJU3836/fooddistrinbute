# HashItOut — Intelligent Food Redistribution Platform

A full-stack, production-ready web platform connecting **food donors** (restaurants, hostels, individuals) with **NGOs** — powered by intelligent matching, real-time Socket.io tracking, and analytics.

---

## 🗂️ Project Structure

```
HashitOut/
├── client/                  # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── contexts/        # AuthContext, SocketContext
│   │   ├── lib/             # Axios API client
│   │   ├── pages/           # Donor / NGO / Admin pages
│   │   ├── components/      # Layout, FoodCard, TrackingTimeline
│   │   └── App.jsx          # Router + providers
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── server/                  # Node.js + Express + Socket.io
    ├── src/
    │   ├── config/          # db.js (MongoDB connection)
    │   ├── models/          # User, FoodListing, Assignment, Analytics
    │   ├── routes/          # auth, food, ngo, admin, analytics, map
    │   ├── middleware/       # auth.js (JWT), roles.js (RBAC)
    │   ├── services/        # matchingEngine.js, notificationService.js
    │   ├── sockets/         # index.js (Socket.io handlers)
    │   └── scripts/         # seed.js
    └── package.json
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Backend

```bash
cd server
npm install
```

Edit `server/.env`:
```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/hashitout
JWT_SECRET=your_secret_here
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

```bash
# Seed demo data
npm run seed

# Start development server
npm run dev
```

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at **http://localhost:5173**

---

## 🔐 Demo Accounts (after seed)

| Role  | Email               | Password  |
|-------|---------------------|-----------|
| Donor | donor@demo.com      | donor123  |
| NGO   | ngo@demo.com        | ngo123    |
| Admin | admin@demo.com      | admin123  |

---

## 🧠 Intelligent Matching Algorithm

```
Score = (0.4 × proximity) + (0.4 × urgency) + (0.2 × quantity_match)

proximity  = 1 - (distance_km / 50km)
urgency    = 1 - (hours_left / 72h)   ← higher score = more urgent
quantity   = min(food_qty / ngo_capacity, 1)
```

Only NGOs within **50km** and score above **0.15** appear in matches.

---

## ⚡ Real-time Socket.io Events

| Event            | Direction          | When                         |
|------------------|--------------------|------------------------------|
| `food:new`       | Server → NGO room  | New food listed by donor     |
| `food:claimed`   | Server → Donor     | NGO claims a listing         |
| `food:status`    | Server → All roles | Assignment status changes    |
| `analytics:update` | Server → Admins  | Metrics updated              |

---

## 🌐 API Summary

| Method | Endpoint                        | Auth  | Description            |
|--------|---------------------------------|-------|------------------------|
| POST   | /api/auth/register              | —     | Register               |
| POST   | /api/auth/login                 | —     | Login + JWT            |
| GET    | /api/food                       | Auth  | Listings (role-aware)  |
| POST   | /api/food                       | Donor | Create listing         |
| GET    | /api/food/matches/:id           | Auth  | NGO match scores       |
| POST   | /api/ngo/claim/:foodId          | NGO   | Claim food             |
| PATCH  | /api/ngo/assignment/:id/status  | NGO   | Update status          |
| GET    | /api/admin/overview             | Admin | Platform stats         |
| GET    | /api/analytics                  | Admin | Charts data            |
| GET    | /api/map/pins                   | Auth  | All map markers        |

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd client
npm run build
# Deploy /dist to Vercel
```

### Backend → Render / Railway
- Set all environment variables in dashboard
- Build command: `npm install`
- Start command: `node src/index.js`

### Database → MongoDB Atlas
- Free M0 cluster is sufficient
- Enable network access for 0.0.0.0/0

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS        |
| Maps      | Leaflet + react-leaflet (OpenStreetMap) |
| Charts    | Recharts                            |
| Backend   | Node.js, Express.js (ESM)           |
| Database  | MongoDB Atlas, Mongoose ODM         |
| Real-time | Socket.io v4                        |
| Auth      | JWT (jsonwebtoken + bcryptjs)       |
| Icons     | Lucide React                        |
