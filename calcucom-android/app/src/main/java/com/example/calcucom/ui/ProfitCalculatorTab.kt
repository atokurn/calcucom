package com.example.calcucom.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.calcucom.shared.engine.PricingEngine
import com.example.calcucom.shared.model.FeeResult
import com.example.calcucom.ui.components.ProfitPieChart
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfitCalculatorTab() {
    var platform by remember { mutableStateOf("shopee") }
    var sellerType by remember { mutableStateOf("nonstar") }
    var categoryGroup by remember { mutableStateOf("A") }
    
    // String inputs (raw digits)
    var productNameInput by remember { mutableStateOf("Kemeja Premium") }
    var sellingPriceInput by remember { mutableStateOf("100000") }
    var hppInput by remember { mutableStateOf("50000") }
    var discountInput by remember { mutableStateOf("0") }
    var voucherInput by remember { mutableStateOf("0") }
    var affiliateInput by remember { mutableStateOf("0") }
    var processFeeInput by remember { mutableStateOf("1250") }
    var fixedFeeInput by remember { mutableStateOf("0") }
    var operationalCostInput by remember { mutableStateOf("0") }
    var adsCostInput by remember { mutableStateOf("0") }
    var monthlySalesInput by remember { mutableStateOf("100") }
    
    var isFreeShip by remember { mutableStateOf(false) }
    var isCashback by remember { mutableStateOf(false) }
    
    // Simulation panel tab
    var simTabSelected by remember { mutableStateOf(0) } // 0 = ROAS, 1 = Sales

    val scrollState = rememberScrollState()
    val coroutineScope = rememberCoroutineScope()

    // Parsing helper
    fun parseInput(value: String): Double {
        return value.replace(".", "").replace(",", "").toDoubleOrNull() ?: 0.0
    }

    val sellingPrice = parseInput(sellingPriceInput)
    val hpp = parseInput(hppInput)
    val discount = parseInput(discountInput)
    val voucher = parseInput(voucherInput)
    val affiliate = parseInput(affiliateInput)
    val processFee = parseInput(processFeeInput)
    val fixedFee = parseInput(fixedFeeInput)
    val operationalCost = parseInput(operationalCostInput)
    val adsCost = parseInput(adsCostInput)
    val monthlySales = parseInput(monthlySalesInput)

    // Calculation result
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

    // Visual Color Coding for health levels
    val (healthColor, healthLabel) = when (result.healthLevel) {
        "excellent" -> Color(0xFF1B5E20) to "Sangat Sehat"
        "good" -> Color(0xFF4CAF50) to "Sehat"
        "fair" -> Color(0xFFFFA726) to "Normal"
        "low" -> Color(0xFFFF9800) to "Margin Rendah"
        else -> Color(0xFFE53935) to "Rugi/Negative"
    }

    // Brand Colors mapping
    val platformColor = when (platform) {
        "shopee" -> Color(0xFFEE4D2D)
        "tokopedia" -> Color(0xFF03AC0E)
        "tiktok" -> Color(0xFF1A1A1A)
        "lazada" -> Color(0xFF10156F)
        else -> MaterialTheme.colorScheme.primary
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(16.dp)
                .padding(bottom = 76.dp), // Leaves spacing for the sticky bar
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            
            // CARD 1: PLATFORM SELECTION
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "Pilih Marketplace", 
                        style = MaterialTheme.typography.titleMedium, 
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        val plats = listOf("shopee" to "Shopee", "tokopedia" to "Tokopedia", "tiktok" to "TikTok", "lazada" to "Lazada")
                        plats.forEach { (key, name) ->
                            val isSelected = platform == key
                            val activeColor = when (key) {
                                "shopee" -> Color(0xFFEE4D2D)
                                "tokopedia" -> Color(0xFF03AC0E)
                                "tiktok" -> Color(0xFF1A1A1A)
                                "lazada" -> Color(0xFF10156F)
                                else -> MaterialTheme.colorScheme.primary
                            }
                            
                            Button(
                                onClick = {
                                    platform = key
                                    // Align seller type defaults
                                    if (key == "shopee") {
                                        if (sellerType == "regular" || sellerType == "power") {
                                            sellerType = "nonstar"
                                        }
                                    } else {
                                        if (sellerType == "nonstar" || sellerType == "star") {
                                            sellerType = "regular"
                                        }
                                    }
                                    processFeeInput = if (key == "lazada") "1000" else "1250"
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isSelected) activeColor else MaterialTheme.colorScheme.secondaryContainer,
                                    contentColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onSecondaryContainer
                                ),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 2.dp, vertical = 8.dp)
                            ) {
                                Text(
                                    text = name, 
                                    fontSize = 11.sp, 
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            // CARD 2: CONFIGURATION
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Konfigurasi Toko", 
                        style = MaterialTheme.typography.titleMedium, 
                        fontWeight = FontWeight.Bold
                    )

                    // Seller Type Row
                    Text("Tipe Penjual:", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        val types = if (platform == "tokopedia") listOf("regular", "power", "mall") else if (platform == "shopee") listOf("nonstar", "star", "mall") else listOf("regular", "mall")
                        types.forEach { type ->
                            val isSelected = sellerType == type
                            OutlinedButton(
                                onClick = { sellerType = type },
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (isSelected) platformColor.copy(alpha = 0.15f) else Color.Transparent,
                                    contentColor = if (isSelected) platformColor else MaterialTheme.colorScheme.onSurface
                                ),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = type.uppercase(), 
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }
                    }

                    // Category Groups
                    Text("Grup Kategori (Admin Fee):", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        val groups = if (platform == "lazada") listOf("A", "B", "C", "D", "E") else listOf("A", "B", "C", "D", "E", "F")
                        groups.forEach { grp ->
                            val isSelected = categoryGroup == grp
                            OutlinedButton(
                                onClick = { categoryGroup = grp },
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (isSelected) platformColor.copy(alpha = 0.15f) else Color.Transparent,
                                    contentColor = if (isSelected) platformColor else MaterialTheme.colorScheme.onSurface
                                ),
                                contentPadding = PaddingValues(0.dp),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = grp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }
                    }
                    
                    // Show actual admin fee percentage
                    Text(
                        text = "Biaya Admin Terpilih: ${result.adminRate}%",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = platformColor,
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.End
                    )
                }
            }

            // CARD 3: PRICING STRATEGY & MODAL
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Strategi Harga & Modal", 
                        style = MaterialTheme.typography.titleMedium, 
                        fontWeight = FontWeight.Bold
                    )
                    
                    OutlinedTextField(
                        value = productNameInput,
                        onValueChange = { productNameInput = it },
                        label = { Text("Nama Produk / SKU") },
                        modifier = Modifier.fillMaxWidth()
                    )

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
                        Column(modifier = Modifier.weight(1f)) {
                            OutlinedTextField(
                                value = discountInput,
                                onValueChange = { discountInput = it },
                                label = { Text("Diskon Toko (%)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.fillMaxWidth()
                            )
                            if (discount > 0.0) {
                                Text(
                                    text = "Final: Rp ${formatCurrency(result.displayPrice)}",
                                    fontSize = 10.sp,
                                    color = Color.Gray,
                                    modifier = Modifier.padding(top = 2.dp, start = 4.dp)
                                )
                            }
                        }
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

                    // Extra toggle items (Free Ship, Cashback)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Program Layanan Tambahan:", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Gratis Ongkir Xtra", style = MaterialTheme.typography.bodyMedium)
                            Text(
                                text = if (platform == "lazada") "Biaya Layanan ~5%" else "Biaya Layanan ~4%",
                                fontSize = 10.sp,
                                color = Color.Gray
                            )
                        }
                        Switch(
                            checked = isFreeShip, 
                            onCheckedChange = { isFreeShip = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = platformColor, checkedTrackColor = platformColor.copy(alpha = 0.5f))
                        )
                    }
                    
                    if (platform == "shopee") {
                        Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Cashback Xtra", style = MaterialTheme.typography.bodyMedium)
                                Text("Biaya Layanan ~4.5%", fontSize = 10.sp, color = Color.Gray)
                            }
                            Switch(
                                checked = isCashback, 
                                onCheckedChange = { isCashback = it },
                                colors = SwitchDefaults.colors(checkedThumbColor = platformColor, checkedTrackColor = platformColor.copy(alpha = 0.5f))
                            )
                        }
                    }
                }
            }

            // CARD 4: PIE CHART ALLOCATION
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "Alokasi Hasil Penjualan", 
                        style = MaterialTheme.typography.titleMedium, 
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    ProfitPieChart(
                        hpp = result.hpp,
                        marketplaceFees = result.marketplaceDeductions,
                        otherCosts = result.totalFixedFees - result.hpp, // subtract HPP as it's grouped separately
                        netProfit = result.netProfit,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
            }

            // CARD 5: DETAILED RESULT BREAKDOWN
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { /* Anchor point for scrolling */ }
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Rincian Laporan Profit", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    
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

                    HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

                    Text("Rincian Potongan:", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Biaya Admin (${result.adminRate}%):", style = MaterialTheme.typography.bodySmall)
                        Text("- Rp ${formatCurrency(result.adminFee)}", style = MaterialTheme.typography.bodySmall, color = Color(0xFFC62828))
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Biaya Layanan (FreeShip/Cashback):", style = MaterialTheme.typography.bodySmall)
                        Text("- Rp ${formatCurrency(result.serviceFee)}", style = MaterialTheme.typography.bodySmall, color = Color(0xFFC62828))
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Affiliate:", style = MaterialTheme.typography.bodySmall)
                        Text("- Rp ${formatCurrency(result.affiliateFee)}", style = MaterialTheme.typography.bodySmall, color = Color(0xFFC62828))
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Biaya Proses Pesanan:", style = MaterialTheme.typography.bodySmall)
                        Text("- Rp ${formatCurrency(result.orderProcessFee)}", style = MaterialTheme.typography.bodySmall, color = Color(0xFFC62828))
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Total Potongan Marketplace:", fontWeight = FontWeight.Medium, style = MaterialTheme.typography.bodySmall)
                        Text("- Rp ${formatCurrency(result.marketplaceDeductions)}", fontWeight = FontWeight.Medium, style = MaterialTheme.typography.bodySmall, color = Color(0xFFC62828))
                    }

                    // Dynamic Net Cash Box
                    Spacer(modifier = Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFE8F5E9))
                            .padding(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Net Cash Diterima", fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32), fontSize = 12.sp)
                                Text("Uang cair ke Saldo Penjual", color = Color(0xFF4CAF50), fontSize = 9.sp)
                            }
                            Text(
                                text = "Rp ${formatCurrency(result.netIncome)}",
                                fontWeight = FontWeight.Black,
                                color = Color(0xFF2E7D32),
                                fontSize = 15.sp
                            )
                        }
                    }
                }
            }

            // CARD 6: SIMULATION & ADS PROJECTION
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "Simulasi & Target Iklan", 
                        style = MaterialTheme.typography.titleMedium, 
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Simple Tab Switches (ROAS vs Sales)
                    TabRow(selectedTabIndex = simTabSelected, modifier = Modifier.height(36.dp)) {
                        Tab(
                            selected = simTabSelected == 0,
                            onClick = { simTabSelected = 0 },
                            text = { Text("ROAS & Ads", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                        )
                        Tab(
                            selected = simTabSelected == 1,
                            onClick = { simTabSelected = 1 },
                            text = { Text("Proyeksi Sales", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))

                    if (simTabSelected == 0) {
                        // ROAS & Ads calculations
                        val roasBe = if (result.netProfit > 0.0) (sellingPrice / result.netProfit) else 0.0
                        val acosBe = result.margin
                        val maxCpc = result.netProfit * (2.0 / 100.0) // 2% CR assumption

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFFE0F2F1))
                                        .padding(10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("ROAS Break Even", fontSize = 9.sp, color = Color(0xFF00796B), fontWeight = FontWeight.Bold)
                                        Text(text = String.format("%.2fx", roasBe), fontSize = 14.sp, fontWeight = FontWeight.Black, color = Color(0xFF00796B))
                                        Text("Min. ROAS agar impas", fontSize = 8.sp, color = Color.Gray, textAlign = TextAlign.Center)
                                    }
                                }

                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFFE8EAF6))
                                        .padding(10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("ACOS Break Even", fontSize = 9.sp, color = Color(0xFF3F51B5), fontWeight = FontWeight.Bold)
                                        Text(text = String.format("%.1f%%", acosBe), fontSize = 14.sp, fontWeight = FontWeight.Black, color = Color(0xFF3F51B5))
                                        Text("Batas maks. iklan per omzet", fontSize = 8.sp, color = Color.Gray, textAlign = TextAlign.Center)
                                    }
                                }
                            }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Max CPC (Est. Conversion Rate 2%):", fontSize = 11.sp, color = Color.Gray)
                                Text("Rp ${formatCurrency(maxCpc)}", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Profit per Unit:", fontSize = 11.sp, color = Color.Gray)
                                Text("Rp ${formatCurrency(result.netProfit)}", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    } else {
                        // Monthly Projections
                        OutlinedTextField(
                            value = monthlySalesInput,
                            onValueChange = { monthlySalesInput = it },
                            label = { Text("Estimasi Penjualan / Bulan (pcs)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(10.dp))

                        val monthlyRevenue = sellingPrice * monthlySales
                        val monthlyProfit = result.netProfit * monthlySales
                        val dailyProfit = monthlyProfit / 30.0

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant)
                                    .padding(8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("Omzet Bulanan", fontSize = 9.sp, color = Color.Gray)
                                    Text("Rp ${formatCurrency(monthlyRevenue)}", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFE8F5E9))
                                    .padding(8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("Profit Bulanan", fontSize = 9.sp, color = Color(0xFF2E7D32))
                                    Text("Rp ${formatCurrency(monthlyProfit)}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFE3F2FD))
                                    .padding(8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("Laba Harian", fontSize = 9.sp, color = Color(0xFF1565C0))
                                    Text("Rp ${formatCurrency(dailyProfit)}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1565C0))
                                }
                            }
                        }
                    }
                }
            }
        }

        // STICKY BOTTOM SUMMARY BAR
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                .background(healthColor)
                .clickable {
                    // Programmatically scroll to results
                    coroutineScope.launch {
                        // Scroll near to the bottom
                        scrollState.animateScrollTo(scrollState.maxValue)
                    }
                }
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Laba: Rp ${formatCurrency(result.netProfit)} / pcs",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Text(
                        text = "Margin: ${formatPercent(result.margin)}% • Status: $healthLabel",
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 11.sp
                    )
                }
                
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Color.White.copy(alpha = 0.2f),
                    modifier = Modifier.padding(start = 8.dp)
                ) {
                    Text(
                        text = "Rincian v",
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
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

