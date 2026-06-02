package com.example.calcucom.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.calcucom.shared.engine.PricingEngine
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.round

data class CostComponent(
    val id: Int,
    val name: String,
    val type: String, // "fixed" or "percent"
    val value: Double
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PriceFinderTab() {
    var hppInput by remember { mutableStateOf("50000") }
    var targetType by remember { mutableStateOf("margin") } // "margin" or "profit"
    var targetValueInput by remember { mutableStateOf("20") }
    var targetProfitType by remember { mutableStateOf("rupiah") } // "rupiah" or "percent"
    var discountInput by remember { mutableStateOf("0") }

    // Toggle for simple (Manual) vs advanced (Otomatis)
    var configMode by remember { mutableStateOf("simple") } // "simple" (Manual) or "advanced" (Otomatis)

    // Manual mode states
    val costComponents = remember { mutableStateListOf<CostComponent>() }
    var nextComponentId by remember { mutableStateOf(1) }

    // Advanced mode states
    var platform by remember { mutableStateOf("shopee") }
    var sellerType by remember { mutableStateOf("nonstar") }
    var categoryGroup by remember { mutableStateOf("A") }
    var isFreeShip by remember { mutableStateOf(false) }
    var isCashback by remember { mutableStateOf(false) }

    // Advanced fee override inputs
    var adminFeePercentInput by remember { mutableStateOf("8.0") }
    var serviceFeePercentInput by remember { mutableStateOf("0.0") }
    var affiliatePercentInput by remember { mutableStateOf("0.0") }
    
    var processFeeInput by remember { mutableStateOf("1250") }
    var fixedFeeInput by remember { mutableStateOf("0") }
    var operationalCostInput by remember { mutableStateOf("0") }

    // Auto update admin fee and service fee when advanced mode inputs change
    LaunchedEffect(platform, sellerType, categoryGroup) {
        val rate = PricingEngine.getAdminRate(platform, sellerType, categoryGroup)
        adminFeePercentInput = rate.toString()
        processFeeInput = if (platform == "lazada") "1000" else "1250"
    }

    LaunchedEffect(platform, isFreeShip, isCashback) {
        val freeShipRate = if (platform == "lazada") 5.0 else 4.0
        val cashbackRate = if (platform == "shopee" && isCashback) 4.5 else 0.0
        val serviceRate = (if (isFreeShip) freeShipRate else 0.0) + cashbackRate
        serviceFeePercentInput = serviceRate.toString()
    }

    // Calculations inputs
    val hpp = hppInput.toDoubleOrNull() ?: 0.0
    val targetValue = targetValueInput.toDoubleOrNull() ?: 0.0
    val discount = discountInput.toDoubleOrNull() ?: 0.0

    // Determine total variables and fixed costs
    var totalFeePct = 0.0
    var fixedCosts = 0.0

    if (configMode == "simple") {
        costComponents.forEach { comp ->
            if (comp.type == "fixed") {
                fixedCosts += comp.value
            } else if (comp.type == "percent") {
                totalFeePct += comp.value
            }
        }
    } else {
        val adminPct = adminFeePercentInput.toDoubleOrNull() ?: 0.0
        val servicePct = serviceFeePercentInput.toDoubleOrNull() ?: 0.0
        val affiliatePct = affiliatePercentInput.toDoubleOrNull() ?: 0.0
        totalFeePct = adminPct + servicePct + affiliatePct
        fixedCosts = (processFeeInput.toDoubleOrNull() ?: 0.0) + 
                     (fixedFeeInput.toDoubleOrNull() ?: 0.0) + 
                     (operationalCostInput.toDoubleOrNull() ?: 0.0)
    }

    // Calculate optimal price
    val effectiveHpp = hpp + fixedCosts
    var sellingPrice = 0.0
    var profit = 0.0
    var margin = 0.0
    var isValid = true
    var optimalPriceFound = false

    if (hpp > 0.0) {
        if (targetType == "margin") {
            if ((targetValue + totalFeePct) >= 100.0) {
                isValid = false
            } else {
                val denominator = 1.0 - (targetValue / 100.0) - (totalFeePct / 100.0)
                if (denominator > 0.0) {
                    sellingPrice = ceil(effectiveHpp / denominator)
                    profit = sellingPrice - effectiveHpp - (sellingPrice * totalFeePct / 100.0)
                    margin = (profit / sellingPrice) * 100.0
                    isValid = true
                    optimalPriceFound = true
                } else {
                    isValid = false
                }
            }
        } else {
            // Target Profit Mode
            val targetProfitAmount = if (targetProfitType == "rupiah") {
                targetValue
            } else {
                effectiveHpp * (targetValue / 100.0)
            }
            val denominator = 1.0 - (totalFeePct / 100.0)
            if (denominator <= 0.0) {
                isValid = false
            } else {
                sellingPrice = ceil((effectiveHpp + targetProfitAmount) / denominator)
                profit = sellingPrice - effectiveHpp - (sellingPrice * totalFeePct / 100.0)
                margin = (profit / sellingPrice) * 100.0
                isValid = true
                optimalPriceFound = true
            }
        }
    }

    // Strikethrough price
    val strikethroughPrice = if (discount > 0.0 && sellingPrice > 0.0) {
        ceil(sellingPrice / (1.0 - discount / 100.0))
    } else {
        0.0
    }

    // Rincian Potongan (breakdown)
    data class FeeBreakdownItem(val label: String, val amount: Double)
    val feeBreakdownItems = mutableListOf<FeeBreakdownItem>()

    if (configMode == "advanced") {
        val adminPct = adminFeePercentInput.toDoubleOrNull() ?: 0.0
        val servicePct = serviceFeePercentInput.toDoubleOrNull() ?: 0.0
        val affiliatePct = affiliatePercentInput.toDoubleOrNull() ?: 0.0
        if (adminPct > 0.0) feeBreakdownItems.add(FeeBreakdownItem("Biaya Admin ($adminPct%)", sellingPrice * adminPct / 100.0))
        if (servicePct > 0.0) feeBreakdownItems.add(FeeBreakdownItem("Biaya Layanan ($servicePct%)", sellingPrice * servicePct / 100.0))
        if (affiliatePct > 0.0) feeBreakdownItems.add(FeeBreakdownItem("Affiliate ($affiliatePct%)", sellingPrice * affiliatePct / 100.0))
        if (fixedCosts > 0.0) feeBreakdownItems.add(FeeBreakdownItem("Biaya Tetap", fixedCosts))
    } else {
        costComponents.forEach { comp ->
            val amt = if (comp.type == "fixed") {
                comp.value
            } else {
                sellingPrice * comp.value / 100.0
            }
            val label = if (comp.type == "percent") "${comp.name} (${comp.value}%)" else comp.name
            feeBreakdownItems.add(FeeBreakdownItem(label, amt))
        }
    }
    // Sort highest impact first
    feeBreakdownItems.sortByDescending { it.amount }
    val totalCalculatedFee = feeBreakdownItems.sumOf { it.amount }

    // Sensitivity Insight
    var sensitivityMsg = ""
    if (sellingPrice > 0.0) {
        val higherTotalPct = totalFeePct + 1.0
        val denominatorHigh = if (targetType == "margin") {
            1.0 - (targetValue / 100.0) - (higherTotalPct / 100.0)
        } else {
            1.0 - (higherTotalPct / 100.0)
        }
        if (denominatorHigh > 0.0) {
            val targetProfitAmount = if (targetType == "margin") 0.0 else {
                if (targetProfitType == "rupiah") targetValue else effectiveHpp * (targetValue / 100.0)
            }
            val higherPrice = if (targetType == "margin") {
                ceil(effectiveHpp / denominatorHigh)
            } else {
                ceil((effectiveHpp + targetProfitAmount) / denominatorHigh)
            }
            val diff = higherPrice - sellingPrice
            sensitivityMsg = "Setiap kenaikan 1% biaya admin menaikkan harga jual ± Rp ${formatCurrency(diff)}"
        } else {
            sensitivityMsg = "Biaya terlalu tinggi, sensitivitas tidak dapat dihitung."
        }
    }

    // Status Indicator & Colors
    val feeRatio = if (sellingPrice > 0.0) (totalCalculatedFee / sellingPrice) * 100.0 else 0.0
    val (statusText, statusBgColor, statusTextColor, gradientBrush) = when {
        !optimalPriceFound -> {
            Quadruple(
                "-",
                Color(0xFFFFFFFF).copy(alpha = 0.2f),
                Color.White,
                Brush.linearGradient(listOf(Color(0xFFF97316), Color(0xFFEF4444)))
            )
        }
        feeRatio > 25.0 || margin < 10.0 -> {
            Quadruple(
                "STATUS: BIAYA TINGGI / MARGIN TIPIS",
                Color(0xFF7F1D1D).copy(alpha = 0.4f),
                Color(0xFFFECDD3),
                Brush.linearGradient(listOf(Color(0xFFEF4444), Color(0xFFC084FC)))
            )
        }
        (feeRatio >= 15.0 && feeRatio <= 25.0) || (margin >= 10.0 && margin < 20.0) -> {
            Quadruple(
                "STATUS: MARGIN STANDAR",
                Color(0xFF78350F).copy(alpha = 0.4f),
                Color(0xFFFEF3C7),
                Brush.linearGradient(listOf(Color(0xFFF59E0B), Color(0xFFF97316)))
            )
        }
        else -> {
            Quadruple(
                "STATUS: SEHAT",
                Color(0xFF064E3B).copy(alpha = 0.4f),
                Color(0xFFD1FAE5),
                Brush.linearGradient(listOf(Color(0xFF10B981), Color(0xFF0D9488)))
            )
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // HPP and Targets Section
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("🏷️", style = MaterialTheme.typography.titleMedium)
                    Text("Price Finder", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
                Text(
                    "Cari harga jual optimal berdasarkan target margin atau profit.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                OutlinedTextField(
                    value = hppInput,
                    onValueChange = { hppInput = it },
                    label = { Text("HPP (Modal Produk)") },
                    prefix = { Text("Rp ") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                // Target Type Choice (Margin vs Profit)
                Text("Target", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                        .padding(2.dp)
                ) {
                    listOf("margin" to "Target Margin (%)", "profit" to "Target Profit").forEach { (type, label) ->
                        val isSelected = targetType == type
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent)
                                .clickable {
                                    targetType = type
                                    targetValueInput = if (type == "margin") "20" else "10000"
                                }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }

                // If Profit, choose Rupiah or Percent of HPP
                if (targetType == "profit") {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                            .padding(2.dp)
                    ) {
                        listOf("rupiah" to "Rupiah (Rp)", "percent" to "Persentase (%)").forEach { (type, label) ->
                            val isSelected = targetProfitType == type
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isSelected) MaterialTheme.colorScheme.secondary else Color.Transparent)
                                    .clickable { targetProfitType = type }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = label,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) MaterialTheme.colorScheme.onSecondary else MaterialTheme.colorScheme.onSurfaceVariant,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }

                OutlinedTextField(
                    value = targetValueInput,
                    onValueChange = { targetValueInput = it },
                    prefix = {
                        if (targetType == "profit" && targetProfitType == "rupiah") {
                            Text("Rp ")
                        }
                    },
                    suffix = {
                        if (targetType == "margin" || (targetType == "profit" && targetProfitType == "percent")) {
                            Text(" %")
                        }
                    },
                    label = {
                        Text(
                            when {
                                targetType == "margin" -> "Target Margin (%)"
                                targetProfitType == "percent" -> "Target Laba (% HPP)"
                                else -> "Target Laba (Rp)"
                            }
                        )
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = discountInput,
                    onValueChange = { discountInput = it },
                    label = { Text("Diskon Toko (%)") },
                    suffix = { Text(" %") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // Fee Configuration Card (Manual vs Otomatis)
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("⚙️", style = MaterialTheme.typography.titleMedium)
                        Text("Konfigurasi Potongan", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                            .padding(2.dp)
                    ) {
                        listOf("simple" to "Manual", "advanced" to "Otomatis").forEach { (mode, label) ->
                            val isSelected = configMode == mode
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isSelected) MaterialTheme.colorScheme.surface else Color.Transparent)
                                    .clickable { configMode = mode }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = label,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }

                if (configMode == "simple") {
                    // Manual Mode
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("🪙", style = MaterialTheme.typography.titleSmall)
                            Text("Komponen Biaya", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = {
                                costComponents.add(
                                    CostComponent(
                                        id = nextComponentId++,
                                        name = "Biaya Lain ${costComponents.size + 1}",
                                        type = "fixed",
                                        value = 0.0
                                    )
                                )
                            },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                            modifier = Modifier.height(28.dp)
                        ) {
                            Icon(Icons.Filled.Add, contentDescription = "Add", modifier = Modifier.size(12.dp))
                            Spacer(Modifier.width(2.dp))
                            Text("Tambah", style = MaterialTheme.typography.labelSmall)
                        }
                    }

                    if (costComponents.isEmpty()) {
                        // Empty State dashed box
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                .padding(vertical = 24.dp, horizontal = 16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("⬆️", fontSize = 18.sp)
                                Text(
                                    "Gunakan Komponen Biaya di atas\nuntuk mengatur potongan marketplace",
                                    style = MaterialTheme.typography.bodySmall,
                                    textAlign = TextAlign.Center,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                )
                            }
                        }
                    } else {
                        // Cost Components List
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            costComponents.forEachIndexed { index, comp ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                        .padding(6.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    OutlinedTextField(
                                        value = comp.name,
                                        onValueChange = {
                                            costComponents[index] = comp.copy(name = it)
                                        },
                                        placeholder = { Text("Nama Biaya", style = MaterialTheme.typography.bodySmall) },
                                        singleLine = true,
                                        textStyle = LocalTextStyle.current.copy(fontSize = 12.sp),
                                        modifier = Modifier.weight(1.3f)
                                    )

                                    // Type toggle (Rp vs %)
                                    Box(
                                        modifier = Modifier
                                            .weight(0.5f)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(MaterialTheme.colorScheme.primaryContainer)
                                            .clickable {
                                                val newType = if (comp.type == "fixed") "percent" else "fixed"
                                                costComponents[index] = comp.copy(type = newType)
                                            }
                                            .padding(vertical = 12.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = if (comp.type == "fixed") "Rp" else "%",
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                                            textAlign = TextAlign.Center
                                        )
                                    }

                                    OutlinedTextField(
                                        value = if (comp.value == 0.0) "" else comp.value.toInt().toString(),
                                        onValueChange = {
                                            val v = it.toDoubleOrNull() ?: 0.0
                                            costComponents[index] = comp.copy(value = v)
                                        },
                                        placeholder = { Text("0", style = MaterialTheme.typography.bodySmall) },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        singleLine = true,
                                        textStyle = LocalTextStyle.current.copy(fontSize = 12.sp),
                                        modifier = Modifier.weight(0.8f)
                                    )

                                    IconButton(
                                        onClick = { costComponents.removeAt(index) },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                                    }
                                }
                            }
                        }
                    }

                    // Presets
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Preset 1: Kemasan
                        AssistChip(
                            onClick = {
                                if (costComponents.none { it.name == "Kemasan/Packing" }) {
                                    costComponents.add(CostComponent(nextComponentId++, "Kemasan/Packing", "fixed", 2000.0))
                                }
                            },
                            label = { Text("Kemasan", fontSize = 10.sp) }
                        )

                        // Preset 2: Admin (13%)
                        AssistChip(
                            onClick = {
                                if (costComponents.none { it.name == "Admin MP" }) {
                                    costComponents.add(CostComponent(nextComponentId++, "Admin MP", "percent", 13.0))
                                }
                            },
                            label = { Text("Admin (13%)", fontSize = 10.sp) }
                        )

                        // Preset 3: Affiliate (10%)
                        AssistChip(
                            onClick = {
                                if (costComponents.none { it.name == "Affiliate" }) {
                                    costComponents.add(CostComponent(nextComponentId++, "Affiliate", "percent", 10.0))
                                }
                            },
                            label = { Text("Affiliate (10%)", fontSize = 10.sp) }
                        )

                        // Preset 4: Proses Pesanan
                        AssistChip(
                            onClick = {
                                if (costComponents.none { it.name == "Biaya Proses Pesanan" }) {
                                    costComponents.add(CostComponent(nextComponentId++, "Biaya Proses Pesanan", "fixed", 1250.0))
                                }
                            },
                            label = { Text("Proses", fontSize = 10.sp) }
                        )
                    }
                } else {
                    // Otomatis (Advanced) Mode
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        // Marketplace Row
                        Text("Marketplace:", style = MaterialTheme.typography.bodySmall)
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

                        // Seller Type Row
                        Text("Tipe Penjual:", style = MaterialTheme.typography.bodySmall)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            val types = if (platform == "tokopedia") listOf("regular", "power", "mall") else listOf("nonstar", "star", "mall")
                            types.forEach { type ->
                                val isSelected = sellerType == type
                                OutlinedButton(
                                    onClick = { sellerType = type },
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent
                                    ),
                                    modifier = Modifier.weight(1f),
                                    contentPadding = PaddingValues(0.dp)
                                ) {
                                    Text(type.uppercase(), style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }

                        // Category Group selector (A-F)
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
                                    modifier = Modifier.weight(1f),
                                    contentPadding = PaddingValues(0.dp)
                                ) {
                                    Text(grp)
                                }
                            }
                        }

                        // Service Program Toggles
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Gratis Ongkir Xtra", style = MaterialTheme.typography.bodyMedium)
                                Text("~4.0% (Lazada 5.0%)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f))
                            }
                            Switch(checked = isFreeShip, onCheckedChange = { isFreeShip = it })
                        }

                        if (platform == "shopee") {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Cashback Xtra", style = MaterialTheme.typography.bodyMedium)
                                    Text("4.5% (Cap 60rb)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f))
                                }
                                Switch(checked = isCashback, onCheckedChange = { isCashback = it })
                            }
                        }

                        Divider(modifier = Modifier.padding(vertical = 4.dp))

                        // Fee override grid
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = adminFeePercentInput,
                                onValueChange = { adminFeePercentInput = it },
                                label = { Text("Admin (%)") },
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = serviceFeePercentInput,
                                onValueChange = { serviceFeePercentInput = it },
                                label = { Text("Layanan (%)") },
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = affiliatePercentInput,
                                onValueChange = { affiliatePercentInput = it },
                                label = { Text("Affiliate (%)") },
                                modifier = Modifier.weight(1f)
                            )
                        }

                        // Other Costs
                        Text("Biaya Lainnya", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = processFeeInput,
                                onValueChange = { processFeeInput = it },
                                label = { Text("Biaya Proses (Rp)") },
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = fixedFeeInput,
                                onValueChange = { fixedFeeInput = it },
                                label = { Text("Biaya Transaksi (Rp)") },
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = operationalCostInput,
                                onValueChange = { operationalCostInput = it },
                                label = { Text("Biaya Packing/Lain (Rp)") },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }

        // Hasil Perhitungan Card
        if (!isValid) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(gradientBrush)
                    .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
            ) {
                Column(
                    modifier = Modifier
                        .background(gradientBrush)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .background(statusBgColor, RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "❌ TARGET TIDAK REALISTIS",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 11.sp
                        )
                    }

                    Text("Harga Jual Optimal", style = MaterialTheme.typography.titleSmall, color = Color.White.copy(alpha = 0.8f))
                    Text("Tidak Diketahui", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold, color = Color.White)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Profit", color = Color.White.copy(alpha = 0.8f))
                        Text("Rp 0", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Margin", color = Color.White.copy(alpha = 0.8f))
                        Text("0%", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Total Potongan", color = Color.White.copy(alpha = 0.8f))
                        Text("Biaya > Harga", fontWeight = FontWeight.Bold, color = Color.White)
                    }

                    // Explanatory Strategic Advice
                    Spacer(modifier = Modifier.height(4.dp))
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(" Mengapa ini terjadi?", fontWeight = FontWeight.Bold, color = Color(0xFFFF8A80))
                        val totalFee = totalFeePct
                        val targetMargin = targetValue
                        Text(
                            "Total biaya (${totalFee}%) ditambah Target Margin (${targetMargin}%) = ${(totalFee + targetMargin)}%.\nMelebihi 100% harga jual, sehingga tidak dapat dihitung.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("💡 Saran Strategis:", fontWeight = FontWeight.Bold, color = Color(0xFFFFD54F))
                        val maxMargin = maxOf(0.0, 100.0 - totalFee - 1.0)
                        Text("• Turunkan target margin menjadi ${maxMargin.toInt()}% atau kurang.", style = MaterialTheme.typography.bodySmall, color = Color.White)
                        Text("• Kurangi komponen biaya (seperti affiliate atau layanan).", style = MaterialTheme.typography.bodySmall, color = Color.White)
                        Text("• Gunakan mode Target Profit (Rp) untuk simulasi yang lebih aman.", style = MaterialTheme.typography.bodySmall, color = Color.White)
                    }
                }
            }
        } else {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(gradientBrush)
                    .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
            ) {
                Column(
                    modifier = Modifier
                        .background(gradientBrush)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Context / status badges
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Hasil Perhitungan", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Color.White)
                        
                        val badgeText = if (configMode == "advanced") "ESTIMASI MARKETPLACE (AUTO)" else "SIMULASI MANUAL (CUSTOM)"
                        Box(
                            modifier = Modifier
                                .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = badgeText,
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 9.sp
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        val targetSummaryStr = if (targetType == "margin") "Margin $targetValue%" else {
                            if (targetProfitType == "rupiah") "Profit Rp ${formatCurrency(targetValue)}" else "Profit $targetValue% HPP"
                        }
                        Column {
                            Text("Target", style = MaterialTheme.typography.labelSmall, color = Color.White.copy(alpha = 0.8f))
                            Text(targetSummaryStr, fontWeight = FontWeight.Bold, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("HPP", style = MaterialTheme.typography.labelSmall, color = Color.White.copy(alpha = 0.8f))
                            Text("Rp ${formatCurrency(hpp)}", fontWeight = FontWeight.Bold, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                        }
                    }

                    Divider(modifier = Modifier.padding(vertical = 2.dp), color = Color.White.copy(alpha = 0.2f))

                    Text("Harga Jual Optimal", style = MaterialTheme.typography.titleSmall, color = Color.White.copy(alpha = 0.8f))
                    Text("Rp ${formatCurrency(sellingPrice)}", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold, color = Color.White)
                    
                    Box(
                        modifier = Modifier
                            .background(statusBgColor, RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = statusText,
                            fontWeight = FontWeight.Bold,
                            color = statusTextColor,
                            fontSize = 10.sp
                        )
                    }

                    // Strikethrough/Core Price if discount is > 0
                    if (discount > 0.0 && sellingPrice > 0.0) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Harga Core (Coret): ", style = MaterialTheme.typography.bodySmall, color = Color.White.copy(alpha = 0.8f))
                            Text(
                                "Rp ${formatCurrency(strikethroughPrice)}",
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                style = MaterialTheme.typography.bodySmall,
                                textDecoration = TextDecoration.LineThrough
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Profit per Item", style = MaterialTheme.typography.labelSmall, color = Color.White.copy(alpha = 0.8f))
                            Text("Rp ${formatCurrency(profit)}", fontWeight = FontWeight.Bold, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("Margin Aktual", style = MaterialTheme.typography.labelSmall, color = Color.White.copy(alpha = 0.8f))
                            Text("${formatPercent(margin)}%", fontWeight = FontWeight.Bold, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                        }
                    }

                    Divider(modifier = Modifier.padding(vertical = 4.dp), color = Color.White.copy(alpha = 0.2f))

                    // Rincian Potongan
                    Text("RINCIAN POTONGAN (Est. Contrib)", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall, color = Color.White)
                    if (feeBreakdownItems.isEmpty()) {
                        Text("Tidak ada potongan", style = MaterialTheme.typography.bodySmall, color = Color.White.copy(alpha = 0.6f), modifier = Modifier.padding(vertical = 4.dp))
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(vertical = 4.dp)) {
                            feeBreakdownItems.forEach { item ->
                                val contrib = if (totalCalculatedFee > 0.0) (item.amount / totalCalculatedFee) * 100.0 else 0.0
                                Column {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(item.label, style = MaterialTheme.typography.bodySmall, color = Color.White)
                                            Text("${contrib.toInt()}% dari total fee", fontSize = 8.sp, color = Color.White.copy(alpha = 0.6f))
                                        }
                                        Text("-Rp ${formatCurrency(item.amount)}", fontWeight = FontWeight.Bold, color = Color.White, style = MaterialTheme.typography.bodySmall)
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    // Progress bar contribution indicator
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(2.dp)
                                            .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(1.dp))
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxHeight()
                                                .fillMaxWidth(fraction = (contrib / 100.0).toFloat().coerceIn(0f, 1f))
                                                .background(Color.White.copy(alpha = 0.6f), RoundedCornerShape(1.dp))
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Divider(modifier = Modifier.padding(vertical = 2.dp), color = Color.White.copy(alpha = 0.2f))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("TOTAL POTONGAN", fontWeight = FontWeight.Bold, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                        Text("-Rp ${formatCurrency(totalCalculatedFee)}", fontWeight = FontWeight.Bold, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                    }

                    // Sensitivity Insight
                    if (sensitivityMsg.isNotBlank()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "💡 $sensitivityMsg",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.9f),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            // Psychological pricing options
            val suggestions = PricingEngine.generatePsychologicalPrices(sellingPrice)
            if (suggestions.isNotEmpty()) {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Saran Harga Psikologis", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        
                        suggestions.forEach { sug ->
                            val sugPrice = sug["price"] as Double
                            val sugLabel = sug["label"] as String
                            val sugPattern = sug["pattern"] as String

                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(sugLabel, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
                                    Text(sugPattern, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Text("Rp ${formatCurrency(sugPrice)}", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
                            }
                        }
                    }
                }
            }
        }
    }
}

data class Quadruple<A, B, C, D>(
    val first: A,
    val second: B,
    val third: C,
    val fourth: D
)
