/* ==========================================================================
   Creator Cash Flow - Financial Intelligence Engine & View Switcher
   ========================================================================== */

const API_BASE_URL = 'https://creator-cash-flow.onrender.com/api';

// State Management
const state = {
    user: { name: 'Reamogetswe', email: 'reamogetswe@creator.co.za' },
    balance: 24650,
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
    activities: [
        { date: 'Jul 21', desc: 'Google AdSense South Africa Payout', type: 'income', amount: 18420 },
        { date: 'Jul 19', desc: 'Orms Direct (Sony Alpha Lens)', type: 'expense', amount: 4200 },
        { date: 'Jul 18', desc: 'TikTok Creator Rewards ZAR', type: 'income', amount: 4850 },
        { date: 'Jul 15', desc: 'Adobe Creative Cloud SA', type: 'expense', amount: 950 },
        { date: 'Jul 14', desc: 'Woolworths SA Brand Deal', type: 'income', amount: 2100 }
    ]
};

let intelligenceChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    setupNavigation();
    setupAuthModalTrigger();

    renderDashboardData();
    initIntelligenceChart();
    animateCounter();

    // Event Listeners
    const syncBtn = document.getElementById('btn-sync-trigger');
    if (syncBtn) syncBtn.addEventListener('click', syncData);
});

// View Switcher (Marketing Landing Page vs Logged-In App)
function switchView(mode) {
    const marketingView = document.getElementById('view-marketing');
    const appView = document.getElementById('view-app');

    if (mode === 'app') {
        marketingView.classList.add('hidden');
        appView.classList.remove('hidden');
        initIntelligenceChart();
        animateCounter();
    } else {
        appView.classList.add('hidden');
        marketingView.classList.remove('hidden');
    }
}

// Navigation Engine inside App
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

// 80px Balance Counter Animation (0 -> R24,650)
function animateCounter() {
    const target = state.balance;
    const element = document.getElementById('val-current-balance');
    if (!element) return;
    let current = 0;
    const step = Math.ceil(target / 35);

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.innerText = `R${current.toLocaleString()}`;
    }, 20);
}

// Render Dashboard Streams
function renderDashboardData() {
    const sourceContainer = document.getElementById('sources-stream-list');
    if (sourceContainer) {
        sourceContainer.innerHTML = '';
        state.sources.forEach(s => {
            sourceContainer.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: var(--border-card);">
                    <span style="font-size: 14px; font-weight: 500;">${s.name}</span>
                    <span style="font-size: 16px; font-weight: 700; color: var(--accent-emerald);">R${s.amount.toLocaleString()} (${s.percent})</span>
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

// Massive Hero Chart Canvas
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
            setTimeout(() => { btn.innerText = `Sync`; }, 2000);
        }, 1000);
    }
}

function setupAuthModalTrigger() {
    const authBtn = document.getElementById('btn-auth-modal');
    if (authBtn) authBtn.addEventListener('click', openAccountAuthModal);
}

function openAccountAuthModal() {
    openModal('Creator Financial OS Authentication', `
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
                Sign In To Workspace
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
    const name = document.getElementById('reg-name').value.trim() || 'Reamogetswe Molefe';
    const email = document.getElementById('reg-email').value.trim() || 'reamogetswe@creator.co.za';

    const userData = { id: 'usr_' + Date.now(), name, email, verified: true };
    localStorage.setItem('creator_cashflow_user', JSON.stringify(userData));

    const label = document.getElementById('nav-user-label');
    if (label) label.innerText = name.split(' ')[0];
    closeModal();
    switchView('app');
    alert(`🎉 Account Activated for ${name} (${email})!\n\nWelcome to your Financial Intelligence workspace.`);
}

async function executeLogin() {
    const email = document.getElementById('login-email').value.trim() || 'reamogetswe@creator.co.za';
    const name = email.split('@')[0] || 'Reamogetswe';

    const userData = { id: 'usr_logged_in', name, email, verified: true };
    localStorage.setItem('creator_cashflow_user', JSON.stringify(userData));

    const label = document.getElementById('nav-user-label');
    if (label) label.innerText = name;
    closeModal();
    switchView('app');
    alert(`Welcome back, ${name}! Session active.`);
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
