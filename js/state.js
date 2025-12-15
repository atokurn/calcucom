/**
 * AppState - Centralized state management
 * Using IIFE pattern for browser compatibility
 */
const AppState = (function () {
    'use strict';

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

        // Current Module
        currentModule: 'profit',

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

        // Bundling Calculator State
        bundling: {
            products: [],
            bundlePrice: 0,
            bundleDiscount: 0
        }
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

    // ==================== PUBLIC API ====================

    return {
        /**
         * Get state value by key (supports dot notation)
         * @param {string} key - e.g., 'platform' or 'category.group'
         * @returns {*}
         */
        get(key) {
            const keys = key.split('.');
            let value = state;

            for (const k of keys) {
                if (value === null || value === undefined) return undefined;
                value = value[k];
            }

            return value;
        },

        /**
         * Set state value by key (supports dot notation)
         * @param {string} key 
         * @param {*} value 
         */
        set(key, value) {
            const keys = key.split('.');
            const lastKey = keys.pop();
            let target = state;

            for (const k of keys) {
                if (target[k] === undefined) {
                    target[k] = {};
                }
                target = target[k];
            }

            const oldValue = target[lastKey];
            target[lastKey] = value;

            // Notify listeners
            notifyListeners(key, value, oldValue);
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
        }
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.AppState = AppState;
}
