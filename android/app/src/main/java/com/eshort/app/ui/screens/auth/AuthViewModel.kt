package com.eshort.app.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eshort.app.data.model.User
import com.eshort.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isNewUser: Boolean = false,
    val pendingUser: User? = null
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    val isLoggedIn = authRepository.isLoggedIn
    val currentUser = authRepository.currentUser

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun signInWithGoogle(idToken: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            authRepository.signInWithGoogle(idToken).fold(
                onSuccess = { user ->
                    if (user.username.isEmpty()) {
                        _uiState.update {
                            it.copy(isLoading = false, isNewUser = true, pendingUser = user)
                        }
                    } else {
                        _uiState.update { it.copy(isLoading = false) }
                    }
                },
                onFailure = { e ->
                    _uiState.update {
                        it.copy(isLoading = false, error = e.message ?: "Sign in failed")
                    }
                }
            )
        }
    }

    fun register(displayName: String, username: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val user = _uiState.value.pendingUser
            val idToken = authRepository.firebaseUser?.uid ?: ""

            authRepository.register(
                idToken = idToken,
                email = user?.email ?: "",
                displayName = displayName,
                username = username
            ).fold(
                onSuccess = {
                    _uiState.update { it.copy(isLoading = false, isNewUser = false) }
                },
                onFailure = { e ->
                    _uiState.update {
                        it.copy(isLoading = false, error = e.message ?: "Registration failed")
                    }
                }
            )
        }
    }

    fun signOut() {
        authRepository.signOut()
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
