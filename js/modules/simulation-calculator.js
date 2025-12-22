/**
 * SimulationCalculator - Monthly projection and simulation calculations
 * Handles sales projections, ROAS break-even, and business insights
 */
const SimulationCalculator = (function () {
    'use strict';

    // ==================== STATE ====================

    let currentMode = 'ads'; // 'ads' or 'sales'

    // ==================== MODE SWITCHING ====================

    /**
     * Switch simulation view mode
     * @param {string} mode - 'ads' or 'sales'
     */
    function setMode(mode) {
        currentMode = mode;

        // Update global state
        if (typeof window.simMode !== 'undefined') {
            window.simMode = mode;
        }

        const btnAds = document.getElementById('btnSimAds');
        const btnSales = document.getElementById('btnSimSales');
        const viewAds = document.getElementById('sim-view-ads');
        const viewSales = document.getElementById('sim-view-sales');

        const activeClass = "px-2 py-1 text-[10px] font-bold rounded-md bg-violet-600 text-white shadow-sm transition-all";
        const inactiveClass = "px-2 py-1 text-[10px] font-bold rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all";

        if (mode === 'ads') {
            if (btnAds) btnAds.className = activeClass;
            if (btnSales) btnSales.className = inactiveClass;
            if (viewAds) viewAds.classList.remove('hidden');
            if (viewSales) viewSales.classList.add('hidden');
        } else {
            if (btnSales) btnSales.className = activeClass;
            if (btnAds) btnAds.className = inactiveClass;
            if (viewSales) viewSales.classList.remove('hidden');
            if (viewAds) viewAds.classList.add('hidden');
        }

        calculateProjection();
    }

    /**
     * Get current mode
     * @returns {string}
     */
    function getMode() {
        return currentMode;
    }

    // ==================== CALCULATIONS ====================

    /**
     * Calculate monthly projection
     */
    function calculateProjection() {
        // Get base data from Module 1 (Single)
        let profit = 0;
        let sellingPrice = 0;

        const parseRupiahFn = typeof parseRupiah === 'function'
            ? parseRupiah
            : (s) => parseFloat(String(s).replace(/[^\d,-]/g, '')) || 0;

        const formatRupiahFn = typeof formatRupiah === 'function'
            ? formatRupiah
            : (n) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

        const elProfit = document.getElementById('finalProfit');
        const elPrice = document.getElementById('finalPriceDisplay');

        if (elProfit && elPrice) {
            profit = parseRupiahFn(elProfit.innerText || '0');
            sellingPrice = parseRupiahFn(elPrice.innerText || '0');
        }

        // Update Ads/ROAS View
        updateAdsView(profit, sellingPrice, formatRupiahFn);

        // Update Sales View
        updateSalesView(profit, sellingPrice, formatRupiahFn);
    }

    /**
     * Update Ads/ROAS simulation view
     */
    function updateAdsView(profit, sellingPrice, formatRupiahFn) {
        const elRoasBe = document.getElementById('simRoasBe');
        const elAcosBe = document.getElementById('simAcosBe');
        const elMaxCpc = document.getElementById('simMaxCpc');
        const elProfitUnit = document.getElementById('simProfitUnit');

        if (elRoasBe && elAcosBe) {
            if (profit > 0 && sellingPrice > 0) {
                const roasBe = sellingPrice / profit;
                const acosBe = (profit / sellingPrice) * 100;
                const maxCpc = profit * 0.02; // Assume 2% CR

                elRoasBe.innerText = roasBe.toFixed(2) + "x";
                elAcosBe.innerText = acosBe.toFixed(1) + "%";
                if (elMaxCpc) elMaxCpc.innerText = formatRupiahFn(maxCpc);
                if (elProfitUnit) elProfitUnit.innerText = formatRupiahFn(profit);
            } else {
                elRoasBe.innerText = "∞";
                elAcosBe.innerText = "N/A";
                if (elMaxCpc) elMaxCpc.innerText = "Rp 0";
                if (elProfitUnit) elProfitUnit.innerText = formatRupiahFn(profit);
            }
        }
    }

    /**
     * Update Sales simulation view
     */
    function updateSalesView(profit, sellingPrice, formatRupiahFn) {
        const elSalesInput = document.getElementById('monthlySalesInput');
        if (!elSalesInput) return;

        const qty = parseFloat(elSalesInput.value) || 0;
        const revenue = sellingPrice * qty;
        const totalProfit = profit * qty;

        // Update displays
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        };

        setText('simMonthlyRevenue', formatRupiahFn(revenue));
        setText('simMonthlyProfit', formatRupiahFn(totalProfit));
        setText('simMonthlySales', qty + ' unit');

        // Calculate target metrics
        const targetProfit = parseFloat(document.getElementById('targetMonthlyProfit')?.value) || 0;

        if (targetProfit > 0 && profit > 0) {
            const requiredSales = Math.ceil(targetProfit / profit);
            setText('simRequiredSales', requiredSales + ' unit');

            // Required revenue
            const requiredRevenue = requiredSales * sellingPrice;
            setText('simRequiredRevenue', formatRupiahFn(requiredRevenue));
        }
    }

    // ==================== ROAS CALCULATIONS ====================

    /**
     * Calculate ROAS break-even metrics
     * @param {number} profit - Profit per unit
     * @param {number} sellingPrice - Selling price
     * @returns {Object}
     */
    function calculateRoasMetrics(profit, sellingPrice) {
        if (profit <= 0 || sellingPrice <= 0) {
            return {
                roasBe: Infinity,
                acosBe: 0,
                maxCpc: 0,
                isHealthy: false
            };
        }

        const roasBe = sellingPrice / profit;
        const acosBe = (profit / sellingPrice) * 100;
        const maxCpc = profit * 0.02; // Assume 2% CR
        const isHealthy = roasBe < 10; // Very healthy if ROAS BE < 10x

        return {
            roasBe,
            acosBe,
            maxCpc,
            isHealthy
        };
    }

    /**
     * Analyze actual ROAS performance
     * @param {Object} params - Analysis parameters
     * @returns {Object}
     */
    function analyzeRoasPerformance(params) {
        const {
            actualRoas = 0,
            targetRoas = 0,
            profit = 0,
            adsCostPerSale = 0
        } = params;

        let status = 'unknown';
        let recommendation = '';
        let statusClass = '';

        if (profit <= 0) {
            status = 'loss';
            statusClass = 'bg-gray-200 text-gray-600';
            recommendation = 'Produk rugi tanpa iklan, tidak disarankan beriklan.';
        } else if (adsCostPerSale > profit) {
            status = 'boncos';
            statusClass = 'bg-red-100 text-red-600';
            recommendation = 'Biaya iklan per penjualan melebihi profit produk.';
        } else if (targetRoas > 0 && actualRoas < targetRoas) {
            status = 'below_target';
            statusClass = 'bg-yellow-100 text-yellow-700';
            recommendation = `Profit masih ada, tapi ROAS aktual di bawah target (${targetRoas.toFixed(2)}x).`;
        } else if (actualRoas > 0) {
            status = 'profit';
            statusClass = 'bg-emerald-100 text-emerald-600';
            recommendation = 'Kinerja iklan sehat dan memenuhi target profitabilitas.';
        }

        return {
            status,
            statusClass,
            recommendation
        };
    }

    // ==================== MONTHLY GOALS ====================

    /**
     * Calculate required sales for monthly profit goal
     * @param {number} monthlyTarget - Target monthly profit
     * @param {number} profitPerUnit - Profit per unit
     * @returns {Object}
     */
    function calculateMonthlyGoal(monthlyTarget, profitPerUnit) {
        if (profitPerUnit <= 0) {
            return {
                requiredSales: Infinity,
                dailySales: Infinity,
                isAchievable: false
            };
        }

        const requiredSales = Math.ceil(monthlyTarget / profitPerUnit);
        const dailySales = Math.ceil(requiredSales / 30);

        return {
            requiredSales,
            dailySales,
            isAchievable: requiredSales < 10000 // Reasonable limit
        };
    }

    /**
     * Generate business insights based on data
     * @param {Object} data - Calculation data
     * @returns {Array} Array of insight objects
     */
    function generateInsights(data) {
        const insights = [];
        const { profit, margin, roasBe, dailySales } = data;

        // Margin insights
        if (margin >= 25) {
            insights.push({
                type: 'success',
                icon: 'fa-thumbs-up',
                text: 'Margin sangat sehat (>25%)! Cocok untuk scale up dengan iklan.'
            });
        } else if (margin >= 15) {
            insights.push({
                type: 'info',
                icon: 'fa-info-circle',
                text: `Margin ${margin.toFixed(1)}% cukup baik untuk iklan dengan ROAS target > ${roasBe.toFixed(1)}x.`
            });
        } else if (margin >= 5) {
            insights.push({
                type: 'warning',
                icon: 'fa-exclamation-triangle',
                text: 'Margin tipis. Fokus optimasi HPP atau negosiasi dengan supplier.'
            });
        } else if (profit > 0) {
            insights.push({
                type: 'danger',
                icon: 'fa-times-circle',
                text: 'Margin sangat tipis! Tidak disarankan beriklan berbayar.'
            });
        }

        // Daily sales insights
        if (dailySales <= 5) {
            insights.push({
                type: 'success',
                icon: 'fa-bullseye',
                text: `Target ${dailySales} pcs/hari sangat realistis dengan iklan yang tepat.`
            });
        } else if (dailySales <= 20) {
            insights.push({
                type: 'info',
                icon: 'fa-chart-line',
                text: `Butuh ${dailySales} pcs/hari. Pertimbangkan bundling atau promo flash sale.`
            });
        }

        return insights;
    }

    // ==================== PUBLIC API ====================

    return {
        // Mode
        setMode,
        getMode,

        // Calculations
        calculateProjection,
        calculateRoasMetrics,
        analyzeRoasPerformance,
        calculateMonthlyGoal,
        generateInsights
    };
})();

// ==================== BACKWARD COMPATIBILITY ====================

if (typeof window !== 'undefined') {
    window.SimulationCalculator = SimulationCalculator;

    // Legacy function mappings
    window.setSimMode = SimulationCalculator.setMode;
    window.calculateMonthlyProjection = SimulationCalculator.calculateProjection;
}
