"""
actions.py
==========
PIPELINE STAGE: Operational Response Suggestions

WHAT THIS ANSWERS:
"Given the AI risk, GIS context, and verified field information, what
operational response suggestions are appropriate?" The logic is deliberately
simple and rule-based so suggestions are transparent and auditable.

INPUT REQUIRED (legacy `recommend_action`, no longer called by pipeline.py):
  - risk_category (from priority.py)
  - criticality breakdown (to check for hospital / only-access route)
  - verified field report info (to allow an "urgent override")

OUTPUT:
  - recommended_action: a short, human-readable instruction string

CONNECTS TO: explain.py includes this action in the final explanation;
pipeline.py puts it directly into the dashboard-facing output.

---

UPDATE (M6 simplification): `recommend_action` below depended entirely on
`risk_category`, which the pipeline no longer computes (see config.py /
README for why the separate priority-ranking stage was removed). It is
kept here, unused, for reference/backward compatibility rather than
deleted outright.

The pipeline now calls `generate_operational_suggestions` instead, which
answers a related but different question: not "what one priority-band
action applies" but "given the actual AI risk + GIS + field-report
signals present in this zone, which concrete, auditable, rule-based
operational suggestions apply -- and why". See the module docstring
above `generate_operational_suggestions` below for details.
"""

from .config import (
    RISK_HIGH_THRESHOLD,
    RISK_MEDIUM_THRESHOLD,
    SIGNIFICANT_POPULATION_EXPOSED,
    HISTORICAL_LANDSLIDE_SIGNIFICANT_COUNT,
    FIELD_REPORT_ESCALATION_SEVERITIES,
)
from .utils import normalize_count, normalize_asset_list


def _risk_tier(risk_record: dict) -> tuple:
    """
    Determines whether this zone counts as high/medium/no risk tier for
    suggestion purposes. Prefers the AI's own `risk_category` text when it's
    a recognized value (informational field, but a direct signal from the
    model); falls back to a numeric `risk_score` threshold otherwise. Never
    invents a risk level when both are absent/unrecognized.

    Returns (tier: "high" | "medium" | None, label: str for use in explanations).
    """
    category = str(risk_record.get("risk_category") or "").strip().lower()
    if category in ("very high", "high"):
        return "high", category
    if category in ("moderate", "medium"):
        return "medium", category

    risk_score = risk_record.get("risk_score")
    if risk_score is None:
        return None, None
    if risk_score >= RISK_HIGH_THRESHOLD:
        return "high", None
    if risk_score >= RISK_MEDIUM_THRESHOLD:
        return "medium", None
    return None, None


def generate_operational_suggestions(risk_record: dict, gis_record: dict,
                                      has_verified_field_report: bool,
                                      field_report_severity: str = None) -> tuple:
    """
    PIPELINE STAGE (replaces the old priority-band-driven `recommend_action`):
    Rule-based, auditable operational RESPONSE-SUPPORT suggestions -- not a
    priority score, and not an autonomous order. Every suggestion is a
    recommendation for a human authority to act on (e.g. "prepare evacuation
    readiness", never "evacuate everyone immediately"; "assess road
    accessibility", never "close the road immediately").

    INPUT REQUIRED:
      - risk_record: dict matching schemas.RiskInput (uses risk_score /
        risk_category only; other AI fields safely ignored, same as before)
      - gis_record: dict matching schemas.GISInput (uses population_exposed,
        roads, bridges, hospitals, historical_landslide_count; read via the
        same utils.normalize_* helpers exposure/vulnerability/criticality
        already use, so every GIS field shape they already tolerate --
        OSM way-ID scalars, name lists, dict wrappers, sparse zeros/None --
        is tolerated here too, without re-implementing that parsing)
      - has_verified_field_report / field_report_severity: same values the
        pipeline already computes for the old action logic

    OUTPUT: (suggestions: list[str], reasons: list[str])
      `reasons` are short human-readable fragments describing WHY each
      suggestion fired; explain.py turns these into the final explanation
      string. Order is preserved and duplicate suggestion text is removed
      (a zone can trigger the same wording via more than one rule).

    Thresholds used here (RISK_HIGH_THRESHOLD, RISK_MEDIUM_THRESHOLD,
    SIGNIFICANT_POPULATION_EXPOSED, HISTORICAL_LANDSLIDE_SIGNIFICANT_COUNT)
    live in config.py, are documented there as operational/demo assumptions
    (not scientifically validated), and are easily re-tuned.
    """
    suggestions = []
    reasons = []

    # --- Risk tier -----------------------------------------------------
    tier, category_label = _risk_tier(risk_record)
    risk_score = risk_record.get("risk_score")
    if tier == "high":
        suggestions.append("Conduct immediate field verification")
        suggestions.append("Increase monitoring frequency at this zone")
        risk_desc = category_label or "high"
        score_txt = f" (score {risk_score})" if risk_score is not None else ""
        reasons.append(f"{risk_desc} predicted landslide risk{score_txt}")
    elif tier == "medium":
        suggestions.append("Increase monitoring frequency at this zone")
        risk_desc = category_label or "moderate"
        score_txt = f" (score {risk_score})" if risk_score is not None else ""
        reasons.append(f"{risk_desc} predicted landslide risk{score_txt}")

    # --- Infrastructure: roads / bridges --------------------------------
    roads, _ = normalize_asset_list(gis_record.get("roads"))
    bridges, _ = normalize_asset_list(gis_record.get("bridges"))
    has_road_or_bridge = bool(roads) or bool(bridges)
    if has_road_or_bridge:
        suggestions.append("Inspect road and bridge accessibility in the zone")

    # --- Infrastructure: hospital ---------------------------------------
    hospitals_count, _ = normalize_count(gis_record.get("hospitals"))
    has_hospital = hospitals_count > 0
    if has_hospital:
        suggestions.append("Check accessibility to the nearby hospital")

    infra_bits = []
    if has_road_or_bridge:
        infra_bits.append("road/bridge network")
    if has_hospital:
        infra_bits.append("a hospital")
    if infra_bits:
        reasons.append("nearby critical infrastructure (" + ", ".join(infra_bits) + ")")

    if tier == "high" and not (has_road_or_bridge or has_hospital):
        # Generic fallback so a high-risk zone always gets an infrastructure
        # suggestion even when no specific asset triggered a more precise one.
        suggestions.append("Assess vulnerable infrastructure in the zone")

    # --- Historical landslide frequency ---------------------------------
    hist_count = gis_record.get("historical_landslide_count")
    if hist_count is not None and hist_count >= HISTORICAL_LANDSLIDE_SIGNIFICANT_COUNT:
        suggestions.append("Increase monitoring and schedule a field assessment given recurring landslide history")
        reasons.append(f"a history of {hist_count} past landslide events")

    # --- Population exposure ---------------------------------------------
    population = gis_record.get("population_exposed")
    if population is not None and population >= SIGNIFICANT_POPULATION_EXPOSED:
        suggestions.append("Prepare evacuation readiness assessment for the exposed population")
        reasons.append(f"an exposed population of {population}")

    # --- Verified field report -------------------------------------------
    if has_verified_field_report and field_report_severity in FIELD_REPORT_ESCALATION_SEVERITIES:
        suggestions.append("Conduct immediate ground assessment")
        suggestions.append("Escalate for immediate authority review")
        reasons.append(f"a verified {field_report_severity}-severity field report")

    # --- Fallback: nothing triggered --------------------------------------
    if not suggestions:
        suggestions.append("Continue routine monitoring; no immediate operational action indicated")

    # --- Dedupe suggestion text, preserving order -------------------------
    seen = set()
    deduped_suggestions = []
    for s in suggestions:
        if s not in seen:
            seen.add(s)
            deduped_suggestions.append(s)

    return deduped_suggestions, reasons
