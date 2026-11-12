"""Face localization, not identity recognition or drowsiness classification."""
from pathlib import Path
import math
import time
import cv2
import mediapipe as mp
import numpy as np

# Left/right refer to the subject, with unmirrored inference input.
REGIONS = {
    "leftEye": [362, 385, 387, 263, 373, 380],
    "rightEye": [33, 160, 158, 133, 153, 144],
    "mouth": [61, 13, 291, 14],  # corners + inner lip centers; no MAR formula implied
    "headPoseAnchors": [1, 152, 33, 263, 61, 291],
}


def upright(frame, rotation):
    if rotation not in (0, 90, 180, 270):
        raise ValueError("rotation must be clockwise 0, 90, 180 or 270")
    if not isinstance(frame, np.ndarray) or frame.dtype != np.uint8 or frame.ndim != 3 or frame.shape[2] != 3 or min(frame.shape[:2]) == 0:
        raise ValueError("frame must be nonempty uint8 BGR HxWx3")
    codes = {90: cv2.ROTATE_90_CLOCKWISE, 180: cv2.ROTATE_180, 270: cv2.ROTATE_90_COUNTERCLOCKWISE}
    return cv2.rotate(frame, codes[rotation]) if rotation else frame


def normalize(faces):
    if not faces:
        return "NO_FACE", [], None
    face = faces[0]
    if len(face) != 478 or any(not math.isfinite(v) for p in face for v in (p.x, p.y, p.z)):
        return "INVALID_LANDMARKS", [], None
    points = [{"x": float(p.x), "y": float(p.y), "z": float(p.z)} for p in face]
    # Do not clamp: clipping would fabricate geometry near image boundaries.
    return "FACE_DETECTED", points, {name: [points[i] for i in ids] for name, ids in REGIONS.items()}


class Detector:
    def __init__(self, model, video=False):
        if not Path(model).is_file():
            raise FileNotFoundError(f"Missing model: {model}. Run download_assets.py first.")
        self.video = video
        self.last_timestamp = -1
        vision = mp.tasks.vision
        options = vision.FaceLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=str(model), delegate=mp.tasks.BaseOptions.Delegate.CPU),
            running_mode=vision.RunningMode.VIDEO if video else vision.RunningMode.IMAGE,
            num_faces=1, min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5, min_tracking_confidence=0.5,
            output_face_blendshapes=False, output_facial_transformation_matrixes=False,
        )
        self.task = vision.FaceLandmarker.create_from_options(options)

    def detect(self, frame, timestamp_ms=0, rotation=0):
        if not isinstance(timestamp_ms, int) or isinstance(timestamp_ms, bool) or timestamp_ms < 0:
            raise ValueError("timestampMs must be a nonnegative integer")
        if self.video and timestamp_ms <= self.last_timestamp:
            raise ValueError("VIDEO timestampMs must strictly increase within a session")
        frame = upright(frame, rotation)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb))
        start = time.perf_counter()
        result = self.task.detect_for_video(image, timestamp_ms) if self.video else self.task.detect(image)
        elapsed = (time.perf_counter() - start) * 1000
        self.last_timestamp = timestamp_ms
        status, points, regions = normalize(result.face_landmarks)
        return {
            "schemaVersion": 1, "timestampMs": timestamp_ms,
            "width": frame.shape[1], "height": frame.shape[0],
            "rotationApplied": rotation, "mirrored": False,
            "status": status, "landmarks": points, "regions": regions,
            "inferenceMs": round(elapsed, 3),
        }

    def close(self):
        self.task.close()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()


def annotate(frame, result, rotation=0):
    canvas = upright(frame, rotation).copy()
    h, w = canvas.shape[:2]
    for p in result["landmarks"]:
        cv2.circle(canvas, (round(p["x"] * w), round(p["y"] * h)), 1, (70, 220, 70), -1)
    cv2.putText(canvas, result["status"], (12, 25), cv2.FONT_HERSHEY_SIMPLEX, .65, (0, 180, 255), 2)
    return canvas
