# EZID API (local Postgres)

Small Express + `pg` server that replaces the Firestore data layer. The React
app's `services/db.ts` calls these endpoints over HTTP. **Firebase Auth is
unchanged** — `user.id` is still the Firebase Auth UID and is the primary key
in Postgres.

## Setup

1. Install and start PostgreSQL locally, then create the database:

   ```sh
   createdb ezid          # or: psql -c "CREATE DATABASE ezid;"
   ```

2. Configure credentials:

   ```sh
   cd server
   cp .env.example .env    # then edit PGUSER / PGPASSWORD etc.
   npm install
   ```

3. Create the tables:

   ```sh
   npm run init-db
   ```

4. Run the API:

   ```sh
   npm run dev             # http://localhost:4000  (or: npm start)
   ```

Then start the frontend as usual (`npm run dev` in the project root). It points
at `http://localhost:4000/api` by default; override with `VITE_API_URL` in a
root `.env`.

## Endpoints

| Method | Path                          | Replaces (old db.ts fn)      |
|--------|-------------------------------|------------------------------|
| POST   | `/api/users`                  | `createUserProfile`          |
| GET    | `/api/users/:id`              | `getUserProfile`             |
| GET    | `/api/users`                  | `getAllUsers`                |
| PATCH  | `/api/users/:id`              | `adminUpdateUser`            |
| DELETE | `/api/users/:id`              | `deleteUser`                 |
| POST   | `/api/users/:id/roles`        | `addRoleToUser`              |
| POST   | `/api/users/:id/alias-credit` | `addAliasCredit`             |
| POST   | `/api/users/:id/plan`         | `updateUserPlan`             |
| POST   | `/api/users/:id/verify`       | `syncEmailVerification`      |
| POST   | `/api/users/:id/api-key`      | `generateAndSaveApiKey`      |
| POST   | `/api/short-ids/claim`        | `claimCustomShortId`         |
| POST   | `/api/lookup`                 | `lookupShortId`              |
| POST   | `/api/lookup/bulk`            | `processBulkLookupBatch`     |
| GET    | `/api/stats/:businessId`      | `getBusinessStats`           |
| POST   | `/api/admin/reset`            | `resetDatabase`              |

## Note on security

The client passes `requesterId` directly and the server trusts it — fine for
local development. Before deploying, verify the caller's Firebase **ID token**
server-side (via `firebase-admin`) and derive the user id from the token instead
of trusting the request body, otherwise anyone can spend another user's credits.
