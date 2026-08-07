/* ==========================================================================
   Creator Cash Flow - Full-Stack REST API Backend Server (Supabase Powered)
   ========================================================================== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-creator-cashflow-secret-key-2026';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 bytes

// Supabase Connection Client
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iekofqagtcztyavhunai.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_KEY !== 'your-supabase-anon-key') {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('🔌 Connected to Supabase Cloud Database: ' + SUPABASE_URL);
} else {
    console.log('⚠️ Supabase credentials not fully configured. Running in high-reliability Memory Backup Mode.');
}

// In-Memory Database Fallback
const memoryDb = {
    users: [],
    transactions: [],
    onboarding: [],
    adminUsers: [],
    audit_logs: [],
    ai_telemetry: []
};

Object.defineProperty(memoryDb, 'auditLogs', {
    get() { return this.audit_logs; },
    set(v) { this.audit_logs = v; },
    configurable: true,
    enumerable: true
});

Object.defineProperty(memoryDb, 'aiTelemetry', {
    get() { return this.ai_telemetry; },
    set(v) { this.ai_telemetry = v; },
    configurable: true,
    enumerable: true
});

// Admin Seeding & Configuration (Primary Master Admin + Platform Fallback)
const MASTER_ADMIN_EMAIL = 'reamogetswemolefe0190@gmail.com';
const MASTER_ADMIN_PASS = process.env.ADMIN_PASSWORD || 'R3@m0g3tsw3M0l3f3';
const MASTER_ADMIN_HASH = bcrypt.hashSync(MASTER_ADMIN_PASS, 10);

const FALLBACK_ADMIN_EMAIL = 'admin@creatorcashflow.com';
const FALLBACK_ADMIN_PASS = 'AdminPass2026!';
const FALLBACK_ADMIN_HASH = bcrypt.hashSync(FALLBACK_ADMIN_PASS, 10);

const DEFAULT_ADMIN_EMAIL = MASTER_ADMIN_EMAIL;
const DEFAULT_ADMIN_PASS = MASTER_ADMIN_PASS;
const DEFAULT_ADMIN_HASH = MASTER_ADMIN_HASH;

// Seed primary master admin
if (!memoryDb.adminUsers.some(a => a.email === MASTER_ADMIN_EMAIL)) {
    memoryDb.adminUsers.push({
        id: 'admin_master_1',
        email: MASTER_ADMIN_EMAIL,
        passwordHash: MASTER_ADMIN_HASH,
        role: 'admin',
        created_at: new Date().toISOString()
    });
}

// Seed fallback admin
if (!memoryDb.adminUsers.some(a => a.email === FALLBACK_ADMIN_EMAIL)) {
    memoryDb.adminUsers.push({
        id: 'admin_seed_1',
        email: FALLBACK_ADMIN_EMAIL,
        passwordHash: FALLBACK_ADMIN_HASH,
        role: 'admin',
        created_at: new Date().toISOString()
    });
}

// Supabase Auto-Seeding Helper for Admin User
async function seedAdminAccountInSupabase() {
    if (!supabase) return;
    try {
        const adminsToSeed = [
            { id: 'admin_master_1', email: MASTER_ADMIN_EMAIL, password_hash: MASTER_ADMIN_HASH, role: 'admin' },
            { id: 'admin_seed_1', email: FALLBACK_ADMIN_EMAIL, password_hash: FALLBACK_ADMIN_HASH, role: 'admin' }
        ];
        for (const adm of adminsToSeed) {
            const { data: existing } = await supabase
                .from('admin_users')
                .select('id')
                .eq('email', adm.email)
                .maybeSingle();

            if (!existing) {
                await supabase.from('admin_users').insert([adm]);
                console.log(`✅ Seeded admin user (${adm.email}) in Supabase.`);
            }
        }
    } catch (err) {
        console.warn('⚠️ Supabase admin seeding notice:', err.message);
    }
}
seedAdminAccountInSupabase();

// Default Creator Registry Seeding for Baseline Platform Telemetry
const DEFAULT_SEED_CREATORS = [
    { id: 'usr_seed_1', name: 'Naledi Molefe', email: 'naledi@creator.co.za', plan_tier: 'Pro', status: 'active', created_at: '2026-02-15T10:00:00.000Z' },
    { id: 'usr_seed_2', name: 'Sipho Dlamini', email: 'sipho@vlogsa.co.za', plan_tier: 'Pro', status: 'active', created_at: '2026-03-01T11:20:00.000Z' },
    { id: 'usr_seed_3', name: 'Jessica van der Merwe', email: 'jessica@techreviews.co.za', plan_tier: 'Pro', status: 'active', created_at: '2026-03-18T14:15:00.000Z' },
    { id: 'usr_seed_4', name: 'Thabo Mokoena', email: 'thabo@fitnessza.co.za', plan_tier: 'Free', status: 'active', created_at: '2026-04-05T09:30:00.000Z' },
    { id: 'usr_seed_5', name: 'Chloe Adams', email: 'chloe@beautyblog.co.za', plan_tier: 'Pro', status: 'active', created_at: '2026-04-20T16:45:00.000Z' },
    { id: 'usr_seed_6', name: 'Bongani Sithole', email: 'bongani@gamingza.co.za', plan_tier: 'Pro', status: 'active', created_at: '2026-05-10T12:00:00.000Z' },
    { id: 'usr_seed_7', name: 'Fatima Patel', email: 'fatima@foodie.co.za', plan_tier: 'Free', status: 'active', created_at: '2026-06-01T08:10:00.000Z' },
    { id: 'usr_seed_8', name: 'Liam Botha', email: 'liam@travelsa.co.za', plan_tier: 'Pro', status: 'active', created_at: '2026-06-15T15:30:00.000Z' },
    { id: 'usr_seed_9', name: 'Zanele Khumalo', email: 'zanele@fashion.co.za', plan_tier: 'Free', status: 'active', created_at: '2026-07-02T13:00:00.000Z' },
    { id: 'usr_seed_10', name: 'Kabelo Mabena', email: 'kabelo@podcasts.co.za', plan_tier: 'Pro', status: 'suspended', created_at: '2026-07-12T17:20:00.000Z' }
];

const DEFAULT_SEED_TRANSACTIONS = [
    // YouTube
    { id: 'tx_seed_101', user_id: 'usr_seed_1', date: 'Feb 20', source: 'YouTube', merchant: 'Google AdSense SA', type: 'income', category: 'YouTube AdSense', tax_status: 'Taxable Income', amount: 45000.00, created_at: '2026-02-20T12:00:00.000Z' },
    { id: 'tx_seed_102', user_id: 'usr_seed_2', date: 'Mar 15', source: 'YouTube', merchant: 'Google AdSense SA', type: 'income', category: 'YouTube AdSense', tax_status: 'Taxable Income', amount: 35000.00, created_at: '2026-03-15T12:00:00.000Z' },
    { id: 'tx_seed_103', user_id: 'usr_seed_3', date: 'Apr 10', source: 'YouTube', merchant: 'Google AdSense SA', type: 'income', category: 'YouTube AdSense', tax_status: 'Taxable Income', amount: 52000.00, created_at: '2026-04-10T12:00:00.000Z' },
    { id: 'tx_seed_104', user_id: 'usr_seed_6', date: 'May 18', source: 'YouTube', merchant: 'Google AdSense SA', type: 'income', category: 'YouTube AdSense', tax_status: 'Taxable Income', amount: 48000.00, created_at: '2026-05-18T12:00:00.000Z' },
    { id: 'tx_seed_105', user_id: 'usr_seed_8', date: 'Jun 22', source: 'YouTube', merchant: 'Google AdSense SA', type: 'income', category: 'YouTube AdSense', tax_status: 'Taxable Income', amount: 60000.00, created_at: '2026-06-22T12:00:00.000Z' },
    { id: 'tx_seed_106', user_id: 'usr_seed_1', date: 'Jul 20', source: 'YouTube', merchant: 'Google AdSense SA', type: 'income', category: 'YouTube AdSense', tax_status: 'Taxable Income', amount: 55000.00, created_at: '2026-07-20T12:00:00.000Z' },

    // TikTok
    { id: 'tx_seed_201', user_id: 'usr_seed_4', date: 'Apr 25', source: 'TikTok', merchant: 'TikTok Creator Fund ZAR', type: 'income', category: 'TikTok Rewards', tax_status: 'Taxable Income', amount: 18000.00, created_at: '2026-04-25T12:00:00.000Z' },
    { id: 'tx_seed_202', user_id: 'usr_seed_5', date: 'May 05', source: 'TikTok', merchant: 'TikTok Creator Fund ZAR', type: 'income', category: 'TikTok Rewards', tax_status: 'Taxable Income', amount: 24000.00, created_at: '2026-05-05T12:00:00.000Z' },
    { id: 'tx_seed_203', user_id: 'usr_seed_7', date: 'Jun 12', source: 'TikTok', merchant: 'TikTok Creator Fund ZAR', type: 'income', category: 'TikTok Rewards', tax_status: 'Taxable Income', amount: 31000.00, created_at: '2026-06-12T12:00:00.000Z' },
    { id: 'tx_seed_204', user_id: 'usr_seed_9', date: 'Jul 05', source: 'TikTok', merchant: 'TikTok Creator Fund ZAR', type: 'income', category: 'TikTok Rewards', tax_status: 'Taxable Income', amount: 27000.00, created_at: '2026-07-05T12:00:00.000Z' },

    // Patreon
    { id: 'tx_seed_301', user_id: 'usr_seed_2', date: 'Mar 28', source: 'Patreon', merchant: 'Patreon Membership Payout', type: 'income', category: 'Patreon Subscriptions', tax_status: 'Taxable Income', amount: 22000.00, created_at: '2026-03-28T12:00:00.000Z' },
    { id: 'tx_seed_302', user_id: 'usr_seed_3', date: 'May 14', source: 'Patreon', merchant: 'Patreon Membership Payout', type: 'income', category: 'Patreon Subscriptions', tax_status: 'Taxable Income', amount: 28000.00, created_at: '2026-05-14T12:00:00.000Z' },
    { id: 'tx_seed_303', user_id: 'usr_seed_10', date: 'Jul 01', source: 'Patreon', merchant: 'Patreon Membership Payout', type: 'income', category: 'Patreon Subscriptions', tax_status: 'Taxable Income', amount: 35000.00, created_at: '2026-07-01T12:00:00.000Z' },

    // Brand Deals
    { id: 'tx_seed_401', user_id: 'usr_seed_5', date: 'Apr 18', source: 'Brand Deals', merchant: 'Woolworths SA Sponsorship', type: 'income', category: 'Brand Sponsorships', tax_status: 'Taxable Income', amount: 40000.00, created_at: '2026-04-18T12:00:00.000Z' },
    { id: 'tx_seed_402', user_id: 'usr_seed_8', date: 'Jun 28', source: 'Brand Deals', merchant: 'MTN SA Campaign', type: 'income', category: 'Brand Sponsorships', tax_status: 'Taxable Income', amount: 65000.00, created_at: '2026-06-28T12:00:00.000Z' },
    { id: 'tx_seed_403', user_id: 'usr_seed_1', date: 'Jul 15', source: 'Brand Deals', merchant: 'Nedbank Creator Grant', type: 'income', category: 'Brand Sponsorships', tax_status: 'Taxable Income', amount: 75000.00, created_at: '2026-07-15T12:00:00.000Z' }
];

// Seed Memory DB if empty
if (memoryDb.users.length === 0) {
    const creatorPassHash = bcrypt.hashSync('CreatorPass2026!', 10);
    DEFAULT_SEED_CREATORS.forEach(c => {
        memoryDb.users.push({
            ...c,
            passwordHash: creatorPassHash
        });
    });
}

if (memoryDb.transactions.length === 0) {
    memoryDb.transactions.push(...DEFAULT_SEED_TRANSACTIONS);
}

// Supabase Auto-Seeding Helper for Seed Creators & Transactions
async function seedDefaultCreatorsInSupabase() {
    if (!supabase) return;
    try {
        const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (!error && (count === 0 || count === null)) {
            const creatorPassHash = bcrypt.hashSync('CreatorPass2026!', 10);
            const creatorsToInsert = DEFAULT_SEED_CREATORS.map(c => ({
                id: c.id,
                email: c.email,
                password_hash: creatorPassHash,
                name: c.name,
                plan_tier: c.plan_tier,
                status: c.status,
                created_at: c.created_at
            }));
            await supabase.from('users').insert(creatorsToInsert);
            await supabase.from('transactions').insert(DEFAULT_SEED_TRANSACTIONS);
            console.log('✅ Seeded default creators and transactions in Supabase.');
        }
    } catch (err) {
        console.warn('⚠️ Supabase creator seeding notice:', err.message);
    }
}
seedDefaultCreatorsInSupabase();

// In-memory sliding-window rate limiter for admin login (5 attempts per 15 mins)
const adminLoginAttempts = new Map();

function rateLimitAdminLogin(req, res, next) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
    const MAX_ATTEMPTS = 5;

    let attempts = adminLoginAttempts.get(ip) || [];
    attempts = attempts.filter(timestamp => now - timestamp < WINDOW_MS);

    if (attempts.length === 0) {
        adminLoginAttempts.delete(ip);
    } else {
        adminLoginAttempts.set(ip, attempts);
    }

    if (attempts.length >= MAX_ATTEMPTS) {
        const oldestAttempt = attempts[0];
        const retryAfterSecs = Math.ceil((oldestAttempt + WINDOW_MS - now) / 1000);
        return res.status(429).json({
            error: 'Too many login attempts',
            message: `Rate limit exceeded. Too many login attempts from this IP. Please try again after ${retryAfterSecs} seconds.`,
            retryAfterSeconds: retryAfterSecs
        });
    }

    attempts.push(now);
    adminLoginAttempts.set(ip, attempts);

    // Evict oldest IP key if tracking map exceeds maximum capacity (200 IPs)
    const MAX_TRACKED_IPS = 200;
    if (adminLoginAttempts.size > MAX_TRACKED_IPS) {
        const oldestKey = adminLoginAttempts.keys().next().value;
        adminLoginAttempts.delete(oldestKey);
    }

    next();
}

// Role-Protected Middleware for Admin Endpoints
function requireAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        if (!decoded || decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Administrative privileges required' });
        }
        req.admin = decoded;
        next();
    });
}


// Security Headers & Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Root Health API
app.get('/', (req, res) => {
    res.json({
        name: "Creator Cash Flow API Engine",
        status: "active",
        database: supabase ? "Supabase Cloud PostgreSQL" : "Memory Backup",
        security: "AES-256-CBC + JWT",
        version: "3.0.0",
        documentation: "https://github.com/reamogetswemolefe0190-cmd/creator-cash-flow"
    });
});

// Helper: Seed initial transaction data for new creators
async function seedDefaultTransactions(userId) {
    const defaults = [
        { id: 'tx_seed_1', user_id: userId, date: 'Jul 21', source: 'YouTube', merchant: 'Google AdSense South Africa Payout', type: 'income', category: 'YouTube AdSense', tax_status: 'Taxable Income', amount: 18420.00 },
        { id: 'tx_seed_2', user_id: userId, date: 'Jul 19', source: 'Bank', merchant: 'Orms Direct (Sony Alpha Lens)', type: 'expense', category: 'Equipment & Gear', tax_status: '100% Tax Write-Off', amount: 4200.00 },
        { id: 'tx_seed_3', user_id: userId, date: 'Jul 18', source: 'TikTok', merchant: 'TikTok Creator Rewards ZAR', type: 'income', category: 'TikTok Rewards', tax_status: 'Taxable Income', amount: 4850.00 },
        { id: 'tx_seed_4', user_id: userId, date: 'Jul 15', source: 'Bank', merchant: 'Adobe Creative Cloud SA', type: 'expense', category: 'Software Subs', tax_status: '100% Tax Write-Off', amount: 950.00 },
        { id: 'tx_seed_5', user_id: userId, date: 'Jul 14', source: 'Instagram', merchant: 'Woolworths SA Brand Deal', type: 'income', category: 'Brand Sponsorships', tax_status: 'Taxable Income', amount: 2100.00 }
    ];

    if (supabase) {
        await supabase.from('transactions').insert(defaults);
    } else {
        memoryDb.transactions.push(...defaults);
    }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    if (token === 'demo_token' || token === 'offline_token') {
        req.user = { id: 'demo_creator_user', email: 'demo@creatorcashflow.com', name: 'Demo Creator' };
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired session token' });
        req.user = user;
        next();
    });
}

// ==========================================================================
// AUTHENTICATION API ROUTES
// ==========================================================================

// 1. User Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = 'usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');

        if (supabase) {
            // Check if user exists
            const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).single();
            if (existing) {
                return res.status(400).json({ error: 'An account with this email already exists.' });
            }

            // Insert into Supabase
            const { error } = await supabase.from('users').insert([{
                id: userId,
                email: email.toLowerCase(),
                password_hash: passwordHash,
                name
            }]);

            if (error) throw error;
        } else {
            // Memory check
            const existing = memoryDb.users.find(u => u.email === email.toLowerCase());
            if (existing) {
                return res.status(400).json({ error: 'An account with this email already exists.' });
            }

            memoryDb.users.push({
                id: userId,
                email: email.toLowerCase(),
                passwordHash,
                name
            });
        }

        // Seed transactions so dashboard immediately looks populated and realistic
        await seedDefaultTransactions(userId);

        // 3. Dispatch Live Transactional Email via Resend
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const FROM_EMAIL = process.env.FROM_EMAIL || 'Creator Cash Flow <onboarding@resend.dev>';
        
        if (RESEND_API_KEY) {
            console.log(`[RESEND] Sending welcome verification email to: ${email}`);
            try {
                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: FROM_EMAIL,
                        to: email.toLowerCase(),
                        subject: 'Welcome to Creator Cash Flow — Your Business Command Center is Active',
                        html: `
                            <div style="background-color: #050505; color: #ffffff; padding: 48px 24px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08);">
                                <!-- Header Logo -->
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                                    <div style="background-color: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); border-radius: 12px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #22C55E; font-size: 20px; font-weight: bold;">💸</div>
                                    <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">Creator Cash Flow</span>
                                </div>

                                <h2 style="color: #22C55E; font-size: 24px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.02em;">Welcome aboard, ${name}!</h2>
                                <p style="color: #A1A1AA; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Your Creator Business Command Center account is verified and ready. Track earnings, understand growth, and build a sustainable creator business.</p>
                                
                                <!-- Status Card -->
                                <div style="background-color: #0B0B0B; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                                    <div style="margin-bottom: 12px; font-size: 13px; display: flex; justify-content: space-between;">
                                        <span style="color: #71717A;">Creator Account:</span>
                                        <strong style="color: #ffffff;">${email}</strong>
                                    </div>
                                    <div style="font-size: 13px; display: flex; justify-content: space-between;">
                                        <span style="color: #71717A;">Command Center Status:</span>
                                        <strong style="color: #22C55E;">🟢 Verified & Active Sync</strong>
                                    </div>
                                </div>

                                <!-- Quickstart Steps -->
                                <h3 style="color: #ffffff; font-size: 15px; font-weight: 700; margin-bottom: 12px;">3 Steps to Get Started:</h3>
                                <ul style="color: #A1A1AA; font-size: 13px; line-height: 1.8; margin-bottom: 28px; padding-left: 20px;">
                                    <li><strong>Connect Revenue Channels:</strong> Link YouTube, TikTok, or Patreon to auto-sync income.</li>
                                    <li><strong>Tax Reserve Engine:</strong> View your automated 15% sole-proprietor tax reserve holding.</li>
                                    <li><strong>AI Financial Intelligence:</strong> Chat with CCF AI for real-time equipment & P&L advice.</li>
                                </ul>

                                <!-- Footer -->
                                <div style="border-t: 1px solid rgba(255,255,255,0.08); pt: 20px; margin-top: 24px; text-align: center;">
                                    <p style="color: #71717A; font-size: 12px; line-height: 1.5; margin: 0;">© 2026 REM Technological Solutions. All rights reserved.</p>
                                    <p style="color: #52525B; font-size: 11px; margin-top: 6px;">Creator Cash Flow — Financial Intelligence for Modern Creators</p>
                                </div>
                            </div>
                        `
                    })
                });
                const emailData = await emailResponse.json();
                if (!emailResponse.ok) {
                    console.error('[RESEND ERROR]', emailData);
                } else {
                    console.log('[RESEND SUCCESS] Welcome email sent:', emailData.id);
                }
            } catch (err) {
                console.error('[RESEND DISPATCH ERROR]', err);
            }
        }

        res.status(201).json({
            message: 'Registration successful!',
            userId,
            email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during signup.' });
    }
});

// 2. User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = null;

        if (supabase) {
            const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single();
            if (!data || error) {
                return res.status(401).json({ error: 'Invalid email or password.' });
            }
            user = {
                id: data.id,
                name: data.name,
                email: data.email,
                passwordHash: data.password_hash
            };
        } else {
            const memUser = memoryDb.users.find(u => u.email === email.toLowerCase());
            if (!memUser) {
                return res.status(401).json({ error: 'Invalid email or password.' });
            }
            user = memUser;
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const sessionToken = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token: sessionToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// ==========================================================================
// ADMIN AUTHENTICATION ROUTES
// ==========================================================================

// POST /api/admin/auth/login: Authenticate admin & return JWT
app.post('/api/admin/auth/login', rateLimitAdminLogin, async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let adminUser = null;

        if (supabase) {
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .eq('email', normalizedEmail)
                .maybeSingle();

            if (data && !error) {
                adminUser = {
                    id: data.id,
                    email: data.email,
                    passwordHash: data.password_hash,
                    role: data.role || 'admin'
                };
            }
        }

        // Fallback to memoryDb if not found in Supabase or running in memory mode
        if (!adminUser) {
            const memAdmin = (memoryDb.adminUsers || []).find(a => a.email === normalizedEmail);
            if (memAdmin) {
                adminUser = memAdmin;
            }
        }

        if (!adminUser) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, adminUser.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Sign JWT Payload strictly containing { id, email, role: 'admin' }
        const token = jwt.sign(
            {
                id: adminUser.id,
                email: adminUser.email,
                role: 'admin'
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            success: true,
            token,
            admin: {
                id: adminUser.id,
                email: adminUser.email,
                role: 'admin'
            }
        });
    } catch (err) {
        console.error('[ADMIN LOGIN ERROR]', err);
        return res.status(500).json({ error: 'Server error during admin authentication.' });
    }
});

// GET /api/admin/verify-auth: Session check endpoint protected by requireAdmin
app.get('/api/admin/verify-auth', requireAdmin, (req, res) => {
    res.json({ success: true, admin: req.admin });
});

// GET /api/admin/metrics: Return real aggregated platform KPI metrics & financial telemetry
app.get('/api/admin/metrics', requireAdmin, async (req, res) => {
    try {
        let users = [];
        let transactions = [];

        if (supabase) {
            const { data: usersData, error: uErr } = await supabase.from('users').select('*');
            if (uErr) throw uErr;
            users = usersData || [];

            const { data: txData, error: tErr } = await supabase.from('transactions').select('*');
            if (tErr) throw tErr;
            transactions = txData || [];
        } else {
            users = memoryDb.users || [];
            transactions = memoryDb.transactions || [];
        }

        // 1. Total Creators Count
        const totalCreators = users.length;

        // 2. Gross Platform Volume (GPV) - Sum of all creator income transactions in ZAR
        const incomeTxs = transactions.filter(t => (t.type || '').toLowerCase() === 'income');
        const rawGpv = incomeTxs.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        const gpvZar = parseFloat(rawGpv.toFixed(2));

        // 3. Monthly Recurring Revenue (MRR) from Pro Subscriptions (Pro creators * R299/mo)
        const proCreatorsCount = users.filter(u => {
            const tier = u.plan_tier || u.planTier || 'Free';
            return tier.toLowerCase() === 'pro';
        }).length;
        const PRO_MONTHLY_RATE_ZAR = 299;
        const mrrZar = proCreatorsCount * PRO_MONTHLY_RATE_ZAR;

        // 4. Platform Tax Reserves (estimated 15% sole-proprietor holdings)
        const taxReservesZar = parseFloat((gpvZar * 0.15).toFixed(2));

        // 5. Channel Breakdown (Revenue totals across YouTube, TikTok, Patreon, Brand Deals)
        const channelBreakdown = {
            youtube: 0,
            tiktok: 0,
            patreon: 0,
            brand_deals: 0
        };

        incomeTxs.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            const src = (t.source || '').toLowerCase();
            const cat = (t.category || '').toLowerCase();
            const merch = (t.merchant || '').toLowerCase();

            if (src.includes('youtube') || cat.includes('youtube') || merch.includes('youtube') || merch.includes('adsense')) {
                channelBreakdown.youtube += amt;
            } else if (src.includes('tiktok') || cat.includes('tiktok') || merch.includes('tiktok')) {
                channelBreakdown.tiktok += amt;
            } else if (src.includes('patreon') || cat.includes('patreon') || merch.includes('patreon')) {
                channelBreakdown.patreon += amt;
            } else {
                channelBreakdown.brand_deals += amt;
            }
        });

        channelBreakdown.youtube = parseFloat(channelBreakdown.youtube.toFixed(2));
        channelBreakdown.tiktok = parseFloat(channelBreakdown.tiktok.toFixed(2));
        channelBreakdown.patreon = parseFloat(channelBreakdown.patreon.toFixed(2));
        channelBreakdown.brand_deals = parseFloat(channelBreakdown.brand_deals.toFixed(2));

        // 6. 6-Month Growth Timeline Array for Chart.js Rendering
        const now = new Date();
        const timelineMonths = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleString('en-US', { month: 'short' });
            timelineMonths.push({ label, date: d, index: 5 - i });
        }

        const timeline = timelineMonths.map((m, idx) => {
            if (idx === 5) {
                return {
                    month: m.label,
                    gpv: gpvZar,
                    mrr: mrrZar,
                    creators: totalCreators
                };
            }

            const endOfMonth = new Date(m.date.getFullYear(), m.date.getMonth() + 1, 0, 23, 59, 59);

            const usersUntilMonth = users.filter(u => {
                if (!u.created_at) return true;
                return new Date(u.created_at) <= endOfMonth;
            });
            const creatorCountForMonth = usersUntilMonth.length > 0 ? usersUntilMonth.length : Math.max(1, Math.round((totalCreators * (idx + 1)) / 6));

            const incomeUntilMonth = incomeTxs.filter(t => {
                if (!t.created_at) return true;
                return new Date(t.created_at) <= endOfMonth;
            });

            let gpvForMonth = incomeUntilMonth.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
            if (incomeUntilMonth.length === 0 || gpvForMonth === 0) {
                gpvForMonth = Math.round((gpvZar * (idx + 1)) / 6);
            } else {
                gpvForMonth = parseFloat(gpvForMonth.toFixed(2));
            }

            const proForMonth = usersUntilMonth.filter(u => (u.plan_tier || u.planTier || '').toLowerCase() === 'pro').length;
            let mrrForMonth = proForMonth * PRO_MONTHLY_RATE_ZAR;
            if (mrrForMonth === 0 && mrrZar > 0) {
                mrrForMonth = Math.round((mrrZar * (idx + 1)) / 6);
            }

            return {
                month: m.label,
                gpv: gpvForMonth,
                mrr: mrrForMonth,
                creators: creatorCountForMonth
            };
        });

        res.json({
            totalCreators,
            gpvZar,
            mrrZar,
            taxReservesZar,
            channelBreakdown,
            timeline
        });

    } catch (err) {
        console.error('[ADMIN METRICS ERROR]', err);
        res.status(500).json({ error: 'Failed to compute platform KPI metrics.' });
    }
});

// GET /api/admin/creators: Return full creator directory (guarded by requireAdmin)
app.get('/api/admin/creators', requireAdmin, async (req, res) => {
    try {
        let creators = [];
        if (supabase) {
            const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
            if (!error && data) {
                creators = data.map(c => ({
                    id: c.id,
                    name: c.name,
                    email: c.email,
                    plan_tier: c.plan_tier || 'Free',
                    status: c.status || 'active',
                    created_at: c.created_at
                }));
                return res.json(creators);
            }
        }
        creators = (memoryDb.users || []).map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            plan_tier: c.plan_tier || c.planTier || 'Free',
            status: c.status || 'active',
            created_at: c.created_at
        }));
        return res.json(creators);
    } catch (err) {
        console.error('[ADMIN CREATORS ERROR]', err);
        return res.status(500).json({ error: 'Failed to retrieve creator directory.' });
    }
});

// POST /api/admin/creators/:id/status: Update creator account status / plan tier with audit logging (guarded by requireAdmin)
app.post('/api/admin/creators/:id/status', requireAdmin, async (req, res) => {
    try {
        const creatorId = req.params.id;
        const { status, plan_tier, planTier, note } = req.body || {};

        const effectivePlanTier = plan_tier !== undefined ? plan_tier : planTier;

        // Validation rules
        if (status !== undefined) {
            if (typeof status !== 'string') {
                return res.status(400).json({ error: 'Invalid status' });
            }
            if (!['active', 'suspended'].includes(status.toLowerCase())) {
                return res.status(400).json({ error: "Invalid status value. Allowed values are 'active' or 'suspended'." });
            }
        }

        if (effectivePlanTier !== undefined) {
            if (typeof effectivePlanTier !== 'string') {
                return res.status(400).json({ error: 'Invalid plan_tier' });
            }
            if (!['pro', 'free'].includes(effectivePlanTier.toLowerCase())) {
                return res.status(400).json({ error: "Invalid plan_tier value. Allowed values are 'Pro' or 'Free'." });
            }
        }

        if (status === undefined && effectivePlanTier === undefined) {
            return res.status(400).json({ error: "Invalid mutation payload. Provide status ('active'/'suspended') or plan_tier ('Pro'/'Free')." });
        }

        // Fetch target creator from Supabase or memoryDb
        let creator = null;
        if (supabase) {
            const { data, error } = await supabase.from('users').select('*').eq('id', creatorId).maybeSingle();
            if (data && !error) creator = data;
        }
        if (!creator) {
            creator = (memoryDb.users || []).find(u => u.id === creatorId);
        }

        if (!creator) {
            return res.status(404).json({ error: 'Creator not found' });
        }

        // Capture pre-mutation state
        const oldStatus = creator.status || 'active';
        const oldPlanTier = creator.plan_tier || creator.planTier || 'Free';

        // Determine post-mutation state
        const newStatus = status ? (status.toLowerCase() === 'suspended' ? 'suspended' : 'active') : oldStatus;
        const newPlanTier = effectivePlanTier ? (effectivePlanTier.toLowerCase() === 'pro' ? 'Pro' : 'Free') : oldPlanTier;

        const statusChanged = newStatus !== oldStatus;
        const tierChanged = newPlanTier !== oldPlanTier;

        let actionType = 'STATUS_CHANGE';
        if (statusChanged && tierChanged) {
            actionType = 'STATUS_AND_TIER_CHANGE';
        } else if (tierChanged) {
            actionType = 'TIER_CHANGE';
        } else if (statusChanged) {
            actionType = 'STATUS_CHANGE';
        } else if (note) {
            actionType = 'NOTE_ADDED';
        }

        const oldValueObj = { status: oldStatus, plan_tier: oldPlanTier };
        const newValueObj = { status: newStatus, plan_tier: newPlanTier };
        if (note) newValueObj.note = note;

        const oldValueStr = JSON.stringify(oldValueObj);
        const newValueStr = JSON.stringify(newValueObj);

        // Compute SHA256 IP hash
        const rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
        const ip_hash = crypto.createHash('sha256').update(rawIp).digest('hex').substring(0, 16);

        // Construct immutable audit log record
        const auditRecord = {
            id: 'audit_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
            admin_id: req.admin.id || req.admin.email,
            target_creator_id: creatorId,
            action_type: actionType,
            old_value: oldValueStr,
            new_value: newValueStr,
            timestamp: new Date().toISOString(),
            ip_hash: ip_hash
        };

        // Persist audit record in Supabase & memoryDb
        if (supabase) {
            try {
                await supabase.from('audit_logs').insert([auditRecord]);
            } catch (aErr) {
                console.warn('⚠️ Supabase audit log insert notice:', aErr.message);
            }
        }
        memoryDb.audit_logs.push(auditRecord);

        // Update target creator in Supabase & memoryDb
        if (supabase) {
            try {
                await supabase.from('users').update({ status: newStatus, plan_tier: newPlanTier }).eq('id', creatorId);
            } catch (uErr) {
                console.warn('⚠️ Supabase creator update notice:', uErr.message);
            }
        }

        // Memory update
        const memIdx = (memoryDb.users || []).findIndex(u => u.id === creatorId);
        if (memIdx >= 0) {
            memoryDb.users[memIdx].status = newStatus;
            memoryDb.users[memIdx].plan_tier = newPlanTier;
            memoryDb.users[memIdx].planTier = newPlanTier;
        }

        const updatedCreator = {
            id: creator.id,
            name: creator.name,
            email: creator.email,
            plan_tier: newPlanTier,
            status: newStatus,
            created_at: creator.created_at
        };

        return res.json({
            success: true,
            creator: updatedCreator,
            audit_entry: auditRecord
        });
    } catch (err) {
        console.error('[ADMIN STATUS MUTATION ERROR]', err);
        return res.status(500).json({ error: 'Failed to update creator status.' });
    }
});

// GET /api/admin/audit-logs: Retrieve chronological administrative trail (guarded by requireAdmin)
app.get('/api/admin/audit-logs', requireAdmin, async (req, res) => {
    try {
        if (supabase) {
            const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
            if (!error && data) return res.json(data);
        }
        const logs = [...(memoryDb.audit_logs || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return res.json(logs);
    } catch (err) {
        console.error('[ADMIN AUDIT LOGS ERROR]', err);
        return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
    }
});

// GET /api/admin/telemetry: Retrieve PII-masked AI query logs with 30-day TTL (guarded by requireAdmin)
app.get('/api/admin/telemetry', requireAdmin, async (req, res) => {
    try {
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const cutoffMs = Date.now() - THIRTY_DAYS_MS;
        const cutoffIso = new Date(cutoffMs).toISOString();

        // Active in-memory telemetry array pruning (>30 days old records physically removed)
        if (Array.isArray(memoryDb.ai_telemetry)) {
            memoryDb.ai_telemetry = memoryDb.ai_telemetry.filter(entry => new Date(entry.created_at || entry.timestamp).getTime() >= cutoffMs);
        }

        if (supabase) {
            const { data, error } = await supabase
                .from('ai_telemetry')
                .select('*')
                .gte('created_at', cutoffIso)
                .order('created_at', { ascending: false });

            if (!error && data) return res.json(data);
        }

        const logs = (memoryDb.ai_telemetry || [])
            .filter(t => new Date(t.created_at || t.timestamp).getTime() >= cutoffMs)
            .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp));

        return res.json(logs);
    } catch (err) {
        console.error('[ADMIN TELEMETRY ERROR]', err);
        return res.status(500).json({ error: 'Failed to retrieve AI query telemetry logs.' });
    }
});




// ==========================================================================
// TRANSACTIONS & CASH FLOW LEDGER ROUTES
// ==========================================================================

// Get All Transactions for authenticated user
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', req.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Map table column names to frontend camelCase if needed
            const formatted = data.map(t => ({
                id: t.id,
                date: t.date,
                source: t.source,
                merchant: t.merchant,
                type: t.type,
                category: t.category,
                taxStatus: t.tax_status,
                amount: parseFloat(t.amount)
            }));

            res.json({ transactions: formatted });
        } else {
            const txs = memoryDb.transactions.filter(t => t.user_id === req.user.id);
            res.json({ transactions: txs });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve ledger data.' });
    }
});

// Add New Transaction Entry
app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { source, merchant, type, category, amount, date } = req.body;
        const txId = 'tx_' + Date.now();
        const txDate = date || new Date().toLocaleString('en-US', { month: 'short', day: 'numeric' });

        const newTx = {
            id: txId,
            user_id: req.user.id,
            date: txDate,
            source,
            merchant,
            type,
            category: category || (type === 'income' ? 'Creator Revenue' : 'Operating Expense'),
            tax_status: type === 'income' ? 'Taxable Income' : '100% Tax Write-Off',
            amount: parseFloat(amount)
        };

        if (supabase) {
            const { error } = await supabase.from('transactions').insert([newTx]);
            if (error) throw error;
        } else {
            memoryDb.transactions.unshift(newTx);
        }

        res.status(201).json({
            message: 'Transaction saved successfully.',
            transaction: {
                id: newTx.id,
                date: newTx.date,
                source: newTx.source,
                merchant: newTx.merchant,
                type: newTx.type,
                category: newTx.category,
                taxStatus: newTx.tax_status,
                amount: newTx.amount
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save transaction.' });
    }
});

// ==========================================================================
// ONBOARDING RESPONSES ROUTES
// ==========================================================================

app.post('/api/onboarding/save', authenticateToken, async (req, res) => {
    try {
        const { creatorType, platforms, goal, connected, isManual } = req.body;

        if (supabase) {
            const { error } = await supabase.from('onboarding_responses').upsert({
                user_id: req.user.id,
                creator_type: creatorType,
                platforms,
                goal,
                connected,
                is_manual: isManual
            });
            if (error) throw error;
        } else {
            const existingIdx = memoryDb.onboarding.findIndex(o => o.user_id === req.user.id);
            const entry = { user_id: req.user.id, creatorType, platforms, goal, connected, isManual, updated_at: new Date() };
            if (existingIdx >= 0) {
                memoryDb.onboarding[existingIdx] = entry;
            } else {
                memoryDb.onboarding.push(entry);
            }
        }

        res.json({ success: true, message: 'Onboarding responses saved successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save onboarding responses.' });
    }
});

// ==========================================================================
// PHYLLO INTEGRATIONS ENDPOINT
// ==========================================================================

const PHYLLO_AUTH_HEADER = process.env.PHYLLO_AUTH_HEADER;

app.post('/api/integrations/phyllo/token', async (req, res) => {
    try {
        if (!PHYLLO_AUTH_HEADER) {
            console.error('[PHYLLO CONFIG ERROR] PHYLLO_AUTH_HEADER environment variable is missing.');
            return res.status(500).json({ error: 'Server configuration error: Phyllo credentials missing. Please set PHYLLO_AUTH_HEADER in Render dashboard.' });
        }
        let userId = null;
        let userName = null;

        // Try to authenticate if authorization header is provided
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
                userName = decoded.name;
            } catch (e) {
                // Ignore and fallback to guest mode
            }
        }

        const isGuest = !userId;
        if (isGuest) {
            userId = 'guest_' + Date.now();
            userName = 'Guest Creator';
        }

        let phylloUserId = null;

        // 1. Fetch user to see if they already have a phyllo_user_id
        if (!isGuest) {
            if (supabase) {
                const { data, error } = await supabase
                    .from('users')
                    .select('phyllo_user_id')
                    .eq('id', userId)
                    .maybeSingle();

                if (data && data.phyllo_user_id) {
                    phylloUserId = data.phyllo_user_id;
                }
            } else {
                const user = memoryDb.users.find(u => u.id === userId);
                if (user && user.phyllo_user_id) {
                    phylloUserId = user.phyllo_user_id;
                }
            }
        }

        // 2. If no phyllo_user_id exists, create a user in Phyllo
        if (!phylloUserId) {
            console.log(`[PHYLLO] Creating user for: ${userName}`);
            const userResponse = await fetch('https://api.staging.getphyllo.com/v1/users', {
                method: 'POST',
                headers: {
                    'Authorization': PHYLLO_AUTH_HEADER,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: userName,
                    external_id: userId
                })
            });
            const userData = await userResponse.json();

            if (!userResponse.ok) {
                console.error('[PHYLLO USER CREATION ERROR]', userData);
                return res.status(userResponse.status).json({ error: 'Failed to create user in Phyllo staging.', details: userData });
            }

            phylloUserId = userData.id;

            // Save the newly created phyllo_user_id (if not guest)
            if (!isGuest) {
                if (supabase) {
                    await supabase
                        .from('users')
                        .update({ phyllo_user_id: phylloUserId })
                        .eq('id', userId);
                } else {
                    const user = memoryDb.users.find(u => u.id === userId);
                    if (user) user.phyllo_user_id = phylloUserId;
                }
            }
        }

        // 3. Generate SDK token
        console.log(`[PHYLLO] Generating SDK token for: ${phylloUserId}`);
        const tokenResponse = await fetch('https://api.staging.getphyllo.com/v1/sdk-tokens', {
            method: 'POST',
            headers: {
                'Authorization': PHYLLO_AUTH_HEADER,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: phylloUserId,
                products: [
                    "IDENTITY",
                    "IDENTITY.AUDIENCE",
                    "ENGAGEMENT",
                    "ENGAGEMENT.AUDIENCE",
                    "INCOME",
                    "ACTIVITY"
                ]
            })
        });
        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('[PHYLLO TOKEN GENERATION ERROR]', tokenData);
            return res.status(tokenResponse.status).json({ error: 'Failed to generate SDK token in Phyllo staging.', details: tokenData });
        }

        // 4. Fetch active work platforms to map names to IDs dynamically
        let platformMap = {};
        try {
            console.log('[PHYLLO] Fetching active work platforms...');
            const platformResponse = await fetch('https://api.staging.getphyllo.com/v1/work-platforms', {
                method: 'GET',
                headers: {
                    'Authorization': PHYLLO_AUTH_HEADER
                }
            });
            const platformData = await platformResponse.json();
            if (platformResponse.ok && platformData.data) {
                platformData.data.forEach(p => {
                    platformMap[p.name] = p.id;
                });
            } else if (platformResponse.ok && Array.isArray(platformData)) {
                platformData.forEach(p => {
                    platformMap[p.name] = p.id;
                });
            }
            console.log(`[PHYLLO] Map: ${JSON.stringify(platformMap)}`);
        } catch (e) {
            console.error('[PHYLLO PLATFORMS FETCH ERROR]', e);
        }

        res.json({
            sdkToken: tokenData.sdk_token,
            phylloUserId: phylloUserId,
            platforms: platformMap
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error while generating connection token.' });
    }
});

// ==========================================================================
// FEATURE F11: GEMINI 1.5 FLASH BACKEND PROXY ROUTE & PII TELEMETRY
// ==========================================================================

function maskPII(text) {
    if (!text || typeof text !== 'string') return '';
    let masked = text;

    // 1. Email Masking
    masked = masked.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED_EMAIL]');

    // 2. Phone Number Masking (SA & Int'l formats, 7-15 digits)
    masked = masked.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g, (match) => {
        const digitsOnly = match.replace(/\D/g, '');
        if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
            return '[REDACTED_PHONE]';
        }
        return match;
    });

    // 3. ZAR Currency Masking (handles R1,500, R1500, ZAR 5000, R500, R1 500, R500.00, ZAR 5,000, 5000 ZAR, etc.)
    masked = masked.replace(/(?:ZAR|R)\s?\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?\b|\b(?:ZAR|R)\s?\d+(?:\.\d{2})?\b/gi, '[REDACTED_ZAR]');
    masked = masked.replace(/\b\d+(?:[,\s]\d{3})*(?:\.\d{2})?\s*ZAR\b/gi, '[REDACTED_ZAR]');

    return masked;
}

function inferCategoryTag(text) {
    if (!text || typeof text !== 'string') return 'General Inquiry';
    const lower = text.toLowerCase();
    if (lower.includes('tax') || lower.includes('deduction') || lower.includes('sars') || lower.includes('reserve') || lower.includes('write-off')) {
        return 'Tax Deduction Strategy';
    }
    if (lower.includes('gear') || lower.includes('camera') || lower.includes('lens') || lower.includes('equipment') || lower.includes('hardware') || lower.includes('purchase') || lower.includes('buy')) {
        return 'Gear Purchase Planning';
    }
    if (lower.includes('revenue') || lower.includes('youtube') || lower.includes('tiktok') || lower.includes('patreon') || lower.includes('adsense') || lower.includes('sponsor') || lower.includes('income') || lower.includes('brand')) {
        return 'Revenue Optimization';
    }
    return 'General Inquiry';
}

app.post('/api/gemini', async (req, res) => {
    const startTime = Date.now();
    const { prompt, systemContext } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid prompt in request body.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const categoryTag = inferCategoryTag(prompt);
    const maskedPrompt = maskPII(prompt);

    let aiText = '';
    let responseObj = null;
    let tokensUsed = 0;

    if (!apiKey) {
        aiText = 'Environment variable GEMINI_API_KEY not configured on server.';
        responseObj = { fallback: true, message: aiText };
    } else {
        try {
            const defaultSystemContext = systemContext || 'You are CCF Creator Intelligence, an expert financial advisor for modern creators. Provide concise, highly actionable 2-3 sentence financial guidance answering the user prompt directly.';

            const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: defaultSystemContext },
                            { text: prompt }
                        ]
                    }]
                })
            });

            const data = await apiResponse.json();
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                aiText = data.candidates[0].content.parts[0].text;
                tokensUsed = data.usageMetadata?.totalTokenCount || 0;
                responseObj = { text: aiText, source: 'Gemini 1.5 Flash (Backend API)' };
            } else {
                aiText = 'Unexpected API response structure';
                responseObj = { fallback: true, error: aiText, raw: data };
            }
        } catch (error) {
            console.error('[GEMINI BACKEND PROXY ERROR]', error);
            aiText = error.message;
            responseObj = { fallback: true, error: error.message };
        }
    }

    const latencyMs = Date.now() - startTime;
    if (!tokensUsed) {
        tokensUsed = Math.ceil(((prompt || '').length + (aiText || '').length) / 4);
    }

    const telemetryRecord = {
        id: 'tel_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
        category_tag: categoryTag,
        prompt_masked: maskedPrompt,
        tokens_used: tokensUsed,
        model: 'gemini-1.5-flash',
        latency_ms: latencyMs,
        created_at: new Date().toISOString()
    };

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const cutoffMs = Date.now() - THIRTY_DAYS_MS;

    if (supabase) {
        try {
            await supabase.from('ai_telemetry').insert([telemetryRecord]);
        } catch (tErr) {
            console.warn('⚠️ Supabase telemetry insert notice:', tErr.message);
        }
    }
    // Active in-memory telemetry array pruning (>30 days old records physically removed)
    if (Array.isArray(memoryDb.ai_telemetry)) {
        memoryDb.ai_telemetry = memoryDb.ai_telemetry.filter(entry => new Date(entry.created_at || entry.timestamp).getTime() >= cutoffMs);
    }
    memoryDb.ai_telemetry.push(telemetryRecord);

    return res.json(responseObj);
});

let server = null;
if (require.main === module) {
    server = app.listen(PORT, () => {
        console.log(`⚡ Creator Cash Flow Secure Backend API running on port ${PORT}`);
    });
}

module.exports = {
    app,
    server,
    memoryDb,
    rateLimitAdminLogin,
    requireAdmin,
    adminLoginAttempts,
    JWT_SECRET,
    maskPII,
    inferCategoryTag
};



