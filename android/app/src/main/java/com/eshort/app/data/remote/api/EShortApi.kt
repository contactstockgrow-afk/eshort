package com.eshort.app.data.remote.api

import com.eshort.app.data.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface EShortApi {

    // Auth
    @POST("auth/google-signin")
    suspend fun googleSignIn(@Body request: AuthRequest): Response<ApiResponse<AuthResponse>>

    @POST("auth/register")
    suspend fun register(@Body request: AuthRequest): Response<ApiResponse<AuthResponse>>

    @GET("auth/me")
    suspend fun getCurrentUser(): Response<ApiResponse<Map<String, User>>>

    @PUT("auth/me")
    suspend fun updateProfile(@Body updates: Map<String, Any>): Response<ApiResponse<Any>>

    @GET("auth/google/drive-auth-url")
    suspend fun getDriveAuthUrl(): Response<ApiResponse<DriveAuthResponse>>

    @POST("auth/fcm-token")
    suspend fun updateFcmToken(@Body body: Map<String, String>): Response<ApiResponse<Any>>

    // Feed
    @GET("feed/for-you")
    suspend fun getForYouFeed(
        @Query("limit") limit: Int = 10,
        @Query("cursor") cursor: String? = null
    ): Response<ApiResponse<List<Video>>>

    @GET("feed/following")
    suspend fun getFollowingFeed(
        @Query("limit") limit: Int = 10,
        @Query("cursor") cursor: String? = null
    ): Response<ApiResponse<List<Video>>>

    // Videos
    @GET("videos/trending")
    suspend fun getTrendingVideos(
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<List<Video>>>

    @GET("videos/{videoId}")
    suspend fun getVideo(@Path("videoId") videoId: String): Response<ApiResponse<Video>>

    @POST("videos/{videoId}/like")
    suspend fun likeVideo(@Path("videoId") videoId: String): Response<ApiResponse<Any>>

    @DELETE("videos/{videoId}/like")
    suspend fun unlikeVideo(@Path("videoId") videoId: String): Response<ApiResponse<Any>>

    @POST("videos/{videoId}/comment")
    suspend fun addComment(
        @Path("videoId") videoId: String,
        @Body body: Map<String, String>
    ): Response<ApiResponse<Comment>>

    @GET("videos/{videoId}/comments")
    suspend fun getComments(
        @Path("videoId") videoId: String,
        @Query("limit") limit: Int = 20,
        @Query("cursor") cursor: String? = null
    ): Response<ApiResponse<List<Comment>>>

    @POST("videos/{videoId}/view")
    suspend fun recordView(
        @Path("videoId") videoId: String,
        @Body body: Map<String, Int>
    ): Response<ApiResponse<Any>>

    @POST("videos/{videoId}/share")
    suspend fun shareVideo(@Path("videoId") videoId: String): Response<ApiResponse<Any>>

    @POST("videos/{videoId}/save")
    suspend fun saveVideo(@Path("videoId") videoId: String): Response<ApiResponse<Any>>

    @DELETE("videos/{videoId}/save")
    suspend fun unsaveVideo(@Path("videoId") videoId: String): Response<ApiResponse<Any>>

    @DELETE("videos/{videoId}")
    suspend fun deleteVideo(@Path("videoId") videoId: String): Response<ApiResponse<Any>>

    // Upload
    @Multipart
    @POST("upload/video")
    suspend fun uploadVideo(
        @Part video: MultipartBody.Part,
        @Part("caption") caption: RequestBody?,
        @Part("hashtags") hashtags: RequestBody?
    ): Response<ApiResponse<Video>>

    @Multipart
    @POST("upload/profile-picture")
    suspend fun uploadProfilePicture(
        @Part image: MultipartBody.Part
    ): Response<ApiResponse<Map<String, String>>>

    @GET("upload/status/{uploadId}")
    suspend fun getUploadStatus(
        @Path("uploadId") uploadId: String
    ): Response<ApiResponse<UploadStatusResponse>>

    @GET("upload/drafts")
    suspend fun getDrafts(): Response<ApiResponse<List<Draft>>>

    @POST("upload/draft")
    suspend fun saveDraft(@Body draft: Map<String, Any>): Response<ApiResponse<Draft>>

    @DELETE("upload/draft/{draftId}")
    suspend fun deleteDraft(@Path("draftId") draftId: String): Response<ApiResponse<Any>>

    // Users
    @GET("users/{userId}")
    suspend fun getUserProfile(
        @Path("userId") userId: String
    ): Response<ApiResponse<Map<String, User>>>

    @GET("users/{userId}/videos")
    suspend fun getUserVideos(
        @Path("userId") userId: String,
        @Query("limit") limit: Int = 20,
        @Query("cursor") cursor: String? = null
    ): Response<ApiResponse<List<Video>>>

    @POST("users/{userId}/follow")
    suspend fun followUser(@Path("userId") userId: String): Response<ApiResponse<Any>>

    @DELETE("users/{userId}/follow")
    suspend fun unfollowUser(@Path("userId") userId: String): Response<ApiResponse<Any>>

    @GET("users/{userId}/followers")
    suspend fun getFollowers(@Path("userId") userId: String): Response<ApiResponse<List<UserPreview>>>

    @GET("users/{userId}/following")
    suspend fun getFollowing(@Path("userId") userId: String): Response<ApiResponse<List<UserPreview>>>

    @GET("users/me/saved")
    suspend fun getSavedVideos(): Response<ApiResponse<List<Video>>>

    @GET("users/me/liked")
    suspend fun getLikedVideos(): Response<ApiResponse<List<Video>>>

    @POST("users/{userId}/block")
    suspend fun blockUser(@Path("userId") userId: String): Response<ApiResponse<Any>>

    @DELETE("users/{userId}/block")
    suspend fun unblockUser(@Path("userId") userId: String): Response<ApiResponse<Any>>

    // Search
    @GET("search")
    suspend fun search(
        @Query("q") query: String,
        @Query("type") type: String = "all",
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<SearchResult>>

    @GET("search/suggestions")
    suspend fun getSearchSuggestions(
        @Query("q") query: String
    ): Response<ApiResponse<List<SearchSuggestion>>>

    @GET("search/trending")
    suspend fun getTrending(): Response<ApiResponse<TrendingData>>

    @GET("search/hashtags/{tag}")
    suspend fun getHashtagVideos(
        @Path("tag") tag: String,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<List<Video>>>

    // Social
    @POST("social/friend-request/{userId}")
    suspend fun sendFriendRequest(@Path("userId") userId: String): Response<ApiResponse<FriendRequest>>

    @POST("social/friend-request/{requestId}/accept")
    suspend fun acceptFriendRequest(@Path("requestId") requestId: String): Response<ApiResponse<Any>>

    @POST("social/friend-request/{requestId}/reject")
    suspend fun rejectFriendRequest(@Path("requestId") requestId: String): Response<ApiResponse<Any>>

    @GET("social/friend-requests/pending")
    suspend fun getPendingFriendRequests(): Response<ApiResponse<List<FriendRequest>>>

    @GET("social/friends")
    suspend fun getFriends(): Response<ApiResponse<List<UserPreview>>>

    // Notifications
    @GET("notifications")
    suspend fun getNotifications(
        @Query("limit") limit: Int = 20,
        @Query("cursor") cursor: String? = null
    ): Response<ApiResponse<List<Notification>>>

    @GET("notifications/unread-count")
    suspend fun getUnreadCount(): Response<ApiResponse<UnreadCountResponse>>

    @PUT("notifications/{notificationId}/read")
    suspend fun markNotificationRead(
        @Path("notificationId") id: String
    ): Response<ApiResponse<Any>>

    @PUT("notifications/read-all")
    suspend fun markAllNotificationsRead(): Response<ApiResponse<Any>>
}
