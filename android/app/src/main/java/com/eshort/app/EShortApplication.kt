package com.eshort.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.util.Log
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class EShortApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        setupExceptionHandler()
        createNotificationChannels()
    }

    private fun setupExceptionHandler() {
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e("eShort", "CRASH in ${thread.name}: ${throwable.message}", throwable)
            try {
                val prefs = getSharedPreferences("eshort_crash", MODE_PRIVATE)
                val trace = throwable.stackTraceToString().take(2000)
                prefs.edit()
                    .putString("last_crash", "${throwable.javaClass.simpleName}: ${throwable.message}")
                    .putString("last_crash_trace", trace)
                    .putLong("last_crash_time", System.currentTimeMillis())
                    .apply()
            } catch (_: Exception) {}
            defaultHandler?.uncaughtException(thread, throwable)
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "eShort Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifications from eShort"
                enableLights(true)
                enableVibration(true)
            }

            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    companion object {
        const val NOTIFICATION_CHANNEL_ID = "eshort_notifications"
    }
}
