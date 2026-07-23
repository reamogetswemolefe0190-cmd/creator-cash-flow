/* ==========================================================================
   Creator Financial OS - HQ Engine & Database Orchestrator
   ========================================================================== */

const API_BASE_URL = 'https://creator-cash-flow.onrender.com/api';

// Application State
const state = {
    user: null,
    token: null,
    balance: 0,
    sources: [
        { name: 'YouTube Studio', amount: 18420, percent: '62%' },
        { name: 'TikTok Creator Rewards', amount: 4850, percent: '21%' },
        { name: 'Instagram Sponsorships', amount: 2100, percent: '10%' },
        { name: 'Sponsors & Affiliate', amount: 4940, percent: '7%' }
    ],
    timelineData: [
        { date: 'Jul 1', rev: 4200, exp: 500, profit: 3700 },
        { date: 'Jul 5', rev: 8900, exp: 1200, profit: 7700 },
        { date: 'Jul 10', rev: 12400, exp: 2100, profit: 10300 },
        { date: 'Jul 14', rev: 16800, exp: 2900, profit: 13900 },
        { date: 'Jul 18', rev: 20900, exp: 3850, profit: 17050 },
        { date: 'Jul 21', rev: 24650, exp: 4200, profit: 20450 }
    ],
    activities: [] // Loaded dynamically from Supabase database
};

// Onboarding State
const onboardingState = {
    creatorType: '',
    platforms: [],
    goal: '',
    connected: []
};

let intelligenceChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    setupMouseSpotlight();
    setupNavbarScroll();
    setupStreamBarsObserver();
    setupNavigation();
    setupAuthModalTrigger();

    // Check for existing verified session on load
    const cachedUser = localStorage.getItem('creator_cashflow_user');
    const cachedToken = localStorage.getItem('creator_cashflow_user_token');

    if (cachedUser && cachedToken) {
        try {
            state.user = JSON.parse(cachedUser);
            state.token = cachedToken;

            const label = document.getElementById('nav-user-label');
            if (label) label.innerText = state.user.name.split(' ')[0];
            const greetingLabel = document.getElementById('dashboard-user-greeting');
            if (greetingLabel) greetingLabel.innerText = state.user.name.split(' ')[0];

            // Load real data from Supabase
            loadUserTransactions();
        } catch (e) {
            loadLocalBackupData();
        }
    } else {
        loadLocalBackupData();
    }

    const syncBtn = document.getElementById('btn-sync-trigger');
    if (syncBtn) syncBtn.addEventListener('click', syncData);
});

// Load real transactions from Supabase cloud database
async function loadUserTransactions() {
    if (!state.token) return;

    try {
        const res = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        const data = await res.json();

        if (data.transactions && data.transactions.length > 0) {
            state.activities = data.transactions;

            // Recalculate balance and percentage streams based on database values
            let totalIncome = 0;
            let totalExpense = 0;

            state.activities.forEach(a => {
                if (a.type === 'income') totalIncome += a.amount;
                else totalExpense += a.amount;
            });

            state.balance = totalIncome - totalExpense;

            // Update Timeline graph points dynamically from DB
            const timelineMap = {};
            state.activities.slice().reverse().forEach(a => {
                const dateKey = a.date;
                if (!timelineMap[dateKey]) timelineMap[dateKey] = { rev: 0, exp: 0 };
                if (a.type === 'income') timelineMap[dateKey].rev += a.amount;
                else timelineMap[dateKey].exp += a.amount;
            });

            let runningRev = 0;
            let runningExp = 0;
            state.timelineData = Object.keys(timelineMap).map(k => {
                runningRev += timelineMap[k].rev;
                runningExp += timelineMap[k].exp;
                return {
                    date: k,
                    rev: runningRev,
                    exp: runningExp,
                    profit: runningRev - runningExp
                };
            });
        } else {
            loadLocalBackupData();
        }
    } catch (err) {
        console.warn('Backend connection failed. Loading local backup.', err);
        loadLocalBackupData();
    }

    renderDashboardData();
    initIntelligenceChart();
    animateCounter();
}

function loadLocalBackupData() {
    state.balance = 24650;
    state.activities = [
        { date: 'Jul 21', desc: 'Google AdSense South Africa Payout', type: 'income', amount: 18420 },
        { date: 'Jul 19', desc: 'Orms Direct (Sony Alpha Lens)', type: 'expense', amount: 4200 },
        { date: 'Jul 18', desc: 'TikTok Creator Rewards ZAR', type: 'income', amount: 4850 },
        { date: 'Jul 15', desc: 'Adobe Creative Cloud SA', type: 'expense', amount: 950 },
        { date: 'Jul 14', desc: 'Woolworths SA Brand Deal', type: 'income', amount: 2100 }
    ];
}

// ==========================================================================
// ONBOARDING MODULES
// ==========================================================================

function nextOnboardStep(stepNum) {
    document.querySelectorAll('.onboarding-step').forEach(step => {
        step.classList.add('hidden');
    });

    const nextStep = document.getElementById(`onboard-step-${stepNum}`);
    if (nextStep) {
        nextStep.classList.remove('hidden');
    }

    if (stepNum === 6) {
        triggerMagicMoment();
    }
}

function selectCreatorType(element) {
    document.querySelectorAll('#onboard-step-2 .onboard-select-option').forEach(opt => {
        opt.classList.remove('active');
    });
    element.classList.add('active');
    onboardingState.creatorType = element.getAttribute('data-value');
}

function togglePlatformChoice(element) {
    element.classList.toggle('active');
    const val = element.getAttribute('data-value');
    
    if (element.classList.contains('active')) {
        if (!onboardingState.platforms.includes(val)) {
            onboardingState.platforms.push(val);
        }
    } else {
        onboardingState.platforms = onboardingState.platforms.filter(p => p !== val);
    }
}

function selectGoal(element) {
    document.querySelectorAll('#onboard-step-4 .onboard-select-option').forEach(opt => {
        opt.classList.remove('active');
    });
    element.classList.add('active');
    onboardingState.goal = element.getAttribute('data-value');
}

function simulatePlatformConnect(element, platform) {
    // If already connected, toggle it off
    if (element.classList.contains('connected')) {
        element.classList.remove('connected');
        const badge = document.getElementById(`connect-${platform}`);
        if (badge) badge.innerText = 'Connect';
        onboardingState.connected = onboardingState.connected.filter(p => p !== platform);
        return;
    }

    const badge = document.getElementById(`connect-${platform}`);
    if (badge) badge.innerText = 'Linking...';

    // Assemble auth headers if token is present
    const headers = {};
    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }

    fetch(`${API_BASE_URL}/integrations/phyllo/token`, {
        method: 'POST',
        headers: headers
    })
    .then(res => res.json())
    .then(data => {
        if (!data.sdkToken) {
            alert('Failed to initialize connection token. Check server configurations.');
            if (badge) badge.innerText = 'Connect';
            return;
        }

        const config = {
            clientDisplayName: "Creator Cash Flow",
            environment: "staging",
            userId: data.phylloUserId,
            token: data.sdkToken
        };

        const platformId = getWorkPlatformId(platform);
        if (platformId) {
            config.workPlatformId = platformId;
        }

        console.log('[PHYLLO CONFIG DEBUG]', config);

        // Initialize live Phyllo Connect SDK (Staging environment)
        const phylloConnect = PhylloConnect.initialize(config);

        // Event listeners are bound directly to the returned phylloConnect instance
        phylloConnect.on("accountConnected", (accountId, workPlatformId, userId) => {
            console.log(`[PHYLLO SUCCESS] Linked Account: ${accountId} for platform: ${workPlatformId}`);
            element.classList.add('connected');
            if (badge) badge.innerText = 'Connected';
            if (!onboardingState.connected.includes(platform)) {
                onboardingState.connected.push(platform);
            }
        });

        phylloConnect.on("accountDisconnected", (accountId, workPlatformId, userId) => {
            console.log(`[PHYLLO DISCONNECTED] Account: ${accountId} for platform: ${workPlatformId}`);
            element.classList.remove('connected');
            if (badge) badge.innerText = 'Connect';
            onboardingState.connected = onboardingState.connected.filter(p => p !== platform);
        });

        phylloConnect.on("tokenExpired", (userId) => {
            console.warn(`[PHYLLO TOKEN EXPIRED] User: ${userId}`);
        });

        phylloConnect.on("connectionFailure", (reason, workPlatformId, userId) => {
            console.error('[PHYLLO SDK ERROR]', reason, workPlatformId, userId);
            if (badge) badge.innerText = 'Connect';
        });

        phylloConnect.on("exit", (reason, userId) => {
            console.log("[PHYLLO SDK EXIT] Flow closed:", reason);
            if (!element.classList.contains('connected')) {
                if (badge) badge.innerText = 'Connect';
            }
        });

        phylloConnect.open();
    })
    .catch(err => {
        console.warn('Backend connection failed. Reverting to mock connect simulation.', err);
        // Fallback mockup behavior
        element.classList.add('connected');
        if (badge) badge.innerText = 'Connected';
        if (!onboardingState.connected.includes(platform)) {
            onboardingState.connected.push(platform);
        }
    });
}

function getWorkPlatformId(platform) {
    // Map to default sandbox platform IDs or return undefined to show the catalog search menu
    if (platform === 'YouTube') return '9bb11b30-383f-422f-a404-00d69355b2e3'; // YouTube Sandbox
    return undefined; // catalog menu loads
}

async function triggerMagicMoment() {
    const platformsCount = onboardingState.platforms.length || 3;
    const streamsCount = platformsCount + 2;

    document.getElementById('magic-onboard-platforms').innerText = platformsCount;
    document.getElementById('magic-onboard-streams').innerText = streamsCount;

    // Save onboarding preferences to the backend database if user is logged in
    if (state.token) {
        try {
            await fetch(`${API_BASE_URL}/onboarding/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({
                    creatorType: onboardingState.creatorType,
                    platforms: onboardingState.platforms,
                    goal: onboardingState.goal
                })
            });
        } catch (e) {
            console.error('Failed to sync onboarding to cloud database', e);
        }
    }

    setTimeout(() => {
        switchView('app');
    }, 2500);
}

// ==========================================================================
// UTILITY & VIEW ENGINE
// ==========================================================================

function setupMouseSpotlight() {
    window.addEventListener('mousemove', (e) => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    });
}

function setupNavbarScroll() {
    const nav = document.getElementById('main-nav-header');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

function setupStreamBarsObserver() {
    const section = document.getElementById('platform-breakdown-section');
    if (!section) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bars = section.querySelectorAll('.stream-bar-fill');
                bars.forEach(bar => {
                    const targetWidth = bar.getAttribute('data-width') || '100%';
                    bar.style.width = targetWidth;
                });
                observer.unobserve(section);
            }
        });
    }, { threshold: 0.2 });

    observer.observe(section);
}

function switchView(mode) {
    const marketingView = document.getElementById('view-marketing');
    const appView = document.getElementById('view-app');
    const onboardingView = document.getElementById('view-onboarding');

    marketingView.classList.add('hidden');
    appView.classList.add('hidden');
    onboardingView.classList.add('hidden');

    if (mode === 'app') {
        appView.classList.remove('hidden');
        loadUserTransactions();
    } else if (mode === 'onboarding') {
        onboardingView.classList.remove('hidden');
        nextOnboardStep(1);
    } else {
        marketingView.classList.remove('hidden');
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.codex-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const tabId = item.getAttribute('data-tab');
            if (tabId) {
                e.preventDefault();
                switchTab(tabId);
            }
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.codex-nav .nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));

    const selectedNav = document.querySelector(`.codex-nav .nav-item[data-tab="${tabId}"]`);
    const selectedPane = document.getElementById(`tab-${tabId}`);

    if (selectedNav && selectedPane) {
        selectedNav.classList.add('active');
        selectedPane.classList.remove('hidden');
        selectedPane.classList.add('active');
    }
}

function animateCounter() {
    const target = state.balance;
    const element = document.getElementById('val-current-balance');
    const mktElement = document.getElementById('marketing-val-earnings');
    const badge = document.getElementById('val-change-badge');

    if (!element) return;

    let current = 0;
    const duration = 1200;
    const steps = 40;
    const stepVal = Math.ceil(target / steps);
    const stepTime = duration / steps;

    const timer = setInterval(() => {
        current += stepVal;
        if (current >= target) {
            current = target;
            clearInterval(timer);
            if (badge) badge.classList.add('visible');
        }
        element.innerText = `R${current.toLocaleString()}`;
        if (mktElement) mktElement.innerText = `R${current.toLocaleString()}`;
    }, stepTime);
}

function renderDashboardData() {
    const sourceContainer = document.getElementById('sources-stream-list');
    if (sourceContainer) {
        sourceContainer.innerHTML = '';
        state.sources.forEach(s => {
            sourceContainer.innerHTML += `
                <div class="stream-bar-row" style="margin-bottom: 20px;">
                    <div class="stream-bar-meta">
                        <span style="font-size: 14px; font-weight: 500;">${s.name}</span>
                        <span style="color: var(--accent-emerald); font-weight: 700; font-size: 14px;">R${s.amount.toLocaleString()} (${s.percent})</span>
                    </div>
                    <div class="stream-bar-track">
                        <div class="stream-bar-fill" style="width: ${s.percent};"></div>
                    </div>
                </div>
            `;
        });
    }

    const activityStream = document.getElementById('activity-stream-os');
    if (activityStream) {
        activityStream.innerHTML = '';
        state.activities.slice(0, 4).forEach(a => {
            const amountClass = a.type === 'income' ? 'style="color: var(--accent-emerald); font-weight: 700;"' : 'style="font-weight: 600;"';
            const prefix = a.type === 'income' ? '+' : '-';
            activityStream.innerHTML += `
                <div class="activity-item">
                    <div>
                        <div style="font-weight: 600; font-size: 13px;">${a.desc}</div>
                        <div style="font-size: 12px; color: var(--text-secondary); opacity: 0.6;">${a.date} • Verified Sync</div>
                    </div>
                    <div ${amountClass} font-size: 14px;">${prefix}R${a.amount.toLocaleString()}</div>
                </div>
            `;
        });
    }

    renderFullStreams();
}

function renderFullStreams() {
    const revStream = document.getElementById('full-revenue-stream');
    if (revStream) {
        revStream.innerHTML = '';
        state.activities.filter(a => a.type === 'income').forEach(a => {
            revStream.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: var(--border-card);">
                    <div>
                        <div style="font-size: 14px; font-weight: 600;">${a.desc}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${a.date}</div>
                    </div>
                    <div style="font-size: 16px; font-weight: 700; color: var(--accent-emerald);">+R${a.amount.toLocaleString()}</div>
                </div>
            `;
        });
    }

    const expStream = document.getElementById('full-expense-stream');
    if (expStream) {
        expStream.innerHTML = '';
        state.activities.filter(a => a.type === 'expense').forEach(a => {
            expStream.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: var(--border-card);">
                    <div>
                        <div style="font-size: 14px; font-weight: 600;">${a.desc}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${a.date} • 100% Tax Write-Off</div>
                    </div>
                    <div style="font-size: 16px; font-weight: 600;">-R${a.amount.toLocaleString()}</div>
                </div>
            `;
        });
    }
}

function initIntelligenceChart() {
    const canvas = document.getElementById('chart-revenue-intelligence');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 360);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.18)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');

    if (intelligenceChartInstance) intelligenceChartInstance.destroy();

    intelligenceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: state.timelineData.map(d => d.date),
            datasets: [{
                label: 'Revenue Timeline',
                data: state.timelineData.map(d => d.rev),
                borderColor: '#22C55E',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 8,
                pointBackgroundColor: '#22C55E',
                pointBorderColor: '#050505',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0B0B0B',
                    titleColor: '#FFFFFF',
                    bodyColor: '#22C55E',
                    borderColor: 'rgba(255, 255, 255, 0.16)',
                    borderWidth: 1,
                    displayColors: false,
                    padding: 14,
                    titleFont: { family: 'Inter', size: 13, weight: '600' },
                    bodyFont: { family: 'Inter', size: 13 },
                    callbacks: {
                        label: function(context) {
                            const idx = context.dataIndex;
                            const item = state.timelineData[idx];
                            return [
                                `Revenue:  R${item.rev.toLocaleString()}`,
                                `Expenses: R${item.exp.toLocaleString()}`,
                                `Net Profit: R${item.profit.toLocaleString()}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: { color: '#8E8E93', font: { family: 'Inter', size: 12 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: {
                        color: '#8E8E93',
                        font: { family: 'Inter', size: 12 },
                        callback: function(value) {
                            return 'R' + (value / 1000) + 'k';
                        }
                    }
                }
            }
        }
    });
}

function syncData() {
    const btn = document.getElementById('btn-sync-trigger');
    if (btn) {
        btn.innerText = `Syncing...`;
        setTimeout(() => {
            btn.innerText = `Synced`;
            loadUserTransactions();
            setTimeout(() => { btn.innerText = `Sync`; }, 2000);
        }, 1000);
    }
}

function setupAuthModalTrigger() {
    const authBtn = document.getElementById('btn-auth-modal');
    if (authBtn) authBtn.addEventListener('click', openAccountAuthModal);
}

function openAccountAuthModal() {
    openModal('Creator OS Authentication', `
        <div style="display: flex; gap: 8px; margin-bottom: 20px; background: rgba(255,255,255,0.03); padding: 4px; border-radius: var(--radius-strict);">
            <button class="btn btn-emerald btn-sm" id="auth-tab-signup" style="flex:1;" onclick="switchAuthTab('signup')">Create Account</button>
            <button class="btn btn-secondary btn-sm" id="auth-tab-login" style="flex:1;" onclick="switchAuthTab('login')">Sign In</button>
        </div>

        <div id="auth-signup-fields">
            <div class="form-group">
                <label>Full Creator Name</label>
                <input type="text" id="reg-name" class="form-input" placeholder="e.g. Reamogetswe Molefe">
            </div>
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="reg-email" class="form-input" placeholder="reamogetswe@creator.co.za">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="reg-pass" class="form-input" placeholder="••••••••••••">
            </div>
            <button class="btn btn-emerald" style="width: 100%; margin-top: 8px;" onclick="executeCreateAccount()">
                Create Creator Account
            </button>
        </div>

        <div id="auth-login-fields" class="hidden">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="login-email" class="form-input" placeholder="reamogetswe@creator.co.za">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="login-pass" class="form-input" placeholder="••••••••••••">
            </div>
            <button class="btn btn-emerald" style="width: 100%; margin-top: 8px;" onclick="executeLogin()">
                Sign In To OS
            </button>
        </div>
    `);
}

function switchAuthTab(tab) {
    const signupFields = document.getElementById('auth-signup-fields');
    const loginFields = document.getElementById('auth-login-fields');
    const signupBtn = document.getElementById('auth-tab-signup');
    const loginBtn = document.getElementById('auth-tab-login');

    if (tab === 'signup') {
        signupFields.classList.remove('hidden');
        loginFields.classList.add('hidden');
        signupBtn.className = 'btn btn-emerald btn-sm';
        loginBtn.className = 'btn btn-secondary btn-sm';
    } else {
        signupFields.classList.add('hidden');
        loginFields.classList.remove('hidden');
        signupBtn.className = 'btn btn-secondary btn-sm';
        loginBtn.className = 'btn btn-emerald btn-sm';
    }
}

async function executeCreateAccount() {
    const name = document.getElementById('reg-name').value.trim() || 'Reamogetswe';
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-pass').value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (res.status !== 201) {
            alert(data.error || 'Signup failed.');
            return;
        }

        // Automatic Login after Registration
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();

        state.user = loginData.user;
        state.token = loginData.token;

        localStorage.setItem('creator_cashflow_user', JSON.stringify(state.user));
        localStorage.setItem('creator_cashflow_user_token', state.token);

        const label = document.getElementById('nav-user-label');
        if (label) label.innerText = name.split(' ')[0];
        const greetingLabel = document.getElementById('dashboard-user-greeting');
        if (greetingLabel) greetingLabel.innerText = name.split(' ')[0];

        closeModal();
        switchView('app');
        alert(`🎉 Creator HQ Activated for ${name}! Seed data populated successfully.`);
    } catch (err) {
        console.error('Signup failed, using offline fallback', err);
        // Offline Fallback
        state.user = { id: 'usr_offline', name, email };
        state.token = 'offline_token';
        localStorage.setItem('creator_cashflow_user', JSON.stringify(state.user));
        localStorage.setItem('creator_cashflow_user_token', state.token);
        closeModal();
        switchView('app');
    }
}

async function executeLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-pass').value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.status !== 200) {
            alert(data.error || 'Login failed.');
            return;
        }

        state.user = data.user;
        state.token = data.token;

        localStorage.setItem('creator_cashflow_user', JSON.stringify(state.user));
        localStorage.setItem('creator_cashflow_user_token', state.token);

        const label = document.getElementById('nav-user-label');
        if (label) label.innerText = state.user.name.split(' ')[0];
        const greetingLabel = document.getElementById('dashboard-user-greeting');
        if (greetingLabel) greetingLabel.innerText = state.user.name.split(' ')[0];

        closeModal();
        switchView('app');
        alert(`Welcome back, ${state.user.name}! Syncing database records...`);
    } catch (err) {
        alert('Could not authenticate. Verify network status.');
    }
}

async function submitActivity() {
    const desc = document.getElementById('act-desc').value || 'New Entry';
    const type = document.getElementById('act-type').value;
    const amount = parseFloat(document.getElementById('act-amount').value) || 2500;

    if (state.token && state.token !== 'offline_token') {
        try {
            await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({
                    source: type === 'income' ? 'YouTube' : 'Bank',
                    merchant: desc,
                    type,
                    amount
                })
            });
            
            // Sync ledger values directly from Supabase DB
            loadUserTransactions();
        } catch (e) {
            console.error('Failed to sync transaction to cloud database', e);
        }
    } else {
        // Offline Fallback local modification
        state.activities.unshift({
            date: 'Today',
            desc,
            type,
            amount
        });
        if (type === 'income') state.balance += amount;
        else state.balance -= amount;
        renderDashboardData();
        animateCounter();
    }

    closeModal();
}

function openModal(title, html) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-app').classList.add('active');
    lucide.createIcons();
}

function closeModal() {
    document.getElementById('modal-app').classList.remove('active');
}
