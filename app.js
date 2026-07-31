/* ==========================================================================
   Creator Financial OS - HQ Engine & Database Orchestrator
   ========================================================================== */

const API_BASE_URL = 'https://creator-cash-flow.onrender.com/api';

// Application State
const state = {
    user: null,
    token: null,
    balance: 0,
    sources: [],
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
    platforms: [],
    connected: []
};

let intelligenceChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    setupNavbarScroll();
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
    if (state.token === 'demo_token') {
        recalculateBusinessMetrics();
        renderDashboardData();
        initIntelligenceChart();
        animateCounter();
        return;
    }

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

    recalculateBusinessMetrics();
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
    recalculateBusinessMetrics();
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

    if (stepNum === 2) {
        const connectList = document.getElementById('onboarding-connect-list');
        if (connectList) {
            connectList.innerHTML = '';
            if (onboardingState.platforms.length === 0) {
                onboardingState.platforms = ['YouTube', 'TikTok'];
            }
            onboardingState.platforms.forEach(platform => {
                const card = document.createElement('div');
                card.className = "connection-platform-card flex justify-between items-center p-md bg-surface-container-low border border-outline-variant rounded-2xl cursor-pointer hover:bg-surface-container transition-all";
                card.onclick = (e) => simulatePlatformConnect(card, platform);
                
                card.innerHTML = `
                    <div class="flex items-center gap-sm">
                        <span class="material-symbols-outlined text-primary">${platform === 'YouTube' ? 'play_circle' : platform === 'TikTok' ? 'music_note' : platform === 'Instagram' ? 'photo_camera' : 'account_balance_wallet'}</span>
                        <span class="font-body-md font-semibold">${platform} Channel</span>
                    </div>
                    <span class="connect-badge text-xs font-bold border border-outline-variant bg-surface px-md py-xs rounded-xl" id="connect-${platform}">Connect</span>
                `;
                connectList.appendChild(card);
            });
        }
    }

    if (stepNum === 3) {
        triggerMagicMoment();
    }
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

function skipOnboardingConnection(e) {
    if (e) e.preventDefault();
    console.log('[ONBOARDING] Skip trigger called. Routing to Step 3.');
    nextOnboardStep(3);
}

function simulatePlatformConnect(element, platform) {
    if (element.classList.contains('connected')) {
        element.classList.remove('connected');
        const badge = document.getElementById(`connect-${platform}`);
        if (badge) badge.innerText = 'Connect';
        onboardingState.connected = onboardingState.connected.filter(p => p !== platform);
        return;
    }

    const badge = document.getElementById(`connect-${platform}`);
    if (badge) badge.innerText = 'Linking...';

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

        const platformId = findPlatformId(platform, data.platforms);
        if (platformId) {
            config.workPlatformId = platformId;
        }

        const phylloConnect = PhylloConnect.initialize(config);

        phylloConnect.on("accountConnected", (accountId, workPlatformId, userId) => {
            element.classList.add('connected');
            if (badge) badge.innerText = 'Connected';
            if (!onboardingState.connected.includes(platform)) {
                onboardingState.connected.push(platform);
            }
        });

        phylloConnect.on("accountDisconnected", (accountId, workPlatformId, userId) => {
            element.classList.remove('connected');
            if (badge) badge.innerText = 'Connect';
            onboardingState.connected = onboardingState.connected.filter(p => p !== platform);
        });

        phylloConnect.open();
    })
    .catch(err => {
        console.warn('Backend connection failed. Reverting to mock connect simulation.', err);
        element.classList.add('connected');
        if (badge) badge.innerText = 'Connected';
        if (!onboardingState.connected.includes(platform)) {
            onboardingState.connected.push(platform);
        }
    });
}

function findPlatformId(platformName, platformMap) {
    if (!platformMap || typeof platformMap !== 'object') return undefined;
    const search = platformName.toLowerCase();
    for (const name of Object.keys(platformMap)) {
        const nameLower = name.toLowerCase();
        if (nameLower.includes(search) || search.includes(nameLower)) {
            return platformMap[name];
        }
    }
    return undefined;
}

async function triggerMagicMoment() {
    const platformsCount = onboardingState.platforms.length || 3;
    document.getElementById('magic-onboard-platforms').innerText = platformsCount;

    if (state.token) {
        try {
            await fetch(`${API_BASE_URL}/onboarding/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({
                    platforms: onboardingState.platforms
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

function setupNavbarScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('shadow-md');
        } else {
            header.classList.remove('shadow-md');
        }
    });
}

function setupNavigation() {
    const navItems = document.querySelectorAll('[data-tab]');
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
    document.querySelectorAll('[data-tab]').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));

    const selectedNavs = document.querySelectorAll(`[data-tab="${tabId}"]`);
    const selectedPane = document.getElementById(`tab-${tabId}`);

    if (selectedPane) {
        selectedNavs.forEach(nav => nav.classList.add('active'));
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
                <div class="space-y-sm" style="margin-bottom: 20px;">
                    <div class="flex justify-between text-label-lg">
                        <span>${s.name}</span>
                        <span class="font-bold text-secondary">R${s.amount.toLocaleString()} (${s.percent})</span>
                    </div>
                    <div class="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                        <div class="h-full bg-primary" style="width: ${s.percent};"></div>
                    </div>
                </div>
            `;
        });
    }

    const activityStream = document.getElementById('activity-stream-os');
    if (activityStream) {
        activityStream.innerHTML = '';
        state.activities.slice(0, 4).forEach(a => {
            const amountClass = a.type === 'income' ? 'class="font-display font-bold text-secondary text-sm"' : 'class="font-display font-bold text-primary text-sm"';
            const prefix = a.type === 'income' ? '+' : '-';
            activityStream.innerHTML += `
                <div class="flex justify-between items-center p-md bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <div>
                        <div class="font-body-md font-semibold text-primary text-sm">${a.desc}</div>
                        <div class="text-xs text-outline">${a.date} • Verified Sync</div>
                    </div>
                    <div ${amountClass}>${prefix}R${a.amount.toLocaleString()}</div>
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
                <div class="flex justify-between items-center py-md border-b border-outline-variant/30">
                    <div>
                        <div class="font-body-md font-semibold text-primary text-sm">${a.desc}</div>
                        <div class="text-xs text-outline">${a.date}</div>
                    </div>
                    <div class="font-display font-bold text-secondary text-sm">+R${a.amount.toLocaleString()}</div>
                </div>
            `;
        });
    }

    const expStream = document.getElementById('full-expense-stream');
    if (expStream) {
        expStream.innerHTML = '';
        state.activities.filter(a => a.type === 'expense').forEach(a => {
            expStream.innerHTML += `
                <div class="flex justify-between items-center py-md border-b border-outline-variant/30">
                    <div>
                        <div class="font-body-md font-semibold text-primary text-sm">${a.desc}</div>
                        <div class="text-xs text-outline">${a.date}</div>
                    </div>
                    <div class="font-display font-bold text-primary text-sm">-R${a.amount.toLocaleString()}</div>
                </div>
            `;
        });
    }
}

function initIntelligenceChart() {
    const canvas = document.getElementById('chart-revenue-intelligence');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(0, 108, 73, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 108, 73, 0)');

    if (intelligenceChartInstance) intelligenceChartInstance.destroy();

    intelligenceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: state.timelineData.map(d => d.date),
            datasets: [{
                label: 'Revenue Timeline',
                data: state.timelineData.map(d => d.rev),
                borderColor: '#006c49',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 8,
                pointBackgroundColor: '#006c49',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#FFFFFF',
                    titleColor: '#0B1C30',
                    bodyColor: '#006c49',
                    borderColor: '#C6C6CD',
                    borderWidth: 1,
                    displayColors: false,
                    padding: 12,
                    titleFont: { family: 'Inter', size: 12, weight: '600' },
                    bodyFont: { family: 'Inter', size: 12 },
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
                    grid: { color: 'rgba(0, 0, 0, 0.03)' },
                    ticks: { color: '#76777D', font: { family: 'Inter', size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(0, 0, 0, 0.03)' },
                    ticks: {
                        color: '#76777D',
                        font: { family: 'Inter', size: 11 },
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

// ==========================================================================
// AUTHENTICATION MODULES
// ==========================================================================

function setupAuthModalTrigger() {
    const authBtn = document.getElementById('btn-auth-modal');
    if (authBtn) authBtn.addEventListener('click', openAccountAuthModal);
}

function openAccountAuthModal() {
    openModal('Authentication', `
        <div class="flex gap-sm p-xs bg-surface-container rounded-2xl mb-lg">
            <button class="flex-1 font-label-lg py-sm rounded-xl bg-primary text-on-primary shadow-sm" id="auth-tab-signup" onclick="switchAuthTab('signup')">Create Account</button>
            <button class="flex-1 font-label-lg py-sm rounded-xl text-primary hover:bg-surface-container-high" id="auth-tab-login" onclick="switchAuthTab('login')">Sign In</button>
        </div>

        <div id="auth-signup-fields" class="space-y-md">
            <div class="space-y-xs text-left">
                <label class="text-xs text-outline font-bold uppercase">Full Creator Name</label>
                <input type="text" id="reg-name" class="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-primary focus:border-secondary focus:ring-0" placeholder="e.g. Reamogetswe Molefe">
            </div>
            <div class="space-y-xs text-left">
                <label class="text-xs text-outline font-bold uppercase">Email Address</label>
                <input type="email" id="reg-email" class="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-primary focus:border-secondary focus:ring-0" placeholder="reamogetswe@creator.co.za">
            </div>
            <div class="space-y-xs text-left">
                <label class="text-xs text-outline font-bold uppercase">Password</label>
                <input type="password" id="reg-pass" class="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-primary focus:border-secondary focus:ring-0" placeholder="••••••••••••">
            </div>
            <button class="w-full bg-primary text-on-primary font-label-lg py-md rounded-xl shadow-lg active:scale-95 transition-transform mt-lg" onclick="executeCreateAccount()">
                Create Creator Account
            </button>
        </div>

        <div id="auth-login-fields" class="space-y-md hidden">
            <div class="space-y-xs text-left">
                <label class="text-xs text-outline font-bold uppercase">Email Address</label>
                <input type="email" id="login-email" class="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-primary focus:border-secondary focus:ring-0" placeholder="reamogetswe@creator.co.za">
            </div>
            <div class="space-y-xs text-left">
                <label class="text-xs text-outline font-bold uppercase">Password</label>
                <input type="password" id="login-pass" class="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-primary focus:border-secondary focus:ring-0" placeholder="••••••••••••">
            </div>
            <button class="w-full bg-primary text-on-primary font-label-lg py-md rounded-xl shadow-lg active:scale-95 transition-transform mt-lg" onclick="executeLogin()">
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
        signupBtn.className = 'flex-1 font-label-lg py-sm rounded-xl bg-primary text-on-primary shadow-sm';
        loginBtn.className = 'flex-1 font-label-lg py-sm rounded-xl text-primary hover:bg-surface-container-high';
    } else {
        signupFields.classList.add('hidden');
        loginFields.classList.remove('hidden');
        signupBtn.className = 'flex-1 font-label-lg py-sm rounded-xl text-primary hover:bg-surface-container-high';
        loginBtn.className = 'flex-1 font-label-lg py-sm rounded-xl bg-primary text-on-primary shadow-sm';
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
        switchTab('overview');
        switchView('app');
        alert(`🎉 Creator HQ Activated for ${name}! Seed data populated successfully.`);
    } catch (err) {
        console.error('Signup failed, using offline fallback', err);
        state.user = { id: 'usr_offline', name, email };
        state.token = 'offline_token';
        localStorage.setItem('creator_cashflow_user', JSON.stringify(state.user));
        localStorage.setItem('creator_cashflow_user_token', state.token);
        closeModal();
        switchTab('overview');
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
        switchTab('overview');
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

    if (state.token && state.token !== 'offline_token' && state.token !== 'demo_token') {
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
            
            loadUserTransactions();
        } catch (e) {
            console.error('Failed to sync transaction to cloud database', e);
        }
    } else {
        state.activities.unshift({
            date: 'Today',
            desc,
            type,
            amount
        });
        
        recalculateBusinessMetrics();
        if (typeof updateDemoTimeline === 'function') {
            updateDemoTimeline();
        }
        
        renderDashboardData();
        animateCounter();
        initIntelligenceChart();
    }

    closeModal();
}

function openModal(title, html) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-app').classList.add('active');
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeModal() {
    document.getElementById('modal-app').classList.remove('active');
}

function openAddActivityModal() {
    openModal('Add Ledger Entry', `
        <div class="space-y-md">
            <div class="space-y-xs text-left">
                <label class="text-xs text-outline font-bold uppercase">Description</label>
                <input type="text" id="act-desc" class="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-primary focus:border-secondary focus:ring-0" placeholder="e.g. YouTube AdSense Payout">
            </div>
            <div class="space-y-xs text-left">
                <label class="text-xs text-outline font-bold uppercase">Type</label>
                <select id="act-type" class="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-primary focus:border-secondary focus:ring-0">
                    <option value="income">Income</option>
                    <option value="expense">Expense Write-off</option>
                </select>
            </div>
            <div class="space-y-xs text-left">
                <label class="text-xs text-outline font-bold uppercase">Amount (ZAR)</label>
                <input type="number" id="act-amount" class="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-primary focus:border-secondary focus:ring-0" placeholder="2500">
            </div>
            <button class="w-full bg-primary text-on-primary font-label-lg py-md rounded-xl shadow-lg active:scale-95 transition-transform mt-lg" onclick="submitActivity()">
                Save Entry
            </button>
        </div>
    `);
}

// ==========================================================================
// DEMO MODE ENGINE
// ==========================================================================

function enterDemoMode() {
    state.user = { name: 'Demo Creator', email: 'demo@creator.co' };
    state.token = 'demo_token';
    
    const label = document.getElementById('nav-user-label');
    if (label) label.innerText = 'Demo';
    const greetingLabel = document.getElementById('dashboard-user-greeting');
    if (greetingLabel) greetingLabel.innerText = 'Demo';

    const banner = document.getElementById('demo-mode-banner');
    if (banner) banner.classList.remove('hidden');

    state.activities = [
        { date: 'Jul 28', desc: 'Sponsorship Commission Payout', type: 'income', amount: 3200 },
        { date: 'Jul 26', desc: 'Supercell Brand Sponsorship', type: 'income', amount: 8500 },
        { date: 'Jul 24', desc: 'DigitalOcean Cloud Hosting', type: 'expense', amount: 480 },
        { date: 'Jul 21', desc: 'Google AdSense South Africa Payout', type: 'income', amount: 18420 },
        { date: 'Jul 19', desc: 'Orms Direct (Sony Alpha Lens)', type: 'expense', amount: 4200 },
        { date: 'Jul 18', desc: 'TikTok Creator Rewards ZAR', type: 'income', amount: 4850 },
        { date: 'Jul 15', desc: 'Adobe Creative Cloud SA', type: 'expense', amount: 950 },
        { date: 'Jul 14', desc: 'Woolworths SA Brand Deal', type: 'income', amount: 2100 }
    ];

    recalculateBusinessMetrics();
    updateDemoTimeline();
    switchTab('overview');
    switchView('app');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function exitDemoMode() {
    state.user = null;
    state.token = null;

    const label = document.getElementById('nav-user-label');
    if (label) label.innerText = 'Account';
    const greetingLabel = document.getElementById('dashboard-user-greeting');
    if (greetingLabel) greetingLabel.innerText = 'Creator';

    const banner = document.getElementById('demo-mode-banner');
    if (banner) banner.classList.add('hidden');

    switchView('marketing');
}

function updateDemoTimeline() {
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

// ==========================================================================
// CORE METRICS & AI HEURISTIC ENGINE
// ==========================================================================

function recalculateBusinessMetrics() {
    let totalIncome = 0;
    let totalExpense = 0;
    const platformBreakdown = {
        YouTube: 0,
        TikTok: 0,
        Instagram: 0,
        Patreon: 0,
        Affiliate: 0
    };

    state.activities.forEach(a => {
        const amt = a.amount;
        if (a.type === 'income') {
            totalIncome += amt;
            const desc = a.desc.toLowerCase();
            if (desc.includes('youtube') || desc.includes('adsense')) {
                platformBreakdown.YouTube += amt;
            } else if (desc.includes('tiktok') || desc.includes('rewards')) {
                platformBreakdown.TikTok += amt;
            } else if (desc.includes('instagram') || desc.includes('deals') || desc.includes('brand') || desc.includes('sponsorship')) {
                platformBreakdown.Instagram += amt;
            } else if (desc.includes('patreon') || desc.includes('sub')) {
                platformBreakdown.Patreon += amt;
            } else {
                platformBreakdown.Affiliate += amt;
            }
        } else {
            totalExpense += amt;
        }
    });

    state.balance = totalIncome - totalExpense;

    state.sources = [];
    Object.keys(platformBreakdown).forEach(key => {
        const val = platformBreakdown[key];
        if (val > 0) {
            const pct = totalIncome > 0 ? Math.round((val / totalIncome) * 100) : 0;
            state.sources.push({
                name: `${key} Studio`,
                amount: val,
                percent: `${pct}%`
            });
        }
    });

    state.sources.sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));

    // 1. Dynamic Tax Liability
    const estimatedTax = Math.max(0, Math.round(state.balance * 0.15));
    const taxEl = document.getElementById('estimated-tax-val');
    if (taxEl) {
        taxEl.innerText = `R${estimatedTax.toLocaleString()}`;
    }

    // 2. Creator Score Logic
    let score = 100;
    let scoreLabel = 'Excellent';
    let scoreBgClass = 'bg-green-50/70';
    let scoreBorderClass = 'border-green-200';

    let highestPct = 0;
    Object.keys(platformBreakdown).forEach(key => {
        const val = platformBreakdown[key];
        const pct = totalIncome > 0 ? (val / totalIncome) : 0;
        if (pct > highestPct) highestPct = pct;
    });
    if (highestPct > 0.70) {
        score -= 15;
    }

    const profitMargin = totalIncome > 0 ? (state.balance / totalIncome) : 0;
    if (profitMargin < 0.60) {
        score -= 15;
    } else if (profitMargin > 0.80) {
        score += 5;
    }

    const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) : 0;
    if (expenseRatio > 0.30) {
        score -= 10;
    }

    score = Math.max(0, Math.min(100, score));

    if (score >= 90) {
        scoreLabel = 'Excellent';
        scoreBgClass = 'bg-green-50/70';
        scoreBorderClass = 'border-green-200';
    } else if (score >= 70) {
        scoreLabel = 'Healthy';
        scoreBgClass = 'bg-yellow-50/70';
        scoreBorderClass = 'border-yellow-200';
    } else {
        scoreLabel = 'Needs Attention';
        scoreBgClass = 'bg-red-50/70';
        scoreBorderClass = 'border-red-200';
    }

    const scoreValEl = document.getElementById('creator-score-val');
    if (scoreValEl) scoreValEl.innerText = score;

    const scoreLabelEl = document.getElementById('creator-score-label');
    if (scoreLabelEl) {
        scoreLabelEl.innerText = scoreLabel;
        if (score >= 90) {
            scoreLabelEl.className = "text-label-lg font-bold text-green-700";
        } else if (score >= 70) {
            scoreLabelEl.className = "text-label-lg font-bold text-yellow-700";
        } else {
            scoreLabelEl.className = "text-label-lg font-bold text-red-700";
        }
    }

    const scoreCardEl = document.getElementById('creator-score-color');
    if (scoreCardEl) {
        scoreCardEl.className = `p-lg border rounded-2xl card-shadow flex flex-col justify-between ${scoreBgClass} ${scoreBorderClass}`;
    }

    // 3. AI Recommendations
    const insightsEl = document.getElementById('ai-insights-list');
    if (insightsEl) {
        insightsEl.innerHTML = '';
        const insights = [];

        if (highestPct > 0.70) {
            insights.push(`<li class="text-red-700 font-medium">⚠️ Risk Alert: Roster dependency is high (${Math.round(highestPct * 100)}% on one platform).</li>`);
        } else {
            insights.push(`<li class="text-green-700 font-medium">✓ Diversification is healthy across channels.</li>`);
        }

        if (expenseRatio > 0.25) {
            insights.push(`<li class="text-yellow-700">⚠️ Overhead Alert: Expenses represent ${Math.round(expenseRatio * 100)}% of earnings.</li>`);
        }

        let largestExpenseAmt = 0;
        let largestExpenseDesc = '';
        state.activities.forEach(a => {
            if (a.type === 'expense' && a.amount > largestExpenseAmt) {
                largestExpenseAmt = a.amount;
                largestExpenseDesc = a.desc;
            }
        });

        if (largestExpenseAmt > 0) {
            const descLower = largestExpenseDesc.toLowerCase();
            if (descLower.includes('cloud') || descLower.includes('creative') || descLower.includes('adobe') || descLower.includes('hosting') || descLower.includes('digitalocean')) {
                insights.push(`<li>🔮 Software overheads dominate expenses. Audit inactive seat subscriptions to save up to 12%.</li>`);
            } else if (descLower.includes('lens') || descLower.includes('camera') || descLower.includes('gear') || descLower.includes('orms')) {
                insights.push(`<li>🔮 Gear depreciation detected. Ensure this equipment write-off is logged in tax deductions.</li>`);
            } else {
                insights.push(`<li>🔮 Optimize cash flow by tracking recurring operational write-offs.</li>`);
            }
        } else {
            insights.push(`<li>🔮 No business expenses logged. Add operational overheads to lower tax obligation.</li>`);
        }

        insights.forEach(ins => {
            insightsEl.innerHTML += ins;
        });
    }
}
