# Specification Mining & Requirements Analysis Report
**Target System**: Creator Cash Flow (CCF) — Landing Page, Onboarding Engine, and Standalone Admin Command Portal  
**Document Author**: Spec Miner 3 (Specification & Requirements Miner)  
**Date**: 2026-08-07  
**Integrity Mode**: Development / High Reliability  

---

## Executive Summary

This report presents an exhaustive specification mining, feature inventory, technical contract definition, and verification strategy for the Creator Cash Flow (CCF) platform. It synthesizes requirements from both the initial redesign request (Arc/Framer landing page & 6-step onboarding wizard) and the subsequent administrative portal request (`admin.html`, cryptographically enforced admin auth, immutable audit logging, PII-safe AI telemetry, platform KPI scorecards, and backend API routes in `server.js`).

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Landing Page | Arc/Framer Hero Section | Full-screen landing hero with ambient radial mesh backdrops, glassmorphic navbar (`backdrop-blur-md`), floating mockups | Viewport scroll/resize | Rendered hero UI, visual sweeps | Responsive layout falls back gracefully down to 375px | ORIGINAL_REQUEST.md (Initial R1) |
| 2 | Onboarding | 6-Step Onboarding Wizard | Guided onboarding flow with platform cards, Phyllo connection, goal selection, manual fallback link, launch transition | User selections, platform clicks | Saved onboarding state, dashboard redirect | Manual skip fallback link on Phyllo failure | ORIGINAL_REQUEST.md (Initial R2) |
| 3 | Visual Micro-UI | Micro-Animations & Hover Effects | CSS/JS micro-animations (text fade/slide, 2px card lifts on hover, neon border glows, selection states) | Cursor hover/focus/tap | Smooth CSS transitions & transform effects | Degrades smoothly if motion reduced | ORIGINAL_REQUEST.md (Initial R3) |
| 4 | Admin Auth | Cryptographic Admin Authentication | Real server-side admin login with bcrypt password hashing, signed admin JWT (`role: 'admin'`), Bearer headers | `{ email/username, password }` | `{ message, token, admin }` | 401 Unauthorized for invalid creds, 400 missing fields | ORIGINAL_REQUEST.md (Follow-up R1) |
| 5 | Admin Auth | Brute-Force Rate Limiting | Rate-limited admin login endpoint to prevent credential brute-force attacks | Login request IP & frequency | Allowed pass or HTTP 429 Too Many Requests | HTTP 429 after 5 failed attempts in 15 mins | ORIGINAL_REQUEST.md (Follow-up R1) |
| 6 | Admin Auth | Admin Session Gate (`admin.html`) | Dedicated login gate overlay in `admin.html`; validates session token before rendering dashboard | Stored JWT token | Portal access or Login Gate view | HTTP 401/403 redirects or displays login form | ORIGINAL_REQUEST.md (Follow-up R1) |
| 7 | Audit Logging | Immutable Admin Audit Ledger | Immutable log insertion for all admin mutations (status, plan, notes) into `audit_logs` table/memory | `{ admin_id, target_creator_id, action_type, old_value, new_value, ip_hash }` | Inserted audit log record | HTTP 500 error if audit log write fails; transaction rollback | ORIGINAL_REQUEST.md (Follow-up R2) |
| 8 | Audit Logging | Audit Trail UI Tab | Filterable, chronological audit log viewer tab in `admin.html` | Action type filter, date range, search query | Tabular audit event list | Shows empty state if no logs match filter | ORIGINAL_REQUEST.md (Follow-up R2) |
| 9 | AI Telemetry | PII & Financial Masking Engine | Regex & pattern parser that strips PII (emails, phones, IDs, cards) and raw financial amounts from query logs | Raw user AI prompt | Category tag, masked prompt text | Replaces sensitive strings with `[REDACTED_*]` tags | ORIGINAL_REQUEST.md (Follow-up R3) |
| 10 | AI Telemetry | 30-Day Automated Retention TTL | Automated purge/filtering policy for AI telemetry logs older than 30 days | `created_at` timestamp | Telemetry dataset bounded to <= 30 days | Auto-deletes or excludes expired entries | ORIGINAL_REQUEST.md (Follow-up R3) |
| 11 | AI Telemetry | Telemetry Logs API & UI View | API endpoint (`GET /api/admin/telemetry`) & admin UI displaying tokens, model source, latency, category | Bearer admin token | Array of masked telemetry logs | 401/403 if unauthorized | ORIGINAL_REQUEST.md (Follow-up R3) |
| 12 | Platform KPIs | Real-Time Platform Scorecards | Aggregate KPI cards: Total Creators, Gross Platform Volume (GPV in ZAR), MRR (Pro subs), Tax Reserves (15%) | Database user & ledger query aggregation | Numerical KPI values & formatters (ZAR) | Fallback to zero values if DB query returns empty | ORIGINAL_REQUEST.md (Follow-up R4) |
| 13 | Platform KPIs | Growth & Revenue Distribution Chart | Interactive Chart.js timeline showing platform growth and revenue split (YouTube, TikTok, Patreon, Brand Deals) | Monthly historical data points | Rendered canvas Chart.js line/bar graph | Renders fallback empty graph if dataset missing | ORIGINAL_REQUEST.md (Follow-up R4) |
| 14 | Creator Operations | Searchable Creator Directory Table | Comprehensive table listing creators with Name, Email, Platforms, Cash Flow, Plan Tier, Status, Join Date | Search text, Plan filter tab (All/Pro/Free), Sort option | Filtered & sorted creator rows | Displays "No creators found" empty state | ORIGINAL_REQUEST.md (Follow-up R5) |
| 15 | Creator Operations | Interactive Creator Detail Modal | Modal showing creator ledger snapshot, subscription plan toggle (Free/Pro), account suspension toggle (Active/Suspended) | Creator ID click, toggle actions | Updated status/plan & mandatory audit log trigger | Modal alert on API error; state reverted | ORIGINAL_REQUEST.md (Follow-up R5) |
| 16 | Backend Core | `requireAdmin` Middleware | Role-protected middleware validating JWT signature and requiring `user.role === 'admin'` | HTTP `Authorization` header | `req.admin` populated or 401/403 response | 401 for missing/invalid token, 403 for non-admin role | ORIGINAL_REQUEST.md (Follow-up R6) |
| 17 | Backend API | Admin Metrics Endpoint | `GET /api/admin/metrics` returning aggregated platform statistics, scorecards, and chart datasets | Bearer admin JWT | JSON metrics payload | 401/403 if unauthenticated/unauthorized | ORIGINAL_REQUEST.md (Follow-up R6) |
| 18 | Backend API | Admin Creators List Endpoint | `GET /api/admin/creators` returning creator directory with query filters (search, tier, limit) | Bearer admin JWT, query params | JSON array of creators + total count | 401/403 if unauthenticated/unauthorized | ORIGINAL_REQUEST.md (Follow-up R6) |
| 19 | Backend API | Admin Creator Status Mutation | `POST /api/admin/creators/:id/status` updating plan tier, account status, or notes with mandatory audit log | Bearer admin JWT, `{ status, plan_tier, note }` | Updated creator record + created audit log ID | 400 bad request, 404 creator not found, 401/403 auth error | ORIGINAL_REQUEST.md (Follow-up R6) |
| 20 | Backend API | Admin Audit Logs Endpoint | `GET /api/admin/audit-logs` returning chronological administrative audit trail | Bearer admin JWT, query filters | JSON array of audit log entries | 401/403 if unauthenticated/unauthorized | ORIGINAL_REQUEST.md (Follow-up R6) |

---

## Edge Cases

| # | Feature | Input | Observed / Expected Behavior |
|---|---------|-------|------------------------------|
| 1 | Admin Auth | Expired or Tampered Admin JWT | Request rejected immediately by `requireAdmin` middleware with HTTP 401 / 403 JSON error response. |
| 2 | Admin Auth | Non-admin user JWT attempting `/api/admin/*` access | Middleware checks `decoded.role === 'admin'`; rejects with HTTP 403 Forbidden ("Admin role required"). |
| 3 | Admin Auth | Rapid brute-force login attempts (> 5 in 15m) | Rate-limiting middleware intercepts and responds with HTTP 429 Too Many Requests with `Retry-After` header. |
| 4 | Audit Logging | Status change attempted when DB transaction fails | Mutation must fail atomically; audit log insertion failure rolls back creator status update and returns HTTP 500. |
| 5 | Audit Logging | Special characters or HTML in admin notes | Inputs sanitized and escaped prior to rendering in Audit Trail UI to prevent XSS. |
| 6 | AI Telemetry | Prompt containing credit card, SA ID number, and ZAR amounts | PII Engine replaces all matched patterns (`[REDACTED_CARD]`, `[REDACTED_GOV_ID]`, `[REDACTED_FINANCIAL_AMOUNT]`) before DB insert. |
| 7 | AI Telemetry | Query created exactly 31 days ago | Retention TTL query (`WHERE created_at >= NOW() - INTERVAL '30 days'`) automatically filters out entry. |
| 8 | KPI Scorecards | System has zero creators or zero transactions | KPI scorecards display `0` creators, `R 0.00` GPV, `R 0.00` MRR, `R 0.00` Tax Reserves without dividing by zero or throwing NaN errors. |
| 9 | Creator Table | Search term contains regex syntax e.g. `.*` or `[a-z]` | Search input treated as literal string comparison, preventing regex injection or client-side script crash. |
| 10 | Creator Table | Creator with no linked social platforms | UI renders a neutral badge "No Platforms Linked" instead of breaking table column layout. |
| 11 | Phyllo Onboarding | Staging API key missing or network failure | Phyllo connection modal shows error toast and provides explicit fallback skip link (`is_manual: true`). |
| 12 | Responsive UI | Portal opened on 375px mobile device screen | Sidebar collapses into hamburger drawer / tab bar; scorecards stack vertically into a 1-column responsive grid. |

---

## Detailed Requirement Analysis (R1 – R6 & Landing/Onboarding)

### R1. Cryptographically Enforced Admin Authentication & Session Security
- **Authentication Credentials**: Admin accounts require salted bcrypt password hashing (`bcrypt.hash(password, 10)`).
- **JWT Architecture**: Signed JWT containing `{ id: adminId, email: adminEmail, role: 'admin' }`, signed with `process.env.JWT_SECRET`, expiration set to 24 hours.
- **Header Protocol**: Standard HTTP Bearer token scheme: `Authorization: Bearer <token>`.
- **Rate Limiting**: Rate limiter middleware configured for `/api/admin/auth/login` (maximum 5 attempts per IP per 15-minute window).
- **Login Gate (`admin.html`)**:
  - `admin.html` initially checks `localStorage.getItem('ccf_admin_token')`.
  - If token exists, sends background validation request to `GET /api/admin/metrics`.
  - If 401/403 or no token, shows full-screen Dark Luxury Login Modal (`#admin-login-modal`).
  - Upon successful login, stores token and renders main command dashboard (`#admin-dashboard`).

### R2. Immutable Admin Action Audit Logging
- **Database Table (`audit_logs`)**:
  ```sql
  CREATE TABLE IF NOT EXISTS public.audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      target_creator_id TEXT NOT NULL,
      action_type TEXT NOT NULL, -- e.g. 'PLAN_TIER_CHANGE', 'STATUS_SUSPEND', 'STATUS_REACTIVATE', 'NOTE_ADDED'
      old_value TEXT,
      new_value TEXT,
      ip_hash TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
  );
  ```
- **Audit Trigger Logic**: Every execution of `POST /api/admin/creators/:id/status` MUST perform a database transaction inserting a row into `audit_logs` capturing the exact previous state (`old_value`) and updated state (`new_value`).
- **IP Hashing**: Client IP address hashed with SHA-256 (`crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)`) to protect admin network privacy while preserving audit identity.
- **Audit Trail UI Tab**:
  - Filterable by Action Type (`All`, `Status Change`, `Plan Change`, `Note Added`).
  - Searchable by Target Creator ID or Name.
  - Chronological descending table rendering: Timestamp, Admin ID, Target Creator, Action Type, Old Value -> New Value, IP Hash.

### R3. PII-Safe AI Query Telemetry & Privacy Retention
- **PII & Financial Masking Rules**:
  - Email Regex: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g` -> `[REDACTED_EMAIL]`
  - Phone Regex: `/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g` -> `[REDACTED_PHONE]`
  - SA ID / Gov ID Regex: `/\b\d{13}\b/g` -> `[REDACTED_GOV_ID]`
  - Credit Card Regex: `/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g` -> `[REDACTED_CARD]`
  - Currency / Financial Amounts Regex: `/(?:R|\$|\bZAR\b|\bUSD\b)\s?\d+(?:,\d{3})*(?:\.\d{2})?/gi` -> `[REDACTED_FINANCIAL_AMOUNT]`
- **Question Categorization**: Maps prompts to standard taxonomy: `"Tax Deduction Strategy"`, `"Gear Purchase Planning"`, `"Revenue Optimization"`, `"Brand Contract Advice"`, `"General Advisory"`.
- **Database Table (`ai_query_telemetry`)**:
  ```sql
  CREATE TABLE IF NOT EXISTS public.ai_query_telemetry (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      question_category TEXT NOT NULL,
      masked_prompt TEXT NOT NULL,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      model_source TEXT NOT NULL DEFAULT 'Gemini 1.5 Flash',
      latency_ms INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
  );
  ```
- **30-Day Retention Policy**:
  - Database purge function or active filter: `WHERE created_at >= NOW() - INTERVAL '30 days'`.
  - Cron cleanup trigger or API request filter ensuring raw prompts older than 30 days are permanently purged.

### R4. Platform KPI Scorecards & Financial Telemetry
- **Mathematical Formulations**:
  1. **Total Registered Creators ($N_{creators}$)**:
     $$N_{creators} = \text{COUNT}(\text{users where role != 'admin'})$$
  2. **Gross Platform Volume (GPV)**:
     $$GPV = \sum \text{monthly\_cash\_flow of active creators} \quad (\text{in ZAR})$$
  3. **Monthly Recurring Revenue (MRR)**:
     $$MRR = \text{COUNT}(\text{users where plan\_tier = 'Pro'}) \times \text{R 299.00}$$
  4. **Collective Platform Tax Reserves**:
     $$\text{Tax Reserves} = GPV \times 0.15 \quad (15\% \text{ sole-proprietor estimated holding})$$
- **Chart.js Timeline Specification**:
  - Canvas element: `<canvas id="platformGrowthChart"></canvas>`.
  - Datasets:
    - Line chart: Cumulative Platform Creators over time.
    - Stacked Bar chart: Revenue split by channel (YouTube, TikTok, Patreon, Brand Deals).

### R5. Creator Management & Operations Table
- **Data Columns**:
  1. Creator Name & Email (Avatar badge + name + email)
  2. Linked Platforms (Icons: YouTube, TikTok, Instagram, Patreon)
  3. Monthly Cash Flow (Formatted ZAR currency e.g. `R 45,200.00`)
  4. Plan Tier (`Free` [gray badge] vs `Pro` [emerald gradient badge])
  5. Status (`Active` [green dot] vs `Suspended` [red dot])
  6. Join Date (Formatted `YYYY-MM-DD`)
  7. Actions (`Inspect Ledger` button)
- **Filtering & Search Logic**:
  - Search: Case-insensitive substring match against `name` and `email`.
  - Tabs: `All Creators`, `Pro Tier Only`, `Free Tier Only`.
  - Sorting: Sort by Cash Flow High-to-Low, Join Date Newest-to-Oldest, Name A-Z.
- **Interactive Creator Detail Modal**:
  - Ledger Snapshot: Table of recent income/expense transactions.
  - Plan Toggle Button: Click to switch between `Free` and `Pro`.
  - Account Status Toggle Button: Click to toggle between `Active` and `Suspended`.
  - Admin Note Field: Input area to save internal administrative note.

### R6. Full-Stack Backend Integration & Role-Protected Middleware (`server.js`)
- **Middleware Specification (`requireAdmin`)**:
  ```javascript
  function requireAdmin(req, res, next) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Admin access token required.' });
      jwt.verify(token, JWT_SECRET, (err, user) => {
          if (err || !user || user.role !== 'admin') {
              return res.status(403).json({ error: 'Forbidden: Administrative privileges required.' });
          }
          req.admin = user;
          next();
      });
  }
  ```
- **REST API Endpoints Summary**:
  - `POST /api/admin/auth/login`: Accepts `{ username/email, password }`, verifies bcrypt hash, returns JWT token with `role: 'admin'`.
  - `GET /api/admin/metrics`: Returns `{ totalCreators, gpv, mrr, taxReserves, growthTimeline, platformBreakdown }`.
  - `GET /api/admin/creators`: Returns `{ creators: [...], totalCount: N }` supporting query params `?search=&tier=&sort=`.
  - `POST /api/admin/creators/:id/status`: Accepts `{ status, plan_tier, note }`, mutates user record, writes to `audit_logs`, returns `{ success: true, creator }`.
  - `GET /api/admin/telemetry`: Returns `{ telemetry: [...] }` containing PII-masked query logs, token counts, model info, latency.
  - `GET /api/admin/audit-logs`: Returns `{ auditLogs: [...] }` sorted by `created_at DESC`.

---

## Database Schemas & Data Models

### Supabase PostgreSQL DDL

```sql
-- 1. Users Table (Updated with Admin & Plan Support)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'creator' NOT NULL, -- 'creator' | 'admin'
    plan_tier TEXT DEFAULT 'Free' NOT NULL, -- 'Free' | 'Pro'
    status TEXT DEFAULT 'Active' NOT NULL, -- 'Active' | 'Suspended'
    monthly_cash_flow NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    platforms TEXT[] DEFAULT ARRAY[]::TEXT[],
    phyllo_user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Audit Logs Table (Immutable Audit Ledger)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    target_creator_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. AI Query Telemetry Table
CREATE TABLE IF NOT EXISTS public.ai_query_telemetry (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    question_category TEXT NOT NULL,
    masked_prompt TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0 NOT NULL,
    model_source TEXT DEFAULT 'Gemini 1.5 Flash' NOT NULL,
    latency_ms INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_telemetry_created_at ON public.ai_query_telemetry(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users(role, status);
```

### In-Memory Fallback State Structure (`server.js`)

```javascript
const memoryDb = {
    users: [
        {
            id: 'usr_admin_master',
            email: 'admin@creatorcashflow.com',
            passwordHash: '$2a$10$e8w.x7W...[bcrypt hash]', // password: AdminSecret2026!
            name: 'Master Admin',
            role: 'admin',
            plan_tier: 'Pro',
            status: 'Active',
            monthly_cash_flow: 0.00,
            platforms: [],
            created_at: new Date().toISOString()
        }
    ],
    transactions: [],
    onboarding: [],
    audit_logs: [],
    ai_telemetry: []
};
```

---

## Verification Strategies & Automated Test Suite Plan

| Test ID | Test Category | Target Component | Verification Procedure / Script Command | Expected Outcome |
|---------|---------------|------------------|----------------------------------------|------------------|
| **V1** | Auth Security | `POST /api/admin/auth/login` | Send valid admin credentials via `curl` / `fetch`. | Returns HTTP 200 with JWT token containing `role: 'admin'`. |
| **V2** | Auth Security | `POST /api/admin/auth/login` | Send incorrect password 6 times consecutively. | 1st-5th attempt return HTTP 401; 6th attempt returns HTTP 429 Too Many Requests. |
| **V3** | Role Protection | `GET /api/admin/metrics` | Request without `Authorization` header. | Returns HTTP 401 Unauthorized (`{ error: "Access token required" }`). |
| **V4** | Role Protection | `GET /api/admin/metrics` | Request with standard creator JWT token (non-admin). | Returns HTTP 403 Forbidden (`{ error: "Forbidden: Administrative privileges required" }`). |
| **V5** | Audit Immutability | `POST /api/admin/creators/:id/status` | Send status update payload `{ status: 'Suspended', note: 'Policy check' }`. | Creator status changes to 'Suspended'; new row created in `audit_logs` with admin_id, old_value, new_value, ip_hash. |
| **V6** | Audit Trail Query | `GET /api/admin/audit-logs` | Send authenticated request as admin. | Returns HTTP 200 with array of audit entries ordered chronologically descending. |
| **V7** | PII Masking | Gemini AI Endpoint / Telemetry | Submit prompt `"My email is john@test.com and earnings are R45,000"`. | Telemetry entry stores masked string `"My email is [REDACTED_EMAIL] and earnings are [REDACTED_FINANCIAL_AMOUNT]"`. |
| **V8** | Retention TTL | Telemetry query function | Query telemetry entries with mock records dated 35 days ago. | Expired records excluded from API response (`GET /api/admin/telemetry`). |
| **V9** | KPI Scorecards | `GET /api/admin/metrics` | Call endpoint with seeded database / memory state. | Returns accurate aggregated totals for `totalCreators`, `gpv`, `mrr`, and `taxReserves`. |
| **V10** | Creator Table UI | `admin.html` directory view | Enter search string into creator filter input field. | Table dynamically filters rows matching name/email without page reload. |
| **V11** | Responsive Layout | `admin.html` viewport sweep | Load `admin.html` at 375px, 768px, 1024px, 1440px viewports. | No horizontal overflow; responsive grid adapts cleanly across viewports. |

---

## Conclusion & Handoff Readiness

All functional specifications, API contracts, database schemas, PII masking rules, audit logging protocols, KPI formulations, and verification strategies have been fully mined and documented. The project architecture is ready for full-stack implementation and automated verification.
