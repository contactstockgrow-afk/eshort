package com.eshort.app.data.repository

import android.content.Context
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
            val firebaseIdToken = authResult.user?.getIdToken(false)?.await()?.token
                ?: return Result.failure(Exception("Failed to get ID token"))

            val response = api.googleSignIn(AuthRequest(idToken = firebaseIdToken))
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data?.isNewUser == true) {
                    Result.success(User(uid = data.uid ?: "", email = data.email ?: ""))
                } else {
                    data?.user?.let {
                        _currentUser.value = it
                        _isLoggedIn.value = true
                        Result.success(it)
                    } ?: Result.failure(Exception("No user data"))
                }
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Sign in failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
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

    suspend fun updateFcmToken(token: String) {
        try {
            api.updateFcmToken(mapOf("token" to token))
        } catch (_: Exception) {
        }
    }

    fun signOut() {
        firebaseAuth.signOut()
        _currentUser.value = null
        _isLoggedIn.value = false
    }
}
