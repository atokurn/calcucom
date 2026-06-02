package com.example.calcucom.shared.constants

object AppConstants {
    // Shopee Rates by [sellerType][categoryGroup]
    val shopeeRates = mapOf(
        "nonstar" to mapOf("A" to 8.0, "B" to 7.5, "C" to 5.75, "D" to 4.25, "E" to 2.5, "F" to 3.2),
        "star" to mapOf("A" to 8.0, "B" to 7.5, "C" to 5.75, "D" to 4.25, "E" to 2.5, "F" to 3.2),
        "mall" to mapOf("A" to 10.2, "B" to 9.7, "C" to 7.2, "D" to 6.2, "E" to 5.2, "F" to 3.2)
    )

    // Tokopedia Rates by [sellerType][categoryGroup]
    val tokopediaRates = mapOf(
        "regular" to mapOf("A" to 7.5, "B" to 6.5, "C" to 5.5, "D" to 4.5, "E" to 2.5, "F" to 3.5),
        "power" to mapOf("A" to 7.0, "B" to 6.0, "C" to 5.0, "D" to 4.0, "E" to 2.0, "F" to 3.0),
        "mall" to mapOf("A" to 9.5, "B" to 8.5, "C" to 7.5, "D" to 6.5, "E" to 4.0, "F" to 5.0)
    )

    // Tokopedia Dynamic/Cluster Rates
    val tokopediaDynamicRates = mapOf(
        "elektronik" to 4.0,
        "fashion" to 5.5,
        "fmcg" to 4.0,
        "lifestyle" to 5.5,
        "others" to 5.0
    )

    // TikTok Rates by [sellerType][categoryGroup]
    val tiktokRates = mapOf(
        "regular" to mapOf("A" to 7.5, "B" to 6.5, "C" to 5.5, "D" to 4.5, "E" to 2.5, "F" to 3.5),
        "mall" to mapOf("A" to 9.5, "B" to 8.5, "C" to 7.5, "D" to 6.5, "E" to 4.0, "F" to 5.0)
    )

    // TikTok Dynamic/Cluster Rates
    val tiktokDynamicRates = mapOf(
        "elektronik" to 4.0,
        "fashion" to 5.5,
        "fmcg" to 4.0,
        "lifestyle" to 5.5,
        "others" to 5.0
    )

    // Lazada Rates by [sellerType][categoryGroup]
    val lazadaRates = mapOf(
        "regular" to mapOf("A" to 6.0, "B" to 5.5, "C" to 4.5, "D" to 3.5, "E" to 2.0, "F" to 2.0),
        "mall" to mapOf("A" to 8.0, "B" to 7.5, "C" to 6.5, "D" to 5.5, "E" to 4.0, "F" to 4.0)
    )

    // Default configuration values
    const val DEFAULT_PLATFORM = "shopee"
    const val DEFAULT_SELLER_TYPE = "nonstar"
    const val DEFAULT_CATEGORY_GROUP = "A"
    const val DEFAULT_ORDER_PROCESS_FEE = 1250.0
    const val DEFAULT_TARGET_MARGIN = 15.0
    const val DEFAULT_CONVERSION_RATE = 2.0
}
