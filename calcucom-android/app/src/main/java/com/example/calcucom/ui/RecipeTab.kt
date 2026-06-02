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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecipeTab() {
    var recipeName by remember { mutableStateOf("Kue Kering Cokelat") }
    var yieldQtyInput by remember { mutableStateOf("12") }
    var targetQtyInput by remember { mutableStateOf("50") }
    var targetMarginInput by remember { mutableStateOf("35") }
    var salesChannel by remember { mutableStateOf("offline") } // "offline" or "marketplace"
    var customFeeInput by remember { mutableStateOf("8.0") }
    var sellingPriceInput by remember { mutableStateOf("15000") }

    val yieldQty = yieldQtyInput.toIntOrNull()?.coerceAtLeast(1) ?: 12
    val targetQty = targetQtyInput.toIntOrNull()?.coerceAtLeast(1) ?: 50
    val targetMargin = targetMarginInput.toDoubleOrNull() ?: 35.0
    val customFee = if (salesChannel == "marketplace") (customFeeInput.toDoubleOrNull() ?: 8.0) else 0.0
    var sellingPrice = sellingPriceInput.toDoubleOrNull() ?: 15000.0

    // List of Ingredients
    val ingredients = remember {
        mutableStateListOf(
            RecipeIngredient("Tepung Terigu", buyPrice = 12000.0, packageSize = 1000.0, packageUnit = "gram", recipeQty = 250.0, recipeUnit = "gram"),
            RecipeIngredient("Telur", buyPrice = 28000.0, packageSize = 16.0, packageUnit = "butir", recipeQty = 4.0, recipeUnit = "butir"),
            RecipeIngredient("Mentega", buyPrice = 45000.0, packageSize = 500.0, packageUnit = "gram", recipeQty = 200.0, recipeUnit = "gram")
        )
    }

    // List of Overheads
    val overheads = remember {
        mutableStateListOf(
            RecipeOverhead("Mika Kemasan", type = "per_unit", cost = 1500.0),
            RecipeOverhead("Gas & Listrik", type = "per_batch", cost = 10000.0)
        )
    }

    // Input fields for new ingredient
    var ingName by remember { mutableStateOf("") }
    var ingBuyPrice by remember { mutableStateOf("") }
    var ingPkgSize by remember { mutableStateOf("") }
    var ingPkgUnit by remember { mutableStateOf("gram") }
    var ingUseQty by remember { mutableStateOf("") }
    var ingUseUnit by remember { mutableStateOf("gram") }

    // Input fields for new overhead
    var ovrName by remember { mutableStateOf("") }
    var ovrType by remember { mutableStateOf("per_unit") }
    var ovrCost by remember { mutableStateOf("") }

    // Calculations
    val totalRecipeCost = ingredients.sumOf { calculateIngredientCost(it) }
    val totalBatchOverhead = overheads.filter { it.type == "per_batch" }.sumOf { it.cost }
    val totalUnitOverhead = overheads.filter { it.type == "per_unit" }.sumOf { it.cost }

    val recipeCostPerUnit = totalRecipeCost / yieldQty
    val batchOverheadPerUnit = totalBatchOverhead / yieldQty
    val totalHppPerUnit = recipeCostPerUnit + batchOverheadPerUnit + totalUnitOverhead

    // Recommended Price based on Target Margin
    val divisor = 1.0 - (targetMargin / 100.0) - (customFee / 100.0)
    val recommendedPrice = if (divisor > 0.0) totalHppPerUnit / divisor else totalHppPerUnit * (1.0 + targetMargin / 100.0)
    
    // Live profit analysis
    val commissionCost = sellingPrice * (customFee / 100.0)
    val netProfit = sellingPrice - totalHppPerUnit - commissionCost
    val actualMargin = if (sellingPrice > 0.0) (netProfit / sellingPrice) * 100.0 else 0.0

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Recipe Header Configuration
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Konfigurasi Resep HPP", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                OutlinedTextField(
                    value = recipeName,
                    onValueChange = { recipeName = it },
                    label = { Text("Nama Resep") },
                    modifier = Modifier.fillMaxWidth()
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = yieldQtyInput,
                        onValueChange = { yieldQtyInput = it },
                        label = { Text("Hasil Porsi/Batch") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = targetQtyInput,
                        onValueChange = { targetQtyInput = it },
                        label = { Text("Target Produksi") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Ingredients Section
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Bahan Baku", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                ingredients.forEachIndexed { idx, ing ->
                    val cost = calculateIngredientCost(ing)
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(ing.name, fontWeight = FontWeight.SemiBold)
                            Text("Beli: Rp ${formatCurrency(ing.buyPrice)} / ${formatQty(ing.packageSize)} ${ing.packageUnit}", style = MaterialTheme.typography.bodySmall)
                            Text("Pakai: ${formatQty(ing.recipeQty)} ${ing.recipeUnit}", style = MaterialTheme.typography.bodySmall)
                        }
                        Text("Rp ${formatCurrency(cost)}", fontWeight = FontWeight.Bold)
                        IconButton(onClick = { ingredients.removeAt(idx) }) {
                            Text("✖", color = MaterialTheme.colorScheme.error)
                        }
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 8.dp))

                Text("Tambah Bahan Baku:", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                OutlinedTextField(
                    value = ingName,
                    onValueChange = { ingName = it },
                    label = { Text("Nama Bahan (cth: Tepung)") },
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = ingBuyPrice,
                        onValueChange = { ingBuyPrice = it },
                        label = { Text("Harga Beli (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = ingPkgSize,
                        onValueChange = { ingPkgSize = it },
                        label = { Text("Ukuran Pack") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = ingPkgUnit,
                        onValueChange = { ingPkgUnit = it },
                        label = { Text("Unit") },
                        modifier = Modifier.weight(0.8f)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = ingUseQty,
                        onValueChange = { ingUseQty = it },
                        label = { Text("Berat Pakai") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = ingUseUnit,
                        onValueChange = { ingUseUnit = it },
                        label = { Text("Unit Pakai") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Button(
                    onClick = {
                        if (ingName.isNotBlank() && ingBuyPrice.isNotBlank() && ingPkgSize.isNotBlank() && ingUseQty.isNotBlank()) {
                            ingredients.add(
                                RecipeIngredient(
                                    name = ingName,
                                    buyPrice = ingBuyPrice.toDoubleOrNull() ?: 0.0,
                                    packageSize = ingPkgSize.toDoubleOrNull() ?: 1.0,
                                    packageUnit = ingPkgUnit,
                                    recipeQty = ingUseQty.toDoubleOrNull() ?: 0.0,
                                    recipeUnit = ingUseUnit
                                )
                            )
                            ingName = ""
                            ingBuyPrice = ""
                            ingPkgSize = ""
                            ingUseQty = ""
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                ) {
                    Text("Tambah Bahan")
                }
            }
        }

        // Overheads Section
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Biaya Overhead & Operasional", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                overheads.forEachIndexed { idx, ovr ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(ovr.name, fontWeight = FontWeight.SemiBold)
                            Text(if (ovr.type == "per_batch") "Per Batch Resep" else "Per Unit Hasil", style = MaterialTheme.typography.bodySmall)
                        }
                        Text("Rp ${formatCurrency(ovr.cost)}", fontWeight = FontWeight.Bold)
                        IconButton(onClick = { overheads.removeAt(idx) }) {
                            Text("✖", color = MaterialTheme.colorScheme.error)
                        }
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 8.dp))

                Text("Tambah Biaya Overhead:", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                OutlinedTextField(
                    value = ovrName,
                    onValueChange = { ovrName = it },
                    label = { Text("Nama Biaya (cth: Kemasan)") },
                    modifier = Modifier.fillMaxWidth()
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = ovrCost,
                        onValueChange = { ovrCost = it },
                        label = { Text("Biaya (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    TextButton(
                        onClick = { ovrType = if (ovrType == "per_batch") "per_unit" else "per_batch" },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(if (ovrType == "per_batch") "Batch" else "Unit")
                    }
                }

                Button(
                    onClick = {
                        if (ovrName.isNotBlank() && ovrCost.isNotBlank()) {
                            overheads.add(
                                RecipeOverhead(
                                    name = ovrName,
                                    type = ovrType,
                                    cost = ovrCost.toDoubleOrNull() ?: 0.0
                                )
                            )
                            ovrName = ""
                            ovrCost = ""
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                ) {
                    Text("Tambah Overhead")
                }
            }
        }

        // HPP Summary Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Analisa HPP & Biaya Produksi", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("HPP per Unit Hasil:")
                    Text("Rp ${formatCurrency(totalHppPerUnit)}", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total Biaya Bahan Baku:")
                    Text("Rp ${formatCurrency(totalRecipeCost)}")
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total Overhead Batch:")
                    Text("Rp ${formatCurrency(totalBatchOverhead)}")
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total Overhead Unit:")
                    Text("Rp ${formatCurrency(totalUnitOverhead)}")
                }
            }
        }

        // Pricing Simulator Card
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Simulator Harga Jual & Profit", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("offline" to "Offline", "marketplace" to "Online Marketplace").forEach { (channel, label) ->
                        val isSelected = salesChannel == channel
                        OutlinedButton(
                            onClick = { salesChannel = channel },
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent
                            ),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(label)
                        }
                    }
                }

                if (salesChannel == "marketplace") {
                    OutlinedTextField(
                        value = customFeeInput,
                        onValueChange = { customFeeInput = it },
                        label = { Text("Estimasi Biaya Admin Marketplace (%)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = targetMarginInput,
                        onValueChange = { targetMarginInput = it },
                        label = { Text("Target Margin (%)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = sellingPriceInput,
                        onValueChange = { sellingPriceInput = it },
                        label = { Text("Harga Jual Aktif (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1.2f)
                    )
                }

                Divider(modifier = Modifier.padding(vertical = 4.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Rekomendasi Harga Jual:")
                    Text("Rp ${formatCurrency(recommendedPrice)}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }

                val statusColor = if (netProfit <= 0.0) Color(0xFFC62828) else if (actualMargin < targetMargin) Color(0xFFF57C00) else Color(0xFF2E7D32)
                val statusText = if (netProfit <= 0.0) "RUGI" else if (actualMargin < targetMargin) "PROFIT TIPIS (Di bawah target)" else "PROFIT SEHAT"

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Margin Sebenarnya:")
                    Text("${formatPercent(actualMargin)}% ($statusText)", fontWeight = FontWeight.Bold, color = statusColor)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Laba Bersih per Porsi:")
                    Text("Rp ${formatCurrency(netProfit)}", fontWeight = FontWeight.Bold, color = statusColor)
                }
            }
        }
    }
}

// Helpers for recipe unit logic
data class RecipeIngredient(
    val name: String,
    val buyPrice: Double,
    val packageSize: Double,
    val packageUnit: String,
    val recipeQty: Double,
    val recipeUnit: String
)

data class RecipeOverhead(
    val name: String,
    val type: String,
    val cost: Double
)

fun calculateIngredientCost(item: RecipeIngredient): Double {
    if (item.packageSize <= 0.0 || item.buyPrice <= 0.0 || item.recipeQty <= 0.0) return 0.0
    val mult = getUnitMultiplier(item.packageUnit, item.recipeUnit) ?: return (item.buyPrice * item.recipeQty) / item.packageSize
    val packageSizeInRecipeUnit = item.packageSize * mult
    if (packageSizeInRecipeUnit <= 0.0) return 0.0
    return (item.buyPrice * item.recipeQty) / packageSizeInRecipeUnit
}

fun getUnitMultiplier(fromUnit: String, toUnit: String): Double? {
    val from = getUnitFactor(fromUnit) ?: return 1.0
    val to = getUnitFactor(toUnit) ?: return 1.0
    if (from.category != to.category) return null
    return from.factor / to.factor
}

data class UnitFactor(val category: String, val factor: Double)

fun getUnitFactor(unit: String): UnitFactor? {
    return when (unit.lowercase()) {
        "gram" -> UnitFactor("weight", 1.0)
        "kg" -> UnitFactor("weight", 1000.0)
        "ml" -> UnitFactor("volume", 1.0)
        "liter" -> UnitFactor("volume", 1000.0)
        "sdm" -> UnitFactor("weight", 15.0)
        "sdt" -> UnitFactor("weight", 5.0)
        "butir", "buah", "lembar", "pcs", "pack" -> UnitFactor("piece", 1.0)
        else -> null
    }
}

fun formatQty(value: Double): String {
    return if (value == value.toInt().toDouble()) value.toInt().toString() else String.format("%.2f", value)
}
