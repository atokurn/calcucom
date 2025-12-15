/**
 * ROASCalculator - Module for ROAS breakeven calculations
 * Using IIFE pattern for browser compatibility
 */
const ROASCalculator = (function () {
    'use strict';

    // ==================== PRIVATE STATE ====================

    let mode = 'auto'; // 'auto' or 'manual'
    let selectedProducts = [];
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
     * Get product database
     * @returns {Array}
     */
    function getProductDB() {
        return window.productDB || [];
    }

    // ==================== MODE SWITCHING ====================

    /**
     * Switch between Auto and Manual mode
     * @param {string} newMode - 'auto' or 'manual'
     */
    function switchMode(newMode) {
        mode = newMode;
        const autoSection = document.getElementById('roas_auto_section');
        const manualSection = document.getElementById('roas_manual_section');
        const btnAuto = document.getElementById('btn-roas-auto');
        const btnManual = document.getElementById('btn-roas-manual');

        const activeClass = 'px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm transition-all';
        const inactiveClass = 'px-3 py-1 text-xs font-bold text-slate-400 rounded-md transition-all hover:bg-white/50 dark:hover:bg-slate-600/50';

        if (newMode === 'auto') {
            autoSection?.classList.remove('hidden');
            manualSection?.classList.add('hidden');
            if (btnAuto) btnAuto.className = activeClass;
            if (btnManual) btnManual.className = inactiveClass;
        } else {
            autoSection?.classList.add('hidden');
            manualSection?.classList.remove('hidden');
            if (btnManual) btnManual.className = activeClass;
            if (btnAuto) btnAuto.className = inactiveClass;
            autoData.isActive = false;
            calculateBreakeven();
        }
    }

    // ==================== PRODUCT ROAS CALCULATION ====================

    /**
     * Calculate ROAS for a single product
     * @param {Object} product 
     * @returns {Object}
     */
    function calculateProductROAS(product) {
        const hpp = product.cost_of_goods || product.hpp || product.modal || 0;
        const price = product.display_price || product.displayPrice || product.selling_price || product.sellingPrice || 0;
        const profit = product.result_profit || product.profit || 0;
        const cr = 2; // Default conversion rate

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

    /**
     * Calculate ROAS breakeven (manual mode)
     */
    function calculateBreakeven() {
        if (typeof window.calculateROASBreakeven === 'function') {
            window.calculateROASBreakeven();
        }
    }

    /**
     * Calculate average ROAS from selected products
     * @returns {Object}
     */
    function calculateAverageROAS() {
        if (selectedProducts.length === 0) {
            return { avgRoas: 0, avgProfit: 0, avgAcos: 0, avgPrice: 0, productCount: 0 };
        }

        const productDB = getProductDB();
        let totalRoas = 0;
        let totalProfit = 0;
        let totalPrice = 0;
        let productCount = 0;

        selectedProducts.forEach(id => {
            const product = productDB.find(p => p.id === id);
            if (product) {
                const roasData = calculateProductROAS(product);
                totalRoas += roasData.roasBE;
                totalProfit += roasData.netProfit;
                totalPrice += roasData.price;
                productCount++;
            }
        });

        const avgRoas = productCount > 0 ? totalRoas / productCount : 0;
        const avgProfit = productCount > 0 ? totalProfit / productCount : 0;
        const avgPrice = productCount > 0 ? totalPrice / productCount : 0;
        const avgAcos = avgRoas > 0 ? (1 / avgRoas) * 100 : 0;

        return { avgRoas, avgProfit, avgAcos, avgPrice, productCount };
    }

    // ==================== PRODUCT SELECTION ====================

    /**
     * Add product to selection
     * @param {number} id 
     */
    function addProduct(id) {
        if (!selectedProducts.includes(id)) {
            selectedProducts.push(id);
        }
    }

    /**
     * Remove product from selection
     * @param {number} id 
     */
    function removeProduct(id) {
        const idx = selectedProducts.indexOf(id);
        if (idx > -1) {
            selectedProducts.splice(idx, 1);
        }
    }

    /**
     * Toggle product selection
     * @param {number} id 
     */
    function toggleProduct(id) {
        if (selectedProducts.includes(id)) {
            removeProduct(id);
        } else {
            addProduct(id);
        }
    }

    /**
     * Clear all selected products
     */
    function clearSelection() {
        selectedProducts = [];
    }

    /**
     * Get selected products
     * @returns {Array}
     */
    function getSelectedProducts() {
        return [...selectedProducts];
    }

    // ==================== UI UPDATES ====================

    /**
     * Update ROAS display with calculated values
     * @param {Object} data 
     */
    function updateDisplay(data) {
        const { avgRoas, avgProfit, avgAcos, avgPrice } = data;
        const cr = 2;

        const roasBEEl = document.getElementById('roas_result_be');
        const acosEl = document.getElementById('roas_result_acos');
        const profitEl = document.getElementById('roas_result_profit');
        const crEl = document.getElementById('roas_cr_display');
        const maxCpcEl = document.getElementById('roas_result_maxcpc');

        if (roasBEEl) roasBEEl.innerText = avgRoas.toFixed(2) + 'x';
        if (acosEl) acosEl.innerText = avgAcos.toFixed(1) + '%';
        if (profitEl) profitEl.innerText = formatRupiah(Math.round(avgProfit));
        if (crEl) crEl.innerText = cr + '%';
        if (maxCpcEl) maxCpcEl.innerText = formatRupiah(Math.round(avgProfit * (cr / 100)));

        // Store Auto mode data
        autoData = {
            price: avgPrice,
            netProfit: avgProfit,
            roasBE: avgRoas,
            isActive: true
        };

        // Update global for backward compatibility
        if (typeof window.roasAutoData !== 'undefined') {
            window.roasAutoData = autoData;
        }
    }

    /**
     * Reset ROAS display to default values
     */
    function resetDisplay() {
        const roasBEEl = document.getElementById('roas_result_be');
        const acosEl = document.getElementById('roas_result_acos');
        const profitEl = document.getElementById('roas_result_profit');

        if (roasBEEl) roasBEEl.innerText = '0.00x';
        if (acosEl) acosEl.innerText = '0%';
        if (profitEl) profitEl.innerText = 'Rp 0';
    }

    // ==================== ACCORDION ====================

    /**
     * Toggle accordion item
     * @param {HTMLElement} button 
     */
    function toggleAccordion(button) {
        const content = button.nextElementSibling;
        const icon = button.querySelector('i');
        content?.classList.toggle('hidden');
        icon?.classList.toggle('rotate-180');
    }

    // ==================== PUBLIC API ====================

    return {
        // Mode
        switchMode,
        getMode: () => mode,

        // Calculation
        calculateProductROAS,
        calculateBreakeven,
        calculateAverageROAS,

        // Product selection
        addProduct,
        removeProduct,
        toggleProduct,
        clearSelection,
        getSelectedProducts,
        setSelectedProducts: (products) => { selectedProducts = [...products]; },

        // UI
        updateDisplay,
        resetDisplay,
        toggleAccordion,

        // Auto data
        getAutoData: () => ({ ...autoData }),
        setAutoData: (data) => { autoData = { ...data }; }
    };
})();

// ==================== GLOBAL COMPATIBILITY LAYER ====================

if (typeof window !== 'undefined') {
    window.ROASCalculator = ROASCalculator;

    // Backward compatible global functions
    window.switchROASMode = ROASCalculator.switchMode;
    window.toggleRoasAccordion = ROASCalculator.toggleAccordion;

    // Initialize roasAutoData if not exists
    if (typeof window.roasAutoData === 'undefined') {
        window.roasAutoData = ROASCalculator.getAutoData();
    }
}
