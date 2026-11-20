"""Real CPU inference regression; downloads are a separate explicit step."""
import argparse
import hashlib
import json
import platform
from importlib.metadata import version
from pathlib import Path
import cv2
import numpy as np
from detector import Detector


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="models/face_landmarker.task")
    parser.add_argument("--sample", default="inputs/portrait.jpg")
    parser.add_argument("--report", default="outputs/smoke-results.json")
    args = parser.parse_args()
    portrait = cv2.imread(args.sample)
    if portrait is None:
        raise RuntimeError("Missing public portrait; run download_assets.py --sample")
    blank = np.zeros_like(portrait)
    records = []
    with Detector(args.model) as detector:
        for name, frame, rotation, expected in [
            ("portrait", portrait, 0, "FACE_DETECTED"),
            ("blank", blank, 0, "NO_FACE"),
            ("rotated_portrait_corrected", cv2.rotate(portrait, cv2.ROTATE_90_COUNTERCLOCKWISE), 90, "FACE_DETECTED"),
        ]:
            result = detector.detect(frame, rotation=rotation)
            assert result["status"] == expected, result["status"]
            assert len(result["landmarks"]) == (478 if expected == "FACE_DETECTED" else 0)
            assert (result["width"], result["height"]) == (portrait.shape[1], portrait.shape[0])
            records.append({"case": name, "status": result["status"], "landmarkCount": len(result["landmarks"]), "inferenceMs": result["inferenceMs"], "passed": True})
    # Separate stream session: verify reacquisition and no stale points after loss.
    with Detector(args.model, video=True) as detector:
        for timestamp, frame, expected in [(0, portrait, "FACE_DETECTED"), (100, portrait, "FACE_DETECTED"), (200, blank, "NO_FACE"), (300, portrait, "FACE_DETECTED")]:
            result = detector.detect(frame, timestamp)
            assert result["status"] == expected, (timestamp, result["status"])
            assert len(result["landmarks"]) == (478 if expected == "FACE_DETECTED" else 0)
            assert expected != "NO_FACE" or result["regions"] is None
            records.append({"case": f"video_timestamp_{timestamp}", "status": result["status"], "landmarkCount": len(result["landmarks"]), "inferenceMs": result["inferenceMs"], "passed": True})
    report = {
        "scope": "CPU prototype smoke test; public still image + synthetic stream, not road/device accuracy benchmark",
        "platform": platform.platform(), "python": platform.python_version(),
        "dependencies": {name: version(name) for name in ["mediapipe", "opencv-contrib-python", "numpy"]},
        "modelSha256": hashlib.sha256(Path(args.model).read_bytes()).hexdigest(),
        "sampleSha256": hashlib.sha256(Path(args.sample).read_bytes()).hexdigest(),
        "cases": records,
    }
    Path(args.report).parent.mkdir(parents=True, exist_ok=True)
    Path(args.report).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
