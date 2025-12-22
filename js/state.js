/**
 * AppState - Centralized state management
 * Using IIFE pattern for browser compatibility
 */
const AppState = (function () {
    'use strict';

    // ==================== STORAGE KEYS ====================

    const STORAGE_KEY = 'calcucom_state';
    const PRODUCT_DB_KEY = 'productDB';

    // ==================== PRIVATE STATE ====================

    const state = {
        // Platform & Category
        platform: 'shopee',
        sellerType: 'nonstar',
        category: {
            l1: null,
            l2: null,
            l3: null,
            group: 'A',
            fullPath: ''
        },

        // Input Mode
        inputMode: 'single', // 'single' or 'bulk'
        adsMode: 'unit', // 'unit' or 'dashboard'
        simMode: 'ads', // 'ads' or 'sales'
        adsTargetType: 'percent', // 'percent' or 'fixed'

        // Current Module
        currentModule: 'profit',

        // Profit Calculator State
        profitCalculator: {
            sellingPrice: 0,
            discount: 0,
            voucher: 0,
            hpp: 0,
            affiliatePercent: 0,
            orderProcessFee: 0,
            fixedFee: 0,
            operationalCost: 0,
            adsCost: 0
        },

        // Price Finder State
        priceFinder: {
            configMode: 'simple', // 'simple' or 'advanced'
            targetType: 'margin', // 'margin' or 'profit'
            profitType: 'rupiah', // 'rupiah' or 'percent'
            hpp: 0,
            targetValue: 0,
            costComponents: []
        },

        // ROAS Calculator State
        roas: {
            selectedProducts: [],
            targetProfitEnabled: true,
            conversionRate: 2,
            autoData: {
                price: 0,
                netProfit: 0,
                roasBE: 0,
                isActive: false
            }
        },

        // Compare Module State
        compare: {
            selectedProducts: []
        },

        // Bundling Calculator State
        bundling: {
            products: [],
            bundlePrice: 0,
            bundleDiscount: 0,
            bundleMode: 'manual' // 'manual' or 'auto'
        },

        // Calculation Results (cached)
        lastCalculation: {
            profit: 0,
            margin: 0,
            netCash: 0,
            totalFees: 0
        },

        // UI State
        theme: 'light',
        language: 'id',

        // Feature Flags
        features: {
            freeShipEnabled: false,
            cashbackEnabled: false
        },

        // Compare Scenario
        savedScenarioA: null,

        // Custom Costs
        customCosts: [],

        // Products (Bulk Mode)
        products: []
    };

    // ==================== STATE CHANGE LISTENERS ====================

    const listeners = {};

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch
     * @param {Function} callback - Function to call on change
     * @returns {Function} Unsubscribe function
     */
    function subscribe(key, callback) {
        if (!listeners[key]) {
            listeners[key] = [];
        }
        listeners[key].push(callback);

        // Return unsubscribe function
        return function () {
            listeners[key] = listeners[key].filter(cb => cb !== callback);
        };
    }

    /**
     * Notify listeners of state change
     * @param {string} key 
     * @param {*} newValue 
     * @param {*} oldValue 
     */
    function notifyListeners(key, newValue, oldValue) {
        if (listeners[key]) {
            listeners[key].forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (e) {
                    console.error(`State listener error for "${key}":`, e);
                }
            });
        }
    }

    // ==================== PERSISTENCE ====================

    /**
     * Save specific state keys to localStorage
     * @param {Array} keys - Keys to persist
     */
    function persist(keys = ['theme', 'language', 'platform', 'sellerType']) {
        try {
            const dataToSave = {};
            keys.forEach(key => {
                const value = getNestedValue(state, key);
                if (value !== undefined) {
                    dataToSave[key] = value;
                }
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (e) {
            console.warn('Failed to persist state:', e);
        }
    }

    /**
     * Restore state from localStorage
     */
    function restore() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                Object.entries(data).forEach(([key, value]) => {
                    setNestedValue(state, key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to restore state:', e);
        }
    }

    /**
     * Get nested value from object
     */
    function getNestedValue(obj, key) {
        const keys = key.split('.');
        let value = obj;
        for (const k of keys) {
            if (value === null || value === undefined) return undefined;
            value = value[k];
        }
        return value;
    }

    /**
     * Set nested value in object
     */
    function setNestedValue(obj, key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        let target = obj;
        for (const k of keys) {
            if (target[k] === undefined) {
                target[k] = {};
            }
            target = target[k];
        }
        target[lastKey] = value;
    }

    // ==================== PUBLIC API ====================

    return {
        /**
         * Get state value by key (supports dot notation)
         * @param {string} key - e.g., 'platform' or 'category.group'
         * @returns {*}
         */
        get(key) {
            return getNestedValue(state, key);
        },

        /**
         * Set state value by key (supports dot notation)
         * @param {string} key 
         * @param {*} value 
         * @param {boolean} shouldPersist - Auto-persist this change
         */
        set(key, value, shouldPersist = false) {
            const oldValue = this.get(key);
            setNestedValue(state, key, value);

            // Notify listeners
            notifyListeners(key, value, oldValue);

            // Auto-persist if requested
            if (shouldPersist) {
                persist([key]);
            }
        },

        /**
         * Update multiple state values
         * @param {Object} updates - Key-value pairs to update
         */
        update(updates) {
            Object.entries(updates).forEach(([key, value]) => {
                this.set(key, value);
            });
        },

        /**
         * Subscribe to state changes
         */
        subscribe,

        /**
         * Get entire state (read-only copy)
         * @returns {Object}
         */
        getAll() {
            return JSON.parse(JSON.stringify(state));
        },

        /**
         * Reset state to defaults
         */
        reset() {
            this.set('platform', 'shopee');
            this.set('sellerType', 'nonstar');
            this.set('category', { l1: null, l2: null, l3: null, group: 'A', fullPath: '' });
            this.set('inputMode', 'single');
            this.set('features.freeShipEnabled', false);
            this.set('features.cashbackEnabled', false);
        },

        /**
         * Persist state to localStorage
         */
        persist,

        /**
         * Restore state from localStorage
         */
        restore,

        // ==================== CONVENIENCE METHODS ====================

        /**
         * Get current platform config
         * @returns {Object}
         */
        getPlatformConfig() {
            if (typeof AppConstants !== 'undefined') {
                return AppConstants.getMarketplace(state.platform);
            }
            return null;
        },

        /**
         * Get current admin fee rate
         * @returns {number}
         */
        getAdminFeeRate() {
            if (typeof AppConstants !== 'undefined') {
                return AppConstants.getAdminFeeRate(
                    state.platform,
                    state.sellerType,
                    state.category.group
                );
            }
            return 8; // Default
        },

        /**
         * Store calculation result
         * @param {Object} result 
         */
        setCalculationResult(result) {
            state.lastCalculation = { ...result };
        },

        /**
         * Get last calculation result
         * @returns {Object}
         */
        getCalculationResult() {
            return { ...state.lastCalculation };
        },

        // ==================== ROAS HELPERS ====================

        /**
         * Set ROAS auto data
         * @param {Object} data
         */
        setRoasAutoData(data) {
            state.roas.autoData = { ...data, isActive: true };
        },

        /**
         * Get ROAS auto data
         * @returns {Object}
         */
        getRoasAutoData() {
            return { ...state.roas.autoData };
        },

        /**
         * Add product to ROAS selection
         * @param {number} productId
         */
        addRoasProduct(productId) {
            if (!state.roas.selectedProducts.includes(productId)) {
                state.roas.selectedProducts.push(productId);
                notifyListeners('roas.selectedProducts', state.roas.selectedProducts);
            }
        },

        /**
         * Remove product from ROAS selection
         * @param {number} productId
         */
        removeRoasProduct(productId) {
            const idx = state.roas.selectedProducts.indexOf(productId);
            if (idx > -1) {
                state.roas.selectedProducts.splice(idx, 1);
                notifyListeners('roas.selectedProducts', state.roas.selectedProducts);
            }
        },

        /**
         * Get ROAS selected products
         * @returns {Array}
         */
        getRoasSelectedProducts() {
            return [...state.roas.selectedProducts];
        },

        // ==================== PRICE FINDER HELPERS ====================

        /**
         * Set Price Finder cost components
         * @param {Array} components
         */
        setPfCostComponents(components) {
            state.priceFinder.costComponents = [...components];
            notifyListeners('priceFinder.costComponents', state.priceFinder.costComponents);
        },

        /**
         * Get Price Finder cost components
         * @returns {Array}
         */
        getPfCostComponents() {
            return [...state.priceFinder.costComponents];
        },

        // ==================== MIGRATION & COMPAT ====================

        /**
         * Migrate from global variables (backward compatibility)
         * Call this at app initialization
         */
        migrateFromGlobals() {
            // Migrate if global variables exist
            if (typeof currentPlatform !== 'undefined') {
                this.set('platform', currentPlatform);
            }
            if (typeof selectedPath !== 'undefined') {
                this.set('category', {
                    l1: selectedPath.l1,
                    l2: selectedPath.l2,
                    l3: selectedPath.l3,
                    group: selectedPath.group || 'A',
                    fullPath: selectedPath.l3 || selectedPath.l2 || selectedPath.l1 || ''
                });
            }
            if (typeof inputMode !== 'undefined') {
                this.set('inputMode', inputMode);
            }
            if (typeof adsMode !== 'undefined') {
                this.set('adsMode', adsMode);
            }
            if (typeof currentModule !== 'undefined') {
                this.set('currentModule', currentModule);
            }
        }
    };
})();

// Auto-restore on load
if (typeof window !== 'undefined') {
    window.AppState = AppState;

    // Restore persisted state on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AppState.restore());
    } else {
        AppState.restore();
    }
}
