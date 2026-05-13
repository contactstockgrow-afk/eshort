package com.eshort.app.ui.screens.profile

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eshort.app.data.model.User
import com.eshort.app.data.model.Video
import com.eshort.app.data.repository.AuthRepository
import com.eshort.app.data.repository.SocialRepository
import com.eshort.app.data.repository.VideoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject

data class ProfileUiState(
    val user: User? = null,
    val userVideos: List<Video> = emptyList(),
    val savedVideos: List<Video> = emptyList(),
    val likedVideos: List<Video> = emptyList(),
    val isLoading: Boolean = false,
    val isEditMode: Boolean = false,
    val editDisplayName: String = "",
    val editBio: String = "",
    val editIsPrivate: Boolean = false,
    val isSaving: Boolean = false,
    val isUploadingPicture: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val socialRepository: SocialRepository,
    private val videoRepository: VideoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    private val handler = CoroutineExceptionHandler { _, e ->
        Log.e("ProfileVM", "Coroutine error", e)
        _uiState.update { it.copy(isLoading = false) }
    }

    init {
        try {
            val user = authRepository.currentUser.value
            if (user != null) {
                _uiState.update { it.copy(user = user, editDisplayName = user.displayName, editBio = user.bio) }
            }
            loadProfile()
        } catch (e: Exception) { Log.e("ProfileVM", "Init error", e) }
    }

    private fun loadProfile() {
        viewModelScope.launch(handler) {
            _uiState.update { it.copy(isLoading = true) }
            authRepository.getCurrentUser().fold(
                onSuccess = { user ->
                    _uiState.update {
                        it.copy(
                            user = user,
                            isLoading = false,
                            editDisplayName = user.displayName,
                            editBio = user.bio,
                            editIsPrivate = user.isPrivate
                        )
                    }
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
        val user = _uiState.value.user
        _uiState.update {
            it.copy(
                isEditMode = !it.isEditMode,
                editDisplayName = user?.displayName ?: "",
                editBio = user?.bio ?: "",
                editIsPrivate = user?.isPrivate ?: false,
                error = null
            )
        }
    }

    fun updateEditDisplayName(name: String) {
        if (name.length <= 50) _uiState.update { it.copy(editDisplayName = name) }
    }

    fun updateEditBio(bio: String) {
        if (bio.length <= 200) _uiState.update { it.copy(editBio = bio) }
    }

    fun updateEditPrivacy(isPrivate: Boolean) {
        _uiState.update { it.copy(editIsPrivate = isPrivate) }
    }

    fun saveProfile() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, error = null) }
            val updates = mutableMapOf<String, Any>(
                "displayName" to _uiState.value.editDisplayName,
                "bio" to _uiState.value.editBio,
                "isPrivate" to _uiState.value.editIsPrivate
            )
            authRepository.updateProfile(updates).fold(
                onSuccess = {
                    _uiState.update { state ->
                        state.copy(
                            user = state.user?.copy(
                                displayName = state.editDisplayName,
                                bio = state.editBio,
                                isPrivate = state.editIsPrivate
                            ),
                            isSaving = false,
                            isEditMode = false,
                            successMessage = "Profile updated"
                        )
                    }
                },
                onFailure = { e ->
                    _uiState.update { it.copy(isSaving = false, error = e.message ?: "Update failed") }
                }
            )
        }
    }

    fun uploadProfilePicture(uri: Uri, context: Context) {
        viewModelScope.launch {
            _uiState.update { it.copy(isUploadingPicture = true, error = null) }
            try {
                val file = uriToFile(uri, context)
                if (file == null) {
                    _uiState.update { it.copy(isUploadingPicture = false, error = "Could not access image") }
                    return@launch
                }
                videoRepository.uploadProfilePicture(file).fold(
                    onSuccess = { url ->
                        _uiState.update { state ->
                            state.copy(
                                user = state.user?.copy(profilePictureUrl = url),
                                isUploadingPicture = false,
                                successMessage = "Profile picture updated"
                            )
                        }
                    },
                    onFailure = { e ->
                        _uiState.update { it.copy(isUploadingPicture = false, error = e.message ?: "Upload failed") }
                    }
                )
                file.delete()
            } catch (e: Exception) {
                _uiState.update { it.copy(isUploadingPicture = false, error = e.message) }
            }
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(error = null, successMessage = null) }
    }

    fun signOut() {
        authRepository.signOut()
    }

    private fun uriToFile(uri: Uri, context: Context): File? {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri) ?: return null
            var name = "profile_${System.currentTimeMillis()}.jpg"
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (cursor.moveToFirst() && idx >= 0) name = cursor.getString(idx)
            }
            val file = File(context.cacheDir, name)
            FileOutputStream(file).use { output -> inputStream.copyTo(output) }
            inputStream.close()
            file
        } catch (_: Exception) {
            null
        }
    }
}
