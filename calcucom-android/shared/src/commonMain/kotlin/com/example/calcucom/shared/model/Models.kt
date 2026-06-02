package com.example.calcucom.shared.model

data class Product(
    val id: Int,
    val name: String,
    val price: Double,
    val hpp: Double,
    val qty: Int = 1,
    val discountPercent: Double = 0.0
)

data class CustomCost(
    val name: String,
    val amount: Double,
    val isPercent: Boolean,
    val category: String // "deduction" or "addition"
)

data class FeeResult(
    val platform: String,
    val sellingPrice: Double,
    val displayPrice: Double,
    val basis: Double,
    val hpp: Double,
    val adminRate: Double,
    val adminFee: Double,
    val serviceFee: Double,
    val freeShipFee: Double,
    val cashbackFee: Double,
    val affiliateFee: Double,
    val orderProcessFee: Double,
    val fixedFee: Double,
    val operationalCost: Double,
    val adsCost: Double,
    val customDeductions: Double,
    val customAdditions: Double,
    val marketplaceDeductions: Double,
    val totalDeductions: Double,
    val totalFixedFees: Double,
    val totalCost: Double,
    val netIncome: Double,
    val netProfit: Double,
    val margin: Double,
    val isHealthy: Boolean,
    val healthLevel: String // "excellent", "good", "fair", "low", "negative"
)

data class BundleResult(
    val bundlePrice: Double,
    val totalHPP: Double,
    val totalItems: Int,
    val productCount: Int,
    val voucherAmount: Double,
    val adminFee: Double,
    val serviceFee: Double,
    val cashbackFee: Double,
    val processFee: Double,
    val fixedFee: Double,
    val totalFees: Double,
    val netCash: Double,
    val netProfit: Double,
    val margin: Double,
    val marginStatus: String, // "danger", "warning", "healthy"
    val products: List<BundleProductBreakdown>,
    val individualProfit: Double,
    val profitDifference: Double,
    val profitDifferencePercent: Double,
    val isBundleBetter: Boolean,
    val allocationMode: String,
    val adminRate: Double = 0.0,
    val serviceRate: Double = 0.0,
    val cashbackRate: Double = 0.0
)

data class BundleProductBreakdown(
    val product: Product,
    val allocatedFee: Double,
    val allocatedProfit: Double,
    val profitShare: Double,
    val margin: Double,
    val marginStatus: String,
    val hppRatio: Double
)

data class RoasResult(
    val roasBE: Double,
    val acosMax: Double,
    val maxCPC: Double,
    val conversionRate: Double
)

data class AdPerformanceResult(
    val cpc: Double,
    val acos: Double,
    val roas: Double,
    val grossProfit: Double,
    val profitAfterAds: Double,
    val marginAfterAds: Double,
    val breakEvenRoas: Double,
    val status: String, // "excellent", "good", "warning", "danger", "unknown"
    val recommendation: String
)
