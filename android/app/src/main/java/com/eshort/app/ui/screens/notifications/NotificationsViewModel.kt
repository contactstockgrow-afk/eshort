package com.eshort.app.ui.screens.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eshort.app.data.model.*
import com.eshort.app.data.repository.SocialRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotificationsUiState(
    val notifications: List<Notification> = emptyList(),
    val pendingRequests: List<FriendRequest> = emptyList(),
    val friends: List<UserPreview> = emptyList(),
    val unreadCount: Int = 0,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val socialRepository: SocialRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationsUiState())
    val uiState: StateFlow<NotificationsUiState> = _uiState.asStateFlow()

    init {
        loadAll()
    }

    private fun loadAll() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            launch {
                socialRepository.getNotifications().fold(
                    onSuccess = { (notifications, _) ->
                        _uiState.update { it.copy(notifications = notifications) }
                    },
                    onFailure = { }
                )
            }

            launch {
                socialRepository.getUnreadCount().fold(
                    onSuccess = { count ->
                        _uiState.update { it.copy(unreadCount = count) }
                    },
                    onFailure = { }
                )
            }

            launch {
                socialRepository.getPendingFriendRequests().fold(
                    onSuccess = { requests ->
                        _uiState.update { it.copy(pendingRequests = requests) }
                    },
                    onFailure = { }
                )
            }

            launch {
                socialRepository.getFriends().fold(
                    onSuccess = { friends ->
                        _uiState.update { it.copy(friends = friends) }
                    },
                    onFailure = { }
                )
            }

            _uiState.update { it.copy(isLoading = false) }
        }
    }

    fun markRead(notificationId: String) {
        viewModelScope.launch {
            socialRepository.markNotificationRead(notificationId)
            _uiState.update { state ->
                state.copy(
                    notifications = state.notifications.map {
                        if (it.id == notificationId) it.copy(read = true) else it
                    },
                    unreadCount = (state.unreadCount - 1).coerceAtLeast(0)
                )
            }
        }
    }

    fun markAllRead() {
        viewModelScope.launch {
            socialRepository.markAllNotificationsRead()
            _uiState.update { state ->
                state.copy(
                    notifications = state.notifications.map { it.copy(read = true) },
                    unreadCount = 0
                )
            }
        }
    }

    fun acceptRequest(requestId: String) {
        viewModelScope.launch {
            socialRepository.acceptFriendRequest(requestId).fold(
                onSuccess = {
                    _uiState.update { state ->
                        state.copy(
                            pendingRequests = state.pendingRequests.filter { it.id != requestId }
                        )
                    }
                    loadAll()
                },
                onFailure = { }
            )
        }
    }

    fun rejectRequest(requestId: String) {
        viewModelScope.launch {
            socialRepository.rejectFriendRequest(requestId).fold(
                onSuccess = {
                    _uiState.update { state ->
                        state.copy(
                            pendingRequests = state.pendingRequests.filter { it.id != requestId }
                        )
                    }
                },
                onFailure = { }
            )
        }
    }
}
