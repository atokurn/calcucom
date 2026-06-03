package com.example.calcucom.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ProfitPieChart(
    hpp: Double,
    marketplaceFees: Double,
    otherCosts: Double,
    netProfit: Double,
    modifier: Modifier = Modifier
) {
    val total = hpp + marketplaceFees + otherCosts + maxOf(0.0, netProfit)
    if (total <= 0.0) {
        Box(
            modifier = modifier.clip(CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text("Belum ada data", fontSize = 12.sp, color = Color.Gray)
        }
        return
    }

    val hppAngle = (hpp / total * 360.0).toFloat()
    val feeAngle = (marketplaceFees / total * 360.0).toFloat()
    val otherAngle = (otherCosts / total * 360.0).toFloat()
    val profitAngle = (maxOf(0.0, netProfit) / total * 360.0).toFloat()

    val hppPct = (hpp / total * 100.0)
    val feePct = (marketplaceFees / total * 100.0)
    val otherPct = (otherCosts / total * 100.0)
    val profitPct = (maxOf(0.0, netProfit) / total * 100.0)

    // Color Palette matching Web
    val hppColor = Color(0xFFEF5350) // Light Red
    val feeColor = Color(0xFFAB47BC) // Purple
    val otherColor = Color(0xFFFFA726) // Orange
    val profitColor = Color(0xFF66BB6A) // Light Green

    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(130.dp)
                .padding(8.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                var startAngle = -90f
                
                // Draw HPP
                if (hppAngle > 0f) {
                    drawArc(
                        color = hppColor,
                        startAngle = startAngle,
                        sweepAngle = hppAngle,
                        useCenter = false,
                        style = Stroke(width = 20.dp.toPx())
                    )
                    startAngle += hppAngle
                }
                
                // Draw Marketplace Fees
                if (feeAngle > 0f) {
                    drawArc(
                        color = feeColor,
                        startAngle = startAngle,
                        sweepAngle = feeAngle,
                        useCenter = false,
                        style = Stroke(width = 20.dp.toPx())
                    )
                    startAngle += feeAngle
                }
                
                // Draw Other Costs
                if (otherAngle > 0f) {
                    drawArc(
                        color = otherColor,
                        startAngle = startAngle,
                        sweepAngle = otherAngle,
                        useCenter = false,
                        style = Stroke(width = 20.dp.toPx())
                    )
                    startAngle += otherAngle
                }
                
                // Draw Net Profit
                if (profitAngle > 0f) {
                    drawArc(
                        color = profitColor,
                        startAngle = startAngle,
                        sweepAngle = profitAngle,
                        useCenter = false,
                        style = Stroke(width = 20.dp.toPx())
                    )
                }
            }
            
            // Text in center
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "Margin",
                    fontSize = 10.sp,
                    color = Color.Gray
                )
                val divisor = total - maxOf(0.0, netProfit) + netProfit
                val calculatedMargin = if (divisor > 0.0) (netProfit / divisor * 100.0) else 0.0
                Text(
                    text = String.format("%.1f%%", if (calculatedMargin.isNaN()) 0.0 else calculatedMargin),
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (netProfit >= 0.0) profitColor else hppColor
                )
            }
        }

        // Legend Column
        Column(
            modifier = Modifier.weight(1.5f),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            LegendItem(label = "HPP (Modal)", pct = hppPct, color = hppColor)
            LegendItem(label = "Potongan Mkt", pct = feePct, color = feeColor)
            LegendItem(label = "Biaya Lain", pct = otherPct, color = otherColor)
            LegendItem(label = "Laba Bersih", pct = profitPct, color = profitColor)
        }
    }
}

@Composable
private fun LegendItem(label: String, pct: Double, color: Color) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(color)
        )
        Text(
            text = "$label: ${String.format("%.1f%%", pct)}",
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
