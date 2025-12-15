/**
 * PriceFinder - Module for optimal price calculation
 * Using IIFE pattern for browser compatibility
 */
const PriceFinder = (function () {
    'use strict';

    // ==================== PRIVATE STATE ====================

    let profitType = 'rupiah'; // 'rupiah' or 'percent'
    let targetMode = 'margin'; // 'margin' or 'profit'
    let configMode = 'simple'; // 'simple' or 'advanced'
    let costComponents = [];
    let costIdCounter = 0;

    // ==================== HELPER FUNCTIONS ====================

    /**
     * Format input with thousand separators
     * @param {HTMLInputElement} input 
     */
    function formatInputNumber(input) {
        if (typeof Formatters !== 'undefined') {
            Formatters.formatInputWithSeparator(input);
            return;
        }
        let value = input.value.replace(/\D/g, '');
        if (value) {
            value = new Intl.NumberFormat('id-ID').format(value);
        }
        input.value = value;
    }

    /**
     * Parse formatted number string to float
     * @param {string|number} value 
     * @returns {number}
     */
    function parseFormattedNumber(value) {
        if (typeof Formatters !== 'undefined') {
            return Formatters.parseNumber(value);
        }
        if (!value) return 0;
        return parseFloat(value.toString().replace(/\./g, '')) || 0;
    }

    /**
     * Format number to Rupiah
     * @param {number} num 
     * @returns {string}
     */
    function formatRupiah(num) {
        if (typeof Formatters !== 'undefined') {
            return Formatters.formatRupiah(num);
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    }

    /**
     * Set text content of element by ID
     * @param {string} id 
     * @param {string} text 
     */
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }

    /**
     * Show toast notification
     * @param {string} message 
     * @param {string} type 
     */
    function showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    // ==================== PROFIT TYPE ====================

    /**
     * Set profit type (Rupiah or Percent)
     * @param {string} type - 'rupiah' or 'percent'
     */
    function setProfitType(type) {
        profitType = type;
        const btnRp = document.getElementById('pf_profit_type_rp');
        const btnPct = document.getElementById('pf_profit_type_pct');
        const profitPrefix = document.getElementById('pf_profit_prefix');
        const profitInput = document.getElementById('pf_target_profit');

        const activeClass = 'flex-1 py-1.5 text-[10px] font-bold rounded-md bg-white dark:bg-slate-600 text-slate-700 dark:text-white shadow-sm transition-all';
        const inactiveClass = 'flex-1 py-1.5 text-[10px] font-bold rounded-md text-slate-500 dark:text-slate-400 transition-all hover:bg-white/50 dark:hover:bg-slate-600/50';

        if (profitInput) profitInput.value = '';

        if (type === 'rupiah') {
            if (btnRp) btnRp.className = activeClass;
            if (btnPct) btnPct.className = inactiveClass;
            if (profitPrefix) profitPrefix.textContent = 'Rp';
            if (profitInput) {
                profitInput.placeholder = '10.000';
                profitInput.oninput = () => {
                    formatInputNumber(profitInput);
                    calculateOptimalPrice();
                };
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

    // ==================== TARGET MODE ====================

    /**
     * Set target mode (Margin or Profit)
     * @param {string} target - 'margin' or 'profit'
     */
    function setTargetMode(target) {
        targetMode = target;
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

    // ==================== CONFIG MODE ====================

    /**
     * Set config mode (Simple or Advanced)
     * @param {string} mode - 'simple' or 'advanced'
     */
    function setConfigMode(mode) {
        configMode = mode;
        const btnSimple = document.getElementById('pf_mode_simple');
        const btnAdvanced = document.getElementById('pf_mode_advanced');
        const configSimple = document.getElementById('pf_simple_config');
        const configAdvanced = document.getElementById('pf_advanced_config');
        const componentsSection = document.getElementById('pf_komponen_biaya_section');

        if (mode === 'simple') {
            btnSimple?.classList.add('bg-white', 'dark:bg-slate-600', 'text-slate-700', 'dark:text-white', 'shadow-sm');
            btnSimple?.classList.remove('text-slate-500', 'dark:text-slate-400');
            btnAdvanced?.classList.remove('bg-white', 'dark:bg-slate-600', 'text-slate-700', 'dark:text-white', 'shadow-sm');
            btnAdvanced?.classList.add('text-slate-500', 'dark:text-slate-400');
            configSimple?.classList.remove('hidden');
            configAdvanced?.classList.add('hidden');
            componentsSection?.classList.remove('hidden');
        } else {
            btnAdvanced?.classList.add('bg-white', 'dark:bg-slate-600', 'text-slate-700', 'dark:text-white', 'shadow-sm');
            btnAdvanced?.classList.remove('text-slate-500', 'dark:text-slate-400');
            btnSimple?.classList.remove('bg-white', 'dark:bg-slate-600', 'text-slate-700', 'dark:text-white', 'shadow-sm');
            btnSimple?.classList.add('text-slate-500', 'dark:text-slate-400');
            configAdvanced?.classList.remove('hidden');
            configSimple?.classList.add('hidden');
            componentsSection?.classList.add('hidden');
            // Sync from global when entering advanced
            syncFromGlobal();
        }
        calculateOptimalPrice();
    }

    // ==================== FEE SYNC ====================

    /**
     * Sync Price Finder fees TO global Profit Calculator
     */
    function syncToGlobal() {
        const pfAdmin = document.getElementById('pf_adminFeePercent')?.value || 0;
        const pfService = document.getElementById('pf_serviceFeePercent')?.value || 0;
        const pfAffiliate = document.getElementById('pf_affiliatePercent')?.value || 0;

        const adminEl = document.getElementById('adminFeePercent');
        const serviceEl = document.getElementById('serviceFeePercent');
        const affiliateEl = document.getElementById('affiliatePercent');

        if (adminEl) adminEl.value = pfAdmin;
        if (serviceEl) serviceEl.value = pfService;
        if (affiliateEl) affiliateEl.value = pfAffiliate;

        // Trigger main calculator if available
        if (typeof window.calculate === 'function') {
            window.calculate();
        }
    }

    /**
     * Sync global Profit Calculator fees TO Price Finder
     */
    function syncFromGlobal() {
        const admin = document.getElementById('adminFeePercent')?.value || 0;
        const service = document.getElementById('serviceFeePercent')?.value || 0;
        const affiliate = document.getElementById('affiliatePercent')?.value || 0;

        const pfAdminEl = document.getElementById('pf_adminFeePercent');
        const pfServiceEl = document.getElementById('pf_serviceFeePercent');
        const pfAffiliateEl = document.getElementById('pf_affiliatePercent');

        if (pfAdminEl) pfAdminEl.value = admin;
        if (pfServiceEl) pfServiceEl.value = service;
        if (pfAffiliateEl) pfAffiliateEl.value = affiliate;

        // Update toggles to match
        const pfFreeShip = document.getElementById('pf_toggleFreeShip');
        const pfCashback = document.getElementById('pf_toggleCashback');
        const globalFreeShip = document.getElementById('toggleFreeShip');
        const globalCashback = document.getElementById('toggleCashback');

        if (pfFreeShip && globalFreeShip) pfFreeShip.checked = globalFreeShip.checked;
        if (pfCashback && globalCashback) pfCashback.checked = globalCashback.checked;

        calculateOptimalPrice();
    }

    /**
     * Update service fee from toggles
     */
    function updateServiceFee() {
        const freeShip = document.getElementById('pf_toggleFreeShip')?.checked;
        const cashback = document.getElementById('pf_toggleCashback')?.checked;
        let serviceFee = 0;
        if (freeShip) serviceFee += 4.0;
        if (cashback) serviceFee += 4.5;

        const el = document.getElementById('pf_serviceFeePercent');
        if (el) el.value = serviceFee.toFixed(2);

        syncToGlobal();
        calculateOptimalPrice();
    }

    // ==================== COST COMPONENTS ====================

    /**
     * Add cost component
     * @param {string} name 
     * @param {string} type - 'fixed' or 'percent'
     * @param {number} value 
     */
    function addCostComponent(name = '', type = 'fixed', value = 0) {
        const id = ++costIdCounter;
        costComponents.push({ id, name, type, value });
        renderCostComponents();
        calculateOptimalPrice();
    }

    /**
     * Add preset cost component
     * @param {string} key 
     * @param {string} name 
     * @param {string} type 
     * @param {number} value 
     */
    function addPreset(key, name, type, value) {
        const exists = costComponents.find(c => c.name === name);
        if (exists) {
            showToast(`${name} sudah ditambahkan`, 'error');
            return;
        }
        addCostComponent(name, type, value);
        showToast(`${name} ditambahkan`, 'success');
    }

    /**
     * Remove cost component
     * @param {number} id 
     */
    function removeCostComponent(id) {
        costComponents = costComponents.filter(c => c.id !== id);
        renderCostComponents();
        calculateOptimalPrice();
    }

    /**
     * Update cost component field
     * @param {number} id 
     * @param {string} field 
     * @param {*} value 
     */
    function updateCostComponent(id, field, value) {
        const comp = costComponents.find(c => c.id === id);
        if (comp) {
            comp[field] = field === 'value' ? parseFloat(value) || 0 : value;
            calculateOptimalPrice();
        }
    }

    /**
     * Render cost components list
     */
    function renderCostComponents() {
        const container = document.getElementById('pf_cost_components');
        if (!container) return;

        if (costComponents.length === 0) {
            container.innerHTML = `
                <div class="text-center text-xs text-slate-400 py-3">
                    <i class="fas fa-info-circle mr-1"></i>
                    Belum ada komponen biaya. Klik "+ Tambah Biaya" atau gunakan preset.
                </div>`;
            return;
        }

        container.innerHTML = costComponents.map(c => `
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 bg-white dark:bg-slate-700 p-2 rounded-lg border border-slate-200 dark:border-slate-600">
                <input type="text" value="${c.name}" placeholder="Nama biaya" 
                    onchange="PriceFinder.updateCostComponent(${c.id}, 'name', this.value)"
                    class="w-full sm:flex-1 text-xs p-1.5 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white">
                <div class="flex items-center gap-2 w-full sm:w-auto">
                    <select onchange="PriceFinder.updateCostComponent(${c.id}, 'type', this.value)"
                        class="flex-1 sm:flex-none text-xs p-1.5 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white">
                        <option value="fixed" ${c.type === 'fixed' ? 'selected' : ''}>Biaya Tetap (Rp)</option>
                        <option value="percent" ${c.type === 'percent' ? 'selected' : ''}>Biaya Variabel (%)</option>
                    </select>
                    <input type="text" value="${new Intl.NumberFormat('id-ID').format(c.value)}" placeholder="0"
                        onchange="PriceFinder.updateCostComponent(${c.id}, 'value', PriceFinder.parseNumber(this.value))"
                        oninput="PriceFinder.formatInput(this); PriceFinder.updateCostComponent(${c.id}, 'value', PriceFinder.parseNumber(this.value))"
                        class="w-20 sm:w-24 text-xs p-1.5 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white text-right">
                    <button onclick="PriceFinder.removeCostComponent(${c.id})" 
                        class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                        <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // ==================== MAIN CALCULATION ====================

    /**
     * Calculate optimal selling price
     */
    function calculateOptimalPrice() {
        const hpp = parseFormattedNumber(document.getElementById('pf_hpp')?.value);
        const discount = parseFloat(document.getElementById('pf_discount')?.value) || 0;

        let adminPct = 0;
        let servicePct = 0;
        let affiliatePct = 0;
        let totalFeePct = 0;
        let fixedCosts = 0;

        if (configMode === 'advanced') {
            adminPct = parseFloat(document.getElementById('pf_adminFeePercent')?.value) || 0;
            servicePct = parseFloat(document.getElementById('pf_serviceFeePercent')?.value) || 0;
            affiliatePct = parseFloat(document.getElementById('pf_affiliatePercent')?.value) || 0;

            fixedCosts = (parseFormattedNumber(document.getElementById('pf_orderProcessFee')?.value) || 0) +
                (parseFormattedNumber(document.getElementById('pf_fixedFee')?.value) || 0) +
                (parseFormattedNumber(document.getElementById('pf_operationalCost')?.value) || 0);
        }

        totalFeePct = adminPct + servicePct + affiliatePct;

        // Dynamic components (simple mode only)
        let dynamicFixedCosts = 0;
        let dynamicVariablePct = 0;

        if (configMode !== 'advanced') {
            costComponents.forEach(comp => {
                if (comp.type === 'fixed') {
                    dynamicFixedCosts += comp.value;
                } else if (comp.type === 'percent') {
                    dynamicVariablePct += comp.value;
                }
            });
        }

        fixedCosts += dynamicFixedCosts;
        totalFeePct += dynamicVariablePct;

        setText('pf_total_fee_display', totalFeePct.toFixed(1) + '%');

        let sellingPrice = 0;
        let profit = 0;
        let margin = 0;

        if (hpp > 0) {
            const effectiveHpp = hpp + fixedCosts;

            if (targetMode === 'margin') {
                const targetMargin = parseFloat(document.getElementById('pf_target_margin')?.value) || 0;
                const denominator = 1 - (targetMargin / 100) - (totalFeePct / 100);
                if (denominator > 0) {
                    sellingPrice = Math.ceil(effectiveHpp / denominator);
                    profit = sellingPrice - effectiveHpp - (sellingPrice * totalFeePct / 100);
                    margin = (profit / sellingPrice) * 100;
                }
            } else {
                let targetProfitValue = parseFormattedNumber(document.getElementById('pf_target_profit')?.value) || 0;
                let targetProfitAmount = 0;

                if (profitType === 'rupiah') {
                    targetProfitAmount = targetProfitValue;
                } else {
                    targetProfitAmount = effectiveHpp * (targetProfitValue / 100);
                }

                const denominator = 1 - (totalFeePct / 100);
                if (denominator > 0) {
                    sellingPrice = Math.ceil((effectiveHpp + targetProfitAmount) / denominator);
                    profit = sellingPrice - effectiveHpp - (sellingPrice * totalFeePct / 100);
                    margin = (profit / sellingPrice) * 100;
                }
            }
        }

        // Strikethrough price
        let strikethroughPrice = 0;
        if (discount > 0 && sellingPrice > 0) {
            strikethroughPrice = Math.ceil(sellingPrice / (1 - discount / 100));
            document.getElementById('pf_strikethrough_container')?.classList.remove('hidden');
            setText('pf_strikethrough_price', formatRupiah(strikethroughPrice));
        } else {
            document.getElementById('pf_strikethrough_container')?.classList.add('hidden');
        }

        // Render fee breakdown
        renderFeeBreakdown(sellingPrice, adminPct, servicePct, affiliatePct);

        // Update results
        setText('pf_result_price', formatRupiah(sellingPrice));
        setText('pf_result_profit', formatRupiah(Math.round(profit)));
        setText('pf_result_margin', margin.toFixed(1) + '%');
    }

    /**
     * Render fee breakdown
     * @param {number} sellingPrice 
     * @param {number} adminPct 
     * @param {number} servicePct 
     * @param {number} affiliatePct 
     */
    function renderFeeBreakdown(sellingPrice, adminPct, servicePct, affiliatePct) {
        const container = document.getElementById('pf_result_breakdown_list');
        if (!container) return;

        let html = '';
        let totalFee = 0;

        const addRow = (label, amount) => {
            html += `
                <div class="flex justify-between">
                    <span class="opacity-80">${label}</span>
                    <span class="font-medium">-${formatRupiah(Math.round(amount))}</span>
                </div>`;
            totalFee += amount;
        };

        if (configMode === 'advanced') {
            if (adminPct > 0) addRow(`Biaya Admin (${adminPct}%)`, sellingPrice * adminPct / 100);
            if (servicePct > 0) addRow(`Biaya Layanan (${servicePct}%)`, sellingPrice * servicePct / 100);
            if (affiliatePct > 0) addRow(`Affiliate (${affiliatePct}%)`, sellingPrice * affiliatePct / 100);

            const advFixed = (parseFormattedNumber(document.getElementById('pf_orderProcessFee')?.value) || 0) +
                (parseFormattedNumber(document.getElementById('pf_fixedFee')?.value) || 0) +
                (parseFormattedNumber(document.getElementById('pf_operationalCost')?.value) || 0);
            if (advFixed > 0) addRow('Biaya Lain (Advanced)', advFixed);
        } else {
            costComponents.forEach(comp => {
                let amount = 0;
                if (comp.type === 'fixed') {
                    amount = comp.value;
                    addRow(comp.name, amount);
                } else if (comp.type === 'percent') {
                    amount = sellingPrice * comp.value / 100;
                    addRow(`${comp.name} (${comp.value}%)`, amount);
                }
            });
        }

        container.innerHTML = html || '<div class="text-xs text-white/50 italic text-center">Tidak ada potongan</div>';
        setText('pf_result_total_fee', '-' + formatRupiah(Math.round(totalFee)));
    }

    // ==================== PUBLIC API ====================

    return {
        // State setters
        setProfitType,
        setTargetMode,
        setConfigMode,

        // Fee sync
        syncToGlobal,
        syncFromGlobal,
        updateServiceFee,

        // Cost components
        addCostComponent,
        addPreset,
        removeCostComponent,
        updateCostComponent,
        renderCostComponents,

        // Calculation
        calculateOptimalPrice,

        // Utilities (exposed for inline handlers)
        formatInput: formatInputNumber,
        parseNumber: parseFormattedNumber,

        // Getters
        getProfitType: () => profitType,
        getTargetMode: () => targetMode,
        getConfigMode: () => configMode,
        getCostComponents: () => [...costComponents]
    };
})();

// ==================== GLOBAL COMPATIBILITY LAYER ====================
// These functions maintain backward compatibility with existing HTML onclick handlers

if (typeof window !== 'undefined') {
    window.PriceFinder = PriceFinder;

    // Backward compatible global functions (will be removed after full migration)
    window.setPfProfitType = PriceFinder.setProfitType;
    window.setPriceFinderTarget = PriceFinder.setTargetMode;
    window.setPfConfigMode = PriceFinder.setConfigMode;
    window.syncPfFees = PriceFinder.syncToGlobal;
    window.syncToPf = PriceFinder.syncFromGlobal;
    window.updatePfServiceFee = PriceFinder.updateServiceFee;
    window.addPfCostComponent = PriceFinder.addCostComponent;
    window.addPfPreset = PriceFinder.addPreset;
    window.removePfCostComponent = PriceFinder.removeCostComponent;
    window.updatePfCostComponent = PriceFinder.updateCostComponent;
    window.renderPfCostComponents = PriceFinder.renderCostComponents;
    window.calculateOptimalPrice = PriceFinder.calculateOptimalPrice;
}
