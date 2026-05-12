package com.eshort.app.ui.screens.home

import androidx.compose.animation.*
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.eshort.app.data.model.Video
import com.eshort.app.ui.components.VideoPlayer
import com.eshort.app.ui.theme.*

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun HomeScreen(
    onNavigateToProfile: (String) -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val pagerState = rememberPagerState(pageCount = { uiState.videos.size })

    LaunchedEffect(pagerState.currentPage) {
        if (pagerState.currentPage >= uiState.videos.size - 3) {
            viewModel.loadMore()
        }
        if (uiState.videos.isNotEmpty()) {
            val video = uiState.videos[pagerState.currentPage]
            viewModel.recordView(video.id)
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(DarkBackground)) {
        if (uiState.isLoading && uiState.videos.isEmpty()) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.Center),
                color = AccentPink
            )
        } else if (uiState.videos.isEmpty()) {
            Column(
                modifier = Modifier.align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    Icons.Outlined.VideoLibrary,
                    contentDescription = null,
                    tint = TextTertiary,
                    modifier = Modifier.size(64.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text("No videos yet", color = TextSecondary, style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(8.dp))
                TextButton(onClick = { viewModel.loadFeed() }) {
                    Text("Refresh", color = AccentPink)
                }
            }
        } else {
            VerticalPager(
                state = pagerState,
                modifier = Modifier.fillMaxSize()
            ) { page ->
                VideoCard(
                    video = uiState.videos[page],
                    isPlaying = pagerState.currentPage == page,
                    onLike = { viewModel.likeVideo(uiState.videos[page].id) },
                    onComment = { },
                    onShare = { viewModel.shareVideo(uiState.videos[page].id) },
                    onProfileClick = { uiState.videos[page].user?.uid?.let(onNavigateToProfile) },
                    onDoubleTap = { viewModel.likeVideo(uiState.videos[page].id) }
                )
            }
        }

        // Feed Tabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(top = 8.dp),
            horizontalArrangement = Arrangement.Center
        ) {
            FeedTab(
                text = "Following",
                isSelected = uiState.currentFeed == FeedType.FOLLOWING,
                onClick = { viewModel.switchFeed(FeedType.FOLLOWING) }
            )
            Spacer(modifier = Modifier.width(24.dp))
            FeedTab(
                text = "For You",
                isSelected = uiState.currentFeed == FeedType.FOR_YOU,
                onClick = { viewModel.switchFeed(FeedType.FOR_YOU) }
            )
        }
    }
}

@Composable
fun FeedTab(text: String, isSelected: Boolean, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Text(
            text = text,
            color = if (isSelected) Color.White else TextSecondary,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
            fontSize = 16.sp
        )
        if (isSelected) {
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .width(24.dp)
                    .height(2.dp)
                    .clip(RoundedCornerShape(1.dp))
                    .background(Color.White)
            )
        }
    }
}

@Composable
fun VideoCard(
    video: Video,
    isPlaying: Boolean = false,
    onLike: () -> Unit,
    onComment: () -> Unit,
    onShare: () -> Unit,
    onProfileClick: () -> Unit,
    onDoubleTap: () -> Unit
) {
    var showLikeAnimation by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .pointerInput(Unit) {
                detectTapGestures(
                    onDoubleTap = {
                        showLikeAnimation = true
                        onDoubleTap()
                    }
                )
            }
    ) {
        if (video.videoUrl.isNotEmpty()) {
            VideoPlayer(
                videoUrl = video.videoUrl,
                isVisible = isPlaying,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            AsyncImage(
                model = video.thumbnailUrl.ifEmpty { video.videoDirectUrl },
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        }

        // Gradient overlay at bottom
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
                .align(Alignment.BottomCenter)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f))
                    )
                )
        )

        // Side action buttons
        Column(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 12.dp)
                .offset(y = 80.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Profile
            Box(modifier = Modifier.clickable(onClick = onProfileClick)) {
                AsyncImage(
                    model = video.user?.profilePictureUrl,
                    contentDescription = "Profile",
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(DarkSurfaceVariant),
                    contentScale = ContentScale.Crop
                )
                if (video.isFollowing != true) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(CircleShape)
                            .background(AccentPink)
                            .align(Alignment.BottomCenter)
                            .offset(y = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Add,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }

            // Like
            ActionButton(
                icon = if (video.isLiked) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                count = formatCount(video.likesCount),
                tint = if (video.isLiked) AccentPink else Color.White,
                onClick = onLike
            )

            // Comment
            ActionButton(
                icon = Icons.Outlined.ChatBubbleOutline,
                count = formatCount(video.commentsCount),
                onClick = onComment
            )

            // Share
            ActionButton(
                icon = Icons.Outlined.Share,
                count = formatCount(video.sharesCount),
                onClick = onShare
            )
        }

        // Bottom info
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(start = 16.dp, bottom = 16.dp, end = 80.dp)
        ) {
            Text(
                text = "@${video.user?.username ?: "user"}",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                modifier = Modifier.clickable(onClick = onProfileClick)
            )

            Spacer(modifier = Modifier.height(6.dp))

            if (video.caption.isNotEmpty()) {
                Text(
                    text = video.caption,
                    color = Color.White,
                    fontSize = 13.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            if (video.hashtags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = video.hashtags.joinToString(" ") { "#$it" },
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        // Double tap like animation
        AnimatedVisibility(
            visible = showLikeAnimation,
            enter = scaleIn() + fadeIn(),
            exit = scaleOut() + fadeOut(),
            modifier = Modifier.align(Alignment.Center)
        ) {
            Icon(
                Icons.Filled.Favorite,
                contentDescription = null,
                tint = AccentPink,
                modifier = Modifier.size(100.dp)
            )
            LaunchedEffect(showLikeAnimation) {
                if (showLikeAnimation) {
                    kotlinx.coroutines.delay(800)
                    showLikeAnimation = false
                }
            }
        }
    }
}

@Composable
fun ActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    count: String,
    tint: Color = Color.White,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(32.dp)
        )
        Text(
            text = count,
            color = Color.White,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

fun formatCount(count: Int): String {
    return when {
        count >= 1_000_000 -> String.format("%.1fM", count / 1_000_000.0)
        count >= 1_000 -> String.format("%.1fK", count / 1_000.0)
        else -> count.toString()
    }
}
