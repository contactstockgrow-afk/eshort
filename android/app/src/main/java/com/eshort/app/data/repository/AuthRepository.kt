package com.eshort.app.data.repository

import android.content.Context
import android.util.Log
import com.eshort.app.data.model.AuthRequest
import com.eshort.app.data.model.User
import com.eshort.app.data.remote.api.EShortApi
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val firebaseAuth: FirebaseAuth,
    private val api: EShortApi,
    private val context: Context
) {
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser

    private val _isLoggedIn = MutableStateFlow(firebaseAuth.currentUser != null)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn

    val firebaseUser get() = firebaseAuth.currentUser

    suspend fun signInWithGoogle(idToken: String): Result<User> {
        return try {
            val credential = GoogleAuthProvider.getCredential(idToken, null)
            val authResult = firebaseAuth.signInWithCredential(credential).await()
            val fbUser = authResult.user
                ?: return Result.failure(Exception("Firebase auth failed"))

            val user = User(
                uid = fbUser.uid,
                email = fbUser.email ?: "",
                displayName = fbUser.displayName ?: "",
                username = fbUser.email?.substringBefore("@") ?: "user_${fbUser.uid.take(8)}",
                profilePictureUrl = fbUser.photoUrl?.toString() ?: ""
            )
            _currentUser.value = user
            _isLoggedIn.value = true

            syncWithBackend(fbUser.uid)

            Result.success(user)
        } catch (e: Exception) {
            Log.e("AuthRepository", "Sign-in failed", e)
            Result.failure(e)
        }
    }

    fun signInAsGuest(): Result<User> {
        val guestId = "guest_${System.currentTimeMillis()}"
        val user = User(
            uid = guestId,
            email = "",
            displayName = "Guest User",
            username = "guest_${guestId.takeLast(6)}",
            bio = "Browsing as guest"
        )
        _currentUser.value = user
        _isLoggedIn.value = true
        return Result.success(user)
    }

    private suspend fun syncWithBackend(uid: String) {
        try {
            val firebaseIdToken = firebaseAuth.currentUser?.getIdToken(false)?.await()?.token
                ?: return
            val response = api.googleSignIn(AuthRequest(idToken = firebaseIdToken))
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data?.user != null) {
                    _currentUser.value = data.user
                }
            }
        } catch (e: Exception) {
            Log.w("AuthRepository", "Backend sync failed (non-critical)", e)
        }
    }

    suspend fun register(
        idToken: String,
        email: String,
        displayName: String,
        username: String
    ): Result<User> {
        return try {
            val firebaseIdToken = firebaseAuth.currentUser?.getIdToken(false)?.await()?.token
                ?: return Result.failure(Exception("Not authenticated"))

            val response = api.register(
                AuthRequest(
                    idToken = firebaseIdToken,
                    email = email,
                    displayName = displayName,
                    username = username
                )
            )

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                data?.user?.let {
                    _currentUser.value = it
                    _isLoggedIn.value = true
                    Result.success(it)
                } ?: Result.failure(Exception("No user data"))
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Registration failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCurrentUser(): Result<User> {
        return try {
            val response = api.getCurrentUser()
            if (response.isSuccessful && response.body()?.success == true) {
                val user = response.body()?.data?.get("user")
                user?.let {
                    _currentUser.value = it
                    Result.success(it)
                } ?: Result.failure(Exception("No user data"))
            } else {
                Result.failure(Exception("Failed to fetch user"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateProfile(updates: Map<String, Any>): Result<Unit> {
        return try {
            val response = api.updateProfile(updates)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Update failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getDriveAuthUrl(): Result<String> {
        return try {
            val response = api.getDriveAuthUrl()
            if (response.isSuccessful && response.body()?.success == true) {
                val url = response.body()?.data?.authUrl
                url?.let { Result.success(it) }
                    ?: Result.failure(Exception("No auth URL"))
            } else {
                Result.failure(Exception("Failed to get Drive auth URL"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun signOut() {
        firebaseAuth.signOut()
        _currentUser.value = null
        _isLoggedIn.value = false
    }
}
