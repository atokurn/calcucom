package com.example.calcucom.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.calcucom.shared.engine.PricingEngine
import com.example.calcucom.shared.model.FeeResult

@Composable
fun ProfitCalculatorTab() {
    var platform by remember { mutableStateOf("shopee") }
    var sellerType by remember { mutableStateOf("nonstar") }
    var categoryGroup by remember { mutableStateOf("A") }
    var sellingPriceInput by remember { mutableStateOf("100000") }
    var hppInput by remember { mutableStateOf("50000") }
    var discountInput by remember { mutableStateOf("0") }
    var voucherInput by remember { mutableStateOf("0") }
    var isFreeShip by remember { mutableStateOf(false) }
    var isCashback by remember { mutableStateOf(false) }
    var affiliateInput by remember { mutableStateOf("0") }
    var processFeeInput by remember { mutableStateOf("1250") }
    var fixedFeeInput by remember { mutableStateOf("0") }
    var operationalCostInput by remember { mutableStateOf("0") }
    var adsCostInput by remember { mutableStateOf("0") }

    val sellingPrice = sellingPriceInput.toDoubleOrNull() ?: 0.0
    val hpp = hppInput.toDoubleOrNull() ?: 0.0
    val discount = discountInput.toDoubleOrNull() ?: 0.0
    val voucher = voucherInput.toDoubleOrNull() ?: 0.0
    val affiliate = affiliateInput.toDoubleOrNull() ?: 0.0
    val processFee = processFeeInput.toDoubleOrNull() ?: 0.0
    val fixedFee = fixedFeeInput.toDoubleOrNull() ?: 0.0
    val operationalCost = operationalCostInput.toDoubleOrNull() ?: 0.0
    val adsCost = adsCostInput.toDoubleOrNull() ?: 0.0

    // Live calculation
    val result: FeeResult = PricingEngine.calculateFees(
        platform = platform,
        sellerType = sellerType,
        categoryGroup = categoryGroup,
        sellingPrice = sellingPrice,
        discountPercent = discount,
        voucherAmount = voucher,
        hpp = hpp,
        isFreeShip = isFreeShip,
        isCashback = isCashback,
        affiliatePercent = affiliate,
        orderProcessFee = processFee,
        fixedFee = fixedFee,
        operationalCost = operationalCost,
        adsCost = adsCost
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Platform Selection Card
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("Pilih Marketplace", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("shopee", "tokopedia", "tiktok", "lazada").forEach { plat ->
                        val isSelected = platform == plat
                        Button(
                            onClick = {
                                platform = plat
                                // Update default process fee when switching platform
                                processFeeInput = if (plat == "lazada") "1000" else "1250"
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondaryContainer,
                                contentColor = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSecondaryContainer
                            ),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                        ) {
                            Text(plat.replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        }

        // Configuration Card
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Konfigurasi Toko", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                
                // Seller Type
                Text("Tipe Penjual:", style = MaterialTheme.typography.bodySmall)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    val types = if (platform == "tokopedia") listOf("regular", "power", "mall") else listOf("nonstar", "star", "mall")
                    types.forEach { type ->
                        val isSelected = sellerType == type
                        OutlinedButton(
                            onClick = { sellerType = type },
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent
                            ),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(type.uppercase(), style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }

                // Category Group (A-F)
                Text("Grup Kategori (Admin Fee):", style = MaterialTheme.typography.bodySmall)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    val groups = if (platform == "lazada") listOf("A", "B", "C", "D", "E") else listOf("A", "B", "C", "D", "E", "F")
                    groups.forEach { grp ->
                        val isSelected = categoryGroup == grp
                        OutlinedButton(
                            onClick = { categoryGroup = grp },
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent
                            ),
                            contentPadding = PaddingValues(0.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(grp)
                        }
                    }
                }
            }
        }

        // Input Fields
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Strategi Harga & Modal", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = sellingPriceInput,
                        onValueChange = { sellingPriceInput = it },
                        label = { Text("Harga Jual (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = hppInput,
                        onValueChange = { hppInput = it },
                        label = { Text("HPP Modal (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = discountInput,
                        onValueChange = { discountInput = it },
                        label = { Text("Diskon Toko (%)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = voucherInput,
                        onValueChange = { voucherInput = it },
                        label = { Text("Voucher Toko (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = affiliateInput,
                        onValueChange = { affiliateInput = it },
                        label = { Text("Affiliate (%)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = processFeeInput,
                        onValueChange = { processFeeInput = it },
                        label = { Text("Biaya Proses (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = operationalCostInput,
                        onValueChange = { operationalCostInput = it },
                        label = { Text("Operasional (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = adsCostInput,
                        onValueChange = { adsCostInput = it },
                        label = { Text("Biaya Iklan (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                // Program Toggles
                Text("Program Layanan Tambahan:", style = MaterialTheme.typography.bodySmall)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Gratis Ongkir Xtra (+4-5%)", style = MaterialTheme.typography.bodyMedium)
                    Switch(checked = isFreeShip, onCheckedChange = { isFreeShip = it })
                }
                
                if (platform == "shopee") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Cashback Xtra (+4.5%)", style = MaterialTheme.typography.bodyMedium)
                        Switch(checked = isCashback, onCheckedChange = { isCashback = it })
                    }
                }
            }
        }

        // Profit Summary Card
        val healthColor = when (result.healthLevel) {
            "excellent" -> Color(0xFF2E7D32)
            "good" -> Color(0xFF4CAF50)
            "fair" -> Color(0xFFF57C00)
            "low" -> Color(0xFFFF9800)
            else -> Color(0xFFC62828)
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = healthColor.copy(alpha = 0.1f))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Ringkasan Profit", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Laba Bersih per Order:", fontWeight = FontWeight.Bold)
                    Text("Rp ${formatCurrency(result.netProfit)}", fontWeight = FontWeight.Bold, color = healthColor)
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Margin Profit:")
                    Text("${formatPercent(result.margin)}%", fontWeight = FontWeight.Bold, color = healthColor)
                }

                Divider(modifier = Modifier.padding(vertical = 4.dp))

                Text("Rincian Potongan:", fontWeight = FontWeight.Medium, style = MaterialTheme.typography.bodySmall)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Biaya Admin (${result.adminRate}%):", style = MaterialTheme.typography.bodySmall)
                    Text("Rp ${formatCurrency(result.adminFee)}", style = MaterialTheme.typography.bodySmall)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Biaya Layanan:", style = MaterialTheme.typography.bodySmall)
                    Text("Rp ${formatCurrency(result.serviceFee)}", style = MaterialTheme.typography.bodySmall)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Affiliate / Proses:", style = MaterialTheme.typography.bodySmall)
                    Text("Rp ${formatCurrency(result.affiliateFee + result.orderProcessFee)}", style = MaterialTheme.typography.bodySmall)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Net Cash Diterima:", fontWeight = FontWeight.Medium)
                    Text("Rp ${formatCurrency(result.netIncome)}", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

fun formatCurrency(value: Double): String {
    return try {
        String.format("%,.0f", value).replace(",", ".")
    } catch (e: Exception) {
        value.toInt().toString()
    }
}

fun formatPercent(value: Double): String {
    return try {
        String.format("%.1f", value)
    } catch (e: Exception) {
        value.toString()
    }
}
