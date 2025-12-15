/**
 * BundlingCalculator - Calculate profit for bundled products
 * Using IIFE pattern for browser compatibility
 */
const BundlingCalculator = (function () {
    'use strict';

    // ==================== PRIVATE STATE ====================

    let bundleProducts = [];
    let productIdCounter = 0;

    // ==================== PRIVATE METHODS ====================

    /**
     * Get platform fees from AppConstants or defaults
     * @returns {Object}
     */
    function getPlatformFees() {
        const platform = AppState?.get('platform') || 'shopee';
        const sellerType = AppState?.get('sellerType') || 'nonstar';
        const categoryGroup = AppState?.get('category.group') || 'A';

        if (typeof AppConstants !== 'undefined') {
            const config = AppConstants.getMarketplace(platform);
            const adminRate = AppConstants.getAdminFeeRate(platform, sellerType, categoryGroup);

            return {
                adminRate: adminRate,
                serviceRate: config.serviceFees?.freeShip?.rate || 4,
                serviceCap: config.serviceFees?.freeShip?.cap || 40000,
                processFee: config.orderProcessFee || 1250,
                fixedFee: config.fixedFee || 0,
                freeShipEnabled: AppState?.get('features.freeShipEnabled') || false,
                cashbackEnabled: AppState?.get('features.cashbackEnabled') || false
            };
        }

        // Default fallback
        return {
            adminRate: 8,
            serviceRate: 4,
            serviceCap: 40000,
            processFee: 1250,
            fixedFee: 0,
            freeShipEnabled: false,
            cashbackEnabled: false
        };
    }

    /**
     * Format rupiah using Formatters or fallback
     * @param {number} value 
     * @returns {string}
     */
    function formatRp(value) {
        if (typeof Formatters !== 'undefined') {
            return Formatters.formatRupiah(value);
        }
        return `Rp ${value.toLocaleString('id-ID')}`;
    }

    /**
     * Parse number from input
     * @param {string|number} value 
     * @returns {number}
     */
    function parseNum(value) {
        if (typeof Formatters !== 'undefined') {
            return Formatters.parseNumber(value);
        }
        if (typeof value === 'number') return value;
        return parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
    }

    // ==================== CALCULATION LOGIC ====================

    /**
     * Calculate bundle profit
     * @param {number} bundlePrice - Total bundle price
     * @param {Array} products - Array of {name, hpp, qty}
     * @param {Object} options - Additional options like voucherAmount
     * @returns {Object} Calculation results
     */
    function calculateBundleProfit(bundlePrice, products, options = {}) {
        const fees = getPlatformFees();
        const voucherAmount = options.voucherAmount || 0;

        // Calculate total HPP
        const totalHPP = products.reduce((sum, p) => {
            return sum + (parseNum(p.hpp) * (parseInt(p.qty) || 1));
        }, 0);

        // Calculate total items
        const totalItems = products.reduce((sum, p) => sum + (parseInt(p.qty) || 1), 0);

        // Base for fee calculation (after voucher deduction)
        const feeBase = Math.max(0, bundlePrice - voucherAmount);

        // Calculate fees
        const adminFee = feeBase * (fees.adminRate / 100);

        // Service fees (with cap)
        let serviceFee = 0;
        if (fees.freeShipEnabled) {
            serviceFee = Math.min(feeBase * (fees.serviceRate / 100), fees.serviceCap);
        }

        // Cashback fee if enabled
        let cashbackFee = 0;
        if (fees.cashbackEnabled && typeof AppConstants !== 'undefined') {
            const config = AppConstants.getMarketplace(AppState?.get('platform') || 'shopee');
            const cbRate = config.serviceFees?.cashback?.rate || 4.5;
            const cbCap = config.serviceFees?.cashback?.cap || 60000;
            cashbackFee = Math.min(feeBase * (cbRate / 100), cbCap);
        }

        // Total fees
        const processFee = fees.processFee;
        const fixedFee = fees.fixedFee;
        const totalFees = adminFee + serviceFee + cashbackFee + processFee + fixedFee;

        // Profit calculation
        const netCash = bundlePrice - totalFees - voucherAmount;
        const netProfit = netCash - totalHPP;
        const margin = bundlePrice > 0 ? (netProfit / bundlePrice) * 100 : 0;

        // Calculate individual totals for comparison
        const individualProfit = calculateIndividualProfit(products, fees);

        return {
            bundlePrice,
            totalHPP,
            totalItems,
            voucherAmount,

            // Fee breakdown
            adminFee,
            serviceFee,
            cashbackFee,
            processFee,
            fixedFee,
            totalFees,

            // Results
            netCash,
            netProfit,
            margin,

            // Comparison
            individualProfit: individualProfit.totalProfit,
            profitDifference: netProfit - individualProfit.totalProfit,
            profitDifferencePercent: individualProfit.totalProfit !== 0
                ? ((netProfit - individualProfit.totalProfit) / individualProfit.totalProfit) * 100
                : 0,

            // Is bundle better?
            isBundleBetter: netProfit > individualProfit.totalProfit
        };
    }

    /**
     * Calculate profit if products sold individually
     * @param {Array} products 
     * @param {Object} fees 
     * @returns {Object}
     */
    function calculateIndividualProfit(products, fees) {
        let totalProfit = 0;
        const details = [];

        products.forEach(p => {
            const price = parseNum(p.price) || (parseNum(p.hpp) * 2); // Assume 100% markup if no price
            const hpp = parseNum(p.hpp);
            const qty = parseInt(p.qty) || 1;

            const adminFee = price * (fees.adminRate / 100);
            const serviceFee = fees.freeShipEnabled
                ? Math.min(price * (fees.serviceRate / 100), fees.serviceCap)
                : 0;
            const itemFees = adminFee + serviceFee + fees.processFee;
            const itemProfit = (price - hpp - itemFees) * qty;

            totalProfit += itemProfit;
            details.push({
                name: p.name,
                profit: itemProfit
            });
        });

        return { totalProfit, details };
    }

    // ==================== UI MANAGEMENT ====================

    /**
     * Add product to bundle
     * @param {string} name 
     * @param {number} hpp 
     * @param {number} qty 
     * @param {number} price - Individual price (optional)
     */
    function addProduct(name = '', hpp = 0, qty = 1, price = 0) {
        productIdCounter++;
        bundleProducts.push({
            id: productIdCounter,
            name: name || `Produk ${productIdCounter}`,
            hpp: hpp,
            qty: qty,
            price: price
        });

        renderProductList();
        calculateAndRender();
    }

    /**
     * Remove product from bundle
     * @param {number} id 
     */
    function removeProduct(id) {
        bundleProducts = bundleProducts.filter(p => p.id !== id);
        renderProductList();
        calculateAndRender();
    }

    /**
     * Update product field
     * @param {number} id 
     * @param {string} field 
     * @param {*} value 
     */
    function updateProduct(id, field, value) {
        const product = bundleProducts.find(p => p.id === id);
        if (product) {
            product[field] = value;
            calculateAndRender();
        }
    }

    /**
     * Render product list in UI
     */
    function renderProductList() {
        const container = document.getElementById('bundleProductsList');
        if (!container) return;

        if (bundleProducts.length === 0) {
            container.innerHTML = `
                <div class="text-center text-slate-400 dark:text-slate-500 py-6">
                    <i class="fas fa-box-open text-2xl mb-2 block opacity-50"></i>
                    <p class="text-xs">Belum ada produk dalam bundle</p>
                    <p class="text-[10px] mt-1">Klik "Tambah Produk" untuk memulai</p>
                </div>
            `;
            return;
        }

        container.innerHTML = bundleProducts.map(p => `
            <div class="flex items-center gap-2 p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 group">
                <button onclick="BundlingCalculator.removeProduct(${p.id})" 
                    class="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                    <i class="fas fa-times text-xs"></i>
                </button>
                
                <input type="text" value="${p.name}" 
                    onchange="BundlingCalculator.updateProduct(${p.id}, 'name', this.value)"
                    class="flex-1 min-w-0 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white"
                    placeholder="Nama produk">
                
                <div class="flex items-center gap-1">
                    <span class="text-[10px] text-slate-400">HPP</span>
                    <div class="relative w-24">
                        <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">Rp</span>
                        <input type="text" value="${parseNum(p.hpp).toLocaleString('id-ID')}" 
                            oninput="BundlingCalculator.formatAndUpdate(${p.id}, 'hpp', this)"
                            class="w-full pl-6 pr-1 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded text-right bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white">
                    </div>
                </div>
                
                <div class="flex items-center gap-1">
                    <span class="text-[10px] text-slate-400">Qty</span>
                    <input type="number" value="${p.qty}" min="1" max="99"
                        onchange="BundlingCalculator.updateProduct(${p.id}, 'qty', parseInt(this.value) || 1)"
                        class="w-12 px-1 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded text-center bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white">
                </div>
            </div>
        `).join('');
    }

    /**
     * Format input and update product
     * @param {number} id 
     * @param {string} field 
     * @param {HTMLInputElement} input 
     */
    function formatAndUpdate(id, field, input) {
        const value = parseNum(input.value);
        input.value = value > 0 ? value.toLocaleString('id-ID') : '';
        updateProduct(id, field, value);
    }

    /**
     * Calculate and render results
     */
    function calculateAndRender() {
        const bundlePriceInput = document.getElementById('bundlePrice');
        const bundleVoucherInput = document.getElementById('bundleVoucher');

        const bundlePrice = bundlePriceInput ? parseNum(bundlePriceInput.value) : 0;
        const voucherAmount = bundleVoucherInput ? parseNum(bundleVoucherInput.value) : 0;

        if (bundleProducts.length === 0 || bundlePrice <= 0) {
            renderEmptyResults();
            return;
        }

        const result = calculateBundleProfit(bundlePrice, bundleProducts, { voucherAmount });
        renderResults(result);

        // Store in AppState
        if (typeof AppState !== 'undefined') {
            AppState.set('bundling.lastResult', result);
        }
    }

    /**
     * Render empty results state
     */
    function renderEmptyResults() {
        const elements = {
            bundleTotalHPP: 'Rp 0',
            bundleTotalItems: '0',
            bundleTotalFees: 'Rp 0',
            bundleNetProfit: 'Rp 0',
            bundleMargin: '0%',
            bundleComparison: '-'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });

        // Reset comparison section
        const comparisonSection = document.getElementById('bundleComparisonSection');
        if (comparisonSection) {
            comparisonSection.classList.add('hidden');
        }
    }

    /**
     * Render calculation results
     * @param {Object} result 
     */
    function renderResults(result) {
        // Main values
        updateElement('bundleTotalHPP', formatRp(result.totalHPP));
        updateElement('bundleTotalItems', `${result.totalItems} item`);
        updateElement('bundleTotalFees', formatRp(result.totalFees));
        updateElement('bundleNetProfit', formatRp(result.netProfit));
        updateElement('bundleMargin', `${result.margin.toFixed(1)}%`);

        // Fee breakdown
        updateElement('bundleAdminFee', `- ${formatRp(result.adminFee)}`);
        updateElement('bundleServiceFee', `- ${formatRp(result.serviceFee + result.cashbackFee)}`);
        updateElement('bundleProcessFee', `- ${formatRp(result.processFee)}`);

        // Profit styling
        const profitEl = document.getElementById('bundleNetProfit');
        if (profitEl) {
            profitEl.classList.remove('text-emerald-600', 'text-red-500');
            profitEl.classList.add(result.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500');
        }

        // Comparison section
        const comparisonSection = document.getElementById('bundleComparisonSection');
        if (comparisonSection) {
            comparisonSection.classList.remove('hidden');

            updateElement('bundleIndividualProfit', formatRp(result.individualProfit));
            updateElement('bundleProfitDiff',
                `${result.profitDifference >= 0 ? '+' : ''}${formatRp(result.profitDifference)} (${result.profitDifferencePercent.toFixed(1)}%)`
            );

            const diffEl = document.getElementById('bundleProfitDiff');
            if (diffEl) {
                diffEl.classList.remove('text-emerald-600', 'text-red-500');
                diffEl.classList.add(result.profitDifference >= 0 ? 'text-emerald-600' : 'text-red-500');
            }

            // Recommendation
            const recoEl = document.getElementById('bundleRecommendation');
            if (recoEl) {
                if (result.isBundleBetter) {
                    recoEl.innerHTML = `
                        <i class="fas fa-check-circle text-emerald-500 mr-1"></i>
                        <span class="text-emerald-700 dark:text-emerald-400">Bundle lebih menguntungkan</span>
                    `;
                } else {
                    recoEl.innerHTML = `
                        <i class="fas fa-exclamation-circle text-amber-500 mr-1"></i>
                        <span class="text-amber-700 dark:text-amber-400">Jual satuan lebih menguntungkan</span>
                    `;
                }
            }
        }
    }

    /**
     * Helper to update element text
     * @param {string} id 
     * @param {string} value 
     */
    function updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    /**
     * Initialize the calculator
     */
    function init() {
        // Add initial empty product
        addProduct('Produk 1', 0, 1);

        // Setup event listeners for price input
        const bundlePriceInput = document.getElementById('bundlePrice');
        if (bundlePriceInput) {
            bundlePriceInput.addEventListener('input', function () {
                if (typeof Formatters !== 'undefined') {
                    Formatters.formatInputWithSeparator(this);
                }
                calculateAndRender();
            });
        }

        const bundleVoucherInput = document.getElementById('bundleVoucher');
        if (bundleVoucherInput) {
            bundleVoucherInput.addEventListener('input', function () {
                if (typeof Formatters !== 'undefined') {
                    Formatters.formatInputWithSeparator(this);
                }
                calculateAndRender();
            });
        }
    }

    /**
     * Clear all products
     */
    function clearAll() {
        bundleProducts = [];
        productIdCounter = 0;
        renderProductList();
        renderEmptyResults();
    }

    // ==================== PUBLIC API ====================

    return {
        // Calculation
        calculateBundleProfit,
        calculateAndRender,

        // Product management
        addProduct,
        removeProduct,
        updateProduct,
        formatAndUpdate,
        clearAll,

        // UI
        renderProductList,
        init,

        // Getters
        getProducts() { return [...bundleProducts]; },
        getProductCount() { return bundleProducts.length; }
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.BundlingCalculator = BundlingCalculator;
}
