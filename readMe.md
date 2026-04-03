# Finance Dashboard API

A RESTful backend for a multi-user finance dashboard. Supports financial record management, role-based access control, and aggregated dashboard analytics.

Built with **Node.js**, **Express**, and **MongoDB**.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Roles and permissions](#roles-and-permissions)
- [Data models](#data-models)
- [Assumptions](#assumptions)
- [Design decisions](#design-decisions)

---

## Features

- JWT-based authentication with role embedded in token
- Three-tier role system: `admin`, `analyst`, `viewer`
- Full CRUD for financial records (income and expense entries)
- Soft delete — records are never permanently erased
- Dashboard summary APIs: totals, net balance, category breakdowns, monthly trends
- Input validation on all write endpoints
- Middleware-level access control — unauthorized requests are rejected before any business logic runs

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express |
| Database | MongoDB via Mongoose |
| Auth | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | `bcryptjs` |
| Validation | `express-validator` |
| Logging | `morgan` |
| Config | `dotenv` |

---

## Project structure

```
project/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── models/
│   │   ├── User.js                # User schema
│   │   └── FinancialRecord.js     # Financial record schema
│   ├── middleware/
│   │   ├── verifyToken.js         # Decodes JWT, attaches req.user
│   │   ├── requireRole.js         # Checks role against allowed list
│   │   └── validate.js            # express-validator error handler
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── record.routes.js
│   │   └── dashboard.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── record.controller.js
│   │   └── dashboard.controller.js
│   └── services/
│       ├── record.service.js      # Record business logic
│       └── dashboard.service.js   # Aggregation queries
├── .env
├── .gitignore
├── package.json
└── server.js
```

---

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI

### Installation

```bash
git clone https://github.com/your-username/finance-dashboard-api.git
cd finance-dashboard-api
npm install
```

### Set up environment variables

```bash
cp .env.example .env
# Edit .env with your values (see Environment variables section below)
```

### Run the server

```bash
# Development (auto-restarts on save)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:5000` by default.

### Seed an admin user (optional)

```bash
node scripts/seed.js
```

This creates a default admin account:
- Email: `admin@example.com`
- Password: `admin123`

---

## Environment variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs — keep this private |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `24h`, `7d`) |
| `NODE_ENV` | `development` or `production` |

---

## API reference

All protected routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a new user account |
| POST | `/api/auth/login` | Public | Log in and receive a JWT |

**POST /api/auth/register**
```json
{
  "name": "Ravi Sharma",
  "email": "ravi@acme.com",
  "password": "securepassword"
}
```

**POST /api/auth/login**
```json
{
  "email": "ravi@acme.com",
  "password": "securepassword"
}
```
Response includes a `token` field. Pass this as a Bearer token on all subsequent requests.

---

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List all users |
| POST | `/api/users` | Admin | Create a user with a specific role |
| PATCH | `/api/users/:id/role` | Admin | Change a user's role |
| PATCH | `/api/users/:id/status` | Admin | Activate or deactivate a user |

---

### Financial records

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/records` | All roles | List records (supports filters) |
| POST | `/api/records` | Admin | Create a new record |
| PATCH | `/api/records/:id` | Admin | Update a record |
| DELETE | `/api/records/:id` | Admin | Soft-delete a record |

**Query parameters for GET /api/records**

| Parameter | Example | Description |
|---|---|---|
| `type` | `?type=expense` | Filter by `income` or `expense` |
| `category` | `?category=salaries` | Filter by category string |
| `from` | `?from=2025-01-01` | Start date (inclusive) |
| `to` | `?to=2025-01-31` | End date (inclusive) |
| `page` | `?page=2` | Page number (default: 1) |
| `limit` | `?limit=20` | Results per page (default: 10) |

**POST /api/records body**
```json
{
  "amount": 85000,
  "type": "expense",
  "category": "salaries",
  "date": "2025-04-01",
  "notes": "April salary payout — 17 employees"
}
```

---

### Dashboard

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard/summary` | All roles | Total income, expenses, net balance |
| GET | `/api/dashboard/categories` | All roles | Totals grouped by category |
| GET | `/api/dashboard/trends` | Analyst, Admin | Monthly income vs expense breakdown |
| GET | `/api/dashboard/recent` | All roles | Last 5 transactions |

**GET /api/dashboard/summary — example response**
```json
{
  "totalIncome": 350000,
  "totalExpenses": 113000,
  "netBalance": 237000,
  "recordCount": 24
}
```

**GET /api/dashboard/trends — optional query params**

| Parameter | Example | Description |
|---|---|---|
| `months` | `?months=6` | Number of past months to include (default: 6) |

---

## Roles and permissions

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| View records | Yes | Yes | Yes |
| Filter records | Yes | Yes | Yes |
| View dashboard summary | Yes | Yes | Yes |
| View category breakdown | Yes | Yes | Yes |
| View monthly trends | No | Yes | Yes |
| Create records | No | No | Yes |
| Edit records | No | No | Yes |
| Delete records | No | No | Yes |
| Manage users | No | No | Yes |
| Assign roles | No | No | Yes |

Access is enforced at the middleware layer. A request from a Viewer hitting an Admin-only endpoint is rejected at the role check — the controller and database are never reached.

---

## Data models

### User

```
name        String    required
email       String    required, unique
password    String    hashed with bcrypt
role        String    "admin" | "analyst" | "viewer"
isActive    Boolean   default: true
createdAt   Date      auto-generated
```

### FinancialRecord

```
amount      Number    required, must be > 0
type        String    "income" | "expense"
category    String    required
date        Date      required
notes       String    optional
createdBy   ObjectId  ref: User
deletedAt   Date      null = active, set = soft-deleted
createdAt   Date      auto-generated
```

All listing queries automatically filter `deletedAt: null` so soft-deleted records are invisible to normal operations.

---


## Assumptions

These decisions were made to keep the implementation focused and clean:

- **Single organization** — all users and records belong to one shared company. There is no multi-tenancy.
- **Single currency** — amounts are plain numbers with no currency metadata or conversion.
- **Categories are free-text strings** — no enforced category list. The API accepts any non-empty string.
- **Roles are flat** — there is no role hierarchy or custom permission sets beyond the three defined roles.
- **Soft delete only** — records are never permanently removed. A `deletedAt` timestamp is set instead.
- **No file attachments** — records are data-only. No invoice or receipt uploads.
- **Pagination defaults** — `page=1`, `limit=10` unless specified in the query string.

---

## Design decisions

**Middleware-first access control** — role checks happen before any service or database code runs. This means unauthorized requests are cheap to reject and business logic never needs to check permissions internally.

**Service layer separation** — controllers handle HTTP concerns (parsing request, sending response). Services handle business logic and database queries. This keeps controllers thin and logic testable independently of Express.

**Soft deletes for financial records** — financial data should never be erased silently. Soft delete preserves the audit trail while keeping deleted records invisible in normal operations.

**JWT contains role** — the user's role is embedded in the token at login time. This avoids a database lookup on every request to check the user's role. The tradeoff is that role changes only take effect on the next login (or when the old token expires).

**Aggregation on demand** — dashboard summary values are computed by MongoDB aggregation queries at request time. There is no pre-computed cache. This keeps the data always accurate at the cost of slightly heavier queries — acceptable for this scale.