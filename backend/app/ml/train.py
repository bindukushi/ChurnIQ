"""
Trains Logistic Regression, Decision Tree, Random Forest, Gradient Boosting,
and XGBoost on the churn dataset, compares them on held-out test data, and
persists the best-performing pipeline (preprocessor + model bundled together)
plus a leaderboard JSON the API/dashboard can read.
"""
from __future__ import annotations
import json
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier

from app.ml.preprocessing import build_preprocessor, split_xy

BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "churn_dataset.csv"
ARTIFACT_DIR = Path(__file__).resolve().parents[2] / "ml_artifacts"
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

MODEL_CANDIDATES = {
    "Logistic Regression": LogisticRegression(max_iter=1000, class_weight="balanced"),
    "Decision Tree": DecisionTreeClassifier(max_depth=6, class_weight="balanced", random_state=42),
    "Random Forest": RandomForestClassifier(
        n_estimators=300, max_depth=10, class_weight="balanced", random_state=42, n_jobs=-1
    ),
    "Gradient Boosting": GradientBoostingClassifier(
        n_estimators=200, max_depth=3, learning_rate=0.05, random_state=42
    ),
    "XGBoost": XGBClassifier(
        n_estimators=300, max_depth=4, learning_rate=0.05,
        eval_metric="logloss", random_state=42, n_jobs=-1,
    ),
}


def train_and_compare() -> dict:
    if not DATA_PATH.exists():
        from app.ml.generate_data import generate
        DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        generate().to_csv(DATA_PATH, index=False)

    df = pd.read_csv(DATA_PATH)
    X, y = split_xy(df)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    leaderboard = []
    best_name, best_pipeline, best_f1 = None, None, -1.0

    for name, clf in MODEL_CANDIDATES.items():
        pipe = Pipeline(steps=[("preprocess", build_preprocessor()), ("model", clf)])

        t0 = time.time()
        pipe.fit(X_train, y_train)
        train_time = round(time.time() - t0, 3)

        y_pred = pipe.predict(X_test)
        y_proba = pipe.predict_proba(X_test)[:, 1]

        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="f1")

        metrics = {
            "model_name": name,
            "accuracy": round(accuracy_score(y_test, y_pred), 4),
            "precision": round(precision_score(y_test, y_pred), 4),
            "recall": round(recall_score(y_test, y_pred), 4),
            "f1_score": round(f1_score(y_test, y_pred), 4),
            "roc_auc": round(roc_auc_score(y_test, y_proba), 4),
            "cv_f1_mean": round(cv_scores.mean(), 4),
            "cv_f1_std": round(cv_scores.std(), 4),
            "train_time_sec": train_time,
        }
        leaderboard.append(metrics)

        if metrics["f1_score"] > best_f1:
            best_f1 = metrics["f1_score"]
            best_name = name
            best_pipeline = pipe

    leaderboard.sort(key=lambda m: m["f1_score"], reverse=True)

    # persist
    joblib.dump(best_pipeline, ARTIFACT_DIR / "best_model.joblib")
    (ARTIFACT_DIR / "leaderboard.json").write_text(json.dumps({
        "best_model": best_name,
        "trained_at": pd.Timestamp.now("UTC").isoformat(),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "leaderboard": leaderboard,
    }, indent=2))

    print(f"Best model: {best_name} (F1={best_f1})")
    return {"best_model": best_name, "leaderboard": leaderboard}


if __name__ == "__main__":
    train_and_compare()
