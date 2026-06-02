package com.example.calcucom.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.calcucom.shared.engine.PricingEngine

@Composable
fun PriceFinderTab() {
    var hppInput by remember { mutableStateOf("50000") }
    var targetType by remember { mutableStateOf("margin") } // "margin" or "profit"
    var targetValueInput by remember { mutableStateOf("15") }
    var targetProfitType by remember { mutableStateOf("rupiah") } // "rupiah" or "percent"
    var totalFeePercentInput by remember { mutableStateOf("10") }
    var fixedCostsInput by remember { mutableStateOf("1250") }

    val hpp = hppInput.toDoubleOrNull() ?: 0.0
    val targetValue = targetValueInput.toDoubleOrNull() ?: 0.0
    val totalFeePercent = totalFeePercentInput.toDoubleOrNull() ?: 0.0
    val fixedCosts = fixedCostsInput.toDoubleOrNull() ?: 0.0

    // Reverse pricing calculation
    val result = PricingEngine.calculateOptimalPrice(
        hpp = hpp,
        targetType = targetType,
        targetValue = targetValue,
        targetProfitType = targetProfitType,
        totalFeePercent = totalFeePercent,
        fixedCosts = fixedCosts
    )

    val isValid = result["isValid"] as? Boolean ?: true
    val errorMessage = result["errorMessage"] as? String ?: ""
    val sellingPrice = result["sellingPrice"] as? Double ?: 0.0
    val profit = result["profit"] as? Double ?: 0.0
    val margin = result["margin"] as? Double ?: 0.0

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Target Profitabilitas", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                OutlinedTextField(
                    value = hppInput,
                    onValueChange = { hppInput = it },
                    label = { Text("HPP Modal Produk (Rp)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                // Target Type Choice
                Text("Tipe Target:", style = MaterialTheme.typography.bodySmall)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("margin" to "Margin (%)", "profit" to "Laba Bersih").forEach { (type, label) ->
                        val isSelected = targetType == type
                        OutlinedButton(
                            onClick = {
                                targetType = type
                                targetValueInput = if (type == "margin") "15" else "20000"
                            },
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else androidx.compose.ui.graphics.Color.Transparent
                            ),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(label)
                        }
                    }
                }

                // If Laba Bersih, choose Rupiah or Percent of HPP
                if (targetType == "profit") {
                    Text("Tipe Laba:", style = MaterialTheme.typography.bodySmall)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("rupiah" to "Rupiah (Rp)", "percent" to "Persen HPP (%)").forEach { (type, label) ->
                            val isSelected = targetProfitType == type
                            OutlinedButton(
                                onClick = { targetProfitType = type },
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else androidx.compose.ui.graphics.Color.Transparent
                                ),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(label)
                            }
                        }
                    }
                }

                OutlinedTextField(
                    value = targetValueInput,
                    onValueChange = { targetValueInput = it },
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
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Estimasi Biaya & Admin", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = totalFeePercentInput,
                        onValueChange = { totalFeePercentInput = it },
                        label = { Text("Estimasi Total Fee (%)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = fixedCostsInput,
                        onValueChange = { fixedCostsInput = it },
                        label = { Text("Biaya Tetap/Proses (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Calculation Output Card
        if (!isValid) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
            ) {
                Text(
                    text = errorMessage,
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    fontWeight = FontWeight.Bold
                )
            }
        } else {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Hasil Analisa Harga Jual", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onTertiaryContainer)
                    
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Harga Jual Minimum:", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        Text("Rp ${formatCurrency(sellingPrice)}", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.tertiary)
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Estimasi Laba Bersih:")
                        Text("Rp ${formatCurrency(profit)}")
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Estimasi Margin:")
                        Text("${formatPercent(margin)}%")
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
