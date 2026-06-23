# EZID — Identity, Simplified

> A digital **identity-shortening platform**. Share one short handle like **`ezid.in/rahul23`** instead of a long email address. Businesses pay per credit to resolve those handles back to verified emails — in single lookups or bulk.

<p>
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white">
  <img alt="Node" src="https://img.shields.io/badge/Node-Express-339933?logo=node.js&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white">
</p>

---

## ✨ Features

- **Claim a short identity** — individuals reserve a unique handle that maps to their email (first one free, extra aliases are paid).
- **Single & bulk lookups** — businesses resolve handles to emails, including CSV bulk upload, paying with a credit system.
- **Credit plans & billing** — Free / Edu / Business Pro tiers via **Razorpay**, with auto-resetting free credits and 30-day paid validity.
- **Postgres-native auth** — email/password with **bcrypt** hashing and **JWT** sessions. Email verification + password reset handled in-app.
- **Transactional email** — branded verification, password-reset, welcome, and receipt emails via **Resend**.
- **Admin console** — manage users, promote plans, and view platform data.
- **Hardened API** — every endpoint requires a JWT (the acting user is derived from the token), plus server-side rate limiting on email endpoints.

---

## 🧱 Architecture

A clean three-tier app. The browser only renders UI and calls the API; **all business logic and data access live in the Express server**.

```
┌──────────────────────────┐     ┌──────────────────────────┐     ┌──────────────────┐
│  Frontend  (React+Vite)  │     │   API  (Express + pg)    │     │   PostgreSQL     │
│  localhost:3000          │ ──► │   localhost:4000         │ ──► │   database "ezid"│
│  UI + fetch (JWT)        │     │   auth · logic · email   │     │   3 tables       │
└──────────────────────────┘     └────────────┬─────────────┘     └──────────────────┘
                                               └──► Resend ──► inboxes
```

**Tech stack:** React 18 · TypeScript · Vite · Tailwind CSS · React Router · Recharts · Node/Express · node-postgres · bcryptjs · jsonwebtoken · Resend · Razorpay.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 16/17 (running locally)

### 1. Clone & install
```bash
git clone https://github.com/RamanBhakuni/ezid_google_ai.git
cd ezid_google_ai
npm install
```

### 2. Set up the database
```bash
createdb ezid          # or: psql -c "CREATE DATABASE ezid;"
```

### 3. Configure & start the API
```bash
cd server
cp .env.example .env    # fill in the values (see below)
npm install
npm run init-db         # create tables
npm run migrate-auth    # add auth columns
npm run seed            # optional: dummy data
npm run start           # API on http://localhost:4000
```

### 4. Start the frontend (separate terminal)
```bash
# from the project root
npm run dev             # app on http://localhost:3000
```

> You need **two processes** running: the API (`:4000`) and the frontend (`:3000`). PostgreSQL runs as a background service.

---

## 🔐 Environment variables (`server/.env`)

Real secrets live **only** in `server/.env`, which is git-ignored. The repo ships `server/.env.example` as a template.

| Variable | Description |
|---|---|
| `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` | Postgres connection |
| `PORT` | API port (default `4000`) |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key for sending email |
| `EMAIL_FROM` | Sender address (use a verified domain in production) |
| `JWT_SECRET` | Secret for signing JWTs — **use a long random value in production** |
| `APP_URL` | Frontend URL, used to build email links (default `http://localhost:3000`) |

---

## 🗂 Project structure

```
ezid_google_ai/
├── App.tsx                 # routes + protected-route guards
├── pages/                  # Landing, Auth, dashboards, bulk lookup, verify/reset
├── components/             # shared UI (Layout)
├── services/
│   ├── authContext.tsx     # JWT auth state
│   ├── db.ts               # API client (token + all data calls)
│   ├── email.ts            # client email helper
│   └── payment.ts          # Razorpay integration
└── server/                 # backend API
    ├── schema.sql · seed.sql · migrate_auth.sql
    └── src/
        ├── index.js        # all endpoints (auth + data)
        ├── auth.js         # bcrypt + JWT + middleware
        ├── rateLimit.js    # in-memory rate limiter
        ├── email.js        # Resend templates
        └── pool.js         # pg connection pool
```

---

## 🧮 Data model (PostgreSQL)

| Table | Purpose |
|---|---|
| `users` | Profiles, roles, plan, credits, password hash, verification/reset tokens |
| `short_ids` | The `handle → email` mappings (owner = a user) |
| `lookups` | Audit log of every lookup; powers the stats dashboard |

The two money-critical operations — **claiming a handle** and **a credit-deducting lookup** — run as atomic SQL transactions, so handles can't be double-claimed and credits can't be double-spent.

---

## 📡 API overview

| Area | Endpoints |
|---|---|
| **Auth** | `POST /api/auth/{register,login,verify-email,resend-verification,forgot-password,reset-password}` · `GET /api/auth/me` |
| **Users** | `GET /api/users/:id` · `GET /api/users` *(admin)* · `PATCH/DELETE /api/users/:id` *(admin)* · `POST /api/users/:id/{roles,plan,api-key,alias-credit}` |
| **Core** | `POST /api/short-ids/claim` · `POST /api/lookup` · `POST /api/lookup/bulk` · `GET /api/stats/:businessId` |
| **Misc** | `POST /api/admin/reset` *(admin)* · `POST /api/email/send` · `GET /api/health` |

All data endpoints require an `Authorization: Bearer <token>` header.

---

## 🛠 Server scripts (`server/`)

| Command | Does |
|---|---|
| `npm run start` | Start the API |
| `npm run dev` | Start the API with auto-reload |
| `npm run init-db` | Create tables from `schema.sql` |
| `npm run migrate-auth` | Add auth columns to an existing DB |
| `npm run seed` | Insert dummy/test data |
| `npm run set-password -- <email> <password>` | Set a password for an existing account |

---

## 🔒 Security notes

- Passwords are hashed with **bcrypt**; sessions are stateless **JWTs**.
- Every data endpoint is JWT-protected and derives the user from the token (no trusting client-supplied IDs).
- Email-sending endpoints are **rate-limited** server-side (1 per address / 90s).
- Secrets stay in `server/.env` (git-ignored) — never commit real keys.

> **Before production:** set a strong `JWT_SECRET`, a real DB password, a verified email domain, and host the API + Postgres behind HTTPS.

---

## 📄 License

Private project — all rights reserved.
