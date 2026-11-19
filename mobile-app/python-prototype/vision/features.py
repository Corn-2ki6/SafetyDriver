"""CV-04: stateless feature extraction. No drowsiness thresholds here."""
import math
import numbers
import numpy as np

EYES = {"earLeft": [362, 385, 387, 263, 373, 380], "earRight": [33, 160, 158, 133, 153, 144]}


def finite(value):
    return isinstance(value, numbers.Real) and not isinstance(value, (bool, np.bool_)) and math.isfinite(value)


def pitch_from_matrix(matrix):
    """Row-major canonical->observed 4x4; R=Rz*Ry*Rx, return Rx in degrees.

    Uniform positive scale is removed. Reject shear/reflection/nonuniform scale,
    malformed affine transforms and Euler gimbal lock. This is model-relative
    pitch, not calibrated vehicle/world pitch and not a nod classifier.
    """
    try:
        if matrix is None:
            return None
        raw = np.asarray(matrix)
        if raw.shape != (4, 4) or raw.dtype.kind not in "fiu" or not np.isfinite(raw).all():
            return None
        m = raw.astype(float)
        if not np.allclose(m[3], [0, 0, 0, 1], atol=1e-6, rtol=0):
            return None
        a = m[:3, :3]
        scales = np.linalg.norm(a, axis=0)
        if min(scales) < 1e-8 or max(scales) / min(scales) > 1.001:
            return None
        r = a / scales
        if not np.allclose(r.T @ r, np.eye(3), atol=1e-3, rtol=0) or abs(np.linalg.det(r) - 1) > 1e-3:
            return None
        if math.hypot(r[0, 0], r[1, 0]) < 1e-6:
            return None
        return math.degrees(math.atan2(r[2, 1], r[2, 2]))
    except (ValueError, TypeError, OverflowError):
        return None


def extract_features(points, width, height, matrix=None):
    out = {"earLeft": None, "earRight": None, "ear": None, "mar": None, "pitchDeg": None, "issues": []}
    if not finite(width) or not finite(height) or width <= 0 or height <= 0:
        out["issues"].append("INVALID_DIMENSIONS")
        return out
    if isinstance(points, list) and len(points) == 0:
        out["issues"].append("NO_FACE")
        return out
    if not isinstance(points, list) or len(points) != 478 or any(
        not isinstance(p, dict) or not all(finite(p.get(k)) for k in ("x", "y", "z")) for p in points
    ):
        out["issues"].append("INVALID_LANDMARKS")
        return out

    def group(indices):
        selected = [points[i] for i in indices]
        if any(not (0 <= p["x"] <= 1 and 0 <= p["y"] <= 1) for p in selected):
            return None
        return [(p["x"] * width, p["y"] * height) for p in selected]

    for name, indices in EYES.items():
        p = group(indices)
        if p is not None:
            denominator = 2 * math.dist(p[0], p[3])
            if denominator > 1e-6:
                value = (math.dist(p[1], p[5]) + math.dist(p[2], p[4])) / denominator
                if math.isfinite(value):
                    out[name] = value
        if out[name] is None:
            out["issues"].append("INVALID_" + name.upper())
    if out["earLeft"] is not None and out["earRight"] is not None:
        out["ear"] = (out["earLeft"] + out["earRight"]) / 2
    mouth = group([61, 13, 291, 14])
    if mouth is not None:
        denominator = math.dist(mouth[0], mouth[2])
        if denominator > 1e-6:
            value = math.dist(mouth[1], mouth[3]) / denominator
            if math.isfinite(value):
                out["mar"] = value
    if out["mar"] is None:
        out["issues"].append("INVALID_MOUTH")
    # A cropped pose anchor invalidates pose but need not invalidate eye geometry.
    if group([1, 152, 33, 263, 61, 291]) is not None:
        out["pitchDeg"] = pitch_from_matrix(matrix)
    if out["pitchDeg"] is None:
        out["issues"].append("POSE_UNAVAILABLE")
    return out
