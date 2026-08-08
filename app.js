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
    currentStep: 1,
    creatorType: '',
    platforms: [],
    goal: '',
    connected: [],
    isManual: false
};

let intelligenceChartInstance = null;

// Global Platform Logo SVG Helper
function getPlatformLogoSvg(platform, sizeClass = 'w-6 h-6') {
    const p = (platform || '').toLowerCase();
    if (p.includes('youtube') || p.includes('adsense')) {
        return `<svg class="${sizeClass} shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
            <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF"/>
        </svg>`;
    } else if (p.includes('tiktok') || p.includes('rewards')) {
        return `<svg class="${sizeClass} shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.887 2.887 2.896 2.896 0 0 1-2.888-2.887 2.896 2.896 0 0 1 2.888-2.887c.36 0 .7.067 1.014.187V9.452a6.31 6.31 0 0 0-1.014-.082A6.332 6.332 0 0 0 3.155 15.7a6.332 6.332 0 0 0 6.332 6.332 6.332 6.332 0 0 0 6.332-6.332V9.014a8.212 8.212 0 0 0 4.887 1.583v-3.445a4.814 4.814 0 0 1-1.117-.466z" fill="#00F2FE"/>
            <path d="M18.8 6.2a4.8 4.8 0 0 1-3.4-3.8V2h-2.5v13.7a3.5 3.5 0 0 1-3.5 3.5 3.5 3.5 0 0 1-3.5-3.5 3.5 3.5 0 0 1 3.5-3.5c.3 0 .6.05.9.15V9.8a6.3 6.3 0 0 0-.9-.07 5.7 5.7 0 0 0-5.7 5.7 5.7 5.7 0 0 0 5.7 5.7 5.7 5.7 0 0 0 5.7-5.7V8.5a7.5 7.5 0 0 0 4.2 1.3V7.2a4.8 4.8 0 0 1-.5-1z" fill="#FE2C55"/>
            <path d="M18.2 5.8a4.8 4.8 0 0 1-3-3.4V2h-2.2v13.7a2.9 2.9 0 0 1-2.9 2.9 2.9 2.9 0 0 1-2.9-2.9 2.9 2.9 0 0 1 2.9-2.9c.3 0 .6.06.9.18V9.5a5.5 5.5 0 0 0-.9-.08 5.1 5.1 0 0 0-5.1 5.1 5.1 5.1 0 0 0 5.1 5.1 5.1 5.1 0 0 0 5.1-5.1V8.2a7 7 0 0 0 4.1 1.2V6.6a4.8 4.8 0 0 1-3.1-.8z" fill="#FFFFFF"/>
        </svg>`;
    } else if (p.includes('stream') || p.includes('twitch')) {
        return `<svg class="${sizeClass} shrink-0" viewBox="0 0 24 24" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M2.149 0L.537 4.119v16.478h5.373V24l3.761-3.403h3.762L23.463 10.537V0H2.15zm19.343 9.463l-3.224 3.224h-4.298l-3.224 3.223v-3.223H5.91V2.149h15.582v7.314zm-9.134-3.761h2.149v6.448H12.358V5.702zm5.373 0h2.149v6.448h-2.149V5.702z" fill="#A970FF"/>
        </svg>`;
    } else if (p.includes('instagram') || p.includes('sponsor')) {
        return `<svg class="${sizeClass} shrink-0" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#E1306C"/>
            <path d="M12 5.838c3.07 0 3.434.012 4.646.067 1.12.051 1.73.238 2.135.395.536.208.92.456 1.322.858.402.402.65.786.858 1.322.157.405.344 1.015.395 2.135.055 1.212.067 1.576.067 4.646s-.012 3.434-.067 4.646c-.051 1.12-.238 1.73-.395 2.135-.208.536-.456.92-.858 1.322-.402.402-.786.65-1.322.858-.405.157-1.015.344-2.135.395-1.212.055-1.576.067-4.646.067s-3.434-.012-4.646-.067c-1.12-.051-1.73-.238-2.135-.395a3.57 3.57 0 0 1-1.322-.858 3.57 3.57 0 0 1-.858-1.322c-.157-.405-.344-1.015-.395-2.135C2.26 15.434 2.248 15.07 2.248 12s.012-3.434.067-4.646c.051-1.12.238-1.73.395-2.135.208-.536.456-.92.858-1.322.402-.402.786-.65 1.322-.858.405-.157 1.015-.344 2.135-.395C8.566 5.85 8.93 5.838 12 5.838zm0-2.162c-3.123 0-3.514.013-4.74.069-1.222.056-2.056.25-2.786.533a5.733 5.733 0 0 0-2.072 1.35 5.733 5.733 0 0 0-1.35 2.072c-.283.73-.477 1.564-.533 2.786C.46 11.71.447 12.102.447 15.225s.013 3.514.069 4.74c.056 1.222.25 2.056.533 2.786a5.733 5.733 0 0 0 1.35 2.072 5.733 5.733 0 0 0 2.072 1.35c.73.283 1.564.477 2.786.533 1.226.056 1.617.069 4.74.069s3.514-.013 4.74-.069c1.222-.056 2.056-.25 2.786-.533a5.733 5.733 0 0 0 2.072-1.35 5.733 5.733 0 0 0 1.35-2.072c.283-.73.477-1.564.533-2.786.056-1.226.069-1.617.069-4.74s-.013-3.514-.069-4.74c-.056-1.222-.25-2.056-.533-2.786a5.733 5.733 0 0 0-1.35-2.072 5.733 5.733 0 0 0-2.072-1.35c-.73-.283-1.564-.477-2.786-.533-1.226-.056-1.617-.069-4.74-.069zM12 7.748a4.252 4.252 0 1 0 0 8.504 4.252 4.252 0 0 0 0-8.504zm0 7.004a2.752 2.752 0 1 1 0-5.504 2.752 2.752 0 0 1 0 5.504zm6.406-7.845a.993.993 0 1 0 0 1.986.993.993 0 0 0 0-1.986z" fill="#FFFFFF"/>
        </svg>`;
    } else if (p.includes('patreon') || p.includes('sub')) {
        return `<svg class="${sizeClass} shrink-0" viewBox="0 0 24 24" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M14.82 2.41c-4.46 0-8.08 3.62-8.08 8.08 0 4.42 3.58 8.02 8.01 8.08 4.46 0 8.08-3.62 8.08-8.08 0-4.46-3.62-8.08-8.01-8.08zm-13.63.15h3.63v18.91H1.19V2.56z" fill="#FF424D"/>
        </svg>`;
    }
    return `<span class="material-symbols-outlined text-accent-emerald text-xl">account_balance_wallet</span>`;
}
window.getPlatformLogoSvg = getPlatformLogoSvg;

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

    setupHeroMockupInteractions();
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
// ONBOARDING MODULES (6-Step Wizard)
// ==========================================================================

// Step validation engine
function validateStep(stepNum) {
    let isValid = true;
    let errorMsg = '';

    if (stepNum === 2) {
        if (!onboardingState.creatorType) {
            isValid = false;
            errorMsg = 'Please select your creator type to continue.';
        }
    } else if (stepNum === 3) {
        if (!onboardingState.platforms || onboardingState.platforms.length === 0) {
            isValid = false;
            errorMsg = 'Please select at least one revenue platform.';
        }
    } else if (stepNum === 4) {
        if (!onboardingState.goal) {
            isValid = false;
            errorMsg = 'Please select your primary goal.';
        }
    }

    const errorEl = document.getElementById('onboard-validation-error');
    const errorText = document.getElementById('onboard-error-text');

    if (!isValid) {
        if (errorEl && errorText) {
            errorText.innerText = errorMsg;
            errorEl.classList.remove('hidden');
        }
        // Shake step container for visual feedback
        const currentStepEl = document.getElementById(`onboard-step-${stepNum}`);
        if (currentStepEl) {
            currentStepEl.classList.add('animate-shake');
            setTimeout(() => currentStepEl.classList.remove('animate-shake'), 450);
        }
    } else {
        if (errorEl) {
            errorEl.classList.add('hidden');
        }
    }

    return isValid;
}

// Progress Bar & Navigation Header Synchronizer
function updateOnboardingProgress(stepNum) {
    onboardingState.currentStep = stepNum;

    // Update Step Counter Text
    const counterEl = document.getElementById('onboard-step-counter');
    if (counterEl) {
        counterEl.innerText = `Step ${stepNum} of 6`;
    }

    // Update Progress Bar Fill Width
    const progressFill = document.getElementById('onboard-progress-fill');
    if (progressFill) {
        const percentage = Math.min(100, Math.max(0, (stepNum / 6) * 100));
        progressFill.style.width = `${percentage}%`;
    }

    // Update Back Button Visibility
    const backBtn = document.getElementById('onboard-back-btn');
    if (backBtn) {
        if (stepNum > 1) {
            backBtn.classList.remove('invisible');
        } else {
            backBtn.classList.add('invisible');
        }
    }

    // Clear validation error message on step navigation
    const errorEl = document.getElementById('onboard-validation-error');
    if (errorEl) {
        errorEl.classList.add('hidden');
    }
}

function nextOnboardStep(targetStepNum) {
    const currentStepNum = onboardingState.currentStep || 1;

    // Validate current step before advancing forward
    if (targetStepNum > currentStepNum) {
        if (!validateStep(currentStepNum)) {
            return false;
        }
    }

    document.querySelectorAll('.onboarding-step').forEach(step => {
        step.classList.add('hidden');
    });

    const nextStep = document.getElementById(`onboard-step-${targetStepNum}`);
    if (nextStep) {
        nextStep.classList.remove('hidden');
    }

    updateOnboardingProgress(targetStepNum);

    if (targetStepNum === 5) {
        const connectList = document.getElementById('onboarding-connect-list');
        if (connectList) {
            connectList.innerHTML = '';
            if (onboardingState.platforms.length === 0) {
                onboardingState.platforms = ['YouTube', 'TikTok'];
            }
            onboardingState.platforms.forEach(platform => {
                const card = document.createElement('div');
                const isConn = onboardingState.connected.includes(platform);
                card.className = `connection-platform-card flex justify-between items-center p-md bg-surface/60 border border-white/[0.08] rounded-2xl cursor-pointer hover:bg-white/[0.04] transition-all ${isConn ? 'connected' : ''}`;
                card.onclick = (e) => simulatePlatformConnect(card, platform);
                
                const logoSvg = getPlatformLogoSvg(platform, 'w-6 h-6');
                card.innerHTML = `
                    <div class="flex items-center gap-sm">
                        <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            ${logoSvg}
                        </div>
                        <div>
                            <span class="font-body-md font-semibold text-white block">${platform}</span>
                            <span class="text-[11px] text-text-secondary">Official API Channel Integration</span>
                        </div>
                    </div>
                    <span class="connect-badge text-xs font-bold border border-white/[0.08] bg-background px-md py-xs rounded-xl" id="connect-${platform}">${isConn ? 'Connected' : 'Connect'}</span>
                `;
                connectList.appendChild(card);
            });
        }
    }

    if (targetStepNum === 6) {
        triggerMagicMoment();
    }

    return true;
}

function prevOnboardStep() {
    const currentStepNum = onboardingState.currentStep || 1;
    if (currentStepNum > 1) {
        nextOnboardStep(currentStepNum - 1);
    }
}

function selectCreatorType(element) {
    document.querySelectorAll('#onboard-step-2 .onboard-choice-card').forEach(opt => {
        opt.classList.remove('active');
        const icon = opt.querySelector('.check-indicator span');
        if (icon) icon.innerText = 'radio_button_unchecked';
    });
    element.classList.add('active');
    const icon = element.querySelector('.check-indicator span');
    if (icon) icon.innerText = 'check_circle';
    onboardingState.creatorType = element.getAttribute('data-value');

    const errorEl = document.getElementById('onboard-validation-error');
    if (errorEl) errorEl.classList.add('hidden');
}

function togglePlatformChoice(element) {
    element.classList.toggle('active');
    const val = element.getAttribute('data-value');
    const icon = element.querySelector('.check-indicator span');
    
    if (element.classList.contains('active')) {
        if (icon) icon.innerText = 'check_circle';
        if (!onboardingState.platforms.includes(val)) {
            onboardingState.platforms.push(val);
        }
    } else {
        if (icon) icon.innerText = 'radio_button_unchecked';
        onboardingState.platforms = onboardingState.platforms.filter(p => p !== val);
    }

    const errorEl = document.getElementById('onboard-validation-error');
    if (errorEl) errorEl.classList.add('hidden');
}

function selectGoal(element) {
    document.querySelectorAll('#onboard-step-4 .onboard-choice-card').forEach(opt => {
        opt.classList.remove('active');
        const icon = opt.querySelector('.check-indicator span');
        if (icon) icon.innerText = 'radio_button_unchecked';
    });
    element.classList.add('active');
    const icon = element.querySelector('.check-indicator span');
    if (icon) icon.innerText = 'check_circle';
    onboardingState.goal = element.getAttribute('data-value');

    const errorEl = document.getElementById('onboard-validation-error');
    if (errorEl) errorEl.classList.add('hidden');
}

function skipOnboardingConnection(e) {
    if (e) e.preventDefault();
    console.log('[ONBOARDING] Skipping connection and entering manual mode.');
    onboardingState.isManual = true;
    nextOnboardStep(6);
}

function fallbackToMockConnect(element, platform, badge) {
    element.classList.add('connected');
    if (badge) badge.innerText = 'Connected';
    if (!onboardingState.connected.includes(platform)) {
        onboardingState.connected.push(platform);
    }
}

function simulatePlatformConnect(element, platform) {
    const badge = document.getElementById(`connect-${platform}`);

    if (element.classList.contains('connected')) {
        element.classList.remove('connected');
        if (badge) badge.innerText = 'Connect';
        onboardingState.connected = onboardingState.connected.filter(p => p !== platform);
        return;
    }

    if (badge) badge.innerText = 'Linking...';

    // Defensive Guard: Check if PhylloConnect SDK script is loaded in window
    if (typeof PhylloConnect === 'undefined') {
        console.warn('[PHYLLO] PhylloConnect SDK script not detected in DOM. Falling back to mock connection.');
        setTimeout(() => {
            fallbackToMockConnect(element, platform, badge);
        }, 400);
        return;
    }

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
        if (!data.sdkToken || typeof PhylloConnect === 'undefined') {
            console.warn('[PHYLLO] Token or SDK missing. Executing mock connection fallback.');
            fallbackToMockConnect(element, platform, badge);
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

        try {
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
        } catch (err) {
            console.warn('[PHYLLO] Initialization exception caught. Executing mock fallback.', err);
            fallbackToMockConnect(element, platform, badge);
        }
    })
    .catch(err => {
        console.warn('[PHYLLO] Network request failed. Reverting to mock connect simulation.', err);
        fallbackToMockConnect(element, platform, badge);
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
    const platformsCount = onboardingState.connected.length || onboardingState.platforms.length || 3;
    const connectedBadge = document.getElementById('magic-onboard-platforms');
    if (connectedBadge) {
        connectedBadge.innerText = `${platformsCount} ${onboardingState.isManual ? '(Manual Mode)' : 'Connected'}`;
    }

    // Synchronously back up state to LocalStorage
    localStorage.setItem('creator_cashflow_onboarding', JSON.stringify(onboardingState));

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
                    goal: onboardingState.goal,
                    connected: onboardingState.connected,
                    isManual: onboardingState.isManual
                })
            });
        } catch (e) {
            console.warn('[ONBOARDING] Cloud sync warning:', e);
        }
    }
}

function executeLaunchSequence() {
    const wizardCard = document.querySelector('#view-onboarding .w-full.max-w-xl');
    const launchBtn = document.getElementById('btn-launch-command-center');
    
    if (launchBtn) {
        launchBtn.innerText = 'Launching Command Center...';
        launchBtn.disabled = true;
    }

    if (wizardCard) {
        wizardCard.classList.add('launching-pulse');
    }

    triggerMagicMoment();

    setTimeout(() => {
        if (wizardCard) wizardCard.classList.remove('launching-pulse');
        if (launchBtn) {
            launchBtn.innerText = 'Launch Command Center';
            launchBtn.disabled = false;
        }
        switchView('app');
    }, 1100);
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
                    <div class="flex justify-between text-sm">
                        <span class="text-white font-medium">${s.name}</span>
                        <span class="font-bold text-accent-emerald">R${s.amount.toLocaleString()} (${s.percent})</span>
                    </div>
                    <div class="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
                        <div class="h-full bg-accent-emerald" style="width: ${s.percent};"></div>
                    </div>
                </div>
            `;
        });
    }

    const activityStream = document.getElementById('activity-stream-os');
    if (activityStream) {
        activityStream.innerHTML = '';
        state.activities.slice(0, 4).forEach(a => {
            const amountClass = a.type === 'income' ? 'class="font-display font-bold text-accent-emerald text-sm"' : 'class="font-display font-bold text-white text-sm"';
            const prefix = a.type === 'income' ? '+' : '-';
            activityStream.innerHTML += `
                <div class="flex justify-between items-center p-md bg-surface rounded-2xl border border-white/[0.05]">
                    <div>
                        <div class="font-semibold text-white text-sm">${a.desc}</div>
                        <div class="text-xs text-text-secondary">${a.date} • Verified Sync</div>
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
                <div class="flex justify-between items-center py-md border-b border-white/[0.05]">
                    <div>
                        <div class="font-semibold text-white text-sm">${a.desc}</div>
                        <div class="text-xs text-text-secondary">${a.date}</div>
                    </div>
                    <div class="font-display font-bold text-accent-emerald text-sm">+R${a.amount.toLocaleString()}</div>
                </div>
            `;
        });
    }

    const expStream = document.getElementById('full-expense-stream');
    if (expStream) {
        expStream.innerHTML = '';
        state.activities.filter(a => a.type === 'expense').forEach(a => {
            expStream.innerHTML += `
                <div class="flex justify-between items-center py-md border-b border-white/[0.05]">
                    <div>
                        <div class="font-semibold text-white text-sm">${a.desc}</div>
                        <div class="text-xs text-text-secondary">${a.date}</div>
                    </div>
                    <div class="font-display font-bold text-white text-sm">-R${a.amount.toLocaleString()}</div>
                </div>
            `;
        });
    }
}

function initIntelligenceChart() {
    const canvas = document.getElementById('chart-revenue-intelligence');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.15)');
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
                duration: 1000
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0B0B0B',
                    titleColor: '#FFFFFF',
                    bodyColor: '#22C55E',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
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
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#8E8E93', font: { family: 'Inter', size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: {
                        color: '#8E8E93',
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
        <div class="flex gap-sm p-xs bg-surface border border-white/[0.08] rounded-2xl mb-lg">
            <button class="flex-1 font-label-lg py-sm rounded-xl bg-white text-black shadow-sm" id="auth-tab-signup" onclick="switchAuthTab('signup')">Create Account</button>
            <button class="flex-1 font-label-lg py-sm rounded-xl text-text-secondary hover:text-white" id="auth-tab-login" onclick="switchAuthTab('login')">Sign In</button>
        </div>

        <div id="auth-signup-fields" class="space-y-md">
            <div class="space-y-xs text-left">
                <label class="text-xs text-text-secondary font-bold uppercase">Full Creator Name</label>
                <input type="text" id="reg-name" class="w-full px-md py-sm rounded-xl border border-white/[0.08] bg-background text-white focus:border-accent-emerald focus:ring-0" placeholder="e.g. Reamogetswe Molefe">
            </div>
            <div class="space-y-xs text-left">
                <label class="text-xs text-text-secondary font-bold uppercase">Email Address</label>
                <input type="email" id="reg-email" class="w-full px-md py-sm rounded-xl border border-white/[0.08] bg-background text-white focus:border-accent-emerald focus:ring-0" placeholder="reamogetswe@creator.co.za">
            </div>
            <div class="space-y-xs text-left">
                <label class="text-xs text-text-secondary font-bold uppercase">Password</label>
                <input type="password" id="reg-pass" class="w-full px-md py-sm rounded-xl border border-white/[0.08] bg-background text-white focus:border-accent-emerald focus:ring-0" placeholder="••••••••••••">
            </div>
            <button class="w-full bg-white text-black font-bold font-label-lg py-md rounded-xl shadow-lg active:scale-95 transition-transform mt-lg" onclick="executeCreateAccount()">
                Create Creator Account
            </button>
        </div>

        <div id="auth-login-fields" class="space-y-md hidden">
            <div class="space-y-xs text-left">
                <label class="text-xs text-text-secondary font-bold uppercase">Email Address</label>
                <input type="email" id="login-email" class="w-full px-md py-sm rounded-xl border border-white/[0.08] bg-background text-white focus:border-accent-emerald focus:ring-0" placeholder="reamogetswe@creator.co.za">
            </div>
            <div class="space-y-xs text-left">
                <label class="text-xs text-text-secondary font-bold uppercase">Password</label>
                <input type="password" id="login-pass" class="w-full px-md py-sm rounded-xl border border-white/[0.08] bg-background text-white focus:border-accent-emerald focus:ring-0" placeholder="••••••••••••">
            </div>
            <button class="w-full bg-white text-black font-bold font-label-lg py-md rounded-xl shadow-lg active:scale-95 transition-transform mt-lg" onclick="executeLogin()">
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
        signupBtn.className = 'flex-1 font-label-lg py-sm rounded-xl bg-white text-black shadow-sm';
        loginBtn.className = 'flex-1 font-label-lg py-sm rounded-xl text-text-secondary hover:text-white';
    } else {
        signupFields.classList.add('hidden');
        loginFields.classList.remove('hidden');
        signupBtn.className = 'flex-1 font-label-lg py-sm rounded-xl text-text-secondary hover:text-white';
        loginBtn.className = 'flex-1 font-label-lg py-sm rounded-xl bg-white text-black shadow-sm';
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
                <label class="text-xs text-text-secondary font-bold uppercase">Description</label>
                <input type="text" id="act-desc" class="w-full px-md py-sm rounded-xl border border-white/[0.08] bg-background text-white focus:border-accent-emerald focus:ring-0" placeholder="e.g. YouTube AdSense Payout">
            </div>
            <div class="space-y-xs text-left">
                <label class="text-xs text-text-secondary font-bold uppercase">Type</label>
                <select id="act-type" class="w-full px-md py-sm rounded-xl border border-white/[0.08] bg-background text-white focus:border-accent-emerald focus:ring-0">
                    <option value="income">Income</option>
                    <option value="expense">Expense Write-off</option>
                </select>
            </div>
            <div class="space-y-xs text-left">
                <label class="text-xs text-text-secondary font-bold uppercase">Amount (ZAR)</label>
                <input type="number" id="act-amount" class="w-full px-md py-sm rounded-xl border border-white/[0.08] bg-background text-white focus:border-accent-emerald focus:ring-0" placeholder="2500">
            </div>
            <button class="w-full bg-white text-black font-bold font-label-lg py-md rounded-xl shadow-lg active:scale-95 transition-transform mt-lg" onclick="submitActivity()">
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
                name: `${key}`,
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

    // 3. AI Insights
    const insightsEl = document.getElementById('ai-insights-list');
    if (insightsEl) {
        insightsEl.innerHTML = '';
        const insights = [];

        if (highestPct > 0.70) {
            insights.push(`<li class="flex items-center gap-xs py-xs text-red-500 font-medium border-b border-white/[0.03]">⚠️ Risk Alert: Roster dependency is high (${Math.round(highestPct * 100)}% on one platform).</li>`);
        } else {
            insights.push(`<li class="flex items-center gap-xs py-xs text-accent-emerald font-medium border-b border-white/[0.03]">✓ Diversification is healthy across channels.</li>`);
        }

        if (expenseRatio > 0.25) {
            insights.push(`<li class="flex items-center gap-xs py-xs text-yellow-500 border-b border-white/[0.03]">⚠️ Overhead Alert: Expenses represent ${Math.round(expenseRatio * 100)}% of earnings.</li>`);
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
                insights.push(`<li class="py-xs border-b border-white/[0.03]">🔮 Software overheads dominate expenses. Audit inactive seat subscriptions to save up to 12%.</li>`);
            } else if (descLower.includes('lens') || descLower.includes('camera') || descLower.includes('gear') || descLower.includes('orms')) {
                insights.push(`<li class="py-xs border-b border-white/[0.03]">🔮 Gear depreciation detected. Ensure this equipment write-off is logged in tax deductions.</li>`);
            } else {
                insights.push(`<li class="py-xs border-b border-white/[0.03]">🔮 Optimize cash flow by tracking recurring operational write-offs.</li>`);
            }
        } else {
            insights.push(`<li class="py-xs border-b border-white/[0.03]">🔮 No business expenses logged. Add operational overheads to lower tax obligation.</li>`);
        }

        insights.forEach(ins => {
            insightsEl.innerHTML += ins;
        });
    }
}

// ==========================================================================
// FEATURE F3: ARC HERO MOCKUP CONTROLLER & 3D TILT
// ==========================================================================

let heroMockupState = {
    period: 'monthly', // 'monthly' | 'annual'
    activeTab: 'overview' // 'overview' | 'revenue' | 'tax'
};

const HERO_MOCKUP_DATA = {
    monthly: {
        balance: 'R24,650',
        periodLabel: 'Net Profit (July)',
        growth: '+18.4% vs last month',
        topPlatform: 'YouTube 74%',
        bars: { youtube: '74%', tiktok: '18%', brand: '8%' },
        peak: 'Peak R24,650',
        linePath: 'M 0,50 Q 50,45 100,30 T 200,20 T 300,5',
        areaPath: 'M 0,50 Q 50,45 100,30 T 200,20 T 300,5 L 300,60 L 0,60 Z'
    },
    annual: {
        balance: 'R295,800',
        periodLabel: 'Net Profit (YTD 2026)',
        growth: '+34.2% YoY Growth',
        topPlatform: 'YouTube 70%',
        bars: { youtube: '70%', tiktok: '20%', brand: '10%' },
        peak: 'Peak R295,800',
        linePath: 'M 0,55 Q 50,40 100,25 T 200,15 T 300,2',
        areaPath: 'M 0,55 Q 50,40 100,25 T 200,15 T 300,2 L 300,60 L 0,60 Z'
    }
};

function setupHeroMockupInteractions() {
    const wrapper = document.getElementById('arc-hero-wrapper');
    const frame = document.getElementById('arc-browser-frame');
    if (!wrapper || !frame) return;

    // 3D Perspective Tilt on Mousemove
    wrapper.addEventListener('mousemove', (e) => {
        if (window.innerWidth < 640 || window.matchMedia('(pointer: coarse)').matches) return;
        const rect = wrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -6; // max 6deg
        const rotateY = ((x - centerX) / centerX) * 6;  // max 6deg

        frame.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    });

    wrapper.addEventListener('mouseleave', () => {
        frame.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
}

function setHeroMockupPeriod(period) {
    heroMockupState.period = period;
    const btnMonthly = document.getElementById('toggle-btn-monthly');
    const btnAnnual = document.getElementById('toggle-btn-annual');
    const data = HERO_MOCKUP_DATA[period];

    if (!data) return;

    if (btnMonthly && btnAnnual) {
        if (period === 'monthly') {
            btnMonthly.className = 'px-sm py-1 rounded-lg font-semibold bg-accent-emerald text-black shadow transition-all';
            btnAnnual.className = 'px-sm py-1 rounded-lg font-semibold text-text-secondary hover:text-white transition-all';
        } else {
            btnAnnual.className = 'px-sm py-1 rounded-lg font-semibold bg-accent-emerald text-black shadow transition-all';
            btnMonthly.className = 'px-sm py-1 rounded-lg font-semibold text-text-secondary hover:text-white transition-all';
        }
    }

    // Dynamic Text Updates
    const elBalance = document.getElementById('hero-mockup-balance-display');
    const elLabel = document.getElementById('hero-mockup-period-label');
    const elGrowth = document.getElementById('hero-mockup-growth-tag');
    const elTopPlatform = document.getElementById('hero-mockup-top-platform');
    const elPeak = document.getElementById('hero-mockup-peak');

    if (elBalance) elBalance.innerText = data.balance;
    if (elLabel) elLabel.innerText = data.periodLabel;
    if (elGrowth) elGrowth.innerText = data.growth;
    if (elTopPlatform) elTopPlatform.innerText = data.topPlatform;
    if (elPeak) elPeak.innerText = data.peak;

    // Bar Progress Animations
    const barYT = document.getElementById('bar-youtube');
    const barTT = document.getElementById('bar-tiktok');
    const barBD = document.getElementById('bar-brand');
    if (barYT) barYT.style.width = data.bars.youtube;
    if (barTT) barTT.style.width = data.bars.tiktok;
    if (barBD) barBD.style.width = data.bars.brand;

    // SVG Line Animate
    const linePath = document.getElementById('hero-chart-line');
    const areaPath = document.getElementById('hero-chart-area');
    if (linePath) linePath.setAttribute('d', data.linePath);
    if (areaPath) areaPath.setAttribute('d', data.areaPath);
}

function switchHeroMockupTab(tabName) {
    heroMockupState.activeTab = tabName;
    document.querySelectorAll('.arc-tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const titleEl = document.getElementById('hero-mockup-tab-title');
    if (titleEl) {
        if (tabName === 'overview') titleEl.innerText = 'Creator Cash Flow Command Center';
        if (tabName === 'revenue') titleEl.innerText = 'Consolidated Revenue Streams';
        if (tabName === 'tax') titleEl.innerText = 'Tax Deduction & Savings Engine';
    }
}

function toggleArcSidebar() {
    const sidebar = document.getElementById('arc-sidebar-preview');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

function refreshHeroMockup() {
    setHeroMockupPeriod(heroMockupState.period);
}

// ==========================================================================
// FEATURE F11: GEMINI AI FINANCIAL ASSISTANT & FALLBACK ENGINE
// ==========================================================================

function handleGeminiSubmit(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('gemini-chat-input');
    if (!input) return;
    const userPrompt = input.value.trim();
    if (!userPrompt) return;

    input.value = '';
    appendGeminiUserBubble(userPrompt);
    queryGeminiAPI(userPrompt);
}

function sendPresetPrompt(promptText) {
    const input = document.getElementById('gemini-chat-input');
    if (input) {
        input.value = promptText;
        handleGeminiSubmit();
    }
}

function appendGeminiUserBubble(text) {
    const stream = document.getElementById('gemini-chat-stream');
    if (!stream) return;

    const userBubble = document.createElement('div');
    userBubble.className = 'flex items-start justify-end gap-sm';
    userBubble.innerHTML = `
        <div class="p-md bg-accent-emerald/10 border border-accent-emerald/30 rounded-2xl text-xs sm:text-sm text-white max-w-xl text-left">
            <p class="font-semibold text-accent-emerald text-[11px] uppercase mb-xs">You</p>
            <p>${escapeHTML(text)}</p>
        </div>
        <div class="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white flex-shrink-0 font-bold text-xs">
            ME
        </div>
    `;
    stream.appendChild(userBubble);
    stream.scrollTop = stream.scrollHeight;
}

function queryGeminiAPI(userPrompt) {
    const stream = document.getElementById('gemini-chat-stream');
    if (!stream) return;

    const typingBubble = document.createElement('div');
    typingBubble.id = 'gemini-typing-indicator';
    typingBubble.className = 'flex items-start gap-sm animate-pulse';
    typingBubble.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-accent-emerald/20 border border-accent-emerald/40 flex items-center justify-center text-accent-emerald flex-shrink-0">
            <span class="material-symbols-outlined text-sm">auto_awesome</span>
        </div>
        <div class="p-md bg-surface border border-white/[0.08] rounded-2xl text-xs text-text-secondary">
            Creator Intelligence is auditing your ledger...
        </div>
    `;
    stream.appendChild(typingBubble);
    stream.scrollTop = stream.scrollHeight;

    const systemContext = `You are CCF Creator Intelligence, an expert financial advisor for modern creators.
Current Creator P&L Summary:
- Net Profit: R${state.balance.toLocaleString()}
- Estimated Tax Obligation: R${Math.max(0, Math.round(state.balance * 0.15)).toLocaleString()} (15%)
- Top Revenue Channels: ${state.sources.map(s => `${s.name} (${s.percent})`).join(', ') || 'YouTube (74%), TikTok (18%)'}
Provide concise, highly actionable 2-3 sentence financial guidance answering the user's prompt directly.`;

    // 1. Attempt Serverless Proxy Endpoint Call (/api/gemini or Render API_BASE_URL/gemini)
    fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, systemContext: systemContext })
    })
    .then(res => res.json())
    .then(data => {
        if (data && data.text) {
            removeTypingIndicator();
            appendGeminiBotBubble(data.text, 'Live AI Model');
            return;
        }
        // Fallback to Render backend API_BASE_URL
        return fetch(`${API_BASE_URL}/gemini`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userPrompt, systemContext: systemContext })
        })
        .then(res => res.json())
        .then(data => {
            if (data && data.text) {
                removeTypingIndicator();
                appendGeminiBotBubble(data.text, 'Live AI Model');
                return;
            }
            handleLocalOrDirectGeminiQuery(userPrompt, systemContext);
        });
    })
    .catch(() => {
        handleLocalOrDirectGeminiQuery(userPrompt, systemContext);
    });
}

function handleLocalOrDirectGeminiQuery(userPrompt, systemContext) {
    const savedKey = localStorage.getItem('ccf_gemini_api_key');

    if (savedKey) {
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${savedKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: systemContext },
                        { text: userPrompt }
                    ]
                }]
            })
        })
        .then(res => res.json())
        .then(data => {
            removeTypingIndicator();
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                appendGeminiBotBubble(aiResponse, 'Live AI Model');
            } else {
                const fallbackMsg = generateLocalAIFinancialAdvice(userPrompt);
                appendGeminiBotBubble(fallbackMsg, 'Financial Intelligence');
            }
        })
        .catch(err => {
            removeTypingIndicator();
            const fallbackMsg = generateLocalAIFinancialAdvice(userPrompt);
            appendGeminiBotBubble(fallbackMsg, 'Financial Intelligence');
        });
    } else {
        setTimeout(() => {
            removeTypingIndicator();
            const fallbackMsg = generateLocalAIFinancialAdvice(userPrompt);
            appendGeminiBotBubble(fallbackMsg, 'Financial Intelligence');
        }, 600);
    }
}

function removeTypingIndicator() {
    const indicator = document.getElementById('gemini-typing-indicator');
    if (indicator) indicator.remove();
}

function appendGeminiBotBubble(text, providerLabel) {
    const stream = document.getElementById('gemini-chat-stream');
    if (!stream) return;

    const botBubble = document.createElement('div');
    botBubble.className = 'flex items-start gap-sm';
    botBubble.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-accent-emerald/20 border border-accent-emerald/40 flex items-center justify-center text-accent-emerald flex-shrink-0">
            <span class="material-symbols-outlined text-sm">auto_awesome</span>
        </div>
        <div class="p-md bg-surface border border-white/[0.08] rounded-2xl text-xs sm:text-sm text-text-primary space-y-xs max-w-xl">
            <div class="flex justify-between items-center text-xs mb-xs">
                <span class="font-bold text-accent-emerald">CCF Creator Intelligence</span>
                <span class="text-[10px] text-text-secondary bg-white/[0.04] px-xs py-[2px] rounded font-mono">${providerLabel || 'Active'}</span>
            </div>
            <div class="leading-relaxed space-y-xs">${formatMarkdownText(text)}</div>
        </div>
    `;
    stream.appendChild(botBubble);
    stream.scrollTop = stream.scrollHeight;
}

function generateLocalAIFinancialAdvice(prompt) {
    const p = prompt.toLowerCase();
    const estTax = Math.max(0, Math.round(state.balance * 0.15));

    if (p.includes('camera') || p.includes('upgrade') || p.includes('afford') || p.includes('equipment')) {
        if (state.balance >= 20000) {
            return `Yes, based on your current net profit of **R${state.balance.toLocaleString()}**, you can safely afford a R15,000 camera upgrade. You will maintain a healthy runway buffer of **R${(state.balance - 15000).toLocaleString()}**. Remember to log the purchase as an operational tax deduction!`;
        } else {
            return `With a current balance of **R${state.balance.toLocaleString()}**, spending R15,000 on new equipment would reduce your liquidity buffer below 30%. I recommend holding off until next month's payouts sync or opting for gear rental.`;
        }
    }

    if (p.includes('tax') || p.includes('reserve') || p.includes('hold')) {
        return `Based on your sole-proprietorship net profit (R${state.balance.toLocaleString()}), your recommended tax reserve is **R${estTax.toLocaleString()}** (15%). Setting this aside in a high-yield account protects your business from quarterly tax shocks.`;
    }

    if (p.includes('platform') || p.includes('focus') || p.includes('youtube') || p.includes('growth')) {
        const topSource = state.sources[0] ? `${state.sources[0].name} (${state.sources[0].percent})` : 'YouTube (74%)';
        return `Your highest yield channel is currently **${topSource}**. However, because your roster concentration is over 70%, your AI briefing recommends reinvesting 20% of your production time into diversifying your secondary platforms like TikTok or Patreon.`;
    }

    return `Based on your live ledger (Net Income: R${state.balance.toLocaleString()}, Tax Hold: R${estTax.toLocaleString()}), your business health is strong! Keep logging write-offs to optimize tax obligations.`;
}

function openGeminiKeyModal() {
    const currentKey = localStorage.getItem('ccf_gemini_api_key') || '';
    openModal('Configure Gemini AI Key', `
        <div class="space-y-md text-left">
            <p class="text-xs text-text-secondary">Enter your free Google Gemini API Key to enable live generative AI financial chat. If left empty, CCF will use the built-in edge AI engine.</p>
            <div class="space-y-xs">
                <label class="text-xs font-bold text-text-secondary uppercase">Gemini API Key</label>
                <input type="password" id="input-gemini-key" class="w-full px-md py-sm rounded-xl border border-white/[0.08] bg-background text-white text-xs focus:border-accent-emerald focus:ring-0" placeholder="AIzaSy..." value="${currentKey}">
            </div>
            <div class="flex gap-md pt-sm">
                <button class="flex-1 bg-white text-black font-bold py-sm rounded-xl text-xs active:scale-95 transition-transform" onclick="saveGeminiKey()">Save Key</button>
                <button class="flex-1 border border-white/[0.08] text-text-secondary py-sm rounded-xl text-xs hover:text-white" onclick="clearGeminiKey()">Reset to Free Fallback</button>
            </div>
        </div>
    `);
}

function saveGeminiKey() {
    const val = document.getElementById('input-gemini-key').value.trim();
    if (val) {
        localStorage.setItem('ccf_gemini_api_key', val);
        const status = document.getElementById('gemini-key-status');
        if (status) status.innerText = 'Gemini 1.5 Flash (Custom Key)';
        alert('✅ Gemini API Key saved! Live generative AI response mode active.');
    } else {
        clearGeminiKey();
    }
    closeModal();
}

function clearGeminiKey() {
    localStorage.removeItem('ccf_gemini_api_key');
    const status = document.getElementById('gemini-key-status');
    if (status) status.innerText = 'Gemini 1.5 Flash (Free Tier)';
    alert('Reset to built-in CCF Edge AI engine.');
    closeModal();
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function formatMarkdownText(str) {
    let formatted = escapeHTML(str);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}


