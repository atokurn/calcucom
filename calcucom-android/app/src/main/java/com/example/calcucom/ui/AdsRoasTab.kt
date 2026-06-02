package com.example.calcucom.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.calcucom.shared.engine.PricingEngine

@Composable
fun AdsRoasTab() {
    var sellingPriceInput by remember { mutableStateOf("100000") }
    var netProfitInput by remember { mutableStateOf("25000") }
    var crInput by remember { mutableStateOf("2.0") }

    var adSpendInput by remember { mutableStateOf("50000") }
    var adRevenueInput by remember { mutableStateOf("200000") }
    var clicksInput by remember { mutableStateOf("100") }
    var estimatedMarginInput by remember { mutableStateOf("25.0") }

    val sellingPrice = sellingPriceInput.toDoubleOrNull() ?: 0.0
    val netProfit = netProfitInput.toDoubleOrNull() ?: 0.0
    val cr = crInput.toDoubleOrNull() ?: 2.0

    val adSpend = adSpendInput.toDoubleOrNull() ?: 0.0
    val adRevenue = adRevenueInput.toDoubleOrNull() ?: 0.0
    val clicks = clicksInput.toIntOrNull() ?: 0
    val estimatedMargin = (estimatedMarginInput.toDoubleOrNull() ?: 25.0) / 100.0

    // Calculations
    val roasTargetResult = PricingEngine.calculateROAS(sellingPrice, netProfit, cr)
    val adAnalysisResult = PricingEngine.analyzeAdPerformance(adSpend, adRevenue, clicks, estimatedMargin)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Section 1: Target ROAS & Safe Limits
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Kalkulator Batas Aman Iklan (ROAS)", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = sellingPriceInput,
                        onValueChange = { sellingPriceInput = it },
                        label = { Text("Harga Jual (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = netProfitInput,
                        onValueChange = { netProfitInput = it },
                        label = { Text("Profit Organik/Unit (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                OutlinedTextField(
                    value = crInput,
                    onValueChange = { crInput = it },
                    label = { Text("Estimasi CR/Tingkat Konversi (%)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                Divider(modifier = Modifier.padding(vertical = 4.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Break-Even ROAS:")
                    Text("${formatPercent(roasTargetResult.roasBE)}x", fontWeight = FontWeight.Bold)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Maksimal ACOS:")
                    Text("${formatPercent(roasTargetResult.acosMax)}%", fontWeight = FontWeight.Bold)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Maksimal CPC untuk Impas:")
                    Text("Rp ${formatCurrency(roasTargetResult.maxCPC)}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
            }
        }

        // Section 2: Ads Performance Analyzer
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Ads Performance & ROI Analyzer", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = adSpendInput,
                        onValueChange = { adSpendInput = it },
                        label = { Text("Biaya Iklan (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = adRevenueInput,
                        onValueChange = { adRevenueInput = it },
                        label = { Text("Omzet Iklan (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = clicksInput,
                        onValueChange = { clicksInput = it },
                        label = { Text("Jumlah Klik") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = estimatedMarginInput,
                        onValueChange = { estimatedMarginInput = it },
                        label = { Text("Est. Margin Kotor (%)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Divider(modifier = Modifier.padding(vertical = 4.dp))

                // Output metrics
                val analysisColor = when (adAnalysisResult.status) {
                    "excellent" -> Color(0xFF2E7D32)
                    "good" -> Color(0xFF4CAF50)
                    "warning" -> Color(0xFFF57C00)
                    else -> Color(0xFFC62828)
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("ROAS Aktual:")
                    Text("${formatPercent(adAnalysisResult.roas)}x", fontWeight = FontWeight.Bold, color = analysisColor)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("ACOS Aktual:")
                    Text("${formatPercent(adAnalysisResult.acos)}%", fontWeight = FontWeight.Bold)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("CPC Aktual:")
                    Text("Rp ${formatCurrency(adAnalysisResult.cpc)}")
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Laba setelah Iklan:")
                    Text("Rp ${formatCurrency(adAnalysisResult.profitAfterAds)}", fontWeight = FontWeight.Bold, color = analysisColor)
                }

                if (adSpend > 0.0 && adRevenue > 0.0) {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        colors = CardDefaults.cardColors(containerColor = analysisColor.copy(alpha = 0.08f))
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text("Rekomendasi:", fontWeight = FontWeight.Bold, color = analysisColor, style = MaterialTheme.typography.bodyMedium)
                            Text(adAnalysisResult.recommendation, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        }
    }
}
