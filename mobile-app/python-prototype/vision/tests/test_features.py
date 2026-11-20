import copy
import json
import math
from pathlib import Path
import unittest
import numpy as np
from features import extract_features, pitch_from_matrix

FIXTURE = Path(__file__).resolve().parents[4] / 'docs/vision/examples/feature-cases.json'


def expand(case):
    points = [dict(x=.5, y=.5, z=0) for _ in range(478)]
    for index, xy in case['pixelPoints'].items():
        points[int(index)] = dict(x=xy[0]/case['width'], y=xy[1]/case['height'], z=0)
    return points


class FeatureTests(unittest.TestCase):
    def test_shared_hand_calculated_cases(self):
        for case in json.loads(FIXTURE.read_text()):
            with self.subTest(case=case['name']):
                result = extract_features(expand(case), case['width'], case['height'], case['matrix'])
                for key, expected in case['expected'].items():
                    self.assertAlmostEqual(result[key], expected, places=9)
                self.assertEqual(result['issues'], [])

    def test_missing_data_is_not_zero(self):
        for points in [None, [], [{}], [dict(x=.5, y=.5, z=float('nan'))]*478]:
            result = extract_features(points, 640, 480, np.eye(4))
            self.assertTrue(all(result[k] is None for k in ('earLeft', 'earRight', 'ear', 'mar', 'pitchDeg')))
            self.assertTrue(result['issues'])

    def test_dimensions(self):
        for width in [0, -1, float('nan'), True, '640']:
            self.assertEqual(extract_features([], width, 480)['issues'], ['INVALID_DIMENSIONS'])

    def test_zero_width_and_cropped_eye(self):
        case = json.loads(FIXTURE.read_text())[0]
        points = expand(case)
        points[263] = points[362].copy()
        result = extract_features(points, 640, 480, np.eye(4))
        self.assertIsNone(result['earLeft'])
        self.assertIsNone(result['ear'])
        self.assertIsNotNone(result['earRight'])
        points = expand(case)
        points[362]['x'] = -1
        self.assertIsNone(extract_features(points, 640, 480)['earLeft'])
        self.assertEqual(points[362]['x'], -1)

    def test_no_pose_does_not_discard_eyes(self):
        case = json.loads(FIXTURE.read_text())[0]
        result = extract_features(expand(case), 640, 480)
        self.assertIsNone(result['pitchDeg'])
        self.assertIsNotNone(result['ear'])
        self.assertEqual(result['issues'], ['POSE_UNAVAILABLE'])

    def test_matrix_validation_and_uniform_scale(self):
        self.assertEqual(pitch_from_matrix(np.eye(4)), 0)
        scaled = np.eye(4); scaled[:3, :3] *= 2
        self.assertEqual(pitch_from_matrix(scaled), 0)
        for bad in [None, [], np.zeros((4,4)), np.diag([-1,1,1,1]), np.diag([2,1,1,1]), np.full((4,4), np.nan), [['1']*4]*4]:
            self.assertIsNone(pitch_from_matrix(bad))
        shear = np.eye(4); shear[0,1] = .2
        self.assertIsNone(pitch_from_matrix(shear))
        gimbal = np.array([[0,0,1,0],[0,1,0,0],[-1,0,0,0],[0,0,0,1]])
        self.assertIsNone(pitch_from_matrix(gimbal))

    def test_combined_rotation(self):
        x,y,z=map(math.radians,[25,20,-15])
        rx=np.array([[1,0,0],[0,math.cos(x),-math.sin(x)],[0,math.sin(x),math.cos(x)]])
        ry=np.array([[math.cos(y),0,math.sin(y)],[0,1,0],[-math.sin(y),0,math.cos(y)]])
        rz=np.array([[math.cos(z),-math.sin(z),0],[math.sin(z),math.cos(z),0],[0,0,1]])
        m=np.eye(4);m[:3,:3]=rz@ry@rx
        self.assertAlmostEqual(pitch_from_matrix(m),25)


if __name__ == '__main__': unittest.main()
