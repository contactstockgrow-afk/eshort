package com.eshort.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

val DarkBackground = Color(0xFF0A0A0A)
val DarkSurface = Color(0xFF141414)
val DarkSurfaceVariant = Color(0xFF1E1E1E)
val DarkCard = Color(0xFF1A1A1A)
val AccentPink = Color(0xFFFF2D55)
val AccentBlue = Color(0xFF007AFF)
val AccentCyan = Color(0xFF00D4FF)
val TextPrimary = Color(0xFFFFFFFF)
val TextSecondary = Color(0xFFAAAAAA)
val TextTertiary = Color(0xFF666666)
val DividerColor = Color(0xFF2A2A2A)
val SuccessGreen = Color(0xFF34C759)
val AccentGreen = SuccessGreen
val WarningOrange = Color(0xFFFF9500)
val ErrorRed = Color(0xFFFF3B30)

private val DarkColorScheme = darkColorScheme(
    primary = AccentPink,
    secondary = AccentBlue,
    tertiary = AccentCyan,
    background = DarkBackground,
    surface = DarkSurface,
    surfaceVariant = DarkSurfaceVariant,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    onSurfaceVariant = TextSecondary,
    error = ErrorRed,
    outline = DividerColor,
)

@Composable
fun EShortTheme(content: @Composable () -> Unit) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = Color.Transparent.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = false
                isAppearanceLightNavigationBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = EShortTypography,
        content = content
    )
}
