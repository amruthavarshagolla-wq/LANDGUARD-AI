"""
explain.py
==========
PIPELINE STAGE: Explain Why

WHAT THIS ANSWERS:
"Why did this zone get Priority=Critical and not some other zone?" —
this is what you'll be asked live by judges, and what authorities need
to trust the system instead of treating it as a black box.

METHOD (deliberately simple, NOT SHAP or ML explainability):
We already know each component's WEIGHTED CONTRIBUTION to the final
priority score (weight x score). We rank those 4 contributions and
describe the top 2 in plain language, using the breakdown dicts each
scoring stage already produced. This is fully rule-based and 100%
consistent with the score — there is no risk of the explanation
disagreeing with the number, which is a real risk with post-hoc ML
explainability methods.

INPUT REQUIRED: all breakdown dicts + the final priority score/band/action

OUTPUT: a short human-readable string, safe to show directly on the dashboard.
"""

from .config import PRIORITY_WEIGHTS


def generate_explanation(zone_id, risk_score, exposure_score, vulnerability_score,
                          criticality_score, priority_score, priority_band,
                          exposure_breakdown, vulnerability_breakdown, criticality_breakdown) -> str:

    contributions = {
        "AI-predicted landslide risk": PRIORITY_WEIGHTS["risk"] * risk_score,
        "population/asset exposure": PRIORITY_WEIGHTS["exposure"] * exposure_score,
        "isolation/vulnerability": PRIORITY_WEIGHTS["vulnerability"] * vulnerability_score,
        "critical infrastructure": PRIORITY_WEIGHTS["criticality"] * criticality_score,
    }
    ranked = sorted(contributions.items(), key=lambda kv: kv[1], reverse=True)
    top_two = ranked[:2]

    detail_bits = []
    for factor_name, _ in top_two:
        if factor_name == "AI-predicted landslide risk":
            detail_bits.append(f"a risk score of {risk_score}/100 from the prediction model")
        elif factor_name == "population/asset exposure":
            pop = exposure_breakdown.get("population_exposed")
            villages = exposure_breakdown.get("num_villages")
            pop_txt = f"{pop} people" if pop is not None else "an unknown population (data missing)"
            detail_bits.append(f"{pop_txt} across {villages} village(s) exposed")
        elif factor_name == "isolation/vulnerability":
            detail_bits.append(vulnerability_breakdown.get("accessibility_reason", "accessibility concerns"))
        elif factor_name == "critical infrastructure":
            asset = criticality_breakdown.get("max_weight_asset")
            detail_bits.append(f"presence of critical infrastructure ({asset})" if asset else "critical infrastructure present")

    explanation = (
        f"Zone {zone_id} scored {priority_score}/100 -> Priority: {priority_band}. "
        f"Main drivers: {', and '.join(detail_bits)}."
    )
    return explanation
