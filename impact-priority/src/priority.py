"""
priority.py
===========
PIPELINE STAGE: Priority Score -> Priority Ranking

WHAT THIS ANSWERS:
"Combining risk + exposure + vulnerability + criticality, what single
number represents how urgently this zone needs attention — and how does
it rank against every other zone right now?"

INPUT REQUIRED:
  - risk_score (from AI module, 0-100)
  - exposure_score, vulnerability_score, criticality_score (computed earlier)
  - has_verified_field_report: bool (small boost if ground-confirmed)

OUTPUT:
  - priority_score: float 0-100
  - priority_band: "Critical" / "High" / "Medium" / "Low"

RANKING (across multiple zones) happens in pipeline.py by simply sorting
the list of PriorityOutput records by priority_score descending — no
separate algorithm needed once each zone has a comparable score.

CONNECTS TO: actions.py and explain.py both consume this stage's output.
"""

from .config import PRIORITY_WEIGHTS, FIELD_REPORT_PRIORITY_BOOST, PRIORITY_BANDS, DEFAULT_RISK_SCORE_IF_MISSING


def compute_priority_score(risk_score, exposure_score, vulnerability_score, criticality_score,
                            has_verified_field_report: bool = False) -> tuple[float, list]:
    flags = []
    if risk_score is None:
        flags.append("risk_score_missing_used_default")
        risk_score = DEFAULT_RISK_SCORE_IF_MISSING

    base_score = (
        PRIORITY_WEIGHTS["risk"] * risk_score
        + PRIORITY_WEIGHTS["exposure"] * exposure_score
        + PRIORITY_WEIGHTS["vulnerability"] * vulnerability_score
        + PRIORITY_WEIGHTS["criticality"] * criticality_score
    )

    if has_verified_field_report:
        base_score = min(100, base_score + FIELD_REPORT_PRIORITY_BOOST)

    return round(base_score, 1), flags


def classify_band(priority_score: float) -> str:
    for low, high, label in PRIORITY_BANDS:
        if low <= priority_score <= high:
            return label
    return "Unclassified"  # should never trigger if bands cover 0-100 fully
