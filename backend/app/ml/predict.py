"""
Loads the best trained pipeline and produces predictions enriched with:
  - probability / confidence
  - risk level (Low / Medium / High / Critical)
  - top SHAP-driven feature contributions
  - human-readable retention recommendations
"""
from __future__ import annotations
import json
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap

from app.ml.preprocessing import split_xy, get_feature_names

ARTIFACT_DIR = Path(__file__).resolve().parents[2] / "ml_artifacts"
MODEL_PATH = ARTIFACT_DIR / "best_model.joblib"
LEADERBOARD_PATH = ARTIFACT_DIR / "leaderboard.json"

RECOMMENDATION_RULES = [
    ("contract_Month-to-month", "Offer a discounted 1- or 2-year contract to lock in retention."),
    ("tech_support_No", "Proactively offer a free trial of premium tech support."),
    ("online_security_No", "Bundle online security add-on at reduced cost."),
    ("payment_method_Electronic check", "Encourage switch to auto-pay (bank transfer/credit card) with a small incentive."),
    ("num_support_calls", "Escalate to a retention specialist — high support-call volume signals frustration."),
    ("monthly_charges", "Review pricing tier; consider a loyalty discount for high-paying at-risk customers."),
    ("tenure", "Early-tenure customer — enroll in an onboarding/engagement journey."),
]


@lru_cache(maxsize=1)
def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "No trained model found. Run `python -m app.ml.train` first."
        )
    return joblib.load(MODEL_PATH)


@lru_cache(maxsize=1)
def load_leaderboard() -> dict:
    if not LEADERBOARD_PATH.exists():
        return {}
    return json.loads(LEADERBOARD_PATH.read_text())


@lru_cache(maxsize=1)
def _background_data():
    """A small transformed background sample for SHAP explainers that need one."""
    data_path = Path(__file__).parent / "data" / "churn_dataset.csv"
    df = pd.read_csv(data_path).sample(n=100, random_state=42)
    X, _ = split_xy(df)
    pipeline = load_model()
    preprocessor = pipeline.named_steps["preprocess"]
    bg = preprocessor.transform(X)
    if hasattr(bg, "toarray"):
        bg = bg.toarray()
    return bg


def _build_explainer(model, feature_names):
    model_type = type(model).__name__
    background = _background_data()
    if model_type in ("RandomForestClassifier", "GradientBoostingClassifier", "XGBClassifier", "DecisionTreeClassifier"):
        return shap.TreeExplainer(model, feature_names=feature_names)
    if model_type == "LogisticRegression":
        return shap.LinearExplainer(model, background, feature_names=feature_names)
    # generic fallback: model-agnostic explainer against predict_proba
    return shap.Explainer(model.predict_proba, background, feature_names=feature_names)


def _risk_level(prob: float) -> str:
    if prob < 0.25:
        return "Low"
    if prob < 0.5:
        return "Medium"
    if prob < 0.75:
        return "High"
    return "Critical"


def _recommendations(customer: dict, top_features: list[dict]) -> list[str]:
    recs = []
    top_names = {f["feature"] for f in top_features}
    for key, message in RECOMMENDATION_RULES:
        if any(key in name for name in top_names):
            recs.append(message)
    if not recs:
        recs.append("No dominant risk driver detected — monitor account at next billing cycle.")
    return recs[:4]


def predict_one(customer: dict) -> dict:
    """customer: dict of raw feature values (see preprocessing.ALL_FEATURES)."""
    pipeline = load_model()
    df = pd.DataFrame([customer])
    X, _ = split_xy(df.assign(churn=0))  # dummy target, unused

    proba = float(pipeline.predict_proba(X)[0, 1])
    pred = int(proba >= 0.5)

    # SHAP explanation on the underlying model using transformed features
    preprocessor = pipeline.named_steps["preprocess"]
    model = pipeline.named_steps["model"]
    X_transformed = preprocessor.transform(X)
    if hasattr(X_transformed, "toarray"):
        X_transformed = X_transformed.toarray()
    feature_names = get_feature_names(preprocessor)

    try:
        explainer = _build_explainer(model, feature_names)
        raw = explainer.shap_values(X_transformed) if hasattr(explainer, "shap_values") else explainer(X_transformed).values

        vals = raw
        # Normalize the many possible SHAP output shapes down to a flat 1D array
        if isinstance(vals, list):  # list per class
            vals = vals[-1][0]
        else:
            vals = np.asarray(vals)
            if vals.ndim == 3:       # (n_samples, n_features, n_classes)
                vals = vals[0, :, -1]
            elif vals.ndim == 2:     # (n_samples, n_features)
                vals = vals[0]
        vals = np.asarray(vals).flatten()
        if len(vals) != len(feature_names):
            raise ValueError("shap output shape mismatch")
    except Exception:
        # Fallback: use model feature_importances_ if SHAP fails for this model type
        importances = getattr(model, "feature_importances_", None)
        if importances is None and hasattr(model, "coef_"):
            importances = np.abs(model.coef_).flatten()
        vals = importances if importances is not None else np.zeros(len(feature_names))

    contrib = sorted(
        [{"feature": f, "impact": round(float(v), 4)} for f, v in zip(feature_names, vals)],
        key=lambda d: abs(d["impact"]),
        reverse=True,
    )[:6]

    risk = _risk_level(proba)
    recs = _recommendations(customer, contrib)

    return {
        "prediction": "Churn" if pred else "Retained",
        "will_churn": bool(pred),
        "probability": round(proba, 4),
        "confidence": round(max(proba, 1 - proba), 4),
        "risk_level": risk,
        "top_features": contrib,
        "recommendations": recs,
        "model_used": load_leaderboard().get("best_model", "unknown"),
    }
