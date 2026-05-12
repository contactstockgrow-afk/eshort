package com.eshort.app.ui.screens.upload

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eshort.app.data.repository.VideoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject

data class UploadUiState(
    val selectedVideoUri: Uri? = null,
    val caption: String = "",
    val hashtagInput: String = "",
    val hashtags: List<String> = emptyList(),
    val isUploading: Boolean = false,
    val uploadProgress: Int = 0,
    val uploadSuccess: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class UploadViewModel @Inject constructor(
    private val videoRepository: VideoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(UploadUiState())
    val uiState: StateFlow<UploadUiState> = _uiState.asStateFlow()

    fun setSelectedVideo(uri: Uri, context: Context) {
        _uiState.update { it.copy(selectedVideoUri = uri, error = null) }
    }

    fun clearSelection() {
        _uiState.update { UploadUiState() }
    }

    fun updateCaption(caption: String) {
        if (caption.length <= 500) {
            _uiState.update { it.copy(caption = caption) }
        }
    }

    fun updateHashtagInput(input: String) {
        _uiState.update { it.copy(hashtagInput = input) }
        val tags = input.split(",", " ", "#")
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .distinct()
            .take(30)
        _uiState.update { it.copy(hashtags = tags) }
    }

    fun removeHashtag(tag: String) {
        _uiState.update { state ->
            val newTags = state.hashtags.filter { it != tag }
            state.copy(hashtags = newTags, hashtagInput = newTags.joinToString(", "))
        }
    }

    fun uploadVideo(context: Context) {
        val uri = _uiState.value.selectedVideoUri ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(isUploading = true, uploadProgress = 0, error = null) }

            try {
                val file = uriToFile(uri, context)
                if (file == null) {
                    _uiState.update { it.copy(isUploading = false, error = "Could not access video file") }
                    return@launch
                }

                _uiState.update { it.copy(uploadProgress = 30) }

                val result = videoRepository.uploadVideo(
                    file = file,
                    caption = _uiState.value.caption.ifEmpty { null },
                    hashtags = _uiState.value.hashtags.ifEmpty { null }
                )

                result.fold(
                    onSuccess = {
                        _uiState.update { it.copy(isUploading = false, uploadProgress = 100, uploadSuccess = true) }
                    },
                    onFailure = { e ->
                        _uiState.update { it.copy(isUploading = false, error = e.message ?: "Upload failed") }
                    }
                )

                file.delete()
            } catch (e: Exception) {
                _uiState.update { it.copy(isUploading = false, error = e.message ?: "Upload failed") }
            }
        }
    }

    fun saveDraft() {
        viewModelScope.launch {
            videoRepository.getDrafts()
        }
    }

    private fun uriToFile(uri: Uri, context: Context): File? {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri) ?: return null
            val fileName = getFileName(uri, context) ?: "video_${System.currentTimeMillis()}.mp4"
            val file = File(context.cacheDir, fileName)
            FileOutputStream(file).use { output ->
                inputStream.copyTo(output)
            }
            inputStream.close()
            file
        } catch (e: Exception) {
            null
        }
    }

    private fun getFileName(uri: Uri, context: Context): String? {
        var name: String? = null
        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (cursor.moveToFirst() && nameIndex >= 0) {
                name = cursor.getString(nameIndex)
            }
        }
        return name
    }
}
