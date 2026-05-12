package com.eshort.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eshort.app.data.model.Video
import com.eshort.app.data.repository.VideoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val videos: List<Video> = emptyList(),
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val error: String? = null,
    val currentFeed: FeedType = FeedType.FOR_YOU,
    val nextCursor: String? = null,
    val hasMore: Boolean = true
)

enum class FeedType { FOR_YOU, FOLLOWING }

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val videoRepository: VideoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadFeed()
    }

    fun loadFeed(feedType: FeedType = _uiState.value.currentFeed) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, currentFeed = feedType) }

            val result = when (feedType) {
                FeedType.FOR_YOU -> videoRepository.getForYouFeed()
                FeedType.FOLLOWING -> videoRepository.getFollowingFeed().map { Pair(it, null) }
            }

            result.fold(
                onSuccess = { (videos, pagination) ->
                    _uiState.update {
                        it.copy(
                            videos = videos,
                            isLoading = false,
                            nextCursor = pagination?.nextCursor,
                            hasMore = pagination?.hasMore ?: false
                        )
                    }
                },
                onFailure = { e ->
                    _uiState.update {
                        it.copy(isLoading = false, error = e.message)
                    }
                }
            )
        }
    }

    fun loadMore() {
        val state = _uiState.value
        if (state.isLoadingMore || !state.hasMore || state.nextCursor == null) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingMore = true) }

            videoRepository.getForYouFeed(cursor = state.nextCursor).fold(
                onSuccess = { (videos, pagination) ->
                    _uiState.update {
                        it.copy(
                            videos = it.videos + videos,
                            isLoadingMore = false,
                            nextCursor = pagination?.nextCursor,
                            hasMore = pagination?.hasMore ?: false
                        )
                    }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoadingMore = false) }
                }
            )
        }
    }

    fun likeVideo(videoId: String) {
        viewModelScope.launch {
            val video = _uiState.value.videos.find { it.id == videoId } ?: return@launch
            val newIsLiked = !video.isLiked

            _uiState.update { state ->
                state.copy(
                    videos = state.videos.map {
                        if (it.id == videoId) it.copy(
                            isLiked = newIsLiked,
                            likesCount = if (newIsLiked) it.likesCount + 1 else it.likesCount - 1
                        ) else it
                    }
                )
            }

            val result = if (newIsLiked) {
                videoRepository.likeVideo(videoId)
            } else {
                videoRepository.unlikeVideo(videoId)
            }

            if (result.isFailure) {
                _uiState.update { state ->
                    state.copy(
                        videos = state.videos.map {
                            if (it.id == videoId) it.copy(
                                isLiked = !newIsLiked,
                                likesCount = if (newIsLiked) it.likesCount - 1 else it.likesCount + 1
                            ) else it
                        }
                    )
                }
            }
        }
    }

    fun recordView(videoId: String, duration: Int = 0) {
        viewModelScope.launch {
            videoRepository.recordView(videoId, duration)
        }
    }

    fun shareVideo(videoId: String) {
        viewModelScope.launch {
            videoRepository.shareVideo(videoId)
        }
    }

    fun switchFeed(feedType: FeedType) {
        if (feedType != _uiState.value.currentFeed) {
            loadFeed(feedType)
        }
    }
}
