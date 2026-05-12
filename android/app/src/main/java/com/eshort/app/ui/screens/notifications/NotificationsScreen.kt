package com.eshort.app.ui.screens.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.eshort.app.data.model.*
import com.eshort.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    onNavigateToProfile: (String) -> Unit,
    viewModel: NotificationsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .statusBarsPadding()
    ) {
        TopAppBar(
            title = { Text("Activity", fontWeight = FontWeight.Bold) },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = DarkBackground,
                titleContentColor = Color.White
            ),
            actions = {
                if (uiState.unreadCount > 0) {
                    TextButton(onClick = { viewModel.markAllRead() }) {
                        Text("Read all", color = AccentPink, fontSize = 13.sp)
                    }
                }
            }
        )

        // Tabs
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = DarkBackground,
            contentColor = Color.White,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                    color = AccentPink
                )
            },
            divider = { HorizontalDivider(color = DividerColor) }
        ) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Notifications")
                        if (uiState.unreadCount > 0) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Badge(
                                containerColor = AccentPink,
                                contentColor = Color.White,
                            ) {
                                Text(uiState.unreadCount.toString(), fontSize = 10.sp)
                            }
                        }
                    }
                },
                selectedContentColor = Color.White,
                unselectedContentColor = TextSecondary
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Friends")
                        if (uiState.pendingRequests.isNotEmpty()) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Badge(
                                containerColor = AccentPink,
                                contentColor = Color.White,
                            ) {
                                Text(uiState.pendingRequests.size.toString(), fontSize = 10.sp)
                            }
                        }
                    }
                },
                selectedContentColor = Color.White,
                unselectedContentColor = TextSecondary
            )
        }

        when (selectedTab) {
            0 -> NotificationsList(
                notifications = uiState.notifications,
                isLoading = uiState.isLoading,
                onNotificationClick = { notification ->
                    viewModel.markRead(notification.id)
                    notification.fromUserId?.let { onNavigateToProfile(it) }
                }
            )
            1 -> FriendsTab(
                pendingRequests = uiState.pendingRequests,
                friends = uiState.friends,
                isLoading = uiState.isLoading,
                onAcceptRequest = { viewModel.acceptRequest(it) },
                onRejectRequest = { viewModel.rejectRequest(it) },
                onNavigateToProfile = onNavigateToProfile
            )
        }
    }
}

@Composable
fun NotificationsList(
    notifications: List<Notification>,
    isLoading: Boolean,
    onNotificationClick: (Notification) -> Unit
) {
    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = AccentPink)
        }
        return
    }

    if (notifications.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    Icons.Outlined.Notifications,
                    contentDescription = null,
                    tint = TextTertiary,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text("No notifications yet", color = TextSecondary)
            }
        }
        return
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(vertical = 8.dp)
    ) {
        items(notifications) { notification ->
            NotificationItem(
                notification = notification,
                onClick = { onNotificationClick(notification) }
            )
        }
    }
}

@Composable
fun NotificationItem(notification: Notification, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .background(if (!notification.read) DarkSurface else Color.Transparent)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box {
            AsyncImage(
                model = notification.fromUser?.profilePictureUrl,
                contentDescription = null,
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(DarkSurfaceVariant),
                contentScale = ContentScale.Crop
            )

            val iconData = when (notification.type) {
                "like" -> Icons.Filled.Favorite to AccentPink
                "comment" -> Icons.Filled.ChatBubble to AccentBlue
                "follow" -> Icons.Filled.PersonAdd to SuccessGreen
                "friend_request" -> Icons.Filled.GroupAdd to WarningOrange
                "friend_request_accepted" -> Icons.Filled.Check to SuccessGreen
                else -> Icons.Filled.Notifications to TextSecondary
            }

            Box(
                modifier = Modifier
                    .size(18.dp)
                    .clip(CircleShape)
                    .background(iconData.second)
                    .align(Alignment.BottomEnd),
                contentAlignment = Alignment.Center
            ) {
                Icon(iconData.first, contentDescription = null, tint = Color.White, modifier = Modifier.size(10.dp))
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = buildString {
                    append(notification.fromUser?.displayName ?: "Someone")
                    append(" ")
                    append(notification.message)
                },
                color = Color.White,
                fontSize = 13.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = notification.createdAt.take(10),
                color = TextTertiary,
                fontSize = 11.sp,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        if (!notification.read) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(AccentPink)
            )
        }
    }
}

@Composable
fun FriendsTab(
    pendingRequests: List<FriendRequest>,
    friends: List<UserPreview>,
    isLoading: Boolean,
    onAcceptRequest: (String) -> Unit,
    onRejectRequest: (String) -> Unit,
    onNavigateToProfile: (String) -> Unit
) {
    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = AccentPink)
        }
        return
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (pendingRequests.isNotEmpty()) {
            item {
                Text("Pending Requests", style = MaterialTheme.typography.titleMedium, color = Color.White)
                Spacer(modifier = Modifier.height(8.dp))
            }
            items(pendingRequests) { request ->
                FriendRequestItem(
                    request = request,
                    onAccept = { onAcceptRequest(request.id) },
                    onReject = { onRejectRequest(request.id) },
                    onClick = { request.fromUser?.uid?.let(onNavigateToProfile) }
                )
            }
        }

        if (friends.isNotEmpty()) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Text("Friends", style = MaterialTheme.typography.titleMedium, color = Color.White)
                Spacer(modifier = Modifier.height(8.dp))
            }
            items(friends) { friend ->
                FriendItem(friend = friend, onClick = { onNavigateToProfile(friend.uid) })
            }
        }

        if (pendingRequests.isEmpty() && friends.isEmpty()) {
            item {
                Box(
                    modifier = Modifier.fillMaxWidth().height(300.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Outlined.People,
                            contentDescription = null,
                            tint = TextTertiary,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("No friends yet", color = TextSecondary)
                        Text("Find people to connect with!", color = TextTertiary, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun FriendRequestItem(
    request: FriendRequest,
    onAccept: () -> Unit,
    onReject: () -> Unit,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(DarkSurface)
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(
            model = request.fromUser?.profilePictureUrl,
            contentDescription = null,
            modifier = Modifier.size(48.dp).clip(CircleShape).background(DarkSurfaceVariant),
            contentScale = ContentScale.Crop
        )

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = request.fromUser?.displayName ?: "User",
                color = Color.White,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp
            )
            Text(text = "@${request.fromUser?.username}", color = TextSecondary, fontSize = 12.sp)
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilledIconButton(
                onClick = onAccept,
                modifier = Modifier.size(36.dp),
                colors = IconButtonDefaults.filledIconButtonColors(
                    containerColor = AccentPink,
                    contentColor = Color.White
                )
            ) {
                Icon(Icons.Default.Check, contentDescription = "Accept", modifier = Modifier.size(18.dp))
            }
            FilledIconButton(
                onClick = onReject,
                modifier = Modifier.size(36.dp),
                colors = IconButtonDefaults.filledIconButtonColors(
                    containerColor = DarkSurfaceVariant,
                    contentColor = TextSecondary
                )
            ) {
                Icon(Icons.Default.Close, contentDescription = "Reject", modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
fun FriendItem(friend: UserPreview, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(DarkSurface)
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(
            model = friend.profilePictureUrl,
            contentDescription = null,
            modifier = Modifier.size(44.dp).clip(CircleShape).background(DarkSurfaceVariant),
            contentScale = ContentScale.Crop
        )

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(friend.displayName, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                if (friend.isVerified) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(Icons.Default.Verified, contentDescription = null, tint = AccentBlue, modifier = Modifier.size(16.dp))
                }
            }
            Text("@${friend.username}", color = TextSecondary, fontSize = 12.sp)
        }
    }
}
