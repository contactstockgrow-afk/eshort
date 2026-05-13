package com.eshort.app.ui.components

import android.util.Log
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.eshort.app.data.cache.VideoCache

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
@Composable
fun VideoPlayer(
    videoUrl: String,
    isVisible: Boolean,
    modifier: Modifier = Modifier
) {
    if (videoUrl.isBlank()) {
        Box(
            modifier = modifier.fillMaxSize().background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            Text("Video unavailable", color = Color.Gray)
        }
        return
    }

    val context = LocalContext.current

    val exoPlayer = remember(videoUrl) {
        try {
            val cacheFactory = VideoCache.getCacheDataSourceFactory(context)
            ExoPlayer.Builder(context)
                .setMediaSourceFactory(
                    androidx.media3.exoplayer.source.DefaultMediaSourceFactory(cacheFactory)
                )
                .build().apply {
                    val mediaItem = MediaItem.fromUri(videoUrl)
                    setMediaItem(mediaItem)
                    repeatMode = Player.REPEAT_MODE_ONE
                    volume = 1f
                    prepare()
                }
        } catch (e: Exception) {
            Log.e("VideoPlayer", "Failed to create player", e)
            null
        }
    }

    if (exoPlayer == null) {
        Box(
            modifier = modifier.fillMaxSize().background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            Text("Video error", color = Color.Gray)
        }
        return
    }

    LaunchedEffect(isVisible) {
        try {
            exoPlayer.playWhenReady = isVisible
        } catch (e: Exception) {
            Log.e("VideoPlayer", "Play state error", e)
        }
    }

    DisposableEffect(videoUrl) {
        onDispose {
            try { exoPlayer.release() } catch (_: Exception) {}
        }
    }

    AndroidView(
        factory = {
            androidx.media3.ui.PlayerView(it).apply {
                player = exoPlayer
                useController = false
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                setShowBuffering(androidx.media3.ui.PlayerView.SHOW_BUFFERING_WHEN_PLAYING)
            }
        },
        modifier = modifier
    )
}
