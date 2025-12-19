/**
 * BundlingCalculator - Calculate profit for bundled products
 * Using IIFE pattern for browser compatibility
 */
const BundlingCalculator = (function () {
    'use strict';

    // ==================== PRIVATE STATE ====================

    let bundleProducts = [];
    let productIdCounter = 0;
    let inputMode = 'manual'; // 'manual' or 'auto'
    let selectedFromDB = []; // Products selected from database for multi-select
    let bundleMultiOpen = false; // Multi-select dropdown state

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

    // ==================== MODE SWITCHING ====================

    /**
     * Switch between Manual and Auto mode
     * @param {string} newMode - 'manual' or 'auto'
     */
    function switchMode(newMode) {
        inputMode = newMode;
        const manualSection = document.getElementById('bundle_manual_section');
        const autoSection = document.getElementById('bundle_auto_section');
        const btnManual = document.getElementById('btn-bundle-manual');
        const btnAuto = document.getElementById('btn-bundle-auto');

        const activeClass = 'px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm transition-all';
        const inactiveClass = 'px-3 py-1 text-xs font-bold text-slate-400 rounded-md transition-all hover:bg-white/50 dark:hover:bg-slate-600/50';

        if (newMode === 'manual') {
            manualSection?.classList.remove('hidden');
            autoSection?.classList.add('hidden');
            if (btnManual) btnManual.className = activeClass;
            if (btnAuto) btnAuto.className = inactiveClass;
        } else {
            autoSection?.classList.remove('hidden');
            manualSection?.classList.add('hidden');
            if (btnAuto) btnAuto.className = activeClass;
            if (btnManual) btnManual.className = inactiveClass;
            populateProductSelect();
        }
    }

    /**
     * Populate product selector from productDB
     */
    function populateProductSelect() {
        const select = document.getElementById('bundle_product_select');
        if (!select) return;

        // Try to get products from multiple sources
        let products = [];

        // Try window.productDB first (if exposed globally)
        if (window.productDB && Array.isArray(window.productDB)) {
            products = window.productDB;
        }
        // Fallback to localStorage
        else {
            try {
                products = JSON.parse(localStorage.getItem('productDB') || '[]');
            } catch (e) {
                products = [];
            }
        }

        if (products.length === 0) {
            select.innerHTML = '<option value="">Belum ada produk tersimpan</option>';
            const infoEl = document.querySelector('#bundle_auto_section p');
            if (infoEl) {
                infoEl.innerHTML = '<i class="fas fa-info-circle mr-1"></i>Simpan hasil kalkulasi terlebih dahulu untuk menggunakan fitur ini';
            }
            return;
        }

        select.innerHTML = '<option value="">-- Pilih Produk (' + products.length + ') --</option>' +
            products.map(p => {
                const hpp = p.cost_of_goods || p.hpp || 0;
                const name = p.name || 'Produk';
                return `<option value="${p.id}" data-hpp="${hpp}" data-name="${name}">
                    ${name} (HPP: Rp ${hpp.toLocaleString('id-ID')})
                </option>`;
            }).join('');

        const infoEl = document.querySelector('#bundle_auto_section p');
        if (infoEl) {
            infoEl.innerHTML = '<i class="fas fa-check-circle mr-1 text-green-500"></i>' + products.length + ' produk tersedia dari database';
        }
    }

    /**
     * Add product from database selection
     */
    function addFromDatabase() {
        const select = document.getElementById('bundle_product_select');
        if (!select || !select.value) {
            if (typeof showToast === 'function') {
                showToast('Pilih produk terlebih dahulu', 'error');
            }
            return;
        }

        const option = select.options[select.selectedIndex];
        const name = option.dataset.name || 'Produk';
        const hpp = parseFloat(option.dataset.hpp) || 0;

        addProduct(name, hpp, 1);
        select.value = ''; // Reset dropdown

        if (typeof showToast === 'function') {
            showToast(`${name} ditambahkan ke bundle`, 'success');
        }
    }

    // ==================== MULTI-SELECT FUNCTIONS ====================

    /**
     * Toggle bundle multi-select dropdown
     */
    function toggleBundleMultiSelect() {
        const dropdown = document.getElementById('bundle-multiselect-dropdown');
        bundleMultiOpen = !bundleMultiOpen;

        if (bundleMultiOpen) {
            dropdown?.classList.add('open');
            renderBundleMultiOptions();
            document.getElementById('bundle-multiselect-search')?.focus();
            setTimeout(() => {
                document.addEventListener('click', closeBundleMultiOnOutside);
            }, 10);
        } else {
            dropdown?.classList.remove('open');
            document.removeEventListener('click', closeBundleMultiOnOutside);
        }
    }

    /**
     * Close on outside click
     */
    function closeBundleMultiOnOutside(e) {
        const wrapper = document.getElementById('bundleMultiSelect');
        if (wrapper && !wrapper.contains(e.target)) {
            closeBundleMultiSelect();
        }
    }

    /**
     * Close multi-select dropdown
     */
    function closeBundleMultiSelect() {
        const dropdown = document.getElementById('bundle-multiselect-dropdown');
        dropdown?.classList.remove('open');
        bundleMultiOpen = false;
        document.removeEventListener('click', closeBundleMultiOnOutside);
    }

    /**
     * Render multi-select options
     */
    function renderBundleMultiOptions(filter = '') {
        const container = document.getElementById('bundle-multiselect-options');
        if (!container) return;

        // Get products from database
        let products = [];
        if (window.productDB && Array.isArray(window.productDB)) {
            products = window.productDB;
        } else {
            try {
                products = JSON.parse(localStorage.getItem('productDB') || '[]');
            } catch (e) {
                products = [];
            }
        }

        const filtered = products.filter(p =>
            (p.name || '').toLowerCase().includes(filter.toLowerCase())
        );

        if (products.length === 0) {
            container.innerHTML = '<div class="combobox-empty">Belum ada produk tersimpan.<br>Simpan hasil kalkulasi terlebih dahulu.</div>';
            return;
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div class="combobox-empty">Tidak ada produk ditemukan</div>';
            return;
        }

        container.innerHTML = filtered.map(p => {
            const isSelected = selectedFromDB.includes(p.id);
            const hpp = p.cost_of_goods || p.hpp || 0;
            const mp = p.platform || 'shopee';
            return `
                <label class="multiselect-option" onclick="event.stopPropagation()">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="BundlingCalculator.toggleProductSelection(${p.id})">
                    <span class="mp-tag ${mp}">${mp.charAt(0).toUpperCase() + mp.slice(1)}</span>
                    <span class="flex-1 font-medium">${p.name}</span>
                    <span class="text-xs text-slate-500">Rp ${hpp.toLocaleString('id-ID')}</span>
                </label>
            `;
        }).join('');
    }

    /**
     * Filter multi-select options
     */
    function filterBundleMultiOptions(query) {
        renderBundleMultiOptions(query);
    }

    /**
     * Toggle product selection
     */
    function toggleProductSelection(id) {
        const idx = selectedFromDB.indexOf(id);
        if (idx > -1) {
            selectedFromDB.splice(idx, 1);
        } else {
            selectedFromDB.push(id);
        }
        updateBundleSelectedBadges();
    }

    /**
     * Update selected badges display
     */
    function updateBundleSelectedBadges() {
        const container = document.getElementById('bundle-selected-badges');
        if (!container) return;

        if (selectedFromDB.length === 0) {
            container.innerHTML = '<span class="text-slate-400">Pilih produk dari database...</span>';
            return;
        }

        // Get products data
        let products = [];
        if (window.productDB && Array.isArray(window.productDB)) {
            products = window.productDB;
        } else {
            try {
                products = JSON.parse(localStorage.getItem('productDB') || '[]');
            } catch (e) {
                products = [];
            }
        }

        container.innerHTML = selectedFromDB.map(id => {
            const product = products.find(p => p.id === id);
            if (!product) return '';
            const mp = product.platform || 'shopee';
            const name = product.name || 'Produk';
            return `
                <span class="badge ${mp}">
                    <span class="mp-tag ${mp} text-[8px]">${mp.charAt(0).toUpperCase()}</span>
                    ${name.length > 12 ? name.substring(0, 12) + '...' : name}
                    <button onclick="event.stopPropagation(); BundlingCalculator.removePendingProduct(${id})" class="badge-remove">×</button>
                </span>
            `;
        }).join('');
    }

    /**
     * Remove pending product from selection
     */
    function removePendingProduct(id) {
        const idx = selectedFromDB.indexOf(id);
        if (idx > -1) {
            selectedFromDB.splice(idx, 1);
        }
        updateBundleSelectedBadges();
        renderBundleMultiOptions(document.getElementById('bundle-multiselect-search')?.value || '');
    }

    /**
     * Add all selected products to bundle
     */
    function addSelectedToBundle() {
        if (selectedFromDB.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Pilih produk terlebih dahulu', 'error');
            }
            return;
        }

        // Get products data
        let products = [];
        if (window.productDB && Array.isArray(window.productDB)) {
            products = window.productDB;
        } else {
            try {
                products = JSON.parse(localStorage.getItem('productDB') || '[]');
            } catch (e) {
                products = [];
            }
        }

        // Add each selected product to bundle
        let addedCount = 0;
        selectedFromDB.forEach(id => {
            const product = products.find(p => p.id === id);
            if (product) {
                const name = product.name || 'Produk';
                const hpp = product.cost_of_goods || product.hpp || 0;
                addProduct(name, hpp, 1);
                addedCount++;
            }
        });

        // Clear selection
        selectedFromDB = [];
        updateBundleSelectedBadges();

        if (typeof showToast === 'function') {
            showToast(`${addedCount} produk ditambahkan ke bundle`, 'success');
        }
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
        // Mode
        switchMode,
        getMode: () => inputMode,

        // Calculation
        calculateBundleProfit,
        calculateAndRender,

        // Product management
        addProduct,
        addFromDatabase,
        addSelectedToBundle,
        removeProduct,
        updateProduct,
        formatAndUpdate,
        clearAll,
        populateProductSelect,

        // Multi-select
        toggleBundleMultiSelect,
        renderBundleMultiOptions,
        filterBundleMultiOptions,
        toggleProductSelection,
        updateBundleSelectedBadges,
        removePendingProduct,

        // UI
        renderProductList,
        init,

        // Getters
        getProducts() { return [...bundleProducts]; },
        getProductCount() { return bundleProducts.length; },
        getSelectedFromDB() { return [...selectedFromDB]; }
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.BundlingCalculator = BundlingCalculator;

    // Backward compatible global functions
    window.switchBundleMode = BundlingCalculator.switchMode;
    window.toggleBundleMultiSelect = BundlingCalculator.toggleBundleMultiSelect;
    window.filterBundleMultiOptions = BundlingCalculator.filterBundleMultiOptions;
}
