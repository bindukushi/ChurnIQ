"""
Shared preprocessing so training and inference never drift apart.
"""
from __future__ import annotations
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder

TARGET = "churn"
ID_COL = "customer_id"

NUMERIC_FEATURES = [
    "tenure", "monthly_charges", "total_charges", "num_support_calls",
]
CATEGORICAL_FEATURES = [
    "contract", "internet_service", "tech_support", "online_security",
    "payment_method", "paperless_billing", "senior_citizen", "partner",
    "dependents",
]
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def build_preprocessor() -> ColumnTransformer:
    numeric_pipe = Pipeline(steps=[("scale", StandardScaler())])
    categorical_pipe = Pipeline(
        steps=[("onehot", OneHotEncoder(handle_unknown="ignore"))]
    )
    return ColumnTransformer(
        transformers=[
            ("num", numeric_pipe, NUMERIC_FEATURES),
            ("cat", categorical_pipe, CATEGORICAL_FEATURES),
        ]
    )


def split_xy(df: pd.DataFrame):
    X = df[ALL_FEATURES].copy()
    # ensure categorical dtype consistency (senior_citizen is int flag -> treat as category)
    for col in ["senior_citizen"]:
        X[col] = X[col].astype(str)
    y = df[TARGET].astype(int)
    return X, y


def get_feature_names(preprocessor: ColumnTransformer) -> list[str]:
    return list(preprocessor.get_feature_names_out())
