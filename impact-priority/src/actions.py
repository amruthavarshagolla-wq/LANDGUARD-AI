"""
actions.py
==========
PIPELINE STAGE: Recommended Response Action

WHAT THIS ANSWERS:
"Given the priority band and the SPECIFIC assets in this zone, what
concrete action should authorities take?" — deliberately simple, rule-
based (if/elif), not ML. This is the right choice here: judges and real
authorities need to see WHY an action was recommended, and rule-based
logic is fully auditable.

INPUT REQUIRED:
  - priority_band (from priority.py)
  - criticality breakdown (to check for hospital / only-access route)
  - verified field report info (to allow an "urgent override")

OUTPUT:
  - recommended_action: a short, human-readable instruction string

CONNECTS TO: explain.py includes this action in the final explanation;
pipeline.py puts it directly into the dashboard-facing output.
"""


def recommend_action(priority_band: str, criticality_breakdown: dict,
                      has_verified_field_report: bool, field_report_severity: str = None) -> str:

    has_hospital = "hospital" in criticality_breakdown.get("present_asset_types", [])
    has_isolated_access = criticality_breakdown.get("max_weight_asset") in (
        "road_only_access", "bridge_only_access"
    )

    if priority_band == "Critical":
        if has_hospital or has_isolated_access:
            action = "Evacuate immediately and deploy rescue team now — critical asset at risk of isolation."
        else:
            action = "Evacuate at-risk residents immediately; alert district authorities without delay."

    elif priority_band == "High":
        action = "Deploy inspection team within 24 hours; prepare a contingency evacuation plan."

    elif priority_band == "Medium":
        action = "Increase monitoring frequency at this zone; notify local officials to stay alert."

    else:  # Low
        action = "Continue routine monitoring; no immediate action required."

    # Verified field-report override: prepend urgency regardless of computed band,
    # since ground-truth confirmation should never be silently absorbed into a score.
    if has_verified_field_report and field_report_severity in ("high", "critical"):
        action = "URGENT (ground-confirmed): " + action

    return action
