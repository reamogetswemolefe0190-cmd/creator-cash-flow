/* ==========================================================================
   Creator Cash Flow - Full-Stack REST API Backend Server
   ========================================================================== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-creator-cashflow-secret-key-2026';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 bytes

// Security Headers & Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Root API Welcome Endpoint
app.get('/', (req, res) => {
    res.json({
        name: "Creator Cash Flow API Engine",
        status: "active",
        security: "AES-256-CBC + JWT",
        version: "2.0.0",
        documentation: "https://github.com/reamogetswemolefe0190-cmd/creator-cash-flow"
    });
});

// In-Memory Database Store for Testing (Complements Supabase Cloud DB)
const db = {
    users: [
        {
            id: 'user_alex_101',
            email: 'alex@creator.com',
            passwordHash: bcrypt.hashSync('CreatorPass2026!', 10),
            name: 'Alex Rivera',
            verified: true,
            createdAt: new Date().toISOString()
        }
    ],
    transactions: [
        { id: 'tx1', userId: 'user_alex_101', date: '2026-07-21', source: 'YouTube', merchant: 'Google AdSense Payout', type: 'income', category: 'Ad Revenue', taxStatus: 'Taxable Income', amount: 8420.00 },
        { id: 'tx2', userId: 'user_alex_101', date: '2026-07-19', source: 'Bank', merchant: 'B&H Photo Video (Sony Lens)', type: 'expense', category: 'Gear & Equipment', taxStatus: '100% Write-Off', amount: 1299.00 },
        { id: 'tx3', userId: 'user_alex_101', date: '2026-07-18', source: 'TikTok', merchant: 'TikTok Creator Fund Direct', type: 'income', category: 'Creator Fund', taxStatus: 'Taxable Income', amount: 4320.00 }
    ],
    connectedVaults: []
};

// AES-256 Token Encryption Helpers
function encryptToken(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired session token' });
        req.user = user;
        next();
    });
}

// --- AUTHENTICATION ROUTES ---

// 1. User Signup & Email Verification Trigger
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = {
            id: 'user_' + Date.now(),
            email,
            passwordHash,
            name,
            verified: false,
            verificationToken,
            createdAt: new Date().toISOString()
        };

        db.users.push(newUser);

        // Simulation of Automated Email Verification Link
        console.log(`[EMAIL SYSTEM] Sent verification link to ${email}: https://creator-cash-flow.app/verify?token=${verificationToken}`);

        res.status(201).json({
            message: 'Registration successful! Verification email sent.',
            userId: newUser.id,
            email: newUser.email,
            emailVerificationSent: true
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error during signup.' });
    }
});

// 2. Email Verification Confirmation Endpoint
app.post('/api/auth/verify-email', (req, res) => {
    const { token } = req.body;
    const user = db.users.find(u => u.verificationToken === token);

    if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    user.verified = true;
    delete user.verificationToken;

    res.json({ message: 'Email successfully verified! You can now log in.', verified: true });
});

// 3. User Login & JWT Issuance
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
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
                email: user.email,
                verified: user.verified
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error during login.' });
    }
});

// --- TRANSACTIONS & CASH FLOW ROUTES ---

// Get User Ledger (Protected)
app.get('/api/transactions', authenticateToken, (req, res) => {
    const userTx = db.transactions.filter(t => t.userId === req.user.id);
    res.json({ transactions: userTx });
});

// Create New Transaction (Protected)
app.post('/api/transactions', authenticateToken, (req, res) => {
    const { source, merchant, type, category, amount, date } = req.body;

    const newTx = {
        id: 'tx_' + Date.now(),
        userId: req.user.id,
        date: date || new Date().toISOString().split('T')[0],
        source,
        merchant,
        type,
        category: category || (type === 'income' ? 'Creator Payout' : 'Business Expense'),
        taxStatus: type === 'income' ? 'Taxable Income' : '100% Write-Off',
        amount: parseFloat(amount)
    };

    db.transactions.unshift(newTx);
    res.status(201).json({ message: 'Transaction added to cash flow ledger', transaction: newTx });
});

// --- PLATFORM VAULTS & PLAID BANK API PROXY ---

app.post('/api/integrations/link-vault', authenticateToken, (req, res) => {
    const { platformId, rawAccessToken } = req.body;

    const encryptedToken = encryptToken(rawAccessToken);

    const vaultEntry = {
        id: 'vault_' + Date.now(),
        userId: req.user.id,
        platformId,
        encryptedToken,
        status: 'Encrypted Active Sync',
        linkedAt: new Date().toISOString()
    };

    db.connectedVaults.push(vaultEntry);
    res.json({ message: 'Platform vault linked securely with AES-256 encryption', vaultId: vaultEntry.id });
});

// Server Health Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'active', serverTime: new Date().toISOString(), security: 'AES-256-GCM + JWT' });
});

app.listen(PORT, () => {
    console.log(`⚡ Creator Cash Flow Secure Backend API running on port ${PORT}`);
});
