"""Train, evaluate, and export a Random Forest for the SafetyDriver app."""

import json
import sys
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import ConfusionMatrixDisplay, classification_report, confusion_matrix
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split


DATA_PATH = Path(__file__).resolve().parent / "data" / "training_data.csv"
OUTPUT_DIR = Path(__file__).resolve().parent / "models"
APP_MODEL_PATH = OUTPUT_DIR / "drowsiness_classifier.generated.json"
FEATURE_NAMES = ["ear", "mar", "eyesClosedSec", "yawnSec"]
CLASS_NAMES = ["awake", "drowsy"]
RANDOM_STATE = 42


def load_training_data(path: Path) -> tuple[np.ndarray, np.ndarray]:
    if not path.is_file():
        raise FileNotFoundError(
            f"Training data not found: {path}\n"
            "Prepare a manually labeled CSV using data/training_data.csv.example as a schema."
        )

    frame = pd.read_csv(path)
    required = FEATURE_NAMES + ["label"]
    missing = [column for column in required if column not in frame.columns]
    if missing:
        raise ValueError(f"CSV is missing required columns: {', '.join(missing)}")
    if frame.empty:
        raise ValueError("Training CSV contains no labeled rows.")

    frame = frame[required].copy()
    frame["label"] = frame["label"].astype("string").str.strip().str.lower()
    invalid_labels = sorted(set(frame["label"].dropna()) - set(CLASS_NAMES))
    if invalid_labels:
        raise ValueError(
            f"Unsupported labels: {', '.join(invalid_labels)}; use only awake or drowsy."
        )
    if frame["label"].isna().any():
        raise ValueError("Training CSV contains rows without a label.")

    for column in FEATURE_NAMES:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    if frame[FEATURE_NAMES].isna().any().any():
        raise ValueError(
            "Features must be numeric and present on every row; remove incomplete rows "
            "before training (empty yawnSec/eyesClosedSec values are not accepted)."
        )
    if not np.isfinite(frame[FEATURE_NAMES].to_numpy(dtype=float)).all():
        raise ValueError("Training CSV contains non-finite feature values.")
    if (frame[FEATURE_NAMES] < 0).any().any():
        raise ValueError("EAR, MAR, and duration features must be nonnegative.")

    counts = frame["label"].value_counts()
    missing_classes = [label for label in CLASS_NAMES if label not in counts]
    if missing_classes:
        raise ValueError(f"Training requires both classes: {', '.join(CLASS_NAMES)}.")
    if (counts < 7).any():
        raise ValueError("Need at least 7 manually labeled examples for each class.")

    labels = frame["label"].map({label: i for i, label in enumerate(CLASS_NAMES)})
    return frame[FEATURE_NAMES].to_numpy(dtype=float), labels.to_numpy(dtype=int)


def create_model() -> RandomForestClassifier:
    return RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )


def export_tree(estimator) -> dict:
    tree = estimator.tree_
    nodes = []
    for index in range(tree.node_count):
        counts = np.asarray(tree.value[index][0], dtype=float)
        total = counts.sum()
        probabilities = (counts / total).tolist() if total > 0 else [0.0] * len(CLASS_NAMES)
        nodes.append(
            {
                "feature": int(tree.feature[index]),
                "threshold": float(tree.threshold[index]),
                "left": int(tree.children_left[index]),
                "right": int(tree.children_right[index]),
                "probabilities": probabilities,
            }
        )
    return {"nodes": nodes}


def export_app_model(model: RandomForestClassifier) -> None:
    bundle = {
        "version": 1,
        "features": FEATURE_NAMES,
        "classes": CLASS_NAMES,
        "trees": [export_tree(tree) for tree in model.estimators_],
    }
    APP_MODEL_PATH.write_text(
        json.dumps(bundle, separators=(",", ":"), allow_nan=False) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    try:
        features, labels = load_training_data(DATA_PATH)
        x_train, x_test, y_train, y_test = train_test_split(
            features,
            labels,
            test_size=0.2,
            random_state=RANDOM_STATE,
            stratify=labels,
        )

        model = create_model()
        model.fit(x_train, y_train)
        predictions = model.predict(x_test)
        print("Test set classification report (20% held out):")
        print(
            classification_report(
                y_test,
                predictions,
                labels=[0, 1],
                target_names=CLASS_NAMES,
                zero_division=0,
            )
        )

        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
        scores = cross_val_score(create_model(), x_train, y_train, cv=cv, scoring="accuracy")
        print(f"5-fold cross-validation accuracy: {scores.mean():.3f} ± {scores.std():.3f}")

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        matrix = confusion_matrix(y_test, predictions, labels=[0, 1])
        display = ConfusionMatrixDisplay(matrix, display_labels=CLASS_NAMES)
        display.plot(cmap="Blues", colorbar=False)
        plt.title("SafetyDriver Random Forest - Confusion Matrix")
        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / "confusion_matrix.png", dpi=150)
        plt.close()

        model.fit(features, labels)
        order = np.argsort(model.feature_importances_)
        _, axis = plt.subplots(figsize=(7, 4))
        axis.barh(np.asarray(FEATURE_NAMES)[order], model.feature_importances_[order])
        axis.set_xlabel("Feature importance")
        axis.set_title("SafetyDriver Random Forest - Feature Importance")
        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / "feature_importance.png", dpi=150)
        plt.close()

        joblib.dump(
            {"model": model, "feature_names": FEATURE_NAMES, "classes": CLASS_NAMES},
            OUTPUT_DIR / "drowsiness_classifier.pkl",
        )
        export_app_model(model)
        print(f"Saved Python model and evaluation plots under {OUTPUT_DIR}")
        print(f"Exported on-device model to {APP_MODEL_PATH}")
        return 0
    except (FileNotFoundError, ValueError, OSError, pd.errors.ParserError) as error:
        print(f"Training failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
