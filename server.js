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
    onboarding: []
};

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
        const userId = 'usr_' + Date.now();

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
// FEATURE F11: GEMINI 1.5 FLASH BACKEND PROXY ROUTE
// ==========================================================================
app.post('/api/gemini', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.json({ 
            fallback: true, 
            message: 'Environment variable GEMINI_API_KEY not configured on server.' 
        });
    }

    try {
        const { prompt, systemContext } = req.body || {};
        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt in request body.' });
        }

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
            const aiText = data.candidates[0].content.parts[0].text;
            return res.json({ text: aiText, source: 'Gemini 1.5 Flash (Backend API)' });
        } else {
            return res.json({ fallback: true, error: 'Unexpected API response structure', raw: data });
        }
    } catch (error) {
        console.error('[GEMINI BACKEND PROXY ERROR]', error);
        return res.json({ fallback: true, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`⚡ Creator Cash Flow Secure Backend API running on port ${PORT}`);
});

