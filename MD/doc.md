# Finance Dashboard API — Technical Documentation

**Version:** 1.0.0  
**Stack:** Node.js · Express · MongoDB · Mongoose  
**Author:** [Your Name]  
**Last Updated:** April 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack and Dependencies](#3-tech-stack-and-dependencies)
4. [Project Structure](#4-project-structure)
5. [Environment Configuration](#5-environment-configuration)
6. [Database Design](#6-database-design)
7. [Authentication and Security](#7-authentication-and-security)
8. [Role-Based Access Control](#8-role-based-access-control)
9. [API Reference](#9-api-reference)
10. [Middleware Layer](#10-middleware-layer)
11. [Service Layer](#11-service-layer)
12. [Dashboard Analytics](#12-dashboard-analytics)
13. [Error Handling](#13-error-handling)
14. [Validation Strategy](#14-validation-strategy)
15. [Assumptions and Design Decisions](#15-assumptions-and-design-decisions)
16. [Setup and Installation](#16-setup-and-installation)
17. [Testing Guide](#17-testing-guide)

---

## 1. Project Overview

The Finance Dashboard API is a multi-user RESTful backend system that enables organizations to track, manage, and analyze financial records. It provides structured access to income and expense data through a role-gated API, ensuring different users interact with financial data only at the level of trust their role permits.

### What the system does

- Allows authenticated users to log in and receive a JWT token that carries their role
- Lets admin users create, update, and soft-delete financial records (income and expense entries)
- Lets all authenticated users view records and access dashboard summary data
- Restricts aggregated trend data to analyst and admin roles
- Provides aggregated dashboard endpoints for totals, category breakdowns, and monthly trends
- Enforces all access rules at the middleware layer before any business logic runs

### Real-world analogy

Think of this as the backend for an internal company accounting tool. A finance manager (admin) enters all transactions. A finance analyst reviews reports and trends. A director or executive (viewer) checks the high-level summary dashboard without being able to modify anything.

---

## 2. System Architecture

The application follows a layered architecture with clear separation of concerns across four layers:

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────┐
│           Routes Layer              │  Defines endpoints and chains middleware
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│         Middleware Layer            │  verifyToken → requireRole → validate
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│         Controller Layer            │  Parses request, calls service, sends response
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│          Service Layer              │  Business logic, aggregations, data rules
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│           Model Layer               │  Mongoose schemas, validators, hooks
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│            MongoDB                  │  Persistent document storage
└─────────────────────────────────────┘
```

### Layer responsibilities

| Layer | File location | Responsibility |
|---|---|---|
| Routes | `src/routes/` | Defines URL paths, chains middleware, maps to controllers |
| Middleware | `src/middleware/` | Token verification, role enforcement, input validation |
| Controllers | `src/controllers/` | HTTP parsing, response formatting, error delegation |
| Services | `src/services/` | Business logic, database queries, aggregations |
| Models | `src/models/` | Schema definitions, field validators, instance methods |

### Request lifecycle

Every incoming request follows this exact path:

```
Incoming request
  → morgan logs it
  → express.json() parses body
  → Router matches path
  → verifyToken checks JWT
  → requireRole checks permission
  → validate checks body/query fields
  → Controller calls Service
  → Service queries MongoDB via Model
  → Controller sends JSON response
```

If any step fails, the chain stops and returns an appropriate HTTP error. The database is never touched if auth or validation fails.

---

## 3. Tech Stack and Dependencies

### Runtime and framework

| Package | Version | Purpose |
|---|---|---|
| Node.js | 18+ | JavaScript runtime (ESM modules) |
| Express | ^4.18 | HTTP framework — routing, middleware, req/res |

### Database

| Package | Version | Purpose |
|---|---|---|
| MongoDB | 6+ | Document database |
| Mongoose | ^7 | ODM — schema definitions, validation, query builder |

### Authentication and security

| Package | Version | Purpose |
|---|---|---|
| jsonwebtoken | ^9 | Signs and verifies JWT tokens |
| bcryptjs | ^2.4 | Hashes and compares passwords |

### Validation and utilities

| Package | Version | Purpose |
|---|---|---|
| express-validator | ^7 | Declarative request body and query validation |
| dotenv | ^16 | Loads environment variables from `.env` file |
| cors | ^2 | Enables cross-origin requests from frontend clients |
| morgan | ^1.10 | HTTP request logger for development |

### Development

| Package | Version | Purpose |
|---|---|---|
| nodemon | ^3 | Auto-restarts server on file changes |
| jest | ^29 | Test runner |
| supertest | ^6 | HTTP integration testing |
| mongodb-memory-server | ^9 | In-memory MongoDB for isolated tests |

---

## 4. Project Structure

```
finance-dashboard-api/
│
├── src/
│   ├── config/
│   │   └── db.js                    # MongoDB connection with event listeners
│   │
│   ├── models/
│   │   ├── User.js                  # User schema, bcrypt hooks, comparePassword
│   │   └── FinancialRecord.js       # Record schema, soft delete, indexes
│   │
│   ├── middleware/
│   │   ├── verifyToken.js           # JWT extraction and verification
│   │   ├── requireRole.js           # Role-based access enforcement
│   │   └── validate.js              # express-validator error handler
│   │
│   ├── routes/
│   │   ├── auth.routes.js           # /api/auth — register, login
│   │   ├── user.routes.js           # /api/users — user management (admin)
│   │   ├── record.routes.js         # /api/records — financial record CRUD
│   │   └── dashboard.routes.js      # /api/dashboard — aggregated analytics
│   │
│   ├── controllers/
│   │   ├── auth.controller.js       # register, login handlers
│   │   ├── user.controller.js       # getAllUsers, createUser, updateRole, updateStatus
│   │   ├── record.controller.js     # getAllRecords, getRecord, createRecord, updateRecord, deleteRecord
│   │   └── dashboard.controller.js  # getSummary, getCategoryTotals, getMonthlyTrends, getRecentRecords
│   │
│   └── services/
│       ├── record.service.js        # Record queries, filters, soft delete logic
│       └── dashboard.service.js     # MongoDB aggregation pipelines
│
├── tests/
│   ├── setup.js                     # In-memory MongoDB setup for test runs
│   ├── auth.test.js
│   ├── middleware.test.js
│   ├── records.test.js
│   ├── dashboard.test.js
│   └── users.test.js
│
├── scripts/
│   └── seed.js                      # Seed admin, analyst, viewer + sample records
│
├── server.js                        # Entry point — Express app, routes, error handlers
├── .env                             # Local environment variables (not committed)
├── .env.example                     # Safe template committed to repository
├── .gitignore
├── package.json
└── DOCUMENTATION.md
```

---

## 5. Environment Configuration

All sensitive configuration is loaded from a `.env` file at startup via `dotenv`. This file is never committed to version control.

### Required variables

| Variable | Example | Description |
|---|---|---|
| `PORT` | `5000` | Port the HTTP server listens on |
| `MONGO_URI` | `mongodb://localhost:27017/finance_dashboard` | MongoDB connection string |
| `JWT_SECRET` | `a_long_random_secret_string` | Secret key used to sign and verify JWT tokens. Must be kept private. |
| `JWT_EXPIRES_IN` | `24h` | JWT token lifetime. Accepts any value `jsonwebtoken` supports: `24h`, `7d`, `1h` |
| `NODE_ENV` | `development` | Environment flag. Set to `production` in deployed environments. |

### `.env.example`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### Important notes

`dotenv.config()` must be the first line executed in `server.js` before any imports that reference `process.env`. If it runs after, environment variables will be `undefined` when modules initialize.

`JWT_SECRET` should be at least 32 random characters in production. A weak secret makes JWT tokens forgeable. Use a generator like `openssl rand -hex 32` to create one.

---

## 6. Database Design

The system uses two MongoDB collections: `users` and `financialrecords`.

### Users collection

Stores all user accounts with their assigned roles and account status.

```
Field        Type       Constraints                          Notes
───────────────────────────────────────────────────────────────────────────────
_id          ObjectId   Auto-generated                       Primary key
name         String     Required, 2–50 chars, trimmed
email        String     Required, unique, lowercase          Indexed automatically
password     String     Required, min 6 chars                Hashed with bcrypt, select:false
role         String     Enum: admin | analyst | viewer       Default: viewer
isActive     Boolean    Default: true                        Used to deactivate without deletion
createdAt    Date       Auto-generated by timestamps:true
updatedAt    Date       Auto-updated by timestamps:true
```

**Key behaviors:**
- The `pre('save')` hook on the schema hashes the password with bcrypt (salt rounds: 10) before any insert or update where `password` is modified
- `select: false` on the password field means it is stripped from all query results by default. It must be explicitly requested with `.select('+password')` — this only happens during login
- The `toJSON()` method deletes `password` from the serialized object as a secondary safety net
- `comparePassword(candidatePassword)` is an instance method that uses `bcrypt.compare` — password comparison never happens in controller or route code

### Financial records collection

Stores all income and expense entries with soft delete support.

```
Field        Type       Constraints                          Notes
───────────────────────────────────────────────────────────────────────────────
_id          ObjectId   Auto-generated                       Primary key
amount       Number     Required, min: 0.01                  Must be greater than zero
type         String     Enum: income | expense               Required
category     String     Required, trimmed, lowercase         Free-text, stored lowercase
date         Date       Required                             The date of the transaction
notes        String     Optional, max 500 chars              Default: empty string
createdBy    ObjectId   Required, ref: User                  Foreign key to users collection
deletedAt    Date       Default: null                        null = active, Date = soft-deleted
createdAt    Date       Auto-generated by timestamps:true
updatedAt    Date       Auto-updated by timestamps:true
```

**Indexes defined on the schema:**

| Index | Fields | Purpose |
|---|---|---|
| Compound | `type: 1, date: -1` | Fast filtering by type with date sort |
| Single | `category: 1` | Fast category filtering and grouping |
| Single | `createdBy: 1` | Fast lookup of records by creator |
| Single | `deletedAt: 1` | Fast exclusion of soft-deleted records |

### Relationship

```
users (1) ──────────────────── (many) financialrecords
           createdBy: ObjectId ref
```

One user can create many financial records. The `createdBy` field stores the ObjectId of the creating user and is populated using Mongoose's `.populate('createdBy', 'name email role')` on read operations.

### Soft delete pattern

Records are never permanently removed from the database. When a delete operation is requested, `deletedAt` is set to the current timestamp:

```javascript
{ $set: { deletedAt: new Date() } }
```

All read queries filter with `{ deletedAt: null }` to exclude deleted records. This preserves the complete audit trail while keeping deleted records invisible in normal operations — a standard requirement for any financial system.

---

## 7. Authentication and Security

### Registration flow

1. Client sends `POST /api/auth/register` with `name`, `email`, `password`, and optional `role`
2. Validation middleware checks all required fields and formats
3. Controller checks for existing email — returns `409` if duplicate found
4. `User.create()` triggers the `pre('save')` bcrypt hook — password is hashed before insert
5. Response returns the created user object with password stripped via `toJSON()`

### Login flow

1. Client sends `POST /api/auth/login` with `email` and `password`
2. Controller queries `User.findOne({ email }).select('+password')` — explicitly opts in to the hidden password field
3. Returns `401` if user not found (same message as wrong password — intentional, see note below)
4. Returns `403` if `isActive` is false
5. `user.comparePassword(password)` runs `bcrypt.compare` — returns `401` if mismatch
6. `jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn })` creates the token
7. Response returns token and user object (password stripped)

### JWT token structure

```json
{
  "id":    "64f3a2b1c9e4d800123abc45",
  "email": "ravi@acme.com",
  "role":  "admin",
  "iat":   1712000000,
  "exp":   1712086400
}
```

The role is embedded in the token at login time. This means role checks on protected routes require no database lookup — the middleware reads the role directly from the decoded token payload.

**Tradeoff:** If an admin changes a user's role, the change only takes effect when the user's current token expires and they log in again to receive a new token. For this system's scope this is acceptable behavior and is documented as a known assumption.

### Security decisions

**Identical error messages for wrong email and wrong password** — both return `"Invalid email or password."` This is deliberate. Returning different messages would allow an attacker to enumerate which email addresses are registered in the system (a user enumeration attack).

**`isActive` check after password verification** — a deactivated user must still provide the correct password before being told their account is deactivated. This prevents using the deactivated-account response to confirm an email exists.

**bcrypt salt rounds: 10** — a standard value that balances security and performance. Higher values increase resistance to brute force but add latency to every login.

---

## 8. Role-Based Access Control

The system implements three roles with clearly defined permission boundaries.

### Roles

| Role | Description | Typical user |
|---|---|---|
| `admin` | Full access — read, write, delete records, manage users | Finance manager |
| `analyst` | Read access + trend analytics | Finance team member |
| `viewer` | Read-only access to records and summary dashboard | Executive, client |

### Permission matrix

| Endpoint | viewer | analyst | admin |
|---|---|---|---|
| `POST /api/auth/register` | Public | Public | Public |
| `POST /api/auth/login` | Public | Public | Public |
| `GET /api/records` | Yes | Yes | Yes |
| `GET /api/records/:id` | Yes | Yes | Yes |
| `POST /api/records` | No — 403 | No — 403 | Yes |
| `PATCH /api/records/:id` | No — 403 | No — 403 | Yes |
| `DELETE /api/records/:id` | No — 403 | No — 403 | Yes |
| `GET /api/dashboard/summary` | Yes | Yes | Yes |
| `GET /api/dashboard/categories` | Yes | Yes | Yes |
| `GET /api/dashboard/trends` | No — 403 | Yes | Yes |
| `GET /api/dashboard/recent` | Yes | Yes | Yes |
| `GET /api/users` | No — 403 | No — 403 | Yes |
| `POST /api/users` | No — 403 | No — 403 | Yes |
| `PATCH /api/users/:id/role` | No — 403 | No — 403 | Yes |
| `PATCH /api/users/:id/status` | No — 403 | No — 403 | Yes |

### How enforcement works

Role checks happen inside `requireRole` middleware, which runs after `verifyToken` and before the controller. The controller and database are never reached if the role check fails.

```javascript
// Route definition — readable at a glance
router.post(
  '/',
  verifyToken,           // 1. is there a valid JWT?
  requireRole(['admin']),// 2. is this role permitted?
  createValidation,      // 3. is the body valid?
  validate,              // 4. if not, return 400
  createRecord           // 5. all clear — run controller
);
```

### Admin self-protection rules

Two operations are blocked even for admin users:

- An admin cannot change their own role via `PATCH /api/users/:id/role`
- An admin cannot deactivate their own account via `PATCH /api/users/:id/status`

These rules prevent an admin from accidentally locking themselves — and potentially the entire team — out of the system.

---

## 9. API Reference

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

All responses follow this envelope:

```json
{
  "success": true | false,
  "message": "Human readable message",
  "data": {}
}
```

Error responses additionally include:

```json
{
  "success": false,
  "message": "What went wrong",
  "errors": [
    { "field": "email", "message": "Please provide a valid email", "value": "notanemail" }
  ]
}
```

---

### Auth endpoints

#### POST /api/auth/register

Creates a new user account.

**Access:** Public

**Request body:**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | String | Yes | 2–50 characters |
| `email` | String | Yes | Valid email format |
| `password` | String | Yes | Minimum 6 characters |
| `role` | String | No | `admin`, `analyst`, or `viewer`. Defaults to `viewer` |

**Example request:**
```json
{
  "name": "Ravi Sharma",
  "email": "ravi@acme.com",
  "password": "secret123",
  "role": "admin"
}
```

**Responses:**

| Status | Condition |
|---|---|
| `201 Created` | User created successfully |
| `400 Bad Request` | Validation failed |
| `409 Conflict` | Email already registered |

---

#### POST /api/auth/login

Authenticates a user and returns a JWT token.

**Access:** Public

**Request body:**

| Field | Type | Required |
|---|---|---|
| `email` | String | Yes |
| `password` | String | Yes |

**Example response (200):**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "64f3a2b1c9e4d800123abc45",
    "name": "Ravi Sharma",
    "email": "ravi@acme.com",
    "role": "admin",
    "isActive": true
  }
}
```

**Responses:**

| Status | Condition |
|---|---|
| `200 OK` | Login successful |
| `400 Bad Request` | Validation failed |
| `401 Unauthorized` | Invalid email or password |
| `403 Forbidden` | Account is deactivated |

---

### User endpoints

All user endpoints require admin role.

#### GET /api/users

Returns all registered users.

**Example response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "64f3a2b1c9e4d800123abc45",
      "name": "Ravi Sharma",
      "email": "ravi@acme.com",
      "role": "admin",
      "isActive": true,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### POST /api/users

Creates a user with an explicitly assigned role.

**Request body:** Same as register, but `role` is required.

---

#### PATCH /api/users/:id/role

Updates a user's role.

**Request body:**
```json
{ "role": "analyst" }
```

**Responses:**

| Status | Condition |
|---|---|
| `200 OK` | Role updated |
| `400 Bad Request` | Invalid role value or self-modification attempt |
| `404 Not Found` | User not found |

---

#### PATCH /api/users/:id/status

Activates or deactivates a user account.

**Request body:**
```json
{ "isActive": false }
```

---

### Record endpoints

#### GET /api/records

Returns all active (non-deleted) records with optional filtering and pagination.

**Access:** All roles

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `type` | String | Filter by `income` or `expense` |
| `category` | String | Filter by category name |
| `from` | ISO Date | Start date inclusive (e.g. `2025-04-01`) |
| `to` | ISO Date | End date inclusive (e.g. `2025-04-30`) |
| `page` | Integer | Page number, default `1` |
| `limit` | Integer | Results per page, default `10`, max `100` |

**Example response (200):**
```json
{
  "success": true,
  "records": [...],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

#### GET /api/records/:id

Returns a single record by ID.

**Access:** All roles

**Responses:**

| Status | Condition |
|---|---|
| `200 OK` | Record found |
| `404 Not Found` | Record not found or soft-deleted |

---

#### POST /api/records

Creates a new financial record.

**Access:** Admin only

**Request body:**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `amount` | Number | Yes | Greater than 0 |
| `type` | String | Yes | `income` or `expense` |
| `category` | String | Yes | Non-empty string |
| `date` | ISO Date | Yes | Valid date string |
| `notes` | String | No | Max 500 characters |

**Example request:**
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

#### PATCH /api/records/:id

Updates an existing record. All fields are optional — only provided fields are updated.

**Access:** Admin only

**Responses:**

| Status | Condition |
|---|---|
| `200 OK` | Record updated |
| `400 Bad Request` | Validation failed |
| `404 Not Found` | Record not found or already deleted |

---

#### DELETE /api/records/:id

Soft-deletes a record by setting `deletedAt` to the current timestamp. The record is not removed from the database.

**Access:** Admin only

**Example response (200):**
```json
{
  "success": true,
  "message": "Record deleted successfully.",
  "data": {
    "id": "64f3a2b1c9e4d800123abc99",
    "deletedAt": "2025-04-04T09:30:00.000Z"
  }
}
```

---

### Dashboard endpoints

#### GET /api/dashboard/summary

Returns aggregated financial totals.

**Access:** All roles

**Example response (200):**
```json
{
  "success": true,
  "data": {
    "totalIncome": 350000,
    "totalExpenses": 113000,
    "netBalance": 237000,
    "recordCount": 24
  }
}
```

When no records exist, all values return as `0` — not an error.

---

#### GET /api/dashboard/categories

Returns totals grouped by category with income/expense breakdown.

**Access:** All roles

**Example response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "category": "salaries",
      "total": 85000,
      "breakdown": {
        "expense": { "total": 85000, "count": 1 }
      }
    },
    {
      "category": "client payments",
      "total": 350000,
      "breakdown": {
        "income": { "total": 350000, "count": 2 }
      }
    }
  ]
}
```

Results are sorted by `total` descending — highest spend/income category appears first.

---

#### GET /api/dashboard/trends

Returns monthly income vs expense breakdown for the last N months.

**Access:** Analyst and Admin only

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `months` | Integer | Number of past months to include. Min `1`, max `24`. Default `6` |

**Example response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "month": "2025-02",
      "label": "Feb 2025",
      "income": 0,
      "expense": 0,
      "net": 0,
      "incomeCount": 0,
      "expenseCount": 0
    },
    {
      "month": "2025-03",
      "label": "Mar 2025",
      "income": 200000,
      "expense": 95000,
      "net": 105000,
      "incomeCount": 1,
      "expenseCount": 3
    },
    {
      "month": "2025-04",
      "label": "Apr 2025",
      "income": 350000,
      "expense": 113000,
      "net": 237000,
      "incomeCount": 2,
      "expenseCount": 4
    }
  ]
}
```

Every month in the requested range is always present in the response. Months with no records return zeroes — no gaps in the data.

---

#### GET /api/dashboard/recent

Returns the most recent active records sorted by date descending.

**Access:** All roles

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `limit` | Integer | Number of records to return. Min `1`, max `50`. Default `5` |

---

## 10. Middleware Layer

Three middleware functions form the security and validation backbone of every protected route.

### verifyToken

**File:** `src/middleware/verifyToken.js`

Extracts and verifies the JWT from the `Authorization` header on every protected request.

**Flow:**
1. Checks `Authorization` header exists and starts with `Bearer `
2. Extracts the token string after the space
3. Calls `jwt.verify(token, process.env.JWT_SECRET)`
4. On success: attaches decoded payload to `req.user` and calls `next()`
5. On failure: returns appropriate `401` with distinct messages per error type

**Error types handled:**

| JWT error | Response message |
|---|---|
| Missing header | `"Access denied. No token provided."` |
| Empty token | `"Access denied. Token is empty."` |
| `TokenExpiredError` | `"Token has expired. Please log in again."` |
| `JsonWebTokenError` | `"Invalid token. Please log in again."` |

`TokenExpiredError` and `JsonWebTokenError` are handled separately because they mean different things — expired means re-authenticate, tampered means something suspicious.

---

### requireRole

**File:** `src/middleware/requireRole.js`

A middleware factory that returns a middleware function checking the caller's role against a list of permitted roles.

**Usage:**
```javascript
requireRole(['admin', 'analyst'])
```

**Flow:**
1. Checks `req.user` exists (defensive guard if called without `verifyToken`)
2. Checks `req.user.role` is included in `allowedRoles`
3. On success: calls `next()`
4. On failure: returns `403` with message showing required vs actual role

---

### validate

**File:** `src/middleware/validate.js`

Reads the result of `express-validator` checks run earlier in the middleware chain. If any check failed, formats and returns a `400` response with structured field-level errors.

**Error response shape:**
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be greater than zero",
      "value": -500
    }
  ]
}
```

---

## 11. Service Layer

Services contain all business logic and database interaction. Controllers are kept thin — they only parse the HTTP request and format the HTTP response.

### record.service.js

| Function | Description |
|---|---|
| `getAllRecords(filters)` | Queries active records with optional `type`, `category`, `from`, `to` filters and pagination. Runs data query and count in parallel using `Promise.all`. |
| `getRecordById(id)` | Finds a single active record by ObjectId. Returns `null` for invalid IDs or deleted records. |
| `createRecord(data)` | Inserts a new record. Normalizes `category` to lowercase. |
| `updateRecord(id, data)` | Updates only provided fields using an `allowedUpdates` object. Runs schema validators. Never updates soft-deleted records. |
| `softDeleteRecord(id)` | Sets `deletedAt = new Date()`. Returns `null` if already deleted — idempotent by design. |

### dashboard.service.js

| Function | Description |
|---|---|
| `getSummary()` | Aggregates total income, total expenses, net balance, and record count. Defaults all values to `0` before aggregation so empty-DB responses are always well-formed. |
| `getCategoryTotals()` | Two-stage aggregation: first groups by `category + type` to get the income/expense split, then re-groups by `category` to produce per-category totals with breakdown. Sorted by total descending. |
| `getMonthlyTrends(months)` | Aggregates income and expense by month for the last N months. Uses `buildMonthMap` to pre-populate every month in the range with zeroes — guarantees consistent shape with no gaps even for months with no data. |
| `getRecentRecords(limit)` | Returns last N active records sorted by `date` descending, populated with creator info. |

---

## 12. Dashboard Analytics

The dashboard service uses MongoDB's aggregation pipeline to compute all analytics server-side. No pre-computation or caching is used — all values are computed fresh on each request from the source records.

### Summary aggregation logic

```
financialrecords (deletedAt: null)
  → $group by type
  → sum amounts per type
  → map to { totalIncome, totalExpenses, netBalance, recordCount }
```

Pre-filled defaults ensure `totalIncome: 0` and `totalExpenses: 0` are always returned even if one or both types have no records.

### Category aggregation logic

```
financialrecords (deletedAt: null)
  → $group by { category, type }    ← first stage: split by type within each category
  → $group by category              ← second stage: collapse into one doc per category
  → $sort by categoryTotal desc
```

Two `$group` stages are required because a single grouping cannot simultaneously produce both the per-type breakdown and the category-level total.

### Monthly trends logic

```
financialrecords (deletedAt: null, date >= since)
  → $group by { year, month, type }
  → $group by { year, month }
  → $sort by year asc, month asc
  → merge into pre-built month map (fills gaps with zeroes)
```

The `buildMonthMap` function creates an ordered object of every calendar month in the requested range — all pre-set to zero. Aggregate results are then merged into this map. This guarantees the response always contains exactly N months in order, with zero-filled entries for months that had no activity — essential for consistent frontend chart rendering.

---

## 13. Error Handling

### HTTP status codes used

| Code | Meaning | When used |
|---|---|---|
| `200 OK` | Success | Successful reads and updates |
| `201 Created` | Resource created | Successful POST to records or users |
| `400 Bad Request` | Client input error | Validation failures, invalid ObjectId, bad field values |
| `401 Unauthorized` | Authentication failed | Missing, invalid, or expired JWT |
| `403 Forbidden` | Authorization failed | Valid JWT but insufficient role, deactivated account |
| `404 Not Found` | Resource missing | Record or user not found by ID |
| `409 Conflict` | Duplicate resource | Email already registered |
| `500 Internal Server Error` | Server fault | Unexpected errors — logged, not exposed to client |

### Global error handler

Mounted at the bottom of `server.js` after all routes:

```javascript
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});
```

### 404 handler for unknown routes

```javascript
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});
```

### Mongoose-specific error handling

| Mongoose error | HTTP response |
|---|---|
| `code 11000` (duplicate key) | `409 Conflict` |
| `ValidationError` | `400 Bad Request` with field details |
| `CastError` (invalid ObjectId) | `400 Bad Request` — caught by `isValidObjectId` check in service layer before query runs |

---

## 14. Validation Strategy

All input validation uses `express-validator`. Validation rules are defined in the route file, close to the route definition, so permissions and validation rules can be read together at a glance.

The `validate` middleware reads the result and short-circuits with a `400` if anything failed.

### What is validated

**Auth — register:**
- `name`: required, trimmed, 2–50 chars
- `email`: required, valid email format, normalized to lowercase
- `password`: required, min 6 chars
- `role`: optional, must be one of the three allowed enum values

**Auth — login:**
- `email`: required, valid email format
- `password`: required, non-empty

**Records — create:**
- `amount`: required, float, greater than 0
- `type`: required, `income` or `expense`
- `category`: required, non-empty string
- `date`: required, valid ISO 8601 date
- `notes`: optional, max 500 chars

**Records — update:**
- All fields optional (PATCH semantics)
- Same format constraints apply to any field that is provided
- Empty `category` string is explicitly rejected even on updates

**Records — list query:**
- `type`: optional, `income` or `expense`
- `from` / `to`: optional, valid ISO dates
- `page`: optional, positive integer
- `limit`: optional, positive integer, max 100

**Dashboard — trends:**
- `months`: optional, integer 1–24

**Users — create:**
- Same as register but `role` is required

**Users — update role:**
- `role`: required, enum value
- `:id` param: non-empty

**Users — update status:**
- `isActive`: required, boolean

---

## 15. Assumptions and Design Decisions

The following assumptions were made during design and implementation. Each is documented with the reasoning behind it.

### Functional assumptions

**Single organization**
The system is designed for one organization. All users and records share a single data space. There is no multi-tenancy, no workspace isolation, and no per-user record ownership restriction beyond the `createdBy` field for audit purposes.

**Single currency**
All `amount` values are plain numbers. There is no currency field, no currency conversion, and no locale-specific formatting. The consuming frontend is assumed to handle currency display. This was chosen to keep the data model simple and avoid exchange rate complexity out of scope for this assignment.

**Categories are free-text**
Record categories are stored as lowercase strings. There is no enforced category list or category management API. This allows flexibility for different organizations to use their own category names without schema changes. The tradeoff is inconsistent naming (e.g. `"salary"` vs `"salaries"`) which is mitigated by storing all categories in lowercase.

**Soft delete only for financial records**
Financial records are never hard-deleted. The `deletedAt` timestamp approach preserves audit trails, which is a standard requirement in any financial system. If a record is entered by mistake, the admin marks it deleted but the data remains in the database for auditing purposes.

**Users can be deactivated but not deleted**
User accounts follow the same philosophy. Deactivating via `isActive: false` prevents login without erasing the user's history or the `createdBy` references on their records.

**Role changes take effect on next login**
The user's role is embedded in their JWT at login time. If an admin changes a user's role while the user has an active session, the change only takes effect when the user's token expires and they log in again. This is an accepted tradeoff for simplicity — implementing token invalidation would require a token blacklist (Redis or DB-backed), which is outside the scope of this project.

**Default role is viewer**
New accounts registered through `POST /api/auth/register` default to the `viewer` role unless a role is explicitly specified. This follows the principle of least privilege — a new user gets the minimum access level until an admin grants more.

### Technical assumptions

**No file attachments**
Records are data-only. There is no support for attaching invoice PDFs, images, or any binary files to records. This keeps the API stateless and avoids blob storage complexity.

**No pagination on user list**
The `GET /api/users` endpoint returns all users without pagination. This is acceptable for an internal tool where the user count is expected to be small (tens, not thousands).

**No rate limiting**
Rate limiting is not implemented in this version. In a production deployment, a reverse proxy (nginx) or API gateway would handle this at the infrastructure level.

**No refresh token mechanism**
The system uses a single JWT with a configurable expiry. There is no refresh token flow. Users re-authenticate by logging in again when their token expires.

**MongoDB as the only database**
No caching layer (Redis), no search engine (Elasticsearch), and no relational database. MongoDB's aggregation pipeline handles all analytics requirements within acceptable performance bounds for this scale.

**Local development only**
The application is designed and tested for local development. Deployment configuration (Docker, CI/CD, environment-specific configs) is out of scope for this submission.

**`Promise.all` for parallel queries**
The record listing service runs the data query and count query simultaneously. This assumes MongoDB can handle two concurrent queries on the same collection without issue — standard behavior for any MongoDB deployment.

### Security assumptions

**HTTPS is handled externally**
The API does not enforce HTTPS. In production, HTTPS termination is assumed to be handled by a reverse proxy or cloud load balancer. Sending JWTs over plain HTTP in production would be a critical vulnerability.

**JWT secret is kept private**
The system's security depends entirely on the `JWT_SECRET` remaining secret. If it is leaked, all tokens can be forged. The `.env` file is excluded from version control via `.gitignore` to prevent accidental exposure.

**bcrypt cost factor**
Salt rounds are set to `10`. This is the standard default and provides adequate protection. Higher values (12, 14) provide more resistance to brute force attacks at the cost of slower login response times.

---

## 16. Setup and Installation

### Prerequisites

- Node.js 18 or higher
- MongoDB running locally or a MongoDB Atlas URI
- npm 9 or higher

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/finance-dashboard-api.git
cd finance-dashboard-api

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env and fill in your MONGO_URI and JWT_SECRET

# 4. Start the development server
npm run dev
# Server running on port 5000
# MongoDB connected: 127.0.0.1

# 5. (Optional) Seed sample data
npm run seed
# Creates: 1 admin, 1 analyst, 1 viewer, 15 sample records
```

### Seeded accounts (after running seed)

| Email | Password | Role |
|---|---|---|
| `admin@acme.com` | `admin123` | admin |
| `analyst@acme.com` | `analyst123` | analyst |
| `viewer@acme.com` | `viewer123` | viewer |

### Verify the server is running

```bash
curl http://localhost:5000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"admin123"}'
```

A `200` response with a token confirms the server and database are both connected and working.

---

## 17. Testing Guide

Tests are written with Jest and Supertest. An in-memory MongoDB instance (via `mongodb-memory-server`) is spun up for each test run — no test data ever touches the development or production database.

### Running tests

```bash
# Run all tests
npm test

# Run a specific test file
npm test -- tests/auth.test.js

# Run with coverage report
npm test -- --coverage
```

### Test file breakdown

| File | What it covers |
|---|---|
| `tests/auth.test.js` | Register and login — valid inputs, missing fields, duplicate email, wrong password |
| `tests/middleware.test.js` | Missing token, invalid token, expired token, role enforcement per route |
| `tests/records.test.js` | CRUD operations, filters, pagination, soft delete behavior |
| `tests/dashboard.test.js` | Summary with data, summary with no data, category totals, trends, role restrictions |
| `tests/users.test.js` | User listing, creation, role update, status update, self-modification protection |

### Key test scenarios

**Auth:**
- Register with valid data → `201`
- Register with duplicate email → `409`
- Login with correct credentials → `200` + token
- Login with wrong password → `401`
- Login with deactivated account → `403`

**Access control:**
- Every admin-only route called with viewer token → `403`
- Every protected route called without token → `401`
- Expired token → `401` with expiry message

**Records:**
- Soft delete → `deletedAt` is set, record absent from list
- Filter by `?type=expense` → only expense records returned
- Filter by `?from=&to=` → only records in date range returned
- Create with `amount: -1` → `400`
- Create as viewer → `403`

**Dashboard:**
- Summary with no records → all zeroes, `200`
- Trends with `?months=3` → exactly 3 months in response
- Trends as viewer → `403`
- Monthly gaps → zero-filled months present in response

---

*This documentation covers the system as implemented through Phase 9. Subsequent phases (error handling polish, seed script, and full test suite) build on this foundation without changing the core architecture described here.*