"""Explicit download of pinned public test assets; never commits model/photo."""
import argparse
import hashlib
from pathlib import Path
import urllib.request

ASSETS = {
    "model": ("https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", "models/face_landmarker.task", "64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff"),
    "sample": ("https://storage.googleapis.com/mediapipe-assets/portrait.jpg", "inputs/portrait.jpg", "a6f11efaa834706db23f275b6115058fa87fc7f14362681e6abe14e82749de3e"),
}


def download(name):
    url, destination, expected = ASSETS[name]
    path = Path(destination)
    if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest() == expected:
        print(f"Verified {path}")
        return
    with urllib.request.urlopen(url, timeout=60) as response:
        data = response.read()
    if hashlib.sha256(data).hexdigest() != expected:
        raise RuntimeError(f"Checksum mismatch for {name}; existing file was not overwritten")
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".download")
    temporary.write_bytes(data)
    temporary.replace(path)
    print(f"Downloaded and verified {path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", action="store_true", help="Also download public portrait for smoke testing")
    args = parser.parse_args()
    download("model")
    if args.sample:
        download("sample")
