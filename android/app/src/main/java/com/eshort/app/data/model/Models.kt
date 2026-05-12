package com.eshort.app.data.model

import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null,
    val error: ApiError? = null,
    val pagination: Pagination? = null
)

data class ApiError(val message: String)

data class Pagination(
    val hasMore: Boolean,
    val nextCursor: String? = null,
    val total: Int? = null
)

data class User(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val username: String = "",
    val bio: String = "",
    val profilePictureUrl: String = "",
    val followersCount: Int = 0,
    val followingCount: Int = 0,
    val videosCount: Int = 0,
    val likesCount: Int = 0,
    val friendsCount: Int = 0,
    val isVerified: Boolean = false,
    val isPrivate: Boolean = false,
    val driveConnected: Boolean = false,
    val isFollowing: Boolean = false,
    val isFriend: Boolean = false,
    val createdAt: String = ""
)

data class Video(
    val id: String = "",
    val userId: String = "",
    val videoUrl: String = "",
    val videoDirectUrl: String = "",
    val thumbnailUrl: String = "",
    val caption: String = "",
    val hashtags: List<String> = emptyList(),
    val isPrivate: Boolean = false,
    val viewsCount: Int = 0,
    val likesCount: Int = 0,
    val commentsCount: Int = 0,
    val sharesCount: Int = 0,
    val duration: Int = 0,
    val status: String = "",
    val user: UserPreview? = null,
    val isLiked: Boolean = false,
    val isFollowing: Boolean = false,
    val createdAt: String = ""
)

data class UserPreview(
    val uid: String = "",
    val displayName: String = "",
    val username: String = "",
    val profilePictureUrl: String = "",
    val isVerified: Boolean = false
)

data class Comment(
    val id: String = "",
    val videoId: String = "",
    val userId: String = "",
    val text: String = "",
    val likesCount: Int = 0,
    val user: UserPreview? = null,
    val createdAt: String = ""
)

data class Notification(
    val id: String = "",
    val userId: String = "",
    val type: String = "",
    val fromUserId: String? = null,
    val videoId: String? = null,
    val message: String = "",
    val read: Boolean = false,
    val fromUser: UserPreview? = null,
    val createdAt: String = ""
)

data class FriendRequest(
    val id: String = "",
    val fromUserId: String = "",
    val toUserId: String = "",
    val status: String = "",
    val fromUser: UserPreview? = null,
    val createdAt: String = ""
)

data class Hashtag(
    val id: String = "",
    val tag: String = "",
    val count: Int = 0
)

data class SearchResult(
    val users: List<UserPreview>? = null,
    val videos: List<Video>? = null,
    val hashtags: List<Hashtag>? = null
)

data class SearchSuggestion(
    val type: String = "",
    val value: String = "",
    val displayName: String? = null,
    val count: Int? = null
)

data class TrendingData(
    val trendingHashtags: List<Hashtag> = emptyList(),
    val suggestedCreators: List<UserPreview> = emptyList()
)

data class AuthRequest(
    @SerializedName("idToken") val idToken: String,
    val email: String? = null,
    val displayName: String? = null,
    val username: String? = null
)

data class AuthResponse(
    val user: User? = null,
    val isNewUser: Boolean = false,
    val uid: String? = null,
    val email: String? = null
)

data class DriveAuthResponse(
    val authUrl: String
)

data class UnreadCountResponse(
    val count: Int
)

data class UploadStatusResponse(
    val userId: String = "",
    val status: String = "",
    val progress: Int = 0,
    val videoId: String? = null
)

data class Draft(
    val id: String = "",
    val caption: String = "",
    val hashtags: List<String> = emptyList(),
    val thumbnailUrl: String = "",
    val createdAt: String = "",
    val updatedAt: String = ""
)
