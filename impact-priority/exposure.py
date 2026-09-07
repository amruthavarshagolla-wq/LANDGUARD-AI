"""
exposure.py
===========
PIPELINE STAGE: GIS Exposure -> Impact Assessment (Exposure component)

WHAT THIS ANSWERS:
"How many people and assets are exposed in this zone?" — pure scale of
exposure, independent of how vulnerable or critical they are (those are
separate stages).

INPUT REQUIRED (from GIS module, via schemas.GISInput):
  - population_exposed
  - villages (list)
  - roads, bridges, schools, hospitals, other_infrastructure (for asset count)

OUTPUT:
  - exposure_score: float 0-100
  - breakdown: dict showing each component's contribution (used later for
    the "Why Priority 1?" explanation)

CONNECTS TO: priority.py uses exposure_score as one of 4 weighted inputs.
"""

from .config import (
    EXPOSURE_WEIGHTS,
    POPULATION_REFERENCE,
    VILLAGE_REFERENCE,
    ASSET_COUNT_REFERENCE,
)
from .utils import normalize_count, normalize_asset_list


def _normalize(value, reference):
    """Simple min-max style normalization capped at 100. Missing/None -> 0."""
    if value is None:
        return 0.0
    return min(float(value) / reference, 1.0) * 100


def compute_exposure_score(gis_record: dict) -> tuple[float, dict]:
    """
    gis_record: a dict matching schemas.GISInput fields.
    Returns (exposure_score, breakdown_dict).
    """
    flags = []

    population = gis_record.get("population_exposed")
    if population is None:
        flags.append("population_missing")

    villages = gis_record.get("villages") or []
    num_villages = len(villages)

    roads, roads_flag = normalize_asset_list(gis_record.get("roads"))
    bridges, bridges_flag = normalize_asset_list(gis_record.get("bridges"))
    schools, schools_flag = normalize_count(gis_record.get("schools"))
    hospitals, hospitals_flag = normalize_count(gis_record.get("hospitals"))
    other_infra = gis_record.get("other_infrastructure") or []
    for f in (roads_flag, bridges_flag, schools_flag, hospitals_flag):
        if f:
            flags.append(f)

    total_assets = len(roads) + len(bridges) + schools + hospitals + len(other_infra)

    pop_score = _normalize(population, POPULATION_REFERENCE)
    village_score = _normalize(num_villages, VILLAGE_REFERENCE)
    asset_score = _normalize(total_assets, ASSET_COUNT_REFERENCE)

    exposure_score = (
        EXPOSURE_WEIGHTS["population"] * pop_score
        + EXPOSURE_WEIGHTS["villages"] * village_score
        + EXPOSURE_WEIGHTS["assets"] * asset_score
    )

    breakdown = {
        "population_exposed": population,
        "population_score": round(pop_score, 1),
        "num_villages": num_villages,
        "village_score": round(village_score, 1),
        "total_assets": total_assets,
        "asset_score": round(asset_score, 1),
        "exposure_score": round(exposure_score, 1),
        "flags": flags,
    }
    return round(exposure_score, 1), breakdown
