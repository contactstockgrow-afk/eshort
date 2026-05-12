package com.eshort.app.ui.screens.search

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
fun SearchScreen(
    onNavigateToProfile: (String) -> Unit,
    viewModel: SearchViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .statusBarsPadding()
    ) {
        SearchBar(
            query = uiState.query,
            onQueryChange = { viewModel.updateQuery(it) },
            onSearch = { viewModel.search() },
            active = uiState.isSearchActive,
            onActiveChange = { viewModel.setSearchActive(it) },
            placeholder = { Text("Search users, videos, hashtags", color = TextTertiary) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextSecondary) },
            trailingIcon = {
                if (uiState.query.isNotEmpty()) {
                    IconButton(onClick = { viewModel.updateQuery("") }) {
                        Icon(Icons.Default.Close, contentDescription = "Clear", tint = TextSecondary)
                    }
                }
            },
            colors = SearchBarDefaults.colors(
                containerColor = DarkSurfaceVariant,
                inputFieldColors = TextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    cursorColor = AccentPink,
                )
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
        ) {
            // Search suggestions
            if (uiState.suggestions.isNotEmpty()) {
                LazyColumn {
                    items(uiState.suggestions) { suggestion ->
                        ListItem(
                            headlineContent = {
                                Text(
                                    text = if (suggestion.type == "hashtag") "#${suggestion.value}" else suggestion.value,
                                    color = Color.White
                                )
                            },
                            supportingContent = suggestion.displayName?.let {
                                { Text(it, color = TextSecondary) }
                            },
                            leadingContent = {
                                Icon(
                                    imageVector = if (suggestion.type == "hashtag") Icons.Default.Tag else Icons.Default.Person,
                                    contentDescription = null,
                                    tint = TextSecondary
                                )
                            },
                            modifier = Modifier.clickable {
                                viewModel.updateQuery(suggestion.value)
                                viewModel.search()
                            },
                            colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        if (uiState.searchResult != null) {
            SearchResults(
                result = uiState.searchResult!!,
                onUserClick = onNavigateToProfile
            )
        } else {
            TrendingContent(
                trending = uiState.trendingData,
                isLoading = uiState.isLoading,
                onCreatorClick = onNavigateToProfile
            )
        }
    }
}

@Composable
fun SearchResults(result: SearchResult, onUserClick: (String) -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (result.users?.isNotEmpty() == true) {
            item {
                Text("Users", style = MaterialTheme.typography.titleLarge, color = Color.White)
                Spacer(modifier = Modifier.height(8.dp))
            }
            items(result.users) { user ->
                UserSearchItem(user = user, onClick = { onUserClick(user.uid) })
            }
        }

        if (result.hashtags?.isNotEmpty() == true) {
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Hashtags", style = MaterialTheme.typography.titleLarge, color = Color.White)
                Spacer(modifier = Modifier.height(8.dp))
            }
            items(result.hashtags) { hashtag ->
                HashtagItem(hashtag = hashtag)
            }
        }

        if (result.videos?.isNotEmpty() == true) {
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Videos", style = MaterialTheme.typography.titleLarge, color = Color.White)
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
fun UserSearchItem(user: UserPreview, onClick: () -> Unit) {
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
            model = user.profilePictureUrl,
            contentDescription = null,
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(DarkSurfaceVariant),
            contentScale = ContentScale.Crop
        )

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = user.displayName,
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp
                )
                if (user.isVerified) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        Icons.Default.Verified,
                        contentDescription = null,
                        tint = AccentBlue,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
            Text(
                text = "@${user.username}",
                color = TextSecondary,
                fontSize = 13.sp
            )
        }
    }
}

@Composable
fun HashtagItem(hashtag: Hashtag) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(DarkSurface)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(DarkSurfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Tag, contentDescription = null, tint = AccentPink, modifier = Modifier.size(20.dp))
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column {
            Text(text = "#${hashtag.tag}", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Text(text = "${hashtag.count} videos", color = TextSecondary, fontSize = 12.sp)
        }
    }
}

@Composable
fun TrendingContent(
    trending: TrendingData?,
    isLoading: Boolean,
    onCreatorClick: (String) -> Unit
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
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        if (trending?.suggestedCreators?.isNotEmpty() == true) {
            item {
                Text("Suggested Creators", style = MaterialTheme.typography.titleLarge, color = Color.White)
                Spacer(modifier = Modifier.height(8.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(trending.suggestedCreators) { creator ->
                        CreatorCard(creator = creator, onClick = { onCreatorClick(creator.uid) })
                    }
                }
            }
        }

        if (trending?.trendingHashtags?.isNotEmpty() == true) {
            item {
                Text("Trending Hashtags", style = MaterialTheme.typography.titleLarge, color = Color.White)
                Spacer(modifier = Modifier.height(8.dp))
            }
            items(trending.trendingHashtags.take(10)) { hashtag ->
                HashtagItem(hashtag = hashtag)
            }
        }
    }
}

@Composable
fun CreatorCard(creator: UserPreview, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(120.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(DarkSurface)
            .clickable(onClick = onClick)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AsyncImage(
            model = creator.profilePictureUrl,
            contentDescription = null,
            modifier = Modifier
                .size(60.dp)
                .clip(CircleShape)
                .background(DarkSurfaceVariant),
            contentScale = ContentScale.Crop
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = creator.displayName,
            color = Color.White,
            fontWeight = FontWeight.SemiBold,
            fontSize = 13.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Text(
            text = "@${creator.username}",
            color = TextSecondary,
            fontSize = 11.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}
