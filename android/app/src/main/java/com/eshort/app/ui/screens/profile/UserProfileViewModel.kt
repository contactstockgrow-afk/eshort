package com.eshort.app.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eshort.app.data.model.User
import com.eshort.app.data.model.Video
import com.eshort.app.data.repository.SocialRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class UserProfileUiState(
    val user: User? = null,
    val videos: List<Video> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class UserProfileViewModel @Inject constructor(
    private val socialRepository: SocialRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(UserProfileUiState())
    val uiState: StateFlow<UserProfileUiState> = _uiState.asStateFlow()

    fun loadUser(userId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            socialRepository.getUserProfile(userId).fold(
                onSuccess = { user ->
                    _uiState.update { it.copy(user = user, isLoading = false) }
                    loadVideos(userId)
                },
                onFailure = { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
            )
        }
    }

    private fun loadVideos(userId: String) {
        viewModelScope.launch {
            socialRepository.getUserVideos(userId).fold(
                onSuccess = { videos ->
                    _uiState.update { it.copy(videos = videos) }
                },
                onFailure = { }
            )
        }
    }

    fun toggleFollow() {
        viewModelScope.launch {
            val user = _uiState.value.user ?: return@launch
            val isFollowing = user.isFollowing

            _uiState.update {
                it.copy(
                    user = user.copy(
                        isFollowing = !isFollowing,
                        followersCount = if (isFollowing) user.followersCount - 1 else user.followersCount + 1
                    )
                )
            }

            val result = if (isFollowing) {
                socialRepository.unfollowUser(user.uid)
            } else {
                socialRepository.followUser(user.uid)
            }

            if (result.isFailure) {
                _uiState.update {
                    it.copy(
                        user = user.copy(
                            isFollowing = isFollowing,
                            followersCount = user.followersCount
                        )
                    )
                }
            }
        }
    }

    fun sendFriendRequest() {
        viewModelScope.launch {
            val userId = _uiState.value.user?.uid ?: return@launch
            socialRepository.sendFriendRequest(userId)
        }
    }
}
