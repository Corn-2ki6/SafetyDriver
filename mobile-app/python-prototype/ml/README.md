# Drowsiness Random Forest

This offline training pipeline adapts the reference repository's supervised
Random Forest workflow to the features SafetyDriver actually measures:
`ear`, `mar`, `eyesClosedSec`, and `yawnSec`. It trains 200 balanced trees,
holds out 20% for a classification report, evaluates five-fold cross-validation
on the training portion, and saves a confusion matrix and feature importance
plot.

## Prepare manually labeled data

Create `data/training_data.csv` using `data/training_data.csv.example` as the
header and format. The only supported labels are `awake` and `drowsy`. Label
observations independently; do not generate labels from SafetyDriver's
existing rules. Each feature must be a finite, nonnegative number. At least
seven examples of each class are required; more and varied observations are
strongly recommended. Do not include video, identity, or other personal data.
The local training CSV and generated model/plots are git-ignored; share only
anonymized numeric samples that are safe to publish.

`eyesClosedSec` and `yawnSec` are durations from continuous observations. For
rows where a duration has not started, record `0` rather than leaving it blank.
The model does not predict when face/feature measurements are missing; the app
uses its existing rule-based logic in that case.

## Train

From `mobile-app` in PowerShell:

```powershell
py -3.12 -m venv .venv-ml
.\.venv-ml\Scripts\python.exe -m pip install -r python-prototype\ml\requirements.txt
.\.venv-ml\Scripts\python.exe python-prototype\ml\train_model.py
```

Outputs:

- `python-prototype/ml/models/drowsiness_classifier.pkl` for Python inspection
- `python-prototype/ml/models/drowsiness_classifier.generated.json` for the
  exported forest data
- `python-prototype/ml/models/confusion_matrix.png`
- `python-prototype/ml/models/feature_importance.png`

Python and `.pkl` are not loaded by React Native. The JSON export contains the
tree structure for an app integration to consume. This training workflow does
not include a real trained dataset or validate a driver-safety system.
