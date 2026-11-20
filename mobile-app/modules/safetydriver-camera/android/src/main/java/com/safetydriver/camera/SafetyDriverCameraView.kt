package com.safetydriver.camera

import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Matrix
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarker
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.nio.ByteBuffer
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class SafetyDriverCameraView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext) {
  private val mainHandler = Handler(Looper.getMainLooper())
  private val cameraExecutor = Executors.newSingleThreadExecutor()
  private val modelExecutor = Executors.newSingleThreadExecutor()
  private val previewView = PreviewView(context).apply {
    implementationMode = PreviewView.ImplementationMode.COMPATIBLE
    scaleType = PreviewView.ScaleType.FILL_CENTER
  }
  private val pendingBitmaps = ConcurrentHashMap<Long, Bitmap>()
  private val inferenceStartTimes = ConcurrentHashMap<Long, Long>()
  private val frameRotations = ConcurrentHashMap<Long, Int>()

  @Volatile private var active = false
  private var started = false
  @Volatile private var generation = 0
  @Volatile private var disposed = false
  private var cameraProvider: ProcessCameraProvider? = null
  private var previewUseCase: Preview? = null
  private var analysisUseCase: ImageAnalysis? = null
  private var faceLandmarker: FaceLandmarker? = null
  private var lastTimestampMs = 0L

  private val onFrame by EventDispatcher<Map<String, Any>>()
  private val onCameraError by EventDispatcher<Map<String, Any>>()
  private val onCameraReady by EventDispatcher<Map<String, Any>>()

  init {
    addView(
      previewView,
      LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT),
    )
  }

  fun setActive(value: Boolean) {
    active = value
    updateCamera()
  }

  fun updateCamera() {
    if (disposed || !isAttachedToWindow) return
    if (active) {
      startCamera()
    } else {
      stopCamera()
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    updateCamera()
  }

  override fun onDetachedFromWindow() {
    stopCamera()
    super.onDetachedFromWindow()
  }

  fun dispose() {
    if (disposed) return
    disposed = true
    stopCamera()
    cameraExecutor.shutdown()
    modelExecutor.shutdown()
  }

  private fun startCamera() {
    if (started || !active) return
    started = true
    val sessionGeneration = ++generation
    val processingFrame = AtomicBoolean(false)
    val activity = appContext.currentActivity
    val lifecycleOwner = activity as? LifecycleOwner
    if (lifecycleOwner == null) {
      fail("CAMERA_LIFECYCLE_UNAVAILABLE", "Không thể khởi tạo vòng đời camera Android.")
      return
    }
    if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
      fail("CAMERA_PERMISSION_DENIED", "Quyền camera chưa được cấp.")
      return
    }

    modelExecutor.execute {
      val detector = try {
        val options = FaceLandmarker.FaceLandmarkerOptions.builder()
          .setBaseOptions(
            BaseOptions.builder()
              .setModelAssetPath("face_landmarker.task")
              .build(),
          )
          .setRunningMode(RunningMode.LIVE_STREAM)
          .setNumFaces(1)
          .setOutputFaceBlendshapes(false)
          .setResultListener { result, input ->
            handleResult(result, input.width, input.height, sessionGeneration, processingFrame)
          }
          .setErrorListener { error ->
            mainHandler.post {
              if (sessionGeneration == generation) {
                fail("VISION_INFERENCE_FAILED", error.message ?: "MediaPipe không xử lý được frame camera.")
              }
            }
          }
          .build()
        FaceLandmarker.createFromOptions(context, options)
      } catch (error: Exception) {
        mainHandler.post {
          if (sessionGeneration == generation) {
            fail("VISION_MODEL_UNAVAILABLE", error.message ?: "Không thể khởi tạo model Face Landmarker.")
          }
        }
        return@execute
      }

      mainHandler.post {
        if (disposed || !active || sessionGeneration != generation) {
          detector.close()
          return@post
        }
        faceLandmarker = detector
        bindCamera(lifecycleOwner, sessionGeneration, processingFrame)
      }
    }
  }

  private fun bindCamera(
    lifecycleOwner: LifecycleOwner,
    sessionGeneration: Int,
    processingFrame: AtomicBoolean,
  ) {
    val providerFuture = ProcessCameraProvider.getInstance(context)
    providerFuture.addListener({
      if (disposed || !active || sessionGeneration != generation) return@addListener
      try {
        val provider = providerFuture.get()
        val preview = Preview.Builder().build().also {
          it.setSurfaceProvider(previewView.surfaceProvider)
        }
        val analysis = ImageAnalysis.Builder()
          .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
          .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
          .build()
          .also { useCase ->
            useCase.setAnalyzer(cameraExecutor) { image ->
              analyzeFrame(image, sessionGeneration, processingFrame)
            }
          }

        provider.bindToLifecycle(
          lifecycleOwner,
          CameraSelector.DEFAULT_FRONT_CAMERA,
          preview,
          analysis,
        )
        cameraProvider = provider
        previewUseCase = preview
        analysisUseCase = analysis
        onCameraReady(emptyMap())
      } catch (error: Exception) {
        fail("CAMERA_START_FAILED", error.message ?: "CameraX không thể mở camera trước.")
      }
    }, ContextCompat.getMainExecutor(context))
  }

  private fun analyzeFrame(
    image: ImageProxy,
    sessionGeneration: Int,
    processingFrame: AtomicBoolean,
  ) {
    if (!active || sessionGeneration != generation || !processingFrame.compareAndSet(false, true)) {
      image.close()
      return
    }

    val rotationDegrees = image.imageInfo.rotationDegrees
    val bitmap = try {
      image.use { toUprightBitmap(it, rotationDegrees) }
    } catch (error: Exception) {
      processingFrame.set(false)
      mainHandler.post {
        if (sessionGeneration == generation) {
          fail("CAMERA_FRAME_INVALID", error.message ?: "Không thể giải mã frame camera.")
        }
      }
      return
    }

    val timestampMs = maxOf(SystemClock.uptimeMillis(), lastTimestampMs + 1)
    lastTimestampMs = timestampMs
    pendingBitmaps[timestampMs] = bitmap
    inferenceStartTimes[timestampMs] = SystemClock.uptimeMillis()
    frameRotations[timestampMs] = rotationDegrees

    try {
      val input = BitmapImageBuilder(bitmap).build()
      faceLandmarker?.detectAsync(input, timestampMs)
        ?: throw IllegalStateException("MediaPipe model is not initialized.")
    } catch (error: Exception) {
      pendingBitmaps.remove(timestampMs)?.recycle()
      inferenceStartTimes.remove(timestampMs)
      frameRotations.remove(timestampMs)
      processingFrame.set(false)
      mainHandler.post {
        if (sessionGeneration == generation) {
          fail("VISION_INFERENCE_FAILED", error.message ?: "Không thể gửi frame vào MediaPipe.")
        }
      }
    }
  }

  private fun handleResult(
    result: FaceLandmarkerResult,
    width: Int,
    height: Int,
    sessionGeneration: Int,
    processingFrame: AtomicBoolean,
  ) {
    val timestampMs = result.timestampMs()
    val inferenceMs = (SystemClock.uptimeMillis() - (inferenceStartTimes.remove(timestampMs) ?: SystemClock.uptimeMillis()))
      .coerceAtLeast(0L)
    val rotation = frameRotations.remove(timestampMs) ?: 0
    pendingBitmaps.remove(timestampMs)?.recycle()

    if (disposed || sessionGeneration != generation) return
    processingFrame.set(false)

    val face = result.faceLandmarks().firstOrNull()
    val status = when {
      face == null -> "NO_FACE"
      face.size != 478 -> "INVALID_LANDMARKS"
      else -> "FACE_DETECTED"
    }
    val landmarks: List<Map<String, Any>> = face?.map { point ->
      mapOf(
        "x" to point.x().toDouble(),
        "y" to point.y().toDouble(),
        "z" to point.z().toDouble(),
      )
    } ?: emptyList()

    mainHandler.post {
      if (disposed || sessionGeneration != generation) return@post
      onFrame(
        mapOf(
          "schemaVersion" to 1,
          "timestampMs" to timestampMs,
          "width" to width,
          "height" to height,
          "rotationApplied" to rotation,
          "mirrored" to false,
          "inferenceMs" to inferenceMs.toDouble(),
          "status" to status,
          "landmarks" to landmarks,
        ),
      )
    }
  }

  private fun toUprightBitmap(image: ImageProxy, rotationDegrees: Int): Bitmap {
    val plane = image.planes.firstOrNull()
      ?: throw IllegalArgumentException("Camera frame has no pixel plane.")
    val pixelStride = plane.pixelStride
    require(pixelStride == 4) { "Expected RGBA camera data, got pixel stride $pixelStride." }

    val rowBytes = image.width * pixelStride
    val sourceBuffer = plane.buffer
    val source = ByteArray(sourceBuffer.remaining())
    sourceBuffer.get(source)
    val compact = ByteArray(rowBytes * image.height)
    for (row in 0 until image.height) {
      val sourceOffset = row * plane.rowStride
      require(sourceOffset + rowBytes <= source.size) { "Camera frame row data is truncated." }
      System.arraycopy(source, sourceOffset, compact, row * rowBytes, rowBytes)
    }

    val bitmap = Bitmap.createBitmap(image.width, image.height, Bitmap.Config.ARGB_8888)
    bitmap.copyPixelsFromBuffer(ByteBuffer.wrap(compact))
    if (rotationDegrees == 0) return bitmap

    val matrix = Matrix().apply { postRotate(rotationDegrees.toFloat()) }
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true).also {
      if (it !== bitmap) bitmap.recycle()
    }
  }

  private fun fail(code: String, message: String) {
    onCameraError(mapOf("code" to code, "message" to message))
    stopCamera()
  }

  private fun stopCamera() {
    generation += 1
    started = false
    cameraProvider?.unbind(previewUseCase, analysisUseCase)
    previewUseCase = null
    analysisUseCase?.clearAnalyzer()
    analysisUseCase = null
    cameraProvider = null
    faceLandmarker?.close()
    faceLandmarker = null
    pendingBitmaps.values.forEach { bitmap -> bitmap.recycle() }
    pendingBitmaps.clear()
    inferenceStartTimes.clear()
    frameRotations.clear()
  }
}
