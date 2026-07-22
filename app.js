/* ==========================================================================
   Creator Cash Flow - SaaS Application Engine (South African ZAR R)
   ========================================================================== */

const API_BASE_URL = 'https://creator-cash-flow.onrender.com/api';

// State Management
const state = {
    user: { name: 'Reamogetswe', email: 'reamogetswe@creator.co.za' },
    transactions: [
        { id: 'tx1', date: '2026-07-21', source: 'YouTube', merchant: 'Google AdSense South Africa', type: 'income', category: 'Ad Revenue', amount: 25080.00, rpm: 'R48.50' },
        { id: 'tx2', date: '2026-07-19', source: 'Bank', merchant: 'Orms Direct (Sony Alpha Camera)', type: 'expense', category: 'Gear & Equipment', amount: 8900.00, taxStatus: '100% Write-Off' },
        { id: 'tx3', date: '2026-07-18', source: 'TikTok', merchant: 'TikTok Creator Rewards ZAR', type: 'income', category: 'Creator Fund', amount: 11400.00, rpm: 'R35.20' },
        { id: 'tx4', date: '2026-07-15', source: 'Bank', merchant: 'Adobe Creative Cloud SA', type: 'expense', category: 'Software', amount: 950.00, taxStatus: '100% Write-Off' },
        { id: 'tx5', date: '2026-07-14', source: 'Instagram', merchant: 'Brand Sponsor: Woolworths SA', type: 'income', category: 'Sponsorship', amount: 6840.00, rpm: 'R120.00' },
        { id: 'tx6', date: '2026-07-10', source: 'Bank', merchant: 'Video Editor Contractor (Fiverr)', type: 'expense', category: 'Contractor Pay', amount: 2450.00, taxStatus: '1099 Write-Off' },
        { id: 'tx7', date: '2026-07-05', source: 'Other', merchant: 'Substack Paid Memberships', type: 'income', category: 'Subscriptions', amount: 2280.00, rpm: 'N/A' }
    ]
};

// Chart Instances
let trendChartInstance = null;
let donutChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    setupNavigation();
    setupMobileMenu();
    setupAuthTrigger();

    renderDashboardData();
    initCharts();

    // Hero Actions
    document.getElementById('btn-hero-get-started').addEventListener('click', () => switchTab('revenue'));
    document.getElementById('btn-hero-demo').addEventListener('click', loadDemoData);
    document.getElementById('btn-hero-feedback').addEventListener('click', openFeedbackModal);
});

// Sidebar & Tab Switching
function setupNavigation() {
    const links = document.querySelectorAll('.saas-nav .nav-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            switchTab(tabId);
            closeMobileMenu();
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.saas-nav .nav-link').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));

    const selectedNav = document.querySelector(`.saas-nav .nav-link[data-tab="${tabId}"]`);
    const selectedPane = document.getElementById(`tab-${tabId}`);

    if (selectedNav && selectedPane) {
        selectedNav.classList.add('active');
        selectedPane.classList.add('active');
    }
}

// Mobile Menu Toggle
function setupMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('app-sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

function closeMobileMenu() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('open');
}

// Render Dashboard Data & Rands (ZAR)
function renderDashboardData() {
    const totalIncome = state.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = state.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpenses;

    document.getElementById('val-total-earnings').innerText = formatZAR(totalIncome);
    document.getElementById('val-total-expenses').innerText = formatZAR(totalExpenses);
    document.getElementById('val-net-profit').innerText = formatZAR(netProfit);

    renderRevenueTable();
    renderExpenseTable();
    renderBankGrid();
}

function renderRevenueTable() {
    const tbody = document.getElementById('revenue-rows');
    if (!tbody) return;

    const revenues = state.transactions.filter(t => t.type === 'income');
    tbody.innerHTML = '';

    revenues.forEach(r => {
        tbody.innerHTML += `
            <tr>
                <td>${r.date}</td>
                <td><span class="badge badge-emerald">${r.source}</span></td>
                <td><strong>${r.merchant}</strong></td>
                <td>${r.rpm || 'R48.50'}</td>
                <td class="text-right text-emerald"><strong>+${formatZAR(r.amount)}</strong></td>
            </tr>
        `;
    });
}

function renderExpenseTable() {
    const tbody = document.getElementById('expense-rows');
    if (!tbody) return;

    const expenses = state.transactions.filter(t => t.type === 'expense');
    tbody.innerHTML = '';

    expenses.forEach(e => {
        tbody.innerHTML += `
            <tr>
                <td>${e.date}</td>
                <td><strong>${e.merchant}</strong></td>
                <td>${e.category}</td>
                <td><span class="badge badge-blue">${e.taxStatus}</span></td>
                <td class="text-right text-red"><strong>-${formatZAR(e.amount)}</strong></td>
            </tr>
        `;
    });
}

function renderBankGrid() {
    const grid = document.getElementById('bank-cards-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="card" style="margin-bottom: 0;">
            <div class="card-header">
                <h3>Discovery Bank Business Account (...4920)</h3>
                <span class="badge badge-emerald">Connected</span>
            </div>
            <h2 class="text-emerald" style="font-size: 2rem; margin: 10px 0;">R42,850.00</h2>
            <p style="color: var(--text-secondary); font-size: 0.82rem;">Plaid Sandbox Direct Feed</p>
        </div>
        <div class="card" style="margin-bottom: 0;">
            <div class="card-header">
                <h3>FNB Business Credit Card (...1024)</h3>
                <span class="badge badge-emerald">Connected</span>
            </div>
            <h2 class="text-red" style="font-size: 2rem; margin: 10px 0;">-R4,320.00</h2>
            <p style="color: var(--text-secondary); font-size: 0.82rem;">Plaid Sandbox Direct Feed</p>
        </div>
    `;
}

// 3. Revenue Source Charts (Donut & Monthly Trend)
function initCharts() {
    const ctxTrend = document.getElementById('chart-monthly-trend').getContext('2d');
    const ctxDonut = document.getElementById('chart-revenue-donut').getContext('2d');

    trendChartInstance = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [
                {
                    label: 'Total Earnings (ZAR)',
                    data: [28000, 32000, 35400, 39000, 42000, 45600],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Total Expenses (ZAR)',
                    data: [8000, 9500, 11000, 10500, 14000, 12300],
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94A3B8' } } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' } }
            }
        }
    });

    donutChartInstance = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
            labels: ['YouTube', 'TikTok', 'Instagram', 'Other'],
            datasets: [{
                data: [55, 25, 15, 5],
                backgroundColor: ['#FF0000', '#00F2FE', '#E1306C', '#3B82F6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

// 5. Quick Actions Functions
function openAddRevenueModal() {
    openModal('Add Creator Revenue Entry', `
        <div style="margin-bottom: 14px;">
            <label style="display:block; font-size: 0.8rem; margin-bottom: 4px;">Platform Source</label>
            <select id="rev-source" class="franc-select" style="width: 100%;">
                <option value="YouTube">YouTube Studio</option>
                <option value="TikTok">TikTok Creator Rewards</option>
                <option value="Instagram">Instagram Brand Sponsorship</option>
                <option value="Substack">Substack / Patreon</option>
            </select>
        </div>
        <div style="margin-bottom: 14px;">
            <label style="display:block; font-size: 0.8rem; margin-bottom: 4px;">Merchant / Sponsor Name</label>
            <input type="text" id="rev-merchant" class="form-input" placeholder="e.g. Google AdSense SA">
        </div>
        <div style="margin-bottom: 14px;">
            <label style="display:block; font-size: 0.8rem; margin-bottom: 4px;">Amount in Rands (ZAR)</label>
            <input type="number" id="rev-amount" class="form-input" placeholder="4500.00">
        </div>
        <button class="btn btn-emerald w-full" onclick="submitAddRevenue()">Add Revenue Entry</button>
    `);
}

function submitAddRevenue() {
    const source = document.getElementById('rev-source').value;
    const merchant = document.getElementById('rev-merchant').value || `${source} Revenue`;
    const amount = parseFloat(document.getElementById('rev-amount').value) || 3500.00;

    state.transactions.unshift({
        id: 'tx_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        source,
        merchant,
        type: 'income',
        category: 'Creator Earnings',
        amount
    });

    renderDashboardData();
    closeAppModal();
    alert(`🎉 R${amount} Revenue Entry Added Successfully!`);
}

function openAddExpenseModal() {
    openModal('Add Business Expense Write-Off', `
        <div style="margin-bottom: 14px;">
            <label style="display:block; font-size: 0.8rem; margin-bottom: 4px;">Merchant / Vendor</label>
            <input type="text" id="exp-merchant" class="form-input" placeholder="e.g. Orms Direct / Adobe">
        </div>
        <div style="margin-bottom: 14px;">
            <label style="display:block; font-size: 0.8rem; margin-bottom: 4px;">Expense Category</label>
            <select id="exp-category" class="franc-select" style="width: 100%;">
                <option value="Gear & Equipment">Gear & Equipment</option>
                <option value="Software Subscriptions">Software Subscriptions</option>
                <option value="Contractor Pay">Video Editor Contractor</option>
                <option value="Studio Rent">Studio Rent & Utilities</option>
            </select>
        </div>
        <div style="margin-bottom: 14px;">
            <label style="display:block; font-size: 0.8rem; margin-bottom: 4px;">Amount in Rands (ZAR)</label>
            <input type="number" id="exp-amount" class="form-input" placeholder="1250.00">
        </div>
        <button class="btn btn-red w-full" onclick="submitAddExpense()">Add Expense Write-Off</button>
    `);
}

function submitAddExpense() {
    const merchant = document.getElementById('exp-merchant').value || 'Business Purchase';
    const category = document.getElementById('exp-category').value;
    const amount = parseFloat(document.getElementById('exp-amount').value) || 1200.00;

    state.transactions.unshift({
        id: 'tx_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        source: 'Bank',
        merchant,
        type: 'expense',
        category,
        taxStatus: '100% Tax Write-Off',
        amount
    });

    renderDashboardData();
    closeAppModal();
    alert(`📉 R${amount} Business Expense Tax Write-Off Added!`);
}

function generatePDFReport() {
    alert("📄 Generating Creator Cash Flow Financial Summary PDF for CPA Review...");
}

function loadDemoData() {
    renderDashboardData();
    alert("🚀 Demo Financial Engine Loaded! Explore Revenue, Expenses, & Forecasts.");
}

// Modal Helpers
function openModal(title, htmlContent) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = htmlContent;
    document.getElementById('modal-app').classList.add('active');
    lucide.createIcons();
}

function closeAppModal() {
    document.getElementById('modal-app').classList.remove('active');
}

function setupAuthTrigger() {
    document.getElementById('btn-auth-trigger').addEventListener('click', () => {
        openModal('Creator Security Login', `
            <div style="margin-bottom: 14px;">
                <label style="display:block; font-size: 0.8rem; margin-bottom: 4px;">Creator Name</label>
                <input type="text" id="saas-auth-name" class="form-input" placeholder="Reamogetswe">
            </div>
            <div style="margin-bottom: 14px;">
                <label style="display:block; font-size: 0.8rem; margin-bottom: 4px;">Email Address</label>
                <input type="email" id="saas-auth-email" class="form-input" placeholder="reamogetswe@creator.co.za">
            </div>
            <button class="btn btn-emerald w-full" onclick="submitAuth()">Sign In / Register</button>
        `);
    });
}

function submitAuth() {
    const name = document.getElementById('saas-auth-name').value || 'Reamogetswe';
    const email = document.getElementById('saas-auth-email').value || 'reamogetswe@creator.co.za';

    document.getElementById('greeting-name').innerText = name;
    document.getElementById('user-display-name').innerText = name;
    document.getElementById('auth-btn-label').innerText = `${name.split(' ')[0]} (Verified)`;

    closeAppModal();
    alert(`🎉 Welcome back, ${name}! Your Creator Cash Flow account is active.`);
}

function openFeedbackModal() {
    openModal('Beta Feedback', `
        <div style="margin-bottom: 14px;">
            <label style="display:block; font-size: 0.8rem; margin-bottom: 4px;">Your Feedback</label>
            <textarea id="feedback-text" class="form-input" rows="4" placeholder="How do you like the new dashboard hierarchy, ZAR currency, and forecast feature?"></textarea>
        </div>
        <button class="btn btn-emerald w-full" onclick="closeAppModal(); alert('Thank you for shaping Creator Cash Flow!');">Submit Feedback</button>
    `);
}

function formatZAR(amount) {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount).replace('ZAR', 'R');
}
