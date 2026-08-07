# Backend Architecture & Codebase Analysis Report

**Target System**: Creator Cash Flow REST API & Business Command Center Backend  
**Working Directory**: `c:\Users\User\OneDrive\Desktop\New folder (2)`  
**Investigated Files**: `server.js`, `package.json`, `.env.example`, `database_setup.sql`, `app.js`, `api/gemini.js`, `netlify/functions/gemini.js`

---

## 1. Executive Technical Summary

The Creator Cash Flow backend is a Node.js + Express REST API application designed to operate in dual database modes:
1. **Supabase Cloud PostgreSQL Mode**: Active when valid `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` environment variables are present.
2. **High-Reliability Memory Backup Mode**: Automatically activated if Supabase credentials are missing or unconfigured (`memoryDb` in-memory object store).

The server provides user registration, bcrypt password hashing, JWT session signing and verification, transaction seeding (in ZAR), onboarding data persistence, Phyllo SDK token orchestration, Resend transactional email integration, and a Gemini 1.5 Flash AI proxy endpoint.

---

## 2. Dependency & Stack Analysis

From `package.json`:
- **Node Framework**: Express (`express` `^4.18.3`)
- **Security & Headers**: Helmet (`helmet` `^7.1.0`), CORS (`cors` `^2.8.5`)
- **Authentication & Cryptography**: 
  - `bcryptjs` (`^2.4.3`): Used for asynchronous password hashing (`bcrypt.hash(password, 10)`) and credential verification (`bcrypt.compare`).
  - `jsonwebtoken` (`^9.0.2`): Used for issuing and verifying JWT bearer tokens with 7-day expiration (`jwt.sign`, `jwt.verify`).
- **Database Client**: `@supabase/supabase-js` (`^2.39.0`)
- **Environment Management**: `dotenv` (`^16.4.5`)
- **File Upload Support**: `multer` (`^1.4.5-lts.1`)
- **Dev Utilities**: `nodemon` (`^3.1.0`)

---

## 3. Server Configuration & Environment Variables

| Variable | Default Fallback in `server.js` | Description |
|---|---|---|
| `PORT` | `5000` | HTTP Server Port |
| `NODE_ENV` | `production` (in `.env.example`) | Environment state |
| `JWT_SECRET` | `'fallback-creator-cashflow-secret-key-2026'` | Secret key for JWT signature verification |
| `ENCRYPTION_KEY` | `'12345678901234567890123456789012'` (32 bytes) | AES-256 key for sensitive payload encryption |
| `SUPABASE_URL` | `'https://iekofqagtcztyavhunai.supabase.co'` | Supabase project URL |
| `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | `undefined` | Supabase API authentication key |
| `PHYLLO_AUTH_HEADER` | `undefined` | Basic Auth token for Phyllo Staging API (`api.staging.getphyllo.com`) |
| `RESEND_API_KEY` | `undefined` | API key for transactional emails via Resend (`api.resend.com`) |
| `FROM_EMAIL` | `'Creator Cash Flow <onboarding@resend.dev>'` | Sender email identity for Resend |
| `GEMINI_API_KEY` | `undefined` | Google Generative AI API key for Gemini 1.5 Flash |

---

## 4. Existing Database Models & Setup (`database_setup.sql`)

### Existing PostgreSQL Tables (Supabase) & Memory Fallback Structures
1. **`users`**:
   - Schema: `id` (TEXT PK), `email` (TEXT UNIQUE), `password_hash` (TEXT), `name` (TEXT), `phyllo_user_id` (TEXT), `created_at` (TIMESTAMPTZ).
   - RLS Policy: Open read/write during beta.
   - In-Memory Fallback: `memoryDb.users` array (stores `id`, `email`, `passwordHash`, `name`, `phyllo_user_id`).
2. **`transactions`**:
   - Schema: `id` (TEXT PK), `user_id` (FK -> users.id), `date` (TEXT), `source` (TEXT), `merchant` (TEXT), `type` (TEXT CHECK ('income', 'expense')), `category` (TEXT), `tax_status` (TEXT), `amount` (NUMERIC(12,2)), `created_at` (TIMESTAMPTZ).
   - In-Memory Fallback: `memoryDb.transactions` array.
3. **`onboarding_responses`**:
   - Schema: `user_id` (PK FK -> users.id), `creator_type` (TEXT), `platforms` (TEXT[]), `goal` (TEXT), `created_at` (TIMESTAMPTZ).
   - In-Memory Fallback: `memoryDb.onboarding` array.

---

## 5. Existing API Routes & Middleware Inventory

### Core Middleware
- `app.use(helmet())`: Adds security HTTP headers.
- `app.use(cors({ origin: '*', credentials: true }))`: Allows cross-origin requests.
- `app.use(express.json())`: Body parser for JSON payloads.
- `authenticateToken(req, res, next)`: Middleware validating `Authorization: Bearer <token>`. Supports bypass tokens `'demo_token'` and `'offline_token'` (attaches demo user details). Decodes JWT using `JWT_SECRET` and attaches `req.user`.

### Existing API Routes

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/` | GET | None | Health check & API version metadata |
| `/api/auth/signup` | POST | None | Creates new creator account with bcrypt password hash, seeds 5 ZAR default transactions, dispatches welcome email via Resend if API key is present |
| `/api/auth/login` | POST | None | Authenticates user credentials via bcrypt.compare and returns 7-day signed JWT |
| `/api/transactions` | GET | `authenticateToken` | Retrieves transaction ledger items for `req.user.id` |
| `/api/transactions` | POST | `authenticateToken` | Adds new transaction item for `req.user.id` |
| `/api/onboarding/save` | POST | `authenticateToken` | Saves onboarding wizard choices (creatorType, platforms, goal, connected, isManual) |
| `/api/integrations/phyllo/token` | POST | Optional | Generates Phyllo SDK token and fetches active platform mapping |
| `/api/gemini` | POST | None | Backend proxy forwarding queries to Google Gemini 1.5 Flash REST API |

---

## 6. Gap Analysis for Admin Command Portal Requirements

To fulfill the requirements outlined in `ORIGINAL_REQUEST.md` (Follow-up), the backend architecture must be expanded to include:

### 1. Cryptographically Enforced Admin Authentication (`requireAdmin` Middleware & Admin Route)
- **Missing Middleware**: `requireAdmin(req, res, next)` which verifies that `req.user` exists and possesses `role === 'admin'`. Rejects unauthenticated requests with HTTP 401 and non-admin requests with HTTP 403.
- **Missing Route**: `POST /api/admin/auth/login`. Must validate admin credentials with `bcrypt.compare`, enforce rate-limiting/brute-force protection, and issue signed JWTs containing explicit `{ id, email, name, role: 'admin' }`.
- **Admin Seeding**: Pre-configured admin user account (e.g. `admin@creatorcashflow.com` / hashed password) in both database setup SQL and `memoryDb`.

### 2. Immutable Audit Logging System
- **Missing Storage**: Table `audit_logs` (or `memoryDb.audit_logs` array) with columns: `id`, `admin_id`, `target_creator_id`, `action_type`, `old_value`, `new_value`, `timestamp`, `ip_hash`.
- **Missing Routes**:
  - `GET /api/admin/audit-logs`: Retrieves chronological audit trail entries.
  - `POST /api/admin/creators/:id/status`: Updates creator account status (plan tier, status Active/Suspended, notes) and automatically appends an audit log entry.

### 3. PII-Safe AI Query Telemetry
- **Missing Storage**: Table `ai_telemetry` (or `memoryDb.ai_telemetry` array) recording: `id`, `user_id`, `question_category` (e.g. "Tax Deduction Strategy"), `tokens_used`, `model`, `latency_ms`, `masked_prompt`, `timestamp`.
- **Missing Retention Policy**: 30-day retention filter / deletion routine.
- **Missing Route**: `GET /api/admin/telemetry` returning PII-masked query metrics.
- **Integration**: `/api/gemini` must log masked telemetry data upon execution.

### 4. Platform KPIs & Creator Management
- **Missing Routes**:
  - `GET /api/admin/metrics`: Computes aggregate Total Creators, GPV (ZAR), MRR (Pro creators), Tax Reserves (15% estimate), and historical breakdown.
  - `GET /api/admin/creators`: Lists creator directory with pagination/search/filtering attributes.

---

## 7. Evidence Chain

1. **Password Hashing & JWT Capabilities**: `server.js` lines 10-11, 106, 252-256 (`bcrypt.hash`, `bcrypt.compare`, `jwt.sign`, `jwt.verify`).
2. **Database Fallback Mechanism**: `server.js` lines 24-36 (checks Supabase env vars, initializes `memoryDb`).
3. **Transaction Seeding**: `server.js` lines 56-70 (`seedDefaultTransactions` creates ZAR transactions for AdSense, Sony Lens, TikTok, Adobe CC, Woolworths).
4. **Current Route Absence**: No routes starting with `/api/admin/*` exist in `server.js` (lines 1-600).
5. **Database Setup SQL**: `database_setup.sql` contains `users`, `transactions`, and `onboarding_responses`, but lacks `admin_users`, `audit_logs`, and `ai_telemetry`.
