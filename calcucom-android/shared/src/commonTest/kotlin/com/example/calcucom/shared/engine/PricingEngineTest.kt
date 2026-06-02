package com.example.calcucom.shared.engine

import com.example.calcucom.shared.model.Product
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class PricingEngineTest {

    @Test
    fun testGetAdminRate() {
        // Shopee Star Category A
        val rateShopee = PricingEngine.getAdminRate("shopee", "star", "A")
        assertEquals(8.0, rateShopee)

        // Tokopedia Power Category B
        val rateTokopedia = PricingEngine.getAdminRate("tokopedia", "power", "B")
        assertEquals(6.0, rateTokopedia)

        // Lazada Mall Category C
        val rateLazada = PricingEngine.getAdminRate("lazada", "mall", "C")
        assertEquals(6.5, rateLazada)
    }

    @Test
    fun testCalculateFeesSingle() {
        val result = PricingEngine.calculateFees(
            platform = "shopee",
            sellerType = "nonstar",
            categoryGroup = "A",
            sellingPrice = 100000.0,
            discountPercent = 10.0, // 90000 final display
            voucherAmount = 5000.0, // 85000 basis
            hpp = 50000.0,
            isFreeShip = true, // 4% of 85000 = 3400
            isCashback = true, // 4.5% of 85000 = 3825
            affiliatePercent = 2.0, // 2% of 85000 = 1700
            orderProcessFee = 1250.0,
            operationalCost = 2000.0
        )

        // displayPrice = 100000 - 10% = 90000
        assertEquals(90000.0, result.displayPrice)
        // basis = 90000 - 5000 = 85000
        assertEquals(85000.0, result.basis)
        // adminFee = 85000 * 8% = 6800
        assertEquals(6800.0, result.adminFee)
        // freeShipFee = 85000 * 4% = 3400
        assertEquals(3400.0, result.freeShipFee)
        // cashbackFee = 85000 * 4.5% = 3825
        assertEquals(3825.0, result.cashbackFee)
        // serviceFee = 3400 + 3825 = 7225
        assertEquals(7225.0, result.serviceFee)
        // affiliateFee = 85000 * 2% = 1700
        assertEquals(1700.0, result.affiliateFee)
        
        // marketplaceDeductions = 6800 + 7225 + 1700 + 1250 = 16975
        assertEquals(16975.0, result.marketplaceDeductions)
        // netIncome = 85000 - 16975 = 68025
        assertEquals(68025.0, result.netIncome)
        // totalCost = hpp (50000) + operationalCost (2000) = 52000
        assertEquals(52000.0, result.totalCost)
        // netProfit = 68025 - 52000 = 16025
        assertEquals(16025.0, result.netProfit)
        assertTrue(result.isHealthy)
    }

    @Test
    fun testCalculateOptimalPrice() {
        val result = PricingEngine.calculateOptimalPrice(
            hpp = 50000.0,
            targetType = "margin",
            targetValue = 15.0, // 15% target margin
            totalFeePercent = 10.0 // 10% total fee
        )

        assertTrue(result["isValid"] as Boolean)
        val sellingPrice = result["sellingPrice"] as Double
        // expected: 50000 / (1 - 0.15 - 0.10) = 50000 / 0.75 = 66667
        assertEquals(66667.0, sellingPrice)
    }

    @Test
    fun testCalculateROAS() {
        val result = PricingEngine.calculateROAS(
            sellingPrice = 100000.0,
            netProfit = 25000.0,
            conversionRate = 2.0
        )

        assertEquals(4.0, result.roasBE)
        assertEquals(25.0, result.acosMax)
        assertEquals(500.0, result.maxCPC)
    }

    @Test
    fun testCalculateBundle() {
        val productA = Product(id = 1, name = "Product A", price = 60000.0, hpp = 30000.0, qty = 1)
        val productB = Product(id = 2, name = "Product B", price = 40000.0, hpp = 20000.0, qty = 2)
        val products = listOf(productA, productB)

        val bundleResult = PricingEngine.calculateBundle(
            bundlePrice = 120000.0,
            products = products,
            platform = "shopee",
            sellerType = "nonstar",
            categoryGroup = "A",
            voucherAmount = 10000.0,
            freeShipEnabled = true,
            cashbackEnabled = true
        )

        // totalHPP = 30000*1 + 20000*2 = 70000
        assertEquals(70000.0, bundleResult.totalHPP)
        assertEquals(3, bundleResult.totalItems)
        assertEquals(2, bundleResult.productCount)
        
        // verify breakdowns allocated successfully
        assertEquals(2, bundleResult.products.size)
        val breakdownA = bundleResult.products[0]
        val breakdownB = bundleResult.products[1]
        
        // HPP ratio: A is 30/70 = 42.8%, B is 40/70 = 57.1%
        assertTrue(breakdownA.hppRatio > 42.0 && breakdownA.hppRatio < 43.0)
        assertTrue(breakdownB.hppRatio > 57.0 && breakdownB.hppRatio < 58.0)
    }
}
