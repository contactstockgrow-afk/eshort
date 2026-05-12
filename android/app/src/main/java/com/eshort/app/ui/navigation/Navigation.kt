package com.eshort.app.ui.navigation

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.eshort.app.ui.screens.auth.AuthScreen
import com.eshort.app.ui.screens.auth.AuthViewModel
import com.eshort.app.ui.screens.auth.RegisterScreen
import com.eshort.app.ui.screens.home.HomeScreen
import com.eshort.app.ui.screens.search.SearchScreen
import com.eshort.app.ui.screens.upload.UploadScreen
import com.eshort.app.ui.screens.notifications.NotificationsScreen
import com.eshort.app.ui.screens.profile.ProfileScreen
import com.eshort.app.ui.screens.profile.UserProfileScreen
import com.eshort.app.ui.theme.*

sealed class Screen(val route: String) {
    data object Auth : Screen("auth")
    data object Register : Screen("register")
    data object Home : Screen("home")
    data object Search : Screen("search")
    data object Upload : Screen("upload")
    data object Notifications : Screen("notifications")
    data object Profile : Screen("profile")
    data object UserProfile : Screen("user_profile/{userId}") {
        fun createRoute(userId: String) = "user_profile/$userId"
    }
}

data class BottomNavItem(
    val screen: Screen,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

val bottomNavItems = listOf(
    BottomNavItem(Screen.Home, "Home", Icons.Filled.Home, Icons.Outlined.Home),
    BottomNavItem(Screen.Search, "Search", Icons.Filled.Search, Icons.Outlined.Search),
    BottomNavItem(Screen.Upload, "Upload", Icons.Filled.AddCircle, Icons.Outlined.AddCircle),
    BottomNavItem(Screen.Notifications, "Activity", Icons.Filled.Notifications, Icons.Outlined.Notifications),
    BottomNavItem(Screen.Profile, "Profile", Icons.Filled.Person, Icons.Outlined.Person),
)

@Composable
fun EShortNavHost() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = hiltViewModel()
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState()

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val showBottomBar = currentRoute in bottomNavItems.map { it.screen.route }

    Scaffold(
        containerColor = DarkBackground,
        bottomBar = {
            if (showBottomBar && isLoggedIn) {
                EShortBottomBar(navController = navController, currentRoute = currentRoute)
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = if (isLoggedIn) Screen.Home.route else Screen.Auth.route,
            modifier = Modifier.padding(
                bottom = if (showBottomBar && isLoggedIn) innerPadding.calculateBottomPadding() else 0.dp
            )
        ) {
            composable(Screen.Auth.route) {
                AuthScreen(
                    onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                    onSignInSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Auth.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Register.route) {
                RegisterScreen(
                    onRegisterSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Auth.route) { inclusive = true }
                        }
                    },
                    onBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Home.route) {
                HomeScreen(
                    onNavigateToProfile = { userId ->
                        navController.navigate(Screen.UserProfile.createRoute(userId))
                    }
                )
            }

            composable(Screen.Search.route) {
                SearchScreen(
                    onNavigateToProfile = { userId ->
                        navController.navigate(Screen.UserProfile.createRoute(userId))
                    }
                )
            }

            composable(Screen.Upload.route) {
                UploadScreen(
                    onUploadComplete = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Home.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Notifications.route) {
                NotificationsScreen(
                    onNavigateToProfile = { userId ->
                        navController.navigate(Screen.UserProfile.createRoute(userId))
                    }
                )
            }

            composable(Screen.Profile.route) {
                ProfileScreen(
                    onSignOut = {
                        navController.navigate(Screen.Auth.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.UserProfile.route) { backStackEntry ->
                val userId = backStackEntry.arguments?.getString("userId") ?: ""
                UserProfileScreen(
                    userId = userId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}

@Composable
fun EShortBottomBar(navController: NavHostController, currentRoute: String?) {
    NavigationBar(
        containerColor = DarkSurface,
        contentColor = TextPrimary,
        tonalElevation = 0.dp,
        modifier = Modifier.height(64.dp)
    ) {
        bottomNavItems.forEach { item ->
            val isSelected = currentRoute == item.screen.route
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.label,
                        modifier = Modifier.size(if (item.screen == Screen.Upload) 32.dp else 24.dp)
                    )
                },
                label = {
                    Text(
                        text = item.label,
                        style = MaterialTheme.typography.labelSmall
                    )
                },
                selected = isSelected,
                onClick = {
                    if (currentRoute != item.screen.route) {
                        navController.navigate(item.screen.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = if (item.screen == Screen.Upload) AccentPink else Color.White,
                    selectedTextColor = Color.White,
                    unselectedIconColor = TextTertiary,
                    unselectedTextColor = TextTertiary,
                    indicatorColor = Color.Transparent,
                )
            )
        }
    }
}
