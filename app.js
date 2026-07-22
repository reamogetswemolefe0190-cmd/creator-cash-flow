/* ==========================================================================
   Creator Cash Flow - Executive Masterclass Application Engine
   ========================================================================== */

const API_BASE_URL = 'https://creator-cash-flow.onrender.com/api';

// State Management
const state = {
    user: { name: 'Reamogetswe', email: 'reamogetswe@creator.co.za' },
    balance: 24650,
    sources: [
        { name: 'YouTube Studio', amount: 13550, percent: '55%' },
        { name: 'TikTok Creator Rewards', amount: 6160, percent: '25%' },
        { name: 'Instagram Sponsorships', amount: 4940, percent: '20%' }
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
        { date: 'Jul 21', desc: 'YouTube AdSense Payout', type: 'income', amount: 13550 },
        { date: 'Jul 19', desc: 'Orms Direct (Sony Alpha)', type: 'expense', amount: 4200 },
        { date: 'Jul 18', desc: 'TikTok Creator Rewards ZAR', type: 'income', amount: 6160 },
        { date: 'Jul 15', desc: 'Canva Subscription', type: 'expense', amount: 149 },
        { date: 'Jul 14', desc: 'Woolworths SA Sponsorship', type: 'income', amount: 4940 }
    ]
};

let timelineChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    setupNavigation();
    setupAuthModalTrigger();

    renderDashboardData();
    initTimelineChart();
    animateCounter();

    // Event Listeners
    document.getElementById('btn-start-tracking').addEventListener('click', () => switchTab('sources'));
    document.getElementById('btn-sync-trigger').addEventListener('click', syncData);
    document.getElementById('btn-add-activity').addEventListener('click', openAddActivityModal);
});

// Navigation Engine
function setupNavigation() {
    const navItems = document.querySelectorAll('.codex-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
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

// 1. 80px Balance Counter Animation (0 -> R24,650)
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

// Render Data
function renderDashboardData() {
    // Render Income Sources
    const sourceContainer = document.getElementById('income-source-list');
    if (sourceContainer) {
        sourceContainer.innerHTML = '';
        state.sources.forEach(s => {
            sourceContainer.innerHTML += `
                <div class="source-item">
                    <span class="source-name">${s.name}</span>
                    <span class="source-val text-green">R${s.amount.toLocaleString()}</span>
                </div>
            `;
        });
    }

    // 8. Card-Based Activity Stream (Cards First, Tables Second)
    const activityStream = document.getElementById('activity-stream-cards');
    if (activityStream) {
        activityStream.innerHTML = '';
        state.activities.slice(0, 5).forEach(a => {
            const amountClass = a.type === 'income' ? 'text-green' : '';
            const prefix = a.type === 'income' ? '+' : '-';
            activityStream.innerHTML += `
                <div class="activity-card-item">
                    <div class="activity-info">
                        <span class="activity-title">${a.desc}</span>
                        <span class="activity-date">${a.date}</span>
                    </div>
                    <span class="activity-val ${amountClass}">${prefix}R${a.amount.toLocaleString()}</span>
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
                <div class="activity-card-item">
                    <div class="activity-info">
                        <span class="activity-title">${a.desc}</span>
                        <span class="activity-date">${a.date} • Verified Sync</span>
                    </div>
                    <span class="activity-val text-green">+R${a.amount.toLocaleString()}</span>
                </div>
            `;
        });
    }

    const expStream = document.getElementById('full-expense-stream');
    if (expStream) {
        expStream.innerHTML = '';
        state.activities.filter(a => a.type === 'expense').forEach(a => {
            expStream.innerHTML += `
                <div class="activity-card-item">
                    <div class="activity-info">
                        <span class="activity-title">${a.desc}</span>
                        <span class="activity-date">${a.date} • 100% Tax Write-Off</span>
                    </div>
                    <span class="activity-val">-R${a.amount.toLocaleString()}</span>
                </div>
            `;
        });
    }

    const sourcesBody = document.getElementById('full-sources-list');
    if (sourcesBody) {
        sourcesBody.innerHTML = '';
        state.sources.forEach(s => {
            sourcesBody.innerHTML += `
                <div class="source-item">
                    <div>
                        <div class="source-name">${s.name}</div>
                        <div style="font-size: 12px; color: var(--text-secondary); opacity: 0.6;">Connected API Sandbox</div>
                    </div>
                    <span class="source-val text-green">R${s.amount.toLocaleString()}</span>
                </div>
            `;
        });
    }
}

// 2 & 9. Signature Chart Upgrade & "WOW" Interaction
function initTimelineChart() {
    const ctx = document.getElementById('chart-revenue-timeline').getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.18)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');

    timelineChartInstance = new Chart(ctx, {
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
                pointBorderColor: '#09090B',
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
                // 9. "WOW" Tooltip Interaction (Date, Revenue, Expenses, Net Profit)
                tooltip: {
                    backgroundColor: '#111113',
                    titleColor: '#FAFAFA',
                    bodyColor: '#A1A1AA',
                    borderColor: '#27272A',
                    borderWidth: 1,
                    displayColors: false,
                    padding: 14,
                    titleFont: { family: 'Inter', size: 13, weight: '600' },
                    bodyFont: { family: 'Inter', size: 13 },
                    callbacks: {
                        title: function(items) {
                            return items[0].label;
                        },
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
                    ticks: { color: '#71717A', font: { family: 'Inter', size: 12 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: {
                        color: '#71717A',
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
    btn.innerHTML = `Syncing...`;

    setTimeout(() => {
        btn.innerHTML = `Synced`;
        setTimeout(() => {
            btn.innerHTML = `Sync`;
        }, 2000);
    }, 1000);
}

function openAddActivityModal() {
    openModal('Add Activity', `
        <div class="form-group">
            <label>Description</label>
            <input type="text" id="act-desc" class="form-input" placeholder="e.g. YouTube Studio Payout">
        </div>
        <div class="form-group">
            <label>Type</label>
            <select id="act-type" class="form-input">
                <option value="income">Income (+)</option>
                <option value="expense">Expense (-)</option>
            </select>
        </div>
        <div class="form-group">
            <label>Amount (ZAR)</label>
            <input type="number" id="act-amount" class="form-input" placeholder="2500">
        </div>
        <button class="btn btn-emerald" style="width: 100%; margin-top: 12px;" onclick="submitActivity()">Add Entry</button>
    `);
}

function submitActivity() {
    const desc = document.getElementById('act-desc').value || 'New Entry';
    const type = document.getElementById('act-type').value;
    const amount = parseFloat(document.getElementById('act-amount').value) || 2500;

    state.activities.unshift({
        date: 'Today',
        desc,
        type,
        amount
    });

    if (type === 'income') {
        state.balance += amount;
    } else {
        state.balance -= amount;
    }

    renderDashboardData();
    animateCounter();
    closeModal();
}

function setupAuthModalTrigger() {
    document.getElementById('btn-auth-modal').addEventListener('click', () => {
        openModal('Creator Account', `
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="user-name" class="form-input" value="${state.user.name}">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="user-email" class="form-input" value="${state.user.email}">
            </div>
            <button class="btn btn-emerald" style="width: 100%; margin-top: 12px;" onclick="submitAuth()">Sign In / Verify Session</button>
        `);
    });
}

function submitAuth() {
    const name = document.getElementById('user-name').value || 'Reamogetswe';
    const email = document.getElementById('user-email').value || 'reamogetswe@creator.co.za';

    state.user.name = name;
    state.user.email = email;

    document.getElementById('nav-user-label').innerText = name.split(' ')[0];
    closeModal();
    alert(`Signed in as ${name} (${email}). Session active.`);
}

function openModal(title, html) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-app').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-app').classList.remove('active');
}
