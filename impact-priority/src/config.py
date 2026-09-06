"""
config.py
=========
ALL tunable numbers live here. Nowhere else in the codebase should a
"magic number" weight appear. This means:
  1. You can tune the whole system by editing ONE file.
  2. In your judge Q&A, you can point to this file and say "these are our
     prototype assumptions, documented and adjustable" — which is exactly
     the honest, defensible answer expected of a hackathon prototype.

IMPORTANT — say this to judges explicitly:
"These weights are reasoned prototype assumptions based on standard
disaster-vulnerability logic (e.g. AHP-style relative importance).
They are NOT scientifically calibrated against ground-truth outcome data.
Calibrating them would require historical incident data, which is a
natural next step beyond this hackathon prototype."
"""

# ---------------------------------------------------------------------------
# EXPOSURE SCORE weights (how many people/assets are exposed)
# ---------------------------------------------------------------------------
EXPOSURE_WEIGHTS = {
    "population": 0.50,   # population is the dominant exposure factor
    "villages": 0.25,     # number of distinct settlements affected
    "assets": 0.25,       # total count of infra assets (roads+bridges+schools+hospitals+other)
}

POPULATION_REFERENCE = 5000   # population_exposed >= this => full 100 exposure points (assumption)
VILLAGE_REFERENCE = 5         # 5+ villages affected => full 100 points (assumption)
ASSET_COUNT_REFERENCE = 5     # 5+ total assets => full 100 points (assumption)


# ---------------------------------------------------------------------------
# VULNERABILITY SCORE weights (how badly exposed people/assets would suffer)
# ---------------------------------------------------------------------------
VULNERABILITY_WEIGHTS = {
    "accessibility_loss": 0.50,   # isolation risk dominates vulnerability
    "repeat_risk": 0.30,          # history of landslides at this zone
    "field_severity": 0.20,       # ground-reported severity, if available
}

HISTORICAL_EVENTS_REFERENCE = 3   # 3+ past events => full 100 repeat-risk points (assumption)

# Accessibility scoring (rule-based, not a formula):
ACCESS_SCORE_ONLY_ACCESS_NO_ALT = 100   # sole route, no alternate exists -> worst case
ACCESS_SCORE_ONLY_ACCESS_WITH_ALT = 40  # sole-labeled route but alternate exists -> moderate
ACCESS_SCORE_NO_CRITICAL_ROUTE = 10     # no only-access road/bridge identified -> low

# Field-report severity mapping
# NOTE: "critical" added to match confirmed Field Reporting output (LOW/MEDIUM/HIGH/CRITICAL).
# Both "high" and "critical" map to the scale's maximum (100) since our internal scoring
# scale is capped at 0-100; the distinction between them is still preserved and acted on
# separately in the urgent-action trigger (see pipeline.py / actions.py).
SEVERITY_SCORE_MAP = {"low": 30, "medium": 60, "high": 100, "critical": 100}
UNVERIFIED_REPORT_DISCOUNT = 0.5   # unverified citizen reports count at half weight vs officer-verified


# ---------------------------------------------------------------------------
# INFRASTRUCTURE CRITICALITY weights (importance of specific assets present)
# ---------------------------------------------------------------------------
# Each asset type contributes a "criticality weight" if present in the zone.
# Final score = highest single weight + a bonus for each ADDITIONAL distinct
# critical asset type present (captures "hospital + only-access road" being
# worse than either alone, without just summing unboundedly).
CRITICALITY_ASSET_WEIGHTS = {
    "hospital": 100,
    "dam_nearby": 100,
    "bridge_only_access": 90,
    "road_only_access": 80,
    "school": 60,
    "power_substation": 50,
    "water_supply": 50,
    "telecom_tower": 40,
    "road_other": 30,
    "other_generic": 20,
}
CRITICALITY_BONUS_PER_EXTRA_ASSET = 10   # per additional distinct critical asset type, capped at 100


# ---------------------------------------------------------------------------
# PRIORITY SCORE weights (final combination)
# ---------------------------------------------------------------------------
PRIORITY_WEIGHTS = {
    "risk": 0.35,          # AI model's predicted likelihood — single biggest factor
    "exposure": 0.25,
    "vulnerability": 0.20,
    "criticality": 0.20,
}
FIELD_REPORT_PRIORITY_BOOST = 10   # added if a verified field report exists for the zone, capped at 100

# ---------------------------------------------------------------------------
# PRIORITY BANDS (thresholds are prototype assumptions, easy to re-tune)
# ---------------------------------------------------------------------------
PRIORITY_BANDS = [
    (80, 100, "Critical"),
    (60, 79.999, "High"),
    (35, 59.999, "Medium"),
    (0, 34.999, "Low"),
]

# Default fallback values used when data is missing (see edge-case handling)
DEFAULT_RISK_SCORE_IF_MISSING = 50   # treat unknown risk as "moderate" rather than 0 (avoid false safety)
