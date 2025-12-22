/**
 * PricingEngine - Unified calculation engine for marketplace profit
 * 
 * Combines all calculation functions for:
 * - Single product profit calculation
 * - Bundle profit calculation with fee allocation
 * - Reverse price finding (minimum price for target profit)
 * - ROAS and ad performance analysis
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
     */
    const FEE_ALLOCATION_MODES = {
        TOTAL_BASED: 'total',
        PROPORTIONAL: 'proportional',
        PER_ITEM: 'perItem'
    };

    /**
     * Margin health thresholds
     */
    const MARGIN_THRESHOLDS = {
        DANGER: 0,
        WARNING: 5,
        CAUTION: 10,
        HEALTHY: 10
    };

    // ==================== HELPER FUNCTIONS ====================

    /**
     * Parse number from various input types
     */
    function parseNum(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        if (typeof Formatters !== 'undefined') {
            return Formatters.parseNumber(value);
        }
        return parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
    }

    /**
     * Format rupiah helper
     */
    function formatRp(value) {
        if (typeof Formatters !== 'undefined') {
            return Formatters.formatRupiah(value);
        }
        return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
    }

    /**
     * Determine margin status based on profit and margin
     */
    function getMarginStatus(profit, margin) {
        if (profit < 0) return 'danger';
        if (margin < MARGIN_THRESHOLDS.WARNING) return 'warning';
        if (margin >= MARGIN_THRESHOLDS.HEALTHY) return 'healthy';
        return 'warning';
    }

    /**
     * Determine health level based on margin
     */
    function getHealthLevel(margin) {
        if (margin >= 25) return 'excellent';
        if (margin >= 15) return 'good';
        if (margin >= 5) return 'fair';
        if (margin >= 0) return 'low';
        return 'negative';
    }

    /**
     * Get admin rate based on platform, seller type, and category
     */
    function getAdminRate(platform, sellerType, categoryGroup) {
        if (platform === 'shopee' && typeof shopeeRates !== 'undefined') {
            return shopeeRates[sellerType]?.[categoryGroup] || 0;
        }
        if (platform === 'tokopedia' && typeof tokopediaRates !== 'undefined') {
            const type = sellerType === 'star' ? 'power' : (sellerType === 'mall' ? 'mall' : 'regular');
            return tokopediaRates[type]?.[categoryGroup] || 0;
        }
        if (platform === 'tiktok' && typeof tiktokRates !== 'undefined') {
            const type = sellerType === 'mall' ? 'mall' : 'regular';
            return tiktokRates[type]?.[categoryGroup] || 0;
        }
        return 0;
    }

    /**
     * Get platform fees from AppConstants/AppState
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

    // ==================== SINGLE PRODUCT CALCULATIONS ====================

    /**
     * Calculate marketplace fees for single product (legacy format)
     */
    function calculateFees(params) {
        const {
            platform = 'shopee',
            sellerType = 'nonstar',
            categoryGroup = 'A',
            sellingPrice = 0,
            discountPercent = 0,
            voucherAmount = 0,
            hpp = 0,
            isFreeShip = false,
            isCashback = false,
            affiliatePercent = 0,
            orderProcessFee = 0,
            fixedFee = 0,
            operationalCost = 0,
            adsCost = 0,
            customCosts = []
        } = params;

        const displayPrice = sellingPrice - (sellingPrice * discountPercent / 100);
        const basis = Math.max(0, displayPrice - voucherAmount);

        const adminRate = getAdminRate(platform, sellerType, categoryGroup);
        const adminFee = basis * (adminRate / 100);

        let freeShipFee = 0;
        let cashbackFee = 0;

        if (isFreeShip) {
            freeShipFee = Math.min(basis * 0.04, 40000);
        }
        if (isCashback) {
            cashbackFee = basis * 0.045;
        }

        const serviceFee = freeShipFee + cashbackFee;
        const affiliateFee = basis * (affiliatePercent / 100);
        const totalFixedFees = orderProcessFee + fixedFee + operationalCost + adsCost;

        let customDeductions = 0;
        let customAdditions = 0;
        customCosts.forEach(cost => {
            const amount = cost.isPercent ? basis * (cost.amount / 100) : cost.amount;
            if (cost.category === 'deduction') {
                customDeductions += amount;
            } else {
                customAdditions += amount;
            }
        });

        const totalDeductions = adminFee + serviceFee + affiliateFee + customDeductions;
        const netIncome = basis - totalDeductions;
        const totalCost = hpp + totalFixedFees + customAdditions;
        const netProfit = netIncome - totalCost;
        const margin = basis > 0 ? (netProfit / basis) * 100 : 0;

        return {
            sellingPrice, displayPrice, basis, hpp,
            adminRate, adminFee, serviceFee, freeShipFee, cashbackFee,
            affiliateFee, orderProcessFee, fixedFee, operationalCost, adsCost,
            customDeductions, customAdditions,
            totalDeductions, totalFixedFees, totalCost,
            netIncome, netProfit, margin,
            isHealthy: netProfit > 0,
            healthLevel: getHealthLevel(margin)
        };
    }

    /**
     * Calculate marketplace fees with bundle support
     */
    function calculateMarketplaceFees(price, options = {}) {
        const fees = getPlatformFees(options);
        const voucherAmount = options.voucherAmount || 0;
        const itemCount = options.itemCount || 1;
        const allocationMode = options.allocationMode || FEE_ALLOCATION_MODES.TOTAL_BASED;

        const feeBase = Math.max(0, price - voucherAmount);
        const adminFee = feeBase * (fees.adminRate / 100);

        let serviceFee = 0;
        if (fees.freeShipEnabled) {
            serviceFee = Math.min(feeBase * (fees.serviceRate / 100), fees.serviceCap);
        }

        let cashbackFee = 0;
        if (fees.cashbackEnabled) {
            cashbackFee = Math.min(feeBase * (fees.cashbackRate / 100), fees.cashbackCap);
        }

        const processFee = allocationMode === FEE_ALLOCATION_MODES.PER_ITEM
            ? fees.processFee * itemCount
            : fees.processFee;

        const fixedFee = fees.fixedFee;
        const totalFees = adminFee + serviceFee + cashbackFee + processFee + fixedFee;
        const percentBasedFees = adminFee + serviceFee + cashbackFee;
        const fixedBasedFees = processFee + fixedFee;

        return {
            feeBase, adminFee, serviceFee, cashbackFee, processFee, fixedFee,
            totalFees, percentBasedFees, fixedBasedFees,
            adminRate: fees.adminRate,
            serviceRate: fees.freeShipEnabled ? fees.serviceRate : 0,
            cashbackRate: fees.cashbackEnabled ? fees.cashbackRate : 0,
            effectiveFeePercent: feeBase > 0
                ? ((adminFee + serviceFee + cashbackFee) / feeBase) * 100
                : fees.adminRate + (fees.freeShipEnabled ? fees.serviceRate : 0)
        };
    }

    /**
     * Calculate profit for a single product
     */
    function calculateSingleProduct(product, options = {}) {
        const price = parseNum(product.price);
        const hpp = parseNum(product.hpp);
        const qty = parseInt(product.qty) || 1;
        const discountPercent = parseNum(product.discount) || 0;
        const voucherAmount = parseNum(options.voucherAmount) || 0;

        const discountedPrice = price * (1 - discountPercent / 100);
        const totalSellingPrice = discountedPrice * qty;
        const totalHPP = hpp * qty;

        const feeResult = calculateMarketplaceFees(totalSellingPrice, {
            ...options,
            voucherAmount,
            itemCount: qty
        });

        const netCash = totalSellingPrice - feeResult.totalFees - voucherAmount;
        const netProfit = netCash - totalHPP;
        const margin = totalSellingPrice > 0 ? (netProfit / totalSellingPrice) * 100 : 0;

        return {
            price, discountedPrice, hpp, qty,
            totalSellingPrice, totalHPP, voucherAmount,
            ...feeResult,
            netCash, netProfit, margin,
            marginStatus: getMarginStatus(netProfit, margin)
        };
    }

    /**
     * Calculate optimal selling price for target profit/margin
     */
    function calculateOptimalPrice(params) {
        const {
            hpp = 0,
            targetType = 'margin',
            targetValue = 0,
            targetProfitType = 'rupiah',
            totalFeePercent = 0,
            fixedCosts = 0
        } = params;

        const effectiveHpp = hpp + fixedCosts;
        let sellingPrice = 0;
        let profit = 0;
        let margin = 0;
        let isValid = true;

        if (targetType === 'margin') {
            if ((targetValue + totalFeePercent) >= 100) {
                return {
                    sellingPrice: 0, profit: 0, margin: 0, isValid: false,
                    errorMessage: 'Target margin + fee melebihi 100%, tidak mungkin tercapai'
                };
            }

            const denominator = 1 - (targetValue / 100) - (totalFeePercent / 100);
            if (denominator > 0) {
                sellingPrice = Math.ceil(effectiveHpp / denominator);
                profit = sellingPrice - effectiveHpp - (sellingPrice * totalFeePercent / 100);
                margin = (profit / sellingPrice) * 100;
            }
        } else {
            let targetProfitAmount = targetProfitType === 'rupiah'
                ? targetValue
                : effectiveHpp * (targetValue / 100);

            const denominator = 1 - (totalFeePercent / 100);
            if (denominator > 0) {
                sellingPrice = Math.ceil((effectiveHpp + targetProfitAmount) / denominator);
                profit = sellingPrice - effectiveHpp - (sellingPrice * totalFeePercent / 100);
                margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
            }
        }

        return { sellingPrice, profit, margin, isValid, effectiveHpp };
    }

    // ==================== ROAS CALCULATIONS ====================

    /**
     * Calculate ROAS metrics
     */
    function calculateROAS(params) {
        const { sellingPrice = 0, netProfit = 0, conversionRate = 2 } = params;

        let roasBE = 0, acosMax = 0, maxCPC = 0;

        if (netProfit > 0 && sellingPrice > 0) {
            roasBE = sellingPrice / netProfit;
            acosMax = (netProfit / sellingPrice) * 100;
            maxCPC = netProfit * (conversionRate / 100);
        }

        return { roasBE, acosMax, maxCPC, conversionRate };
    }

    /**
     * Analyze ad performance
     */
    function analyzeAdPerformance(params) {
        const { adSpend = 0, revenue = 0, clicks = 0, estimatedMargin = 0.20 } = params;

        const cpc = clicks > 0 ? adSpend / clicks : 0;
        const acos = revenue > 0 ? (adSpend / revenue) * 100 : 0;
        const roas = adSpend > 0 ? revenue / adSpend : 0;

        const grossProfit = revenue * estimatedMargin;
        const profitAfterAds = grossProfit - adSpend;
        const marginAfterAds = revenue > 0 ? (profitAfterAds / revenue) * 100 : 0;
        const breakEvenRoas = 1 / estimatedMargin;

        let status = 'unknown';
        let recommendation = '';

        if (adSpend > 0 && revenue > 0) {
            if (roas >= breakEvenRoas * 1.5) {
                status = 'excellent';
                recommendation = `ROAS ${roas.toFixed(2)}x sangat baik! Pertimbangkan scale up budget.`;
            } else if (roas >= breakEvenRoas) {
                status = 'good';
                recommendation = `Iklan profitable! Margin bersih ${marginAfterAds.toFixed(1)}%.`;
            } else if (roas >= breakEvenRoas * 0.6) {
                status = 'warning';
                recommendation = `ROAS mendekati impas. Perlu optimasi untuk profit lebih baik.`;
            } else {
                status = 'danger';
                recommendation = `ROAS terlalu rendah! Target minimal ${breakEvenRoas.toFixed(1)}x untuk impas.`;
            }
        }

        return {
            cpc, acos, roas, grossProfit, profitAfterAds,
            marginAfterAds, breakEvenRoas, status, recommendation
        };
    }

    // ==================== BUNDLE CALCULATIONS ====================

    /**
     * Calculate bundle profit with per-product breakdown
     */
    function calculateBundle(bundlePrice, products, options = {}) {
        const price = parseNum(bundlePrice);
        const voucherAmount = parseNum(options.voucherAmount) || 0;
        const allocationMode = options.allocationMode || FEE_ALLOCATION_MODES.TOTAL_BASED;

        if (!products || products.length === 0) {
            return createEmptyBundleResult();
        }

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
                hpp, qty,
                individualPrice: parseNum(p.price) || hpp * 2,
                hppTotal: hpp * qty
            };
        });

        const feeResult = calculateMarketplaceFees(price, {
            ...options,
            voucherAmount,
            itemCount: totalItems,
            allocationMode,
            freeShipEnabled: true,
            cashbackEnabled: true
        });

        const netCash = price - feeResult.totalFees - voucherAmount;
        const netProfit = netCash - totalHPP;
        const margin = price > 0 ? (netProfit / price) * 100 : 0;

        const productBreakdown = allocateBundleFees(
            feeResult, normalizedProducts, totalHPP, netProfit, allocationMode, options
        );

        const individualResult = calculateIndividualProfit(normalizedProducts, options);

        return {
            bundlePrice: price, totalHPP, totalItems,
            productCount: products.length, voucherAmount,
            adminFee: feeResult.adminFee, serviceFee: feeResult.serviceFee,
            cashbackFee: feeResult.cashbackFee, processFee: feeResult.processFee,
            fixedFee: feeResult.fixedFee, totalFees: feeResult.totalFees,
            netCash, netProfit, margin,
            marginStatus: getMarginStatus(netProfit, margin),
            products: productBreakdown,
            individualProfit: individualResult.totalProfit,
            profitDifference: netProfit - individualResult.totalProfit,
            profitDifferencePercent: individualResult.totalProfit !== 0
                ? ((netProfit - individualResult.totalProfit) / Math.abs(individualResult.totalProfit)) * 100
                : 0,
            isBundleBetter: netProfit > individualResult.totalProfit,
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
     */
    function allocateBundleFees(feeResult, products, totalHPP, totalNetProfit, mode, options = {}) {
        const fees = getPlatformFees(options);

        return products.map(product => {
            const hppRatio = totalHPP > 0 ? product.hppTotal / totalHPP : 1 / products.length;

            let allocatedFee = 0;
            let allocatedProfit = 0;

            switch (mode) {
                case FEE_ALLOCATION_MODES.PER_ITEM:
                    const productProcessFee = fees.processFee * product.qty;
                    const productPercentFee = hppRatio * feeResult.percentBasedFees;
                    allocatedFee = productProcessFee + productPercentFee + (hppRatio * fees.fixedFee);
                    allocatedProfit = hppRatio * totalNetProfit;
                    break;

                case FEE_ALLOCATION_MODES.PROPORTIONAL:
                case FEE_ALLOCATION_MODES.TOTAL_BASED:
                default:
                    allocatedFee = hppRatio * feeResult.totalFees;
                    allocatedProfit = hppRatio * totalNetProfit;
                    break;
            }

            const productPriceShare = hppRatio * feeResult.feeBase;
            const productMargin = productPriceShare > 0 ? (allocatedProfit / productPriceShare) * 100 : 0;

            return {
                ...product,
                allocatedFee: Math.round(allocatedFee),
                allocatedProfit: Math.round(allocatedProfit),
                profitShare: totalNetProfit !== 0 ? (allocatedProfit / totalNetProfit) * 100 : 0,
                margin: productMargin,
                marginStatus: getMarginStatus(allocatedProfit, productMargin),
                hppRatio: hppRatio * 100
            };
        });
    }

    /**
     * Calculate profit if products sold individually
     */
    function calculateIndividualProfit(products, options = {}) {
        let totalProfit = 0;
        const details = [];

        products.forEach(p => {
            const price = p.individualPrice || (p.hpp * 2);
            const result = calculateSingleProduct({ price, hpp: p.hpp, qty: p.qty }, options);
            totalProfit += result.netProfit;
            details.push({ name: p.name, profit: result.netProfit, margin: result.margin });
        });

        return { totalProfit, details };
    }

    /**
     * Create empty bundle result
     */
    function createEmptyBundleResult() {
        return {
            bundlePrice: 0, totalHPP: 0, totalItems: 0, productCount: 0, voucherAmount: 0,
            adminFee: 0, serviceFee: 0, cashbackFee: 0, processFee: 0, fixedFee: 0, totalFees: 0,
            netCash: 0, netProfit: 0, margin: 0, marginStatus: 'danger',
            products: [], individualProfit: 0, profitDifference: 0, profitDifferencePercent: 0,
            isBundleBetter: false, allocationMode: FEE_ALLOCATION_MODES.TOTAL_BASED
        };
    }

    // ==================== BUNDLE PRICE FINDER ====================

    /**
     * Find minimum bundle price to achieve target profit
     */
    function findBundlePrice(products, targetConfig, options = {}) {
        const fees = getPlatformFees({
            ...options,
            freeShipEnabled: true,
            cashbackEnabled: true
        });

        let totalHPP = 0;
        let totalItems = 0;
        products.forEach(p => {
            const hpp = parseNum(p.hpp);
            const qty = parseInt(p.qty) || 1;
            totalHPP += hpp * qty;
            totalItems += qty;
        });

        if (totalHPP === 0) {
            return { minPrice: 0, suggestedPrices: [], targetProfit: 0, isValid: false, error: 'Total HPP is zero' };
        }

        let targetProfitAmount = targetConfig.type === 'percent'
            ? totalHPP * (targetConfig.value / 100)
            : parseNum(targetConfig.value);

        let totalFeePercent = fees.adminRate;
        if (fees.freeShipEnabled) totalFeePercent += fees.serviceRate;
        if (fees.cashbackEnabled) totalFeePercent += fees.cashbackRate;

        const allocationMode = options.allocationMode || FEE_ALLOCATION_MODES.TOTAL_BASED;
        const fixedCosts = allocationMode === FEE_ALLOCATION_MODES.PER_ITEM
            ? fees.processFee * totalItems
            : fees.processFee;

        const denominator = 1 - (totalFeePercent / 100);

        if (denominator <= 0) {
            return { minPrice: 0, suggestedPrices: [], targetProfit: targetProfitAmount, isValid: false, error: 'Fee percentage too high (>= 100%)' };
        }

        const minPrice = Math.ceil((targetProfitAmount + totalHPP + fixedCosts) / denominator);
        const suggestedPrices = generatePsychologicalPrices(minPrice);
        const verifyResult = calculateBundle(minPrice, products, options);

        return {
            minPrice, suggestedPrices,
            targetProfit: targetProfitAmount, targetType: targetConfig.type,
            actualProfit: verifyResult.netProfit, actualMargin: verifyResult.margin,
            totalHPP, totalItems, feePercent: totalFeePercent, fixedCosts, isValid: true
        };
    }

    /**
     * Generate psychological price suggestions
     */
    function generatePsychologicalPrices(basePrice) {
        const suggestions = [];
        const rounded = Math.ceil(basePrice / 1000) * 1000;

        const nine = Math.ceil(basePrice / 10000) * 10000 - 1000;
        if (nine >= basePrice) {
            suggestions.push({ price: nine, label: 'Harga Psikologis', pattern: 'xx9.000' });
        }

        const nice = Math.ceil(basePrice / 50000) * 50000;
        if (nice >= basePrice && !suggestions.find(s => s.price === nice)) {
            suggestions.push({ price: nice, label: 'Harga Bulat', pattern: 'xx0.000' });
        }

        const nextNine = nine + 10000;
        if (nextNine >= basePrice && !suggestions.find(s => s.price === nextNine)) {
            suggestions.push({ price: nextNine, label: 'Alternatif', pattern: 'xx9.000' });
        }

        if (rounded >= basePrice && !suggestions.find(s => s.price === rounded)) {
            suggestions.push({ price: rounded, label: 'Harga Minimum', pattern: 'Minimum' });
        }

        suggestions.sort((a, b) => a.price - b.price);
        return suggestions.slice(0, 4);
    }

    // ==================== BUSINESS INSIGHTS ====================

    /**
     * Generate business insights from bundle calculation
     */
    function generateBusinessInsights(bundleResult) {
        const insights = [];

        if (!bundleResult || !bundleResult.products) return insights;

        const { netProfit, margin, products, bundlePrice } = bundleResult;

        // 1. Loss Warning
        if (netProfit < 0) {
            insights.push({
                type: 'LOSS_WARNING', severity: 'danger', icon: 'exclamation-triangle',
                message: `Bundle ini mengalami RUGI ${formatRp(Math.abs(netProfit))}!`,
                action: 'Naikkan harga bundle atau kurangi produk'
            });
        }

        // 2. Low Margin Warning
        if (netProfit >= 0 && margin < MARGIN_THRESHOLDS.WARNING) {
            insights.push({
                type: 'LOW_MARGIN', severity: 'warning', icon: 'exclamation-circle',
                message: `Margin bundle tipis (${margin.toFixed(1)}%). Risiko rugi tinggi jika ada diskon/promo.`,
                action: 'Pertimbangkan naikkan harga 5-10%'
            });
        }

        // 3. Subsidy Detection
        const lossMakingProducts = products.filter(p => p.allocatedProfit < 0);
        const profitableProducts = products.filter(p => p.allocatedProfit > 0);

        if (lossMakingProducts.length > 0 && netProfit > 0) {
            const subsidizers = profitableProducts.map(p => p.name).join(', ');
            const subsidized = lossMakingProducts.map(p => `${p.name} (rugi ${formatRp(Math.abs(p.allocatedProfit))})`).join(', ');

            insights.push({
                type: 'SUBSIDY_WARNING', severity: 'warning', icon: 'balance-scale',
                message: `Produk berikut mengalami rugi: ${subsidized}`,
                detail: `Disubsidi oleh: ${subsidizers}`,
                action: 'Evaluasi komposisi bundle'
            });
        }

        // 4. Profit Contributor
        const topContributor = products.filter(p => p.allocatedProfit > 0).sort((a, b) => b.profitShare - a.profitShare)[0];
        if (topContributor && topContributor.profitShare > 50) {
            insights.push({
                type: 'PROFIT_CONTRIBUTOR', severity: 'info', icon: 'star',
                message: `Produk "${topContributor.name}" menyumbang ${topContributor.profitShare.toFixed(0)}% profit bundle`,
                detail: `Profit: ${formatRp(topContributor.allocatedProfit)}`
            });
        }

        // 5. Discount Limit
        if (netProfit > 0 && bundlePrice > 0) {
            const maxDiscount = (netProfit / bundlePrice) * 100;
            insights.push({
                type: 'DISCOUNT_LIMIT', severity: maxDiscount < 5 ? 'warning' : 'info', icon: 'tag',
                message: `Maksimal diskon bundle: ${maxDiscount.toFixed(1)}% (${formatRp(netProfit)})`,
                detail: 'Diskon melebihi ini akan menyebabkan rugi'
            });
        }

        // 6. Optimization Tips
        if (lossMakingProducts.length > 0 && products.length > 2) {
            const worstProduct = lossMakingProducts.sort((a, b) => a.allocatedProfit - b.allocatedProfit)[0];
            insights.push({
                type: 'OPTIMIZATION_TIP', severity: 'info', icon: 'lightbulb',
                message: `Pertimbangkan menghapus atau mengganti "${worstProduct.name}"`,
                detail: `Rugi: ${formatRp(Math.abs(worstProduct.allocatedProfit))} per bundle`,
                action: 'Ganti dengan produk margin lebih tinggi'
            });
        }

        return insights;
    }

    // ==================== PUBLIC API ====================

    return {
        // Constants
        FEE_ALLOCATION_MODES,
        MARGIN_THRESHOLDS,

        // Single product calculations
        calculateFees,
        calculateMarketplaceFees,
        calculateSingleProduct,
        calculateOptimalPrice,

        // ROAS calculations
        calculateROAS,
        analyzeAdPerformance,

        // Bundle calculations
        calculateBundle,
        allocateBundleFees,
        findBundlePrice,
        generatePsychologicalPrices,

        // Business insights
        generateBusinessInsights,
        getMarginStatus,
        getHealthLevel,

        // Helpers
        getPlatformFees,
        getAdminRate,
        parseNum
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.PricingEngine = PricingEngine;
}
