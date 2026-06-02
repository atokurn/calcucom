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
import com.example.calcucom.shared.model.Product
import com.example.calcucom.shared.model.BundleResult
import com.example.calcucom.shared.model.BundleProductBreakdown

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BundlingTab() {
    var platform by remember { mutableStateOf("shopee") }
    var sellerType by remember { mutableStateOf("nonstar") }
    var categoryGroup by remember { mutableStateOf("A") }
    var bundlePriceInput by remember { mutableStateOf("120000") }
    var voucherInput by remember { mutableStateOf("5000") }
    var allocationMode by remember { mutableStateOf("total") }
    var isFreeShip by remember { mutableStateOf(true) }
    var isCashback by remember { mutableStateOf(true) }

    // Prepopulate with two products
    val productsList = remember {
        mutableStateListOf(
            Product(id = 1, name = "Kemeja Pria", price = 65000.0, hpp = 30000.0, qty = 1),
            Product(id = 2, name = "Kaos Polos", price = 40000.0, hpp = 18000.0, qty = 2)
        )
    }

    var newItemName by remember { mutableStateOf("") }
    var newItemPrice by remember { mutableStateOf("") }
    var newItemHpp by remember { mutableStateOf("") }
    var newItemQty by remember { mutableStateOf("1") }

    val bundlePrice = bundlePriceInput.toDoubleOrNull() ?: 0.0
    val voucher = voucherInput.toDoubleOrNull() ?: 0.0

    // Perform calculation
    val result: BundleResult = PricingEngine.calculateBundle(
        bundlePrice = bundlePrice,
        products = productsList.toList(),
        platform = platform,
        sellerType = sellerType,
        categoryGroup = categoryGroup,
        voucherAmount = voucher,
        freeShipEnabled = isFreeShip,
        cashbackEnabled = isCashback,
        allocationMode = allocationMode
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Platform Selection
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Konfigurasi Bundle & Marketplace", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    listOf("shopee", "tokopedia", "tiktok", "lazada").forEach { plat ->
                        val isSelected = platform == plat
                        OutlinedButton(
                            onClick = { platform = plat },
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent
                            ),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text(plat.replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = bundlePriceInput,
                        onValueChange = { bundlePriceInput = it },
                        label = { Text("Harga Bundle (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = voucherInput,
                        onValueChange = { voucherInput = it },
                        label = { Text("Voucher (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text("Metode Alokasi Biaya:", style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                    TextButton(onClick = { allocationMode = if (allocationMode == "total") "peritem" else "total" }) {
                        Text(if (allocationMode == "total") "Bagi Rata (Total HPP)" else "Per Item (Proses Fee)")
                    }
                }
            }
        }

        // Bundle Products List
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Daftar Produk dalam Bundle", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                
                productsList.forEachIndexed { idx, prod ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(prod.name, fontWeight = FontWeight.SemiBold)
                            Text("HPP: Rp ${formatCurrency(prod.hpp)} · Qty: ${prod.qty}", style = MaterialTheme.typography.bodySmall)
                        }
                        Text("Rp ${formatCurrency(prod.hpp * prod.qty)}", fontWeight = FontWeight.Medium)
                        IconButton(onClick = { productsList.removeAt(idx) }) {
                            Text("✖", color = MaterialTheme.colorScheme.error)
                        }
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 8.dp))

                // Add Product Form
                Text("Tambah Produk ke Bundle:", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                OutlinedTextField(
                    value = newItemName,
                    onValueChange = { newItemName = it },
                    label = { Text("Nama Produk") },
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = newItemHpp,
                        onValueChange = { newItemHpp = it },
                        label = { Text("HPP Modal (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = newItemQty,
                        onValueChange = { newItemQty = it },
                        label = { Text("Qty") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(0.5f)
                    )
                }

                Button(
                    onClick = {
                        if (newItemName.isNotBlank() && newItemHpp.isNotBlank()) {
                            val hppVal = newItemHpp.toDoubleOrNull() ?: 0.0
                            val qtyVal = newItemQty.toIntOrNull() ?: 1
                            productsList.add(
                                Product(
                                    id = productsList.size + 1,
                                    name = newItemName,
                                    price = hppVal * 2.0,
                                    hpp = hppVal,
                                    qty = qtyVal
                                )
                            )
                            newItemName = ""
                            newItemHpp = ""
                            newItemQty = "1"
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                ) {
                    Text("Tambah ke Bundle")
                }
            }
        }

        // Summary Results
        val healthColor = when (result.marginStatus) {
            "healthy" -> Color(0xFF2E7D32)
            "warning" -> Color(0xFFF57C00)
            else -> Color(0xFFC62828)
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = healthColor.copy(alpha = 0.1f))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Analisa Hasil Bundle", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total HPP Bundle:")
                    Text("Rp ${formatCurrency(result.totalHPP)}", fontWeight = FontWeight.Medium)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Potongan Marketplace:")
                    Text("Rp ${formatCurrency(result.totalFees)}")
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Laba Bersih Bundle:", fontWeight = FontWeight.Bold)
                    Text("Rp ${formatCurrency(result.netProfit)}", fontWeight = FontWeight.Bold, color = healthColor)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Margin Profit:")
                    Text("${formatPercent(result.margin)}%", fontWeight = FontWeight.Bold, color = healthColor)
                }

                Divider(modifier = Modifier.padding(vertical = 4.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Jika Dijual Satuan (Total Profit):")
                    Text("Rp ${formatCurrency(result.individualProfit)}")
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Efisiensi Bundling:")
                    val diffPrefix = if (result.profitDifference >= 0) "+" else ""
                    Text("$diffPrefix${formatPercent(result.profitDifferencePercent)}% (Rp ${formatCurrency(result.profitDifference)})", color = if (result.isBundleBetter) Color(0xFF2E7D32) else Color(0xFFC62828), fontWeight = FontWeight.Bold)
                }
            }
        }

        // Fee Allocation Breakdown per Item
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Alokasi Laba & Potongan per Produk", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                
                result.products.forEach { breakdown ->
                    val prod = breakdown.product
                    val marginStatusColor = when (breakdown.marginStatus) {
                        "healthy" -> Color(0xFF2E7D32)
                        "warning" -> Color(0xFFF57C00)
                        else -> Color(0xFFC62828)
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp)
                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                            .padding(8.dp)
                    ) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(prod.name, fontWeight = FontWeight.Bold)
                            Text("Share: ${formatPercent(breakdown.hppRatio)}%")
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Alokasi Laba Bersih:", style = MaterialTheme.typography.bodySmall)
                            Text("Rp ${formatCurrency(breakdown.allocatedProfit)}", style = MaterialTheme.typography.bodySmall, color = marginStatusColor, fontWeight = FontWeight.Bold)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Alokasi Potongan Marketplace:", style = MaterialTheme.typography.bodySmall)
                            Text("Rp ${formatCurrency(breakdown.allocatedFee)}", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        }

        // Business Insights Dashboard
        val insights = PricingEngine.generateBusinessInsights(
            BundleResult(
                bundlePrice = result.bundlePrice,
                totalHPP = result.totalHPP,
                totalItems = result.totalItems,
                productCount = result.productCount,
                voucherAmount = result.voucherAmount,
                adminFee = result.adminFee,
                serviceFee = result.serviceFee,
                cashbackFee = result.cashbackFee,
                processFee = result.processFee,
                fixedFee = result.fixedFee,
                totalFees = result.totalFees,
                netCash = result.netCash,
                netProfit = result.netProfit,
                margin = result.margin,
                marginStatus = result.marginStatus,
                products = result.products.map {
                    BundleProductBreakdown(
                        product = it.product,
                        allocatedFee = it.allocatedFee,
                        allocatedProfit = it.allocatedProfit,
                        profitShare = it.profitShare,
                        margin = it.margin,
                        marginStatus = it.marginStatus,
                        hppRatio = it.hppRatio
                    )
                },
                individualProfit = result.individualProfit,
                profitDifference = result.profitDifference,
                profitDifferencePercent = result.profitDifferencePercent,
                isBundleBetter = result.isBundleBetter,
                allocationMode = result.allocationMode
            )
        )

        if (insights.isNotEmpty()) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("💡 Business Insights & Rekomendasi", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    
                    for (insight in insights) {
                        val severity = insight["severity"] as? String ?: "info"
                        val message = insight["message"] as? String ?: ""
                        val detail = insight["detail"] as? String
                        val action = insight["action"] as? String

                        val color = when (severity) {
                            "danger" -> Color(0xFFC62828)
                            "warning" -> Color(0xFFF57C00)
                            else -> Color(0xFF1565C0)
                        }

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .background(color.copy(alpha = 0.08f))
                                .padding(8.dp)
                        ) {
                            Text(message, color = color, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                            if (!detail.isNullOrBlank()) {
                                Text(detail, style = MaterialTheme.typography.bodySmall)
                            }
                            if (!action.isNullOrBlank()) {
                                Text("Aksi: $action", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodySmall, color = color)
                            }
                        }
                    }
                }
            }
        }
    }
}
