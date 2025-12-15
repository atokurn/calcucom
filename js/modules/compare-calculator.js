/**
 * CompareCalculator - Module for marketplace comparison
 * Using IIFE pattern for browser compatibility
 */
const CompareCalculator = (function () {
    'use strict';

    // ==================== MARKETPLACE DATA ====================

    const MARKETPLACE_FEES = {
        shopee: {
            name: 'Shopee',
            admin: { A: 8, B: 7.5, C: 5.75, D: 4.25, E: 2.5 },
            service: 6.0,
            color: '#EE4D2D'
        },
        tokopedia: {
            name: 'Tokopedia',
            admin: { A: 5.5, B: 5, C: 4, D: 3, E: 2 },
            service: 4.5,
            color: '#03AC0E'
        },
        tiktok: {
            name: 'TikTok',
            admin: { A: 5, B: 4.5, C: 3.5, D: 2.5, E: 1.5 },
            service: 4.0,
            color: '#000000'
        },
        lazada: {
            name: 'Lazada',
            admin: { A: 6, B: 5.5, C: 4.5, D: 3.5, E: 2 },
            service: 5.0,
            color: '#10156F'
        }
    };

    // ==================== PRIVATE STATE ====================

    let selectedProducts = [];
    let sortBy = 'profit_desc';

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

    // ==================== COMPARISON CALCULATION ====================

    /**
     * Calculate profit for a product in a specific marketplace
     * @param {number} hpp - Cost of goods
     * @param {number} price - Selling price
     * @param {string} category - Category group (A-E)
     * @param {string} marketplace - Marketplace key
     * @returns {Object}
     */
    function calculateForMarketplace(hpp, price, category, marketplace) {
        const mp = MARKETPLACE_FEES[marketplace];
        if (!mp) return null;

        const adminPct = mp.admin[category] || mp.admin.A;
        const servicePct = mp.service;
        const totalFeePct = adminPct + servicePct;
        const totalFee = price * (totalFeePct / 100);
        const profit = price - hpp - totalFee;
        const margin = price > 0 ? (profit / price) * 100 : 0;
        const roasBE = profit > 0 ? (price / profit) : 0;

        return {
            key: marketplace,
            name: mp.name,
            color: mp.color,
            adminPct,
            servicePct,
            totalFeePct,
            totalFee,
            profit,
            margin,
            roasBE
        };
    }

    /**
     * Compare all marketplaces for given product data
     * @param {number} hpp 
     * @param {number} price 
     * @param {string} category 
     * @returns {Array}
     */
    function compareAllMarketplaces(hpp, price, category) {
        const results = [];

        for (const key of Object.keys(MARKETPLACE_FEES)) {
            const result = calculateForMarketplace(hpp, price, category, key);
            if (result) results.push(result);
        }

        // Sort by profit descending
        results.sort((a, b) => b.profit - a.profit);

        return results;
    }

    // ==================== UI RENDERING ====================

    /**
     * Compare marketplaces and render results (basic mode)
     */
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

        const results = compareAllMarketplaces(hpp, price, category);
        renderResults(resultsContainer, results);
    }

    /**
     * Render comparison results
     * @param {HTMLElement} container 
     * @param {Array} results 
     */
    function renderResults(container, results) {
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

        container.innerHTML = html;
    }

    // ==================== PRODUCT MULTI-SELECT ====================

    /**
     * Toggle product selection
     * @param {number} id 
     */
    function toggleProduct(id) {
        const idx = selectedProducts.indexOf(id);
        if (idx > -1) {
            selectedProducts.splice(idx, 1);
        } else {
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
     * Get selected products
     * @returns {Array}
     */
    function getSelectedProducts() {
        return [...selectedProducts];
    }

    /**
     * Clear all selected products
     */
    function clearSelection() {
        selectedProducts = [];
    }

    /**
     * Set sort option
     * @param {string} option 
     */
    function setSortBy(option) {
        sortBy = option;
    }

    /**
     * Get current sort option
     * @returns {string}
     */
    function getSortBy() {
        return sortBy;
    }

    /**
     * Sort products array based on current sortBy setting
     * @param {Array} products 
     * @returns {Array}
     */
    function sortProducts(products) {
        return [...products].sort((a, b) => {
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
    }

    // ==================== PUBLIC API ====================

    return {
        // Marketplace data
        MARKETPLACE_FEES,

        // Calculation
        calculateForMarketplace,
        compareAllMarketplaces,
        compareMarketplaceFull,

        // Rendering
        renderResults,

        // Product selection
        toggleProduct,
        removeProduct,
        getSelectedProducts,
        setSelectedProducts: (products) => { selectedProducts = [...products]; },
        clearSelection,

        // Sorting
        setSortBy,
        getSortBy,
        sortProducts
    };
})();

// ==================== GLOBAL COMPATIBILITY LAYER ====================

if (typeof window !== 'undefined') {
    window.CompareCalculator = CompareCalculator;

    // Backward compatible global functions
    window.compareMarketplaceFull = CompareCalculator.compareMarketplaceFull;

    // Expose marketplace fees for backward compatibility
    if (typeof window.marketplaceFees === 'undefined') {
        window.marketplaceFees = CompareCalculator.MARKETPLACE_FEES;
    }
}
