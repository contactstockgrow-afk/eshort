package com.eshort.app.ui.screens.profile

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.eshort.app.data.model.Video
import com.eshort.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onSignOut: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showSettings by remember { mutableStateOf(false) }
    var selectedVideoTab by remember { mutableIntStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .statusBarsPadding()
    ) {
        TopAppBar(
            title = {
                Text(
                    text = "@${uiState.user?.username ?: ""}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = DarkBackground,
                titleContentColor = Color.White
            ),
            actions = {
                IconButton(onClick = { showSettings = true }) {
                    Icon(Icons.Outlined.Settings, contentDescription = "Settings", tint = Color.White)
                }
            }
        )

        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AccentPink)
            }
        } else {
            // Profile header
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                AsyncImage(
                    model = uiState.user?.profilePictureUrl,
                    contentDescription = "Profile Picture",
                    modifier = Modifier
                        .size(88.dp)
                        .clip(CircleShape)
                        .background(DarkSurfaceVariant),
                    contentScale = ContentScale.Crop
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = uiState.user?.displayName ?: "",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )

                if (uiState.user?.bio?.isNotEmpty() == true) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = uiState.user?.bio ?: "",
                        color = TextSecondary,
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Stats
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    StatColumn(count = uiState.user?.followingCount ?: 0, label = "Following")
                    StatColumn(count = uiState.user?.followersCount ?: 0, label = "Followers")
                    StatColumn(count = uiState.user?.likesCount ?: 0, label = "Likes")
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Edit Profile button
                OutlinedButton(
                    onClick = { viewModel.toggleEditMode() },
                    modifier = Modifier.fillMaxWidth().height(40.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.3f))
                ) {
                    Text("Edit Profile", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Video tabs
            TabRow(
                selectedTabIndex = selectedVideoTab,
                containerColor = DarkBackground,
                contentColor = Color.White,
                divider = { Divider(color = DividerColor) }
            ) {
                Tab(
                    selected = selectedVideoTab == 0,
                    onClick = { selectedVideoTab = 0; viewModel.loadUserVideos() },
                    icon = { Icon(Icons.Outlined.GridView, contentDescription = null, modifier = Modifier.size(20.dp)) },
                    selectedContentColor = Color.White,
                    unselectedContentColor = TextTertiary
                )
                Tab(
                    selected = selectedVideoTab == 1,
                    onClick = { selectedVideoTab = 1; viewModel.loadSavedVideos() },
                    icon = { Icon(Icons.Outlined.BookmarkBorder, contentDescription = null, modifier = Modifier.size(20.dp)) },
                    selectedContentColor = Color.White,
                    unselectedContentColor = TextTertiary
                )
                Tab(
                    selected = selectedVideoTab == 2,
                    onClick = { selectedVideoTab = 2; viewModel.loadLikedVideos() },
                    icon = { Icon(Icons.Outlined.FavoriteBorder, contentDescription = null, modifier = Modifier.size(20.dp)) },
                    selectedContentColor = Color.White,
                    unselectedContentColor = TextTertiary
                )
            }

            // Video grid
            val videos = when (selectedVideoTab) {
                0 -> uiState.userVideos
                1 -> uiState.savedVideos
                2 -> uiState.likedVideos
                else -> emptyList()
            }

            if (videos.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            when (selectedVideoTab) {
                                0 -> Icons.Outlined.VideoLibrary
                                1 -> Icons.Outlined.BookmarkBorder
                                else -> Icons.Outlined.FavoriteBorder
                            },
                            contentDescription = null,
                            tint = TextTertiary,
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = when (selectedVideoTab) {
                                0 -> "No videos yet"
                                1 -> "No saved videos"
                                else -> "No liked videos"
                            },
                            color = TextSecondary,
                            fontSize = 14.sp
                        )
                    }
                }
            } else {
                VideoGrid(videos = videos)
            }
        }
    }

    // Settings bottom sheet
    if (showSettings) {
        SettingsBottomSheet(
            onDismiss = { showSettings = false },
            onSignOut = {
                viewModel.signOut()
                showSettings = false
                onSignOut()
            },
            user = uiState.user
        )
    }
}

@Composable
fun StatColumn(count: Int, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = formatStatCount(count),
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 18.sp
        )
        Text(text = label, color = TextSecondary, fontSize = 12.sp)
    }
}

@Composable
fun VideoGrid(videos: List<Video>) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(3),
        modifier = Modifier.fillMaxSize(),
        horizontalArrangement = Arrangement.spacedBy(1.dp),
        verticalArrangement = Arrangement.spacedBy(1.dp)
    ) {
        items(videos) { video ->
            Box(
                modifier = Modifier
                    .aspectRatio(9f / 16f)
                    .background(DarkSurface)
            ) {
                AsyncImage(
                    model = video.thumbnailUrl.ifEmpty { video.videoDirectUrl },
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )

                Row(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Filled.PlayArrow,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(2.dp))
                    Text(
                        text = formatStatCount(video.viewsCount),
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsBottomSheet(
    onDismiss: () -> Unit,
    onSignOut: () -> Unit,
    user: com.eshort.app.data.model.User?
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        contentColor = Color.White
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Settings", fontWeight = FontWeight.Bold, fontSize = 20.sp)
            Spacer(modifier = Modifier.height(16.dp))

            SettingsItem(icon = Icons.Outlined.Person, title = "Account", subtitle = user?.email ?: "")
            SettingsItem(icon = Icons.Outlined.Lock, title = "Privacy", subtitle = if (user?.isPrivate == true) "Private" else "Public")
            SettingsItem(icon = Icons.Outlined.Notifications, title = "Notifications")
            SettingsItem(icon = Icons.Outlined.Storage, title = "Google Drive", subtitle = if (user?.driveConnected == true) "Connected" else "Not connected")
            SettingsItem(icon = Icons.Outlined.Help, title = "Help & Support")
            SettingsItem(icon = Icons.Outlined.Info, title = "About")

            Spacer(modifier = Modifier.height(8.dp))
            Divider(color = DividerColor)
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onSignOut)
                    .padding(vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Logout, contentDescription = null, tint = ErrorRed, modifier = Modifier.size(24.dp))
                Spacer(modifier = Modifier.width(16.dp))
                Text("Sign Out", color = ErrorRed, fontWeight = FontWeight.Medium, fontSize = 15.sp)
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun SettingsItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { }
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = Color.White, fontSize = 15.sp)
            if (subtitle != null) {
                Text(subtitle, color = TextTertiary, fontSize = 12.sp)
            }
        }
        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextTertiary, modifier = Modifier.size(20.dp))
    }
}

fun formatStatCount(count: Int): String {
    return when {
        count >= 1_000_000 -> String.format("%.1fM", count / 1_000_000.0)
        count >= 1_000 -> String.format("%.1fK", count / 1_000.0)
        else -> count.toString()
    }
}
