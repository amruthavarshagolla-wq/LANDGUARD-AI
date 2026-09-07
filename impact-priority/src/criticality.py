"""
criticality.py
===============
PIPELINE STAGE: Infrastructure Criticality

WHAT THIS ANSWERS:
"Regardless of HOW MANY assets are exposed (that's exposure's job), how
IMPORTANT is the single most critical asset here, and are there multiple
critical asset types stacked in this zone?"

A hospital in a zone matters more than 10 unnamed local roads. This stage
captures that asymmetry deliberately, using a rule-based "max + bonus"
approach rather than a simple sum (which would let 5 minor roads
outweigh 1 hospital — undesirable).

INPUT REQUIRED:
  - roads, bridges (with only_access flags), schools, hospitals,
    other_infrastructure (list of {"type": "..."} dicts)

OUTPUT:
  - criticality_score: float 0-100
  - breakdown: dict listing which asset types were found and their weights

CONNECTS TO: priority.py (one of 4 weighted inputs).
"""

from .config import CRITICALITY_ASSET_WEIGHTS, CRITICALITY_BONUS_PER_EXTRA_ASSET
from .utils import normalize_count, normalize_asset_list, safe_get


def _present_asset_types(gis_record: dict) -> tuple[list[str], list[str]]:
    """Translate raw GIS fields into the asset-type vocabulary used in config weights.
    Returns (present_types, flags)."""
    present = []
    flags = []

    roads, roads_flag = normalize_asset_list(gis_record.get("roads"))
    if roads_flag:
        flags.append(roads_flag)
    if any(safe_get(r, "only_access") for r in roads):
        present.append("road_only_access")
    elif roads:
        present.append("road_other")

    bridges, bridges_flag = normalize_asset_list(gis_record.get("bridges"))
    if bridges_flag:
        flags.append(bridges_flag)
    if any(safe_get(b, "only_access") for b in bridges):
        present.append("bridge_only_access")

    hospitals, hospitals_flag = normalize_count(gis_record.get("hospitals"))
    if hospitals_flag:
        flags.append(hospitals_flag)
    if hospitals > 0:
        present.append("hospital")

    schools, schools_flag = normalize_count(gis_record.get("schools"))
    if schools_flag:
        flags.append(schools_flag)
    if schools > 0:
        present.append("school")

    for item in (gis_record.get("other_infrastructure") or []):
        asset_type = item.get("type", "").lower()
        if asset_type == "dam" or asset_type == "dam_nearby":
            present.append("dam_nearby")
        elif asset_type in ("power_substation", "power"):
            present.append("power_substation")
        elif asset_type in ("water_supply", "water"):
            present.append("water_supply")
        elif asset_type in ("telecom_tower", "telecom"):
            present.append("telecom_tower")
        else:
            present.append("other_generic")

    return present, flags


def compute_criticality_score(gis_record: dict) -> tuple[float, dict]:
    present_types, input_flags = _present_asset_types(gis_record)

    if not present_types:
        # NOTE: this is the expected outcome for the vast majority of zones
        # (confirmed GIS reality: only 19/22,615 zones have a hospital, 40
        # have a school) -- this is legitimate sparse data, NOT a data
        # quality problem, so no flag is raised here.
        return 0.0, {
            "present_asset_types": [],
            "max_weight_asset": None,
            "criticality_score": 0.0,
            "flags": input_flags,
        }

    weights = sorted(
        [CRITICALITY_ASSET_WEIGHTS.get(t, CRITICALITY_ASSET_WEIGHTS["other_generic"]) for t in present_types],
        reverse=True,
    )
    max_weight = weights[0]
    extra_distinct_types = len(set(present_types)) - 1
    criticality_score = min(100, max_weight + extra_distinct_types * CRITICALITY_BONUS_PER_EXTRA_ASSET)

    # Identify which type carried the max weight, for explanation purposes
    max_weight_asset = next(
        t for t in present_types
        if CRITICALITY_ASSET_WEIGHTS.get(t, CRITICALITY_ASSET_WEIGHTS["other_generic"]) == max_weight
    )

    breakdown = {
        "present_asset_types": present_types,
        "max_weight_asset": max_weight_asset,
        "criticality_score": round(criticality_score, 1),
        "flags": input_flags,
    }
    return round(criticality_score, 1), breakdown
