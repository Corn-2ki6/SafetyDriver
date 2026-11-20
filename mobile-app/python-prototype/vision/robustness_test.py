"""Exploratory stress probes. Observations, NOT an accuracy benchmark."""
import json
from pathlib import Path
import cv2
import numpy as np
from detector import Detector

portrait = cv2.imread('inputs/portrait.jpg')
if portrait is None:
    raise RuntimeError('Run download_assets.py --sample first')
covered = portrait.copy()
# Fixed mask for this public portrait only; not a general eye-occlusion detector.
h, w = covered.shape[:2]
cv2.rectangle(covered, (int(.32*w), int(.14*h)), (int(.65*w), int(.21*h)), (0,0,0), -1)
rotation = cv2.getRotationMatrix2D((w/2,h/2), 25, 1)
cases = {
    'dim_20_percent': (portrait*.2).astype(np.uint8),
    'bright_clipped': np.clip(portrait.astype(float)*1.8,0,255).astype(np.uint8),
    'eye_region_masked': covered,
    'image_roll_25_degrees': cv2.warpAffine(portrait,rotation,(w,h)),
}
rows=[]
with Detector('models/face_landmarker.task') as detector:
    for name, frame in cases.items():
        r=detector.detect(frame)
        rows.append({'case':name,'status':r['status'],'features':r['features'],'note':'Observed response only; no measured ground-truth accuracy'})
Path('outputs').mkdir(exist_ok=True)
Path('outputs/robustness-results.json').write_text(json.dumps({'scope':'Synthetic lighting/occlusion/image-roll probes on one image. Not real head yaw or device validation.','observations':rows},indent=2)+'\n')
print(json.dumps(rows,indent=2))
