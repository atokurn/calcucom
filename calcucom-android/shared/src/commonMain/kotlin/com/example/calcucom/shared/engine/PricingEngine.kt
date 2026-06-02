package com.example.calcucom.shared.engine

import com.example.calcucom.shared.constants.AppConstants
import com.example.calcucom.shared.model.*
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.round

object PricingEngine {

    fun getAdminRate(platform: String, sellerType: String, categoryGroup: String): Double {
        return when (platform.lowercase()) {
            "shopee" -> AppConstants.shopeeRates[sellerType.lowercase()]?.get(categoryGroup.uppercase()) ?: 8.0
            "tokopedia" -> {
                val type = when (sellerType.lowercase()) {
                    "star", "power" -> "power"
                    "mall" -> "mall"
                    else -> "regular"
                }
                AppConstants.tokopediaRates[type]?.get(categoryGroup.uppercase()) ?: 7.5
            }
            "tiktok" -> {
                val type = if (sellerType.lowercase() == "mall") "mall" else "regular"
                AppConstants.tiktokRates[type]?.get(categoryGroup.uppercase()) ?: 7.5
            }
            "lazada" -> {
                val type = if (sellerType.lowercase() == "mall") "mall" else "regular"
                AppConstants.lazadaRates[type]?.get(categoryGroup.uppercase()) ?: 6.0
            }
            else -> 0.0
        }
    }

    fun calculateFees(
        platform: String = "shopee",
        sellerType: String = "nonstar",
        categoryGroup: String = "A",
        sellingPrice: Double = 0.0,
        discountPercent: Double = 0.0,
        voucherAmount: Double = 0.0,
        hpp: Double = 0.0,
        isFreeShip: Boolean = false,
        isCashback: Boolean = false,
        affiliatePercent: Double = 0.0,
        orderProcessFee: Double = 0.0,
        fixedFee: Double = 0.0,
        operationalCost: Double = 0.0,
        adsCost: Double = 0.0,
        customCosts: List<CustomCost> = emptyList()
    ): FeeResult {
        val displayPrice = sellingPrice - (sellingPrice * discountPercent / 100.0)
        val basis = maxOf(0.0, displayPrice - voucherAmount)

        val adminRate = getAdminRate(platform, sellerType, categoryGroup)
        val adminFee = basis * (adminRate / 100.0)

        var freeShipFee = 0.0
        var cashbackFee = 0.0

        if (isFreeShip) {
            val freeShipCap = if (platform.lowercase() == "lazada") 50000.0 else 40000.0
            val rate = if (platform.lowercase() == "lazada") 5.0 else 4.0
            freeShipFee = minOf(basis * (rate / 100.0), freeShipCap)
        }
        if (isCashback && platform.lowercase() == "shopee") {
            cashbackFee = minOf(basis * 0.045, 60000.0)
        }

        val serviceFee = freeShipFee + cashbackFee
        val affiliateFee = basis * (affiliatePercent / 100.0)
        val totalFixedFees = orderProcessFee + fixedFee + operationalCost + adsCost

        var customDeductions = 0.0
        var customAdditions = 0.0
        customCosts.forEach { cost ->
            val amount = if (cost.isPercent) basis * (cost.amount / 100.0) else cost.amount
            if (cost.category.lowercase() in listOf("deduction", "potongan")) {
                customDeductions += amount
            } else {
                customAdditions += amount
            }
        }

        val marketplaceDeductions = adminFee + serviceFee + affiliateFee + orderProcessFee + fixedFee
        val totalDeductions = marketplaceDeductions + customDeductions
        val netIncome = basis - totalDeductions
        val totalCost = hpp + operationalCost + adsCost + customAdditions
        val netProfit = netIncome - totalCost
        val margin = if (basis > 0.0) (netProfit / basis) * 100.0 else 0.0

        return FeeResult(
            platform = platform,
            sellingPrice = sellingPrice,
            displayPrice = displayPrice,
            basis = basis,
            hpp = hpp,
            adminRate = adminRate,
            adminFee = adminFee,
            serviceFee = serviceFee,
            freeShipFee = freeShipFee,
            cashbackFee = cashbackFee,
            affiliateFee = affiliateFee,
            orderProcessFee = orderProcessFee,
            fixedFee = fixedFee,
            operationalCost = operationalCost,
            adsCost = adsCost,
            customDeductions = customDeductions,
            customAdditions = customAdditions,
            marketplaceDeductions = marketplaceDeductions,
            totalDeductions = totalDeductions,
            totalFixedFees = totalFixedFees,
            totalCost = totalCost,
            netIncome = netIncome,
            netProfit = netProfit,
            margin = margin,
            isHealthy = netProfit > 0.0,
            healthLevel = getHealthLevel(margin)
        )
    }

    private fun getHealthLevel(margin: Double): String {
        return when {
            margin >= 25.0 -> "excellent"
            margin >= 15.0 -> "good"
            margin >= 5.0 -> "fair"
            margin >= 0.0 -> "low"
            else -> "negative"
        }
    }

    fun getMarginStatus(profit: Double, margin: Double): String {
        return when {
            profit < 0.0 -> "danger"
            margin < 5.0 -> "warning"
            else -> "healthy"
        }
    }

    fun calculateOptimalPrice(
        hpp: Double,
        targetType: String = "margin", // "margin" or "profit"
        targetValue: Double = 0.0,
        targetProfitType: String = "rupiah", // "rupiah" or "percent"
        totalFeePercent: Double = 0.0,
        fixedCosts: Double = 0.0
    ): Map<String, Any> {
        val effectiveHpp = hpp + fixedCosts
        var sellingPrice = 0.0
        var profit = 0.0
        var margin = 0.0
        var isValid = true
        var errorMessage = ""

        if (targetType.lowercase() == "margin") {
            if ((targetValue + totalFeePercent) >= 100.0) {
                return mapOf(
                    "sellingPrice" to 0.0, "profit" to 0.0, "margin" to 0.0, "isValid" to false,
                    "errorMessage" to "Target margin + fee melebihi 100%, tidak mungkin tercapai",
                    "effectiveHpp" to effectiveHpp
                )
            }
            val denominator = 1.0 - (targetValue / 100.0) - (totalFeePercent / 100.0)
            if (denominator > 0.0) {
                sellingPrice = ceil(effectiveHpp / denominator)
                profit = sellingPrice - effectiveHpp - (sellingPrice * totalFeePercent / 100.0)
                margin = (profit / sellingPrice) * 100.0
            }
        } else {
            val targetProfitAmount = if (targetProfitType.lowercase() == "rupiah") {
                targetValue
            } else {
                effectiveHpp * (targetValue / 100.0)
            }
            val denominator = 1.0 - (totalFeePercent / 100.0)
            if (denominator > 0.0) {
                sellingPrice = ceil((effectiveHpp + targetProfitAmount) / denominator)
                profit = sellingPrice - effectiveHpp - (sellingPrice * totalFeePercent / 100.0)
                margin = if (sellingPrice > 0.0) (profit / sellingPrice) * 100.0 else 0.0
            } else {
                isValid = false
                errorMessage = "Total fee percent >= 100%, tidak mungkin tercapai"
            }
        }

        return mapOf(
            "sellingPrice" to sellingPrice,
            "profit" to profit,
            "margin" to margin,
            "isValid" to isValid,
            "errorMessage" to errorMessage,
            "effectiveHpp" to effectiveHpp
        )
    }

    fun calculateROAS(sellingPrice: Double, netProfit: Double, conversionRate: Double): RoasResult {
        var roasBE = 0.0
        var acosMax = 0.0
        var maxCPC = 0.0

        if (netProfit > 0.0 && sellingPrice > 0.0) {
            roasBE = sellingPrice / netProfit
            acosMax = (netProfit / sellingPrice) * 100.0
            maxCPC = netProfit * (conversionRate / 100.0)
        }

        return RoasResult(roasBE, acosMax, maxCPC, conversionRate)
    }

    fun analyzeAdPerformance(adSpend: Double, revenue: Double, clicks: Int, estimatedMargin: Double): AdPerformanceResult {
        val cpc = if (clicks > 0) adSpend / clicks else 0.0
        val acos = if (revenue > 0.0) (adSpend / revenue) * 100.0 else 0.0
        val roas = if (adSpend > 0.0) revenue / adSpend else 0.0

        val grossProfit = revenue * estimatedMargin
        val profitAfterAds = grossProfit - adSpend
        val marginAfterAds = if (revenue > 0.0) (profitAfterAds / revenue) * 100.0 else 0.0
        val breakEvenRoas = if (estimatedMargin > 0.0) 1.0 / estimatedMargin else 0.0

        var status = "unknown"
        var recommendation = ""

        if (adSpend > 0.0 && revenue > 0.0) {
            when {
                roas >= breakEvenRoas * 1.5 -> {
                    status = "excellent"
                    recommendation = "ROAS ${formatDouble(roas)}x sangat baik! Pertimbangkan scale up budget."
                }
                roas >= breakEvenRoas -> {
                    status = "good"
                    recommendation = "Iklan profitable! Margin bersih ${formatDouble(marginAfterAds)}%."
                }
                roas >= breakEvenRoas * 0.6 -> {
                    status = "warning"
                    recommendation = "ROAS mendekati impas. Perlu optimasi untuk profit lebih baik."
                }
                else -> {
                    status = "danger"
                    recommendation = "ROAS terlalu rendah! Target minimal ${formatDouble(breakEvenRoas)}x untuk impas."
                }
            }
        }

        return AdPerformanceResult(cpc, acos, roas, grossProfit, profitAfterAds, marginAfterAds, breakEvenRoas, status, recommendation)
    }

    fun calculateBundle(
        bundlePrice: Double,
        products: List<Product>,
        platform: String = "shopee",
        sellerType: String = "nonstar",
        categoryGroup: String = "A",
        voucherAmount: Double = 0.0,
        freeShipEnabled: Boolean = true,
        cashbackEnabled: Boolean = true,
        allocationMode: String = "total"
    ): BundleResult {
        if (products.isEmpty()) {
            return createEmptyBundleResult(allocationMode)
        }

        var totalHPP = 0.0
        var totalItems = 0
        products.forEach { p ->
            totalHPP += p.hpp * p.qty
            totalItems += p.qty
        }

        // Calculate marketplace fees for bundle
        val feeBase = maxOf(0.0, bundlePrice - voucherAmount)
        val adminRate = getAdminRate(platform, sellerType, categoryGroup)
        val adminFee = feeBase * (adminRate / 100.0)

        var serviceRate = 0.0
        var serviceFee = 0.0
        if (freeShipEnabled) {
            serviceRate = if (platform.lowercase() == "lazada") 5.0 else 4.0
            val cap = if (platform.lowercase() == "lazada") 50000.0 else 40000.0
            serviceFee = minOf(feeBase * (serviceRate / 100.0), cap)
        }

        var cashbackRate = 0.0
        var cashbackFee = 0.0
        if (cashbackEnabled && platform.lowercase() == "shopee") {
            cashbackRate = 4.5
            cashbackFee = minOf(feeBase * 0.045, 60000.0)
        }

        val baseProcessFee = if (platform.lowercase() == "lazada") 1000.0 else 1250.0
        val processFee = if (allocationMode.lowercase() == "peritem") {
            baseProcessFee * totalItems
        } else {
            baseProcessFee
        }

        val fixedFee = 0.0
        val totalFees = adminFee + serviceFee + cashbackFee + processFee + fixedFee

        val netCash = bundlePrice - totalFees - voucherAmount
        val netProfit = netCash - totalHPP
        val margin = if (bundlePrice > 0.0) (netProfit / bundlePrice) * 100.0 else 0.0

        // Allocate fees to products
        val productBreakdowns = products.mapIndexed { index, product ->
            val productHppTotal = product.hpp * product.qty
            val hppRatio = if (totalHPP > 0.0) productHppTotal / totalHPP else 1.0 / products.size

            val allocatedFee = hppRatio * totalFees
            val allocatedProfit = hppRatio * netProfit
            val profitShare = if (netProfit != 0.0) (allocatedProfit / netProfit) * 100.0 else 0.0
            val productPriceShare = hppRatio * feeBase
            val productMargin = if (productPriceShare > 0.0) (allocatedProfit / productPriceShare) * 100.0 else 0.0

            BundleProductBreakdown(
                product = product,
                allocatedFee = round(allocatedFee),
                allocatedProfit = round(allocatedProfit),
                profitShare = profitShare,
                margin = productMargin,
                marginStatus = getMarginStatus(allocatedProfit, productMargin),
                hppRatio = hppRatio * 100.0
            )
        }

        // Calculate individual profits if sold separately
        var totalIndividualProfit = 0.0
        products.forEach { p ->
            val individualPrice = p.price
            val feeResult = calculateFees(
                platform = platform,
                sellerType = sellerType,
                categoryGroup = categoryGroup,
                sellingPrice = individualPrice,
                discountPercent = p.discountPercent,
                hpp = p.hpp,
                isFreeShip = freeShipEnabled,
                isCashback = cashbackEnabled,
                orderProcessFee = baseProcessFee
            )
            totalIndividualProfit += feeResult.netProfit * p.qty
        }

        val profitDiff = netProfit - totalIndividualProfit
        val profitDiffPercent = if (totalIndividualProfit != 0.0) {
            (profitDiff / abs(totalIndividualProfit)) * 100.0
        } else {
            0.0
        }

        return BundleResult(
            bundlePrice = bundlePrice,
            totalHPP = totalHPP,
            totalItems = totalItems,
            productCount = products.size,
            voucherAmount = voucherAmount,
            adminFee = adminFee,
            serviceFee = serviceFee,
            cashbackFee = cashbackFee,
            processFee = processFee,
            fixedFee = fixedFee,
            totalFees = totalFees,
            netCash = netCash,
            netProfit = netProfit,
            margin = margin,
            marginStatus = getMarginStatus(netProfit, margin),
            products = productBreakdowns,
            individualProfit = totalIndividualProfit,
            profitDifference = profitDiff,
            profitDifferencePercent = profitDiffPercent,
            isBundleBetter = netProfit > totalIndividualProfit,
            allocationMode = allocationMode,
            adminRate = adminRate,
            serviceRate = serviceRate,
            cashbackRate = cashbackRate
        )
    }

    private fun createEmptyBundleResult(allocationMode: String): BundleResult {
        return BundleResult(
            bundlePrice = 0.0, totalHPP = 0.0, totalItems = 0, productCount = 0, voucherAmount = 0.0,
            adminFee = 0.0, serviceFee = 0.0, cashbackFee = 0.0, processFee = 0.0, fixedFee = 0.0, totalFees = 0.0,
            netCash = 0.0, netProfit = 0.0, margin = 0.0, marginStatus = "danger",
            products = emptyList(), individualProfit = 0.0, profitDifference = 0.0, profitDifferencePercent = 0.0,
            isBundleBetter = false, allocationMode = allocationMode
        )
    }

    fun findBundlePrice(
        products: List<Product>,
        targetType: String, // "percent" or "rupiah"
        targetValue: Double,
        platform: String = "shopee",
        sellerType: String = "nonstar",
        categoryGroup: String = "A",
        freeShipEnabled: Boolean = true,
        cashbackEnabled: Boolean = true,
        allocationMode: String = "total"
    ): Map<String, Any> {
        var totalHPP = 0.0
        var totalItems = 0
        products.forEach { p ->
            totalHPP += p.hpp * p.qty
            totalItems += p.qty
        }

        if (totalHPP == 0.0) {
            return mapOf("minPrice" to 0.0, "isValid" to false, "error" to "Total HPP is zero")
        }

        val targetProfitAmount = if (targetType.lowercase() == "percent") {
            totalHPP * (targetValue / 100.0)
        } else {
            targetValue
        }

        val adminRate = getAdminRate(platform, sellerType, categoryGroup)
        var totalFeePercent = adminRate
        if (freeShipEnabled) {
            totalFeePercent += if (platform.lowercase() == "lazada") 5.0 else 4.0
        }
        if (cashbackEnabled && platform.lowercase() == "shopee") {
            totalFeePercent += 4.5
        }

        val baseProcessFee = if (platform.lowercase() == "lazada") 1000.0 else 1250.0
        val fixedCosts = if (allocationMode.lowercase() == "peritem") {
            baseProcessFee * totalItems
        } else {
            baseProcessFee
        }

        val denominator = 1.0 - (totalFeePercent / 100.0)
        if (denominator <= 0.0) {
            return mapOf("minPrice" to 0.0, "isValid" to false, "error" to "Fee percentage too high (>= 100%)")
        }

        val minPrice = ceil((targetProfitAmount + totalHPP + fixedCosts) / denominator)
        val suggestedPrices = generatePsychologicalPrices(minPrice)

        return mapOf(
            "minPrice" to minPrice,
            "suggestedPrices" to suggestedPrices,
            "targetProfit" to targetProfitAmount,
            "totalHPP" to totalHPP,
            "totalItems" to totalItems,
            "isValid" to true
        )
    }

    fun generatePsychologicalPrices(basePrice: Double): List<Map<String, Any>> {
        val suggestions = mutableListOf<Map<String, Any>>()
        val rounded = ceil(basePrice / 1000.0) * 1000.0

        val nine = ceil(basePrice / 10000.0) * 10000.0 - 1000.0
        if (nine >= basePrice) {
            suggestions.add(mapOf("price" to nine, "label" to "Harga Psikologis", "pattern" to "xx9.000"))
        }

        val nice = ceil(basePrice / 50000.0) * 50000.0
        if (nice >= basePrice && suggestions.none { (it["price"] as Double) == nice }) {
            suggestions.add(mapOf("price" to nice, "label" to "Harga Bulat", "pattern" to "xx0.000"))
        }

        val nextNine = nine + 10000.0
        if (nextNine >= basePrice && suggestions.none { (it["price"] as Double) == nextNine }) {
            suggestions.add(mapOf("price" to nextNine, "label" to "Alternatif", "pattern" to "xx9.000"))
        }

        if (rounded >= basePrice && suggestions.none { (it["price"] as Double) == rounded }) {
            suggestions.add(mapOf("price" to rounded, "label" to "Harga Minimum", "pattern" to "Minimum"))
        }

        suggestions.sortBy { it["price"] as Double }
        return suggestions.take(4)
    }

    private fun formatDouble(value: Double): String {
        return round(value * 100.0 / 100.0).toString()
    }

    fun generateBusinessInsights(bundleResult: BundleResult): List<Map<String, Any?>> {
        val insights = mutableListOf<Map<String, Any?>>()
        val netProfit = bundleResult.netProfit
        val margin = bundleResult.margin
        val products = bundleResult.products
        val bundlePrice = bundleResult.bundlePrice

        // 1. Loss Warning
        if (netProfit < 0.0) {
            insights.add(mapOf(
                "type" to "LOSS_WARNING",
                "severity" to "danger",
                "icon" to "exclamation-triangle",
                "message" to "Bundle ini mengalami RUGI ${formatRp(abs(netProfit))}!",
                "action" to "Naikkan harga bundle atau kurangi produk"
            ))
        }

        // 2. Low Margin Warning
        if (netProfit >= 0.0 && margin < 5.0) {
            val roundedMargin = round(margin * 10.0) / 10.0
            insights.add(mapOf(
                "type" to "LOW_MARGIN",
                "severity" to "warning",
                "icon" to "exclamation-circle",
                "message" to "Margin bundle tipis ($roundedMargin%). Risiko rugi tinggi jika ada diskon/promo.",
                "action" to "Pertimbangkan naikkan harga 5-10%"
            ))
        }

        // 3. Subsidy Detection
        val lossMakingProducts = products.filter { it.allocatedProfit < 0.0 }
        val profitableProducts = products.filter { it.allocatedProfit > 0.0 }

        if (lossMakingProducts.isNotEmpty() && netProfit > 0.0) {
            val subsidizers = profitableProducts.joinToString(", ") { it.product.name }
            val subsidized = lossMakingProducts.joinToString(", ") { "${it.product.name} (rugi ${formatRp(abs(it.allocatedProfit))})" }

            insights.add(mapOf(
                "type" to "SUBSIDY_WARNING",
                "severity" to "warning",
                "icon" to "balance-scale",
                "message" to "Produk berikut mengalami rugi: $subsidized",
                "detail" to "Disubsidi oleh: $subsidizers",
                "action" to "Evaluasi komposisi bundle"
            ))
        }

        // 4. Profit Contributor
        val topContributor = products.filter { it.allocatedProfit > 0.0 }
            .maxByOrNull { it.profitShare }
        if (topContributor != null && topContributor.profitShare > 50.0) {
            val shareRounded = round(topContributor.profitShare)
            insights.add(mapOf(
                "type" to "PROFIT_CONTRIBUTOR",
                "severity" to "info",
                "icon" to "star",
                "message" to "Produk \"${topContributor.product.name}\" menyumbang ${shareRounded.toInt()}% profit bundle",
                "detail" to "Profit: ${formatRp(topContributor.allocatedProfit)}"
            ))
        }

        // 5. Discount Limit
        if (netProfit > 0.0 && bundlePrice > 0.0) {
            val maxDiscount = (netProfit / bundlePrice) * 100.0
            val maxDiscountRounded = round(maxDiscount * 10.0) / 10.0
            insights.add(mapOf(
                "type" to "DISCOUNT_LIMIT",
                "severity" to if (maxDiscount < 5.0) "warning" else "info",
                "icon" to "tag",
                "message" to "Maksimal diskon bundle: $maxDiscountRounded% (${formatRp(netProfit)})",
                "detail" to "Diskon melebihi ini akan menyebabkan rugi"
            ))
        }

        // 6. Optimization Tips
        if (lossMakingProducts.isNotEmpty() && products.size > 2) {
            val worstProduct = lossMakingProducts.minByOrNull { it.allocatedProfit }
            if (worstProduct != null) {
                insights.add(mapOf(
                    "type" to "OPTIMIZATION_TIP",
                    "severity" to "info",
                    "icon" to "lightbulb",
                    "message" to "Pertimbangkan menghapus atau mengganti \"${worstProduct.product.name}\"",
                    "detail" to "Rugi: ${formatRp(abs(worstProduct.allocatedProfit))} per bundle",
                    "action" to "Ganti dengan produk margin lebih tinggi"
                ))
            }
        }

        return insights
    }

    private fun formatRp(value: Double): String {
        val rounded = round(value).toLong()
        val isNegative = rounded < 0
        val absVal = abs(rounded).toString()
        val sb = StringBuilder()
        var count = 0
        for (i in absVal.length - 1 downTo 0) {
            sb.append(absVal[i])
            count++
            if (count % 3 == 0 && i > 0) {
                sb.append('.')
            }
        }
        val formatted = sb.reverse().toString()
        return if (isNegative) "-Rp $formatted" else "Rp $formatted"
    }
}
