"""
AI Assistant that answers questions about a churn prediction.

Two modes:
  1. Grounded template mode (default, no API key needed) — builds an answer
     directly from the SHAP top_features + recommendations already computed
     for that prediction. Always available, zero cost, zero hallucination
     risk since it only describes numbers we actually computed.
  2. LLM mode (optional) — if OPENAI_API_KEY is set, the same grounded
     context is passed to the OpenAI API as a system prompt so the model
     can answer more open-ended follow-up questions in natural language,
     while still being anchored to the real SHAP values (not free-floating).
"""
import os
from typing import Optional

_OPENAI_KEY = os.getenv("OPENAI_API_KEY")


def _format_context(prediction_record: dict) -> str:
    feats = "\n".join(
        f"- {f['feature']} (impact: {f['impact']:+.3f})"
        for f in prediction_record.get("top_features", [])
    )
    recs = "\n".join(f"- {r}" for r in prediction_record.get("recommendations", []))
    return (
        f"Prediction: {prediction_record.get('prediction')}\n"
        f"Probability of churn: {prediction_record.get('probability', 0) * 100:.1f}%\n"
        f"Confidence: {prediction_record.get('confidence', 0) * 100:.1f}%\n"
        f"Risk level: {prediction_record.get('risk_level')}\n"
        f"Model used: {prediction_record.get('model_used')}\n"
        f"Top SHAP feature contributions (positive = pushes toward churn):\n{feats}\n"
        f"Recommended actions:\n{recs}"
    )


def _template_answer(message: str, ctx: dict) -> str:
    context_str = _format_context(ctx)
    msg = message.lower()
    top = ctx.get("top_features", [])
    top_str = ", ".join(f"{f['feature']} ({f['impact']:+.2f})" for f in top[:3])

    if "why" in msg and "churn" in msg:
        return (
            f"This customer has a {ctx.get('probability', 0)*100:.1f}% predicted churn "
            f"probability ({ctx.get('risk_level')} risk). The strongest drivers are: {top_str}. "
            f"Positive values push the prediction toward churn; negative values push toward retention."
        )
    if "risk" in msg:
        return f"This customer is classified as {ctx.get('risk_level')} risk, with a churn probability of {ctx.get('probability', 0)*100:.1f}%."
    if "what should" in msg or "recommend" in msg or "do about" in msg:
        recs = ctx.get("recommendations", [])
        return "Recommended actions:\n" + "\n".join(f"• {r}" for r in recs)
    if "feature" in msg or "affect" in msg or "explain" in msg:
        lines = "\n".join(f"• {f['feature']}: {f['impact']:+.3f}" for f in top)
        return f"Here are the features that most influenced this prediction:\n{lines}"

    return (
        f"Here's what I know about this prediction:\n\n{context_str}\n\n"
        f"Ask me things like \"why will this customer churn?\", \"what's the risk?\", "
        f"or \"what should we do?\" for a more targeted answer."
    )


def _openai_answer(message: str, ctx: dict) -> str:
    import requests  # local import to keep it optional

    system_prompt = (
        "You are a churn-analytics assistant for a customer retention platform. "
        "Answer strictly using the grounded prediction context below — do not invent "
        "numbers. Be concise and actionable, aimed at a retention/customer-success manager.\n\n"
        f"{_format_context(ctx)}"
    )
    resp = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {_OPENAI_KEY}", "Content-Type": "application/json"},
        json={
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            "temperature": 0.3,
            "max_tokens": 400,
        },
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def answer_question(message: str, prediction_record: Optional[dict]) -> str:
    if not prediction_record:
        return (
            "I don't have a specific prediction to discuss yet. Run a prediction on the "
            "Predict page first, then ask me things like \"why will this customer churn?\""
        )
    if _OPENAI_KEY:
        try:
            return _openai_answer(message, prediction_record)
        except Exception:
            pass  # fall through to template mode if the API call fails
    return _template_answer(message, prediction_record)
