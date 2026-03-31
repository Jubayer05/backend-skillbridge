# SkillBridge Backend

A Node.js / Express REST API built with **Better Auth**, **Prisma**, and **TypeScript**. Provides full authentication (email/password, email verification, password reset) and role-based authorization for the SkillBridge platform.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
  - [Auth Routes](#auth-routes)
  - [User Routes](#user-routes)
  - [Health Check](#health-check)
- [Roles & Authorization](#roles--authorization)
- [Error Responses](#error-responses)

---

## Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Runtime     | Node.js 20+                              |
| Framework   | Express 5                                |
| Auth        | Better Auth 1.x                          |
| ORM         | Prisma 7 + PostgreSQL (Neon)             |
| Email       | Nodemailer (SMTP / Gmail)                |
| Language    | TypeScript 5                             |
| Package mgr | pnpm                                     |

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Apply database migrations
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate

# Start development server (hot reload)
pnpm dev

# Build for production
pnpm build && pnpm start
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=4000

# Frontend URL (used for CORS and email redirect links)
FRONTEND_URL=http://localhost:3000

# PostgreSQL connection string (Neon / any Postgres)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# SMTP settings (example: Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@skillbridge.com

# Better Auth secrets
BETTER_AUTH_SECRET=your_32+_char_secret
BETTER_AUTH_URL=http://localhost:4000
```

---

## Project Structure

```
src/
├── app.ts                        # Express app setup, middleware, route mounting
├── server.ts                     # HTTP server entry point
├── lib/
│   ├── auth.ts                   # Better Auth configuration (authClient)
│   ├── email.ts                  # Nodemailer email helpers
│   └── prisma.ts                 # Prisma client singleton
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts    # Request handlers
│   │   ├── auth.middleware.ts    # authenticate / authorize middleware
│   │   ├── auth.route.ts         # Route definitions
│   │   └── auth.service.ts       # Business logic, Better Auth API calls
│   └── user/
│       ├── user.controller.ts    # CRUD handlers
│       └── user.route.ts         # Route definitions
└── routes/
    └── index.ts                  # Root router (mounts all modules)
prisma/
├── schema.prisma                 # Database schema
└── migrations/                   # Migration history
```

---

## Authentication Flow

```
Register  →  Email sent (verification link)
           →  User clicks link  →  Email verified
           →  Login  →  Session cookie set
```

- Sessions are stored server-side (database-backed via Better Auth).
- Session cookies are HTTP-only and set by the backend.
- All protected routes require a valid session cookie sent with the request.
- Better Auth also exposes its own internal handler at `POST /api/auth/*` for SDK-based clients.

---

## API Endpoints

Base URL: `http://localhost:4000/api/v1`

### Auth Routes

All auth endpoints are prefixed with `/auth`.

---

#### `POST /auth/register`

Register a new user account. A verification email is sent automatically.

**Request Body**

```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "StrongPassword123!"
}
```

**Success Response** `201 Created`

```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "data": { "id": "...", "email": "alice@example.com", "name": "Alice Smith" }
}
```

---

#### `POST /auth/login`

Sign in with email and password. Returns a session cookie.

> Email must be verified before login succeeds (when `requireEmailVerification: true`).

**Request Body**

```json
{
  "email": "alice@example.com",
  "password": "StrongPassword123!"
}
```

**Success Response** `200 OK`

```json
{
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "alice@example.com", "role": "STUDENT" },
    "session": { "id": "...", "expiresAt": "..." }
  }
}
```

> Sets `Set-Cookie: better-auth.session_token=...` header.

---

#### `POST /auth/verify-email`

Resend the email verification link to the given address.

**Request Body**

```json
{
  "email": "alice@example.com",
  "callbackURL": "http://localhost:3000/auth/verify-email"
}
```

**Success Response** `200 OK`

```json
{
  "message": "Verification email sent successfully",
  "data": {}
}
```

---

#### `POST /auth/forgot-password`

Request a password reset email.

**Request Body**

```json
{
  "email": "alice@example.com"
}
```

**Success Response** `200 OK`

```json
{
  "message": "Password reset email sent successfully",
  "data": {}
}
```

---

#### `POST /auth/reset-password`

Reset password using the token received via email.

**Request Body**

```json
{
  "token": "<token_from_email_link>",
  "newPassword": "NewStrongPassword456!"
}
```

**Success Response** `200 OK`

```json
{
  "message": "Password reset successfully",
  "data": {}
}
```

---

#### `POST /auth/update-password` 🔒

Change password while logged in. Requires a valid session.

**Headers**: session cookie required.

**Request Body**

```json
{
  "currentPassword": "StrongPassword123!",
  "newPassword": "NewStrongPassword456!"
}
```

**Success Response** `200 OK`

```json
{
  "message": "Password updated successfully",
  "data": {}
}
```

**Error** `400 Bad Request` — missing fields  
**Error** `401 Unauthorized` — invalid session or wrong current password

---

#### `POST /auth/logout` 🔒

Invalidate the current session. Requires a valid session.

**Headers**: session cookie required.

**Success Response** `200 OK`

```json
{
  "message": "Logged out successfully",
  "data": {}
}
```

---

### User Routes

All user endpoints are prefixed with `/users`.

---

#### `POST /users/signup`

Create a user record directly (admin / seeding use). For normal user registration use `/auth/register`.

**Request Body**

```json
{
  "name": "Bob Jones",
  "email": "bob@example.com",
  "role": "STUDENT"
}
```

**Success Response** `201 Created` — returns the created user object.

---

#### `GET /users/get-users`

Retrieve all users.

**Success Response** `200 OK` — returns array of user objects.

---

#### `GET /users/get-user/:id`

Retrieve a single user by ID.

**Path Parameter**: `id` — user UUID

**Success Response** `200 OK` — returns the user object.

---

#### `PUT /users/update-user/:id`

Update a user's `name`, `email`, or `password`.

**Path Parameter**: `id` — user UUID

**Request Body**

```json
{
  "name": "Bob Updated",
  "email": "bob-new@example.com"
}
```

**Success Response** `200 OK` — returns the updated user object.

---

#### `DELETE /users/delete-user/:id`

Delete a user by ID.

**Path Parameter**: `id` — user UUID

**Success Response** `200 OK`

```json
{ "message": "User deleted successfully" }
```

---

### Health Check

#### `GET /api/v1/health`

Verify the server is running.

**Success Response** `200 OK`

```json
{
  "message": "OK",
  "timestamp": "2026-03-30T10:00:00.000Z"
}
```

---

## Roles & Authorization

| Role      | Description                          |
|-----------|--------------------------------------|
| `STUDENT` | Default role for all new users       |
| `TUTOR`   | Tutor role                           |
| `ADMIN`   | Full access to all resources         |

### Using the `authorize` middleware

```ts
import { authenticate, authorize } from "../auth/auth.middleware";

// Only ADMIN can access
router.get("/admin-only", authenticate, authorize("ADMIN"), handler);

// ADMIN or TUTOR can access
router.get("/tutor-admin", authenticate, authorize("ADMIN", "TUTOR"), handler);
```

The `authenticate` middleware must always run **before** `authorize`. It attaches `req.user` and `req.session` to the request.

---

## Error Responses

All error responses follow this shape:

```json
{
  "error": "Short error label",
  "message": "Human-readable description"
}
```

| Status | Meaning                                  |
|--------|------------------------------------------|
| `400`  | Bad Request — missing or invalid fields  |
| `401`  | Unauthorized — no/invalid session        |
| `403`  | Forbidden — insufficient role            |
| `500`  | Internal Server Error                    |
