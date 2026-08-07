# Original User Request

## Initial Request — 2026-08-06T20:28:22Z

<USER_REQUEST>
Redesign the Creator Cash Flow (CCF) landing page and onboarding experience using an Arc Browser & Framer-inspired aesthetic with glassmorphic backdrop layers, ambient radial mesh backdrops, and fluid motion transitions.

Working directory: c:\Users\User\OneDrive\Desktop\New folder (2)
Integrity mode: development

## Requirements

### R1. Arc & Framer-Inspired Landing Page Redesign
Rebuild the marketing landing page with full-screen hero sections, ambient radial gradient glows, glassmorphic card overlays (`backdrop-blur-md`), and interactive, animated product mockups.

### R2. High-Conversion 6-Step Onboarding Wizard
Implement a smooth 6-step onboarding wizard featuring platform choice cards, Phyllo connection flows with fallback bypass links, goal selection cards, and a launch transition.

### R3. Modern Motion & Micro-Interactions
Integrate CSS/JS micro-animations including hero text fade-and-slide up, 2px card lifts on hover, subtle border glows, and active selection state indicators.

## Acceptance Criteria

### Visual & Conversion Polish
- [ ] Landing page hero renders glassmorphic navbar, glowing ambient backdrop meshes, and responsive floating mockups without layout overlaps across viewports (375px to 1440px+).
- [ ] 6-Step Onboarding Wizard transitions seamlessly with platform selection, Phyllo connect handlers, manual skip fallback, and zero JavaScript console errors.
- [ ] Responsive viewports (iPhone SE, iPhone 14, iPhone 14 Pro Max) execute clean visual sweeps.
</USER_REQUEST>

## Follow-up — 2026-08-07T17:02:25Z

<USER_REQUEST>
Build a secure, standalone Admin Command Portal (admin.html) and backend API integration for Creator Cash Flow featuring cryptographically enforced administrator authentication, immutable audit logging, PII-preserving AI query telemetry, and platform-wide creator ledger management.

Working directory: c:\Users\User\OneDrive\Desktop\New folder (2)
Integrity mode: development

## Requirements

### R1. Cryptographically Enforced Admin Authentication & Session Security
Implement real administrative authentication backed by server.js:
- Admin credentials stored securely (salted bcrypt password hashing, signed JWT with explicit role: 'admin', and secure Bearer authorization headers).
- Rate-limited admin login route (POST /api/admin/auth/login) with brute-force protection.
- Dedicated admin.html login gate with active session validation; unauthenticated requests are strictly rejected at the API layer with 401/403 responses.

### R2. Immutable Admin Action Audit Logging
Track all administrative mutations in an immutable audit ledger (audit_logs table / memory buffer):
- Every state change via POST /api/admin/creators/:id/status (e.g., plan tier change, account suspension/reactivation, note additions) records: admin_id, target_creator_id, action_type, old_value, new_value, timestamp, and ip_hash.
- Dedicated "Audit Trail" tab/view in admin.html displaying chronological administrative activity with filterable events.

### R3. PII-Safe AI Query Telemetry & Privacy Retention
Privacy-preserving telemetry for Gemini AI queries:
- Automatically masks sensitive PII and raw financial amounts in query logs (storing question category tags e.g., "Tax Deduction Strategy", "Gear Purchase Planning", token usage, response model, and latency in ms).
- Exposes a 30-day automated retention TTL policy to prevent long-term storage of raw user queries.

### R4. Platform KPI Scorecards & Financial Telemetry
Real-time aggregate KPI scorecards in admin.html:
- Total Registered Creators (synced with database / seed registry)
- Gross Platform Volume (GPV - aggregate monthly earnings in ZAR)
- Monthly Recurring Revenue (MRR - Pro creator subscriptions)
- Collective Platform Tax Reserves (estimated 15% sole-proprietor holdings)
- Chart.js platform growth timeline with revenue distribution across YouTube, TikTok, Patreon, and Brand Deals.

### R5. Creator Management & Operations Table
Comprehensive, searchable, and filterable creator directory:
- Data columns: Creator Name, Email, Linked Platforms, Monthly Cash Flow, Plan Tier (Free/Pro), Status (Active/Suspended), Join Date.
- Real-time search by name/email, plan tier filtering tabs (All / Pro / Free), and sorting by revenue volume.
- Interactive detail modal with ledger snapshot, subscription plan toggle, and account suspension controls.

### R6. Full-Stack Backend Integration & Role-Protected Middleware (server.js)
Implement requireAdmin middleware protecting all /api/admin/* endpoints:
- POST /api/admin/auth/login: Authenticates administrator with bcrypt and returns signed admin JWT.
- GET /api/admin/metrics: Returns aggregated KPIs, platform volume, and plan breakdown.
- GET /api/admin/creators: Returns creator directory with Supabase query support and seed fallback.
- POST /api/admin/creators/:id/status: Updates creator account status with mandatory audit log insertion.
- GET /api/admin/telemetry: Returns PII-masked AI query logs with latency & token metrics.
- GET /api/admin/audit-logs: Returns chronological audit trail entries.

## Acceptance Criteria

### Standalone Admin Portal & Fintech Security
- [ ] admin.html loads with dark luxury aesthetic (#050505, #0B0B0B, 24px radius) and dedicated admin login gate.
- [ ] Authentication is strictly enforced: API routes reject unauthenticated requests (HTTP 401/403) without a valid admin JWT.
- [ ] Live platform KPIs (Total Creators, GPV, MRR, Platform Tax Reserves) render accurately with interactive Chart.js timelines.
- [ ] Creator table supports real-time search, plan filtering (All/Pro/Free), and ledger inspection modal.
- [ ] All account status and subscription mutations create immutable entries in the audit trail log with timestamps.
- [ ] AI query telemetry displays token consumption, model source, and latency with PII masking applied.
- [ ] Automated verification script validates admin.html authentication flow, audit logging, and search responsiveness.
</USER_REQUEST>
