package com.eshort.admin.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.eshort.admin.BuildConfig
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

val DarkBg = Color(0xFF0A0A0A)
val DarkSurface = Color(0xFF141414)
val DarkCard = Color(0xFF1E1E1E)
val Pink = Color(0xFFFF2D55)
val Blue = Color(0xFF007AFF)
val Green = Color(0xFF34C759)
val Red = Color(0xFFFF3B30)
val TextSec = Color(0xFFAAAAAA)
val TextTer = Color(0xFF666666)
val Divider = Color(0xFF2A2A2A)

data class ApiResp<T>(val success: Boolean, val data: T? = null, val error: ApiErr? = null, val message: String? = null)
data class ApiErr(val message: String)
data class AdminStats(val totalUsers: Int = 0, val totalVideos: Int = 0, val pendingReports: Int = 0, val newUsersToday: Int = 0)
data class AdminUser(val uid: String = "", val email: String = "", val displayName: String = "", val username: String = "", val role: String = "", val isBanned: Boolean = false, val createdAt: String = "")
data class AdminVideo(val id: String = "", val caption: String = "", val userId: String = "", val status: String = "", val viewsCount: Int = 0, val likesCount: Int = 0, val createdAt: String = "")
data class AdminReport(val id: String = "", val type: String = "", val reason: String = "", val status: String = "", val createdAt: String = "")
data class ApiKeyInfo(val id: String = "", val name: String = "", val keyPrefix: String = "", val permissions: List<String> = emptyList(), val isActive: Boolean = false, val usageCount: Int = 0, val createdAt: String = "")
data class ApiKeyCreated(val apiKey: String = "", val keyId: String = "", val name: String = "", val message: String = "")

interface AdminApi {
    @GET("admin/dashboard") suspend fun getStats(@Header("Authorization") auth: String): Response<ApiResp<AdminStats>>
    @GET("admin/users") suspend fun getUsers(@Header("Authorization") auth: String): Response<ApiResp<List<AdminUser>>>
    @GET("admin/videos") suspend fun getVideos(@Header("Authorization") auth: String): Response<ApiResp<List<AdminVideo>>>
    @GET("admin/reports") suspend fun getReports(@Header("Authorization") auth: String): Response<ApiResp<List<AdminReport>>>
    @PUT("admin/users/{uid}/ban") suspend fun banUser(@Header("Authorization") auth: String, @Path("uid") uid: String): Response<ApiResp<Any>>
    @PUT("admin/users/{uid}/unban") suspend fun unbanUser(@Header("Authorization") auth: String, @Path("uid") uid: String): Response<ApiResp<Any>>
    @DELETE("admin/videos/{id}") suspend fun deleteVideo(@Header("Authorization") auth: String, @Path("id") id: String): Response<ApiResp<Any>>
    @PUT("admin/reports/{id}/resolve") suspend fun resolveReport(@Header("Authorization") auth: String, @Path("id") id: String): Response<ApiResp<Any>>
    @GET("keys") suspend fun getApiKeys(@Header("Authorization") auth: String): Response<ApiResp<List<ApiKeyInfo>>>
    @POST("keys") suspend fun createApiKey(@Header("Authorization") auth: String, @Body body: Map<String, Any>): Response<ApiResp<ApiKeyCreated>>
    @DELETE("keys/{keyId}") suspend fun revokeApiKey(@Header("Authorization") auth: String, @Path("keyId") keyId: String): Response<ApiResp<Any>>
}

class AdminActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val client = OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY })
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
        val api = Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(AdminApi::class.java)

        setContent {
            MaterialTheme(colorScheme = darkColorScheme(primary = Pink, background = DarkBg, surface = DarkSurface)) {
                AdminApp(api)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminApp(api: AdminApi) {
    var authToken by remember { mutableStateOf("") }
    var isLoggedIn by remember { mutableStateOf(false) }
    var tokenInput by remember { mutableStateOf("") }
    var selectedTab by remember { mutableIntStateOf(0) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    if (!isLoggedIn) {
        // Admin login screen
        Column(
            modifier = Modifier.fillMaxSize().background(DarkBg).padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(Icons.Default.AdminPanelSettings, contentDescription = null, tint = Pink, modifier = Modifier.size(80.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("eShort Admin", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(modifier = Modifier.height(8.dp))
            Text("Admin access only", color = TextSec, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(32.dp))

            OutlinedTextField(
                value = tokenInput,
                onValueChange = { tokenInput = it },
                label = { Text("Firebase Admin Token") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = PasswordVisualTransformation(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Pink, unfocusedBorderColor = Divider,
                    focusedLabelColor = Pink, unfocusedLabelColor = TextSec,
                    cursorColor = Pink, focusedTextColor = Color.White, unfocusedTextColor = Color.White
                ),
                shape = RoundedCornerShape(12.dp)
            )

            if (error != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(error!!, color = Red, fontSize = 13.sp)
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    scope.launch {
                        try {
                            val resp = api.getStats("Bearer $tokenInput")
                            if (resp.isSuccessful && resp.body()?.success == true) {
                                authToken = tokenInput
                                isLoggedIn = true
                                error = null
                            } else {
                                error = resp.body()?.error?.message ?: "Access denied. Admin role required."
                            }
                        } catch (e: Exception) {
                            error = "Connection failed: ${e.message}"
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Pink),
                shape = RoundedCornerShape(12.dp),
                enabled = tokenInput.isNotEmpty()
            ) {
                Text("Login as Admin", fontWeight = FontWeight.SemiBold)
            }
        }
    } else {
        Scaffold(
            containerColor = DarkBg,
            bottomBar = {
                NavigationBar(containerColor = DarkSurface) {
                    val items = listOf("Dashboard" to Icons.Default.Dashboard, "Users" to Icons.Default.People,
                        "Videos" to Icons.Default.VideoLibrary, "Reports" to Icons.Default.Report, "API Keys" to Icons.Default.Key)
                    items.forEachIndexed { idx, (label, icon) ->
                        NavigationBarItem(
                            selected = selectedTab == idx,
                            onClick = { selectedTab = idx },
                            icon = { Icon(icon, contentDescription = label, tint = if (selectedTab == idx) Pink else TextSec) },
                            label = { Text(label, color = if (selectedTab == idx) Pink else TextSec, fontSize = 10.sp) },
                            colors = NavigationBarItemDefaults.colors(indicatorColor = Pink.copy(alpha = 0.1f))
                        )
                    }
                }
            }
        ) { padding ->
            Box(modifier = Modifier.padding(padding)) {
                when (selectedTab) {
                    0 -> DashboardTab(api, authToken)
                    1 -> UsersTab(api, authToken)
                    2 -> VideosTab(api, authToken)
                    3 -> ReportsTab(api, authToken)
                    4 -> ApiKeysTab(api, authToken)
                }
            }
        }
    }
}

@Composable
fun DashboardTab(api: AdminApi, token: String) {
    var stats by remember { mutableStateOf<AdminStats?>(null) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val resp = api.getStats("Bearer $token")
                if (resp.isSuccessful) stats = resp.body()?.data
            } catch (_: Exception) {}
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Dashboard", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(modifier = Modifier.height(20.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard("Users", "${stats?.totalUsers ?: 0}", Icons.Default.People, Blue, Modifier.weight(1f))
            StatCard("Videos", "${stats?.totalVideos ?: 0}", Icons.Default.VideoLibrary, Green, Modifier.weight(1f))
        }
        Spacer(modifier = Modifier.height(12.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard("Reports", "${stats?.pendingReports ?: 0}", Icons.Default.Report, Red, Modifier.weight(1f))
            StatCard("New Today", "${stats?.newUsersToday ?: 0}", Icons.Default.TrendingUp, Pink, Modifier.weight(1f))
        }
    }
}

@Composable
fun StatCard(title: String, value: String, icon: ImageVector, color: Color, modifier: Modifier = Modifier) {
    Card(modifier = modifier.height(100.dp), colors = CardDefaults.cardColors(containerColor = DarkCard), shape = RoundedCornerShape(16.dp)) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.SpaceBetween) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
            Column {
                Text(value, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text(title, fontSize = 12.sp, color = TextSec)
            }
        }
    }
}

@Composable
fun UsersTab(api: AdminApi, token: String) {
    var users by remember { mutableStateOf<List<AdminUser>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val resp = api.getUsers("Bearer $token")
                if (resp.isSuccessful) users = resp.body()?.data ?: emptyList()
            } catch (_: Exception) {}
            loading = false
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Users", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(modifier = Modifier.height(16.dp))
        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Pink) }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(users) { user ->
                    Card(colors = CardDefaults.cardColors(containerColor = DarkCard), shape = RoundedCornerShape(12.dp)) {
                        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("@${user.username}", color = Color.White, fontWeight = FontWeight.SemiBold)
                                Text(user.email, color = TextSec, fontSize = 12.sp)
                                Text("Role: ${user.role}", color = TextTer, fontSize = 11.sp)
                            }
                            if (user.isBanned) {
                                TextButton(onClick = {
                                    scope.launch { api.unbanUser("Bearer $token", user.uid) }
                                }) { Text("Unban", color = Green, fontSize = 12.sp) }
                            } else {
                                TextButton(onClick = {
                                    scope.launch { api.banUser("Bearer $token", user.uid) }
                                }) { Text("Ban", color = Red, fontSize = 12.sp) }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun VideosTab(api: AdminApi, token: String) {
    var videos by remember { mutableStateOf<List<AdminVideo>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val resp = api.getVideos("Bearer $token")
                if (resp.isSuccessful) videos = resp.body()?.data ?: emptyList()
            } catch (_: Exception) {}
            loading = false
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Videos", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(modifier = Modifier.height(16.dp))
        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Pink) }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(videos) { video ->
                    Card(colors = CardDefaults.cardColors(containerColor = DarkCard), shape = RoundedCornerShape(12.dp)) {
                        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(video.caption.ifEmpty { "No caption" }, color = Color.White, fontWeight = FontWeight.SemiBold, maxLines = 1)
                                Text("Views: ${video.viewsCount} | Likes: ${video.likesCount}", color = TextSec, fontSize = 12.sp)
                                Text("Status: ${video.status}", color = TextTer, fontSize = 11.sp)
                            }
                            IconButton(onClick = {
                                scope.launch { api.deleteVideo("Bearer $token", video.id) }
                            }) { Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Red) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ReportsTab(api: AdminApi, token: String) {
    var reports by remember { mutableStateOf<List<AdminReport>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val resp = api.getReports("Bearer $token")
                if (resp.isSuccessful) reports = resp.body()?.data ?: emptyList()
            } catch (_: Exception) {}
            loading = false
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Reports", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(modifier = Modifier.height(16.dp))
        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Pink) }
        } else if (reports.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No reports", color = TextSec, fontSize = 16.sp)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(reports) { report ->
                    Card(colors = CardDefaults.cardColors(containerColor = DarkCard), shape = RoundedCornerShape(12.dp)) {
                        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(report.reason, color = Color.White, fontWeight = FontWeight.SemiBold)
                                Text("Type: ${report.type} | Status: ${report.status}", color = TextSec, fontSize = 12.sp)
                            }
                            if (report.status == "pending") {
                                TextButton(onClick = {
                                    scope.launch { api.resolveReport("Bearer $token", report.id) }
                                }) { Text("Resolve", color = Green, fontSize = 12.sp) }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ApiKeysTab(api: AdminApi, token: String) {
    var keys by remember { mutableStateOf<List<ApiKeyInfo>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var showCreate by remember { mutableStateOf(false) }
    var newKeyName by remember { mutableStateOf("") }
    var createdKey by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun loadKeys() {
        scope.launch {
            loading = true
            try {
                val resp = api.getApiKeys("Bearer $token")
                if (resp.isSuccessful) keys = resp.body()?.data ?: emptyList()
            } catch (_: Exception) {}
            loading = false
        }
    }

    LaunchedEffect(Unit) { loadKeys() }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("API Keys", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Button(onClick = { showCreate = true }, colors = ButtonDefaults.buttonColors(containerColor = Pink), shape = RoundedCornerShape(8.dp)) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("New Key")
            }
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (createdKey != null) {
            Card(colors = CardDefaults.cardColors(containerColor = Green.copy(alpha = 0.15f)), shape = RoundedCornerShape(12.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("New API Key Created!", color = Green, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(createdKey!!, color = Color.White, fontSize = 12.sp)
                    Text("Copy this key now. It will not be shown again.", color = TextSec, fontSize = 11.sp)
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
        }

        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Pink) }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(keys) { key ->
                    Card(colors = CardDefaults.cardColors(containerColor = DarkCard), shape = RoundedCornerShape(12.dp)) {
                        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(key.name, color = Color.White, fontWeight = FontWeight.SemiBold)
                                Text(key.keyPrefix, color = TextSec, fontSize = 12.sp)
                                Text("Uses: ${key.usageCount} | ${if (key.isActive) "Active" else "Revoked"}", color = if (key.isActive) Green else Red, fontSize = 11.sp)
                            }
                            if (key.isActive) {
                                TextButton(onClick = {
                                    scope.launch {
                                        api.revokeApiKey("Bearer $token", key.id)
                                        loadKeys()
                                    }
                                }) { Text("Revoke", color = Red, fontSize = 12.sp) }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCreate) {
        AlertDialog(
            onDismissRequest = { showCreate = false },
            containerColor = DarkSurface,
            title = { Text("Create API Key", color = Color.White) },
            text = {
                OutlinedTextField(
                    value = newKeyName,
                    onValueChange = { newKeyName = it },
                    label = { Text("Key Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Pink, unfocusedBorderColor = Divider,
                        focusedLabelColor = Pink, unfocusedLabelColor = TextSec,
                        cursorColor = Pink, focusedTextColor = Color.White, unfocusedTextColor = Color.White
                    ),
                    shape = RoundedCornerShape(12.dp)
                )
            },
            confirmButton = {
                Button(onClick = {
                    scope.launch {
                        try {
                            val resp = api.createApiKey("Bearer $token", mapOf("name" to newKeyName, "permissions" to listOf("read", "write")))
                            if (resp.isSuccessful) {
                                createdKey = resp.body()?.data?.apiKey
                                showCreate = false
                                newKeyName = ""
                                loadKeys()
                            }
                        } catch (_: Exception) {}
                    }
                }, colors = ButtonDefaults.buttonColors(containerColor = Pink)) { Text("Create") }
            },
            dismissButton = { TextButton(onClick = { showCreate = false }) { Text("Cancel", color = TextSec) } }
        )
    }
}
