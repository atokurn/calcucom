/**
 * BundlingCalculator - Advanced bundle profit calculator
 * 
 * Features:
 * - Multi-product bundle analysis
 * - Fee allocation modes (total, proportional, per-item)
 * - Bundle Price Finder mode
 * - Per-product profit breakdown
 * - Business insights generation
 * 
 * Uses PricingEngine for calculations (UI separated from math)
 */
const BundlingCalculator = (function () {
    'use strict';

    // ==================== PRIVATE STATE ====================

    let bundleProducts = [];
    let productIdCounter = 0;
    let inputMode = 'manual'; // 'manual' or 'auto'
    let selectedFromDB = []; // Products selected from database for multi-select
    let bundleMultiOpen = false; // Multi-select dropdown state

    // NEW: Advanced features state
    let feeAllocationMode = 'total'; // 'total' | 'proportional' | 'perItem'
    let calculatorMode = 'profit'; // 'profit' | 'priceFinder'
    let priceFinderTargetType = 'rupiah'; // 'rupiah' | 'percent'
    let lastBundleResult = null; // Cache for insights

    // ==================== HELPER FUNCTIONS ====================

    /**
     * Format rupiah using Formatters or fallback
     */
    function formatRp(value) {
        if (typeof Formatters !== 'undefined') {
            return Formatters.formatRupiah(value);
        }
        return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
    }

    /**
     * Parse number from input
     */
    function parseNum(value) {
        if (typeof PricingEngine !== 'undefined') {
            return PricingEngine.parseNum(value);
        }
        if (typeof Formatters !== 'undefined') {
            return Formatters.parseNumber(value);
        }
        if (typeof value === 'number') return value;
        return parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
    }

    // ==================== CALCULATION DELEGATION ====================

    /**
     * Calculate bundle profit using PricingEngine
     * Falls back to legacy calculation if engine not loaded
     */
    function calculateBundleProfit(bundlePrice, products, options = {}) {
        // Use PricingEngine if available
        if (typeof PricingEngine !== 'undefined') {
            const result = PricingEngine.calculateBundle(bundlePrice, products, {
                ...options,
                allocationMode: feeAllocationMode
            });
            lastBundleResult = result;
            return result;
        }

        // Legacy fallback (if PricingEngine not loaded)
        return calculateBundleProfitLegacy(bundlePrice, products, options);
    }

    /**
     * Legacy bundle calculation (fallback)
     */
    function calculateBundleProfitLegacy(bundlePrice, products, options = {}) {
        const platform = AppState?.get('platform') || 'shopee';
        const sellerType = AppState?.get('sellerType') || 'nonstar';
        // Use provided categoryGroup (from DB products' highest fee) or fall back to AppState
        const categoryGroup = options.categoryGroup || AppState?.get('category.group') || 'A';
        const voucherAmount = options.voucherAmount || 0;

        let adminRate = 8;
        let serviceRate = 4;
        let serviceCap = 40000;
        let processFee = 1250;

        if (typeof AppConstants !== 'undefined') {
            const config = AppConstants.getMarketplace(platform);
            adminRate = AppConstants.getAdminFeeRate(platform, sellerType, categoryGroup);
            serviceRate = config.serviceFees?.freeShip?.rate || 4;
            serviceCap = config.serviceFees?.freeShip?.cap || 40000;
            processFee = config.orderProcessFee || 1250;
        }

        const freeShipEnabled = AppState?.get('features.freeShipEnabled') || false;
        const cashbackEnabled = AppState?.get('features.cashbackEnabled') || false;

        // Calculate totals
        let totalHPP = 0;
        let totalItems = 0;
        products.forEach(p => {
            totalHPP += parseNum(p.hpp) * (parseInt(p.qty) || 1);
            totalItems += parseInt(p.qty) || 1;
        });

        const feeBase = Math.max(0, bundlePrice - voucherAmount);
        const adminFee = feeBase * (adminRate / 100);
        let serviceFee = freeShipEnabled ? Math.min(feeBase * (serviceRate / 100), serviceCap) : 0;
        let cashbackFee = 0;
        if (cashbackEnabled && typeof AppConstants !== 'undefined') {
            const config = AppConstants.getMarketplace(platform);
            const cbRate = config.serviceFees?.cashback?.rate || 4.5;
            const cbCap = config.serviceFees?.cashback?.cap || 60000;
            cashbackFee = Math.min(feeBase * (cbRate / 100), cbCap);
        }

        const totalFees = adminFee + serviceFee + cashbackFee + processFee;
        const netCash = bundlePrice - totalFees - voucherAmount;
        const netProfit = netCash - totalHPP;
        const margin = bundlePrice > 0 ? (netProfit / bundlePrice) * 100 : 0;

        return {
            bundlePrice,
            totalHPP,
            totalItems,
            voucherAmount,
            adminFee,
            serviceFee,
            cashbackFee,
            processFee,
            fixedFee: 0,
            totalFees,
            netCash,
            netProfit,
            margin,
            marginStatus: netProfit < 0 ? 'danger' : (margin < 5 ? 'warning' : 'healthy'),
            products: [],
            individualProfit: 0,
            profitDifference: 0,
            isBundleBetter: false
        };
    }

    /**
     * Find minimum bundle price using PricingEngine
     */
    function findBundlePrice(targetValue, targetType) {
        if (typeof PricingEngine === 'undefined') {
            console.warn('PricingEngine not loaded');
            return null;
        }

        return PricingEngine.findBundlePrice(bundleProducts, {
            type: targetType,
            value: targetValue
        }, {
            allocationMode: feeAllocationMode
        });
    }

    /**
     * Generate business insights
     */
    function generateInsights() {
        if (typeof PricingEngine === 'undefined' || !lastBundleResult) {
            return [];
        }
        return PricingEngine.generateBusinessInsights(lastBundleResult);
    }

    // ==================== MODE SWITCHING ====================

    /**
     * Switch between Manual and Auto mode
     */
    function switchMode(newMode) {
        inputMode = newMode;
        const manualSection = document.getElementById('bundle_manual_section');
        const autoSection = document.getElementById('bundle_auto_section');
        const btnManual = document.getElementById('btn-bundle-manual');
        const btnAuto = document.getElementById('btn-bundle-auto');

        const activeClass = 'px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm transition-all';
        const inactiveClass = 'px-3 py-1 text-xs font-bold text-slate-400 rounded-md transition-all hover:bg-white/50 dark:hover:bg-slate-600/50';

        // Clear products when switching modes to avoid confusion
        bundleProducts = [];
        selectedFromDB = [];
        productIdCounter = 0;

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
            updateBundleSelectedBadges();
        }

        renderProductList();
        calculateAndRender();
    }

    /**
     * Switch fee allocation mode
     */
    function setFeeAllocationMode(mode) {
        if (!['total', 'proportional', 'perItem'].includes(mode)) return;

        feeAllocationMode = mode;

        // Update UI radio buttons
        document.querySelectorAll('input[name="bundleFeeAllocation"]').forEach(radio => {
            radio.checked = radio.value === mode;
        });

        // Recalculate
        calculateAndRender();
    }

    /**
     * Switch calculator mode (profit vs price finder)
     */
    function setCalculatorMode(mode) {
        if (!['profit', 'priceFinder'].includes(mode)) return;

        calculatorMode = mode;

        const profitSection = document.getElementById('bundle_profit_section');
        const priceFinderSection = document.getElementById('bundle_price_finder_section');
        const btnProfit = document.getElementById('btn-bundle-profit-mode');
        const btnPriceFinder = document.getElementById('btn-bundle-price-finder-mode');

        const activeClass = 'flex-1 py-2 text-xs font-bold rounded-lg bg-purple-500 text-white shadow transition-all';
        const inactiveClass = 'flex-1 py-2 text-xs font-bold text-slate-500 rounded-lg transition-all hover:bg-slate-200 dark:hover:bg-slate-600';

        if (mode === 'profit') {
            profitSection?.classList.remove('hidden');
            priceFinderSection?.classList.add('hidden');
            if (btnProfit) btnProfit.className = activeClass;
            if (btnPriceFinder) btnPriceFinder.className = inactiveClass;
        } else {
            priceFinderSection?.classList.remove('hidden');
            profitSection?.classList.add('hidden');
            if (btnPriceFinder) btnPriceFinder.className = activeClass;
            if (btnProfit) btnProfit.className = inactiveClass;
        }
    }

    /**
     * Set price finder target type
     */
    function setPriceFinderTargetType(type) {
        priceFinderTargetType = type;
        const btnRp = document.getElementById('bundle_pf_type_rp');
        const btnPct = document.getElementById('bundle_pf_type_pct');
        const prefix = document.getElementById('bundle_pf_prefix');
        const input = document.getElementById('bundle_target_profit');

        const activeClass = 'flex-1 py-1.5 text-[10px] font-bold rounded-md bg-white dark:bg-slate-600 text-slate-700 dark:text-white shadow-sm transition-all';
        const inactiveClass = 'flex-1 py-1.5 text-[10px] font-bold rounded-md text-slate-500 dark:text-slate-400 transition-all hover:bg-white/50 dark:hover:bg-slate-600/50';

        if (type === 'rupiah') {
            if (btnRp) btnRp.className = activeClass;
            if (btnPct) btnPct.className = inactiveClass;
            if (prefix) prefix.textContent = 'Rp';
            if (input) input.placeholder = '50.000';
        } else {
            if (btnPct) btnPct.className = activeClass;
            if (btnRp) btnRp.className = inactiveClass;
            if (prefix) prefix.textContent = '%';
            if (input) input.placeholder = '20';
        }
    }

    // ==================== PRODUCT DATABASE ====================

    /**
     * Populate product selector from productDB
     */
    function populateProductSelect() {
        const select = document.getElementById('bundle_product_select');
        if (!select) return;

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

        if (products.length === 0) {
            select.innerHTML = '<option value="">Belum ada produk tersimpan</option>';
            return;
        }

        select.innerHTML = '<option value="">-- Pilih Produk (' + products.length + ') --</option>' +
            products.map(p => {
                const hpp = p.cost_of_goods || p.hpp || 0;
                return `<option value="${p.id}" data-hpp="${hpp}" data-name="${p.name}">
                    ${p.name} (HPP: Rp ${hpp.toLocaleString('id-ID')})
                </option>`;
            }).join('');
    }

    /**
     * Add product from database selection
     */
    function addFromDatabase() {
        const select = document.getElementById('bundle_product_select');
        if (!select || !select.value) {
            if (typeof showToast === 'function') showToast('Pilih produk terlebih dahulu', 'error');
            return;
        }

        const option = select.options[select.selectedIndex];
        addProduct(option.dataset.name, parseFloat(option.dataset.hpp) || 0, 1);
        select.value = '';

        if (typeof showToast === 'function') showToast(`${option.dataset.name} ditambahkan ke bundle`, 'success');
    }

    // ==================== MULTI-SELECT FUNCTIONS ====================

    function toggleBundleMultiSelect() {
        const dropdown = document.getElementById('bundle-multiselect-dropdown');
        bundleMultiOpen = !bundleMultiOpen;

        if (bundleMultiOpen) {
            dropdown?.classList.add('open');
            renderBundleMultiOptions();
            document.getElementById('bundle-multiselect-search')?.focus();
            setTimeout(() => document.addEventListener('click', closeBundleMultiOnOutside), 10);
        } else {
            dropdown?.classList.remove('open');
            document.removeEventListener('click', closeBundleMultiOnOutside);
        }
    }

    function closeBundleMultiOnOutside(e) {
        const wrapper = document.getElementById('bundleMultiSelect');
        if (wrapper && !wrapper.contains(e.target)) closeBundleMultiSelect();
    }

    function closeBundleMultiSelect() {
        document.getElementById('bundle-multiselect-dropdown')?.classList.remove('open');
        bundleMultiOpen = false;
        document.removeEventListener('click', closeBundleMultiOnOutside);
    }

    function renderBundleMultiOptions(filter = '') {
        const container = document.getElementById('bundle-multiselect-options');
        if (!container) return;

        let products = window.productDB || JSON.parse(localStorage.getItem('productDB') || '[]');
        const filtered = products.filter(p => (p.name || '').toLowerCase().includes(filter.toLowerCase()));

        if (products.length === 0) {
            container.innerHTML = '<div class="combobox-empty">Belum ada produk tersimpan</div>';
            return;
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div class="combobox-empty">Tidak ada produk ditemukan</div>';
            return;
        }

        container.innerHTML = filtered.map(p => {
            const hpp = p.cost_of_goods || p.hpp || 0;
            const mp = p.platform || 'shopee';
            return `
                <label class="multiselect-option" onclick="event.stopPropagation()">
                    <input type="checkbox" ${selectedFromDB.includes(p.id) ? 'checked' : ''} 
                           onchange="BundlingCalculator.toggleProductSelection(${p.id})">
                    <span class="mp-tag ${mp}">${mp.charAt(0).toUpperCase()}</span>
                    <span class="flex-1 font-medium">${p.name}</span>
                    <span class="text-xs text-slate-500">Rp ${hpp.toLocaleString('id-ID')}</span>
                </label>
            `;
        }).join('');
    }

    function filterBundleMultiOptions(query) {
        renderBundleMultiOptions(query);
    }

    function toggleProductSelection(id) {
        const idx = selectedFromDB.indexOf(id);
        if (idx > -1) {
            selectedFromDB.splice(idx, 1);
        } else {
            selectedFromDB.push(id);
        }
        updateBundleSelectedBadges();
    }

    function updateBundleSelectedBadges() {
        const container = document.getElementById('bundle-selected-badges');
        if (!container) return;

        if (selectedFromDB.length === 0) {
            container.innerHTML = '<span class="text-slate-400">Pilih produk dari database...</span>';
            return;
        }

        let products = window.productDB || JSON.parse(localStorage.getItem('productDB') || '[]');

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

    function removePendingProduct(id) {
        const idx = selectedFromDB.indexOf(id);
        if (idx > -1) selectedFromDB.splice(idx, 1);
        updateBundleSelectedBadges();
        renderBundleMultiOptions(document.getElementById('bundle-multiselect-search')?.value || '');
    }

    function addSelectedToBundle() {
        if (selectedFromDB.length === 0) {
            if (typeof showToast === 'function') showToast('Pilih produk terlebih dahulu', 'error');
            return;
        }

        let products = window.productDB || JSON.parse(localStorage.getItem('productDB') || '[]');
        let addedCount = 0;

        selectedFromDB.forEach(id => {
            const product = products.find(p => p.id === id);
            if (product) {
                // Add product with full metadata from database (no render yet)
                addProductFromDB(product, false);
                addedCount++;
            }
        });

        selectedFromDB = [];
        updateBundleSelectedBadges();

        // Render ONCE after all products are added
        if (addedCount > 0) {
            renderProductList();
            calculateAndRender();
        }

        if (typeof showToast === 'function') showToast(`${addedCount} produk ditambahkan ke bundle`, 'success');
    }

    /**
     * Add product from database with full metadata
     * @param {Object} dbProduct - Product from database
     * @param {boolean} shouldRender - Whether to render immediately (default: true)
     */
    function addProductFromDB(dbProduct, shouldRender = true) {
        productIdCounter++;
        bundleProducts.push({
            id: productIdCounter,
            dbId: dbProduct.id,
            name: dbProduct.name || `Produk ${productIdCounter}`,
            hpp: dbProduct.cost_of_goods || dbProduct.hpp || 0,
            qty: 1,
            price: dbProduct.selling_price || dbProduct.sellingPrice || 0,
            // NEW: Full metadata from database
            fromDB: true,
            categoryGroup: dbProduct.category_group || dbProduct.categoryGroup || 'A',
            categoryName: dbProduct.category_name || dbProduct.categoryName || '',
            platform: dbProduct.platform || 'shopee',
            sellerType: dbProduct.seller_type || dbProduct.sellerType || 'nonstar',
            originalProfit: dbProduct.result_profit || dbProduct.profit || 0,
            originalMargin: dbProduct.result_margin || dbProduct.margin || 0
        });

        // Only render if explicitly requested (for single additions)
        if (shouldRender) {
            renderProductList();
            calculateAndRender();
        }
    }

    /**
     * Get the highest fee category among all database products
     * Returns category with highest admin fee rate
     */
    function getHighestFeeCategory() {
        const dbProducts = bundleProducts.filter(p => p.fromDB && p.categoryGroup);
        if (dbProducts.length === 0) return null;

        // Category fee priority (highest to lowest for Shopee): A > B > F > C > D > E
        const categoryPriority = { 'A': 6, 'B': 5, 'F': 4, 'C': 3, 'D': 2, 'E': 1 };

        let highestCategory = dbProducts[0].categoryGroup;
        let highestPriority = categoryPriority[highestCategory] || 0;

        dbProducts.forEach(p => {
            const priority = categoryPriority[p.categoryGroup] || 0;
            if (priority > highestPriority) {
                highestPriority = priority;
                highestCategory = p.categoryGroup;
            }
        });

        return {
            category: highestCategory,
            hasMixedCategories: new Set(dbProducts.map(p => p.categoryGroup)).size > 1
        };
    }

    // ==================== PRODUCT MANAGEMENT ====================

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

    function removeProduct(id) {
        bundleProducts = bundleProducts.filter(p => p.id !== id);
        renderProductList();
        calculateAndRender();
    }

    function updateProduct(id, field, value) {
        const product = bundleProducts.find(p => p.id === id);
        if (product) {
            product[field] = value;
            calculateAndRender();
        }
    }

    function renderProductList() {
        const container = document.getElementById('bundleProductsList');
        if (!container) return;

        // Render fee category badge if mixed categories
        renderFeeCategoryBadge();

        if (bundleProducts.length === 0) {
            container.innerHTML = `
                <div class="text-center text-slate-400 dark:text-slate-500 py-6">
                    <i class="fas fa-box-open text-2xl mb-2 block opacity-50"></i>
                    <p class="text-xs">Belum ada produk dalam bundle</p>
                </div>
            `;
            return;
        }

        container.innerHTML = bundleProducts.map(p => {
            if (p.fromDB) {
                // Accordion-style card for database products (collapsed by default)
                return renderDBProductCard(p);
            } else {
                // Simple inline editing for manual products
                return renderManualProductRow(p);
            }
        }).join('');
    }

    /**
     * Render accordion card for database products
     */
    function renderDBProductCard(p) {
        const categoryBadgeClass = `badge-${p.categoryGroup || 'A'}`;
        const platformTag = (p.platform || 'shopee').charAt(0).toUpperCase();
        const profitClass = (p.originalProfit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500';

        return `
            <div class="bundle-product-accordion bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                <!-- Accordion Header (collapsed by default) -->
                <div class="flex items-center gap-2 p-3 cursor-pointer" onclick="BundlingCalculator.toggleProductAccordion(${p.id})">
                    <button onclick="event.stopPropagation(); BundlingCalculator.removeProduct(${p.id})" 
                        class="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 rounded transition-colors">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                    
                    <span class="mp-tag ${p.platform || 'shopee'} text-[8px] px-1 py-0.5 rounded font-bold">${platformTag}</span>
                    
                    <span class="flex-1 text-sm font-medium text-slate-700 dark:text-white truncate">${p.name}</span>
                    
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-bold ${categoryBadgeClass}">Grup ${p.categoryGroup || 'A'}</span>
                    
                    <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1">
                            <span class="text-[10px] text-slate-400">Qty</span>
                            <input type="number" value="${p.qty}" min="1" max="99"
                                onclick="event.stopPropagation()"
                                onchange="BundlingCalculator.updateProduct(${p.id}, 'qty', parseInt(this.value) || 1)"
                                class="w-12 px-1 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded text-center bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white">
                        </div>
                        <i class="fas fa-chevron-down text-xs text-slate-400 accordion-icon transition-transform" id="accordion-icon-${p.id}"></i>
                    </div>
                </div>
                
                <!-- Accordion Content (hidden by default) -->
                <div class="accordion-content hidden px-3 pb-3 pt-0" id="accordion-content-${p.id}">
                    <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                        <div>
                            <span class="text-slate-400">HPP:</span>
                            <span class="text-slate-700 dark:text-white font-medium">${formatRp(p.hpp)}</span>
                        </div>
                        <div>
                            <span class="text-slate-400">Harga Jual:</span>
                            <span class="text-slate-700 dark:text-white font-medium">${formatRp(p.price)}</span>
                        </div>
                        <div>
                            <span class="text-slate-400">Profit Satuan:</span>
                            <span class="${profitClass} font-medium">${formatRp(p.originalProfit)}</span>
                        </div>
                        <div>
                            <span class="text-slate-400">Kategori:</span>
                            <span class="text-slate-700 dark:text-white font-medium">${p.categoryName || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render inline row for manual products
     */
    function renderManualProductRow(p) {
        return `
            <div class="flex items-center gap-2 p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <button onclick="BundlingCalculator.removeProduct(${p.id})" 
                    class="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 rounded transition-colors">
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
        `;
    }

    /**
     * Toggle accordion expansion for a product
     */
    function toggleProductAccordion(productId) {
        const content = document.getElementById(`accordion-content-${productId}`);
        const icon = document.getElementById(`accordion-icon-${productId}`);

        if (content) {
            content.classList.toggle('hidden');
        }
        if (icon) {
            icon.classList.toggle('rotate-180');
        }
    }

    /**
     * Render fee category badge when mixed categories exist
     */
    function renderFeeCategoryBadge() {
        const badgeContainer = document.getElementById('bundle-fee-category-badge');
        if (!badgeContainer) return;

        const feeInfo = getHighestFeeCategory();

        if (!feeInfo || !feeInfo.hasMixedCategories) {
            badgeContainer.innerHTML = '';
            return;
        }

        badgeContainer.innerHTML = `
            <div class="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                <i class="fas fa-info-circle"></i>
                <span>Menggunakan fee Kategori ${feeInfo.category}</span>
            </div>
        `;
    }

    function formatAndUpdate(id, field, input) {
        const value = parseNum(input.value);
        input.value = value > 0 ? value.toLocaleString('id-ID') : '';
        updateProduct(id, field, value);
    }

    // ==================== CALCULATION & RENDERING ====================

    function calculateAndRender() {
        if (calculatorMode === 'priceFinder') {
            calculateAndRenderPriceFinder();
            return;
        }

        const bundlePriceInput = document.getElementById('bundlePrice');
        const bundleVoucherInput = document.getElementById('bundleVoucher');

        const bundlePrice = bundlePriceInput ? parseNum(bundlePriceInput.value) : 0;
        const voucherAmount = bundleVoucherInput ? parseNum(bundleVoucherInput.value) : 0;

        if (bundleProducts.length === 0 || bundlePrice <= 0) {
            renderEmptyResults();
            return;
        }

        // Get highest fee category from DB products (if any)
        const feeInfo = getHighestFeeCategory();
        const effectiveCategoryGroup = feeInfo ? feeInfo.category : null;

        const result = calculateBundleProfit(bundlePrice, bundleProducts, {
            voucherAmount,
            allocationMode: feeAllocationMode,
            categoryGroup: effectiveCategoryGroup  // Override with highest fee category
        });

        renderResults(result);
        renderProductBreakdown(result.products);
        renderBusinessInsights(generateInsights());

        if (typeof AppState !== 'undefined') {
            AppState.set('bundling.lastResult', result);
        }
    }

    function calculateAndRenderPriceFinder() {
        const targetInput = document.getElementById('bundle_target_profit');
        const targetValue = targetInput ? parseNum(targetInput.value) : 0;

        if (bundleProducts.length === 0 || targetValue <= 0) {
            renderEmptyPriceFinderResults();
            return;
        }

        const result = findBundlePrice(targetValue, priceFinderTargetType);
        if (!result || !result.isValid) {
            renderEmptyPriceFinderResults();
            return;
        }

        renderPriceFinderResults(result);
    }

    function renderEmptyResults() {
        const elements = {
            bundleTotalHPP: 'Rp 0',
            bundleTotalItems: '0',
            bundleTotalFees: 'Rp 0',
            bundleNetProfit: 'Rp 0',
            bundleMargin: '0%'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });

        document.getElementById('bundleComparisonSection')?.classList.add('hidden');
        document.getElementById('bundleProductBreakdown')?.classList.add('hidden');
        document.getElementById('bundleInsights')?.classList.add('hidden');
    }

    function renderResults(result) {
        // Main values
        updateElement('bundleTotalHPP', formatRp(result.totalHPP));
        updateElement('bundleTotalItems', `${result.totalItems} item`);
        updateElement('bundleTotalFees', formatRp(result.totalFees));
        updateElement('bundleNetProfit', formatRp(result.netProfit));
        updateElement('bundleMargin', `${result.margin.toFixed(1)}%`);

        // Fee breakdown
        updateElement('bundleAdminFee', `- ${formatRp(result.adminFee)}`);
        updateElement('bundleServiceFee', `- ${formatRp((result.serviceFee || 0) + (result.cashbackFee || 0))}`);
        updateElement('bundleProcessFee', `- ${formatRp(result.processFee)}`);

        // Profit styling
        const profitEl = document.getElementById('bundleNetProfit');
        if (profitEl) {
            profitEl.classList.remove('text-emerald-600', 'text-red-500', 'text-amber-500');
            if (result.marginStatus === 'danger') {
                profitEl.classList.add('text-red-500');
            } else if (result.marginStatus === 'warning') {
                profitEl.classList.add('text-amber-500');
            } else {
                profitEl.classList.add('text-emerald-600');
            }
        }

        // Health indicator
        renderHealthIndicator(result.marginStatus);

        // Comparison section
        const comparisonSection = document.getElementById('bundleComparisonSection');
        if (comparisonSection) {
            comparisonSection.classList.remove('hidden');

            updateElement('bundleIndividualProfit', formatRp(result.individualProfit));
            updateElement('bundleProfitDiff',
                `${result.profitDifference >= 0 ? '+' : ''}${formatRp(result.profitDifference)}`
            );

            const diffEl = document.getElementById('bundleProfitDiff');
            if (diffEl) {
                diffEl.classList.remove('text-emerald-600', 'text-red-500');
                diffEl.classList.add(result.profitDifference >= 0 ? 'text-emerald-600' : 'text-red-500');
            }

            const recoEl = document.getElementById('bundleRecommendation');
            if (recoEl) {
                if (result.isBundleBetter) {
                    recoEl.innerHTML = `<i class="fas fa-check-circle text-emerald-500 mr-1"></i>
                        <span class="text-emerald-700 dark:text-emerald-400">Bundle lebih menguntungkan</span>`;
                } else {
                    recoEl.innerHTML = `<i class="fas fa-exclamation-circle text-amber-500 mr-1"></i>
                        <span class="text-amber-700 dark:text-amber-400">Jual satuan lebih menguntungkan</span>`;
                }
            }
        }
    }

    function renderHealthIndicator(status) {
        const indicator = document.getElementById('bundleHealthIndicator');
        if (!indicator) return;

        indicator.classList.remove('bg-emerald-500', 'bg-amber-500', 'bg-red-500');

        if (status === 'danger') {
            indicator.classList.add('bg-red-500');
            indicator.title = 'Rugi';
        } else if (status === 'warning') {
            indicator.classList.add('bg-amber-500');
            indicator.title = 'Margin Tipis';
        } else {
            indicator.classList.add('bg-emerald-500');
            indicator.title = 'Sehat';
        }
    }

    function renderProductBreakdown(products) {
        const container = document.getElementById('bundleProductBreakdown');
        const tbody = document.getElementById('bundleBreakdownBody');
        if (!container || !tbody) return;

        if (!products || products.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        tbody.innerHTML = products.map(p => {
            const statusClass = p.marginStatus === 'danger' ? 'text-red-500' :
                (p.marginStatus === 'warning' ? 'text-amber-500' : 'text-emerald-500');
            const statusIcon = p.marginStatus === 'danger' ? 'times-circle' :
                (p.marginStatus === 'warning' ? 'exclamation-circle' : 'check-circle');
            const statusLabel = p.marginStatus === 'danger' ? 'Rugi' :
                (p.marginStatus === 'warning' ? 'Tipis' : 'Sehat');

            return `
                <tr class="border-b border-slate-100 dark:border-slate-700">
                    <td class="py-2 font-medium">${p.name}</td>
                    <td class="py-2 text-right">${formatRp(p.hpp)}</td>
                    <td class="py-2 text-center">${p.qty}</td>
                    <td class="py-2 text-right text-red-400">-${formatRp(p.allocatedFee)}</td>
                    <td class="py-2 text-right ${statusClass} font-medium">${formatRp(p.allocatedProfit)}</td>
                    <td class="py-2 text-center">
                        <span class="${statusClass}"><i class="fas fa-${statusIcon} mr-1"></i>${statusLabel}</span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderBusinessInsights(insights) {
        const container = document.getElementById('bundleInsights');
        const list = document.getElementById('bundleInsightsList');
        if (!container || !list) return;

        if (!insights || insights.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        list.innerHTML = insights.map(insight => {
            const severityClass = insight.severity === 'danger' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                (insight.severity === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800');
            const iconClass = insight.severity === 'danger' ? 'text-red-500' :
                (insight.severity === 'warning' ? 'text-amber-500' : 'text-blue-500');

            return `
                <div class="p-3 rounded-lg border ${severityClass} mb-2">
                    <div class="flex items-start gap-2">
                        <i class="fas fa-${insight.icon} ${iconClass} mt-0.5"></i>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-slate-700 dark:text-slate-200">${insight.message}</p>
                            ${insight.detail ? `<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${insight.detail}</p>` : ''}
                            ${insight.action ? `<p class="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">💡 ${insight.action}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderEmptyPriceFinderResults() {
        updateElement('bundle_pf_min_price', 'Rp 0');
        const container = document.getElementById('bundleSuggestedPrices');
        if (container) container.innerHTML = '';
    }

    function renderPriceFinderResults(result) {
        updateElement('bundle_pf_min_price', formatRp(result.minPrice));
        updateElement('bundle_pf_actual_profit', formatRp(result.actualProfit));
        updateElement('bundle_pf_actual_margin', `${result.actualMargin.toFixed(1)}%`);

        const suggestionsContainer = document.getElementById('bundleSuggestedPrices');
        if (suggestionsContainer && result.suggestedPrices) {
            suggestionsContainer.innerHTML = result.suggestedPrices.map(s => `
                <button onclick="document.getElementById('bundlePrice').value='${s.price.toLocaleString('id-ID')}'; BundlingCalculator.setCalculatorMode('profit'); BundlingCalculator.calculateAndRender();"
                    class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-purple-400 transition-colors">
                    <div class="text-sm font-bold text-slate-700 dark:text-white">${formatRp(s.price)}</div>
                    <div class="text-[10px] text-slate-400">${s.label}</div>
                </button>
            `).join('');
        }
    }

    function updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // ==================== INITIALIZATION ====================

    function init() {
        addProduct('Produk 1', 0, 1);

        const bundlePriceInput = document.getElementById('bundlePrice');
        if (bundlePriceInput) {
            bundlePriceInput.addEventListener('input', function () {
                if (typeof Formatters !== 'undefined') Formatters.formatInputWithSeparator(this);
                calculateAndRender();
            });
        }

        const bundleVoucherInput = document.getElementById('bundleVoucher');
        if (bundleVoucherInput) {
            bundleVoucherInput.addEventListener('input', function () {
                if (typeof Formatters !== 'undefined') Formatters.formatInputWithSeparator(this);
                calculateAndRender();
            });
        }

        const targetProfitInput = document.getElementById('bundle_target_profit');
        if (targetProfitInput) {
            targetProfitInput.addEventListener('input', function () {
                if (priceFinderTargetType === 'rupiah' && typeof Formatters !== 'undefined') {
                    Formatters.formatInputWithSeparator(this);
                }
                calculateAndRender();
            });
        }

        // Initialize fee allocation radio buttons
        document.querySelectorAll('input[name="bundleFeeAllocation"]').forEach(radio => {
            radio.addEventListener('change', function () {
                setFeeAllocationMode(this.value);
            });
        });
    }

    function clearAll() {
        bundleProducts = [];
        productIdCounter = 0;
        lastBundleResult = null;
        renderProductList();
        renderEmptyResults();
    }

    // ==================== PUBLIC API ====================

    return {
        // Mode switching
        switchMode,
        setFeeAllocationMode,
        setCalculatorMode,
        setPriceFinderTargetType,
        getMode: () => inputMode,
        getFeeAllocationMode: () => feeAllocationMode,
        getCalculatorMode: () => calculatorMode,

        // Calculation
        calculateBundleProfit,
        calculateAndRender,
        findBundlePrice,
        generateInsights,

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
        renderProductBreakdown,
        renderBusinessInsights,
        toggleProductAccordion,
        getHighestFeeCategory,
        init,

        // Getters
        getProducts: () => [...bundleProducts],
        getProductCount: () => bundleProducts.length,
        getSelectedFromDB: () => [...selectedFromDB],
        getLastResult: () => lastBundleResult
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
