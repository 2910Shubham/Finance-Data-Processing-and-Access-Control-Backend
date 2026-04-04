# Project TODO — Finance Dashboard API

A step-by-step checklist to build, test, and complete the project from scratch.
Work through these in order — each step builds on the last.

---

## Phase 1 — Project setup

- [ ] Run `npm init -y`
- [ ] Install production dependencies
  ```bash
  npm install express mongoose jsonwebtoken bcryptjs dotenv cors express-validator morgan
  ```
- [ ] Install dev dependencies
  ```bash
  npm install --save-dev nodemon jest supertest
  ```
- [ ] Set `"type": "module"` in `package.json` for ESM imports
- [ ] Add scripts to `package.json`
  ```json
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node --experimental-vm-modules node_modules/.bin/jest --runInBand"
  }
  ```
- [ ] Create `.env` file with `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`
- [ ] Create `.env.example` with placeholder values (safe to commit)
- [ ] Create `.gitignore` (already done)
- [ ] Create the full folder structure
  ```
  src/config, src/models, src/middleware, src/routes, src/controllers, src/services
  ```
- [ ] Run `git init` and make first commit

---

## Phase 2 — Database connection

- [ ] Write `src/config/db.js` (already done)
- [ ] Write `server.js` entry point — import dotenv, connectDB, express
- [ ] Test: run `npm run dev`, confirm "MongoDB connected" prints in terminal
- [ ] Test: set a wrong `MONGO_URI` in `.env`, confirm server exits with a clear error

---

## Phase 3 — User model

- [ ] Write `src/models/User.js` with fields: `name`, `email`, `password`, `role`, `isActive`, `timestamps`
- [ ] Add `enum` validation on `role`: `['admin', 'analyst', 'viewer']`
- [ ] Add `select: false` on `password` field
- [ ] Add `pre('save')` hook to hash password with `bcryptjs`
- [ ] Add `comparePassword` instance method
- [ ] Add `toJSON` method to strip password from responses
- [ ] Test: open `node` REPL, import User model, create a test user, confirm password is hashed in MongoDB

---

## Phase 4 — Financial record model

- [ ] Write `src/models/FinancialRecord.js` with fields: `amount`, `type`, `category`, `date`, `notes`, `createdBy`, `deletedAt`, `timestamps`
- [ ] Add `enum` validation on `type`: `['income', 'expense']`
- [ ] Add `min: 0.01` validation on `amount`
- [ ] Add `ref: 'User'` on `createdBy` field
- [ ] Add `default: null` on `deletedAt` for soft delete
- [ ] Add indexes: `type + date`, `category`, `createdBy`, `deletedAt`
- [ ] Add `.active()` query helper that filters `{ deletedAt: null }`

---

## Phase 5 — Auth middleware

- [ ] Write `src/middleware/verifyToken.js`
  - Extract Bearer token from `Authorization` header
  - Return `401` if token is missing
  - Return `401` if token is invalid or expired
  - Attach decoded payload to `req.user`
- [ ] Write `src/middleware/requireRole.js`
  - Accept an array of allowed roles
  - Return `403` if `req.user.role` is not in the array
  - Call `next()` if role is permitted
- [ ] Write `src/middleware/validate.js`
  - Use `validationResult` from `express-validator`
  - Return `400` with array of error messages if validation fails
  - Call `next()` if input is clean

---

## Phase 6 — Auth routes and controller

- [ ] Write `src/controllers/auth.controller.js`
  - `register`: create user, return user object (no password)
  - `login`: find user by email, compare password, sign JWT with `{ id, role, email }`, return token
- [ ] Write `src/routes/auth.routes.js`
  - `POST /api/auth/register` with validation: name, email, password required
  - `POST /api/auth/login` with validation: email, password required
- [ ] Mount auth router in `server.js`
- [ ] Manual test with Postman or curl:
  - Register a new user → expect `201` and user object
  - Login with correct credentials → expect `200` and `token`
  - Login with wrong password → expect `401`
  - Register with duplicate email → expect `400` or `409`

---

## Phase 7 — User management routes (admin only)

- [ ] Write `src/controllers/user.controller.js`
  - `getAllUsers`: return all users (exclude passwords)
  - `createUser`: admin creates user with explicit role
  - `updateRole`: change a user's role by id
  - `updateStatus`: set `isActive` to true or false by id
- [ ] Write `src/routes/user.routes.js`
  - `GET /api/users` — `verifyToken`, `requireRole(['admin'])`
  - `POST /api/users` — `verifyToken`, `requireRole(['admin'])`, validate body
  - `PATCH /api/users/:id/role` — `verifyToken`, `requireRole(['admin'])`
  - `PATCH /api/users/:id/status` — `verifyToken`, `requireRole(['admin'])`
- [ ] Mount user router in `server.js`
- [ ] Manual test:
  - Call `GET /api/users` without token → expect `401`
  - Call `GET /api/users` with viewer token → expect `403`
  - Call `GET /api/users` with admin token → expect `200` and user list

---

## Phase 8 — Financial record routes and controller

- [ ] Write `src/services/record.service.js`
  - `getAllRecords(filters)`: query with optional `type`, `category`, `from`, `to`, pagination
  - `createRecord(data)`: insert new document
  - `updateRecord(id, data)`: find by id and update
  - `softDeleteRecord(id)`: set `deletedAt = new Date()`
- [ ] Write `src/controllers/record.controller.js` — thin layer, calls service, sends response
- [ ] Write validation rules for `POST` and `PATCH` (amount, type, category, date)
- [ ] Write `src/routes/record.routes.js`
  - `GET /api/records` — `verifyToken`, `requireRole(['admin','analyst','viewer'])`
  - `POST /api/records` — `verifyToken`, `requireRole(['admin'])`, validate
  - `PATCH /api/records/:id` — `verifyToken`, `requireRole(['admin'])`, validate
  - `DELETE /api/records/:id` — `verifyToken`, `requireRole(['admin'])`
- [ ] Mount record router in `server.js`
- [ ] Manual test:
  - Create a record as admin → expect `201`
  - Create a record as viewer → expect `403`
  - Get records with `?type=expense` filter → expect filtered list
  - Delete a record → confirm `deletedAt` is set in MongoDB, not removed
  - Fetch records list → confirm deleted record does not appear

---

## Phase 9 — Dashboard routes and service

- [ ] Write `src/services/dashboard.service.js`
  - `getSummary()`: aggregate total income, total expenses, net balance, record count
  - `getCategoryTotals()`: group by category, sum amounts
  - `getMonthlyTrends(months)`: group by month and type for last N months
  - `getRecentRecords(limit)`: last N active records sorted by date desc
- [ ] Write `src/controllers/dashboard.controller.js`
- [ ] Write `src/routes/dashboard.routes.js`
  - `GET /api/dashboard/summary` — all roles
  - `GET /api/dashboard/categories` — all roles
  - `GET /api/dashboard/trends` — `requireRole(['admin','analyst'])`
  - `GET /api/dashboard/recent` — all roles
- [ ] Mount dashboard router in `server.js`
- [ ] Manual test:
  - Hit `/api/dashboard/summary` after inserting some records → confirm totals are correct
  - Hit `/api/dashboard/trends` as viewer → expect `403`
  - Hit `/api/dashboard/summary` with no records → confirm returns zeroes, not an error

---

## Phase 10 — Error handling

- [ ] Add a global error handler middleware at the bottom of `server.js`
  ```javascript
  app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Internal server error' });
  });
  ```
- [ ] Add a 404 handler for unknown routes
  ```javascript
  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
  });
  ```
- [ ] Handle Mongoose duplicate key error (`code 11000`) → return `409` with readable message
- [ ] Handle Mongoose cast error (invalid ObjectId) → return `400 Bad Request`
- [ ] Handle Mongoose validation errors → return `400` with field-level messages

---

## Phase 11 — Seeding script

- [ ] Write `scripts/seed.js`
  - Connect to DB
  - Create one admin, one analyst, one viewer user
  - Create 10–15 sample financial records across different categories and months
  - Disconnect and exit
- [ ] Add seed script to `package.json`
  ```json
  "seed": "node scripts/seed.js"
  ```
- [ ] Run `npm run seed`, confirm data appears in MongoDB

---

## Phase 12 — Tests

### Setup
- [ ] Create `tests/` folder at project root
- [ ] Create `tests/setup.js` — connect to a test MongoDB (use `mongodb-memory-server` or a separate test DB URI)
- [ ] Add Jest config to `package.json`
  ```json
  "jest": {
    "testEnvironment": "node",
    "setupFilesAfterFramework": ["./tests/setup.js"]
  }
  ```
- [ ] Install `mongodb-memory-server` for isolated test DB
  ```bash
  npm install --save-dev mongodb-memory-server
  ```

### Auth tests — `tests/auth.test.js`
- [ ] POST `/api/auth/register` — valid data → `201` + user object
- [ ] POST `/api/auth/register` — missing name → `400`
- [ ] POST `/api/auth/register` — invalid email → `400`
- [ ] POST `/api/auth/register` — duplicate email → `409`
- [ ] POST `/api/auth/login` — correct credentials → `200` + token
- [ ] POST `/api/auth/login` — wrong password → `401`
- [ ] POST `/api/auth/login` — non-existent email → `401`

### Middleware tests — `tests/middleware.test.js`
- [ ] Request with no token → `401`
- [ ] Request with malformed token → `401`
- [ ] Request with expired token → `401`
- [ ] Viewer hitting admin-only route → `403`
- [ ] Analyst hitting admin-only route → `403`
- [ ] Admin hitting admin-only route → passes through

### Record tests — `tests/records.test.js`
- [ ] Admin creates record with valid data → `201`
- [ ] Admin creates record with negative amount → `400`
- [ ] Admin creates record with invalid type → `400`
- [ ] Viewer tries to create record → `403`
- [ ] Get records — returns only non-deleted records
- [ ] Get records with `?type=expense` → returns only expenses
- [ ] Get records with `?from` and `?to` → returns date-filtered results
- [ ] Admin soft deletes record → `deletedAt` is set, record absent from list
- [ ] Request deleted record by id → `404`

### Dashboard tests — `tests/dashboard.test.js`
- [ ] Summary with no records → returns all zeroes
- [ ] Summary with mixed records → correct income, expense, net balance
- [ ] Category totals → grouped correctly
- [ ] Monthly trends as analyst → `200`
- [ ] Monthly trends as viewer → `403`

### User management tests — `tests/users.test.js`
- [ ] Admin gets user list → `200`
- [ ] Viewer gets user list → `403`
- [ ] Admin changes user role → role updated in DB
- [ ] Admin deactivates user → `isActive` set to false

---

## Phase 13 — Final polish

- [ ] Review all routes — confirm every endpoint has `verifyToken` and `requireRole`
- [ ] Confirm password never appears in any API response
- [ ] Confirm soft delete is consistent — no hard deletes anywhere
- [ ] Check all `console.log` statements — remove or replace with proper log levels
- [ ] Re-read README — update any sections that changed during build
- [ ] Run full test suite — all tests green
- [ ] Run `npm run seed` on a clean DB — confirm seed works end to end
- [ ] Test the full happy path manually: register → login → create records → view dashboard
- [ ] Push to GitHub with a clean commit history

---

## Quick reference — completion order

```
Phase 1  →  Project setup
Phase 2  →  DB connection
Phase 3  →  User model
Phase 4  →  Financial record model
Phase 5  →  Middleware (verifyToken, requireRole, validate)
Phase 6  →  Auth (register, login)
Phase 7  →  User management
Phase 8  →  Financial records CRUD
Phase 9  →  Dashboard aggregations
Phase 10 →  Error handling
Phase 11 →  Seed script
Phase 12 →  Tests
Phase 13 →  Final polish
```