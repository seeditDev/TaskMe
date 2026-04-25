// Native Android Update Manager (Kotlin)
// For bare React Native workflow or pure Android apps
// File: android/app/src/main/java/com/taskme/update/UpdateManager.kt

package com.taskme.update

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import com.facebook.react.bridge.*
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.File

// Data classes
 data class UpdateInfo(
    val versionName: String,
    val versionCode: Int,
    val downloadUrl: String,
    val changelog: String,
    val size: Long,
    val isForced: Boolean = false
)

 data class AppVersion(
    val versionName: String,
    val versionCode: Int
)

 class UpdateManager(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(Dispatchers.Main + Job())
    private val client = OkHttpClient()
    private var downloadId: Long = -1
    private var downloadReceiver: BroadcastReceiver? = null
    
    // GitHub configuration
    companion object {
        const val GITHUB_OWNER = "seeditDev"
        const val GITHUB_REPO = "TaskMe"
        const val API_URL = "https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases/latest"
        const val RELEASES_URL = "https://github.com/$GITHUB_OWNER/$GITHUB_REPO/releases/latest"
        
        const val SHARED_PREF_NAME = "update_prefs"
        const val KEY_SKIPPED_VERSION = "skipped_version"
        const val KEY_LAST_CHECK = "last_check"
        const val KEY_DOWNLOAD_PATH = "download_path"
    }

    override fun getName(): String = "UpdateManager"

    /**
     * Check for updates from GitHub API
     * Returns UpdateInfo if update available, null otherwise
     */
    @ReactMethod
    fun checkForUpdate(promise: Promise) {
        scope.launch {
            try {
                // Throttle check (once per day)
                if (!shouldCheckForUpdate()) {
                    promise.resolve(null)
                    return@launch
                }

                // Fetch latest release
                val release = fetchLatestRelease()
                if (release == null) {
                    promise.resolve(null)
                    return@launch
                }

                // Parse version info
                val updateInfo = parseReleaseInfo(release)
                if (updateInfo == null) {
                    promise.resolve(null)
                    return@launch
                }

                // Get current version
                val currentVersion = getCurrentAppVersion()

                // Compare versions
                if (updateInfo.versionCode <= currentVersion.versionCode) {
                    promise.resolve(null)
                    return@launch
                }

                // Check if user skipped this version
                val skippedVersion = getSkippedVersion()
                if (skippedVersion == updateInfo.versionName && !updateInfo.isForced) {
                    promise.resolve(null)
                    return@launch
                }

                // Store last check time
                setLastCheckTime()

                // Return update info
                val result = Arguments.createMap().apply {
                    putString("versionName", updateInfo.versionName)
                    putInt("versionCode", updateInfo.versionCode)
                    putString("downloadUrl", updateInfo.downloadUrl)
                    putString("changelog", updateInfo.changelog)
                    putDouble("size", updateInfo.size.toDouble())
                    putBoolean("isForced", updateInfo.isForced)
                }

                promise.resolve(result)

            } catch (e: Exception) {
                promise.reject("CHECK_ERROR", e.message, e)
            }
        }
    }

    /**
     * Download APK from GitHub
     */
    @ReactMethod
    fun downloadAPK(downloadUrl: String, promise: Promise) {
        try {
            val context = reactContext.applicationContext
            
            // Create download request
            val request = DownloadManager.Request(Uri.parse(downloadUrl)).apply {
                setTitle("Downloading TaskMe Update")
                setDescription("Please wait...")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "TaskMe-update.apk")
                setMimeType("application/vnd.android.package-archive")
                allowScanningByMediaScanner()
            }

            // Start download
            val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            downloadId = downloadManager.enqueue(request)

            // Listen for download completion
            downloadReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    val id = intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
                    if (id == downloadId) {
                        // Get download URI
                        val query = DownloadManager.Query().setFilterById(downloadId)
                        val cursor = downloadManager.query(query)
                        
                        if (cursor.moveToFirst()) {
                            val columnIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
                            val status = cursor.getInt(columnIndex)
                            
                            if (status == DownloadManager.STATUS_SUCCESSFUL) {
                                val uriIndex = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI)
                                val downloadedUri = cursor.getString(uriIndex)
                                
                                // Store download path
                                saveDownloadPath(downloadedUri)
                                
                                // Resolve promise with path
                                val result = Arguments.createMap().apply {
                                    putString("downloadPath", downloadedUri)
                                    putBoolean("success", true)
                                }
                                promise.resolve(result)
                            } else {
                                promise.reject("DOWNLOAD_FAILED", "Download failed with status: $status")
                            }
                        }
                        cursor.close()
                        
                        // Unregister receiver
                        context?.unregisterReceiver(this)
                    }
                }
            }

            // Register receiver
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.registerReceiver(downloadReceiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED)
            } else {
                context.registerReceiver(downloadReceiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE))
            }

        } catch (e: Exception) {
            promise.reject("DOWNLOAD_ERROR", e.message, e)
        }
    }

    /**
     * Install downloaded APK
     */
    @ReactMethod
    fun installAPK(apkPath: String, promise: Promise) {
        try {
            val context = reactContext.applicationContext
            val apkFile = File(Uri.parse(apkPath).path!!)

            if (!apkFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "APK file not found: $apkPath")
                return
            }

            // Get content URI via FileProvider
            val apkUri: Uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                apkFile
            )

            // Create install intent
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            // Check if package installer is available
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.reject("NO_INSTALLER", "No package installer found")
            }

        } catch (e: Exception) {
            promise.reject("INSTALL_ERROR", e.message, e)
        }
    }

    /**
     * Skip a specific version
     */
    @ReactMethod
    fun skipVersion(versionName: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(KEY_SKIPPED_VERSION, versionName).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SKIP_ERROR", e.message, e)
        }
    }

    /**
     * Get GitHub releases URL for QR code
     */
    @ReactMethod
    fun getReleasesURL(promise: Promise) {
        promise.resolve(RELEASES_URL)
    }

    /**
     * Get current app version
     */
    @ReactMethod
    fun getCurrentVersion(promise: Promise) {
        try {
            val context = reactContext.applicationContext
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            
            val result = Arguments.createMap().apply {
                putString("versionName", packageInfo.versionName)
                putInt("versionCode", packageInfo.longVersionCode.toInt())
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("VERSION_ERROR", e.message, e)
        }
    }

    /**
     * Share app link
     */
    @ReactMethod
    fun shareApp(promise: Promise) {
        try {
            val context = reactContext.applicationContext
            val shareMessage = """
                Check out TaskMe - Your personal task and note manager!
                
                Download: $RELEASES_URL
                
                Developed by SEED-ITES
            """.trimIndent()

            val shareIntent = Intent().apply {
                action = Intent.ACTION_SEND
                type = "text/plain"
                putExtra(Intent.EXTRA_SUBJECT, "Check out TaskMe")
                putExtra(Intent.EXTRA_TEXT, shareMessage)
            }

            val chooser = Intent.createChooser(shareIntent, "Share TaskMe via")
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooser)
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SHARE_ERROR", e.message, e)
        }
    }

    // Private helper methods

    private suspend fun fetchLatestRelease(): JSONObject? = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url(API_URL)
                .header("Accept", "application/vnd.github.v3+json")
                .header("User-Agent", "TaskMe-App")
                .build()

            val response = client.newCall(request).execute()
            
            if (!response.isSuccessful) {
                return@withContext null
            }

            val body = response.body?.string()
            if (body != null) {
                return@withContext JSONObject(body)
            }
            
            return@withContext null
        } catch (e: Exception) {
            return@withContext null
        }
    }

    private fun parseReleaseInfo(release: JSONObject): UpdateInfo? {
        try {
            val tagName = release.getString("tag_name")
            val versionName = tagName.removePrefix("v")
            
            // Parse version code (e.g., 1.0.2 -> 3)
            val parts = versionName.split(".")
            val versionCode = parts.getOrNull(2)?.toIntOrNull() 
                ?: parts.getOrNull(1)?.toIntOrNull() 
                ?: 1

            val assets = release.getJSONArray("assets")
            var apkUrl = ""
            var size = 0L

            for (i in 0 until assets.length()) {
                val asset = assets.getJSONObject(i)
                val name = asset.getString("name")
                if (name.endsWith(".apk")) {
                    apkUrl = asset.getString("browser_download_url")
                    size = asset.getLong("size")
                    break
                }
            }

            if (apkUrl.isEmpty()) {
                return null
            }

            return UpdateInfo(
                versionName = versionName,
                versionCode = versionCode,
                downloadUrl = apkUrl,
                changelog = release.optString("body", ""),
                size = size,
                isForced = false
            )

        } catch (e: Exception) {
            return null
        }
    }

    private fun getCurrentAppVersion(): AppVersion {
        val context = reactContext.applicationContext
        val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
        return AppVersion(
            versionName = packageInfo.versionName,
            versionCode = packageInfo.longVersionCode.toInt()
        )
    }

    private fun shouldCheckForUpdate(): Boolean {
        val prefs = reactContext.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
        val lastCheck = prefs.getLong(KEY_LAST_CHECK, 0)
        val hoursSince = (System.currentTimeMillis() - lastCheck) / (1000 * 60 * 60)
        return hoursSince >= 24
    }

    private fun setLastCheckTime() {
        val prefs = reactContext.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit().putLong(KEY_LAST_CHECK, System.currentTimeMillis()).apply()
    }

    private fun getSkippedVersion(): String? {
        val prefs = reactContext.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_SKIPPED_VERSION, null)
    }

    private fun saveDownloadPath(path: String) {
        val prefs = reactContext.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_DOWNLOAD_PATH, path).apply()
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        scope.cancel()
        
        // Unregister receiver
        downloadReceiver?.let {
            try {
                reactContext.unregisterReceiver(it)
            } catch (e: Exception) {
                // Already unregistered
            }
        }
    }
}

// Package: com.taskme.update
// Usage in React Native:
// import { NativeModules } from 'react-native';
// const { UpdateManager } = NativeModules;
// 
// // Check for update
// const updateInfo = await UpdateManager.checkForUpdate();
// if (updateInfo) {
//   // Show update dialog
// }
//
// // Download APK
// await UpdateManager.downloadAPK(updateInfo.downloadUrl);
//
// // Install APK
// await UpdateManager.installAPK(downloadPath);
