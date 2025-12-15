/**
 * AppConstants - Centralized configuration and constants
 * Using IIFE pattern for browser compatibility without build tools
 */
const AppConstants = (function() {
    'use strict';

    // ==================== MARKETPLACE CONFIGURATIONS ====================
    
    /**
     * Shopee admin fee rates by category and seller type
     */
    const SHOPEE_RATES = {
        star: { 'A': 8.0, 'B': 7.5, 'C': 5.75, 'D': 4.25, 'E': 2.5, 'F': 3.2 },
        nonstar: { 'A': 8.0, 'B': 7.5, 'C': 5.75, 'D': 4.25, 'E': 2.5, 'F': 3.2 },
        mall: { 'A': 10.2, 'B': 9.7, 'C': 7.2, 'D': 6.2, 'E': 5.2, 'F': 3.2 }
    };

    /**
     * Marketplace fee configurations
     */
    const MARKETPLACE_FEES = {
        shopee: {
            name: 'Shopee',
            icon: 'fa-shopping-bag',
            color: '#EE4D2D',
            adminFees: { A: 8, B: 7.5, C: 5.75, D: 4.25, E: 2.5 },
            serviceFees: {
                freeShip: { rate: 4.0, cap: 40000 },
                cashback: { rate: 4.5, cap: 60000 }
            },
            orderProcessFee: 1250,
            fixedFee: 0
        },
        tokopedia: {
            name: 'Tokopedia',
            icon: 'fa-store',
            color: '#03AC0E',
            adminFees: { A: 6.5, B: 6, C: 4.5, D: 3.5, E: 2 },
            serviceFees: {
                freeShip: { rate: 4.0, cap: 40000 },
                cashback: { rate: 0, cap: 0 }
            },
            orderProcessFee: 1000,
            fixedFee: 0
        },
        tiktok: {
            name: 'TikTok',
            icon: 'fab fa-tiktok',
            color: '#000000',
            adminFees: { A: 5, B: 4.5, C: 3.5, D: 2.5, E: 1.5 },
            serviceFees: {
                freeShip: { rate: 4.0, cap: 40000 },
                cashback: { rate: 0, cap: 0 }
            },
            orderProcessFee: 1000,
            fixedFee: 0
        },
        lazada: {
            name: 'Lazada',
            icon: 'fa-heart',
            color: '#10156F',
            adminFees: { A: 6, B: 5.5, C: 4.5, D: 3.5, E: 2 },
            serviceFees: {
                freeShip: { rate: 5.0, cap: 50000 },
                cashback: { rate: 0, cap: 0 }
            },
            orderProcessFee: 1000,
            fixedFee: 0
        }
    };

    // ==================== UI CONSTANTS ====================
    
    const UI = {
        DEBOUNCE_DELAY: 150,
        TOAST_DURATION: 3000,
        ANIMATION_DURATION: 300,
        CHART_ANIMATION_DURATION: 400
    };

    // ==================== DEFAULT VALUES ====================
    
    const DEFAULTS = {
        platform: 'shopee',
        sellerType: 'nonstar',
        categoryGroup: 'A',
        orderProcessFee: 1250,
        affiliatePercent: 0,
        conversionRate: 2.0,
        targetMargin: 15
    };

    // ==================== VALIDATION LIMITS ====================
    
    const LIMITS = {
        maxPrice: 999999999,
        minPrice: 0,
        maxDiscount: 100,
        minDiscount: 0,
        maxFeePercent: 100,
        minFeePercent: 0
    };

    // Return public API
    return {
        SHOPEE_RATES,
        MARKETPLACE_FEES,
        UI,
        DEFAULTS,
        LIMITS,
        
        /**
         * Get admin fee rate for a platform/seller/category
         * @param {string} platform 
         * @param {string} sellerType 
         * @param {string} categoryGroup 
         * @returns {number}
         */
        getAdminFeeRate(platform, sellerType, categoryGroup) {
            if (platform === 'shopee') {
                return SHOPEE_RATES[sellerType]?.[categoryGroup] || SHOPEE_RATES.nonstar.A;
            }
            return MARKETPLACE_FEES[platform]?.adminFees[categoryGroup] || 8;
        },
        
        /**
         * Get marketplace config
         * @param {string} platform 
         * @returns {Object}
         */
        getMarketplace(platform) {
            return MARKETPLACE_FEES[platform] || MARKETPLACE_FEES.shopee;
        }
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.AppConstants = AppConstants;
}
