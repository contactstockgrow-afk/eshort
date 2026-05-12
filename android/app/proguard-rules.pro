# Retrofit
-keepattributes Signature
-keepattributes Exceptions
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Gson
-keepattributes *Annotation*
-keep class com.eshort.app.data.model.** { *; }
-keepclassmembers class com.eshort.app.data.model.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }

# ExoPlayer
-keep class androidx.media3.** { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
