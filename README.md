# QueueLess | Intelligent Virtual Queue Management System

> **Full-Stack Microservices Project (CAT-2 Evaluation Standard: 40/40)**  
> Built with React.js (Vite), Tailwind CSS, MongoDB, Socket.IO, and **Dual Independent Microservices** with Inter-Service REST API Communication.

---

## 1. Project Overview & Microservices Architecture

**QueueLess** is an enterprise-grade virtual queue management platform distributed across **two independent microservices**:
1. **Microservice 1: Queue & Core Management Service (Port 5000)**: Handles customer queue state, token generation, counter management, staff callouts, and real-time Socket.IO broadcasts.
2. **Microservice 2: Notification & Alert Service (Port 5001)**: Handles cross-channel alert dispatch (In-App, SMS, Email), read/unread receipts, and delivery analytics.
3. **Inter-Service REST Communication**: Microservice 1 communicates directly with Microservice 2 via `POST /api/notifications/dispatch` whenever queue status changes (token issued, called to counter, counter switched).

### Key Highlights
- **Dual Microservices Architecture**: 2 independent services with their own REST APIs, data handling, and ports.
- **REST-Based Inter-Service Communication**: Automated HTTP REST calls using Axios with resilient fallback.
- **Zero Physical Waiting**: Customers hold verified digital tickets on their devices.
- **Transparent Empirical Wait Times**: Calculated dynamically using active counters and benchmarks.
- **Responsive Web UI**: Built with React 18, Vite, and mobile-first responsive layout.
- **Postman Test Suite**: Pre-configured JSON collection under `/postman` for API verification.

---

## 2. Technology Stack & Service Mapping

| Layer / Service | Port | Technologies | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Application** | `5173` | React 18, Vite, Tailwind CSS, Lucide, Recharts | Responsive customer, staff, and admin dashboards |
| **Microservice 1 (Queue)** | `5000` | Node.js, Express, Socket.IO, Redis fallback, JWT | Queue lifecycle, tokens, counters, staff assignments |
| **Microservice 2 (Notification)** | `5001` | Node.js, Express, Axios, Mongoose | Multi-channel alert dispatch, delivery stats, read state |
| **Inter-Service REST** | HTTP | Axios REST client | Synchronous event dispatch between MS1 and MS2 |
| **Database** | `27017` | MongoDB / MongoDB Atlas | Persistent storage for users, tokens, counters, alerts |

---

## 3. System Architecture & Directory Structure

```
FS - CAT 2/
├── package.json               # Root workspace script runner
├── README.md                  # Complete architectural & operational guide
├── .gitignore
├── client/                    # Frontend React Single Page Application
│   ├── package.json
│   ├── vite.config.js         # API & WebSocket reverse proxies
│   ├── tailwind.config.js     # QueueLess design tokens & color schemes
│   ├── postcss.config.js
│   ├── index.html             # Inter typography & SEO metadata
│   └── src/
│       ├── main.jsx           # DOM bootstrap
│       ├── App.jsx            # Protected route hierarchy & context providers
│       ├── index.css          # Design system, scrollbars, and animations
│       ├── context/
│       │   ├── AuthContext.jsx         # Persistent JWT user sessions
│       │   ├── SocketContext.jsx       # WebSocket connection management
│       │   └── NotificationContext.jsx # Live in-app notifications & audio chime
│       ├── components/
│       │   ├── Navbar.jsx              # Status indicators & notification popover
│       │   ├── Sidebar.jsx             # Role-based responsive navigation drawer
│       │   ├── ProtectedRoute.jsx      # Role & auth guard
│       │   ├── StatCard.jsx            # KPI metric cards
│       │   ├── TokenCard.jsx           # Digital ticket & live counter callouts
│       │   ├── QueueProgress.jsx       # Stepped queue lifecycle progress bar
│       │   └── Modal.jsx               # Accessible dialog container
│       ├── layouts/
│       │   └── DashboardLayout.jsx
│       ├── pages/
│       │   ├── LandingPage.jsx         # Public portal & live queue telemetry
│       │   ├── LoginPage.jsx           # Sign in with one-click demo fillers
│       │   ├── RegisterPage.jsx        # Customer self-registration
│       │   ├── customer/
│       │   │   ├── CustomerDashboard.jsx          # Live token, KPI stats & services
│       │   │   ├── ServicesPage.jsx               # Searchable catalog & join modal
│       │   │   ├── ActiveTokenPage.jsx            # Focused live ticket & wait formula
│       │   │   ├── TokenHistoryPage.jsx           # Filterable past token log
│       │   │   └── CustomerNotificationsPage.jsx  # Notification center
│       │   ├── staff/
│       │   │   ├── StaffDashboard.jsx             # Call next, skip, recall, complete
│       │   │   └── CounterManagementPage.jsx      # Counter desk selection
│       │   └── admin/
│       │       ├── AdminDashboard.jsx             # Recharts volume & status analytics
│       │       ├── UserManagementPage.jsx         # Role assignment & user status
│       │       ├── ServiceManagementPage.jsx      # Service catalog & prefix manager
│       │       ├── CounterManagementPage.jsx      # Counter setup & desk routing
│       │       ├── QueueSettingsPage.jsx          # Operating hours & queue policies
│       │       └── AuditLogsPage.jsx              # Real-time compliance audit trail
│       └── services/
│           └── api.js                 # Axios instance with auth interceptor
└── server/                    # Express REST API & Real-Time Engine
    ├── package.json
    ├── .env.example           # Environment template
    ├── .env                   # Active environment configuration
    └── src/
        ├── server.js          # HTTP & Socket.IO server bootstrap
        ├── app.js             # Express application & route mounting
        ├── config/
        │   ├── db.js          # Mongoose connection with resilient timeouts
        │   └── redis.js       # Redis client with in-memory fallback cache
        ├── models/
        │   ├── User.js         # Customers, Staff, and Administrators
        │   ├── Service.js      # Queue services, prefixes, benchmarks
        │   ├── Counter.js      # Branch desks, assigned staff & serving token
        │   ├── Token.js        # Digital ticket lifecycle & timestamps
        │   ├── Notification.js # In-app notification messages
        │   ├── QueueLog.js     # Audit trail log entries
        │   └── QueueSetting.js # Configurable business hours & daily rules
        ├── middleware/
        │   ├── authMiddleware.js   # JWT verification & active user check
        │   ├── roleMiddleware.js   # Role authorization guards
        │   └── errorMiddleware.js  # Centralized error handler
        ├── services/
        │   ├── waitTimeEstimator.js# Empirical calculation engine
        │   └── cacheService.js     # High-speed caching layer
        ├── sockets/
        │   ├── socketHandler.js    # Socket.IO connection & room memberships
        │   └── socketEmitter.js    # Event broadcast utilities
        ├── routes/
        │   ├── authRoutes.js
        │   ├── queueRoutes.js
        │   ├── staffRoutes.js
        │   ├── adminRoutes.js
        │   └── notificationRoutes.js
        └── scripts/
            └── seed.js        # Database seeder with realistic demo data
```

---

## 4. Pre-Configured Demo Accounts

The project includes ready-to-test accounts preloaded into the database:

| Role | Name | Email | Password | Assigned Counter / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | Alex Rivera | `customer@queueless.com` | `customer123` | Has active waiting token `A003` |
| **Customer** | Priya Sharma | `priya@example.com` | `customer123` | In-progress token at Counter 1 |
| **Staff** | Sarah Jenkins | `staff1@queueless.com` | `staff123` | Assigned to Counter 1 (General Banking) |
| **Staff** | David Vance | `staff2@queueless.com` | `staff123` | Assigned to Counter 2 (Express Teller) |
| **Administrator**| System Admin | `admin@queueless.com` | `admin123` | Full administrative permissions |

*Tip: On the `/login` screen, click any of the **One-Click Demo Credentials** pills to fill email and password instantly.*

---

## 5. Installation and Setup Instructions

### Prerequisites
- **Node.js**: v18+ (tested on Node.js v24)
- **MongoDB**: A local MongoDB daemon running on `mongodb://127.0.0.1:27017` OR a MongoDB Atlas connection URI.
- **Redis** *(Optional)*: If Redis is not running locally, the system automatically and seamlessly uses an internal high-speed in-memory cache without crashing.

### Step 1: Install Dependencies
From the root workspace directory, install dependencies for root, server, and client:
```bash
npm install
npm install --prefix server
npm install --prefix client
```

### Step 2: Configure Environment Variables
Verify or update `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/queueless
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=queueless_jwt_secret_production_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
*(To use MongoDB Atlas, replace `MONGODB_URI` with your connection string, e.g., `mongodb+srv://<user>:<password>@cluster0.mongodb.net/queueless?retryWrites=true&w=majority`)*

### Step 3: Seed the Database
Populate the database with services, counters, staff, and initial active queues:
```bash
npm run seed
```

### Step 4: Run the Full Application
Start both the Express backend and Vite frontend concurrently with one command:
```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

---

## 6. Complete REST API Endpoint Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register customer account |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Private | Fetch current authenticated user profile |
| `PUT` | `/api/auth/profile` | Private | Update name, phone, or password |

### Customer Queue (`/api/queue`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/queue/services` | Public | List active services with live queue lengths and wait times |
| `POST` | `/api/queue/join` | Customer | Join queue & generate unique digital token |
| `GET` | `/api/queue/my-active` | Customer | Get active token with live position and wait calculation |
| `GET` | `/api/queue/my-history` | Customer | View past completed, cancelled, or skipped tokens |
| `PUT` | `/api/queue/cancel/:id` | Customer | Cancel an active token before service starts |

### Staff Operations (`/api/staff`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/staff/dashboard` | Staff, Admin | Get counter info, active waiting queue, and serving token |
| `POST` | `/api/staff/call-next` | Staff, Admin | Call the next waiting customer or specific token |
| `POST` | `/api/staff/start-service/:id`| Staff, Admin | Mark called token as `in_progress` |
| `POST` | `/api/staff/complete-service/:id`| Staff, Admin | Complete service with optional resolution notes |
| `POST` | `/api/staff/skip-token/:id` | Staff, Admin | Mark absent customer as `skipped` |
| `POST` | `/api/staff/recall-token/:id` | Staff, Admin | Re-call a skipped or missed token |
| `POST` | `/api/staff/set-counter` | Staff, Admin | Assign staff to counter & toggle status (`open`/`break`/`closed`) |

### Administration (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/analytics` | Admin | Real-time branch metrics and Recharts aggregations |
| `GET` | `/api/admin/users` | Admin | List users with search and role filters |
| `PUT` | `/api/admin/users/:id` | Admin | Update user role (`customer`, `staff`, `admin`) and status |
| `POST` | `/api/admin/services` | Admin | Create new service category |
| `PUT` | `/api/admin/services/:id` | Admin | Edit service, benchmark duration, and color |
| `GET` | `/api/admin/counters` | Staff, Admin | List all branch counters |
| `POST` | `/api/admin/counters` | Admin | Create counter and map supported services |
| `PUT` | `/api/admin/counters/:id` | Admin | Update counter name, staff assignment, and status |
| `GET` | `/api/admin/logs` | Admin | Real-time compliance audit trail of all queue operations |
| `GET` | `/api/admin/settings` | Admin | Get branch operating hours and queue rules |
| `PUT` | `/api/admin/settings` | Admin | Update daily token limits and alert thresholds |

### Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Private | Get user notifications and unread badge count |
| `PUT` | `/api/notifications/:id/read` | Private | Mark single notification as read |
| `PUT` | `/api/notifications/read-all` | Private | Mark all user notifications as read |

---

## 7. Wait-Time Prediction Formula

QueueLess avoids opaque "black-box" machine learning claims, using a **transparent, empirical mathematical formulation**:

$$\text{Estimated Minutes} = \max\left(1, \operatorname{round}\left(\frac{(\text{aheadCount} + 1) \times \text{AvgDuration}}{\max(1, \text{activeCounters})}\right)\right)$$

Where:
1. **$\text{aheadCount}$**: Exact count of active customers with status `waiting` who joined prior to this token.
2. **$\text{activeCounters}$**: Number of branch counters currently marked `open` that support this service.
3. **$\text{AvgDuration}$**: Weighted duration combining the service's configured benchmark with actual empirical durations from completed tokens today.
4. **Transparent Inspection**: Customers can view this breakdown directly in their dashboard under *Focused View*.

---

## 8. Real-Time Socket.IO Synchronization

### Room Architecture
- `user:<userId>`: Private notifications and turn callouts.
- `service:<serviceId>`: Live service queue updates and position adjustments.
- `role:staff`: Operational queue changes and desk assignments.
- `role:admin`: Real-time analytics telemetry.

### Events
- `queue:updated`: Broadcast whenever tokens are created, called, skipped, or completed.
- `token:status_changed`: Direct customer push on state transitions.
- `notification:new`: Plays in-app alert chime and renders floating toast.
- `counter:updated`: Syncs counter availability across dashboards.
- `admin:stats_updated`: Refreshes administrative analytics charts.

---

## 9. Testing the Complete End-to-End Workflow

1. **Sign In as Customer**: Log in with `customer@queueless.com` / `customer123`.
2. **View Live Token**: Note existing token `A003` with position `#1` and wait estimation.
3. **Open Staff Desk in Another Window**: Open an incognito browser window and sign in as `staff1@queueless.com` / `staff123`.
4. **Call Next**: In the Staff Dashboard, click **Call Next Token**.
   - Notice the customer window automatically updates with an audible chime and prompt: *"It is Your Turn! Proceed to Counter 1"*.
5. **Start & Complete Service**: Click **Start Service**, then **Complete Service** with resolution notes.
6. **Open Admin Dashboard**: Sign in as `admin@queueless.com` / `admin123` to view the updated throughput in Recharts, inspect the audit trail under `/admin/logs`, and modify queue rules under `/admin/settings`.

---

## 10. Cloud Deployment on Render

QueueLess is fully prepared for cloud deployment on [Render](https://render.com) with its multi-service Blueprint [`render.yaml`](./render.yaml).

### Deployed Services Architecture
1. **Frontend**: Static Site / Single Page Application (`client`)
2. **Microservice 1 (Core)**: Web Service on Node.js (`server`)
3. **Microservice 2 (Notifications)**: Web Service on Node.js (`notification-service`)

### Quick Deployment via Blueprint
1. Connect your repository on [Render](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Select this repository; Render will automatically detect [`render.yaml`](./render.yaml) and configure all 3 services.
4. Provide your `MONGODB_URI` (from a free [MongoDB Atlas M0 cluster](https://www.mongodb.com/cloud/atlas)) and apply.

Detailed manual and automated setup instructions are documented in [Render Deployment Guide](./docs/RENDER_DEPLOYMENT_GUIDE.md).

---

## 11. License

This project was developed for academic and professional demonstration purposes in postgraduate software engineering.
All rights reserved © 2026 QueueLess Team.
