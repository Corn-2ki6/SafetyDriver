import unittest
from types import SimpleNamespace
from unittest.mock import Mock
import numpy as np
from detector import Detector, REGIONS, normalize, upright


class ContractTests(unittest.TestCase):
    def test_no_face_clears_geometry(self):
        self.assertEqual(normalize([]), ("NO_FACE", [], None))

    def test_incomplete_face_rejected(self):
        self.assertEqual(normalize([[SimpleNamespace(x=.5, y=.5, z=0)]])[0], "INVALID_LANDMARKS")

    def test_nan_rejected(self):
        face = [SimpleNamespace(x=.5, y=.5, z=0) for _ in range(478)]
        face[20].z = float("nan")
        self.assertEqual(normalize([face]), ("INVALID_LANDMARKS", [], None))

    def test_region_indices_preserve_geometry(self):
        face = [SimpleNamespace(x=i / 478, y=.5, z=-.1) for i in range(478)]
        status, points, regions = normalize([face])
        self.assertEqual(status, "FACE_DETECTED")
        for name, indices in REGIONS.items():
            self.assertEqual(regions[name], [points[i] for i in indices])

    def test_rotation_mapping(self):
        frame = np.zeros((2, 3, 3), np.uint8)
        frame[0, 0] = 255
        rotated = upright(frame, 90)
        self.assertEqual(rotated.shape, (3, 2, 3))
        self.assertTrue((rotated[0, 1] == 255).all())
        np.testing.assert_array_equal(upright(rotated, 270), frame)

    def test_bad_frame_rejected(self):
        for frame in [None, np.zeros((0, 2, 3), np.uint8), np.zeros((2, 3)), np.zeros((2, 3, 4), np.uint8)]:
            with self.assertRaises(ValueError):
                upright(frame, 0)
        with self.assertRaises(ValueError):
            upright(np.zeros((2, 3, 3), np.uint8), 45)

    def test_timestamp_rejected_before_native_call(self):
        detector = Detector.__new__(Detector)
        detector.video, detector.last_timestamp, detector.task = True, 100, Mock()
        for timestamp in [-1, 99, 100, 1.5, True]:
            with self.assertRaises(ValueError):
                detector.detect(np.zeros((2, 3, 3), np.uint8), timestamp)
        detector.task.detect_for_video.assert_not_called()

    def test_context_closes_on_error(self):
        detector = Detector.__new__(Detector)
        detector.task = Mock()
        with self.assertRaises(RuntimeError):
            with detector:
                raise RuntimeError("test")
        detector.task.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
