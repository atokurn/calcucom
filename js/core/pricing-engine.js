/**
 * PricingEngine - Core calculation engine for marketplace profit calculations
 * Encapsulates all fee calculation logic for Shopee, Tokopedia, TikTok, and Lazada
 */
const PricingEngine = (function () {
    'use strict';

    // ==================== PLATFORM FEE STRUCTURES ====================

    /**
     * Calculate marketplace fees based on platform and configuration
     * @param {Object} params - Calculation parameters
     * @returns {Object} Fee breakdown and totals
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

        // Calculate display price (after discount)
        const displayPrice = sellingPrice - (sellingPrice * discountPercent / 100);

        // Basis for fee calculation (display price minus voucher)
        const basis = Math.max(0, displayPrice - voucherAmount);

        // Get admin rate from platform rates
        const adminRate = getAdminRate(platform, sellerType, categoryGroup);
        const adminFee = basis * (adminRate / 100);

        // Service fees
        let freeShipFee = 0;
        let cashbackFee = 0;

        if (isFreeShip) {
            freeShipFee = Math.min(basis * 0.04, 40000); // 4% capped at 40k
        }
        if (isCashback) {
            cashbackFee = basis * 0.045; // 4.5%
        }

        const serviceFee = freeShipFee + cashbackFee;

        // Affiliate fee
        const affiliateFee = basis * (affiliatePercent / 100);

        // Fixed fees
        const totalFixedFees = orderProcessFee + fixedFee + operationalCost + adsCost;

        // Custom costs
        let customDeductions = 0;
        let customAdditions = 0;
        customCosts.forEach(cost => {
            const amount = cost.isPercent
                ? basis * (cost.amount / 100)
                : cost.amount;

            if (cost.category === 'deduction') {
                customDeductions += amount;
            } else {
                customAdditions += amount;
            }
        });

        // Total deductions
        const totalDeductions = adminFee + serviceFee + affiliateFee + customDeductions;

        // Net income (amount seller receives)
        const netIncome = basis - totalDeductions;

        // Total cost (HPP + fixed fees + custom additions)
        const totalCost = hpp + totalFixedFees + customAdditions;

        // Net profit
        const netProfit = netIncome - totalCost;

        // Margin percentage
        const margin = basis > 0 ? (netProfit / basis) * 100 : 0;

        return {
            // Input values
            sellingPrice,
            displayPrice,
            basis,
            hpp,

            // Fee breakdown
            adminRate,
            adminFee,
            serviceFee,
            freeShipFee,
            cashbackFee,
            affiliateFee,
            orderProcessFee,
            fixedFee,
            operationalCost,
            adsCost,
            customDeductions,
            customAdditions,

            // Totals
            totalDeductions,
            totalFixedFees,
            totalCost,
            netIncome,
            netProfit,
            margin,

            // Health indicators
            isHealthy: netProfit > 0,
            healthLevel: getHealthLevel(margin)
        };
    }

    /**
     * Calculate optimal selling price to achieve target profit/margin
     * @param {Object} params - Calculation parameters
     * @returns {Object} Optimal price and breakdown
     */
    function calculateOptimalPrice(params) {
        const {
            hpp = 0,
            targetType = 'margin', // 'margin' or 'profit'
            targetValue = 0,
            targetProfitType = 'rupiah', // 'rupiah' or 'percent'
            totalFeePercent = 0,
            fixedCosts = 0
        } = params;

        const effectiveHpp = hpp + fixedCosts;
        let sellingPrice = 0;
        let profit = 0;
        let margin = 0;
        let isValid = true;

        if (targetType === 'margin') {
            // Check for impossible target
            if ((targetValue + totalFeePercent) >= 100) {
                return {
                    sellingPrice: 0,
                    profit: 0,
                    margin: 0,
                    isValid: false,
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
            // Profit target
            let targetProfitAmount = 0;
            if (targetProfitType === 'rupiah') {
                targetProfitAmount = targetValue;
            } else {
                targetProfitAmount = effectiveHpp * (targetValue / 100);
            }

            const denominator = 1 - (totalFeePercent / 100);
            if (denominator > 0) {
                sellingPrice = Math.ceil((effectiveHpp + targetProfitAmount) / denominator);
                profit = sellingPrice - effectiveHpp - (sellingPrice * totalFeePercent / 100);
                margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
            }
        }

        return {
            sellingPrice,
            profit,
            margin,
            isValid,
            effectiveHpp
        };
    }

    /**
     * Calculate ROAS (Return on Ad Spend) metrics
     * @param {Object} params - ROAS parameters
     * @returns {Object} ROAS metrics
     */
    function calculateROAS(params) {
        const {
            sellingPrice = 0,
            netProfit = 0,
            conversionRate = 2 // Default 2%
        } = params;

        let roasBE = 0;
        let acosMax = 0;
        let maxCPC = 0;

        if (netProfit > 0 && sellingPrice > 0) {
            roasBE = sellingPrice / netProfit;
            acosMax = (netProfit / sellingPrice) * 100;
            maxCPC = netProfit * (conversionRate / 100);
        }

        return {
            roasBE,
            acosMax,
            maxCPC,
            conversionRate
        };
    }

    /**
     * Analyze ad performance
     * @param {Object} params - Ad performance data
     * @returns {Object} Analysis results
     */
    function analyzeAdPerformance(params) {
        const {
            adSpend = 0,
            revenue = 0,
            clicks = 0,
            estimatedMargin = 0.20 // 20% default
        } = params;

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
            cpc,
            acos,
            roas,
            grossProfit,
            profitAfterAds,
            marginAfterAds,
            breakEvenRoas,
            status,
            recommendation
        };
    }

    // ==================== HELPER FUNCTIONS ====================

    /**
     * Get admin rate based on platform, seller type, and category
     */
    function getAdminRate(platform, sellerType, categoryGroup) {
        // Reference global rate objects if available
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
     * Determine health level based on margin
     */
    function getHealthLevel(margin) {
        if (margin >= 25) return 'excellent';
        if (margin >= 15) return 'good';
        if (margin >= 5) return 'fair';
        if (margin >= 0) return 'low';
        return 'negative';
    }

    // ==================== PUBLIC API ====================

    return {
        calculateFees,
        calculateOptimalPrice,
        calculateROAS,
        analyzeAdPerformance,
        getAdminRate,
        getHealthLevel
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.PricingEngine = PricingEngine;
}
