"""Run from this directory. No images/video are saved unless explicitly requested."""
import argparse
import json
from pathlib import Path
import sys
import time
import cv2
from detector import Detector, annotate


def main():
    parser = argparse.ArgumentParser(description="SafetyDriver face/478-landmark prototype")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--image")
    source.add_argument("--video")
    source.add_argument("--camera", type=int)
    parser.add_argument("--model", default="models/face_landmarker.task")
    parser.add_argument("--rotation", type=int, choices=[0, 90, 180, 270], default=0)
    parser.add_argument("--jsonl", help="Optional output; one result per processed frame")
    parser.add_argument("--annotated", help="Optional annotated image (image mode only)")
    parser.add_argument("--display", action="store_true", help="Local preview; Q to quit")
    parser.add_argument("--max-frames", type=int, default=0, help="0 means unlimited")
    args = parser.parse_args()
    if args.max_frames < 0 or (args.annotated and not args.image):
        parser.error("max-frames must be >=0; annotated requires image mode")
    cap = output = None
    count = 0
    try:
        if args.jsonl:
            Path(args.jsonl).parent.mkdir(parents=True, exist_ok=True)
            output = open(args.jsonl, "w", encoding="utf-8")
        with Detector(args.model, video=not bool(args.image)) as detector:
            if args.image:
                frames = [(cv2.imread(args.image), 0)]
            else:
                cap = cv2.VideoCapture(args.video if args.video else args.camera)
                if not cap.isOpened():
                    raise RuntimeError("Cannot open video/camera; check path, permission or camera index")
                if args.video:
                    # Avoid OpenCV auto-rotation followed by our explicit rotation.
                    cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 0)
                fps = cap.get(cv2.CAP_PROP_FPS)
                if args.video and (not (0 < fps < 1000)):
                    raise RuntimeError("Video FPS missing/invalid; transcode to constant FPS first")
                start = time.monotonic()
                def stream():
                    index, previous = 0, -1
                    while True:
                        ok, frame = cap.read()
                        if not ok:
                            if args.camera is not None or index == 0:
                                raise RuntimeError("Camera interrupted or no readable frames")
                            break
                        timestamp = round(index * 1000 / fps) if args.video else round((time.monotonic() - start) * 1000)
                        timestamp = max(previous + 1, timestamp)
                        yield frame, timestamp
                        previous, index = timestamp, index + 1
                frames = stream()
            for frame, timestamp in frames:
                result = detector.detect(frame, timestamp, args.rotation)
                if output:
                    output.write(json.dumps(result, allow_nan=False) + "\n")
                print(f'{count}: {result["status"]}, landmarks={len(result["landmarks"])}, inference={result["inferenceMs"]:.1f}ms')
                if args.display or args.annotated:
                    canvas = annotate(frame, result, args.rotation)
                    if args.annotated:
                        Path(args.annotated).parent.mkdir(parents=True, exist_ok=True)
                        if not cv2.imwrite(args.annotated, canvas):
                            raise RuntimeError("Could not write annotated image")
                    if args.display:
                        cv2.imshow("SafetyDriver Vision (Q: quit)", canvas)
                        if cv2.waitKey(1) & 0xFF == ord("q"):
                            break
                count += 1
                if args.max_frames and count >= args.max_frames:
                    break
        return 0
    except (ValueError, RuntimeError, FileNotFoundError, OSError, cv2.error) as exc:
        print(f"Vision error: {exc}", file=sys.stderr)
        return 1
    finally:
        if cap is not None:
            cap.release()
        if output is not None:
            output.close()
        if args.display:
            cv2.destroyAllWindows()


if __name__ == "__main__":
    raise SystemExit(main())
