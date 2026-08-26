package com.silatech.calc

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import com.silatech.calc.ui.navigation.SilaRoute
import com.silatech.calc.ui.screens.CalculatorScreen
import com.silatech.calc.ui.screens.HomeScreen
import com.silatech.calc.ui.screens.ProjectsScreen
import com.silatech.calc.ui.theme.SilaTheme
import com.silatech.calc.viewmodel.CalculatorViewModel
import com.silatech.calc.viewmodel.ProjectsViewModel

class MainActivity : ComponentActivity() {

    private val calcVm:     CalculatorViewModel by viewModels()
    private val projectsVm: ProjectsViewModel   by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Edge-to-edge
        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContent {
            SilaTheme {
                SilaApp(calcVm = calcVm, projectsVm = projectsVm)
            }
        }
    }
}

// ────────────────────────────────────────────────────────────
//  Root composable with bottom navigation
// ────────────────────────────────────────────────────────────
@Composable
private fun SilaApp(calcVm: CalculatorViewModel, projectsVm: ProjectsViewModel) {
    var currentRoute by remember { mutableStateOf(SilaRoute.HOME) }

    val navItems = listOf(
        NavItem(SilaRoute.HOME,       "Home",       Icons.Default.Home),
        NavItem(SilaRoute.CALCULATOR, "Calculator", Icons.Default.Calculate),
        NavItem(SilaRoute.PROJECTS,   "Projects",   Icons.Default.FolderOpen)
    )

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = androidx.compose.ui.graphics.Color.White,
                tonalElevation = 8.dp
            ) {
                navItems.forEach { item ->
                    NavigationBarItem(
                        selected  = currentRoute == item.route,
                        onClick   = { currentRoute = item.route },
                        icon      = {
                            Icon(item.icon, contentDescription = item.label,
                                modifier = Modifier.size(22.dp))
                        },
                        label     = {
                            Text(item.label, fontSize = 10.sp,
                                fontWeight = if (currentRoute == item.route) FontWeight.Bold else FontWeight.Normal)
                        },
                        colors    = NavigationBarItemDefaults.colors(
                            selectedIconColor   = com.silatech.calc.ui.theme.NavyPrimary,
                            selectedTextColor   = com.silatech.calc.ui.theme.NavyPrimary,
                            indicatorColor      = com.silatech.calc.ui.theme.NavyLight
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            AnimatedContent(
                targetState = currentRoute,
                transitionSpec = {
                    fadeIn(animationSpec = tween(220)) togetherWith
                    fadeOut(animationSpec = tween(180))
                },
                label = "screen_transition"
            ) { route ->
                when (route) {
                    SilaRoute.HOME ->
                        HomeScreen(
                            onNavigateToCalculator = { currentRoute = SilaRoute.CALCULATOR },
                            onNavigateToProjects   = { currentRoute = SilaRoute.PROJECTS }
                        )
                    SilaRoute.CALCULATOR ->
                        CalculatorScreen(
                            vm     = calcVm,
                            onBack = { currentRoute = SilaRoute.HOME }
                        )
                    SilaRoute.PROJECTS ->
                        ProjectsScreen(
                            pVm            = projectsVm,
                            cVm            = calcVm,
                            onBack         = { currentRoute = SilaRoute.HOME },
                            onProjectLoaded = { currentRoute = SilaRoute.CALCULATOR }
                        )
                }
            }
        }
    }
}

private data class NavItem(val route: String, val label: String, val icon: ImageVector)
