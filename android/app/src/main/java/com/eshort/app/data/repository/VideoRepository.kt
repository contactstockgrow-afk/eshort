package com.eshort.app.data.repository

import com.eshort.app.data.model.*
import com.eshort.app.data.remote.api.EShortApi
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VideoRepository @Inject constructor(
    private val api: EShortApi
) {
    suspend fun getForYouFeed(limit: Int = 10, cursor: String? = null): Result<Pair<List<Video>, Pagination?>> {
        return try {
            val response = api.getForYouFeed(limit, cursor)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(
                    Pair(response.body()?.data ?: emptyList(), response.body()?.pagination)
                )
            } else {
                Result.failure(Exception("Failed to fetch feed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getFollowingFeed(limit: Int = 10, cursor: String? = null): Result<List<Video>> {
        return try {
            val response = api.getFollowingFeed(limit, cursor)
            if (response.isSuccessful) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception("Failed to fetch following feed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun likeVideo(videoId: String): Result<Unit> {
        return try {
            val response = api.likeVideo(videoId)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Failed to like video"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun unlikeVideo(videoId: String): Result<Unit> {
        return try {
            val response = api.unlikeVideo(videoId)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Failed to unlike video"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun addComment(videoId: String, text: String): Result<Comment> {
        return try {
            val response = api.addComment(videoId, mapOf("text" to text))
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to add comment"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getComments(videoId: String, limit: Int = 20, cursor: String? = null): Result<List<Comment>> {
        return try {
            val response = api.getComments(videoId, limit, cursor)
            if (response.isSuccessful) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception("Failed to fetch comments"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun recordView(videoId: String, watchDuration: Int = 0): Result<Unit> {
        return try {
            api.recordView(videoId, mapOf("watchDuration" to watchDuration))
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun shareVideo(videoId: String): Result<Unit> {
        return try {
            api.shareVideo(videoId)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadVideo(
        file: File,
        caption: String?,
        hashtags: List<String>?
    ): Result<Video> {
        return try {
            val requestFile = file.asRequestBody("video/*".toMediaTypeOrNull())
            val videoPart = MultipartBody.Part.createFormData("video", file.name, requestFile)
            val captionBody = caption?.toRequestBody("text/plain".toMediaTypeOrNull())
            val hashtagsBody = hashtags?.joinToString(",")?.toRequestBody("text/plain".toMediaTypeOrNull())

            val response = api.uploadVideo(videoPart, captionBody, hashtagsBody)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Upload failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadProfilePicture(file: File): Result<String> {
        return try {
            val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
            val imagePart = MultipartBody.Part.createFormData("image", file.name, requestFile)
            val response = api.uploadProfilePicture(imagePart)
            if (response.isSuccessful && response.body()?.success == true) {
                val url = response.body()?.data?.get("profilePictureUrl") ?: ""
                Result.success(url)
            } else {
                Result.failure(Exception("Upload failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun unsaveVideo(videoId: String): Result<Unit> {
        return try {
            api.unsaveVideo(videoId)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun saveVideo(videoId: String): Result<Unit> {
        return try {
            api.saveVideo(videoId)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteVideo(videoId: String): Result<Unit> {
        return try {
            api.deleteVideo(videoId)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun search(query: String, type: String = "all"): Result<SearchResult> {
        return try {
            val response = api.search(query, type)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Search failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSearchSuggestions(query: String): Result<List<SearchSuggestion>> {
        return try {
            val response = api.getSearchSuggestions(query)
            if (response.isSuccessful) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception("Failed to get suggestions"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getTrending(): Result<TrendingData> {
        return try {
            val response = api.getTrending()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to fetch trending"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getDrafts(): Result<List<Draft>> {
        return try {
            val response = api.getDrafts()
            if (response.isSuccessful) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception("Failed to fetch drafts"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
