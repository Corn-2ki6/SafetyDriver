package com.safetydriver.camera

import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Handler
import android.os.Looper
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * The project is Android-native only. Use an Android alarm-stream tone rather than
 * a missing audio file or expo-av (removed from the current Expo SDK).
 *
 * A single ToneGenerator is reused across scheduled beeps. Stop/release on
 * alert dismissal, stop monitoring and when React Native backgrounds the app.
 */
class SafetyDriverCameraModule : Module() {
  private val alarmHandler = Handler(Looper.getMainLooper())
  private var alarmTone: ToneGenerator? = null

  private val nextBeep = object : Runnable {
    override fun run() {
      val generator = alarmTone ?: return
      try {
        if (generator.startTone(ToneGenerator.TONE_PROP_BEEP2, 450)) {
          alarmHandler.postDelayed(this, 900L)
        } else {
          Log.w("SafetyDriverAlarm", "Android audio service rejected the alarm tone")
          stopAlarmInternal()
        }
      } catch (error: RuntimeException) {
        Log.e("SafetyDriverAlarm", "Alarm tone stopped after playback failure", error)
        stopAlarmInternal()
      }
    }
  }

  private fun stopAlarmInternal() {
    alarmHandler.removeCallbacks(nextBeep)
    alarmTone?.stopTone()
    alarmTone?.release()
    alarmTone = null
  }

  private fun startAlarm(volume: Double) {
    alarmHandler.post {
      stopAlarmInternal()
      if (!volume.isFinite() || volume <= 0.0) return@post
      try {
        val percent = (volume.coerceIn(0.0, 1.0) * 100).toInt().coerceAtLeast(1)
        alarmTone = ToneGenerator(AudioManager.STREAM_ALARM, percent)
        nextBeep.run()
      } catch (error: RuntimeException) {
        Log.e("SafetyDriverAlarm", "Unable to start Android alarm tone", error)
        stopAlarmInternal()
      }
    }
  }

  private fun stopAlarm() {
    alarmHandler.post { stopAlarmInternal() }
  }

  override fun definition() = ModuleDefinition {
    Name("SafetyDriverCamera")

    Function("startAlertTone") { volume: Double -> startAlarm(volume) }
    Function("stopAlertTone") { stopAlarm() }

    // Native fallback if JS is paused before AppState can react.
    OnActivityEntersBackground { stopAlarm() }
    OnDestroy { stopAlarm() }

    View(SafetyDriverCameraView::class) {
      Events("onFrame", "onCameraError", "onCameraReady")

      Prop("active") { view: SafetyDriverCameraView, active: Boolean ->
        view.setActive(active)
      }

      OnViewDidUpdateProps { view: SafetyDriverCameraView ->
        view.updateCamera()
      }

      OnViewDestroys { view: SafetyDriverCameraView ->
        view.dispose()
      }
    }
  }
}
