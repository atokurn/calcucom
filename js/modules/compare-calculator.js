/**
 * CompareCalculator - Module for marketplace comparison
 * Using IIFE pattern for browser compatibility
 */
const CompareCalculator = (function () {
    'use strict';

    // ==================== MARKETPLACE DATA ====================

    // Fee rates per marketplace and seller type
    // These match the main calculator's shopeeRates, tokopediaRates, tiktokRates
    const MARKETPLACE_FEES = {
        shopee: {
            name: 'Shopee',
            admin: {
                nonstar: { A: 8, B: 7.5, C: 5.75, D: 4.25, E: 2.5, F: 2.5 },
                star: { A: 7, B: 6.5, C: 5, D: 3.75, E: 2, F: 2 },
                mall: { A: 6.5, B: 6, C: 4.5, D: 3.5, E: 1.75, F: 1.75 }
            },
            service: { freeShip: 4.0, cashback: 4.5 },
            color: '#EE4D2D'
        },
        tokopedia: {
            name: 'Tokopedia',
            admin: {
                regular: { A: 6.5, B: 6, C: 4.5, D: 3.5, E: 2, F: 2 },
                power: { A: 5.5, B: 5, C: 4, D: 3, E: 1.75, F: 1.75 },
                mall: { A: 5, B: 4.5, C: 3.5, D: 2.75, E: 1.5, F: 1.5 }
            },
            service: { freeShip: 4.0 },
            color: '#03AC0E'
        },
        tiktok: {
            name: 'TikTok',
            admin: {
                regular: { A: 6.5, B: 6, C: 4.5, D: 3.5, E: 2, F: 2 },
                mall: { A: 5.5, B: 5, C: 4, D: 3, E: 1.5, F: 1.5 }
            },
            service: { freeShip: 4.0 },
            color: '#000000'
        },
        lazada: {
            name: 'Lazada',
            admin: {
                regular: { A: 6, B: 5.5, C: 4.5, D: 3.5, E: 2, F: 2 },
                mall: { A: 5, B: 4.5, C: 3.5, D: 2.5, E: 1.5, F: 1.5 }
            },
            service: { freeShip: 4.0 },
            color: '#10156F'
        }
    };

    // Default seller type per marketplace for comparison
    const DEFAULT_SELLER_TYPE = {
        shopee: 'nonstar',
        tokopedia: 'regular',
        tiktok: 'regular',
        lazada: 'regular'
    };

    // ==================== PRIVATE STATE ====================

    let selectedProducts = [];
    let sortBy = 'profit_desc';

    // Scenario A/B state for comparison
    let scenarios = {
        a: null,
        b: null
    };

    // ==================== SCENARIO MANAGEMENT ====================

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else if (typeof UIManager !== 'undefined') {
            UIManager.showToast(message, type);
        }
    }

    /**
     * Save current calculator state as a scenario
     * @param {string} slot - 'a' or 'b'
     */
    function saveScenario(slot) {
        const hpp = parseFloat(document.getElementById('cmp_hpp')?.value) || 0;
        const price = parseFloat(document.getElementById('cmp_price')?.value) || 0;
        const category = document.getElementById('cmp_category')?.value || 'A';
        const name = document.getElementById('cmp_name')?.value || `Skenario ${slot.toUpperCase()}`;

        if (hpp <= 0 || price <= 0) {
            showToast('Isi HPP dan Harga Jual dulu', 'warning');
            return;
        }

        scenarios[slot] = {
            name,
            hpp,
            price,
            category,
            savedAt: Date.now(),
            results: compareAllMarketplaces(hpp, price, category)
        };

        renderScenarioCards();
        showToast(`Skenario ${slot.toUpperCase()} tersimpan`, 'success');
    }

    /**
     * Load scenario into calculator form
     * @param {string} slot - 'a' or 'b'
     */
    function loadScenario(slot) {
        const scenario = scenarios[slot];
        if (!scenario) {
            showToast('Skenario belum disimpan', 'warning');
            return;
        }

        const hppInput = document.getElementById('cmp_hpp');
        const priceInput = document.getElementById('cmp_price');
        const categoryInput = document.getElementById('cmp_category');
        const nameInput = document.getElementById('cmp_name');

        if (hppInput) hppInput.value = scenario.hpp;
        if (priceInput) priceInput.value = scenario.price;
        if (categoryInput) categoryInput.value = scenario.category;
        if (nameInput) nameInput.value = scenario.name;

        compareMarketplaceFull();
        showToast(`Skenario ${slot.toUpperCase()} dimuat`, 'info');
    }

    /**
     * Clear a scenario
     * @param {string} slot - 'a' or 'b'
     */
    function clearScenario(slot) {
        scenarios[slot] = null;
        renderScenarioCards();
    }

    /**
     * Compare scenarios A and B side by side
     */
    function compareScenarios() {
        if (!scenarios.a || !scenarios.b) {
            showToast('Simpan 2 skenario dulu (A dan B)', 'warning');
            return;
        }

        const container = document.getElementById('cmp_scenario_comparison');
        if (!container) return;

        const a = scenarios.a;
        const b = scenarios.b;

        // Find best marketplace for each scenario
        const bestA = a.results[0];
        const bestB = b.results[0];

        container.innerHTML = `
            <div class="grid grid-cols-2 gap-4 mt-4">
                <!-- Scenario A -->
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">A</span>
                        <span class="font-bold text-slate-700 dark:text-white truncate">${a.name}</span>
                    </div>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-slate-500">HPP</span>
                            <span class="font-medium text-slate-700 dark:text-white">${formatRupiah(a.hpp)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">Harga</span>
                            <span class="font-medium text-slate-700 dark:text-white">${formatRupiah(a.price)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">Kategori</span>
                            <span class="font-medium text-slate-700 dark:text-white">${a.category}</span>
                        </div>
                        <div class="pt-2 border-t border-blue-200 dark:border-blue-700">
                            <div class="text-xs text-slate-400 mb-1">Best: ${bestA.name}</div>
                            <div class="text-xl font-black ${bestA.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}">${formatRupiah(bestA.profit)}</div>
                            <div class="text-xs text-slate-500">Margin: ${bestA.margin.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>

                <!-- Scenario B -->
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">B</span>
                        <span class="font-bold text-slate-700 dark:text-white truncate">${b.name}</span>
                    </div>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-slate-500">HPP</span>
                            <span class="font-medium text-slate-700 dark:text-white">${formatRupiah(b.hpp)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">Harga</span>
                            <span class="font-medium text-slate-700 dark:text-white">${formatRupiah(b.price)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">Kategori</span>
                            <span class="font-medium text-slate-700 dark:text-white">${b.category}</span>
                        </div>
                        <div class="pt-2 border-t border-purple-200 dark:border-purple-700">
                            <div class="text-xs text-slate-400 mb-1">Best: ${bestB.name}</div>
                            <div class="text-xl font-black ${bestB.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}">${formatRupiah(bestB.profit)}</div>
                            <div class="text-xs text-slate-500">Margin: ${bestB.margin.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comparison Summary -->
            <div class="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-slate-200 dark:border-slate-700">
                <div class="text-center">
                    <div class="text-sm text-slate-500 mb-2">Selisih Profit (Best Marketplace)</div>
                    ${renderProfitDifference(bestA.profit, bestB.profit, a.name, b.name)}
                </div>
            </div>
        `;
    }

    /**
     * Render profit difference summary
     */
    function renderProfitDifference(profitA, profitB, nameA, nameB) {
        const diff = profitA - profitB;
        const winner = diff > 0 ? nameA : (diff < 0 ? nameB : 'Sama');
        const absDiff = Math.abs(diff);
        const color = diff > 0 ? 'text-blue-600' : (diff < 0 ? 'text-purple-600' : 'text-slate-500');

        if (diff === 0) {
            return `<div class="text-lg font-bold text-slate-600">Profit Sama</div>`;
        }

        return `
            <div class="text-2xl font-black ${color}">
                ${diff > 0 ? '+' : '-'}${formatRupiah(absDiff)}
            </div>
            <div class="text-xs text-slate-500 mt-1">
                <span class="font-medium">${winner}</span> lebih untung ${formatRupiah(absDiff)}
            </div>
        `;
    }

    /**
     * Render scenario cards in the UI
     */
    function renderScenarioCards() {
        const container = document.getElementById('cmp_scenario_cards');
        if (!container) return;

        const renderCard = (slot, scenario) => {
            if (!scenario) {
                return `
                    <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border-2 border-dashed border-slate-200 dark:border-slate-600 text-center">
                        <div class="text-slate-400 mb-2">
                            <i class="fas fa-plus-circle text-2xl"></i>
                        </div>
                        <div class="text-xs text-slate-500 mb-2">Skenario ${slot.toUpperCase()}</div>
                        <button onclick="CompareCalculator.saveScenario('${slot}')" 
                            class="text-xs px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                            Simpan sebagai ${slot.toUpperCase()}
                        </button>
                    </div>
                `;
            }

            const colorClass = slot === 'a' ? 'blue' : 'purple';
            const best = scenario.results[0];

            return `
                <div class="bg-${colorClass}-50 dark:bg-${colorClass}-900/20 rounded-xl p-3 border border-${colorClass}-200 dark:border-${colorClass}-800">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="w-5 h-5 rounded-full bg-${colorClass}-500 text-white text-[10px] font-bold flex items-center justify-center">${slot.toUpperCase()}</span>
                            <span class="text-xs font-bold text-slate-700 dark:text-white truncate">${scenario.name}</span>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="CompareCalculator.loadScenario('${slot}')" 
                                class="w-6 h-6 flex items-center justify-center text-${colorClass}-500 hover:bg-${colorClass}-100 dark:hover:bg-${colorClass}-900/50 rounded transition-colors" title="Muat">
                                <i class="fas fa-upload text-xs"></i>
                            </button>
                            <button onclick="CompareCalculator.clearScenario('${slot}')" 
                                class="w-6 h-6 flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Hapus">
                                <i class="fas fa-times text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div class="text-xs text-slate-500">
                        <span>HPP ${formatRupiah(scenario.hpp)}</span> • <span>Jual ${formatRupiah(scenario.price)}</span>
                    </div>
                    <div class="mt-2 text-right">
                        <span class="text-[10px] text-slate-400">${best.name}:</span>
                        <span class="text-sm font-bold ${best.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}">${formatRupiah(best.profit)}</span>
                    </div>
                </div>
            `;
        };

        container.innerHTML = `
            <div class="grid grid-cols-2 gap-3 mb-3">
                ${renderCard('a', scenarios.a)}
                ${renderCard('b', scenarios.b)}
            </div>
            ${scenarios.a && scenarios.b ? `
                <button onclick="CompareCalculator.compareScenarios()" 
                    class="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
                    <i class="fas fa-balance-scale mr-2"></i>
                    Bandingkan A vs B
                </button>
            ` : ''}
        `;
    }

    /**
     * Get current scenarios
     * @returns {Object}
     */
    function getScenarios() {
        return { ...scenarios };
    }

    /**
     * Check if scenarios are ready for comparison
     * @returns {boolean}
     */
    function canCompare() {
        return scenarios.a !== null && scenarios.b !== null;
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
     * @param {string} category - Category group (A-F)
     * @param {string} marketplace - Marketplace key
     * @param {string} sellerType - Optional seller type override
     * @returns {Object}
     */
    function calculateForMarketplace(hpp, price, category, marketplace, sellerType) {
        const mp = MARKETPLACE_FEES[marketplace];
        if (!mp) return null;

        // Get seller type (use provided or default)
        const sType = sellerType || DEFAULT_SELLER_TYPE[marketplace] || 'regular';

        // Get admin fee from nested structure
        const adminRates = mp.admin[sType] || mp.admin[Object.keys(mp.admin)[0]];
        const adminPct = adminRates[category] || adminRates.A || 0;

        // Calculate service fee (assume freeShip program is active for comparison)
        const servicePct = mp.service?.freeShip || 4.0;

        const totalFeePct = adminPct + servicePct;
        const totalFee = price * (totalFeePct / 100);
        const profit = price - hpp - totalFee;
        const margin = price > 0 ? (profit / price) * 100 : 0;
        const roasBE = profit > 0 ? (price / profit) : 0;

        return {
            key: marketplace,
            name: mp.name,
            color: mp.color,
            sellerType: sType,
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
        renderScenarioCards,

        // Scenario management
        saveScenario,
        loadScenario,
        clearScenario,
        compareScenarios,
        getScenarios,
        canCompare,

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
    window.saveCompareScenario = CompareCalculator.saveScenario;
    window.compareScenarios = CompareCalculator.compareScenarios;

    // Expose marketplace fees for backward compatibility
    if (typeof window.marketplaceFees === 'undefined') {
        window.marketplaceFees = CompareCalculator.MARKETPLACE_FEES;
    }
}

