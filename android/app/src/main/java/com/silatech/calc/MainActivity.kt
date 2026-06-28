package com.silatech.calc

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import android.view.View
import android.webkit.*
import android.widget.Button
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
        // The URL of the hosted web app (configured to Firebase Hosting url of the project)
        private const val TARGET_URL = "https://si-latech.web.app"
        // Uncomment below for local testing in Android Emulator
        // private const val TARGET_URL = "http://10.0.2.2:9002"
    }

    private lateinit var webView: WebView
    private lateinit var swipeContainer: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var offlineLayout: View
    private lateinit var btnRetry: Button

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var cameraPhotoPath: String? = null

    // Register ActivityResult for File Chooser (image/PDF picker & Camera capture)
    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val results = if (result.resultCode == Activity.RESULT_OK) {
            val data = result.data
            when {
                data?.dataString != null -> arrayOf(Uri.parse(data.dataString))
                data?.clipData != null -> {
                    val clipData = data.clipData!!
                    val uris = Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                    uris
                }
                cameraPhotoPath != null -> {
                    val file = File(cameraPhotoPath!!.replace("file:", ""))
                    if (file.exists() && file.length() > 0) {
                        arrayOf(Uri.fromFile(file))
                    } else {
                        null
                    }
                }
                else -> null
            }
        } else {
            null
        }

        filePathCallback?.onReceiveValue(results)
        filePathCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize UI Elements
        webView = findViewById(R.id.webview)
        swipeContainer = findViewById(R.id.swipe_container)
        progressBar = findViewById(R.id.progress_bar)
        offlineLayout = findViewById(R.id.offline_layout)
        btnRetry = findViewById(R.id.btn_retry)

        // Configure WebView
        setupWebView()

        // Configure SwipeRefreshLayout
        swipeContainer.setOnRefreshListener {
            if (NetworkUtils.isInternetAvailable(this)) {
                webView.reload()
            } else {
                swipeContainer.isRefreshing = false
                showOfflineScreen()
            }
        }
        // Custom color scheme matching SilaCalc
        swipeContainer.setColorSchemeColors(resources.getColor(R.color.primary, theme))

        // Configure Offline Retry Button
        btnRetry.setOnClickListener {
            if (NetworkUtils.isInternetAvailable(this)) {
                hideOfflineScreen()
                webView.loadUrl(TARGET_URL)
            } else {
                Toast.makeText(this, "No internet connection detected.", Toast.LENGTH_SHORT).show()
            }
        }

        // Handle System Back Button
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        // Initial Load
        loadStartPage()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        
        // Enabling client-side execution features
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        
        // Viewport settings for perfect UI scale
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.supportZoom()
        settings.builtInZoomControls = false
        settings.displayZoomControls = false

        // User agent string custom indicator
        settings.userAgentString = settings.userAgentString + " SilaCalcAndroid"

        // Cookie and session configuration
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        // Web Client to intercept requests and errors
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                
                // Allow loading internally within the target host
                if (url.startsWith(TARGET_URL) || url.contains("firebaseapp.com")) {
                    return false
                }

                // Handle external apps (e.g. mailto, tel, whatsapp)
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    return true
                } catch (e: ActivityNotFoundException) {
                    Log.e(TAG, "No activity found to handle URL: $url", e)
                }
                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeContainer.isRefreshing = false
                progressBar.visibility = View.GONE
            }

            // Connection issues handling
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                // Only show offline screen if it's the main frame that failed to load
                if (request?.isForMainFrame == true) {
                    showOfflineScreen()
                }
            }
        }

        // Web Chrome Client to handle uploads and progress bar updates
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                if (newProgress < 100) {
                    progressBar.visibility = View.VISIBLE
                    progressBar.progress = newProgress
                } else {
                    progressBar.visibility = View.GONE
                }
            }

            // Handles blueprint upload for AI Plan Reader
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val takePictureIntent = createCameraIntent()
                val contentSelectionIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                    putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/*", "application/pdf"))
                }

                val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
                    putExtra(Intent.EXTRA_INTENT, contentSelectionIntent)
                    putExtra(Intent.EXTRA_TITLE, "Upload Floor Plan Blueprint")
                    if (takePictureIntent != null) {
                        putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(takePictureIntent))
                    }
                }

                try {
                    fileChooserLauncher.launch(chooserIntent)
                } catch (e: ActivityNotFoundException) {
                    this@MainActivity.filePathCallback?.onReceiveValue(null)
                    this@MainActivity.filePathCallback = null
                    Toast.makeText(this@MainActivity, "Cannot open file chooser", Toast.LENGTH_LONG).show()
                    return false
                }

                return true
            }
        }
    }

    private fun createCameraIntent(): Intent? {
        val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        if (takePictureIntent.resolveActivity(packageManager) != null) {
            val photoFile: File? = try {
                createImageFile()
            } catch (ex: IOException) {
                Log.e(TAG, "Unable to create Image File", ex)
                null
            }

            if (photoFile != null) {
                val photoURI: Uri = FileProvider.getUriForFile(
                    this,
                    "com.silatech.calc.fileprovider",
                    photoFile
                )
                cameraPhotoPath = "file:" + photoFile.absolutePath
                takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI)
                return takePictureIntent
            }
        }
        return null
    }

    @Throws(IOException::class)
    private fun createImageFile(): File {
        val timeStamp: String = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val storageDir: File? = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        return File.createTempFile(
            "JPEG_${timeStamp}_",
            ".jpg",
            storageDir
        )
    }

    private fun loadStartPage() {
        if (NetworkUtils.isInternetAvailable(this)) {
            hideOfflineScreen()
            webView.loadUrl(TARGET_URL)
        } else {
            showOfflineScreen()
        }
    }

    private fun showOfflineScreen() {
        webView.visibility = View.GONE
        offlineLayout.visibility = View.VISIBLE
        swipeContainer.isRefreshing = false
    }

    private fun hideOfflineScreen() {
        webView.visibility = View.VISIBLE
        offlineLayout.visibility = View.GONE
    }
}
