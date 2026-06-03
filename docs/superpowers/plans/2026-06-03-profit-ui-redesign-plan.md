# Navigation Drawer & Profit Calculator UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the main application shell of the Android app to use a Navigation Drawer, and rewrite the Profit Calculator tab to feature a premium visual UI aligned with the web version including a sticky bottom summary, a native Canvas-based Pie Chart, and advanced simulation panels.

**Architecture:** Utilize Material 3 ModalNavigationDrawer as the primary shell navigation. Use a Single Scrollable layout for the Profit Calculator tab containing responsive platform cards, configuration forms, a Canvas-drawn Pie Chart, and interactive ROAS/Sales projection views with a floating sticky bottom sheet.

**Tech Stack:** Kotlin, Jetpack Compose, Material 3, Android SDK.

---

### Task 1: Refactor Navigation Shell to ModalNavigationDrawer

**Files:**
*   Modify: `calcucom-android/app/src/main/java/com/example/calcucom/ui/MainDashboardScreen.kt`

- [ ] **Step 1: Replace main navigation tabs with ModalNavigationDrawer**
    Update `MainDashboardScreen.kt` to structure the navigation using `ModalNavigationDrawer`, `ModalDrawerSheet`, and `NavigationDrawerItem`. Add a top App Bar with a menu toggle button.
    
    ```kotlin
    package com.example.calcucom.ui

    import androidx.compose.foundation.layout.*
    import androidx.compose.material3.*
    import androidx.compose.runtime.*
    import androidx.compose.ui.Modifier
    import androidx.compose.ui.unit.dp
    import androidx.compose.material.icons.Icons
    import androidx.compose.material.icons.filled.*
    import kotlinx.coroutines.launch

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    fun MainDashboardScreen() {
        var selectedTab by remember { mutableStateOf(0) }
        val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
        val scope = rememberCoroutineScope()
        
        val tabs = listOf(
            TabItem("Profit Calculator", Icons.Default.ShoppingCart),
            TabItem("Price Finder", Icons.Default.Star),
            TabItem("Bundling", Icons.Default.Build),
            TabItem("ROAS", Icons.Default.Info),
            TabItem("Resep", Icons.Default.List)
        )

        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                ModalDrawerSheet {
                    Spacer(modifier = Modifier.height(16.dp))
                    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
                        Text(
                            text = "CekBiayaJualan",
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "Super Calculator & Analytics",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Divider(modifier = Modifier.padding(vertical = 12.dp))
                    tabs.forEachIndexed { index, tab ->
                        NavigationDrawerItem(
                            label = { Text(tab.title) },
                            selected = selectedTab == index,
                            onClick = {
                                selectedTab = index
                                scope.launch { drawerState.close() }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.title) },
                            modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                        )
                    }
                }
            }
        ) {
            Scaffold(
                topBar = {
                    TopAppBar(
                        title = {
                            Column {
                                Text(
                                    text = "CekBiayaJualan",
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = tabs[selectedTab].title,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        },
                        navigationIcon = {
                            IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                Icon(Icons.Default.Menu, contentDescription = "Menu")
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer,
                            titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    )
                }
            ) { paddingValues ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                ) {
                    when (selectedTab) {
                        0 -> ProfitCalculatorTab()
                        1 -> PriceFinderTab()
                        2 -> BundlingTab()
                        3 -> AdsRoasTab()
                        4 -> RecipeTab()
                    }
                }
            }
        }
    }
    ```

- [ ] **Step 2: Verify compile success for the navigation shell**
    Run: `./gradlew :app:assembleDebug` in directory `/Volumes/ScutiEX/ScutiEX/antigravity/calcu/calcucom/calcucom-android`
    Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit navigation changes**
    ```bash
    git add calcucom-android/app/src/main/java/com/example/calcucom/ui/MainDashboardScreen.kt
    git commit -m "feat: refactor main shell navigation to ModalNavigationDrawer"
    ```

---

### Task 2: Create Custom Canvas Pie Chart Component

**Files:**
*   Create: `calcucom-android/app/src/main/java/com/example/calcucom/ui/components/ProfitPieChart.kt`

- [ ] **Step 1: Write the custom Canvas-based Pie Chart component**
    Create `ProfitPieChart.kt` to draw a modern pie chart showing the percentage breakdown of HPP, Marketplace Fees, Other Costs, and Net Profit.
    
    ```kotlin
    package com.example.calcucom.ui.components

    import androidx.compose.foundation.Canvas
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
                    .size(140.dp)
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
                            style = Stroke(width = 24.dp.toPx())
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
                            style = Stroke(width = 24.dp.toPx())
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
                            style = Stroke(width = 24.dp.toPx())
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
                            style = Stroke(width = 24.dp.toPx())
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
                    Text(
                        text = String.format("%.1f%%", (netProfit / (total - maxOf(0.0, netProfit) + netProfit) * 100.0).let { if (it.isNaN()) 0.0 else it }),
                        fontSize = 16.sp,
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
    ```

- [ ] **Step 2: Verify compilation of custom Canvas Pie Chart**
    Run: `./gradlew :app:assembleDebug` in directory `/Volumes/ScutiEX/ScutiEX/antigravity/calcu/calcucom/calcucom-android`
    Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit components**
    ```bash
    git add calcucom-android/app/src/main/java/com/example/calcucom/ui/components/ProfitPieChart.kt
    git commit -m "feat: implement native Canvas-based ProfitPieChart component"
    ```

---

### Task 3: Redesign Profit Calculator Input & Configuration Section

**Files:**
*   Modify: `calcucom-android/app/src/main/java/com/example/calcucom/ui/ProfitCalculatorTab.kt`

- [ ] **Step 1: Redesign Platform Card, Store Config Card, and Price Input Card**
    Redesign the inputs to use highly curated marketplace accent colors (Shopee Orange: `#EE4D2D`, Tokopedia Green: `#03AC0E`, Tiktok Dark, Lazada Blue: `#10156F`). Add realtime final selling price display.
    We will modify the core input column of `ProfitCalculatorTab()`.
    
    ```kotlin
    // Keep top section declarations... Modify the Column content to style:
    // Platform Selection buttons using custom colors
    // Store configurations (seller type, category group quick button row, program switches)
    // Pricing strategy (SKU Name, HPP, Selling Price, Discount with Final price, Voucher, Affiliate, Process Fee, Operational Cost, Ads Cost, and Target Monthly Sales pcs input)
    ```
    
    Let's draft the updated layout structure of `ProfitCalculatorTab.kt`:
    We need to replace the entire `ProfitCalculatorTab.kt` content with the beautiful redesign. Let's do this as a unified layout first. Let's read the code and write it fully.
    We will include:
    - Target Monthly Sales Input: `var monthlySalesInput by remember { mutableStateOf("100") }`
    - Formatted Text Fields with scrollability
    - Clear state updates

---

### Task 4: Implement Floating Sticky Bottom Summary Bar & Detailed Results Section

**Files:**
*   Modify: `calcucom-android/app/src/main/java/com/example/calcucom/ui/ProfitCalculatorTab.kt`

- [ ] **Step 1: Implement Sticky Bottom Float Bar**
    Add a box overlay containing a horizontal floating bar at the bottom of the Screen. The bar contains the `netProfit` and `margin` values, colored based on `healthLevel` ("excellent" -> Green, "good" -> Light Green, "fair"/"low" -> Orange, "negative" -> Red). Clicking it will trigger programmatic scroll to the results section at the bottom.
    
    ```kotlin
    // Inside Column wrapped with a Box (to allow overlay at the bottom)
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()
    
    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(bottom = 80.dp) // Leave space for sticky bar
        ) {
            // ... Inputs ...
            // ... Canvas Pie Chart ...
            // ... Breakdown Card ...
            // ... Simulation Card ...
        }
        
        // Sticky Float Summary Bar at the bottom
        // Animated color-coded bottom sheet / bar
    }
    ```

- [ ] **Step 2: Add Rincian Potongan (Detailed Deductions) & Projection Simulations**
    Add detailed breakdown lists matching the web version exactly (e.g. Net Cash received, Admin fee amount, detail of Service fees, Process fee, etc.) and a simulation card with Tab switches (ROAS vs Sales) to calculate target sales metrics.

- [ ] **Step 3: Write complete redesigned `ProfitCalculatorTab.kt` file**
    Write the final full implementation to `calcucom-android/app/src/main/java/com/example/calcucom/ui/ProfitCalculatorTab.kt` replacing the existing stub.

---

### Task 5: Verification & Run App

**Files:**
*   Modify: None (Execution / Verification Only)

- [ ] **Step 1: Build project and run tests**
    Run: `./gradlew build` in `/Volumes/ScutiEX/ScutiEX/antigravity/calcu/calcucom/calcucom-android`
    Expected: BUILD SUCCESSFUL and tests pass.

- [ ] **Step 2: Manual deployment & verification**
    Deploy the Android app to emulator or device. Verify visually that:
    1. Clicking the Hamburger Menu opens the Drawer.
    2. Modifying inputs in Profit Calculator changes the Sticky Bottom bar and Pie Chart in realtime.
    3. Category groups and platforms show correct active colors.
    4. ROAS & Sales simulation tabs behave correctly.
