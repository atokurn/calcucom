package com.example.calcucom.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainDashboardScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    
    val tabs = listOf(
        TabItem("Profit", Icons.Default.ShoppingCart),
        TabItem("Price", Icons.Default.Star),
        TabItem("Bundling", Icons.Default.Build),
        TabItem("ROAS", Icons.Default.Info),
        TabItem("Resep", Icons.Default.List)
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "CekBiayaJualan",
                            style = MaterialTheme.typography.titleLarge
                        )
                        Text(
                            text = "Super Calculator & Analytics",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            ScrollableTabRow(
                selectedTabIndex = selectedTab,
                edgePadding = 16.dp,
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                contentColor = MaterialTheme.colorScheme.onSurfaceVariant
            ) {
                tabs.forEachIndexed { index, tab ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(tab.title) },
                        icon = { Icon(imageVector = tab.icon, contentDescription = tab.title) }
                    )
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .weight(1f)
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

data class TabItem(
    val title: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)
