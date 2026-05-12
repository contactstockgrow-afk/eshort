package com.eshort.app.data.repository

import com.eshort.app.data.model.*
import com.eshort.app.data.remote.api.EShortApi
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SocialRepository @Inject constructor(
    private val api: EShortApi
) {
    suspend fun getUserProfile(userId: String): Result<User> {
        return try {
            val response = api.getUserProfile(userId)
            if (response.isSuccessful && response.body()?.success == true) {
                val user = response.body()?.data?.get("user")
                user?.let { Result.success(it) }
                    ?: Result.failure(Exception("User not found"))
            } else {
                Result.failure(Exception("Failed to fetch profile"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUserVideos(userId: String, limit: Int = 20, cursor: String? = null): Result<List<Video>> {
        return try {
            val response = api.getUserVideos(userId, limit, cursor)
            if (response.isSuccessful) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception("Failed to fetch user videos"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun followUser(userId: String): Result<Unit> {
        return try {
            val response = api.followUser(userId)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Failed to follow"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun unfollowUser(userId: String): Result<Unit> {
        return try {
            val response = api.unfollowUser(userId)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Failed to unfollow"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getFollowers(userId: String): Result<List<UserPreview>> {
        return try {
            val response = api.getFollowers(userId)
            if (response.isSuccessful) Result.success(response.body()?.data ?: emptyList())
            else Result.failure(Exception("Failed to fetch followers"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getFollowing(userId: String): Result<List<UserPreview>> {
        return try {
            val response = api.getFollowing(userId)
            if (response.isSuccessful) Result.success(response.body()?.data ?: emptyList())
            else Result.failure(Exception("Failed to fetch following"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendFriendRequest(userId: String): Result<FriendRequest> {
        return try {
            val response = api.sendFriendRequest(userId)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to send request"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun acceptFriendRequest(requestId: String): Result<Unit> {
        return try {
            val response = api.acceptFriendRequest(requestId)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Failed to accept"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun rejectFriendRequest(requestId: String): Result<Unit> {
        return try {
            val response = api.rejectFriendRequest(requestId)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Failed to reject"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPendingFriendRequests(): Result<List<FriendRequest>> {
        return try {
            val response = api.getPendingFriendRequests()
            if (response.isSuccessful) Result.success(response.body()?.data ?: emptyList())
            else Result.failure(Exception("Failed to fetch requests"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getFriends(): Result<List<UserPreview>> {
        return try {
            val response = api.getFriends()
            if (response.isSuccessful) Result.success(response.body()?.data ?: emptyList())
            else Result.failure(Exception("Failed to fetch friends"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getNotifications(limit: Int = 20, cursor: String? = null): Result<Pair<List<Notification>, Pagination?>> {
        return try {
            val response = api.getNotifications(limit, cursor)
            if (response.isSuccessful) {
                Result.success(Pair(response.body()?.data ?: emptyList(), response.body()?.pagination))
            } else {
                Result.failure(Exception("Failed to fetch notifications"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUnreadCount(): Result<Int> {
        return try {
            val response = api.getUnreadCount()
            if (response.isSuccessful) {
                Result.success(response.body()?.data?.count ?: 0)
            } else {
                Result.failure(Exception("Failed to get count"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markNotificationRead(notificationId: String): Result<Unit> {
        return try {
            api.markNotificationRead(notificationId)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markAllNotificationsRead(): Result<Unit> {
        return try {
            api.markAllNotificationsRead()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSavedVideos(): Result<List<Video>> {
        return try {
            val response = api.getSavedVideos()
            if (response.isSuccessful) Result.success(response.body()?.data ?: emptyList())
            else Result.failure(Exception("Failed to fetch saved videos"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLikedVideos(): Result<List<Video>> {
        return try {
            val response = api.getLikedVideos()
            if (response.isSuccessful) Result.success(response.body()?.data ?: emptyList())
            else Result.failure(Exception("Failed to fetch liked videos"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun blockUser(userId: String): Result<Unit> {
        return try {
            api.blockUser(userId)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
