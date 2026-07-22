/* ==========================================================================
   Creator Cash Flow - Linear / Vercel / Codex Application Engine
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
    transactions: [
        { date: 'Jul 21', desc: 'Google AdSense Payout', type: 'income', amount: 13550 },
        { date: 'Jul 19', desc: 'Orms Direct (Sony Alpha Camera)', type: 'expense', amount: 4200 },
        { date: 'Jul 18', desc: 'TikTok Creator Rewards ZAR', type: 'income', amount: 6160 },
        { date: 'Jul 15', desc: 'Adobe Creative Cloud', type: 'expense', amount: 950 },
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

// 6. Motion: Number Counter Animation (0 -> R24,650)
function animateCounter() {
    const target = state.balance;
    const element = document.getElementById('val-current-balance');
    let current = 0;
    const step = Math.ceil(target / 40);

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

    // Render Recent Activity Table
    const tableBody = document.getElementById('activity-table-rows');
    if (tableBody) {
        tableBody.innerHTML = '';
        state.transactions.slice(0, 5).forEach(t => {
            const amountClass = t.type === 'income' ? 'text-green' : '';
            const prefix = t.type === 'income' ? '+' : '-';
            tableBody.innerHTML += `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.desc}</td>
                    <td class="text-right ${amountClass}">${prefix}R${t.amount.toLocaleString()}</td>
                </tr>
            `;
        });
    }

    // Full Tables Render
    renderFullTables();
}

function renderFullTables() {
    const revBody = document.getElementById('full-revenue-rows');
    if (revBody) {
        revBody.innerHTML = '';
        state.transactions.filter(t => t.type === 'income').forEach(t => {
            revBody.innerHTML += `
                <tr>
                    <td>${t.date}</td>
                    <td>YouTube / TikTok</td>
                    <td>${t.desc}</td>
                    <td class="text-right text-green">+R${t.amount.toLocaleString()}</td>
                </tr>
            `;
        });
    }

    const expBody = document.getElementById('full-expense-rows');
    if (expBody) {
        expBody.innerHTML = '';
        state.transactions.filter(t => t.type === 'expense').forEach(t => {
            expBody.innerHTML += `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.desc}</td>
                    <td>Equipment / Software</td>
                    <td class="text-right">-R${t.amount.toLocaleString()}</td>
                </tr>
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
                        <div style="font-size: 12px; color: var(--text-secondary);">Connected API Sandbox</div>
                    </div>
                    <span class="source-val text-green">R${s.amount.toLocaleString()}</span>
                </div>
            `;
        });
    }
}

// 9. Signature Element: Full-Width Revenue Timeline Chart
function initTimelineChart() {
    const ctx = document.getElementById('chart-revenue-timeline').getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.15)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');

    timelineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jul 1', 'Jul 5', 'Jul 10', 'Jul 14', 'Jul 18', 'Jul 21'],
            datasets: [{
                label: 'Revenue Timeline (ZAR)',
                data: [4200, 8900, 12400, 16800, 20900, 24650],
                borderColor: '#22C55E',
                borderWidth: 2,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#22C55E'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#18181B',
                    titleColor: '#FAFAFA',
                    bodyColor: '#22C55E',
                    borderColor: '#27272A',
                    borderWidth: 1,
                    displayColors: false,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return `Revenue: R${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(39, 39, 42, 0.5)' },
                    ticks: { color: '#A1A1AA', font: { family: 'Inter', size: 12 } }
                },
                y: {
                    grid: { color: 'rgba(39, 39, 42, 0.5)' },
                    ticks: {
                        color: '#A1A1AA',
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
    btn.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Syncing...`;
    lucide.createIcons();

    setTimeout(() => {
        btn.innerHTML = `<i data-lucide="check"></i> Synced`;
        lucide.createIcons();
        setTimeout(() => {
            btn.innerHTML = `<i data-lucide="refresh-cw"></i> Sync`;
            lucide.createIcons();
        }, 2000);
    }, 1000);
}

function openAddActivityModal() {
    openModal('Add Activity', `
        <div class="form-group">
            <label>Description</label>
            <input type="text" id="act-desc" class="form-input" placeholder="e.g. YouTube AdSense Payout">
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
    const desc = document.getElementById('act-desc').value || 'New Transaction';
    const type = document.getElementById('act-type').value;
    const amount = parseFloat(document.getElementById('act-amount').value) || 2500;

    state.transactions.unshift({
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
    lucide.createIcons();
}

function closeModal() {
    document.getElementById('modal-app').classList.remove('active');
}
