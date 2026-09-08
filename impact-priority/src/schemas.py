"""
schemas.py
==========
This file is the CONTRACT between your module (M6) and your teammates.
It defines exactly what fields you expect from the AI/ML module, the GIS
module, and Field Reports — and exactly what you send back out.

WHY THIS FILE EXISTS:
Instead of verbally telling teammates "send me population and roads",
you hand them this file. If their output matches these field names and
types, your pipeline works with zero changes. This is your integration
contract.

Nothing in here does computation — it's documentation + light validation.
"""

from dataclasses import dataclass, field
from typing import Optional


# ---------------------------------------------------------------------------
# INPUT 1: From Jyothika (AI/ML & Risk Prediction)
# ---------------------------------------------------------------------------
@dataclass
class RiskInput:
    zone_id: str                       # unique ID, e.g. "EKH_001". MUST match GIS zone_id.
    risk_score: float                  # 0-100, model's predicted landslide risk (ONLY field besides
                                        # zone_id actually read by this module's scoring logic)
    risk_category: Optional[str] = None    # e.g. "Very High" / "Moderate" (informational only,
                                            # we recompute our own bands from risk_score)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    prediction_factors: Optional[dict] = None
    # CONFIRMED (2026-09) from AI/ML teammate: target output field name is
    # "prediction_factors" (a dict, e.g. {"slope_deg": 34.2, "rainfall_mm_day": 9.8, ...}),
    # not "top_factors". This module does NOT currently read prediction_factors --
    # it is accepted and safely ignored. Zone-level AI/GIS zoning output is still
    # being developed by the AI/ML team; this schema is ready to receive it whenever
    # it becomes available, without requiring any code change here.


# ---------------------------------------------------------------------------
# INPUT 2: From Hasini (GIS & Geospatial) — ALREADY AGGREGATED PER ZONE
# ---------------------------------------------------------------------------
@dataclass
class RoadInfo:
    name: str
    only_access: bool = False          # True = sole route in/out for a village
    alternate_route_exists: bool = False


@dataclass
class GISInput:
    zone_id: str                       # MUST match RiskInput.zone_id
    population_exposed: Optional[int] = None
    villages: Optional[list] = None            # list of village names, e.g. ["Village A"]
    roads: Optional[list] = None               # list of RoadInfo-shaped dicts
    bridges: Optional[list] = None             # list of dicts: {"name":..., "only_access":...}
    schools: Optional[int] = 0
    hospitals: Optional[int] = 0
    other_infrastructure: Optional[list] = None  # e.g. [{"type":"power_substation"}, {"type":"dam"}]
    historical_landslide_count: Optional[int] = None  # how many past events recorded here


# ---------------------------------------------------------------------------
# INPUT 3: From Hansika (Field Reporting) — OPTIONAL, may not exist for all zones
# ---------------------------------------------------------------------------
@dataclass
class FieldReport:
    # CONFIRMED from Field Reporting teammate's actual output (2026-09-05).
    # zone_id may be None/null if the backend hasn't resolved GPS -> zone yet;
    # such reports are safely ignored by this module until zone_id is assigned.
    zone_id: Optional[str]
    severity: str                      # "LOW" / "MEDIUM" / "HIGH" / "CRITICAL" (case-insensitive,
                                        # normalized internally to lowercase before use)
    verified: bool = False             # backend/authority sets this; new submissions default to False
    observation: Optional[str] = None  # maps to their "description" field if present
    timestamp: Optional[str] = None    # maps to their "created_at" field if present
    # Extra fields the teammate sends (report_id, report_type, latitude, longitude,
    # status) are NOT required by this module's scoring logic and can be safely
    # ignored -- no adapter needed for those.


# ---------------------------------------------------------------------------
# OUTPUT: What YOUR module sends to Backend -> Dashboard
# ---------------------------------------------------------------------------
@dataclass
class OperationalResponseOutput:
    """Output contract for operational response intelligence.

    The module no longer computes a separate priority score/rank. It converts
    AI risk, GIS context, and verified field reports into explainable
    operational suggestions.
    """
    zone_id: str
    risk_score: float
    risk_category: str | None
    operational_suggestions: list[str]
    explanation: str
    data_quality_flags: list[str]
    affected_summary: dict


