package com.safetydriver.camera

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SafetyDriverCameraModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SafetyDriverCamera")

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
