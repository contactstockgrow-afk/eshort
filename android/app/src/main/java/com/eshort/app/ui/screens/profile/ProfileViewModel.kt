package com.eshort.app.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eshort.app.data.model.User
import com.eshort.app.data.model.Video
import com.eshort.app.data.repository.AuthRepository
import com.eshort.app.data.repository.SocialRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val user: User? = null,
    val userVideos: List<Video> = emptyList(),
    val savedVideos: List<Video> = emptyList(),
    val likedVideos: List<Video> = emptyList(),
    val isLoading: Boolean = false,
    val isEditMode: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val socialRepository: SocialRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    private fun loadProfile() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            authRepository.getCurrentUser().fold(
                onSuccess = { user ->
                    _uiState.update { it.copy(user = user, isLoading = false) }
                    loadUserVideos()
                },
                onFailure = { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
            )
        }
    }

    fun loadUserVideos() {
        viewModelScope.launch {
            val uid = _uiState.value.user?.uid ?: return@launch
            socialRepository.getUserVideos(uid).fold(
                onSuccess = { videos ->
                    _uiState.update { it.copy(userVideos = videos) }
                },
                onFailure = { }
            )
        }
    }

    fun loadSavedVideos() {
        viewModelScope.launch {
            socialRepository.getSavedVideos().fold(
                onSuccess = { videos ->
                    _uiState.update { it.copy(savedVideos = videos) }
                },
                onFailure = { }
            )
        }
    }

    fun loadLikedVideos() {
        viewModelScope.launch {
            socialRepository.getLikedVideos().fold(
                onSuccess = { videos ->
                    _uiState.update { it.copy(likedVideos = videos) }
                },
                onFailure = { }
            )
        }
    }

    fun toggleEditMode() {
        _uiState.update { it.copy(isEditMode = !it.isEditMode) }
    }

    fun signOut() {
        authRepository.signOut()
    }
}
