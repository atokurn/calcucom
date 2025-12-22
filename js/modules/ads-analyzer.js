/**
 * AdsAnalyzer - Module for ads performance analysis and product database
 * Using IIFE pattern for browser compatibility
 */
const AdsAnalyzer = (function () {
    'use strict';

    // ==================== PRIVATE STATE ====================

    let targetProfitEnabled = true;
    let adsTargetType = 'percent'; // 'percent' or 'fixed'

    // Auto mode data for ROAS calculations
    let autoData = {
        price: 0,
        netProfit: 0,
        roasBE: 0,
        isActive: false
    };

    // ==================== HELPER FUNCTIONS ====================

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
     * Get product database from global
     * @returns {Array}
     */
    function getProductDB() {
        return window.productDB || [];
    }

    /**
     * Show toast notification
     * @param {string} message 
     * @param {string} type 
     */
    function showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else if (typeof UIManager !== 'undefined') {
            UIManager.showToast(message, type);
        }
    }

    // ==================== INPUT VALIDATION ====================

    /**
     * Validate CPC (Cost Per Click) input
     * Shows warnings for unrealistic values
     * @param {number|string} value - CPC value to validate
     * @returns {number} - Validated CPC value
     */
    function validateCPC(value) {
        const cpc = parseFloat(value) || 0;

        // Warning thresholds
        const HIGH_CPC_THRESHOLD = 50000; // Rp 50,000
        const VERY_HIGH_CPC_THRESHOLD = 100000; // Rp 100,000
        const LOW_CPC_THRESHOLD = 50; // Rp 50

        if (cpc > VERY_HIGH_CPC_THRESHOLD) {
            showToast('⚠️ CPC sangat tinggi (>Rp100rb). Periksa kembali input Anda.', 'warning');
        } else if (cpc > HIGH_CPC_THRESHOLD) {
            showToast('CPC cukup tinggi. Pastikan nilai dalam Rupiah.', 'info');
        }

        if (cpc > 0 && cpc < LOW_CPC_THRESHOLD) {
            showToast('CPC sangat rendah (<Rp50). Pastikan input dalam Rupiah, bukan ribuan.', 'warning');
        }

        return cpc;
    }

    /**
     * Validate CR (Conversion Rate) input
     * @param {number|string} value - CR value to validate
     * @returns {number} - Validated CR value (percentage)
     */
    function validateCR(value) {
        const cr = parseFloat(value) || 0;

        // Warning thresholds
        const HIGH_CR_THRESHOLD = 20; // 20%
        const LOW_CR_THRESHOLD = 0.1; // 0.1%

        if (cr > HIGH_CR_THRESHOLD) {
            showToast('CR sangat tinggi (>' + HIGH_CR_THRESHOLD + '%). Umumnya CR marketplace 1-5%.', 'info');
        }

        if (cr > 0 && cr < LOW_CR_THRESHOLD) {
            showToast('CR sangat rendah. Pastikan dalam format persen (contoh: 2 = 2%).', 'warning');
        }

        // Clamp to reasonable range 0-100
        return Math.min(Math.max(cr, 0), 100);
    }

    /**
     * Validate ROAS input
     * @param {number|string} value 
     * @returns {number}
     */
    function validateROAS(value) {
        const roas = parseFloat(value) || 0;

        if (roas > 100) {
            showToast('ROAS >100x sangat tidak realistis. Periksa kembali.', 'warning');
        }

        if (roas > 0 && roas < 1) {
            showToast('ROAS <1x berarti rugi dari iklan.', 'info');
        }

        return Math.max(roas, 0);
    }

    // ==================== PRODUCT DATABASE ====================

    /**
     * Save product database to localStorage
     */
    function saveProductDB() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('productDB', JSON.stringify(getProductDB()));
        }
    }

    /**
     * Delete product from database
     * @param {number} index 
     */
    function deleteProduct(index) {
        const productDB = getProductDB();
        if (productDB && productDB[index]) {
            const name = productDB[index].name;
            productDB.splice(index, 1);
            saveProductDB();
            renderProductDB();
            showToast(`${name} dihapus`, 'info');
        }
    }

    /**
     * Render product database list
     */
    function renderProductDB() {
        const container = document.getElementById('productDbContainer');
        if (!container) return;

        const productDB = getProductDB();

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
                        <div class="text-[10px] text-slate-400">ID: ${p.productId || p.id} | HPP: ${formatRupiah(p.hpp || p.cost_of_goods || 0)}</div>
                    </div>
                    <button onclick="AdsAnalyzer.deleteProduct(${idx})" class="text-red-400 hover:text-red-600 p-1">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>`;
        });
        html += '</div>';
        container.innerHTML = html;

        // Update product selectors
        renderProductSelectors();
    }

    /**
     * Render product selectors in ROAS and Compare modules
     */
    function renderProductSelectors() {
        const productDB = getProductDB();
        const options = productDB.map(p =>
            `<option value="${p.id}">${p.name} - ${formatRupiah(p.result_profit || p.profit || 0)}</option>`
        ).join('');

        const cmpSelect = document.getElementById('cmp_product_select');
        if (cmpSelect) cmpSelect.innerHTML = options;

        const roasSelect = document.getElementById('roas_product_select');
        if (roasSelect) roasSelect.innerHTML = options;
    }

    // ==================== ADS ANALYSIS ====================

    /**
     * Toggle target profit section
     */
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

    /**
     * Calculate ROAS breakeven
     */
    function calculateROASBreakeven() {
        let price, netProfit;

        if (autoData.isActive && autoData.price > 0) {
            price = autoData.price;
            netProfit = autoData.netProfit;
        } else {
            const hpp = parseFloat(document.getElementById('roas_hpp')?.value) || 0;
            price = parseFloat(document.getElementById('roas_price')?.value) || 0;
            const feePercent = parseFloat(document.getElementById('roas_fee')?.value) || 0;
            const fee = price * (feePercent / 100);
            netProfit = price - hpp - fee;
        }

        const cr = parseFloat(document.getElementById('roas_cr')?.value) ||
            parseFloat(document.getElementById('cr')?.value) || 2;
        const targetMargin = parseFloat(document.getElementById('roas_target_margin')?.value) || 15;
        const adCostPerUnit = parseFloat(document.getElementById('roas_ad_cost')?.value) || 0;

        const profitAfterAds = netProfit - adCostPerUnit;

        let roasBE = 0;
        let acosMax = 0;
        let maxCPC = 0;
        let roasTarget = 0;

        if (netProfit > 0 && price > 0) {
            roasBE = price / netProfit;
            const targetProfit = price * (targetMargin / 100);
            if (targetProfit > 0) {
                roasTarget = price / targetProfit;
            }
            acosMax = (netProfit / price) * 100;
            maxCPC = netProfit * (cr / 100);
        }

        setText('roas_result_be', roasBE.toFixed(2) + 'x');
        setText('roas_result_acos', acosMax.toFixed(1) + '%');
        setText('roas_result_profit', formatRupiah(Math.round(adCostPerUnit > 0 ? profitAfterAds : netProfit)));
        setText('roas_cr_display', cr + '%');
        setText('roas_result_maxcpc', formatRupiah(Math.round(maxCPC)));

        updateAdsAnalysis(price, netProfit, roasBE, cr);
    }

    /**
     * Calculate Auto mode ROAS for a product
     * @param {Object} product 
     */
    function calculateAutoModeROAS(product) {
        const hpp = product.cost_of_goods || product.hpp || 0;
        const price = product.display_price || product.displayPrice || product.selling_price || 0;
        const profit = product.result_profit || product.profit || 0;
        const cr = 2;

        const netProfit = profit;
        let roasBE = 0;
        let acosMax = 0;
        let maxCPC = 0;

        if (netProfit > 0 && price > 0) {
            roasBE = price / netProfit;
            acosMax = (netProfit / price) * 100;
            maxCPC = netProfit * (cr / 100);
        }

        autoData = {
            price: price,
            netProfit: netProfit,
            roasBE: roasBE,
            isActive: true
        };

        // Update global for backward compatibility
        if (typeof window.roasAutoData !== 'undefined') {
            window.roasAutoData = autoData;
        }

        setText('roas_result_be', roasBE.toFixed(2) + 'x');
        setText('roas_result_acos', acosMax.toFixed(1) + '%');
        setText('roas_result_profit', formatRupiah(Math.round(netProfit)));
        setText('roas_cr_display', cr + '%');
        setText('roas_result_maxcpc', formatRupiah(Math.round(maxCPC)));

        updateAdsAnalysis(price, netProfit, roasBE, cr);
    }

    /**
     * Update ads health analysis
     * @param {number} price 
     * @param {number} netProfit 
     * @param {number} roasBE 
     * @param {number} cr 
     */
    function updateAdsAnalysis(price, netProfit, roasBE, cr) {
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

        setText('organicProfitDisplay', formatRupiah(Math.round(netProfit)));

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

        updateStatusBadge(price, netProfit, adsCostPerSale, targetRoas, actualRoas);
    }

    /**
     * Update status badge and recommendation
     */
    function updateStatusBadge(price, netProfit, adsCostPerSale, targetRoas, actualRoas) {
        const statusBadge = document.getElementById('adsStatusBadge');
        const recText = document.getElementById('recommendationContent');
        const cpc = parseFloat(document.getElementById('cpc')?.value) || 0;
        const crAds = parseFloat(document.getElementById('cr')?.value) || 2;

        if (!statusBadge || !recText) return;

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

    // ==================== PUBLIC API ====================

    return {
        // Product database
        saveProductDB,
        deleteProduct,
        renderProductDB,
        renderProductSelectors,

        // Ads analysis
        toggleTargetProfitSection,
        calculateROASBreakeven,
        calculateAutoModeROAS,
        updateAdsAnalysis,

        // Input validation
        validateCPC,
        validateCR,
        validateROAS,

        // State
        isTargetProfitEnabled: () => targetProfitEnabled,
        getAdsTargetType: () => adsTargetType,
        setAdsTargetType: (type) => { adsTargetType = type; },
        getAutoData: () => ({ ...autoData }),
        setAutoData: (data) => { autoData = { ...data }; }
    };
})();

// ==================== GLOBAL COMPATIBILITY LAYER ====================

if (typeof window !== 'undefined') {
    window.AdsAnalyzer = AdsAnalyzer;

    // Backward compatible global functions
    window.saveProductDB = AdsAnalyzer.saveProductDB;
    window.deleteProduct = AdsAnalyzer.deleteProduct;
    window.renderProductDB = AdsAnalyzer.renderProductDB;
    window.renderProductSelectors = AdsAnalyzer.renderProductSelectors;
    window.toggleTargetProfitSection = AdsAnalyzer.toggleTargetProfitSection;
    window.calculateROASBreakeven = AdsAnalyzer.calculateROASBreakeven;
    window.calculateAutoModeROAS = AdsAnalyzer.calculateAutoModeROAS;
    window.updateAdsAnalysisFromROAS = AdsAnalyzer.updateAdsAnalysis;

    // Validation functions
    window.validateCPC = AdsAnalyzer.validateCPC;
    window.validateCR = AdsAnalyzer.validateCR;
}

