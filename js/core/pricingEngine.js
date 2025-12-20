/**
 * PricingEngine - Modular pricing and fee calculation engine
 * 
 * This module provides pure calculation functions for:
 * - Single product profit calculation
 * - Bundle profit calculation with fee allocation
 * - Reverse price finding (minimum price for target profit)
 * - Business insights generation
 * 
 * DESIGN PRINCIPLES:
 * - No DOM access - pure math functions only
 * - Uses AppConstants and AppState for platform configuration
 * - Deterministic calculations with clear formulas
 * - All monetary values in Indonesian Rupiah (integer)
 * 
 * @module PricingEngine
 */
const PricingEngine = (function () {
    'use strict';

    // ==================== CONSTANTS ====================

    /**
     * Fee allocation modes for bundle calculations
     * 
     * - TOTAL_BASED: Fees calculated on bundle price, allocated by HPP ratio
     * - PROPORTIONAL: Fees distributed proportionally by each product's HPP contribution
     * - PER_ITEM: Process fee per item quantity, % fees on bundle total
     */
    const FEE_ALLOCATION_MODES = {
        TOTAL_BASED: 'total',
        PROPORTIONAL: 'proportional',
        PER_ITEM: 'perItem'
    };

    /**
     * Margin health thresholds for status indicators
     * 
     * DANGER: profit < 0 (loss)
     * WARNING: 0 <= margin < 5%
     * HEALTHY: margin >= 10%
     * CAUTION: 5% <= margin < 10%
     */
    const MARGIN_THRESHOLDS = {
        DANGER: 0,      // Loss
        WARNING: 5,     // Low margin
        CAUTION: 10,    // Moderate margin
        HEALTHY: 10     // Good margin
    };

    // ==================== HELPER FUNCTIONS ====================

    /**
     * Get platform fees from AppConstants/AppState
     * @param {Object} options - Optional overrides
     * @returns {Object} Fee configuration
     */
    function getPlatformFees(options = {}) {
        const platform = options.platform || AppState?.get('platform') || 'shopee';
        const sellerType = options.sellerType || AppState?.get('sellerType') || 'nonstar';
        const categoryGroup = options.categoryGroup || AppState?.get('category.group') || 'A';

        if (typeof AppConstants !== 'undefined') {
            const config = AppConstants.getMarketplace(platform);
            const adminRate = AppConstants.getAdminFeeRate(platform, sellerType, categoryGroup);

            return {
                platform,
                adminRate: adminRate,
                serviceRate: config.serviceFees?.freeShip?.rate || 4,
                serviceCap: config.serviceFees?.freeShip?.cap || 40000,
                cashbackRate: config.serviceFees?.cashback?.rate || 4.5,
                cashbackCap: config.serviceFees?.cashback?.cap || 60000,
                processFee: config.orderProcessFee || 1250,
                fixedFee: config.fixedFee || 0,
                freeShipEnabled: options.freeShipEnabled ?? AppState?.get('features.freeShipEnabled') ?? false,
                cashbackEnabled: options.cashbackEnabled ?? AppState?.get('features.cashbackEnabled') ?? false
            };
        }

        // Default fallback
        return {
            platform: 'shopee',
            adminRate: 8,
            serviceRate: 4,
            serviceCap: 40000,
            cashbackRate: 4.5,
            cashbackCap: 60000,
            processFee: 1250,
            fixedFee: 0,
            freeShipEnabled: false,
            cashbackEnabled: false
        };
    }

    /**
     * Determine margin status based on profit and margin
     * @param {number} profit - Net profit amount
     * @param {number} margin - Margin percentage
     * @returns {string} Status: 'healthy' | 'warning' | 'danger'
     */
    function getMarginStatus(profit, margin) {
        if (profit < 0) return 'danger';
        if (margin < MARGIN_THRESHOLDS.WARNING) return 'warning';
        if (margin >= MARGIN_THRESHOLDS.HEALTHY) return 'healthy';
        return 'warning'; // Between 5-10% is still warning/caution
    }

    /**
     * Parse number from various input types
     * @param {*} value 
     * @returns {number}
     */
    function parseNum(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        if (typeof Formatters !== 'undefined') {
            return Formatters.parseNumber(value);
        }
        return parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
    }

    // ==================== MARKETPLACE FEE CALCULATION ====================

    /**
     * Calculate marketplace fees for a given price
     * 
     * Formula:
     * - Admin Fee = feeBase × (adminRate / 100)
     * - Service Fee = min(feeBase × (serviceRate / 100), serviceCap)
     * - Cashback Fee = min(feeBase × (cashbackRate / 100), cashbackCap)
     * - Total Fees = Admin + Service + Cashback + Process + Fixed
     * 
     * @param {number} price - Selling price
     * @param {Object} options - Calculation options
     * @param {number} options.voucherAmount - Voucher amount (reduces fee base)
     * @param {number} options.itemCount - Number of items (for PER_ITEM mode)
     * @param {string} options.allocationMode - Fee allocation mode
     * @returns {Object} Fee breakdown
     */
    function calculateMarketplaceFees(price, options = {}) {
        const fees = getPlatformFees(options);
        const voucherAmount = options.voucherAmount || 0;
        const itemCount = options.itemCount || 1;
        const allocationMode = options.allocationMode || FEE_ALLOCATION_MODES.TOTAL_BASED;

        // Fee base is price minus voucher (voucher reduces fee calculation base)
        const feeBase = Math.max(0, price - voucherAmount);

        // Admin fee (always percentage based)
        const adminFee = feeBase * (fees.adminRate / 100);

        // Service fee with cap (if free shipping enabled)
        let serviceFee = 0;
        if (fees.freeShipEnabled) {
            serviceFee = Math.min(feeBase * (fees.serviceRate / 100), fees.serviceCap);
        }

        // Cashback fee with cap (if cashback enabled)
        let cashbackFee = 0;
        if (fees.cashbackEnabled) {
            cashbackFee = Math.min(feeBase * (fees.cashbackRate / 100), fees.cashbackCap);
        }

        // Process fee - depends on allocation mode
        // In PER_ITEM mode, process fee is multiplied by item count
        const processFee = allocationMode === FEE_ALLOCATION_MODES.PER_ITEM
            ? fees.processFee * itemCount
            : fees.processFee;

        // Fixed fee (e.g., transaction fee)
        const fixedFee = fees.fixedFee;

        // Total fees
        const totalFees = adminFee + serviceFee + cashbackFee + processFee + fixedFee;

        // Percentage-based fees total (for allocation calculations)
        const percentBasedFees = adminFee + serviceFee + cashbackFee;
        const fixedBasedFees = processFee + fixedFee;

        return {
            feeBase,
            adminFee,
            serviceFee,
            cashbackFee,
            processFee,
            fixedFee,
            totalFees,
            percentBasedFees,
            fixedBasedFees,

            // Rates for reference
            adminRate: fees.adminRate,
            serviceRate: fees.freeShipEnabled ? fees.serviceRate : 0,
            cashbackRate: fees.cashbackEnabled ? fees.cashbackRate : 0,

            // Total effective percentage (for reverse calculation)
            effectiveFeePercent: feeBase > 0
                ? ((adminFee + serviceFee + cashbackFee) / feeBase) * 100
                : fees.adminRate + (fees.freeShipEnabled ? fees.serviceRate : 0)
        };
    }

    // ==================== SINGLE PRODUCT CALCULATION ====================

    /**
     * Calculate profit for a single product
     * 
     * @param {Object} product - Product data
     * @param {number} product.price - Selling price
     * @param {number} product.hpp - Cost of goods (HPP)
     * @param {number} product.qty - Quantity (default 1)
     * @param {number} product.discount - Discount percentage (default 0)
     * @param {Object} options - Calculation options
     * @returns {Object} Calculation result
     */
    function calculateSingleProduct(product, options = {}) {
        const price = parseNum(product.price);
        const hpp = parseNum(product.hpp);
        const qty = parseInt(product.qty) || 1;
        const discountPercent = parseNum(product.discount) || 0;
        const voucherAmount = parseNum(options.voucherAmount) || 0;

        // Apply discount to get actual selling price
        const discountedPrice = price * (1 - discountPercent / 100);
        const totalSellingPrice = discountedPrice * qty;
        const totalHPP = hpp * qty;

        // Calculate marketplace fees
        const feeResult = calculateMarketplaceFees(totalSellingPrice, {
            ...options,
            voucherAmount,
            itemCount: qty
        });

        // Net cash received from marketplace
        const netCash = totalSellingPrice - feeResult.totalFees - voucherAmount;

        // Net profit
        const netProfit = netCash - totalHPP;

        // Margin percentage
        const margin = totalSellingPrice > 0 ? (netProfit / totalSellingPrice) * 100 : 0;

        return {
            // Input summary
            price,
            discountedPrice,
            hpp,
            qty,
            totalSellingPrice,
            totalHPP,
            voucherAmount,

            // Fee breakdown
            ...feeResult,

            // Results
            netCash,
            netProfit,
            margin,
            marginStatus: getMarginStatus(netProfit, margin)
        };
    }

    // ==================== BUNDLE CALCULATION ====================

    /**
     * Calculate bundle profit with per-product breakdown
     * 
     * This is the main bundle calculation function that:
     * 1. Calculates total HPP from all products
     * 2. Calculates marketplace fees on bundle price
     * 3. Allocates fees to products based on allocation mode
     * 4. Returns per-product profit breakdown
     * 
     * @param {number} bundlePrice - Total bundle selling price
     * @param {Array} products - Array of {name, hpp, qty, price?}
     * @param {Object} options - Calculation options
     * @param {string} options.allocationMode - Fee allocation mode
     * @param {number} options.voucherAmount - Voucher discount
     * @returns {Object} Bundle calculation result
     */
    function calculateBundle(bundlePrice, products, options = {}) {
        const price = parseNum(bundlePrice);
        const voucherAmount = parseNum(options.voucherAmount) || 0;
        const allocationMode = options.allocationMode || FEE_ALLOCATION_MODES.TOTAL_BASED;

        // Validate inputs
        if (!products || products.length === 0) {
            return createEmptyBundleResult();
        }

        // Calculate totals from products
        let totalHPP = 0;
        let totalItems = 0;
        const normalizedProducts = products.map((p, index) => {
            const hpp = parseNum(p.hpp);
            const qty = parseInt(p.qty) || 1;
            totalHPP += hpp * qty;
            totalItems += qty;
            return {
                id: p.id || index + 1,
                name: p.name || `Produk ${index + 1}`,
                hpp,
                qty,
                individualPrice: parseNum(p.price) || hpp * 2, // Default 100% markup if no price
                hppTotal: hpp * qty
            };
        });

        // Calculate marketplace fees for bundle
        // BUNDLE BUSINESS RULE: Always enable ALL service fees (conservative)
        // This ensures sellers see worst-case scenario for fee calculations
        const feeResult = calculateMarketplaceFees(price, {
            ...options,
            voucherAmount,
            itemCount: totalItems,
            allocationMode,
            freeShipEnabled: true,   // Always enable for bundle (conservative)
            cashbackEnabled: true    // Always enable for bundle (conservative)
        });

        // Net cash and profit for bundle
        const netCash = price - feeResult.totalFees - voucherAmount;
        const netProfit = netCash - totalHPP;
        const margin = price > 0 ? (netProfit / price) * 100 : 0;

        // Allocate fees and profit to each product
        const productBreakdown = allocateBundleFees(
            feeResult,
            normalizedProducts,
            totalHPP,
            netProfit,
            allocationMode,
            options
        );

        // Calculate individual selling profit (if sold separately)
        const individualResult = calculateIndividualProfit(normalizedProducts, options);

        return {
            // Bundle summary
            bundlePrice: price,
            totalHPP,
            totalItems,
            productCount: products.length,
            voucherAmount,

            // Fee breakdown
            adminFee: feeResult.adminFee,
            serviceFee: feeResult.serviceFee,
            cashbackFee: feeResult.cashbackFee,
            processFee: feeResult.processFee,
            fixedFee: feeResult.fixedFee,
            totalFees: feeResult.totalFees,

            // Results
            netCash,
            netProfit,
            margin,
            marginStatus: getMarginStatus(netProfit, margin),

            // Per-product breakdown
            products: productBreakdown,

            // Comparison with individual sales
            individualProfit: individualResult.totalProfit,
            profitDifference: netProfit - individualResult.totalProfit,
            profitDifferencePercent: individualResult.totalProfit !== 0
                ? ((netProfit - individualResult.totalProfit) / Math.abs(individualResult.totalProfit)) * 100
                : 0,
            isBundleBetter: netProfit > individualResult.totalProfit,

            // Metadata
            allocationMode,
            feeRates: {
                adminRate: feeResult.adminRate,
                serviceRate: feeResult.serviceRate,
                cashbackRate: feeResult.cashbackRate
            }
        };
    }

    /**
     * Allocate bundle fees to individual products
     * 
     * @param {Object} feeResult - Fee calculation result
     * @param {Array} products - Normalized products
     * @param {number} totalHPP - Total HPP
     * @param {number} totalNetProfit - Total net profit
     * @param {string} mode - Allocation mode
     * @param {Object} options - Fee options
     * @returns {Array} Products with allocated fees
     */
    function allocateBundleFees(feeResult, products, totalHPP, totalNetProfit, mode, options = {}) {
        const fees = getPlatformFees(options);

        return products.map(product => {
            // HPP ratio for this product
            const hppRatio = totalHPP > 0 ? product.hppTotal / totalHPP : 1 / products.length;

            let allocatedFee = 0;
            let allocatedProfit = 0;

            switch (mode) {
                case FEE_ALLOCATION_MODES.PER_ITEM:
                    // Process fee per item, percentage fees proportional
                    const productProcessFee = fees.processFee * product.qty;
                    const productPercentFee = hppRatio * feeResult.percentBasedFees;
                    allocatedFee = productProcessFee + productPercentFee + (hppRatio * fees.fixedFee);
                    allocatedProfit = hppRatio * totalNetProfit;
                    break;

                case FEE_ALLOCATION_MODES.PROPORTIONAL:
                case FEE_ALLOCATION_MODES.TOTAL_BASED:
                default:
                    // All fees distributed by HPP ratio
                    allocatedFee = hppRatio * feeResult.totalFees;
                    allocatedProfit = hppRatio * totalNetProfit;
                    break;
            }

            // Individual margin for this product
            const productPriceShare = hppRatio * feeResult.feeBase; // Approximate price share
            const productMargin = productPriceShare > 0
                ? (allocatedProfit / productPriceShare) * 100
                : 0;

            return {
                ...product,
                allocatedFee: Math.round(allocatedFee),
                allocatedProfit: Math.round(allocatedProfit),
                profitShare: totalNetProfit !== 0 ? (allocatedProfit / totalNetProfit) * 100 : 0,
                margin: productMargin,
                marginStatus: getMarginStatus(allocatedProfit, productMargin),
                hppRatio: hppRatio * 100 // As percentage
            };
        });
    }

    /**
     * Calculate profit if products sold individually
     * @param {Array} products - Products array
     * @param {Object} options - Fee options
     * @returns {Object} Individual profit result
     */
    function calculateIndividualProfit(products, options = {}) {
        let totalProfit = 0;
        const details = [];

        products.forEach(p => {
            const price = p.individualPrice || (p.hpp * 2); // Assume 100% markup if no price
            const result = calculateSingleProduct({
                price,
                hpp: p.hpp,
                qty: p.qty
            }, options);

            totalProfit += result.netProfit;
            details.push({
                name: p.name,
                profit: result.netProfit,
                margin: result.margin
            });
        });

        return { totalProfit, details };
    }

    /**
     * Create empty bundle result for edge cases
     */
    function createEmptyBundleResult() {
        return {
            bundlePrice: 0,
            totalHPP: 0,
            totalItems: 0,
            productCount: 0,
            voucherAmount: 0,
            adminFee: 0,
            serviceFee: 0,
            cashbackFee: 0,
            processFee: 0,
            fixedFee: 0,
            totalFees: 0,
            netCash: 0,
            netProfit: 0,
            margin: 0,
            marginStatus: 'danger',
            products: [],
            individualProfit: 0,
            profitDifference: 0,
            profitDifferencePercent: 0,
            isBundleBetter: false,
            allocationMode: FEE_ALLOCATION_MODES.TOTAL_BASED
        };
    }

    // ==================== BUNDLE PRICE FINDER ====================

    /**
     * Find minimum bundle price to achieve target profit
     * 
     * This is a reverse calculation:
     * Given: targetProfit, products, fees
     * Find: minimum bundle price
     * 
     * Formula derivation:
     * netProfit = bundlePrice - totalFees - totalHPP
     * netProfit = bundlePrice - (bundlePrice × feePercent + fixedFees) - totalHPP
     * netProfit = bundlePrice × (1 - feePercent) - fixedFees - totalHPP
     * bundlePrice = (netProfit + fixedFees + totalHPP) / (1 - feePercent)
     * 
     * @param {Array} products - Bundle products
     * @param {Object} targetConfig - Target configuration
     * @param {string} targetConfig.type - 'rupiah' or 'percent'
     * @param {number} targetConfig.value - Target value
     * @param {Object} options - Fee options
     * @returns {Object} Price finder result
     */
    function findBundlePrice(products, targetConfig, options = {}) {
        // BUNDLE BUSINESS RULE: Always assume all service fees are enabled for reverse calculation
        const fees = getPlatformFees({
            ...options,
            freeShipEnabled: true,
            cashbackEnabled: true
        });

        // Calculate total HPP
        let totalHPP = 0;
        let totalItems = 0;
        products.forEach(p => {
            const hpp = parseNum(p.hpp);
            const qty = parseInt(p.qty) || 1;
            totalHPP += hpp * qty;
            totalItems += qty;
        });

        if (totalHPP === 0) {
            return {
                minPrice: 0,
                suggestedPrices: [],
                targetProfit: 0,
                isValid: false,
                error: 'Total HPP is zero'
            };
        }

        // Calculate target profit amount
        let targetProfitAmount = 0;
        if (targetConfig.type === 'percent') {
            targetProfitAmount = totalHPP * (targetConfig.value / 100);
        } else {
            targetProfitAmount = parseNum(targetConfig.value);
        }

        // Calculate total fee percentage
        let totalFeePercent = fees.adminRate;
        if (fees.freeShipEnabled) totalFeePercent += fees.serviceRate;
        if (fees.cashbackEnabled) totalFeePercent += fees.cashbackRate;

        // Fixed costs (process fee, etc.)
        const allocationMode = options.allocationMode || FEE_ALLOCATION_MODES.TOTAL_BASED;
        const fixedCosts = allocationMode === FEE_ALLOCATION_MODES.PER_ITEM
            ? fees.processFee * totalItems
            : fees.processFee;

        // Calculate minimum price
        // bundlePrice × (1 - feePercent/100) = targetProfit + totalHPP + fixedCosts
        const denominator = 1 - (totalFeePercent / 100);

        if (denominator <= 0) {
            return {
                minPrice: 0,
                suggestedPrices: [],
                targetProfit: targetProfitAmount,
                isValid: false,
                error: 'Fee percentage too high (>= 100%)'
            };
        }

        const minPrice = Math.ceil((targetProfitAmount + totalHPP + fixedCosts) / denominator);

        // Generate psychological price suggestions
        const suggestedPrices = generatePsychologicalPrices(minPrice);

        // Calculate actual profit at min price
        const verifyResult = calculateBundle(minPrice, products, options);

        return {
            minPrice,
            suggestedPrices,
            targetProfit: targetProfitAmount,
            targetType: targetConfig.type,
            actualProfit: verifyResult.netProfit,
            actualMargin: verifyResult.margin,
            totalHPP,
            totalItems,
            feePercent: totalFeePercent,
            fixedCosts,
            isValid: true
        };
    }

    /**
     * Generate psychological price suggestions
     * Common patterns: xxx.000, xx9.000, xx5.000
     * 
     * @param {number} basePrice - Minimum required price
     * @returns {Array} Suggested prices with metadata
     */
    function generatePsychologicalPrices(basePrice) {
        const suggestions = [];

        // Round to nearest 1000
        const rounded = Math.ceil(basePrice / 1000) * 1000;

        // Find the magnitude (10000s, 100000s, etc.)
        const magnitude = Math.pow(10, Math.floor(Math.log10(rounded)));
        const nearestTen = Math.ceil(basePrice / 10000) * 10000;

        // Pattern: xxx9000 (e.g., 149000, 159000)
        const nine = Math.ceil(basePrice / 10000) * 10000 - 1000;
        if (nine >= basePrice) {
            suggestions.push({
                price: nine,
                label: 'Harga Psikologis',
                pattern: 'xx9.000'
            });
        }

        // Pattern: round up to nice number (e.g., 150000, 200000)
        const nice = Math.ceil(basePrice / 50000) * 50000;
        if (nice >= basePrice && !suggestions.find(s => s.price === nice)) {
            suggestions.push({
                price: nice,
                label: 'Harga Bulat',
                pattern: 'xx0.000'
            });
        }

        // Pattern: next level nine (e.g., 159000, 199000)
        const nextNine = nine + 10000;
        if (nextNine >= basePrice && !suggestions.find(s => s.price === nextNine)) {
            suggestions.push({
                price: nextNine,
                label: 'Alternatif',
                pattern: 'xx9.000'
            });
        }

        // Add the exact minimum if significantly different
        if (rounded >= basePrice && !suggestions.find(s => s.price === rounded)) {
            suggestions.push({
                price: rounded,
                label: 'Harga Minimum',
                pattern: 'Minimum'
            });
        }

        // Sort by price
        suggestions.sort((a, b) => a.price - b.price);

        // Return top 4 unique suggestions
        return suggestions.slice(0, 4);
    }

    // ==================== BUSINESS INSIGHTS ====================

    /**
     * Generate business insights from bundle calculation
     * 
     * Insight types:
     * - SUBSIDY_WARNING: Product losing money but covered by others
     * - PROFIT_CONTRIBUTOR: Product contributing majority of profit
     * - LOW_MARGIN: Bundle margin below warning threshold
     * - LOSS_WARNING: Bundle losing money
     * - OPTIMIZATION_TIP: Suggestions for improvement
     * - DISCOUNT_LIMIT: Maximum safe discount amount
     * 
     * @param {Object} bundleResult - Result from calculateBundle
     * @returns {Array} Array of insight objects
     */
    function generateBusinessInsights(bundleResult) {
        const insights = [];

        if (!bundleResult || !bundleResult.products) {
            return insights;
        }

        const { netProfit, margin, products, bundlePrice } = bundleResult;

        // 1. Loss Warning
        if (netProfit < 0) {
            insights.push({
                type: 'LOSS_WARNING',
                severity: 'danger',
                icon: 'exclamation-triangle',
                message: `Bundle ini mengalami RUGI ${formatRp(Math.abs(netProfit))}!`,
                action: 'Naikkan harga bundle atau kurangi produk'
            });
        }

        // 2. Low Margin Warning
        if (netProfit >= 0 && margin < MARGIN_THRESHOLDS.WARNING) {
            insights.push({
                type: 'LOW_MARGIN',
                severity: 'warning',
                icon: 'exclamation-circle',
                message: `Margin bundle tipis (${margin.toFixed(1)}%). Risiko rugi tinggi jika ada diskon/promo.`,
                action: 'Pertimbangkan naikkan harga 5-10%'
            });
        }

        // 3. Subsidy Detection
        const lossMakingProducts = products.filter(p => p.allocatedProfit < 0);
        const profitableProducts = products.filter(p => p.allocatedProfit > 0);

        if (lossMakingProducts.length > 0 && netProfit > 0) {
            const subsidizers = profitableProducts
                .map(p => p.name)
                .join(', ');
            const subsidized = lossMakingProducts
                .map(p => `${p.name} (rugi ${formatRp(Math.abs(p.allocatedProfit))})`)
                .join(', ');

            insights.push({
                type: 'SUBSIDY_WARNING',
                severity: 'warning',
                icon: 'balance-scale',
                message: `Produk berikut mengalami rugi: ${subsidized}`,
                detail: `Disubsidi oleh: ${subsidizers}`,
                action: 'Evaluasi komposisi bundle'
            });
        }

        // 4. Profit Contributor
        const topContributor = products
            .filter(p => p.allocatedProfit > 0)
            .sort((a, b) => b.profitShare - a.profitShare)[0];

        if (topContributor && topContributor.profitShare > 50) {
            insights.push({
                type: 'PROFIT_CONTRIBUTOR',
                severity: 'info',
                icon: 'star',
                message: `Produk "${topContributor.name}" menyumbang ${topContributor.profitShare.toFixed(0)}% profit bundle`,
                detail: `Profit: ${formatRp(topContributor.allocatedProfit)}`,
                action: null
            });
        }

        // 5. Discount Limit
        if (netProfit > 0 && bundlePrice > 0) {
            const maxDiscount = (netProfit / bundlePrice) * 100;
            insights.push({
                type: 'DISCOUNT_LIMIT',
                severity: maxDiscount < 5 ? 'warning' : 'info',
                icon: 'tag',
                message: `Maksimal diskon bundle: ${maxDiscount.toFixed(1)}% (${formatRp(netProfit)})`,
                detail: 'Diskon melebihi ini akan menyebabkan rugi',
                action: null
            });
        }

        // 6. Optimization Tips
        if (lossMakingProducts.length > 0 && products.length > 2) {
            const worstProduct = lossMakingProducts
                .sort((a, b) => a.allocatedProfit - b.allocatedProfit)[0];

            insights.push({
                type: 'OPTIMIZATION_TIP',
                severity: 'info',
                icon: 'lightbulb',
                message: `Pertimbangkan menghapus atau mengganti "${worstProduct.name}"`,
                detail: `Rugi: ${formatRp(Math.abs(worstProduct.allocatedProfit))} per bundle`,
                action: 'Ganti dengan produk margin lebih tinggi'
            });
        }

        return insights;
    }

    /**
     * Format rupiah helper for insights
     */
    function formatRp(value) {
        if (typeof Formatters !== 'undefined') {
            return Formatters.formatRupiah(value);
        }
        return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
    }

    // ==================== PUBLIC API ====================

    return {
        // Constants
        FEE_ALLOCATION_MODES,
        MARGIN_THRESHOLDS,

        // Core calculations
        calculateMarketplaceFees,
        calculateSingleProduct,
        calculateBundle,
        allocateBundleFees,

        // Price finder
        findBundlePrice,
        generatePsychologicalPrices,

        // Business insights
        generateBusinessInsights,
        getMarginStatus,

        // Helpers
        getPlatformFees,
        parseNum
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.PricingEngine = PricingEngine;
}
