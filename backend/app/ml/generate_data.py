"""
Synthetic Telecom Customer Churn dataset generator.
Produces a realistic, biased-toward-real-world-patterns dataset so the
trained models show meaningful (not random) feature importances.
Replace with a real CSV (e.g. Kaggle Telco churn) by swapping the output path.
"""
import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)
N = 4000

def generate() -> pd.DataFrame:
    tenure = RNG.integers(0, 73, N)
    contract = RNG.choice(["Month-to-month", "One year", "Two year"], N, p=[0.55, 0.25, 0.20])
    monthly_charges = np.round(RNG.normal(65, 30, N).clip(18, 120), 2)
    internet_service = RNG.choice(["DSL", "Fiber optic", "No"], N, p=[0.35, 0.45, 0.20])
    tech_support = RNG.choice(["Yes", "No"], N, p=[0.4, 0.6])
    online_security = RNG.choice(["Yes", "No"], N, p=[0.4, 0.6])
    payment_method = RNG.choice(
        ["Electronic check", "Mailed check", "Bank transfer", "Credit card"], N
    )
    paperless_billing = RNG.choice(["Yes", "No"], N, p=[0.6, 0.4])
    senior_citizen = RNG.choice([0, 1], N, p=[0.84, 0.16])
    partner = RNG.choice(["Yes", "No"], N)
    dependents = RNG.choice(["Yes", "No"], N, p=[0.3, 0.7])
    num_support_calls = RNG.poisson(1.5, N)
    total_charges = np.round(monthly_charges * (tenure + 1) * RNG.uniform(0.9, 1.0, N), 2)

    # --- Latent churn probability driven by realistic risk factors ---
    logit = (
        -1.8
        + (contract == "Month-to-month") * 1.6
        + (contract == "One year") * 0.3
        - (tenure / 72) * 2.2
        + (internet_service == "Fiber optic") * 0.5
        + (tech_support == "No") * 0.55
        + (online_security == "No") * 0.45
        + (payment_method == "Electronic check") * 0.5
        + (paperless_billing == "Yes") * 0.2
        + (num_support_calls > 3) * 0.9
        + (monthly_charges - 65) / 100
        + senior_citizen * 0.3
        - (partner == "Yes") * 0.25
        - (dependents == "Yes") * 0.2
    )
    prob = 1 / (1 + np.exp(-logit))
    churn = (RNG.uniform(0, 1, N) < prob).astype(int)

    df = pd.DataFrame({
        "customer_id": [f"CUST-{10000+i}" for i in range(N)],
        "tenure": tenure,
        "contract": contract,
        "monthly_charges": monthly_charges,
        "total_charges": total_charges,
        "internet_service": internet_service,
        "tech_support": tech_support,
        "online_security": online_security,
        "payment_method": payment_method,
        "paperless_billing": paperless_billing,
        "senior_citizen": senior_citizen,
        "partner": partner,
        "dependents": dependents,
        "num_support_calls": num_support_calls,
        "churn": churn,
    })
    return df


if __name__ == "__main__":
    out = Path(__file__).parent / "data" / "churn_dataset.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    generate().to_csv(out, index=False)
    print(f"Wrote {out}")
