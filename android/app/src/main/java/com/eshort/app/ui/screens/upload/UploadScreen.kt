package com.eshort.app.ui.screens.upload

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.eshort.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UploadScreen(
    onUploadComplete: () -> Unit,
    viewModel: UploadViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    val videoLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { viewModel.setSelectedVideo(it, context) }
    }

    LaunchedEffect(uiState.uploadSuccess) {
        if (uiState.uploadSuccess) {
            onUploadComplete()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .statusBarsPadding()
    ) {
        // Top bar
        TopAppBar(
            title = { Text("New Post", fontWeight = FontWeight.Bold) },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = DarkBackground,
                titleContentColor = Color.White
            ),
            actions = {
                if (uiState.selectedVideoUri != null) {
                    TextButton(
                        onClick = { viewModel.uploadVideo(context) },
                        enabled = !uiState.isUploading
                    ) {
                        Text(
                            "Post",
                            color = if (uiState.isUploading) TextTertiary else AccentPink,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }
                }
            }
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Video selector
            if (uiState.selectedVideoUri == null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(400.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(DarkSurface)
                        .border(2.dp, DividerColor, RoundedCornerShape(16.dp))
                        .clickable { videoLauncher.launch("video/*") },
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Outlined.CloudUpload,
                            contentDescription = null,
                            tint = AccentPink,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "Select Video",
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 18.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "MP4, MOV, WebM up to 100MB",
                            color = TextSecondary,
                            fontSize = 13.sp
                        )
                    }
                }
            } else {
                // Video preview
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(DarkSurface)
                ) {
                    AsyncImage(
                        model = uiState.selectedVideoUri,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )

                    IconButton(
                        onClick = { viewModel.clearSelection() },
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(8.dp)
                            .size(32.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.Black.copy(alpha = 0.6f))
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Remove", tint = Color.White, modifier = Modifier.size(18.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Caption
            OutlinedTextField(
                value = uiState.caption,
                onValueChange = { viewModel.updateCaption(it) },
                label = { Text("Caption") },
                placeholder = { Text("Describe your video...", color = TextTertiary) },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 4,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AccentPink,
                    unfocusedBorderColor = DividerColor,
                    focusedLabelColor = AccentPink,
                    unfocusedLabelColor = TextSecondary,
                    cursorColor = AccentPink,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                ),
                shape = RoundedCornerShape(12.dp),
                supportingText = {
                    Text("${uiState.caption.length}/500", color = TextTertiary)
                }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Hashtags
            OutlinedTextField(
                value = uiState.hashtagInput,
                onValueChange = { viewModel.updateHashtagInput(it) },
                label = { Text("Hashtags") },
                placeholder = { Text("comedy, funny, trending", color = TextTertiary) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AccentPink,
                    unfocusedBorderColor = DividerColor,
                    focusedLabelColor = AccentPink,
                    unfocusedLabelColor = TextSecondary,
                    cursorColor = AccentPink,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                ),
                shape = RoundedCornerShape(12.dp),
                supportingText = {
                    Text("Separate with commas", color = TextTertiary)
                }
            )

            if (uiState.hashtags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    uiState.hashtags.take(5).forEach { tag ->
                        AssistChip(
                            onClick = { viewModel.removeHashtag(tag) },
                            label = { Text("#$tag", fontSize = 12.sp) },
                            trailingIcon = {
                                Icon(Icons.Default.Close, contentDescription = null, modifier = Modifier.size(14.dp))
                            },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = DarkSurfaceVariant,
                                labelColor = AccentPink
                            ),
                            border = null,
                            shape = RoundedCornerShape(20.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Upload progress
            if (uiState.isUploading) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    LinearProgressIndicator(
                        progress = uiState.uploadProgress / 100f,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .clip(RoundedCornerShape(2.dp)),
                        color = AccentPink,
                        trackColor = DarkSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Uploading... ${uiState.uploadProgress}%",
                        color = TextSecondary,
                        fontSize = 13.sp
                    )
                }
            }

            if (uiState.error != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(uiState.error!!, color = ErrorRed, style = MaterialTheme.typography.bodySmall)
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Draft button
            if (uiState.selectedVideoUri != null && !uiState.isUploading) {
                OutlinedButton(
                    onClick = { viewModel.saveDraft() },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary),
                    border = BorderStroke(1.dp, TextSecondary)
                ) {
                    Icon(Icons.Outlined.Save, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Save Draft")
                }
            }
        }
    }
}
