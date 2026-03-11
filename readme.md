# 🍽️ Campus Canteen Management App

A full-stack web application for managing a college canteen with real-time order tracking, AI integration, rewards system, and admin dashboard.

---

## 🚀 Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Node.js | v18+ | Runtime environment |
| Express.js | ^4.18.0 | Web server framework |
| MongoDB Atlas | Cloud | Database |
| Mongoose | ^7.0.0 | MongoDB ODM |
| Socket.io | ^4.6.0 | Real-time communication |
| JSON Web Token | ^9.0.0 | Authentication |
| bcryptjs | ^2.4.3 | Password hashing |
| dotenv | ^16.0.0 | Environment variables |
| cors | ^2.8.5 | Cross-origin requests |
| groq-sdk | ^0.3.0 | AI integration |
| nodemon | ^3.0.0 | Dev auto-restart |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | ^19.0.0 | UI framework |
| React DOM | ^19.0.0 | DOM rendering |
| React Router DOM | ^7.1.0 | Page navigation |
| Axios | ^1.6.0 | HTTP requests |
| Socket.io Client | ^4.6.0 | Real-time events |
| Vite | ^5.0.0 | Build tool |

---

## 📁 Project Structure

```
canteen-app/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   └── auth.js            # JWT auth middleware
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── MenuItem.js        # Menu item schema
│   │   ├── Order.js           # Order schema
│   │   └── Complaint.js       # Complaint schema
│   ├── routes/
│   │   ├── auth.js            # Login & register
│   │   ├── menu.js            # Menu CRUD
│   │   ├── orders.js          # Order management
│   │   ├── complaints.js      # Complaints
│   │   └── analytics.js       # Dashboard analytics
│   ├── .env                   # Environment variables
│   ├── .gitignore
│   └── server.js              # Entry point
│
└── frontend/
    └── vite-project/
        ├── src/
        │   ├── api/
        │   │   ├── axios.js       # Axios instance
        │   │   └── index.js       # All API functions
        │   ├── context/
        │   │   ├── AuthContext.jsx    # Auth state
        │   │   ├── CartContext.jsx    # Cart state
        │   │   └── SocketContext.jsx  # Socket connection
        │   ├── pages/
        │   │   ├── LoginPage.jsx      # Login & register
        │   │   ├── MenuPage.jsx       # Menu with filters
        │   │   ├── OrdersPage.jsx     # Orders & checkout
        │   │   ├── RewardsPage.jsx    # Points & tiers
        │   │   ├── ComplaintsPage.jsx # Raise complaints
        │   │   └── AdminDashboard.jsx # Admin panel
        │   ├── App.jsx            # Routing
        │   └── main.jsx           # Entry point
        ├── index.html
        ├── vite.config.js
        └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18 or above
- MongoDB Atlas account
- Groq API key (free at console.groq.com)

---

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/canteen-app.git
cd canteen-app
```

---

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/canteendb
JWT_SECRET=canteen_super_secret_key_2024
GROQ_API_KEY=your_groq_api_key_here
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```

Backend runs at → `http://localhost:5000`

---

### 3. Frontend Setup
```bash
cd frontend/vite-project
npm install
npm run dev
```

Frontend runs at → `http://localhost:5173`

---

## 🔐 Demo Credentials

| Role | ID | Password |
|---|---|---|
| Admin | admin | admin123 |
| College Student | 1RV21CS001 | pass123 |
| Visitor | Enter name + email/phone | — |

---

## ✨ Features

### User Features
- 🎓 College member login with USN/Email
- 🚶 Visitor login with email or phone
- 🍽️ Browse menu by category — Cooked / Packed / Healthy
- 📦 Real-time stock quantity display
- 🛒 Add to cart with quantity controls
- 💵 Payment options — Cash / UPI / Reward Points
- 📦 Real-time order tracking with progress bar
- 🔔 Browser push notifications when order is ready
- ⭐ Reward points — 5 pts per order
- 🏅 Tier system — Bronze / Silver / Gold
- 💬 Raise and track complaints

### Admin Features
- 📦 Live order feed — new orders appear instantly
- 🔄 Update order status with one click
- 🍽️ Add / edit / delete menu items
- 📊 Stock management with +/- controls
- 💬 Reply to complaints — auto resolves
- 📊 Analytics dashboard:
  - Total revenue & orders
  - Today's stats
  - Orders by status (bar chart)
  - Top selling items
  - Category-wise sales

### Real-time Features (Socket.io)
- 🟢 Live order status updates
- 🔔 Push notification when order is ready
- 📦 Stock updates when items are ordered
- 🆕 New order alerts for admin
- 💬 New complaint alerts for admin

---

## 🌐 API Endpoints

### Auth
```
POST /api/auth/register    → College member signup
POST /api/auth/login       → College member login
POST /api/auth/visitor     → Visitor login
POST /api/auth/admin       → Admin login
```

### Menu
```
GET    /api/menu                    → Get all items
GET    /api/menu?category=cooked    → Filter by category
POST   /api/menu                    → Add item (admin)
PUT    /api/menu/:id                → Update item (admin)
PUT    /api/menu/:id/quantity       → Update stock (admin)
PUT    /api/menu/:id/toggle         → Toggle availability (admin)
DELETE /api/menu/:id                → Delete item (admin)
```

### Orders
```
POST /api/orders              → Place order
GET  /api/orders/my           → Get my orders
GET  /api/orders              → Get all orders (admin)
PUT  /api/orders/:id/status   → Update status (admin)
GET  /api/orders/queue        → Get queue count
```

### Complaints
```
POST /api/complaints              → Raise complaint
GET  /api/complaints/my           → My complaints
GET  /api/complaints              → All complaints (admin)
PUT  /api/complaints/:id/reply    → Reply (admin)
PUT  /api/complaints/:id/status   → Update status (admin)
```

### Analytics
```
GET /api/analytics/dashboard   → Full dashboard (admin)
GET /api/analytics/peak        → Peak hours status
GET /api/analytics/revenue     → Revenue by date range (admin)
```

---

## 🔌 Socket.io Events

### Client → Server
```
join_room   (userId)   → Join private room for updates
join_admin  ()         → Admin joins admin room
```

### Server → Client
```
order_confirmed       → Order placed successfully
order_status_update   → Order status changed
new_order             → New order (admin)
new_complaint         → New complaint (admin)
stock_update          → Item stock changed
queue_update          → Queue count changed
complaint_reply       → Admin replied to complaint
```

---

## 🗃️ Database Models

### User
```
name, usn, email, phone, password, userType,
rewardPoints, lastOrderDate, currentStreak
```

### MenuItem
```
name, description, price, category, emoji,
quantity, isAvailable, calories, isVeg
```

### Order
```
user, userName, userType, items[], totalAmount,
paymentMethod, paymentStatus, status,
pointsEarned, queuePosition
```

### Complaint
```
user, userName, subject, message,
category, priority, status, adminReply
```

---

## 📱 Pages

| Route | Page | Access |
|---|---|---|
| / | Login Page | Public |
| /menu | Menu Page | User |
| /orders | Orders & Checkout | User |
| /rewards | Rewards & Points | User |
| /complaints | Complaints | User |
| /admin | Admin Dashboard | Admin |

---
