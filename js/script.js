
// --- GLOBAL STATE ---
let selectedPath = { l1: null, l2: null, l3: null, group: 'A' };
let currentPlatform = 'shopee';
let adsMode = 'unit';
let inputMode = 'single'; // 'single' or 'bulk'
let customCosts = [];
let profitChart = null;
let scenarioA = null;
let adsTargetType = 'percent';
let currentLang = 'id';
let calculateTimeout = null; // For debounce
let products = []; // Bulk products array
let editingProductIndex = null; // For category modal
let currentModule = 'profit'; // Current active module
let priceFinderTarget = 'margin'; // 'margin' or 'profit'
let productDB = JSON.parse(localStorage.getItem('productDB') || '[]'); // Product database for Ads Analyzer
window.productDB = productDB; // Expose globally for modules

// ==================== HELPER FUNCTIONS ====================

// Get platform icon HTML based on platform name
function getPlatformIcon(platform) {
    const platformLower = (platform || 'shopee').toLowerCase();
    const icons = {
        'shopee': '<i class="fab fa-shopify text-orange-500"></i>',
        'tokopedia': '<i class="fas fa-store text-green-500"></i>',
        'lazada': '<i class="fas fa-shopping-bag text-blue-500"></i>',
        'tiktok': '<i class="fab fa-tiktok text-slate-700 dark:text-slate-300"></i>',
        'bukalapak': '<i class="fas fa-shopping-cart text-red-500"></i>'
    };
    return icons[platformLower] || '<i class="fas fa-store text-slate-500"></i>';
}

/**
 * Get category data based on current platform
 * Returns platform-specific category data or default (Shopee) categories
 * @returns {Array} Category data array for the current platform
 */
function getCategoryData() {
    switch (currentPlatform) {
        case 'tokopedia':
            return typeof tokopediaCategoryData !== 'undefined' ? tokopediaCategoryData : categoryData;
        case 'tiktok':
            return typeof tiktokCategoryData !== 'undefined' ? tiktokCategoryData : categoryData;
        default:
            return categoryData;
    }
}

/**
 * Get fee rates based on current platform
 * @param {string} sellerType - 'regular', 'power', 'mall', 'star', 'nonstar'
 * @returns {Object} Fee rates object
 */
function getPlatformRates(sellerType) {
    switch (currentPlatform) {
        case 'tokopedia':
            return typeof tokopediaRates !== 'undefined' ? tokopediaRates[sellerType] || tokopediaRates.regular : shopeeRates.nonstar;
        case 'tiktok':
            return typeof tiktokRates !== 'undefined' ? tiktokRates[sellerType] || tiktokRates.regular : shopeeRates.nonstar;
        default:
            return shopeeRates[sellerType] || shopeeRates.nonstar;
    }
}

/**
 * Get dynamic commission rate for a category cluster
 * @param {string} cluster - Category cluster (elektronik, fashion, fmcg, lifestyle, others)
 * @returns {number} Dynamic commission rate percentage
 */
function getDynamicCommissionRate(cluster) {
    let rates;
    switch (currentPlatform) {
        case 'tokopedia':
            rates = typeof tokopediaDynamicRates !== 'undefined' ? tokopediaDynamicRates : null;
            break;
        case 'tiktok':
            rates = typeof tiktokDynamicRates !== 'undefined' ? tiktokDynamicRates : null;
            break;
        default:
            return 0; // Shopee doesn't have dynamic commission
    }
    if (!rates) return 0;
    return rates[cluster] || rates.others || 0;
}

// ==================== MODULE SWITCHING ====================

function switchModule(moduleName) {
    currentModule = moduleName;

    // Update desktop tabs
    document.querySelectorAll('.module-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.module === moduleName);
    });

    // Update mobile nav
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.module === moduleName);
    });

    // Switch panels
    document.querySelectorAll('.module-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `module-${moduleName}`);
    });

    // Show mobile profit bar only in Profit Calculator module
    const mobileProfit = document.getElementById('mobileProfit');
    if (mobileProfit) {
        mobileProfit.classList.toggle('show', moduleName === 'profit');
    }

    // Show desktop sticky save button only in Profit Calculator module
    const desktopSaveBtn = document.getElementById('desktopSaveBtn');
    if (desktopSaveBtn) {
        desktopSaveBtn.style.display = moduleName === 'profit' ? 'flex' : 'none';
    }

    // Sync fees to Price Finder when switching to it
    if (moduleName === 'price') {
        syncToPf();
    }

    // Initialize Bundling Calculator when switching to it
    if (moduleName === 'bundling' && typeof BundlingCalculator !== 'undefined') {
        // Initialize only once (check if already has products)
        if (BundlingCalculator.getProductCount() === 0) {
            BundlingCalculator.init();
        }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== MODULE 2: PRICE FINDER ====================

// Current profit type state: 'rupiah' or 'percent'
let pfProfitType = 'rupiah';

// Set Target Profit type (Rupiah or Percent) via toggle buttons
function setPfProfitType(type) {
    pfProfitType = type;
    const btnRp = document.getElementById('pf_profit_type_rp');
    const btnPct = document.getElementById('pf_profit_type_pct');
    const profitPrefix = document.getElementById('pf_profit_prefix');
    const profitInput = document.getElementById('pf_target_profit');

    const activeClass = 'flex-1 py-1.5 text-[10px] font-bold rounded-md bg-white dark:bg-slate-600 text-slate-700 dark:text-white shadow-sm transition-all';
    const inactiveClass = 'flex-1 py-1.5 text-[10px] font-bold rounded-md text-slate-500 dark:text-slate-400 transition-all hover:bg-white/50 dark:hover:bg-slate-600/50';

    // Clear input when switching
    if (profitInput) profitInput.value = '';

    if (type === 'rupiah') {
        if (btnRp) btnRp.className = activeClass;
        if (btnPct) btnPct.className = inactiveClass;
        if (profitPrefix) profitPrefix.textContent = 'Rp';
        if (profitInput) {
            profitInput.placeholder = '10.000';
            profitInput.oninput = () => { formatInputNumber(profitInput); calculateOptimalPrice(); };
        }
    } else {
        if (btnPct) btnPct.className = activeClass;
        if (btnRp) btnRp.className = inactiveClass;
        if (profitPrefix) profitPrefix.textContent = '%';
        if (profitInput) {
            profitInput.placeholder = '20';
            profitInput.oninput = () => calculateOptimalPrice();
        }
    }
    calculateOptimalPrice();
}

// Toggle between Margin and Profit target modes
function setPriceFinderTarget(target) {
    priceFinderTarget = target;
    const btnMargin = document.getElementById('pf_btn_margin');
    const btnProfit = document.getElementById('pf_btn_profit');
    const marginSection = document.getElementById('pf_margin_section');
    const profitSection = document.getElementById('pf_profit_section');

    if (target === 'margin') {
        btnMargin?.classList.add('bg-orange-500', 'text-white');
        btnMargin?.classList.remove('bg-slate-100', 'dark:bg-slate-600', 'text-slate-600', 'dark:text-slate-300');
        btnProfit?.classList.remove('bg-orange-500', 'text-white');
        btnProfit?.classList.add('bg-slate-100', 'dark:bg-slate-600', 'text-slate-600', 'dark:text-slate-300');
        marginSection?.classList.remove('hidden');
        profitSection?.classList.add('hidden');
    } else {
        btnProfit?.classList.add('bg-orange-500', 'text-white');
        btnProfit?.classList.remove('bg-slate-100', 'dark:bg-slate-600', 'text-slate-600', 'dark:text-slate-300');
        btnMargin?.classList.remove('bg-orange-500', 'text-white');
        btnMargin?.classList.add('bg-slate-100', 'dark:bg-slate-600', 'text-slate-600', 'dark:text-slate-300');
        profitSection?.classList.remove('hidden');
        marginSection?.classList.add('hidden');
    }
    calculateOptimalPrice();
}


// Price Finder config mode: 'simple' or 'advanced'
let pfConfigMode = 'simple';
// Helper to format input with thousand separators
function formatInputNumber(input) {
    // Remove non-digits
    let value = input.value.replace(/\D/g, '');
    // Format with dots
    if (value) {
        value = new Intl.NumberFormat('id-ID').format(value);
    }
    input.value = value;
}

// Helper to parse formatted number string to float
function parseFormattedNumber(value) {
    if (!value) return 0;
    // Remove dots and convert to float
    return parseFloat(value.toString().replace(/\./g, '')) || 0;
}


function setPfConfigMode(mode) {
    pfConfigMode = mode;
    const btnSimple = document.getElementById('pf_mode_simple');
    const btnAdvanced = document.getElementById('pf_mode_advanced');
    const configSimple = document.getElementById('pf_simple_config');
    const configAdvanced = document.getElementById('pf_advanced_config');
    const componentsSection = document.getElementById('pf_komponen_biaya_section');
    if (mode === 'simple') {
        btnSimple.classList.add('bg-white', 'dark:bg-slate-600', 'text-slate-700', 'dark:text-white', 'shadow-sm');
        btnSimple.classList.remove('text-slate-500', 'dark:text-slate-400');
        btnAdvanced.classList.remove('bg-white', 'dark:bg-slate-600', 'text-slate-700', 'dark:text-white', 'shadow-sm');
        btnAdvanced.classList.add('text-slate-500', 'dark:text-slate-400');
        configSimple.classList.remove('hidden');
        configAdvanced.classList.add('hidden');
        componentsSection?.classList.remove('hidden');
    } else {
        btnAdvanced.classList.add('bg-white', 'dark:bg-slate-600', 'text-slate-700', 'dark:text-white', 'shadow-sm');
        btnAdvanced.classList.remove('text-slate-500', 'dark:text-slate-400');
        btnSimple.classList.remove('bg-white', 'dark:bg-slate-600', 'text-slate-700', 'dark:text-white', 'shadow-sm');
        btnSimple.classList.add('text-slate-500', 'dark:text-slate-400');
        configAdvanced.classList.remove('hidden');
        configSimple.classList.add('hidden');
        componentsSection?.classList.add('hidden');
        // Sync from global when entering advanced
        syncToPf();
    }
    calculateOptimalPrice();
}

// Sync Price Finder fees TO global Profit Calculator inputs
function syncPfFees() {
    const pfAdmin = document.getElementById('pf_adminFeePercent')?.value || 0;
    const pfService = document.getElementById('pf_serviceFeePercent')?.value || 0;
    const pfAffiliate = document.getElementById('pf_affiliatePercent')?.value || 0;

    // Update global inputs
    document.getElementById('adminFeePercent').value = pfAdmin;
    document.getElementById('serviceFeePercent').value = pfService;
    document.getElementById('affiliatePercent').value = pfAffiliate;

    // Trigger main calculator update
    calculate();
}

// Sync global Profit Calculator fees TO Price Finder inputs
function syncToPf() {
    const admin = document.getElementById('adminFeePercent')?.value || 0;
    const service = document.getElementById('serviceFeePercent')?.value || 0;
    const affiliate = document.getElementById('affiliatePercent')?.value || 0;

    document.getElementById('pf_adminFeePercent').value = admin;
    document.getElementById('pf_serviceFeePercent').value = service;
    document.getElementById('pf_affiliatePercent').value = affiliate;

    // Update toggles to match main calculator
    document.getElementById('pf_toggleFreeShip').checked = document.getElementById('toggleFreeShip')?.checked || false;
    document.getElementById('pf_toggleCashback').checked = document.getElementById('toggleCashback')?.checked || false;

    calculateOptimalPrice();
}

// Update Price Finder service fee from toggle switches
function updatePfServiceFee() {
    const freeShip = document.getElementById('pf_toggleFreeShip')?.checked;
    const cashback = document.getElementById('pf_toggleCashback')?.checked;
    let serviceFee = 0;
    if (freeShip) serviceFee += 4.0;
    if (cashback) serviceFee += 4.5;

    document.getElementById('pf_serviceFeePercent').value = serviceFee.toFixed(2);

    // Sync to global
    syncPfFees();
    calculateOptimalPrice();
}

// Price Finder Dynamic Cost Components
let pfCostComponents = [];
let pfCostIdCounter = 0;

function addPfCostComponent(name = '', type = 'fixed', value = 0) {
    const id = ++pfCostIdCounter;
    pfCostComponents.push({ id, name, type, value });
    renderPfCostComponents();
    calculateOptimalPrice();
}

function addPfPreset(key, name, type, value) {
    // Check if preset already exists
    const exists = pfCostComponents.find(c => c.name === name);
    if (exists) {
        showToast(`${name} sudah ditambahkan`, 'error');
        return;
    }
    addPfCostComponent(name, type, value);
    showToast(`${name} ditambahkan`, 'success');
}

function removePfCostComponent(id) {
    pfCostComponents = pfCostComponents.filter(c => c.id !== id);
    renderPfCostComponents();
    calculateOptimalPrice();
}

function updatePfCostComponent(id, field, value) {
    const comp = pfCostComponents.find(c => c.id === id);
    if (comp) {
        comp[field] = field === 'value' ? parseFloat(value) || 0 : value;
        calculateOptimalPrice();
    }
}

function renderPfCostComponents() {
    const container = document.getElementById('pf_cost_components');
    if (!container) return;

    if (pfCostComponents.length === 0) {
        container.innerHTML = `
                    <div class="text-center text-xs text-slate-400 py-3">
                        <i class="fas fa-info-circle mr-1"></i>
                        Belum ada komponen biaya. Klik "+ Tambah Biaya" atau gunakan preset.
                    </div>`;
        return;
    }

    container.innerHTML = pfCostComponents.map(c => `
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 bg-white dark:bg-slate-700 p-2 rounded-lg border border-slate-200 dark:border-slate-600">
                    <input type="text" value="${c.name}" placeholder="Nama biaya" 
                        onchange="updatePfCostComponent(${c.id}, 'name', this.value)"
                        class="w-full sm:flex-1 text-xs p-1.5 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white">
                    <div class="flex items-center gap-2 w-full sm:w-auto">
                        <select onchange="updatePfCostComponent(${c.id}, 'type', this.value)"
                            class="flex-1 sm:flex-none text-xs p-1.5 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white">
                            <option value="fixed" ${c.type === 'fixed' ? 'selected' : ''}>Biaya Tetap (Rp)</option>
                            <option value="percent" ${c.type === 'percent' ? 'selected' : ''}>Biaya Variabel (%)</option>
                        </select>
                        <input type="text" value="${new Intl.NumberFormat('id-ID').format(c.value)}" placeholder="0"
                            onchange="updatePfCostComponent(${c.id}, 'value', parseFormattedNumber(this.value))"
                            oninput="formatInputNumber(this); updatePfCostComponent(${c.id}, 'value', parseFormattedNumber(this.value))"
                            class="w-20 sm:w-24 text-xs p-1.5 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white text-right">
                        <button onclick="removePfCostComponent(${c.id})" 
                            class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                            <i class="fas fa-trash-alt text-xs"></i>
                        </button>
                    </div>
                </div>
            `).join('');
}

function calculateOptimalPrice() {
    const hpp = parseFormattedNumber(document.getElementById('pf_hpp')?.value);
    const discount = parseFloat(document.getElementById('pf_discount')?.value) || 0;

    // UI Elements for Decision Support
    const elContext = document.getElementById('pf_context_label');
    const elTargetSum = document.getElementById('pf_target_summary');
    const elHppSum = document.getElementById('pf_hpp_summary');
    const elSensitivity = document.getElementById('pf_sensitivity_insight');
    const elStatus = document.getElementById('pf_price_status');
    const elCard = document.getElementById('pf_result_card');
    const elOverlay = document.getElementById('pf_status_overlay');

    // 1. Set Context Label & Target Summary
    if (elContext) {
        if (pfConfigMode === 'advanced') {
            elContext.innerText = "SIMULASI MANUAL (CUSTOM)";
            elContext.classList.remove('bg-blue-500/20', 'text-blue-100');
            elContext.classList.add('bg-purple-500/20', 'text-purple-100');
        } else {
            elContext.innerText = "ESTIMASI MARKETPLACE (AUTO)";
            elContext.classList.remove('bg-purple-500/20', 'text-purple-100');
            elContext.classList.add('bg-blue-500/20', 'text-blue-100');
        }
    }

    if (elHppSum) elHppSum.innerText = formatRupiah(hpp);

    let adminPct = 0;
    let servicePct = 0;
    let affiliatePct = 0;
    let totalFeePct = 0;
    let fixedCosts = 0; // Biaya Lainnya (fixed Rp costs)

    // Calculate Fees (Logic same as before, just structural refactor)
    if (pfConfigMode === 'advanced') {
        adminPct = parseFloat(document.getElementById('pf_adminFeePercent')?.value) || 0;
        servicePct = parseFloat(document.getElementById('pf_serviceFeePercent')?.value) || 0;
        affiliatePct = parseFloat(document.getElementById('pf_affiliatePercent')?.value) || 0;
        fixedCosts = (parseFormattedNumber(document.getElementById('pf_orderProcessFee')?.value) || 0) +
            (parseFormattedNumber(document.getElementById('pf_fixedFee')?.value) || 0) +
            (parseFormattedNumber(document.getElementById('pf_operationalCost')?.value) || 0);
    } else {
        // Simple Mode Components
        let dynamicFixedCosts = 0;
        let dynamicVariablePct = 0;
        pfCostComponents.forEach(comp => {
            if (comp.type === 'fixed') dynamicFixedCosts += comp.value;
            else if (comp.type === 'percent') dynamicVariablePct += comp.value;
        });
        fixedCosts += dynamicFixedCosts;
        totalFeePct += dynamicVariablePct;
    }

    // Advanced mode percentages
    if (pfConfigMode === 'advanced') {
        totalFeePct = adminPct + servicePct + affiliatePct;
    }

    setText('pf_total_fee_display', totalFeePct.toFixed(1) + '%');

    let sellingPrice = 0;
    let profit = 0;
    let margin = 0;
    let optimalPriceFound = false;

    if (hpp > 0) {
        const effectiveHpp = hpp + fixedCosts;

        if (priceFinderTarget === 'margin') {
            const targetMargin = parseFloat(document.getElementById('pf_target_margin')?.value) || 0;
            if (elTargetSum) elTargetSum.innerText = `Margin ${targetMargin}%`;

            // Check for Unrealistic Target (Margin + Fee >= 100%)
            if ((targetMargin + totalFeePct) >= 100) {
                renderUnrealisticState(targetMargin, totalFeePct);
                return;
            }

            const denominator = 1 - (targetMargin / 100) - (totalFeePct / 100);
            if (denominator > 0) {
                sellingPrice = Math.ceil(effectiveHpp / denominator);
                profit = sellingPrice - effectiveHpp - (sellingPrice * totalFeePct / 100);
                margin = (profit / sellingPrice) * 100;
                optimalPriceFound = true;
            }
        } else {
            // Profit Mode
            const profitType = pfProfitType;
            let targetProfitValue = parseFormattedNumber(document.getElementById('pf_target_profit')?.value) || 0;
            let targetProfitAmount = 0;

            if (profitType === 'rupiah') {
                targetProfitAmount = targetProfitValue;
                if (elTargetSum) elTargetSum.innerText = `Profit ${formatRupiah(targetProfitValue)}`;
            } else {
                targetProfitAmount = effectiveHpp * (targetProfitValue / 100);
                if (elTargetSum) elTargetSum.innerText = `Profit ${targetProfitValue}% (${formatRupiah(targetProfitAmount)})`;
            }

            const denominator = 1 - (totalFeePct / 100);
            if (denominator > 0) {
                sellingPrice = Math.ceil((effectiveHpp + targetProfitAmount) / denominator);
                profit = sellingPrice - effectiveHpp - (sellingPrice * totalFeePct / 100);
                margin = (profit / sellingPrice) * 100;
                optimalPriceFound = true;
            }
        }
    }

    // Strikethrough Price
    let strikethroughPrice = 0;
    if (discount > 0 && sellingPrice > 0) {
        strikethroughPrice = Math.ceil(sellingPrice / (1 - discount / 100));
        document.getElementById('pf_strikethrough_container')?.classList.remove('hidden');
        setText('pf_strikethrough_price', formatRupiah(strikethroughPrice));
    } else {
        document.getElementById('pf_strikethrough_container')?.classList.add('hidden');
    }

    // --- ENHANCED BREAKDOWN WITH CONTRIBUTION ---
    const breakdownContainer = document.getElementById('pf_result_breakdown_list');
    let breakdownHTML = '';
    let totalCalculatedFee = 0;
    let feeBreakdownItems = [];

    // Helper to collect fee items
    const collectFee = (label, amount) => {
        feeBreakdownItems.push({ label, amount });
        totalCalculatedFee += amount;
    };

    if (pfConfigMode === 'advanced') {
        if (adminPct > 0) collectFee(`Biaya Admin (${adminPct}%)`, sellingPrice * adminPct / 100);
        if (servicePct > 0) collectFee(`Biaya Layanan (${servicePct}%)`, sellingPrice * servicePct / 100);
        if (affiliatePct > 0) collectFee(`Affiliate (${affiliatePct}%)`, sellingPrice * affiliatePct / 100);

        const advFixed = fixedCosts;
        if (advFixed > 0) collectFee('Biaya Tetap', advFixed);
    } else {
        pfCostComponents.forEach(comp => {
            let amount = 0;
            if (comp.type === 'fixed') {
                amount = comp.value;
                collectFee(comp.name, amount);
            } else if (comp.type === 'percent') {
                amount = sellingPrice * comp.value / 100;
                collectFee(`${comp.name} (${comp.value}%)`, amount);
            }
        });
    }

    // Render Breakdown with Contribution %
    feeBreakdownItems.sort((a, b) => b.amount - a.amount); // Sort by highest impact
    feeBreakdownItems.forEach(item => {
        const contrib = totalCalculatedFee > 0 ? (item.amount / totalCalculatedFee) * 100 : 0;
        breakdownHTML += `
            <div class="flex justify-between items-center group">
                <div class="flex flex-col">
                    <span class="opacity-80">${item.label}</span>
                    <div class="w-full bg-white/10 h-0.5 mt-0.5 rounded-full overflow-hidden">
                        <div class="bg-white/50 h-full" style="width: ${contrib}%"></div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold">-${formatRupiah(Math.round(item.amount))}</div>
                    <div class="text-[9px] opacity-60">${contrib.toFixed(0)}% dari total fee</div>
                </div>
            </div>`;
    });

    if (breakdownContainer) {
        breakdownContainer.innerHTML = breakdownHTML || '<div class="text-xs text-white/50 italic text-center">Tidak ada potongan</div>';
    }

    // --- SENSITIVITY INSIGHT ---
    if (elSensitivity && sellingPrice > 0) {
        // Calculate price if admin fee increases by 1%
        const currentTotalPct = totalFeePct;
        const higherTotalPct = totalFeePct + 1;
        let higherPrice = 0;

        let sensitivityMsg = "";

        // Use same formula logic based on target type
        const denominatorHigh = priceFinderTarget === 'margin'
            ? (1 - (parseFloat(document.getElementById('pf_target_margin')?.value || 0) / 100) - (higherTotalPct / 100))
            : (1 - (higherTotalPct / 100));

        if (denominatorHigh > 0) {
            if (priceFinderTarget === 'margin') {
                higherPrice = Math.ceil((hpp + fixedCosts) / denominatorHigh);
            } else {
                // Profit mode simple assumption
                const effectiveHpp = hpp + fixedCosts;
                const profitVal = pfProfitType === 'rupiah'
                    ? (parseFormattedNumber(document.getElementById('pf_target_profit')?.value) || 0)
                    : (effectiveHpp * (parseFormattedNumber(document.getElementById('pf_target_profit')?.value) || 0) / 100);
                higherPrice = Math.ceil((effectiveHpp + profitVal) / denominatorHigh);
            }

            const diff = higherPrice - sellingPrice;
            sensitivityMsg = `<i class="fas fa-info-circle mr-1"></i> Setiap kenaikan 1% biaya admin menaikkan harga jual ± <strong>${formatRupiah(diff)}</strong>`;
        } else {
            sensitivityMsg = "Biaya terlalu tinggi, sensitivitas tidak dapat dihitung.";
        }

        elSensitivity.innerHTML = sensitivityMsg;
    }


    // --- STATUS INDICATOR (Green/Yellow/Red) ---
    if (elStatus && elOverlay && elCard) {
        // Rules:
        // GREEN: Fee < 15% AND Margin >= 20%
        // YELLOW: Fee 15-25% OR Margin 10-20%
        // RED: Fee > 25% OR Margin < 10%

        // Fee Ratio (Total deducted / Selling Price)
        const feeRatio = sellingPrice > 0 ? (totalCalculatedFee / sellingPrice) * 100 : 0;

        // Base classes including the gradient trigger
        const baseClasses = "rounded-2xl shadow-lg p-6 text-white relative overflow-hidden transition-all duration-300 bg-gradient-to-br";

        if (optimalPriceFound) {
            if (feeRatio > 25 || margin < 10) {
                // RED - Warning
                elStatus.innerText = "STATUS: BIAYA TINGGI / MARGIN TIPIS";
                elStatus.className = "mt-2 text-[10px] font-bold px-2 py-0.5 inline-block rounded bg-red-900/40 text-red-100 border border-red-200/20";
                elOverlay.className = "absolute inset-0 bg-red-900/20 transition-colors duration-300 pointer-events-none";
                elCard.className = `${baseClasses} from-red-500 to-rose-600`;
            } else if ((feeRatio >= 15 && feeRatio <= 25) || (margin >= 10 && margin < 20)) {
                // YELLOW - Caution
                elStatus.innerText = "STATUS: MARGIN STANDAR";
                elStatus.className = "mt-2 text-[10px] font-bold px-2 py-0.5 inline-block rounded bg-amber-900/40 text-amber-100 border border-amber-200/20";
                elOverlay.className = "absolute inset-0 bg-amber-900/10 transition-colors duration-300 pointer-events-none";
                elCard.className = `${baseClasses} from-amber-500 to-orange-500`;
            } else {
                // GREEN - Healthy
                elStatus.innerText = "STATUS: SEHAT";
                elStatus.className = "mt-2 text-[10px] font-bold px-2 py-0.5 inline-block rounded bg-emerald-900/40 text-emerald-100 border border-emerald-200/20";
                elOverlay.className = "absolute inset-0 bg-emerald-900/10 transition-colors duration-300 pointer-events-none";
                elCard.className = `${baseClasses} from-emerald-500 to-teal-500`;
            }
        } else {
            // Default (No Result yet) - Reset to Orange Brand Gradient
            elCard.className = `${baseClasses} from-orange-500 to-red-500`;
            elStatus.innerText = "STATUS: -";
            elStatus.className = "mt-2 text-[10px] font-bold px-2 py-0.5 inline-block rounded bg-white/20";
            elOverlay.className = "absolute inset-0 bg-transparent transition-colors duration-300 pointer-events-none";
        }
    }

    // Update Result Display
    setText('pf_result_price', formatRupiah(sellingPrice));
    setText('pf_result_profit', formatRupiah(Math.round(profit)));
    setText('pf_result_margin', margin.toFixed(1) + '%');
    setText('pf_result_total_fee', '-' + formatRupiah(Math.round(totalCalculatedFee)));

    // Remove unrealistic state UI if it exists (cleanup)
    const adviceDiv = document.getElementById('pf_unrealistic_advice');
    if (adviceDiv) {
        adviceDiv.remove();
        if (elSensitivity) elSensitivity.classList.remove('hidden');
    }
}

function renderUnrealisticState(margin, totalFee) {
    // UI Elements
    const elStatus = document.getElementById('pf_price_status');
    const elCard = document.getElementById('pf_result_card');
    const elSensitivity = document.getElementById('pf_sensitivity_insight');
    const elOverlay = document.getElementById('pf_status_overlay');

    // Base classes
    const baseClasses = "rounded-2xl shadow-lg p-6 text-white relative overflow-hidden transition-all duration-300 bg-gradient-to-br";

    // 1. Set Error State UI
    if (elCard) elCard.className = `${baseClasses} from-gray-800 to-red-900`;
    if (elOverlay) elOverlay.className = "absolute inset-0 bg-black/20 transition-colors duration-300 pointer-events-none";

    if (elStatus) {
        elStatus.innerText = "❌ TARGET TIDAK REALISTIS";
        elStatus.className = "mt-2 text-[10px] font-bold px-2 py-0.5 inline-block rounded bg-black/40 text-white border border-white/20";
    }

    // 2. Set displayed values to 'Impossible' state
    setText('pf_result_price', "Tidak Diketahui");
    setText('pf_result_profit', "Rp 0");
    setText('pf_result_margin', "0%");
    setText('pf_result_total_fee', "Biaya > Harga");

    // 3. Render Actionable Advice
    // Max possible margin = 100 - fee - 1 (buffer)
    const maxMargin = Math.max(0, 100 - totalFee - 1);

    // Hide standard sensitivity, show error advice
    if (elSensitivity) {
        elSensitivity.classList.add('hidden');

        // Check if advice container exists, if not create inside the parent of sensitivity
        let adviceDiv = document.getElementById('pf_unrealistic_advice');
        if (!adviceDiv) {
            adviceDiv = document.createElement('div');
            adviceDiv.id = 'pf_unrealistic_advice';
            adviceDiv.className = "mt-4 bg-black/30 rounded-lg p-3 text-sm border border-white/10";
            elSensitivity.parentElement.appendChild(adviceDiv);
        }

        adviceDiv.innerHTML = `
            <div class="font-bold flex items-center gap-2 mb-2 text-rose-300">
                <i class="fas fa-exclamation-triangle"></i> Mengapa ini terjadi?
            </div>
            <p class="mb-3 text-xs opacity-90">
                Total biaya yang Anda set (${totalFee.toFixed(1)}%) ditambah Target Margin (${margin}%) = <strong>${(totalFee + margin).toFixed(1)}%</strong>. 
                <br>Ini melebihi 100% harga jual, sehingga tidak mungkin dihitung.
            </p>
            <div class="font-bold mb-1 text-xs text-rose-200">💡 Saran Strategis:</div>
            <ul class="list-disc pl-4 text-xs space-y-1 opacity-90">
                <li>Turunkan target margin menjadi <strong>${maxMargin.toFixed(0)}%</strong> atau kurang.</li>
                <li>Kurangi komponen biaya (seperti affiliate atau layanan).</li>
                <li>Gunakan mode <strong>Target Profit (Rp)</strong> untuk simulasi yang lebih aman.</li>
            </ul>
        `;
    }
}


// ==================== MODULE 3: ROAS CALCULATOR ====================

// Switch between Auto and Manual mode
function switchROASMode(mode) {
    const autoSection = document.getElementById('roas_auto_section');
    const manualSection = document.getElementById('roas_manual_section');
    const btnAuto = document.getElementById('btn-roas-auto');
    const btnManual = document.getElementById('btn-roas-manual');

    const activeClass = 'px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm transition-all';
    const inactiveClass = 'px-3 py-1 text-xs font-bold text-slate-400 rounded-md transition-all hover:bg-white/50 dark:hover:bg-slate-600/50';

    if (mode === 'auto') {
        autoSection?.classList.remove('hidden');
        manualSection?.classList.add('hidden');
        if (btnAuto) btnAuto.className = activeClass;
        if (btnManual) btnManual.className = inactiveClass;
        // roasAutoData will be set when products are selected
    } else {
        autoSection?.classList.add('hidden');
        manualSection?.classList.remove('hidden');
        if (btnManual) btnManual.className = activeClass;
        if (btnAuto) btnAuto.className = inactiveClass;
        // Deactivate Auto mode data so calculateROASBreakeven uses manual inputs
        roasAutoData.isActive = false;
        // Trigger recalculation with manual inputs
        calculateROASBreakeven();
    }
}

// ==================== PRODUCT COMBOBOX ====================
let comboboxOpen = false;
let selectedProductId = null;

function toggleProductCombobox() {
    const dropdown = document.getElementById('combobox-dropdown');
    comboboxOpen = !comboboxOpen;

    if (comboboxOpen) {
        dropdown.classList.add('open');
        renderProductOptions();
        document.getElementById('combobox-search-input')?.focus();
        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', closeComboboxOnOutside);
        }, 10);
    } else {
        dropdown.classList.remove('open');
        document.removeEventListener('click', closeComboboxOnOutside);
    }
}

function closeComboboxOnOutside(e) {
    const wrapper = document.getElementById('productCombobox');
    if (wrapper && !wrapper.contains(e.target)) {
        closeProductCombobox();
    }
}

function closeProductCombobox() {
    const dropdown = document.getElementById('combobox-dropdown');
    dropdown?.classList.remove('open');
    comboboxOpen = false;
    document.removeEventListener('click', closeComboboxOnOutside);
}

function renderProductOptions(filter = '') {
    const container = document.getElementById('combobox-options');
    if (!container) return;

    const filtered = productDB.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
        container.innerHTML = '<div class="combobox-empty">Tidak ada produk ditemukan</div>';
        return;
    }

    container.innerHTML = filtered.map(p => {
        const isSelected = selectedProductId == p.id;
        const profit = p.result_profit || p.profit || 0;
        return `
                    <div class="combobox-option ${isSelected ? 'selected' : ''}" 
                         onclick="selectProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')">
                        <div class="flex justify-between items-center">
                            <span class="font-medium">${p.name}</span>
                            <span class="text-xs ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}">${formatRupiah(profit)}</span>
                        </div>
                    </div>
                `;
    }).join('');
}

function filterProductOptions(query) {
    renderProductOptions(query);
}

function selectProduct(id, name) {
    selectedProductId = id;

    // Update trigger display
    document.getElementById('combobox-selected-text').innerText = name;

    // Update hidden select for compatibility
    const select = document.getElementById('roas_product_select');
    if (select) {
        select.value = id;
        select.dispatchEvent(new Event('change'));
    }

    closeProductCombobox();
}

// Override renderROASSelect to also update combobox
function updateProductCombobox() {
    const select = document.getElementById('roas_product_select');
    if (!select) return;

    // Clear and repopulate hidden select
    select.innerHTML = '';
    productDB.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.innerText = `${p.name} - ${formatRupiah(p.result_profit || p.profit || 0)}`;
        select.appendChild(opt);
    });

    // Reset combobox state
    selectedProductId = null;
    const textEl = document.getElementById('combobox-selected-text');
    if (textEl) textEl.innerText = 'Pilih produk...';
}

// ==================== ROAS MULTI-SELECT ====================
let roasMultiOpen = false;
let roasSelectedProducts = []; // Array of selected product IDs

function toggleRoasMultiSelect() {
    const dropdown = document.getElementById('roas-multiselect-dropdown');
    roasMultiOpen = !roasMultiOpen;

    if (roasMultiOpen) {
        dropdown.classList.add('open');
        renderRoasMultiOptions();
        document.getElementById('roas-multiselect-search')?.focus();
        setTimeout(() => {
            document.addEventListener('click', closeRoasMultiOnOutside);
        }, 10);
    } else {
        dropdown.classList.remove('open');
        document.removeEventListener('click', closeRoasMultiOnOutside);
    }
}

function closeRoasMultiOnOutside(e) {
    const wrapper = document.getElementById('roasMultiSelect');
    if (wrapper && !wrapper.contains(e.target)) {
        closeRoasMultiSelect();
    }
}

function closeRoasMultiSelect() {
    const dropdown = document.getElementById('roas-multiselect-dropdown');
    dropdown?.classList.remove('open');
    roasMultiOpen = false;
    document.removeEventListener('click', closeRoasMultiOnOutside);
}

function renderRoasMultiOptions(filter = '') {
    const container = document.getElementById('roas-multiselect-options');
    if (!container) return;

    const filtered = productDB.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
        container.innerHTML = '<div class="combobox-empty">Tidak ada produk ditemukan</div>';
        return;
    }

    container.innerHTML = filtered.map(p => {
        const isSelected = roasSelectedProducts.includes(p.id);
        const profit = p.result_profit || p.profit || 0;
        const mp = p.platform || 'shopee';
        return `
                    <label class="multiselect-option" onclick="event.stopPropagation()">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} 
                               onchange="toggleRoasProductSelection(${p.id})">
                        <span class="mp-tag ${mp}">${mp.charAt(0).toUpperCase() + mp.slice(1)}</span>
                        <span class="flex-1 font-medium">${p.name}</span>
                        <span class="text-xs ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}">${formatRupiah(profit)}</span>
                    </label>
                `;
    }).join('');
}

function filterRoasMultiOptions(query) {
    renderRoasMultiOptions(query);
}

function toggleRoasProductSelection(id) {
    const idx = roasSelectedProducts.indexOf(id);
    if (idx > -1) {
        roasSelectedProducts.splice(idx, 1);
    } else {
        roasSelectedProducts.push(id);
    }
    updateRoasSelectedBadges();
    renderRoasProductCards();
}

function updateRoasSelectedBadges() {
    const container = document.getElementById('roas-selected-badges');
    if (!container) return;

    if (roasSelectedProducts.length === 0) {
        container.innerHTML = '<span class="text-slate-400">Pilih produk...</span>';
        document.getElementById('roas_product_card')?.classList.add('hidden');
        document.getElementById('roas_auto_empty')?.classList.remove('hidden');
        return;
    }

    // Hide empty helper, show results
    document.getElementById('roas_auto_empty')?.classList.add('hidden');

    // Render badges
    container.innerHTML = roasSelectedProducts.map(id => {
        const product = productDB.find(p => p.id === id);
        if (!product) return '';
        const mp = product.platform || 'shopee';
        return `
                    <span class="badge ${mp}">
                        <span class="mp-tag ${mp} text-[8px]">${mp.charAt(0).toUpperCase()}</span>
                        ${product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name}
                        <button onclick="event.stopPropagation(); removeRoasProduct(${id})" class="badge-remove">×</button>
                    </span>
                `;
    }).join('');
}

function removeRoasProduct(id) {
    const idx = roasSelectedProducts.indexOf(id);
    if (idx > -1) {
        roasSelectedProducts.splice(idx, 1);
    }
    updateRoasSelectedBadges();
    renderRoasProductCards();
    renderRoasMultiOptions(document.getElementById('roas-multiselect-search')?.value || '');
}

function renderRoasProductCards() {
    const singleCard = document.getElementById('roas_product_card');
    const multiContainer = document.getElementById('roas_multi_products');
    const emptyHelper = document.getElementById('roas_auto_empty');

    // Hide all first
    singleCard?.classList.add('hidden');
    multiContainer?.classList.add('hidden');
    emptyHelper?.classList.add('hidden');

    if (roasSelectedProducts.length === 0) {
        emptyHelper?.classList.remove('hidden');
        // Reset ROAS display
        document.getElementById('roas_result_be').innerText = '0.00x';
        document.getElementById('roas_result_acos').innerText = '0%';
        document.getElementById('roas_result_profit').innerText = 'Rp 0';
        return;
    }

    // If only 1 product, use old single card display
    if (roasSelectedProducts.length === 1) {
        singleCard?.classList.remove('hidden');
        const id = roasSelectedProducts[0];
        document.getElementById('roas_product_select').value = id;
        loadProductToROAS();
        return;
    }

    // For multiple products, show accordion with individual ROAS
    multiContainer?.classList.remove('hidden');
    renderMultiProductAccordion();
}

function renderMultiProductAccordion() {
    const container = document.getElementById('roas_multi_products');
    if (!container) return;

    let totalRoas = 0;
    let totalProfit = 0;
    let productCount = 0;

    // Generate accordion items
    const accordionHtml = roasSelectedProducts.map((id, index) => {
        const product = productDB.find(p => p.id === id);
        if (!product) return '';

        // Calculate ROAS for this product
        const roasData = calculateProductROAS(product);
        totalRoas += roasData.roasBE;
        totalProfit += roasData.netProfit;
        productCount++;

        const mp = product.platform || 'shopee';
        const isFirst = index === 0;

        return `
                    <div class="roas-accordion-item bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                        <button type="button" onclick="toggleRoasAccordion(this)" class="w-full p-4 flex items-center justify-between text-left">
                            <div class="flex items-center gap-2">
                                <span class="mp-tag ${mp}">${mp.charAt(0).toUpperCase() + mp.slice(1)}</span>
                                <span class="font-bold text-slate-800 dark:text-white">${product.name}</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-purple-600 dark:text-purple-400 font-bold">${roasData.roasBE.toFixed(2)}x</span>
                                <i class="fas fa-chevron-down text-slate-400 transition-transform ${isFirst ? 'rotate-180' : ''}"></i>
                            </div>
                        </button>
                        <div class="accordion-content ${isFirst ? '' : 'hidden'} px-4 pb-4">
                            <div class="grid grid-cols-2 gap-2 text-xs mb-3">
                                <div class="bg-white dark:bg-slate-600 rounded-lg p-2">
                                    <div class="text-slate-400 dark:text-slate-300">HPP</div>
                                    <div class="font-bold text-slate-700 dark:text-white">${formatRupiah(roasData.hpp)}</div>
                                </div>
                                <div class="bg-white dark:bg-slate-600 rounded-lg p-2">
                                    <div class="text-slate-400 dark:text-slate-300">Harga Jual</div>
                                    <div class="font-bold text-slate-700 dark:text-white">${formatRupiah(roasData.price)}</div>
                                </div>
                                <div class="bg-white dark:bg-slate-600 rounded-lg p-2">
                                    <div class="text-slate-400 dark:text-slate-300">Profit</div>
                                    <div class="font-bold ${roasData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}">${formatRupiah(Math.round(roasData.netProfit))}</div>
                                </div>
                                <div class="bg-white dark:bg-slate-600 rounded-lg p-2">
                                    <div class="text-slate-400 dark:text-slate-300">ROAS BE</div>
                                    <div class="font-bold text-purple-600 dark:text-purple-400">${roasData.roasBE.toFixed(2)}x</div>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div class="bg-white dark:bg-slate-600 rounded-lg p-2">
                                    <div class="text-slate-400 dark:text-slate-300">ACOS Max</div>
                                    <div class="font-bold text-blue-600 dark:text-blue-400">${roasData.acosMax.toFixed(1)}%</div>
                                </div>
                                <div class="bg-white dark:bg-slate-600 rounded-lg p-2">
                                    <div class="text-slate-400 dark:text-slate-300">Max CPC</div>
                                    <div class="font-bold text-emerald-600 dark:text-emerald-400">${formatRupiah(Math.round(roasData.maxCPC))}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    }).join('');

    container.innerHTML = accordionHtml;

    // Calculate averages for summary display
    const avgRoas = productCount > 0 ? totalRoas / productCount : 0;
    const avgProfit = productCount > 0 ? totalProfit / productCount : 0;
    const avgAcos = avgRoas > 0 ? (1 / avgRoas) * 100 : 0;

    // Calculate average price for multi-product
    let totalPrice = 0;
    roasSelectedProducts.forEach(id => {
        const product = productDB.find(p => p.id === id);
        if (product) {
            totalPrice += product.display_price || product.displayPrice || product.selling_price || 0;
        }
    });
    const avgPrice = productCount > 0 ? totalPrice / productCount : 0;
    const cr = 2; // Default conversion rate

    // Update summary ROAS display
    document.getElementById('roas_result_be').innerText = avgRoas.toFixed(2) + 'x';
    document.getElementById('roas_result_acos').innerText = avgAcos.toFixed(1) + '%';
    document.getElementById('roas_result_profit').innerText = formatRupiah(Math.round(avgProfit));
    document.getElementById('roas_cr_display').innerText = cr + '%';
    document.getElementById('roas_result_maxcpc').innerText = formatRupiah(Math.round(avgProfit * (cr / 100)));

    // Store Auto mode data for use by Analisa Kesehatan Iklan
    roasAutoData = {
        price: avgPrice,
        netProfit: avgProfit,
        roasBE: avgRoas,
        isActive: true
    };

    // Update Analisa Kesehatan Iklan with average values
    updateAdsAnalysisFromROAS(avgPrice, avgProfit, avgRoas, cr);
}

// Calculate ROAS for a single product (used in multi-product accordion)
function calculateProductROAS(product) {
    // Use same property names as calculateAutoModeROAS for consistency
    const hpp = product.cost_of_goods || product.hpp || product.modal || 0;
    const price = product.display_price || product.displayPrice || product.selling_price || product.sellingPrice || 0;
    const profit = product.result_profit || product.profit || 0;
    const cr = 2; // Default conversion rate

    // Use stored profit directly - this matches calculateAutoModeROAS
    const netProfit = profit;

    let roasBE = 0;
    let acosMax = 0;
    let maxCPC = 0;

    if (netProfit > 0 && price > 0) {
        roasBE = price / netProfit;
        acosMax = (netProfit / price) * 100;
        maxCPC = netProfit * (cr / 100);
    }

    return { hpp, price, netProfit, roasBE, acosMax, maxCPC };
}

// Toggle accordion item
function toggleRoasAccordion(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('i');
    content.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
}

// ==================== COMPARE MODULE MULTI-SELECT ====================
let cmpMultiOpen = false;
let cmpSelectedProducts = []; // Array of selected product IDs

function toggleCmpMultiSelect() {
    const dropdown = document.getElementById('cmp-multiselect-dropdown');
    cmpMultiOpen = !cmpMultiOpen;

    if (cmpMultiOpen) {
        dropdown.classList.add('open');
        renderCmpMultiOptions();
        document.getElementById('cmp-multiselect-search')?.focus();
        setTimeout(() => {
            document.addEventListener('click', closeCmpMultiOnOutside);
        }, 10);
    } else {
        dropdown.classList.remove('open');
        document.removeEventListener('click', closeCmpMultiOnOutside);
    }
}

function closeCmpMultiOnOutside(e) {
    const wrapper = document.getElementById('cmpMultiSelect');
    if (wrapper && !wrapper.contains(e.target)) {
        closeCmpMultiSelect();
    }
}

function closeCmpMultiSelect() {
    const dropdown = document.getElementById('cmp-multiselect-dropdown');
    dropdown?.classList.remove('open');
    cmpMultiOpen = false;
    document.removeEventListener('click', closeCmpMultiOnOutside);
}

function renderCmpMultiOptions(filter = '') {
    const container = document.getElementById('cmp-multiselect-options');
    if (!container) return;

    const filtered = productDB.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
        container.innerHTML = '<div class="combobox-empty">Tidak ada produk ditemukan</div>';
        return;
    }

    container.innerHTML = filtered.map(p => {
        const isSelected = cmpSelectedProducts.includes(p.id);
        const profit = p.result_profit || p.profit || 0;
        const mp = p.platform || 'shopee';
        return `
                    <label class="multiselect-option" onclick="event.stopPropagation()">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} 
                               onchange="toggleCmpProductSelection(${p.id})">
                        <span class="mp-tag ${mp}">${mp.charAt(0).toUpperCase() + mp.slice(1)}</span>
                        <span class="flex-1 font-medium">${p.name}</span>
                        <span class="text-xs ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}">${formatRupiah(profit)}</span>
                    </label>
                `;
    }).join('');
}

function filterCmpMultiOptions(query) {
    renderCmpMultiOptions(query);
}

function toggleCmpProductSelection(id) {
    const idx = cmpSelectedProducts.indexOf(id);
    if (idx > -1) {
        cmpSelectedProducts.splice(idx, 1);
    } else {
        cmpSelectedProducts.push(id);
    }
    updateCmpSelectedBadges();
    renderComparisonCards();
}

function updateCmpSelectedBadges() {
    const badgeContainer = document.getElementById('cmp-selected-badges');
    if (!badgeContainer) return;

    if (cmpSelectedProducts.length === 0) {
        badgeContainer.innerHTML = '<span class="text-slate-400">Pilih produk...</span>';
        return;
    }

    badgeContainer.innerHTML = cmpSelectedProducts.map(id => {
        const p = productDB.find(prod => prod.id === id);
        if (!p) return '';
        const mp = p.platform || 'shopee';
        return `<span class="multiselect-badge ${mp}">${p.name}</span>`;
    }).join('');
}

function renderComparisonCards() {
    const resultsContainer = document.getElementById('cmp_results');
    if (!resultsContainer) return;

    if (cmpSelectedProducts.length === 0) {
        resultsContainer.innerHTML = `
                    <div class="text-center text-slate-400 py-10 col-span-4">
                        <i class="fas fa-info-circle text-2xl mb-2"></i>
                        <p class="text-sm">Pilih produk dari database untuk melihat perbandingan</p>
                    </div>`;
        return;
    }

    // Get selected products data
    let products = cmpSelectedProducts.map(id => productDB.find(p => p.id === id)).filter(Boolean);

    // Sorting
    const sortBy = document.getElementById('cmpSortBy')?.value || 'profit_desc';
    products.sort((a, b) => {
        const profitA = a.result_profit || 0;
        const profitB = b.result_profit || 0;
        const marginA = a.result_margin || 0;
        const marginB = b.result_margin || 0;
        const feeA = a.fee_total_percent || 0;
        const feeB = b.fee_total_percent || 0;
        const roasA = profitA > 0 ? (a.selling_price || a.display_price || 0) / profitA : Infinity;
        const roasB = profitB > 0 ? (b.selling_price || b.display_price || 0) / profitB : Infinity;

        switch (sortBy) {
            case 'profit_desc': return profitB - profitA;
            case 'profit_asc': return profitA - profitB;
            case 'margin_desc': return marginB - marginA;
            case 'margin_asc': return marginA - marginB;
            case 'fee_asc': return feeA - feeB;
            case 'fee_desc': return feeB - feeA;
            case 'roas_asc': return roasA - roasB;
            default: return profitB - profitA;
        }
    });

    // Find best profit and margin
    const bestProfit = Math.max(...products.map(p => p.result_profit || 0));
    const bestMargin = Math.max(...products.map(p => p.result_margin || 0));

    let html = '';
    products.forEach(p => {
        const mp = p.platform || 'shopee';
        const mpColors = {
            shopee: { bg: 'from-orange-500 to-red-500', light: 'bg-orange-50 dark:bg-orange-900/20' },
            tokopedia: { bg: 'from-green-500 to-emerald-600', light: 'bg-green-50 dark:bg-green-900/20' },
            tiktok: { bg: 'from-gray-800 to-black', light: 'bg-gray-100 dark:bg-gray-900/40' },
            lazada: { bg: 'from-indigo-600 to-blue-800', light: 'bg-indigo-50 dark:bg-indigo-900/20' }
        };
        const colors = mpColors[mp] || mpColors.shopee;
        const profit = p.result_profit || 0;
        const margin = p.result_margin || 0;
        const hpp = p.cost_of_goods || p.hpp || 0;
        const sellingPrice = p.selling_price || p.display_price || 0;
        // Calculate Net Cash: selling price - hpp - total fees (what seller receives minus costs)
        const totalFeeCalc = p.fee_total || 0;
        const netCash = p.result_net_cash || (sellingPrice - totalFeeCalc) || sellingPrice;
        const isBest = profit === bestProfit && products.length > 1;
        const profitDiff = bestProfit - profit;

        // Fee breakdown
        const adminFee = p.fee_admin || 0;
        const serviceFee = p.fee_service || 0;
        const affiliateFee = p.fee_affiliate || 0;
        const totalFee = p.fee_total || (adminFee + serviceFee + affiliateFee);
        const totalFeePct = p.fee_total_percent || 0;

        // ROAS Break-even calculation
        const roasBE = profit > 0 ? (sellingPrice / profit).toFixed(2) : '∞';

        // Margin bar width (capped at 100%)
        const marginWidth = Math.min(Math.max(margin, 0), 50) * 2;
        const marginColor = margin >= 20 ? 'bg-emerald-500' : margin >= 10 ? 'bg-yellow-500' : 'bg-red-500';

        html += `
                    <div class="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border-2 ${isBest ? 'border-yellow-400 shadow-lg shadow-yellow-400/20' : 'border-slate-200 dark:border-slate-700'} transition-all hover:shadow-lg">
                        <!-- Header -->
                        <div class="bg-gradient-to-r ${colors.bg} text-white p-3 flex justify-between items-center">
                            <div class="flex items-center gap-2">
                                <span class="font-bold">${mp.charAt(0).toUpperCase() + mp.slice(1)}</span>
                            </div>
                            ${isBest ? '<span class="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><i class="fas fa-trophy"></i> BEST</span>' : ''}
                        </div>
                        
                        <!-- Product Info -->
                        <div class="p-4 border-b border-slate-100 dark:border-slate-700">
                            <div class="text-xs text-slate-500 dark:text-slate-400 mb-1 truncate">${p.name}</div>
                            <div class="flex items-end justify-between">
                                <div class="text-3xl font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}">
                                    ${formatRupiah(profit)}
                                </div>
                                <div class="text-right">
                                    <div class="text-[10px] text-slate-400">per unit</div>
                                </div>
                            </div>
                            ${!isBest && profitDiff > 0 ? `<div class="text-xs text-red-400 mt-1"><i class="fas fa-arrow-down"></i> ${formatRupiah(profitDiff)} dari terbaik</div>` : ''}
                        </div>

                        <!-- Margin Bar -->
                        <div class="px-4 py-2 ${colors.light}">
                            <div class="flex justify-between text-xs mb-1">
                                <span class="text-slate-500 dark:text-slate-400">Margin</span>
                                <span class="font-bold ${margin >= 0 ? 'text-emerald-600' : 'text-red-500'}">${margin.toFixed(1)}%</span>
                            </div>
                            <div class="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                <div class="h-full ${marginColor} rounded-full transition-all" style="width: ${marginWidth}%"></div>
                            </div>
                        </div>

                        <!-- Details Grid -->
                        <div class="p-4 space-y-3">
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div class="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                                    <div class="text-slate-400 text-[10px]">Harga Jual</div>
                                    <div class="font-bold text-slate-700 dark:text-white">${formatRupiah(sellingPrice)}</div>
                                </div>
                                <div class="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                                    <div class="text-slate-400 text-[10px]">HPP</div>
                                    <div class="font-bold text-slate-700 dark:text-white">${formatRupiah(hpp)}</div>
                                </div>
                            </div>

                            <!-- Fee Breakdown -->
                            <div class="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg text-xs">
                                <div class="text-slate-400 text-[10px] mb-1">Fee Breakdown</div>
                                <div class="space-y-1">
                                    <div class="flex justify-between"><span class="text-slate-500">Admin</span><span class="font-medium">${formatRupiah(adminFee)}</span></div>
                                    <div class="flex justify-between"><span class="text-slate-500">Service</span><span class="font-medium">${formatRupiah(serviceFee)}</span></div>
                                    ${affiliateFee > 0 ? `<div class="flex justify-between"><span class="text-slate-500">Affiliate</span><span class="font-medium">${formatRupiah(affiliateFee)}</span></div>` : ''}
                                    <div class="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-600 font-bold">
                                        <span>Total Fee</span>
                                        <span class="text-red-500">${formatRupiah(totalFee)} (${totalFeePct}%)</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Bottom Stats -->
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div class="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg text-center">
                                    <div class="text-purple-400 text-[10px]">ROAS BE</div>
                                    <div class="font-black text-purple-600 dark:text-purple-400">${roasBE}x</div>
                                </div>
                                <div class="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-center">
                                    <div class="text-blue-400 text-[10px]">Net Cash</div>
                                    <div class="font-bold text-blue-600 dark:text-blue-400">${formatRupiah(netCash)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    });

    resultsContainer.innerHTML = html;
}

// ==================== TARGET PROFIT TOGGLE ====================
let targetProfitEnabled = true;

// Store Auto mode data for use in calculateROASBreakeven
// When in Auto mode, this holds the current product(s) data
let roasAutoData = {
    price: 0,
    netProfit: 0,
    roasBE: 0,
    isActive: false
};

function toggleTargetProfitSection() {
    const toggle = document.getElementById('toggleTargetProfit');
    const content = document.getElementById('targetProfitContent');
    const typeToggle = document.getElementById('targetProfitTypeToggle');

    targetProfitEnabled = !targetProfitEnabled;

    if (targetProfitEnabled) {
        toggle?.classList.add('active');
        content?.classList.remove('hidden');
        typeToggle?.classList.remove('hidden');
    } else {
        toggle?.classList.remove('active');
        content?.classList.add('hidden');
        typeToggle?.classList.add('hidden');
    }

    calculateROASBreakeven();
}

function calculateROASBreakeven() {
    // Check if we're in Auto mode (products selected from database)
    // If so, use stored roasAutoData instead of manual input fields
    let price, netProfit;

    if (roasAutoData.isActive && roasAutoData.price > 0) {
        // Use Auto mode data
        price = roasAutoData.price;
        netProfit = roasAutoData.netProfit;
    } else {
        // Use Manual mode input fields
        const hpp = parseFloat(document.getElementById('roas_hpp')?.value) || 0;
        price = parseFloat(document.getElementById('roas_price')?.value) || 0;
        const feePercent = parseFloat(document.getElementById('roas_fee')?.value) || 0;
        const fee = price * (feePercent / 100);
        netProfit = price - hpp - fee;
    }

    const cr = parseFloat(document.getElementById('roas_cr')?.value) || parseFloat(document.getElementById('cr')?.value) || 2;
    const targetMargin = parseFloat(document.getElementById('roas_target_margin')?.value) || 15;
    const adCostPerUnit = parseFloat(document.getElementById('roas_ad_cost')?.value) || 0;

    const profitAfterAds = netProfit - adCostPerUnit; // Profit setelah iklan

    let roasBE = 0;
    let acosMax = 0;
    let maxCPC = 0;
    let roasTarget = 0;

    if (netProfit > 0 && price > 0) {
        // ROAS Break-even: minimal ROAS agar tidak rugi
        roasBE = price / netProfit;

        // ROAS Target: ROAS yang diperlukan untuk mencapai target margin
        const targetProfit = price * (targetMargin / 100);
        if (targetProfit > 0) {
            roasTarget = price / targetProfit;
        }

        // ACOS Max: maksimal % biaya iklan dari harga jual
        acosMax = (netProfit / price) * 100;

        // Max CPC: maksimal biaya per klik berdasarkan CR
        maxCPC = netProfit * (cr / 100);
    }

    document.getElementById('roas_result_be').innerText = roasBE.toFixed(2) + 'x';
    document.getElementById('roas_result_acos').innerText = acosMax.toFixed(1) + '%';
    document.getElementById('roas_result_profit').innerText = formatRupiah(Math.round(adCostPerUnit > 0 ? profitAfterAds : netProfit));
    document.getElementById('roas_cr_display').innerText = cr + '%';
    document.getElementById('roas_result_maxcpc').innerText = formatRupiah(Math.round(maxCPC));

    // Update Analisa Kesehatan Iklan with ROAS data
    updateAdsAnalysisFromROAS(price, netProfit, roasBE, cr);
}

// Auto Mode ROAS Calculation - uses stored product data directly
function calculateAutoModeROAS(product) {
    const hpp = product.cost_of_goods || product.hpp || 0;
    const price = product.display_price || product.displayPrice || product.selling_price || product.sellingPrice || 0;
    const profit = product.result_profit || product.profit || 0;
    const cr = 2; // Default conversion rate

    // Use stored profit directly - this matches what was calculated when product was saved
    const netProfit = profit;

    let roasBE = 0;
    let acosMax = 0;
    let maxCPC = 0;

    if (netProfit > 0 && price > 0) {
        roasBE = price / netProfit;
        acosMax = (netProfit / price) * 100;
        maxCPC = netProfit * (cr / 100);
    }

    // Store Auto mode data for use by Analisa Kesehatan Iklan
    roasAutoData = {
        price: price,
        netProfit: netProfit,
        roasBE: roasBE,
        isActive: true
    };

    // Update result display
    document.getElementById('roas_result_be').innerText = roasBE.toFixed(2) + 'x';
    document.getElementById('roas_result_acos').innerText = acosMax.toFixed(1) + '%';
    document.getElementById('roas_result_profit').innerText = formatRupiah(Math.round(netProfit));
    document.getElementById('roas_cr_display').innerText = cr + '%';
    document.getElementById('roas_result_maxcpc').innerText = formatRupiah(Math.round(maxCPC));

    // Update Analisa Kesehatan Iklan with ROAS data
    updateAdsAnalysisFromROAS(price, netProfit, roasBE, cr);
}

// Update Analisa Kesehatan Iklan using ROAS Calculator data
function updateAdsAnalysisFromROAS(price, netProfit, roasBE, cr) {
    // Update Target ROAS display
    const targetInputVal = parseFloat(document.getElementById('targetProfitMargin')?.value) || 15;
    let maxAdSpendTarget = 0;

    if (adsTargetType === 'percent') {
        const targetProfitVal = price * (targetInputVal / 100);
        maxAdSpendTarget = netProfit - targetProfitVal;
    } else {
        maxAdSpendTarget = netProfit - targetInputVal;
    }

    let targetRoas = 0;
    if (maxAdSpendTarget > 0) targetRoas = price / maxAdSpendTarget;

    const elTargetRoas = document.getElementById('targetROAS');
    if (elTargetRoas) {
        if (maxAdSpendTarget <= 0 || netProfit <= 0) {
            elTargetRoas.innerText = "Tidak Terjangkau";
            elTargetRoas.className = "text-xs font-bold text-red-500";
        } else {
            elTargetRoas.innerText = targetRoas.toFixed(2) + "x";
            elTargetRoas.className = "text-xs font-bold text-blue-600 dark:text-blue-400";
        }
    }

    // Update Profit Organik display
    setText('organicProfitDisplay', formatRupiah(Math.round(netProfit)));

    // Calculate CPC-based metrics
    const cpc = parseFloat(document.getElementById('cpc')?.value) || 0;
    const crAds = parseFloat(document.getElementById('cr')?.value) || cr;
    let adsCostPerSale = 0;
    if (cpc > 0 && crAds > 0) adsCostPerSale = cpc / (crAds / 100);

    setText('adsCostPerSales', formatRupiah(Math.round(adsCostPerSale)));
    setText('sumAdsCost', "-" + formatRupiah(Math.round(adsCostPerSale)));

    let actualRoas = 0;
    if (adsCostPerSale > 0) actualRoas = price / adsCostPerSale;
    setText('actualROAS', actualRoas.toFixed(2) + 'x');

    setText('breakEvenROAS', roasBE > 0 ? roasBE.toFixed(2) + 'x' : '∞');

    // Status Badges & Recommendation
    const statusBadge = document.getElementById('adsStatusBadge');
    const recText = document.getElementById('recommendationContent');

    if (statusBadge && recText) {
        if (cpc > 0 && crAds > 0 && price > 0) {
            if (netProfit <= 0) {
                statusBadge.innerText = "PRODUK RUGI";
                statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 mb-2";
                recText.innerText = "Produk rugi tanpa iklan, tidak disarankan beriklan.";
            } else if (adsCostPerSale > netProfit) {
                statusBadge.innerText = "BONCOS";
                statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2";
                const loss = adsCostPerSale - netProfit;
                recText.innerText = `Biaya iklan melebihi profit. Rugi ${formatRupiah(Math.round(loss))} per penjualan.`;
            } else if (targetProfitEnabled && targetRoas > 0 && actualRoas < targetRoas) {
                // Only check target ROAS when toggle is enabled
                statusBadge.innerText = "BELUM TARGET";
                statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 mb-2";
                const gap = ((targetRoas - actualRoas) / targetRoas * 100).toFixed(0);
                recText.innerText = `ROAS aktual ${actualRoas.toFixed(2)}x belum capai target ${targetRoas.toFixed(2)}x (kurang ${gap}%).`;
            } else {
                statusBadge.innerText = "PROFIT";
                statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2";
                const profitAfterAds = netProfit - adsCostPerSale;
                recText.innerText = `Kinerja iklan sehat! Profit setelah iklan ${formatRupiah(Math.round(profitAfterAds))} per penjualan.`;
            }
        } else {
            statusBadge.innerText = "BELUM ADA DATA";
            statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 mb-2";
            recText.innerText = "Masukkan CPC & Conversion Rate untuk melihat analisa.";
        }
    }
}

// ==================== MODULE 4: MARKETPLACE COMPARE ====================

const marketplaceFees = {
    shopee: { name: 'Shopee', admin: { A: 8, B: 7.5, C: 5.75, D: 4.25, E: 2.5 }, service: 6.0, color: '#EE4D2D' },
    tokopedia: { name: 'Tokopedia', admin: { A: 5.5, B: 5, C: 4, D: 3, E: 2 }, service: 4.5, color: '#03AC0E' },
    tiktok: { name: 'TikTok', admin: { A: 5, B: 4.5, C: 3.5, D: 2.5, E: 1.5 }, service: 4.0, color: '#000000' },
    lazada: { name: 'Lazada', admin: { A: 6, B: 5.5, C: 4.5, D: 3.5, E: 2 }, service: 5.0, color: '#10156F' }
};

function compareMarketplaceFull() {
    const hpp = parseFloat(document.getElementById('cmp_hpp')?.value) || 0;
    const price = parseFloat(document.getElementById('cmp_price')?.value) || 0;
    const category = document.getElementById('cmp_category')?.value || 'A';

    const resultsContainer = document.getElementById('cmp_results');
    if (!resultsContainer) return;

    if (hpp <= 0 || price <= 0) {
        resultsContainer.innerHTML = `
                    <div class="text-center text-slate-400 py-10 col-span-4">
                        <i class="fas fa-info-circle text-2xl mb-2"></i>
                        <p class="text-sm">Masukkan HPP dan Harga Jual untuk melihat perbandingan</p>
                    </div>`;
        return;
    }

    const results = [];

    for (const [key, mp] of Object.entries(marketplaceFees)) {
        const adminPct = mp.admin[category] || mp.admin.A;
        const servicePct = mp.service;
        const totalFeePct = adminPct + servicePct;
        const totalFee = price * (totalFeePct / 100);
        const profit = price - hpp - totalFee;
        const margin = (profit / price) * 100;
        const roasBE = profit > 0 ? (price / profit) : 0;

        results.push({
            key, name: mp.name, color: mp.color,
            adminPct, servicePct, totalFeePct, totalFee,
            profit, margin, roasBE
        });
    }

    // Sort by profit descending
    results.sort((a, b) => b.profit - a.profit);

    let html = '';
    results.forEach((r, idx) => {
        const isBest = idx === 0;
        const profitClass = r.profit >= 0 ? 'text-emerald-600' : 'text-red-500';

        html += `
                    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border ${isBest ? 'border-2 border-orange-400 ring-2 ring-orange-100' : 'border-slate-100 dark:border-slate-700'} p-5 transition-colors">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full" style="background: ${r.color}"></div>
                                <span class="font-bold text-slate-800 dark:text-white">${r.name}</span>
                            </div>
                            ${isBest ? '<span class="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">👑 Best</span>' : ''}
                        </div>
                        <div class="text-center mb-4">
                            <div class="text-xs text-slate-400 mb-1">Net Profit</div>
                            <div class="text-2xl font-black ${profitClass}">${formatRupiah(Math.round(r.profit))}</div>
                            <div class="text-xs text-slate-500">Margin: ${r.margin.toFixed(1)}%</div>
                        </div>
                        <div class="space-y-2 text-xs">
                            <div class="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>Admin Fee</span>
                                <span>${r.adminPct}%</span>
                            </div>
                            <div class="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>Service Fee</span>
                                <span>${r.servicePct}%</span>
                            </div>
                            <div class="flex justify-between font-bold text-slate-700 dark:text-slate-200 pt-1 border-t border-slate-100 dark:border-slate-700">
                                <span>Total Fee</span>
                                <span>${r.totalFeePct.toFixed(1)}%</span>
                            </div>
                            <div class="flex justify-between text-slate-500 dark:text-slate-400 pt-2">
                                <span>ROAS Break-even</span>
                                <span class="font-bold text-purple-600">${r.roasBE.toFixed(2)}x</span>
                            </div>
                        </div>
                    </div>`;
    });

    resultsContainer.innerHTML = html;
}

// ==================== MODULE 5: ADS ANALYZER ====================

function saveProductDB() {
    localStorage.setItem('productDB', JSON.stringify(productDB));
}

function renderProductDB() {
    const container = document.getElementById('productDbContainer');
    if (!container) return;

    if (productDB.length === 0) {
        container.innerHTML = `
                    <div class="text-center text-xs text-slate-400 py-8">
                        <i class="fas fa-box-open text-3xl mb-2 block opacity-50"></i>
                        Belum ada produk<br>
                        <span class="text-[10px]">Tambah produk dengan HPP untuk matching</span>
                    </div>`;
        return;
    }

    let html = '<div class="divide-y divide-slate-100 dark:divide-slate-700">';
    productDB.forEach((p, idx) => {
        html += `
                    <div class="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between">
                        <div class="flex-1 min-w-0">
                            <div class="text-xs font-bold text-slate-700 dark:text-white truncate">${p.name}</div>
                            <div class="text-[10px] text-slate-400">ID: ${p.productId} | HPP: ${formatRupiah(p.hpp)}</div>
                        </div>
                        <button onclick="deleteProduct(${idx})" class="text-red-400 hover:text-red-600 p-1">
                            <i class="fas fa-trash text-xs"></i>
                        </button>
                    </div>`;
    });
    html += '</div>';
    container.innerHTML = html;

    // Also update product selectors in ROAS and Compare
    renderProductSelectors();
}

// Render product selectors in ROAS and Compare modules
function renderProductSelectors() {
    const options = productDB.map(p =>
        `<option value="${p.id}">${p.name} - ${formatRupiah(p.result_profit || p.profit || 0)}</option>`
    ).join('');

    // For Compare module - only options (combobox handles display)
    const cmpSelect = document.getElementById('cmp_product_select');
    if (cmpSelect) cmpSelect.innerHTML = options;

    // For ROAS module - only options (combobox handles display)
    const roasSelect = document.getElementById('roas_product_select');
    if (roasSelect) roasSelect.innerHTML = options;

    // Reset ROAS combobox display
    selectedProductId = null;
    const roasTextEl = document.getElementById('combobox-selected-text');
    if (roasTextEl) roasTextEl.innerText = 'Pilih produk...';

    // Reset Compare combobox display
    cmpSelectedProductId = null;
    const cmpTextEl = document.getElementById('cmp-combobox-selected-text');
    if (cmpTextEl) cmpTextEl.innerText = 'Pilih produk...';
}

// Save current product from Profit Calculator
function saveCurrentProduct() {
    try {
        // Helper to parse rupiah text to number
        // Helper to parse rupiah text to number
        const parseRupiahText = (text) => {
            if (!text) return 0;
            // Remove "Rp", spaces, and dots (thousands separator)
            // Keep comma as decimal separator, then replace with dot for JS parseFloat
            return Math.abs(parseFloat(text.replace(/[^\d,-]/g, '').replace(',', '.')) || 0);
        };

        // Input values - use parseInputNumber for formatted fields
        const hpp = parseInputNumber('hpp');
        const displayPrice = parseInputNumber('originalPrice');
        const discount = parseFloat(document.getElementById('discountPercent')?.value) || 0;
        const voucher = parseFloat(document.getElementById('sellerVoucher')?.value) || 0;
        const nameEl = document.getElementById('singleName');
        const name = nameEl?.value || 'Produk ' + (productDB.length + 1);

        if (hpp <= 0) {
            showToast('Masukkan HPP terlebih dahulu', 'error');
            return;
        }

        // Calculate selling price
        const sellingPrice = displayPrice > 0 ? displayPrice * (1 - discount / 100) : 0;

        // Get fee values from displayed results
        const adminFee = parseRupiahText(document.getElementById('valAdminFee')?.innerText);
        const serviceFee = parseRupiahText(document.getElementById('valServiceFee')?.innerText);
        const affiliateFee = parseRupiahText(document.getElementById('valAffiliate')?.innerText);
        const totalFee = adminFee + serviceFee + affiliateFee;
        const totalFeePercent = sellingPrice > 0 ? (totalFee / sellingPrice) * 100 : 0;

        // Get profit and margin from displayed results
        const profitText = document.getElementById('finalProfit')?.innerText || 'Rp 0';
        const profit = parseRupiahText(profitText);
        const isNegative = profitText.includes('-');

        const marginBadge = document.getElementById('finalMarginBadge')?.innerText || 'Margin: 0%';
        const marginMatch = marginBadge.match(/[\d.-]+/);
        const margin = marginMatch ? parseFloat(marginMatch[0]) : 0;

        // Get net cash
        const netCash = parseRupiahText(document.getElementById('valNetCash')?.innerText);

        // Get seller type and toggles
        const sellerType = document.getElementById('sellerType')?.value || 'non_star';
        const toggleFreeShip = document.getElementById('toggleFreeShip')?.checked || false;
        const toggleCashback = document.getElementById('toggleCashback')?.checked || false;

        // Get fee percentages
        const adminPercent = parseFloat(document.getElementById('adminFeePercent')?.value) || 0;
        const servicePercent = parseFloat(document.getElementById('serviceFeePercent')?.value) || 0;
        const affiliatePercent = parseFloat(document.getElementById('affiliatePercent')?.value) || 0;

        // Get other costs
        const orderProcessFee = parseFloat(document.getElementById('orderProcessFee')?.value) || 0;
        const fixedFee = parseFloat(document.getElementById('fixedFee')?.value) || 0;
        const operationalCost = parseFloat(document.getElementById('operationalCost')?.value) || 0;

        // Get category group
        const categoryGroup = document.getElementById('currentCategoryGroup')?.value || '';

        const product = {
            id: Date.now(),
            sku: 'SKU-' + Date.now().toString().slice(-6),
            name: name.trim() || 'Produk ' + (productDB.length + 1),

            // Input data
            cost_of_goods: hpp,
            display_price: displayPrice,
            discount_percent: discount,
            selling_price: sellingPrice || displayPrice,
            voucher_amount: voucher,

            // Fee breakdown (Rp)
            fee_admin: adminFee,
            fee_service: serviceFee,
            fee_affiliate: affiliateFee,
            fee_total: totalFee,
            fee_total_percent: Math.round(totalFeePercent * 10) / 10,

            // Fee percentages
            admin_percent: adminPercent,
            service_percent: servicePercent,
            affiliate_percent: affiliatePercent,

            // Toggles
            toggle_freeship: toggleFreeShip,
            toggle_cashback: toggleCashback,

            // Other costs
            order_process_fee: orderProcessFee,
            fixed_fee: fixedFee,
            operational_cost: operationalCost,
            custom_costs: typeof customCosts !== 'undefined' ? JSON.parse(JSON.stringify(customCosts)) : [],

            // Results
            result_profit: isNegative ? -profit : profit,
            result_margin: margin,
            result_net_cash: netCash,

            // Meta
            category: (selectedPath && selectedPath.l1) ? [selectedPath.l1, selectedPath.l2, selectedPath.l3].filter(Boolean).join(' > ') : '',
            category_group: categoryGroup,
            platform: currentPlatform || 'shopee',
            seller_type: sellerType,
            created_at: new Date().toISOString()
        };

        productDB.push(product);
        saveProductDB();
        renderProductDB();
        renderHistory(); // Update history display
        showToast(`Produk "${product.name}" berhasil disimpan!`, 'success');
    } catch (error) {
        console.error('Save error:', error);
        alert('Error: ' + error.message);
    }
}

// Load product data to ROAS Calculator
function loadProductToROAS() {
    const id = document.getElementById('roas_product_select')?.value;
    const card = document.getElementById('roas_product_card');
    const emptyHelper = document.getElementById('roas_auto_empty');

    // Hide card and show empty helper if no product selected
    if (!id) {
        if (card) card.classList.add('hidden');
        if (emptyHelper) emptyHelper.classList.remove('hidden');
        // Reset ROAS results
        document.getElementById('roas_result_be').innerText = '0.00x';
        document.getElementById('roas_result_acos').innerText = '0%';
        document.getElementById('roas_result_profit').innerText = 'Rp 0';
        document.getElementById('roas_result_maxcpc').innerText = 'Rp 0';
        return;
    }

    const product = productDB.find(p => p.id == id);
    if (!product) return;

    // Hide empty helper when product is selected
    if (emptyHelper) emptyHelper.classList.add('hidden');

    // Fill input fields (with fallbacks for old data format)
    const hpp = product.cost_of_goods || product.hpp || 0;
    const displayPrice = product.display_price || product.displayPrice || product.selling_price || product.sellingPrice || 0;
    const feePercent = product.fee_total_percent || product.totalFeePercent || 12;
    const profit = product.result_profit || product.profit || 0;
    const margin = product.result_margin || product.margin || 0;
    const totalFee = product.fee_total || product.totalFee || 0;

    // Fee breakdown
    const adminFee = product.fee_admin || 0;
    const serviceFee = product.fee_service || 0;
    const processFee = product.order_process_fee || 0;
    const fixedFee = product.fixed_fee || 0;
    const affiliateFee = product.fee_affiliate || 0;

    // DO NOT update manual fields - keep Auto and Manual modes separate
    // Manual mode should use its own input fields

    // Show and populate info card
    if (card) {
        card.classList.remove('hidden');
        document.getElementById('roas_card_name').innerText = product.name;
        document.getElementById('roas_card_hpp').innerText = formatRupiah(hpp);
        document.getElementById('roas_card_price').innerText = formatRupiah(displayPrice);
        document.getElementById('roas_card_profit').innerText = (profit >= 0 ? '' : '-') + formatRupiah(Math.abs(profit));
        document.getElementById('roas_card_margin').innerText = margin.toFixed(1) + '%';

        // Fee breakdown
        document.getElementById('roas_card_admin').innerText = '-' + formatRupiah(Math.round(adminFee));
        document.getElementById('roas_card_service').innerText = '-' + formatRupiah(Math.round(serviceFee));
        document.getElementById('roas_card_process').innerText = '-' + formatRupiah(Math.round(processFee));
        document.getElementById('roas_card_fixed').innerText = '-' + formatRupiah(Math.round(fixedFee));
        document.getElementById('roas_card_affiliate').innerText = '-' + formatRupiah(Math.round(affiliateFee));
        document.getElementById('roas_card_fee').innerText = `-${formatRupiah(Math.round(totalFee))} (${feePercent}%)`;
    }

    // Calculate ROAS directly from product data (Auto mode)
    calculateAutoModeROAS(product);
    showToast(`Loaded: ${product.name}`, 'info');
}

// Load product data to Compare module
function loadProductToCompare() {
    const id = document.getElementById('cmp_product_select')?.value;
    const card = document.getElementById('cmp_product_card');

    // Hide card if no product selected
    if (!id) {
        if (card) card.classList.add('hidden');
        return;
    }

    const product = productDB.find(p => p.id == id);
    if (!product) return;

    // Fill input fields (with fallbacks for old data format)
    const hpp = product.cost_of_goods || product.hpp || 0;
    const sellingPrice = product.selling_price || product.sellingPrice || 0;
    const profit = product.result_profit || product.profit || 0;
    const margin = product.result_margin || product.margin || 0;

    document.getElementById('cmp_hpp').value = hpp;
    document.getElementById('cmp_price').value = sellingPrice;

    // Show and populate info card
    if (card) {
        card.classList.remove('hidden');
        document.getElementById('cmp_card_name').innerText = product.name;
        document.getElementById('cmp_card_hpp').innerText = formatRupiah(hpp);
        document.getElementById('cmp_card_profit').innerText = (profit >= 0 ? '' : '-') + formatRupiah(Math.abs(profit));
        document.getElementById('cmp_card_margin').innerText = margin.toFixed(1) + '%';
    }

    compareMarketplaceFull();
    showToast(`Loaded: ${product.name}`, 'info');
}

function openAddProductModal() {
    const productId = prompt('Masukkan Product ID / Kode Produk:');
    if (!productId) return;

    const name = prompt('Nama Produk:');
    if (!name) return;

    const hppStr = prompt('HPP (Modal Produk):');
    const hpp = parseFloat(hppStr) || 0;
    if (hpp <= 0) {
        showToast('HPP harus lebih dari 0', 'error');
        return;
    }

    productDB.push({ id: Date.now(), productId: productId.trim(), name: name.trim(), hpp });
    saveProductDB();
    renderProductDB();
    showToast('Produk berhasil ditambahkan!', 'success');
}

let pendingDeleteIdx = null;
let pendingDeleteType = null; // 'product' or 'history'

function deleteProduct(idx) {
    const product = productDB[idx];
    if (!product) return;

    pendingDeleteIdx = idx;
    pendingDeleteType = 'product';
    document.getElementById('deleteProductName').innerText = product.name || 'Produk';
    document.getElementById('deleteConfirmDialog').classList.remove('hidden');
}

function closeDeleteDialog() {
    document.getElementById('deleteConfirmDialog').classList.add('hidden');
    pendingDeleteIdx = null;
    pendingDeleteType = null;
    pendingDeleteHistoryId = null;
    pendingDeleteHistorySource = null;
}

function confirmDelete() {
    // Handle history/riwayat deletion
    if (pendingDeleteHistoryId !== null) {
        confirmDeleteHistoryItem();
        return;
    }
    // Handle product DB deletion
    if (pendingDeleteIdx !== null && pendingDeleteType === 'product') {
        const productName = productDB[pendingDeleteIdx]?.name || 'Produk';
        productDB.splice(pendingDeleteIdx, 1);
        saveProductDB();
        renderProductDB();
        renderProductSelectors();
        showToast(`"${productName}" berhasil dihapus`, 'info');
    }
    closeDeleteDialog();
}

function handleCSVUpload(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        parseAndAnalyzeCSV(text, file.name);
    };
    reader.readAsText(file);
}

function parseAndAnalyzeCSV(csvText, filename) {
    const lines = csvText.split('\\n').filter(l => l.trim());
    if (lines.length < 2) {
        showToast('File CSV kosong atau tidak valid', 'error');
        return;
    }

    // Detect platform from headers
    const headers = lines[0].toLowerCase();
    let platform = 'unknown';
    if (headers.includes('product id') || headers.includes('product_id')) {
        platform = 'tiktok';
    } else if (headers.includes('kode produk') || headers.includes('kode_produk')) {
        platform = 'shopee';
    }

    showToast(`Menganalisis ${lines.length - 1} baris data dari ${platform.toUpperCase()}...`, 'info');

    // Parse CSV (simple parser)
    const headerRow = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length >= headerRow.length) {
            const row = {};
            headerRow.forEach((h, idx) => row[h] = values[idx]);
            data.push(row);
        }
    }

    // Analyze data
    analyzeAdsData(data, platform);
}

function analyzeAdsData(data, platform) {
    const resultsDiv = document.getElementById('adsAnalysisResults');
    const contentDiv = document.getElementById('adsResultsContent');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    let productIdKey = platform === 'tiktok' ? 'product id' : 'kode produk';
    let revenueKey = platform === 'tiktok' ? 'gross revenue' : 'omzet';
    let costKey = platform === 'tiktok' ? 'cost' : 'biaya iklan';
    let ordersKey = platform === 'tiktok' ? 'orders (sku)' : 'pesanan';

    let totalRevenue = 0;
    let totalAdCost = 0;
    let totalOrders = 0;
    let matched = 0;
    let unmatched = 0;
    let results = [];

    data.forEach(row => {
        const pid = row[productIdKey] || '';
        const revenue = parseFloat(row[revenueKey]?.replace(/[^0-9.-]/g, '')) || 0;
        const adCost = parseFloat(row[costKey]?.replace(/[^0-9.-]/g, '')) || 0;
        const orders = parseInt(row[ordersKey]) || 0;

        totalRevenue += revenue;
        totalAdCost += adCost;
        totalOrders += orders;

        // Find matching product in DB
        const matchedProduct = productDB.find(p =>
            p.productId.toLowerCase() === pid.toLowerCase() ||
            pid.toLowerCase().includes(p.productId.toLowerCase())
        );

        if (matchedProduct) {
            matched++;
            const hppTotal = matchedProduct.hpp * orders;
            const estimatedFee = revenue * 0.12; // Assume 12% marketplace fee
            const realProfit = revenue - hppTotal - adCost - estimatedFee;

            results.push({
                productId: pid,
                name: matchedProduct.name,
                revenue, adCost, orders,
                hpp: matchedProduct.hpp,
                hppTotal, estimatedFee, realProfit,
                roas: adCost > 0 ? (revenue / adCost) : 0
            });
        } else {
            unmatched++;
        }
    });

    // Sort by profit
    results.sort((a, b) => b.realProfit - a.realProfit);

    // Calculate totals
    const totalHPP = results.reduce((s, r) => s + r.hppTotal, 0);
    const totalFee = results.reduce((s, r) => s + r.estimatedFee, 0);
    const totalProfit = results.reduce((s, r) => s + r.realProfit, 0);

    let html = `
                <div class="grid grid-cols-4 gap-3 mb-6">
                    <div class="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-center">
                        <div class="text-xs text-blue-600 mb-1">Total Omzet</div>
                        <div class="font-bold text-blue-700 dark:text-blue-300">${formatRupiah(totalRevenue)}</div>
                    </div>
                    <div class="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-center">
                        <div class="text-xs text-red-600 mb-1">Biaya Iklan</div>
                        <div class="font-bold text-red-700 dark:text-red-300">${formatRupiah(totalAdCost)}</div>
                    </div>
                    <div class="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg text-center">
                        <div class="text-xs text-amber-600 mb-1">Total HPP</div>
                        <div class="font-bold text-amber-700 dark:text-amber-300">${formatRupiah(totalHPP)}</div>
                    </div>
                    <div class="${totalProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'} p-3 rounded-lg text-center">
                        <div class="text-xs ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} mb-1">Real Profit</div>
                        <div class="font-bold ${totalProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700'}">${formatRupiah(totalProfit)}</div>
                    </div>
                </div>
                <div class="text-xs text-slate-500 mb-4">
                    <span class="text-emerald-600 font-bold">${matched}</span> produk matched | 
                    <span class="text-amber-600 font-bold">${unmatched}</span> tidak ditemukan di database
                </div>`;

    if (results.length > 0) {
        html += `<div class="overflow-x-auto">
                    <table class="w-full text-xs">
                        <thead class="bg-slate-100 dark:bg-slate-700">
                            <tr>
                                <th class="text-left p-2">Produk</th>
                                <th class="text-right p-2">Omzet</th>
                                <th class="text-right p-2">Ad Cost</th>
                                <th class="text-right p-2">HPP</th>
                                <th class="text-right p-2">Profit</th>
                                <th class="text-right p-2">ROAS</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-700">`;

        results.forEach(r => {
            const profitClass = r.realProfit >= 0 ? 'text-emerald-600' : 'text-red-500';
            html += `
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td class="p-2">
                                <div class="font-bold text-slate-700 dark:text-white">${r.name}</div>
                                <div class="text-[10px] text-slate-400">${r.productId}</div>
                            </td>
                            <td class="text-right p-2">${formatRupiah(r.revenue)}</td>
                            <td class="text-right p-2 text-red-500">${formatRupiah(r.adCost)}</td>
                            <td class="text-right p-2">${formatRupiah(r.hppTotal)}</td>
                            <td class="text-right p-2 font-bold ${profitClass}">${formatRupiah(Math.round(r.realProfit))}</td>
                            <td class="text-right p-2">${r.roas.toFixed(2)}x</td>
                        </tr>`;
        });

        html += '</tbody></table></div>';
    }

    contentDiv.innerHTML = html;
}

// ==================== NEW UI/UX FUNCTIONS ====================

// Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}


// Copy Results to Clipboard
function copyResults() {
    const profit = document.getElementById('finalProfit')?.innerText || 'Rp 0';
    const margin = document.getElementById('finalMarginBadge')?.innerText || 'Margin: 0%';
    const price = document.getElementById('sumSellingPrice')?.innerText || 'Rp 0';
    const hpp = document.getElementById('hpp')?.value || '0';

    const text = `Hasil Kalkulasi CekBiayaJualan\n\nHarga Jual: ${price}\nHPP: Rp ${Number(hpp).toLocaleString('id-ID')}\nLaba Bersih: ${profit}\n${margin}`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Hasil disalin ke clipboard!', 'success');
    }).catch(() => {
        showToast('Gagal menyalin', 'error');
    });
}

// Update Profit Health Indicator
function updateProfitHealth(marginPct, profit) {
    const healthFill = document.getElementById('profitHealthFill');
    const healthText = document.getElementById('healthStatusText');
    const mobileBar = document.getElementById('mobileProfit');

    if (!healthFill || !healthText) return;

    let width, healthClass, statusText;

    if (profit < 0) {
        width = 10; healthClass = 'danger'; statusText = '⚠️ Rugi';
    } else if (marginPct < 5) {
        width = 25; healthClass = 'danger'; statusText = '⚠️ Margin Tipis';
    } else if (marginPct < 10) {
        width = 45; healthClass = 'warning'; statusText = '⚡ Hati-hati';
    } else if (marginPct < 15) {
        width = 65; healthClass = 'warning'; statusText = '👍 Cukup';
    } else if (marginPct < 25) {
        width = 80; healthClass = 'healthy'; statusText = '✅ Sehat';
    } else {
        width = 95; healthClass = 'healthy'; statusText = '🚀 Sangat Sehat';
    }

    healthFill.style.width = width + '%';
    healthFill.className = `profit-health-fill ${healthClass}`;
    healthText.innerText = statusText;

    // Update mobile bar color
    if (mobileBar) {
        mobileBar.classList.toggle('negative', profit < 0);
    }
}

// Update Mobile Profit Bar
function updateMobileProfit(profit, marginPct) {
    const mobileProfitEl = document.getElementById('mobileProfitValue');
    const mobileMarginEl = document.getElementById('mobileMarginValue');

    if (mobileProfitEl) mobileProfitEl.innerText = formatRupiah(profit);
    if (mobileMarginEl) mobileMarginEl.innerText = marginPct.toFixed(1) + '%';
}

/**
 * Debounce utility for performance
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait (default: 150)
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 150) {
    // Use DebounceUtils if available, otherwise use local implementation
    if (typeof DebounceUtils !== 'undefined') {
        return DebounceUtils.debounce(func, wait);
    }
    return function executedFunction(...args) {
        clearTimeout(calculateTimeout);
        calculateTimeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Create debounced version of calculate for input handlers
const debouncedCalculate = debounce(function () {
    if (typeof calculate === 'function') calculate();
}, 150);

// Animate value change
function animateValue(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.add('updating');
    setTimeout(() => el.classList.remove('updating'), 200);
}

// ==================== NEW FEATURE FUNCTIONS ====================

// Helper for Modal Animation
function openHistoryDetail(id) {
    const history = getHistory();
    // Also check for product from DB if not found in history
    let item = history.find(h => h.id === id);

    if (!item) {
        // Try from productDB
        const product = productDB.find(p => p.id.toString() === id);
        if (product) {
            // Normalize product to history format
            item = {
                id: product.id.toString(),
                productName: product.name,
                platform: product.platform || 'shopee',
                timestamp: product.created_at || new Date().toISOString(),
                sellingPrice: formatRupiah(product.display_price || product.displayPrice || 0),
                hpp: product.cost_of_goods || product.hpp || 0,
                discount: product.discount_percent || product.discount || 0,
                profit: formatRupiah(product.result_profit || product.profit || 0),
                margin: (product.result_margin || product.margin || 0) + '%',
                adminFee: product.fee_admin || product.cost_admin || 0,
                serviceFee: product.fee_service || product.cost_service || 0,
                otherFee: (product.fee_affiliate || 0) + (product.cost_packing || 0) + (product.cost_shipping || 0)
            };
            // Raw values for re-loading
            item.raw = product;
        }
    }

    if (!item) return;

    // Populate Modal
    document.getElementById('histDetailTitle').innerText = item.productName || 'Tanpa Nama';
    const date = new Date(item.timestamp);
    document.getElementById('histDetailDate').innerText = date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Set Platform Icon
    const iconContainer = document.getElementById('histDetailPlatformIcon');
    iconContainer.innerHTML = getPlatformIcon(item.platform);

    // Financials
    const isLoss = item.profit.includes('-');
    document.getElementById('histDetailProfit').innerText = item.profit;
    document.getElementById('histDetailProfit').className = `text-lg font-bold ${isLoss ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`;

    document.getElementById('histDetailMargin').innerText = item.margin;
    document.getElementById('histDetailMargin').className = `text-lg font-bold ${isLoss ? 'text-red-600 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`;

    // Details
    document.getElementById('histDetailHPP').innerText = formatRupiah(item.hpp);
    document.getElementById('histDetailPrice').innerText = item.sellingPrice;
    document.getElementById('histDetailDiscount').innerText = item.discount + '%';

    // Fees
    // Note: History item might not have detailed fee breakdown unless added during save. 
    // Fallback to calculation if missing, or generic '0'
    document.getElementById('histDetailAdmin').innerText = formatRupiah(item.adminFee || 0);
    document.getElementById('histDetailServices').innerText = formatRupiah(item.serviceFee || 0);
    document.getElementById('histDetailOther').innerText = formatRupiah(item.otherFee || 0);

    // Setup Buttons
    const loadBtn = document.getElementById('histDetailLoadBtn');
    // Remove previous event listeners by cloning
    const newLoadBtn = loadBtn.cloneNode(true);
    loadBtn.parentNode.replaceChild(newLoadBtn, loadBtn);
    newLoadBtn.onclick = () => {
        loadFromHistory(id);
        closeHistoryDetail();
    };

    const delBtn = document.getElementById('histDetailDeleteBtn');
    const newDelBtn = delBtn.cloneNode(true);
    delBtn.parentNode.replaceChild(newDelBtn, delBtn);
    newDelBtn.onclick = () => {
        deleteHistoryItem(id);
        closeHistoryDetail();
    };

    // Show Modal
    const modal = document.getElementById('historyDetailModal');
    const backdrop = document.getElementById('histDetailBackdrop');
    const panel = document.getElementById('histDetailPanel');

    modal.classList.remove('hidden');
    // Transition in
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        panel.classList.remove('opacity-0', 'translate-y-4', 'sm:scale-95');
        panel.classList.add('opacity-100', 'translate-y-0', 'sm:scale-100');
    }, 10);
}

function closeHistoryDetail() {
    const modal = document.getElementById('historyDetailModal');
    const backdrop = document.getElementById('histDetailBackdrop');
    const panel = document.getElementById('histDetailPanel');

    // Transition out
    backdrop.classList.add('opacity-0');
    panel.classList.remove('opacity-100', 'translate-y-0', 'sm:scale-100');
    panel.classList.add('opacity-0', 'translate-y-4', 'sm:scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Feature 1: Monthly Sales Simulation (Existing)
// ==================== SIMULATION CARD LOGIC ====================
let simMode = 'ads'; // 'ads' or 'sales'

function setSimMode(mode) {
    simMode = mode;
    const btnAds = document.getElementById('btnSimAds');
    const btnSales = document.getElementById('btnSimSales');
    const viewAds = document.getElementById('sim-view-ads');
    const viewSales = document.getElementById('sim-view-sales');

    const activeClass = "px-2 py-1 text-[10px] font-bold rounded-md bg-violet-600 text-white shadow-sm transition-all";
    const inactiveClass = "px-2 py-1 text-[10px] font-bold rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all";

    if (mode === 'ads') {
        btnAds.className = activeClass;
        btnSales.className = inactiveClass;
        viewAds.classList.remove('hidden');
        viewSales.classList.add('hidden');
    } else {
        btnSales.className = activeClass;
        btnAds.className = inactiveClass;
        viewSales.classList.remove('hidden');
        viewAds.classList.add('hidden');
    }
    calculateMonthlyProjection(); // Refresh data
}

function calculateMonthlyProjection() {
    // Get base data from Module 1 (Single)
    let profit = 0;
    let sellingPrice = 0;

    // Ensure we handle defaults if DOM elements are missing or empty
    const elProfit = document.getElementById('finalProfit');
    const elPrice = document.getElementById('finalPriceDisplay');

    if (elProfit && elPrice) {
        profit = parseRupiah(elProfit.innerText || '0');
        sellingPrice = parseRupiah(elPrice.innerText || '0');
    }

    // --- Update Ads/ROAS View ---
    const elRoasBe = document.getElementById('simRoasBe');
    const elAcosBe = document.getElementById('simAcosBe');
    const elMaxCpc = document.getElementById('simMaxCpc');
    const elProfitUnit = document.getElementById('simProfitUnit');

    if (elRoasBe && elAcosBe) {
        if (profit > 0 && sellingPrice > 0) {
            const roasBe = sellingPrice / profit;
            const acosBe = (profit / sellingPrice) * 100;

            // Max CPC Est (Assume CR 2%)
            const maxCpc = profit * 0.02;

            elRoasBe.innerText = roasBe.toFixed(2) + "x";
            elAcosBe.innerText = acosBe.toFixed(1) + "%";
            if (elMaxCpc) elMaxCpc.innerText = formatRupiah(maxCpc);
            if (elProfitUnit) elProfitUnit.innerText = formatRupiah(profit);
        } else {
            elRoasBe.innerText = "∞";
            elAcosBe.innerText = "N/A";
            if (elMaxCpc) elMaxCpc.innerText = "Rp 0";
            if (elProfitUnit) elProfitUnit.innerText = formatRupiah(profit);
        }
    }

    // --- Update Sales View ---
    const elSalesInput = document.getElementById('monthlySalesInput');
    if (elSalesInput) {
        const qty = parseFloat(elSalesInput.value) || 0;
        const revenue = sellingPrice * qty;
        const totalProfit = profit * qty;
        const dailyProfit = totalProfit / 30;

        setText('monthlyRevenue', formatRupiah(revenue));
        setText('monthlyProfit', formatRupiah(totalProfit));
        setText('dailyProfit', formatRupiah(dailyProfit));
    }
}

// Feature 2: Calculation History with localStorage
function getHistory() {
    const data = localStorage.getItem('calcHistory');
    return data ? JSON.parse(data) : [];
}


// saveToHistory removed - all data now saved via saveCurrentProduct() to productDB

function renderHistory() {
    const container = document.getElementById('historyContainer');
    const history = getHistory();

    // Also include products from productDB, converting to history format (with fallbacks)
    const productDBConverted = productDB.map(p => {
        const hpp = p.cost_of_goods || p.hpp || 0;
        const displayPrice = p.display_price || p.displayPrice || p.selling_price || p.sellingPrice || 0;
        const profit = p.result_profit || p.profit || 0;
        const margin = p.result_margin || p.margin || 0;
        const createdAt = p.created_at || p.createdAt;

        return {
            id: p.id.toString(),
            timestamp: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
            productName: p.name,
            sellingPrice: formatRupiah(displayPrice),
            hpp: hpp,
            displayPrice: displayPrice,
            discount: p.discount_percent || p.discount || 0,
            voucher: p.voucher_amount || p.voucher || 0,
            profit: profit >= 0 ? formatRupiah(profit) : '-' + formatRupiah(Math.abs(profit)),
            profitNum: profit,
            margin: margin.toFixed(1) + '%',
            marginNum: margin,
            platform: p.platform,
            source: 'productDB'
        };
    });

    // Get sort option from dropdown
    const sortOption = document.getElementById('historySortSelect')?.value || 'newest';

    // Combine all items
    let combined = [...history.map(h => ({
        ...h,
        source: 'history',
        profitNum: parseRupiah(h.profit || '0') * (h.profit?.includes('-') ? -1 : 1),
        marginNum: parseFloat(h.margin) || 0
    })), ...productDBConverted];

    // Apply sort based on selection
    switch (sortOption) {
        case 'oldest':
            combined.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            break;
        case 'profit-high':
            combined.sort((a, b) => b.profitNum - a.profitNum);
            break;
        case 'profit-low':
            combined.sort((a, b) => a.profitNum - b.profitNum);
            break;
        case 'margin-high':
            combined.sort((a, b) => b.marginNum - a.marginNum);
            break;
        case 'margin-low':
            combined.sort((a, b) => a.marginNum - b.marginNum);
            break;
        case 'name-az':
            combined.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
            break;
        case 'name-za':
            combined.sort((a, b) => (b.productName || '').localeCompare(a.productName || ''));
            break;
        case 'newest':
        default:
            combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    combined = combined.slice(0, 50); // Keep max 50 items

    if (combined.length === 0) {
        container.innerHTML = `
                    <div class="text-center text-xs text-slate-400 py-6">
                        <i class="fas fa-inbox text-2xl mb-2 block opacity-50"></i>
                        Belum ada riwayat tersimpan
                    </div>`;
        return;
    }

    container.innerHTML = combined.map(h => {
        const isLoss = (h.profit || '').toString().includes('-');
        return `
                <div onclick="openHistoryDetail('${h.id}')"
                    class="bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer relative group">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-600 text-xs">
                                ${getPlatformIcon(h.platform)}
                            </div>
                            <div>
                                <div class="font-medium text-xs text-slate-700 dark:text-gray-200 text-ellipsis overflow-hidden whitespace-nowrap max-w-[120px]" title="${h.productName || 'Tanpa Nama'}">${h.productName || 'Tanpa Nama'}</div>
                                <div class="text-[10px] text-slate-400">${new Date(h.timestamp).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>
                        <div class="text-right">
                             <div class="font-bold text-xs ${isLoss ? 'text-red-500' : 'text-green-600'}">${h.profit}</div>
                             <div class="text-[10px] ${isLoss ? 'text-red-400' : 'text-blue-500'} font-medium">${h.margin}</div>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-600">
                        <div>
                            Jual: <span class="text-slate-700 dark:text-slate-300">${h.sellingPrice}</span>
                        </div>
                         <div class="flex gap-2">
                            <button onclick="event.stopPropagation(); loadFromHistory('${h.id}')" class="text-xs text-blue-500 hover:text-blue-600 p-1" title="Muat Data">
                                <i class="fas fa-upload"></i>
                            </button>
                            <button onclick="event.stopPropagation(); deleteHistoryItem('${h.id}')" class="text-xs text-red-400 hover:text-red-500 p-1" title="Hapus">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
    }).join('');
}

function loadFromHistory(id) {
    // Check both calcHistory and productDB
    const history = getHistory();
    let entry = history.find(h => h.id === id);

    // If not found in history, check productDB
    if (!entry) {
        const product = productDB.find(p => p.id.toString() === id);
        if (product) {
            entry = {
                productName: product.name,
                hpp: product.cost_of_goods || product.hpp || 0,
                displayPrice: product.display_price || product.displayPrice || 0,
                discount: product.discount_percent || product.discount || 0,
                voucher: product.voucher_amount || product.voucher || 0,
                platform: product.platform,
                // Seller type
                sellerType: product.seller_type || product.sellerType || 'nonstar',
                // Category
                category: product.category || '',
                categoryGroup: product.category_group || product.categoryGroup || '',
                // Fee percentages (snake_case -> camelCase)
                adminPercent: product.admin_percent || product.adminPercent || 0,
                servicePercent: product.service_percent || product.servicePercent || 0,
                affiliatePercent: product.affiliate_percent || product.affiliatePercent || 0,
                // Toggle states (snake_case -> camelCase)
                toggleFreeShip: product.toggle_freeship ?? product.toggleFreeShip ?? false,
                toggleCashback: product.toggle_cashback ?? product.toggleCashback ?? false,
                // Other costs (snake_case -> camelCase)
                orderProcessFee: product.order_process_fee || product.orderProcessFee || 0,
                fixedFee: product.fixed_fee || product.fixedFee || 0,
                operationalCost: product.operational_cost || product.operationalCost || 0,
                // Custom costs
                customCosts: product.custom_costs || product.customCosts || []
            };
        }
    }

    if (!entry) return;

    // Load all values back to form
    if (document.getElementById('singleName')) {
        document.getElementById('singleName').value = entry.productName || entry.name || '';
    }
    if (document.getElementById('hpp')) {
        document.getElementById('hpp').value = entry.hpp || 0;
    }
    if (document.getElementById('originalPrice')) {
        document.getElementById('originalPrice').value = entry.displayPrice || 0;
    }
    if (document.getElementById('discountPercent')) {
        document.getElementById('discountPercent').value = entry.discount || 0;
    }
    if (document.getElementById('sellerVoucher')) {
        document.getElementById('sellerVoucher').value = entry.voucher || 0;
    }

    // Restore seller type
    if (document.getElementById('sellerType') && entry.sellerType) {
        document.getElementById('sellerType').value = entry.sellerType;
    }

    // Restore fee percentages
    if (document.getElementById('adminFeePercent') && entry.adminPercent !== undefined) {
        document.getElementById('adminFeePercent').value = entry.adminPercent;
    }
    if (document.getElementById('serviceFeePercent') && entry.servicePercent !== undefined) {
        document.getElementById('serviceFeePercent').value = entry.servicePercent;
    }
    if (document.getElementById('affiliatePercent') && entry.affiliatePercent !== undefined) {
        document.getElementById('affiliatePercent').value = entry.affiliatePercent;
    }

    // Restore other costs
    if (document.getElementById('orderProcessFee') && entry.orderProcessFee !== undefined) {
        document.getElementById('orderProcessFee').value = entry.orderProcessFee;
    }
    if (document.getElementById('fixedFee') && entry.fixedFee !== undefined) {
        document.getElementById('fixedFee').value = entry.fixedFee;
    }
    if (document.getElementById('operationalCost') && entry.operationalCost !== undefined) {
        document.getElementById('operationalCost').value = entry.operationalCost;
    }

    // Restore toggle states
    if (document.getElementById('toggleFreeShip') && entry.toggleFreeShip !== undefined) {
        document.getElementById('toggleFreeShip').checked = entry.toggleFreeShip;
    }
    if (document.getElementById('toggleCashback') && entry.toggleCashback !== undefined) {
        document.getElementById('toggleCashback').checked = entry.toggleCashback;
    }

    // Restore custom costs
    if (entry.customCosts && entry.customCosts.length > 0 && typeof customCosts !== 'undefined') {
        customCosts = entry.customCosts;
        if (typeof renderCustomCosts === 'function') renderCustomCosts();
    }

    // Restore category
    if (entry.category) {
        const parts = entry.category.split(' > ');
        const group = entry.categoryGroup || 'A';

        // Update global selectedPath
        selectedPath = {
            l1: parts[0] || null,
            l2: parts[1] || null,
            l3: parts[2] || null,
            group: group
        };

        // Update category display text
        const elText = document.getElementById('selectedCategoryText');
        if (elText) {
            elText.innerText = entry.category;
        }

        // Update category group hidden input
        const elGroup = document.getElementById('currentCategoryGroup');
        if (elGroup) {
            elGroup.value = group;
        }

        // Update category group badge
        const mainBadge = document.getElementById('categoryGroupBadge');
        if (mainBadge) {
            mainBadge.innerText = `Grup ${group}`;
            mainBadge.className = `text-[10px] px-1.5 py-0.5 rounded font-bold badge-${group}`;
            mainBadge.classList.remove('hidden');
        }
    }

    // Switch platform if different
    if (entry.platform && entry.platform !== currentPlatform) {
        switchPlatform(entry.platform);
    }

    // Update service fee based on toggle
    if (typeof updateServiceFee === 'function') updateServiceFee();

    showToast(`Data "${entry.productName || entry.name}" dimuat`, 'info');
    calculate();
}

function clearHistory() {
    if (!confirm('Hapus SEMUA riwayat kalkulasi dan database produk?\n\nTindakan ini tidak dapat dibatalkan.')) return;
    localStorage.removeItem('calcHistory');
    productDB = [];
    saveProductDB();
    renderHistory();
    renderProductDB();
    showToast('Semua riwayat dan database dihapus', 'info');
}

// Delete single history/product item
let pendingDeleteHistoryId = null;
let pendingDeleteHistorySource = null;

function deleteHistoryItem(id, source) {
    pendingDeleteHistoryId = id;
    pendingDeleteHistorySource = source;

    // Find item name
    let itemName = 'Item';
    if (source === 'productDB') {
        const product = productDB.find(p => p.id.toString() === id);
        itemName = product?.name || 'Produk';
    } else {
        const history = getHistory();
        const item = history.find(h => h.id === id);
        itemName = item?.name || 'Riwayat';
    }

    document.getElementById('deleteProductName').innerText = itemName;
    document.getElementById('deleteConfirmDialog').classList.remove('hidden');
}

function confirmDeleteHistoryItem() {
    if (pendingDeleteHistoryId === null) return;

    if (pendingDeleteHistorySource === 'productDB') {
        productDB = productDB.filter(p => p.id.toString() !== pendingDeleteHistoryId);
        saveProductDB();
        renderProductDB();
        renderProductSelectors();
    } else {
        const history = getHistory();
        const filtered = history.filter(h => h.id !== pendingDeleteHistoryId);
        localStorage.setItem('calcHistory', JSON.stringify(filtered));
    }

    renderHistory();
    showToast('Item berhasil dihapus', 'info');
    closeDeleteDialog();
}

// Feature 3: Marketplace Comparison
const marketplaceRates = {
    shopee: { admin: 6.5, service: 1.8, name: 'Shopee', color: 'orange' },
    tokopedia: { admin: 5.5, service: 1.0, name: 'Tokopedia', color: 'green' },
    tiktok: { admin: 4.5, service: 2.0, name: 'TikTok', color: 'slate' },
    lazada: { admin: 5.0, service: 1.5, name: 'Lazada', color: 'blue' }
};

function runMarketplaceComparison() {
    const hpp = parseFloat(document.getElementById('hpp')?.value) || 0;
    const sellingPrice = parseFloat(document.getElementById('sellingPrice')?.value) || 0;
    const discountPct = parseFloat(document.getElementById('discountPercent')?.value) || 0;
    const voucher = parseFloat(document.getElementById('voucher')?.value) || 0;
    const opsCost = parseFloat(document.getElementById('opsCost')?.value) || 0;

    if (sellingPrice === 0) {
        showToast('Masukkan harga jual terlebih dahulu', 'error');
        return;
    }

    const results = [];
    const platforms = [
        { id: 'shopee', checked: document.getElementById('cmpShopee')?.checked },
        { id: 'tokopedia', checked: document.getElementById('cmpTokopedia')?.checked },
        { id: 'tiktok', checked: document.getElementById('cmpTiktok')?.checked },
        { id: 'lazada', checked: document.getElementById('cmpLazada')?.checked }
    ];

    platforms.forEach(p => {
        if (!p.checked) return;

        const rates = marketplaceRates[p.id];
        const finalPrice = sellingPrice * (1 - discountPct / 100) - voucher;
        const adminFee = finalPrice * (rates.admin / 100);
        const serviceFee = finalPrice * (rates.service / 100);
        const totalDeduction = adminFee + serviceFee;
        const profit = finalPrice - hpp - opsCost - totalDeduction;
        const margin = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;

        results.push({
            ...rates,
            id: p.id,
            profit: profit,
            margin: margin,
            adminFee: adminFee,
            serviceFee: serviceFee
        });
    });

    // Sort by profit descending
    results.sort((a, b) => b.profit - a.profit);

    const container = document.getElementById('marketplaceCompareResults');
    if (results.length === 0) {
        container.innerHTML = `<div class="text-center text-xs text-slate-400 py-4">Pilih minimal 1 marketplace</div>`;
        return;
    }

    container.innerHTML = results.map((r, idx) => `
                <div class="flex items-center justify-between p-3 rounded-lg ${idx === 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-700/50'}">
                    <div class="flex items-center gap-2">
                        ${idx === 0 ? '<span class="text-emerald-500 text-sm"><i class="fas fa-crown"></i></span>' : '<span class="text-slate-300 text-sm"><i class="fas fa-store"></i></span>'}
                        <span class="font-bold text-sm text-slate-700 dark:text-slate-200">${r.name}</span>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-bold ${r.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}">${formatRupiah(r.profit)}</div>
                        <div class="text-[10px] text-slate-400">Margin ${r.margin.toFixed(1)}% • Fee ${formatRupiah(r.adminFee + r.serviceFee)}</div>
                    </div>
                </div>
            `).join('');

    showToast('Perbandingan selesai!', 'success');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    renderHistory();
    renderProductDB(); // Initialize Ads Analyzer product database
    // Show mobile profit bar on initial load (defaults to profit module)
    const mobileProfit = document.getElementById('mobileProfit');
    if (mobileProfit) mobileProfit.classList.add('show');
});


function toggleLanguage() {
    currentLang = currentLang === 'id' ? 'en' : 'id';
    document.getElementById('langLabel').innerText = currentLang.toUpperCase();
    applyLanguage();
}

function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });
    // Update placeholder texts if needed
    document.querySelector('#singleName').placeholder = currentLang === 'id' ? 'Contoh: Kemeja Pria' : 'Example: Men\'s Shirt';
    document.querySelector('#hpp').placeholder = currentLang === 'id' ? '50000' : '50000';
    document.querySelector('#originalPrice').placeholder = currentLang === 'id' ? '100000' : '100000';
    document.querySelector('#targetMarginInput').placeholder = currentLang === 'id' ? '20' : '20';
    document.querySelector('#voucherAmount').placeholder = currentLang === 'id' ? '0' : '0';
    document.querySelector('#maxServiceFee').placeholder = currentLang === 'id' ? '40000' : '40000';
    document.querySelector('#cpc').placeholder = currentLang === 'id' ? '0' : '0';
    document.querySelector('#cr').placeholder = currentLang === 'id' ? '2.0' : '2.0';
    document.querySelector('#dashClicks').placeholder = currentLang === 'id' ? 'Untuk hitung CPC' : 'To calculate CPC';
}

document.addEventListener('DOMContentLoaded', () => {
    setPlatform('shopee');
    renderCol1(getCategoryData());
    renderCustomCosts();
    initChart();
    addBulkRow();
    switchInputMode('single'); // Default to single
    applyLanguage(); // Apply language on load
});

function switchInputMode(mode) {
    inputMode = mode;
    const btnSingle = document.getElementById('btnInputSingle');
    const btnBulk = document.getElementById('btnInputBulk');
    const divSingle = document.getElementById('modeSingleContent');
    const divBulk = document.getElementById('modeBulkContent');
    const catSingle = document.getElementById('catSelectorSingle');
    const catBulk = document.getElementById('catSelectorBulk');

    if (mode === 'single') {
        btnSingle.className = "px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition-all";
        btnBulk.className = "px-3 py-1 text-xs font-bold rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all";
        divSingle.classList.remove('hidden');
        divBulk.classList.add('hidden');
        if (catSingle) catSingle.classList.remove('hidden');
        if (catBulk) catBulk.classList.add('hidden');
    } else {
        btnBulk.className = "px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition-all";
        btnSingle.className = "px-3 py-1 text-xs font-bold rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all";
        divBulk.classList.remove('hidden');
        divSingle.classList.add('hidden');
        if (catSingle) catSingle.classList.add('hidden');
        if (catBulk) catBulk.classList.remove('hidden');
    }
    calculate();
}

// --- BULK PRODUCT LOGIC ---
function addBulkRow() {
    const id = Date.now();
    products.push({
        id: id,
        name: '',
        categoryName: 'Pilih Kategori',
        categoryGroup: 'A',
        price: 0,
        discount: 0,
        voucher: 0,
        hpp: 0,
        profit: 0,
        // New fields for export
        finalSellingPrice: 0,
        adminFee: 0,
        serviceFee: 0,
        affiliateFee: 0,
        orderProcessFee: 0,
        fixedFee: 0,
        operationalCost: 0,
        customCostsTotal: 0,
        totalDeductions: 0,
        netIncome: 0
    });
    renderBulkTable();
    calculate();
}

function renderBulkTable() {
    const tbody = document.getElementById('bulkProductBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach((p, index) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group";
        tr.innerHTML = `
                    <td class="p-3 align-top">
                        <input type="text" value="${p.name}" oninput="updateProduct(${index}, 'name', this.value)"
                            class="w-full p-2 text-xs border border-slate-200 dark:border-slate-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-white" placeholder="Nama Produk...">
                    </td>
                    <td class="p-3 align-top">
                        <button onclick="openProductCategory(${index})"
                            class="w-full text-left p-2 text-xs border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 rounded text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 flex justify-between items-center transition-colors">
                            <span class="truncate max-w-[100px] font-medium">${p.categoryName}</span>
                            <span class="ml-1 text-[10px] px-1 rounded bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 font-bold">${p.categoryGroup}</span>
                        </button>
                    </td>
                    <td class="p-3 align-top">
                        <div class="relative">
                            <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">Rp</span>
                            <input type="number" value="${p.price || ''}" oninput="updateProduct(${index}, 'price', this.value)"
                                class="w-full pl-6 p-2 text-xs border border-slate-200 dark:border-slate-600 rounded font-medium text-slate-700 dark:text-white text-right bg-white dark:bg-slate-700" placeholder="0">
                        </div>
                    </td>
                    <td class="p-3 align-top">
                        <div class="relative">
                            <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">Rp</span>
                            <input type="number" value="${p.hpp || ''}" oninput="updateProduct(${index}, 'hpp', this.value)"
                                class="w-full pl-6 p-2 text-xs border border-slate-200 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 text-slate-700 dark:text-white" placeholder="0">
                        </div>
                    </td>
                    <td class="p-3 align-top">
                        <div class="relative">
                            <input type="number" value="${p.discount || ''}" oninput="updateProduct(${index}, 'discount', this.value)"
                                class="w-full pr-6 p-2 text-xs border border-slate-200 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 text-slate-700 dark:text-white" placeholder="0">
                            <span class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">%</span>
                        </div>
                    </td>
                    <td class="p-3 align-top">
                        <div class="relative">
                            <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">Rp</span>
                            <input type="number" value="${p.voucher || ''}" oninput="updateProduct(${index}, 'voucher', this.value)"
                                class="w-full pl-6 p-2 text-xs border border-slate-200 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 text-slate-700 dark:text-white" placeholder="0">
                        </div>
                    </td>
                    <td class="p-3 align-top text-center">
                        <div id="p-profit-${index}" class="text-right font-bold text-xs text-slate-400">Rp 0</div>
                    </td>
                    <td class="p-3 align-top text-center">
                        ${products.length > 1 ? `<button onclick="deleteProduct(${index})" class="text-red-400 hover:text-red-600 p-1"><i class="fas fa-trash-alt"></i></button>` : ''}
                    </td>
                `;
        tbody.appendChild(tr);
    });

    setText('productCountBadge', products.length);
}

function updateProduct(index, field, value) {
    if (products[index]) {
        if (field === 'name') products[index].name = value;
        else products[index][field] = parseFloat(value) || 0;
        calculate();
    }
}

function deleteProduct(index) {
    products.splice(index, 1);
    renderBulkTable();
    calculate();
}

function openProductCategory(index) {
    editingProductIndex = index;
    openCategoryModal();
}

// --- CATEGORY LOGIC (3-Column & Search) ---

function openCategoryModal() {
    document.getElementById('categoryModal').classList.remove('hidden');
    resetModalView();
}

function openSingleCategoryModal() {
    editingProductIndex = null;
    openCategoryModal();
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.add('hidden');
}

function resetModalView() {
    // Reset search input
    const searchInput = document.querySelector('#categoryModal input[type="text"]');
    if (searchInput) searchInput.value = '';

    // Show columns, hide search results
    document.getElementById('col1').classList.remove('hidden');
    document.getElementById('col2').classList.remove('hidden');
    document.getElementById('col3').classList.remove('hidden');
    document.getElementById('searchResultList').classList.add('hidden');

    renderCol1(getCategoryData());
    document.getElementById('col2').innerHTML = '';
    document.getElementById('col3').innerHTML = '';

    // Clear selection state visually
    document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));

    // Reset selection variables
    selectedPath = { l1: null, l2: null, l3: null, group: null }; // Default: No Group Selected

    // Reset Footer Text
    const footerText = document.getElementById('modalSelectionText');
    if (footerText) footerText.innerText = '-';
    const footerBadge = document.getElementById('modalGroupBadge');
    if (footerBadge) footerBadge.classList.add('hidden');

    // Disable Confirm Button
    const btn = document.getElementById('btnConfirmCat');
    if (btn) btn.disabled = true;
}

function filterCategories(query) {
    query = query.toLowerCase();
    const resultList = document.getElementById('searchResultList');
    const cols = [document.getElementById('col1'), document.getElementById('col2'), document.getElementById('col3')];

    if (!query) {
        // Revert to column view
        resultList.classList.add('hidden');
        cols.forEach(c => c.classList.remove('hidden'));
        return;
    }

    // Switch to list view
    cols.forEach(c => c.classList.add('hidden'));
    resultList.classList.remove('hidden');
    resultList.innerHTML = '';

    // Flatten and search
    let matches = [];

    getCategoryData().forEach(l1 => {
        if (l1.name.toLowerCase().includes(query)) {
            // Matches L1 logic could be added here
        }

        if (l1.subs) {
            l1.subs.forEach(l2 => {
                if (l2.subs) {
                    l2.subs.forEach(l3 => {
                        // Check matching in L3 (Specific Type) - most important
                        if (l3.name.toLowerCase().includes(query)) {
                            matches.push({ l1: l1, l2: l2, l3: l3 });
                        }
                    });
                }
            });
        }
    });

    if (matches.length === 0) {
        resultList.innerHTML = '<div class="p-4 text-center text-slate-400">Tidak ditemukan</div>';
        return;
    }

    matches.forEach(m => {
        const el = document.createElement('div');
        el.className = 'search-item text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 p-3 border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors';
        // Display Path: L1 > L2 > L3
        el.innerHTML = `<span class="font-semibold text-slate-800 dark:text-white">${m.l3.name}</span> <br><span class="text-xs text-slate-400">${m.l1.name} > ${m.l2.name}</span>`;

        // On click: Select this path
        el.onclick = () => {
            // Determine group: L3 group > L2 group > L1 group > 'A'
            const grp = m.l3.group || m.l2.group || m.l1.group || 'A';
            selectPath(m.l1.name, m.l2.name, m.l3.name, grp);
        };
        resultList.appendChild(el);
    });
}

// Manual Selection Logic (Columns)
function renderCol1(data) {
    const c = document.getElementById('col1'); c.innerHTML = '';
    data.forEach(x => {
        const el = document.createElement('div'); el.className = 'cat-item p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center transition-colors';
        // Show arrow only if has subs
        const arrow = (x.subs && x.subs.length > 0) ? '<i class="fas fa-chevron-right text-xs ml-2 text-slate-300 dark:text-slate-500"></i>' : '';
        el.innerHTML = `<span>${x.name}</span>${arrow}`;
        el.onclick = () => {
            // Highlight
            Array.from(c.children).forEach(child => child.classList.remove('active'));
            el.classList.add('active');

            if (x.subs) renderCol2(x.subs, x); // Pass L1 object to propagate group
            else {
                // No subs (unlikely for L1 but possible), select here
                selectPath(x.name, null, null, x.group || 'A');
            }
        };
        c.appendChild(el);
    });
}

function renderCol2(subs, parentL1) {
    const c = document.getElementById('col2'); c.innerHTML = '';
    document.getElementById('col3').innerHTML = ''; // Clear col3

    subs.forEach(x => {
        const el = document.createElement('div'); el.className = 'cat-item p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center transition-colors';
        const arrow = (x.subs && x.subs.length > 0) ? '<i class="fas fa-chevron-right text-xs ml-2 text-slate-300 dark:text-slate-500"></i>' : '';
        el.innerHTML = `<span>${x.name}</span>${arrow}`;
        el.onclick = () => {
            Array.from(c.children).forEach(child => child.classList.remove('active'));
            el.classList.add('active');

            if (x.subs) renderCol3(x.subs, parentL1, x);
            else selectPath(parentL1.name, x.name, null, x.group || parentL1.group || 'A');
        };
        c.appendChild(el);
    });
}

function renderCol3(subs, parentL1, parentL2) {
    const c = document.getElementById('col3'); c.innerHTML = '';

    subs.forEach(x => {
        const el = document.createElement('div'); el.className = 'cat-item p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors';
        // L3 leaf
        el.innerHTML = `<span>${x.name}</span>`;
        el.onclick = () => {
            Array.from(c.children).forEach(child => child.classList.remove('active'));
            el.classList.add('active');

            // Group Logic: L3 > L2 > L1 > A
            const grp = x.group || parentL2.group || parentL1.group || 'A';
            selectPath(parentL1.name, parentL2.name, x.name, grp);
        };
        c.appendChild(el);
    });
}

function selectPath(l1, l2, l3, group) {
    selectedPath = { l1, l2, l3, group };

    // Update Footer Text
    let text = l1;
    if (l2) text += ` > ${l2}`;
    if (l3) text += ` > ${l3}`;

    const footerText = document.getElementById('modalSelectionText');
    if (footerText) footerText.innerText = text;

    const footerBadge = document.getElementById('modalGroupBadge');
    if (footerBadge) {
        footerBadge.innerText = `Grup ${group}`;
        footerBadge.className = `ml-2 px-2 py-1 rounded text-xs font-bold inline-block badge-${group}`;
        footerBadge.classList.remove('hidden');
    }

    // Enable confirm button
    const btn = document.getElementById('btnConfirmCat');
    if (btn) btn.disabled = false;
}

function recalcAfterCategoryChange() {
    if (inputMode === 'single') {
        const elGroup = document.getElementById('currentCategoryGroup');
        const elSeller = document.getElementById('sellerType');
        const elAdmin = document.getElementById('adminFeePercent');

        if (elGroup && elSeller && elAdmin) {
            const group = elGroup.value; // Don't default to 'A' here yet

            // If No Group Selected (Initial State)
            if (!group || group === 'null' || group === '') {
                elAdmin.value = 0;

                // Show "Waiting for category" state in UI if possible
                // For now, 0% admin fee + "Wajib" label is the signal
                return;
            }

            const seller = elSeller.value || 'nonstar';

            let rate = 0;

            // Get rate based on current platform
            if (currentPlatform === 'shopee') {
                if (shopeeRates[seller] && shopeeRates[seller][group] !== undefined) {
                    rate = shopeeRates[seller][group];
                }
            } else if (currentPlatform === 'tokopedia' && typeof tokopediaRates !== 'undefined') {
                const tType = seller === 'power' ? 'power' : (seller === 'mall' ? 'mall' : 'regular');
                if (tokopediaRates[tType] && tokopediaRates[tType][group] !== undefined) {
                    rate = tokopediaRates[tType][group];
                }
            } else if (currentPlatform === 'tiktok' && typeof tiktokRates !== 'undefined') {
                const tType = seller === 'mall' ? 'mall' : 'regular';
                if (tiktokRates[tType] && tiktokRates[tType][group] !== undefined) {
                    rate = tiktokRates[tType][group];
                }
            } else if (currentPlatform === 'lazada') {
                // Lazada uses similar structure to Shopee for now
                if (shopeeRates[seller] && shopeeRates[seller][group] !== undefined) {
                    rate = shopeeRates[seller][group] * 0.9; // Lazada typically slightly lower
                }
            }

            elAdmin.value = rate;
        }
    }

    // Sync quick category buttons
    updateQuickCategoryButtons();

    calculate();
}

/**
 * Alias for recalcAfterCategoryChange - called from setQuickCategory
 */
function updateAdminFeeFromCategory() {
    recalcAfterCategoryChange();
}

function confirmCategory() {
    // If editing a specific product row (Bulk Mode)
    if (inputMode === 'bulk' && editingProductIndex !== null && products[editingProductIndex]) {
        const p = products[editingProductIndex];
        p.categoryName = selectedPath.l3 ? selectedPath.l3 : (selectedPath.l2 ? selectedPath.l2 : selectedPath.l1);
        p.categoryGroup = selectedPath.group;
        renderBulkTable();
        editingProductIndex = null;
    }
    // If Single Mode
    else {
        const elText = document.getElementById('selectedCategoryText');
        if (elText) {
            let text = selectedPath.l1;
            if (selectedPath.l2) text += ` > ${selectedPath.l2}`;
            if (selectedPath.l3) text += ` > ${selectedPath.l3}`;
            elText.innerText = text;
        }

        const elGroup = document.getElementById('currentCategoryGroup');
        if (elGroup) {
            elGroup.value = selectedPath.group;
        }

        const mainBadge = document.getElementById('categoryGroupBadge');
        if (mainBadge) {
            if (selectedPath.group) {
                mainBadge.innerText = `Grup ${selectedPath.group}`;
                mainBadge.className = `text-[10px] px-1.5 py-0.5 rounded font-bold badge-${selectedPath.group}`;
                mainBadge.classList.remove('hidden');
            } else {
                mainBadge.classList.add('hidden');
            }
        }
    }

    closeCategoryModal();
    // Force a small delay to ensure DOM updates if necessary, though not strictly needed
    setTimeout(recalcAfterCategoryChange, 50);
}

/**
 * Set category group quickly without opening modal
 * @param {string} group - Category group (A-F)
 */
function setQuickCategory(group) {
    // Update selected path
    selectedPath.group = group;
    selectedPath.l1 = `Kategori Group ${group}`;
    selectedPath.l2 = null;
    selectedPath.l3 = null;

    // Update hidden input
    const elGroup = document.getElementById('currentCategoryGroup');
    if (elGroup) {
        elGroup.value = group;
    }

    // Update display text
    const catText = document.getElementById('selectedCategoryText');
    if (catText) {
        catText.innerText = `Kategori Group ${group}`;
    }

    // Update badge
    const mainBadge = document.getElementById('categoryGroupBadge');
    if (mainBadge) {
        mainBadge.innerText = `Grup ${group}`;
        mainBadge.className = `text-[10px] px-1.5 py-0.5 rounded font-bold badge-${group}`;
        mainBadge.classList.remove('hidden');
    }

    // Update quick buttons visual state
    document.querySelectorAll('.quick-cat-btn').forEach(btn => {
        if (btn.dataset.group === group) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update category detail info panel
    updateCategoryGroupDetail(group);

    // Update admin fee based on category group
    updateAdminFeeFromCategory();

    // Recalculate
    calculate();
}

/**
 * Update quick category buttons to reflect current selection
 * Called when category is selected from modal
 */
function updateQuickCategoryButtons() {
    const currentGroup = selectedPath.group; // Can be null

    document.querySelectorAll('.quick-cat-btn').forEach(btn => {
        if (currentGroup && btn.dataset.group === currentGroup) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Also update the category detail panel
    if (currentGroup) {
        updateCategoryGroupDetail(currentGroup);
        document.getElementById('catDetailPanel')?.classList.remove('hidden');
    } else {
        // Hide details if no group selected
        document.getElementById('catDetailPanel')?.classList.add('hidden');
    }
}

/**
 * Category group descriptions and details
 */
const CATEGORY_GROUP_INFO = {
    A: {
        icon: '👗',
        title: 'Fashion & Kecantikan',
        desc: 'Pakaian, Sepatu, Tas, Aksesoris, Makeup, Skincare, Parfum',
        feeLabel: 'Tertinggi'
    },
    B: {
        icon: '🍼',
        title: 'FMCG & Kesehatan',
        desc: 'Makanan, Minuman, Suplemen, Vitamin, Popok, Perawatan Bayi',
        feeLabel: 'Tinggi'
    },
    C: {
        icon: '🏠',
        title: 'Rumah & Lifestyle',
        desc: 'Peralatan Rumah, Dekorasi, Olahraga, Hobi, Mainan',
        feeLabel: 'Sedang'
    },
    D: {
        icon: '📱',
        title: 'Elektronik & Gadget',
        desc: 'Handphone, Tablet, Laptop, Komputer, Aksesoris Elektronik',
        feeLabel: 'Rendah'
    },
    E: {
        icon: '🍎',
        title: 'Fresh & Large Items',
        desc: 'Makanan Segar, TV, AC, Kulkas, Mesin Cuci, Furniture Besar',
        feeLabel: 'Terendah'
    },
    F: {
        icon: '📚',
        title: 'Buku & Lainnya',
        desc: 'Buku, Majalah, Alat Tulis, Koleksi, Produk Virtual',
        feeLabel: 'Khusus'
    }
};

/**
 * Update category group detail info panel
 * @param {string} group - Category group (A-F)
 */
function updateCategoryGroupDetail(group) {
    const container = document.getElementById('categoryGroupDetail');
    if (!container) return;

    // Handle Placeholder State
    if (!group || group === 'null' || group === '') {
        container.innerHTML = `
            <div class="flex items-center gap-2 text-slate-400">
                <i class="fas fa-info-circle text-lg opacity-50"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-[10px] italic">
                        Pilih kategori di atas atau gunakan tombol cepat (A-F) untuk melihat detail biaya admin.
                    </p>
                </div>
            </div>`;
        return;
    }

    // Handle Active State - Restore structure if needed
    if (!document.getElementById('categoryGroupTitle')) {
        container.innerHTML = `
            <div class="flex items-start gap-2">
                <span id="categoryGroupIcon" class="text-lg"></span>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span id="categoryGroupTitle" class="text-xs font-bold text-slate-700 dark:text-slate-200"></span>
                        <span id="categoryGroupFee" class="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold"></span>
                    </div>
                    <p id="categoryGroupDesc" class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2"></p>
                </div>
            </div>`;
    }

    const info = CATEGORY_GROUP_INFO[group] || CATEGORY_GROUP_INFO['A'];

    // Get fee rate based on current platform and seller type
    const sellerType = document.getElementById('sellerType')?.value || 'nonstar';
    let feeRate = 0;

    if (currentPlatform === 'shopee' && shopeeRates[sellerType]) {
        feeRate = shopeeRates[sellerType][group] || 0;
    } else if (currentPlatform === 'tokopedia' && typeof tokopediaRates !== 'undefined') {
        const tType = sellerType === 'star' ? 'power' : (sellerType === 'mall' ? 'mall' : 'regular');
        feeRate = tokopediaRates[tType]?.[group] || 0;
    } else if (currentPlatform === 'tiktok' && typeof tiktokRates !== 'undefined') {
        const tType = sellerType === 'mall' ? 'mall' : 'regular';
        feeRate = tiktokRates[tType]?.[group] || 0;
    }

    // Update UI elements
    const iconEl = document.getElementById('categoryGroupIcon');
    const titleEl = document.getElementById('categoryGroupTitle');
    const feeEl = document.getElementById('categoryGroupFee');
    const descEl = document.getElementById('categoryGroupDesc');

    if (iconEl) iconEl.innerText = info.icon;
    if (titleEl) titleEl.innerText = info.title;
    if (feeEl) feeEl.innerText = feeRate > 0 ? `${feeRate}%` : info.feeLabel;
    if (descEl) descEl.innerText = info.desc;
}

// --- HELPER FUNCTIONS ---
function updateInput(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}
function updateSlider(id, val) {
    const el = document.getElementById(id + 'Slider');
    if (el) el.value = val;
}
function addCostRow() { const id = Date.now(); customCosts.push({ id, name: '', amount: 0, isPercent: false, category: 'modal' }); renderCustomCosts(); }
function removeCostRow(id) { customCosts = customCosts.filter(c => c.id !== id); renderCustomCosts(); calculate(); }
function updateCost(id, field, value) { const cost = customCosts.find(c => c.id === id); if (cost) { if (field === 'amount') cost.amount = parseFloat(value) || 0; else if (field === 'isPercent') cost.isPercent = (value === 'true'); else cost[field] = value; calculate(); updateModalTooltipContent(); } }

function renderCustomCosts() {
    const container = document.getElementById('customCostsContainer'); if (!container) return; container.innerHTML = '';
    customCosts.forEach(cost => {
        const div = document.createElement('div'); div.className = "flex gap-2 items-center bg-white dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600 transition-colors";
        div.innerHTML = `<input type="text" placeholder="Nama Biaya" value="${cost.name}" oninput="updateCost(${cost.id}, 'name', this.value)" class="w-1/3 text-xs p-1 border rounded border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-white"><select onchange="updateCost(${cost.id}, 'category', this.value)" class="text-xs p-1 border rounded border-slate-300 dark:border-slate-500 w-1/4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white"><option value="modal" ${cost.category === 'modal' ? 'selected' : ''}>Biaya Ops</option><option value="potongan" ${cost.category === 'potongan' ? 'selected' : ''}>Potongan</option></select><div class="flex-1 flex gap-1"><input type="number" value="${cost.amount}" oninput="updateCost(${cost.id}, 'amount', this.value)" class="w-full text-xs p-1 border rounded border-slate-300 dark:border-slate-500 text-right bg-white dark:bg-slate-800 text-slate-700 dark:text-white"><select onchange="updateCost(${cost.id}, 'isPercent', this.value)" class="text-xs p-1 border rounded border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-600 text-slate-700 dark:text-white"><option value="false" ${!cost.isPercent ? 'selected' : ''}>Rp</option><option value="true" ${cost.isPercent ? 'selected' : ''}>%</option></select></div><button onclick="removeCostRow(${cost.id})" class="text-red-400 hover:text-red-600 px-1"><i class="fas fa-trash text-xs"></i></button>`;
        container.appendChild(div);
    });
    calculate();
}

function updateModalTooltipContent() {
    const summaryContainer = document.getElementById('tooltipCustomCosts');
    if (summaryContainer) {
        summaryContainer.innerHTML = '';
        const opsCosts = customCosts.filter(c => c.category === 'modal');
        if (opsCosts.length > 0) {
            const divider = document.createElement('div'); divider.className = "border-t border-dashed border-slate-200 dark:border-slate-600 my-1"; summaryContainer.appendChild(divider);

            const elPrice = document.getElementById('originalPrice');
            const sellingPrice = elPrice ? parseFloat(elPrice.value) || 0 : 0;
            const elVoucher = document.getElementById('voucherAmount');
            const voucherAmount = elVoucher ? parseFloat(elVoucher.value) || 0 : 0;
            const basisPrice = Math.max(0, sellingPrice - voucherAmount);

            opsCosts.forEach(c => {
                const amt = c.isPercent ? basisPrice * (c.amount / 100) : c.amount;
                const row = document.createElement('div'); row.className = "flex justify-between text-slate-500 dark:text-slate-400"; row.innerHTML = `<span>${c.name || 'Biaya Lain'}</span><span>- ${formatRupiah(amt)}</span>`; summaryContainer.appendChild(row);
            });
        }
    }
}

function initChart() {
    const canvas = document.getElementById('profitPieChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    profitChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Modal', 'Fees', 'Profit'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#cbd5e1', '#f87171', '#10b981'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }
    });
}
function updateChart(modal, fees, profit) {
    if (!profitChart) return;
    let displayProfit = profit < 0 ? 0 : profit;
    profitChart.data.datasets[0].data = [modal, fees, displayProfit];
    profitChart.update();
}

function recalcAfterCategoryChange() {
    calculate();
}

function setPlatform(p) {
    currentPlatform = p;

    // Update Platform Buttons UI
    document.querySelectorAll('.platform-btn').forEach(btn => {
        btn.classList.remove('active');
        // Reset scale/transform if any inline styles were applied (optional, but good for cleanup)
    });
    const activeBtn = document.getElementById(`btn-${p}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    const wrapper = document.getElementById('programWrapper');
    const catWrapper = document.getElementById('shopeeCategoryWrapper');
    const sellerTypeSelect = document.getElementById('sellerType');

    // Show/hide Shopee-specific programs (Gratis Ongkir, Cashback)
    if (p === 'shopee') {
        if (wrapper) wrapper.style.display = 'block';
    } else {
        if (wrapper) wrapper.style.display = 'none';
    }

    // Category wrapper is shown for all platforms now (each has own categories)
    if (catWrapper) catWrapper.style.display = 'block';

    // Update seller type options based on platform
    if (sellerTypeSelect) {
        if (p === 'shopee') {
            sellerTypeSelect.innerHTML = `
                <option value="nonstar">Non-Star (Regular)</option>
                <option value="star">Star Seller / Star+</option>
                <option value="mall">Shopee Mall</option>
            `;
        } else if (p === 'tokopedia') {
            sellerTypeSelect.innerHTML = `
                <option value="regular">Regular</option>
                <option value="power">Power Merchant</option>
                <option value="mall">Official Store</option>
            `;
        } else if (p === 'tiktok') {
            sellerTypeSelect.innerHTML = `
                <option value="regular">Regular Seller</option>
                <option value="mall">TikTok Shop Mall</option>
            `;
        } else {
            sellerTypeSelect.innerHTML = `
                <option value="regular">Regular</option>
                <option value="mall">Official Store</option>
            `;
        }
    }

    // Reset category selection when platform changes
    selectedPath = { l1: null, l2: null, l3: null, group: null }; // Default: No Group Selected

    // Update category display text
    const catDisplay = document.getElementById('catDisplay');
    if (catDisplay) {
        const platformNames = {
            'shopee': 'Shopee',
            'tokopedia': 'Tokopedia',
            'tiktok': 'TikTok Shop',
            'lazada': 'Lazada'
        };
        catDisplay.innerText = `Klik untuk pilih Kategori ${platformNames[p] || ''}`;
    }

    // Update quick category buttons and detail panel
    updateQuickCategoryButtons();

    // Update admin fee for the new platform
    recalcAfterCategoryChange();
}

function updateServiceFee() {
    const f = document.getElementById('toggleFreeShip').checked;
    const c = document.getElementById('toggleCashback').checked;
    let t = 0; if (f) t += 4.0; if (c) t += 4.5;
    const el = document.getElementById('serviceFeePercent');
    if (el) el.value = t.toFixed(2);
    calculate();
}

/**
 * Format number to Indonesian Rupiah
 * @param {number} num - Number to format
 * @returns {string} Formatted rupiah string
 */
function formatRupiah(num) {
    // Use Formatters module if available
    if (typeof Formatters !== 'undefined') {
        return Formatters.formatRupiah(num);
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
}

/**
 * Parse rupiah string to number
 * @param {string} str - Rupiah string to parse
 * @returns {number} Parsed number
 */
function parseRupiah(str) {
    // Use Formatters module if available
    if (typeof Formatters !== 'undefined') {
        return Formatters.parseNumber(str);
    }
    return parseFloat(str.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
}

// Format input with thousand separator (dots)
function formatInputWithSeparator(input) {
    let value = input.value.replace(/\D/g, ''); // Remove all non-digits
    if (value === '') {
        input.value = '';
        return;
    }
    // Add thousand separators
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(value));
    input.value = formatted;
}

// Parse input that has thousand separator back to number
function parseInputNumber(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    return parseInt(el.value.replace(/\D/g, '') || '0');
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function setAdsTargetType(type) {
    adsTargetType = type;
    const btnPerc = document.getElementById('btnAdsTargetPerc');
    const btnFixed = document.getElementById('btnAdsTargetFixed');
    const labelRp = document.getElementById('adsTargetRpLabel');
    const labelPct = document.getElementById('adsTargetPctLabel');
    const hint = document.getElementById('adsTargetHint');
    const input = document.getElementById('targetProfitMargin');

    if (type === 'percent') {
        btnPerc.className = "px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold shadow-sm transition-colors";
        btnFixed.className = "px-2 py-0.5 rounded text-blue-500 dark:text-blue-400";
        labelRp.classList.add('hidden');
        labelPct.classList.remove('hidden');
        input.className = "w-full text-xs p-1 border border-blue-300 dark:border-blue-600 rounded text-center font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800";
        input.placeholder = "15";
        hint.innerText = "Margin (%)";
    } else {
        btnFixed.className = "px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold shadow-sm transition-colors";
        btnPerc.className = "px-2 py-0.5 rounded text-blue-500 dark:text-blue-400";
        labelPct.classList.add('hidden');
        labelRp.classList.remove('hidden');
        input.className = "w-full text-xs p-1 border border-blue-300 dark:border-blue-600 rounded pl-6 font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800";
        input.placeholder = "5000";
        hint.innerText = "Profit/Unit (Rp)";
    }
    calculate();
}

function switchAdsMode(mode) {
    adsMode = mode;
    const btnUnit = document.getElementById('btn-mode-unit');
    const btnDash = document.getElementById('btn-mode-dashboard');
    const divUnit = document.getElementById('input-mode-unit');
    const divDash = document.getElementById('input-mode-dashboard');

    if (mode === 'unit') {
        btnUnit.className = "tab-btn rounded px-3 py-1 text-[10px] font-bold bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm transition-colors";
        btnDash.className = "tab-btn rounded px-3 py-1 text-[10px] font-bold text-indigo-400 dark:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors";
        divUnit.classList.remove('hidden');
        divDash.classList.add('hidden');
        document.getElementById('lblProfitMetric').innerText = translations[currentLang]['organicProfitPerUnit'];
        document.getElementById('lblBepRoas').innerText = translations[currentLang]['breakEvenROAS'];
        calculate();
    } else {
        btnDash.className = "tab-btn rounded px-3 py-1 text-[10px] font-bold bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm transition-colors";
        btnUnit.className = "tab-btn rounded px-3 py-1 text-[10px] font-bold text-indigo-400 dark:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors";
        divDash.classList.remove('hidden');
        divUnit.classList.add('hidden');
        document.getElementById('lblProfitMetric').innerText = translations[currentLang]['margin'] + " (%)";
        document.getElementById('lblBepRoas').innerText = "ACOS (Biaya/Omzet)";
        calcDashboard();
    }
}

function saveScenarioA() {
    scenarioA = getCurrentState();
    const btnCompare = document.getElementById('btnCompare');
    btnCompare.disabled = false;
    btnCompare.classList.remove('opacity-50', 'cursor-not-allowed');

    const btnSave = document.getElementById('btnSaveScenario');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = '<i class="fas fa-check"></i> Tersimpan!';
    setTimeout(() => btnSave.innerHTML = originalText, 1500);

    showToast('Skenario A berhasil disimpan!', 'success');
}

function compareScenarios() {
    if (!scenarioA) return;
    const scenarioB = getCurrentState();

    const modal = document.getElementById('compareModal');
    modal.classList.remove('hidden');

    renderScenarioCard('compareContentA', scenarioA);
    renderScenarioCard('compareContentB', scenarioB);

    // Simple Insight
    const profitA = parseRupiah(scenarioA.profit);
    const profitB = parseRupiah(scenarioB.profit);
    const diff = profitB - profitA;
    const elInsight = document.getElementById('compareInsight');

    if (diff > 0) {
        elInsight.innerHTML = `<i class="fas fa-arrow-up text-emerald-500"></i> Profit <b>NAIK</b> sebesar <b>${formatRupiah(diff)}</b> pada skenario ini.`;
        elInsight.className = "mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg text-center text-sm text-emerald-800 dark:text-emerald-400 font-medium transition-colors";
    } else if (diff < 0) {
        elInsight.innerHTML = `<i class="fas fa-arrow-down text-red-500"></i> Profit <b>TURUN</b> sebesar <b>${formatRupiah(Math.abs(diff))}</b> pada skenario ini.`;
        elInsight.className = "mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-center text-sm text-red-800 dark:text-red-400 font-medium transition-colors";
    } else {
        elInsight.innerHTML = `<i class="fas fa-equals text-slate-500"></i> Profit <b>SAMA</b> dengan skenario sebelumnya.`;
        elInsight.className = "mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-lg text-center text-sm text-slate-600 dark:text-slate-400 font-medium transition-colors";
    }
}

function renderScenarioCard(elementId, data) {
    const el = document.getElementById(elementId);
    el.innerHTML = `
                <div class="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span class="text-slate-500 dark:text-slate-400">Harga Jual</span>
                    <span class="font-bold text-slate-700 dark:text-slate-200">Rp ${formatRupiah(data.sellingPrice)}</span>
                </div>
                <div class="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span class="text-slate-500 dark:text-slate-400">Biaya Admin</span>
                    <span class="font-medium text-red-500 dark:text-red-400">${data.adminFee}</span>
                </div>
                <div class="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span class="text-slate-500 dark:text-slate-400">Biaya Layanan</span>
                    <span class="font-medium text-red-500 dark:text-red-400">${data.serviceFee}</span>
                </div>
                <div class="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span class="text-slate-500 dark:text-slate-400">Total Modal</span>
                    <span class="font-medium text-slate-700 dark:text-slate-200">${data.totalCost}</span>
                </div>
                <div class="flex justify-between pt-2">
                    <span class="text-slate-800 dark:text-white font-bold">Net Profit</span>
                    <span class="font-black text-emerald-600 dark:text-emerald-400">${data.profit}</span>
                </div>
                <div class="text-right text-xs text-slate-400 mt-1">${data.margin}</div>
            `;
}

function closeCompareModal() {
    document.getElementById('compareModal').classList.add('hidden');
}

function getCurrentState() {
    return {
        sellingPrice: document.getElementById('originalPrice').value,
        profit: document.getElementById('finalProfit').innerText,
        margin: document.getElementById('finalMarginBadge').innerText,
        adminFee: document.getElementById('valAdminFee').innerText,
        serviceFee: document.getElementById('valServiceFee').innerText,
        totalCost: document.getElementById('sumCost').innerText,
        netIncome: document.getElementById('netIncome').innerText
    };
}


function calcDashboard() {
    const spend = parseInputNumber('dashAdSpend');
    const sales = parseInputNumber('dashSales');
    const clicks = parseInputNumber('dashClicks');

    // Calculate metrics
    let cpc = 0; if (clicks > 0) cpc = spend / clicks;
    let acos = 0; if (sales > 0) acos = (spend / sales) * 100;
    let roas = 0; if (spend > 0) roas = sales / spend;

    // Calculate profit metrics (assuming ~20% margin before ads as baseline)
    // For dashboard mode, we estimate profit as: Sales - Ad Spend - Estimated Platform Fees
    const estimatedMarginRate = 0.20; // 20% baseline margin assumption
    const grossProfit = sales * estimatedMarginRate; // Estimated gross profit from sales
    const profitAfterAds = grossProfit - spend; // Profit after deducting ad spend
    const marginAfterAds = sales > 0 ? (profitAfterAds / sales) * 100 : 0;

    // Update ROAS display
    setText('actualROAS', roas.toFixed(2) + 'x');
    setText('breakEvenROAS', acos.toFixed(1) + '%');

    // Update CPC display
    const elAdsCost = document.getElementById('adsCostPerSales');
    if (elAdsCost) {
        if (cpc > 0) elAdsCost.innerText = "CPC: " + formatRupiah(cpc);
        else elAdsCost.innerText = "-";
    }

    // Detailed status and recommendations
    const statusBadge = document.getElementById('adsStatusBadge');
    const recText = document.getElementById('recommendationContent');

    if (statusBadge && recText) {
        if (spend > 0 && sales > 0) {
            // Calculate break-even ROAS (assuming 20% margin, need ROAS of 5x to break even)
            const breakEvenRoas = 1 / estimatedMarginRate; // 5x for 20% margin

            if (roas >= breakEvenRoas * 1.5) {
                // Excellent: ROAS > 7.5x (1.5x of break-even)
                statusBadge.innerText = "SANGAT PROFIT";
                statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2";
                recText.innerText = `ROAS ${roas.toFixed(2)}x sangat baik! Profit setelah iklan: ${formatRupiah(Math.round(profitAfterAds))} (margin ${marginAfterAds.toFixed(1)}%). Pertimbangkan scale up budget.`;
            } else if (roas >= breakEvenRoas) {
                // Good: ROAS >= 5x (break-even or better)
                statusBadge.innerText = "PROFIT";
                statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2";
                recText.innerText = `Iklan profitable! Profit setelah iklan: ${formatRupiah(Math.round(profitAfterAds))} (ACOS ${acos.toFixed(1)}%). Margin bersih ${marginAfterAds.toFixed(1)}%.`;
            } else if (roas >= breakEvenRoas * 0.6) {
                // Warning: ROAS 3x-5x (close to break-even)
                statusBadge.innerText = "PERLU OPTIMASI";
                statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 mb-2";
                const targetSpend = sales / breakEvenRoas;
                const reduceBy = spend - targetSpend;
                recText.innerText = `ROAS ${roas.toFixed(2)}x mendekati impas. ${profitAfterAds >= 0 ? 'Profit' : 'Rugi'}: ${formatRupiah(Math.round(Math.abs(profitAfterAds)))}. Kurangi spend ${formatRupiah(Math.round(reduceBy))} untuk profit optimal.`;
            } else {
                // Danger: ROAS < 3x (likely losing money)
                statusBadge.innerText = "BONCOS";
                statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2";
                const loss = Math.abs(profitAfterAds);
                const neededRoas = breakEvenRoas;
                recText.innerText = `ROAS ${roas.toFixed(2)}x terlalu rendah! Estimasi rugi iklan: ${formatRupiah(Math.round(loss))}. Target ROAS minimal ${neededRoas.toFixed(1)}x untuk impas.`;
            }
        } else if (spend > 0) {
            statusBadge.innerText = "DATA TIDAK LENGKAP";
            statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 mb-2";
            recText.innerText = "Masukkan Total Omzet Iklan untuk analisa lengkap.";
        } else {
            statusBadge.innerText = translations[currentLang]?.['noData'] || "BELUM ADA DATA";
            statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 mb-2";
            recText.innerText = "Masukkan Total Biaya Iklan dan Omzet untuk melihat analisa.";
        }
    }
}

function calculate() {
    updateModalTooltipContent();

    if (adsMode === 'dashboard') {
        calcDashboard();
        return;
    }

    // 1. Reset Totals
    let totalSellingPrice = 0;
    let totalVoucher = 0;
    let totalAdmin = 0;
    let totalService = 0;
    let totalAffiliate = 0;
    let totalFixed = 0;
    let totalProcess = 0;
    let totalCustomDed = 0;
    let totalCustomCost = 0;
    let totalHPP = 0;
    let totalOps = 0;
    let totalNet = 0;
    let totalProfit = 0;
    let totalValFreeShip = 0;
    let totalValCashback = 0;

    // 2. Global Settings (with validation)
    const sellerType = document.getElementById('sellerType')?.value || 'nonstar';
    const isFreeShip = document.getElementById('toggleFreeShip')?.checked || false;
    const isCashback = document.getElementById('toggleCashback')?.checked || false;
    const affPct = Math.max(0, parseFloat(document.getElementById('affiliatePercent')?.value) || 0);
    const maxServiceFee = Math.max(0, parseFloat(document.getElementById('maxServiceFee')?.value) || 0);
    const orderProcessFee = Math.max(0, parseFloat(document.getElementById('orderProcessFee')?.value) || 0);
    const fixedFee = Math.max(0, parseFloat(document.getElementById('fixedFee')?.value) || 0);
    const opsCost = Math.max(0, parseFloat(document.getElementById('operationalCost')?.value) || 0);
    const adsCost = Math.max(0, parseFloat(document.getElementById('adsCost')?.value) || 0);

    // 3. Loop Products (OR Single Input)
    let itemsToCalc = [];

    if (inputMode === 'single') {
        // Construct single item from inputs - use parseInputNumber for formatted fields
        const price = parseInputNumber('originalPrice');
        const disc = parseFloat(document.getElementById('discountPercent')?.value) || 0;
        const voucher = parseFloat(document.getElementById('voucherAmount')?.value) || 0;
        const hpp = parseInputNumber('hpp');
        const group = document.getElementById('currentCategoryGroup')?.value || 'A';

        itemsToCalc.push({
            isSingle: true, // Marker
            price, discount: disc, voucher, hpp, categoryGroup: group
        });
    } else {
        itemsToCalc = products;
    }

    // Check waiting state for Single Mode
    const currentGroup = document.getElementById('currentCategoryGroup')?.value;
    const isWaitingForCategory = inputMode === 'single' && (!currentGroup || currentGroup === 'null' || currentGroup === '');

    if (isWaitingForCategory) {
        // Show "Waiting" state in result panel
        const netIncomeEl = document.getElementById('netIncome');
        const netIncomeDescEl = document.getElementById('netIncomeDesc');

        if (netIncomeEl) {
            netIncomeEl.innerText = 'Pilih Kategori';
            netIncomeEl.className = 'text-slate-400 font-bold'; // Neutral styling
        }
        if (netIncomeDescEl) {
            netIncomeDescEl.innerText = 'Pilih kategori produk dahulu';
        }

        // Reset profit summary values to neutral
        setText('valNetProfit', '-');
        setText('valMargin', '-');

        // Don't return here, let the loop run to update basic fields, but we'll zero out fees
    } else {
        // Restore standard color for Net Income
        const netIncomeEl = document.getElementById('netIncome');
        if (netIncomeEl) {
            netIncomeEl.classList.remove('text-slate-400');
            netIncomeEl.classList.add('text-emerald-600');
        }
    }

    // Cleaned up duplicate logic


    itemsToCalc.forEach((p, index) => {
        let price = parseFloat(p.price) || 0; // Use 'let' for price to allow modification in reverse mode
        const disc = parseFloat(p.discount) || 0;
        const voucher = parseFloat(p.voucher) || 0;
        const hpp = parseFloat(p.hpp) || 0;

        const finalPrice = price - (price * disc / 100);
        const basis = Math.max(0, finalPrice - voucher);

        // Admin Fee (Based on Category Group and Platform)
        let adminRate = 0;
        if (!isWaitingForCategory) {
            const platformRates = getPlatformRates(sellerType);
            if (platformRates && platformRates[p.categoryGroup] !== undefined) {
                adminRate = platformRates[p.categoryGroup];
            }
        }

        // Force update Admin Fee Input in Single Mode to match calculation
        if (p.isSingle) {
            const elAdmin = document.getElementById('adminFeePercent');
            if (elAdmin && !elAdmin.matches(':focus')) {
                elAdmin.value = isWaitingForCategory ? 0 : adminRate;
            }
        }


        const adminFee = basis * (adminRate / 100);

        // Service Fee
        let rateFreeShip = 0, rateCashback = 0;
        if (isCashback) rateCashback = 4.5;
        if (isFreeShip) rateFreeShip = 4.0;
        else if (!isCashback && parseFloat(document.getElementById('serviceFeePercent')?.value) > 0) {
            // Fallback if manual input used in single mode, though we calc auto now
            rateFreeShip = parseFloat(document.getElementById('serviceFeePercent')?.value);
        }

        let valFreeShip = basis * (rateFreeShip / 100);
        // Apply Cap for Free Ship Xtra (40k)
        if (isFreeShip) valFreeShip = Math.min(valFreeShip, 40000);
        // Apply Manual Cap if set (overrides or additional safety)
        if (maxServiceFee > 0 && valFreeShip > maxServiceFee) valFreeShip = maxServiceFee;

        let valCashback = basis * (rateCashback / 100);
        // Apply Cap for Cashback Xtra (60k per guideline)
        if (isCashback) valCashback = Math.min(valCashback, 60000);

        const serviceFee = valFreeShip + valCashback;

        totalValFreeShip += valFreeShip;
        totalValCashback += valCashback;

        // Update Tooltip Values (Only for Single Mode)
        if (p.isSingle) {
            const elFreeShip = document.getElementById('valFreeShipTooltip');
            const elCashback = document.getElementById('valCashbackTooltip');
            if (elFreeShip) elFreeShip.innerText = "- " + formatRupiah(valFreeShip);
            if (elCashback) elCashback.innerText = "- " + formatRupiah(valCashback);
        }

        // Affiliate
        const affiliateFee = basis * (affPct / 100);

        // Custom Costs
        let pCustomDed = 0, pCustomCost = 0;
        customCosts.forEach(c => {
            let amt = c.isPercent ? basis * (c.amount / 100) : c.amount;
            if (c.category === 'potongan') pCustomDed += amt; else pCustomCost += amt;
        });

        const totalDed = adminFee + serviceFee + affiliateFee + fixedFee + orderProcessFee + pCustomDed;
        const totalCost = hpp + opsCost + adsCost + pCustomCost;

        // Store calculated values for Export
        p.calculated = {
            adminFee: adminFee,
            serviceFee: serviceFee,
            affiliateFee: affiliateFee,
            totalDed: totalDed,
            totalCost: totalCost,
            finalPrice: finalPrice
        };

        const net = (finalPrice - voucher) - totalDed;
        const profit = net - totalCost;

        // Update Product State (Bulk only)
        if (!p.isSingle) {
            p.profit = profit;
            const elProfit = document.getElementById(`p-profit-${index}`);
            if (elProfit) {
                elProfit.innerText = formatRupiah(profit);
                elProfit.className = profit >= 0 ? "text-right font-bold text-xs text-emerald-600" : "text-right font-bold text-xs text-red-500";
            }
        } else {
            // Update Single Mode Specific UI (Final Price Display)
            setText('finalPriceDisplay', formatRupiah(finalPrice));
        }

        // Accumulate Totals
        totalSellingPrice += finalPrice;
        totalVoucher += voucher;
        totalAdmin += adminFee;
        totalService += serviceFee;
        totalAffiliate += affiliateFee;
        totalFixed += fixedFee;
        totalProcess += orderProcessFee;
        totalCustomDed += pCustomDed;
        totalCustomCost += pCustomCost;
        totalHPP += hpp;
        totalOps += opsCost + adsCost;
        totalNet += net;
        totalProfit += profit;
    });

    // 4. Update Global UI (Right Column)
    if (!isWaitingForCategory) {
        setText('finalProfit', formatRupiah(totalProfit));
        setText('totalBulkProfit', formatRupiah(totalProfit));     // Update Bulk Tooltip Totals
        if (inputMode === 'bulk') {
            const elFreeShip = document.getElementById('valFreeShipTooltip');
            const elCashback = document.getElementById('valCashbackTooltip');
            if (elFreeShip) elFreeShip.innerText = "- " + formatRupiah(totalValFreeShip);
            if (elCashback) elCashback.innerText = "- " + formatRupiah(totalValCashback);
        }

        // 4. Update UI Totals
        setText('sumSellingPrice', formatRupiah(totalSellingPrice));
        setText('valVoucherDeduction', "-" + formatRupiah(totalVoucher));
        setText('valAdminFee', "-" + formatRupiah(totalAdmin));
        setText('valServiceFee', "-" + formatRupiah(totalService));
        setText('valAffiliate', "-" + formatRupiah(totalAffiliate));
        setText('valFixedFee', "-" + formatRupiah(totalFixed));
        setText('valOrderProcessFee', "-" + formatRupiah(totalProcess));
        setText('sumCost', "-" + formatRupiah(totalHPP + totalOps + totalCustomCost));
        setText('netIncome', formatRupiah(totalNet));

        // Total Potongan Marketplace
        const totalMarketplaceFees = totalAdmin + totalService + totalAffiliate + totalFixed + totalProcess;
        setText('valTotalDeductions', "- " + formatRupiah(totalMarketplaceFees));
    }

    // Tooltip Modal
    setText('tooltipHPP', "-" + formatRupiah(totalHPP));
    setText('tooltipOps', "-" + formatRupiah(totalOps)); // This now includes adsCost, logic in tooltip display might need update or it's fine as aggregate


    // Visual Indicator
    const netCard = document.getElementById('netIncomeCard');
    const netLabel = document.getElementById('netIncomeLabel');
    const netVal = document.getElementById('netIncome');
    const netDesc = document.getElementById('netIncomeDesc');

    if (netCard && netLabel && netVal && netDesc) {
        if (totalNet < 0) {
            netCard.className = "bg-red-50 border border-red-100 p-3 rounded-lg mt-2 transition-colors duration-300";
            netLabel.className = "text-red-800";
            netVal.className = "text-red-600";
            netDesc.className = "text-[10px] text-red-600 mt-1";
            netDesc.innerHTML = "<i class='fas fa-exclamation-triangle'></i> Peringatan: Anda nombok ke Marketplace!";
        } else {
            netCard.className = "bg-emerald-50 border border-emerald-100 p-3 rounded-lg mt-2 transition-colors duration-300";
            netLabel.className = "text-emerald-800";
            netVal.className = "text-emerald-600";
            netDesc.className = "text-[10px] text-emerald-600 mt-1";
            netDesc.innerText = translations[currentLang]['netCashDesc'];
        }
    }

    // Update Simulation Card
    calculateMonthlyProjection();

    let marginPct = 0;
    if (totalSellingPrice > 0) marginPct = (totalProfit / totalSellingPrice) * 100;

    const badge = document.getElementById('finalMarginBadge');
    if (badge) {
        badge.innerText = `Margin: ${marginPct.toFixed(1)}%`;
        badge.className = totalProfit >= 0 ? "mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold" : "mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold";
    }

    // Update Profit Health Indicator & Mobile Bar
    updateProfitHealth(marginPct, totalProfit);
    updateMobileProfit(totalProfit, marginPct);
    animateValue('finalProfit');

    const totalPlatformFees = totalAdmin + totalService + totalAffiliate + totalFixed + totalProcess + totalCustomDed;
    const totalProductCost = totalHPP + totalOps + totalCustomCost;
    updateChart(totalProductCost, totalPlatformFees, totalProfit);

    // ADS ANALYSIS (Unit Mode) - Detailed Logic from Example.html
    const targetInputVal = parseFloat(document.getElementById('targetProfitMargin')?.value) || 0;
    let maxAdSpendTarget = 0;

    if (adsTargetType === 'percent') {
        const targetProfitVal = totalSellingPrice * (targetInputVal / 100);
        maxAdSpendTarget = totalProfit - targetProfitVal;
    } else {
        maxAdSpendTarget = totalProfit - targetInputVal;
    }

    let targetRoas = 0;
    if (maxAdSpendTarget > 0) targetRoas = totalSellingPrice / maxAdSpendTarget;

    const elTargetRoas = document.getElementById('targetROAS');
    if (elTargetRoas) {
        if (maxAdSpendTarget <= 0) {
            elTargetRoas.innerText = "Tidak Terjangkau";
            elTargetRoas.className = "text-xs font-bold text-red-500";
        } else {
            elTargetRoas.innerText = targetRoas.toFixed(2) + "x";
            elTargetRoas.className = "text-xs font-bold text-blue-600 dark:text-blue-400";
        }
    }

    // Update Ads Display with Detailed Logic
    setText('organicProfitDisplay', formatRupiah(totalProfit));

    const cpc = parseFloat(document.getElementById('cpc')?.value) || 0;
    const cr = parseFloat(document.getElementById('cr')?.value) || 0;
    let adsCostPerSale = 0;
    if (cpc > 0 && cr > 0) adsCostPerSale = cpc / (cr / 100);

    setText('adsCostPerSales', formatRupiah(adsCostPerSale));
    setText('sumAdsCost', "-" + formatRupiah(adsCostPerSale));

    let actualRoas = 0;
    if (adsCostPerSale > 0) actualRoas = totalSellingPrice / adsCostPerSale;
    setText('actualROAS', actualRoas.toFixed(2) + 'x');

    let bepRoas = 0;
    if (totalProfit > 0) bepRoas = totalSellingPrice / totalProfit;
    setText('breakEvenROAS', bepRoas > 0 ? bepRoas.toFixed(2) + 'x' : '∞');

    // Status Badges & Recommendation
    const statusBadge = document.getElementById('adsStatusBadge');
    const recText = document.getElementById('recommendationContent');

    if (statusBadge && recText) {
        if (cpc > 0 && cr > 0) {
            if (totalProfit <= 0) {
                statusBadge.innerText = "PRODUK RUGI";
                statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 mb-2";
                recText.innerText = "Produk rugi tanpa iklan, tidak disarankan beriklan.";
            } else if (adsCostPerSale > totalProfit) {
                statusBadge.innerText = "BONCOS";
                statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2";
                recText.innerText = "Biaya iklan per penjualan melebihi profit produk.";
            } else if (targetRoas > 0 && actualRoas < targetRoas) {
                statusBadge.innerText = "BELUM TARGET";
                statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 mb-2";
                recText.innerText = `Profit masih ada, tapi ROAS aktual di bawah target (${targetRoas.toFixed(2)}x).`;
            } else {
                statusBadge.innerText = "PROFIT";
                statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2";
                recText.innerText = "Kinerja iklan sehat dan memenuhi target profitabilitas.";
            }
        } else {
            // Check translated text or default
            const noDataText = (typeof translations !== 'undefined' && translations[currentLang]?.noData) || "BELUM ADA DATA";
            statusBadge.innerText = noDataText;
            statusBadge.className = "inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 mb-2";
            recText.innerText = "Masukkan CPC & Conversion Rate untuk melihat analisa.";
        }
    }
}

function exportData() {
    let dataToExport = [];
    const headers = ["Nama Produk", "Kategori", "Grup", "Harga Jual", "Diskon(%)", "Voucher", "HPP", "Biaya Admin", "Biaya Layanan", "Biaya Affiliate", "Biaya Lain", "Total Potongan", "Total Modal", "Profit", "Margin(%)"];

    dataToExport.push(headers);

    if (inputMode === 'single') {
        const name = document.getElementById('singleName').value || 'Produk Satuan';
        const cat = document.getElementById('selectedCategoryText').innerText;
        const grp = document.getElementById('currentCategoryGroup').value;
        const price = document.getElementById('originalPrice').value;
        const disc = document.getElementById('discountPercent').value;
        const voucher = document.getElementById('voucherAmount').value;
        const hpp = document.getElementById('hpp').value;

        // Retrieve calculated values from UI
        const admin = parseRupiah(document.getElementById('valAdminFee').innerText);
        const service = parseRupiah(document.getElementById('valServiceFee').innerText);
        const aff = parseRupiah(document.getElementById('valAffiliate').innerText);
        const ded = parseRupiah(document.getElementById('valTotalDeductions').innerText);
        const cost = parseRupiah(document.getElementById('sumCost').innerText);
        const profit = parseRupiah(document.getElementById('finalProfit').innerText);
        const margin = document.getElementById('finalMarginBadge').innerText.replace('Margin: ', '').replace('%', '');

        dataToExport.push([name, cat, grp, price, disc, voucher, hpp, admin, service, aff, '', ded, cost, profit, margin]);
    } else {
        products.forEach(p => {
            const c = p.calculated || {};
            const margin = c.finalPrice > 0 ? (p.profit / c.finalPrice * 100).toFixed(2) : 0;
            dataToExport.push([
                p.name,
                p.categoryName,
                p.categoryGroup,
                p.price,
                p.discount,
                p.voucher,
                p.hpp,
                c.adminFee || 0,
                c.serviceFee || 0,
                c.affiliateFee || 0,
                '',
                c.totalDed || 0,
                c.totalCost || 0,
                p.profit,
                margin
            ]);
        });
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    dataToExport.forEach(row => {
        csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "laporan_profit_shopee.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==================== DATABASE BACKUP/RESTORE ====================

// Export all data to JSON file
function exportDatabaseJSON() {
    try {
        const exportData = {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            productDB: productDB,
            calcHistory: getHistory(),
            settings: {
                theme: localStorage.getItem('theme'),
                platform: currentPlatform
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `profit_calculator_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`Berhasil export ${productDB.length} produk!`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Gagal export data: ' + error.message, 'error');
    }
}

// Import data from JSON file
function importDatabaseJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate structure
            if (!data.productDB || !Array.isArray(data.productDB)) {
                throw new Error('Format file tidak valid');
            }

            // Confirm before overwriting
            const existingCount = productDB.length;
            const importCount = data.productDB.length;

            if (existingCount > 0) {
                const confirm = window.confirm(
                    `Anda memiliki ${existingCount} produk.\n` +
                    `File backup berisi ${importCount} produk.\n\n` +
                    `Pilih OK untuk menggabungkan(merge) data.\n` +
                    `Pilih Cancel untuk membatalkan.`
                );
                if (!confirm) return;
            }

            // Merge data (avoid duplicates by ID)
            const existingIds = new Set(productDB.map(p => p.id));
            const newProducts = data.productDB.filter(p => !existingIds.has(p.id));

            productDB.push(...newProducts);
            saveProductDB();
            renderProductDB();
            renderHistory();
            populateProductSelectors();

            showToast(`Berhasil import ${newProducts.length} produk baru!`, 'success');
        } catch (error) {
            console.error('Import error:', error);
            showToast('Gagal import: ' + error.message, 'error');
        }
    };

    input.click();
}

// Clear all data with confirmation
function clearAllData() {
    const confirm = window.confirm(
        '⚠️ PERINGATAN!\n\n' +
        `Anda akan menghapus ${productDB.length} produk dan semua riwayat.\n\n` +
        'Tindakan ini TIDAK DAPAT DIBATALKAN!\n\n' +
        'Disarankan export backup terlebih dahulu.\n\n' +
        'Lanjutkan hapus semua data?'
    );

    if (!confirm) return;

    // Double confirm for safety
    const doubleConfirm = window.confirm('Konfirmasi sekali lagi: Hapus SEMUA data?');
    if (!doubleConfirm) return;

    productDB.length = 0;
    saveProductDB();
    localStorage.removeItem('calcHistory');
    renderProductDB();
    renderHistory();
    populateProductSelectors();

    showToast('Semua data telah dihapus', 'info');
}

// Theme Logic
function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// Init Theme
if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}
