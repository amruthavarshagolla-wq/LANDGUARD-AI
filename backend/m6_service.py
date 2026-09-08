"""
m6_service.py
=============
Operational Response (Module 6) Integration Service.
Integrates the existing run_pipeline(data) from impact-priority.

Rule: Do NOT introduce priority_score, priority_rank, or priority_band
outside of the existing M6 operational response pipeline.
"""

import sys
from pathlib import Path
from typing import Dict, Any, List

# Ensure impact-priority module is in python path
IMPACT_PRIORITY_DIR = Path(__file__).resolve().parent.parent / "impact-priority"
if str(IMPACT_PRIORITY_DIR) not in sys.path:
    sys.path.insert(0, str(IMPACT_PRIORITY_DIR))

try:
    from src.pipeline import run_pipeline
except ImportError:
    # Fallback import if loaded directly from src
    from pipeline import run_pipeline


def execute_m6_pipeline(
    risk_data: List[Dict[str, Any]],
    gis_data: List[Dict[str, Any]],
    field_reports: List[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Executes the existing M6 run_pipeline(data) orchestrator.
    Passes data in the exact contract confirmed by the M6 team.
    """
    payload = {
        "risk_data": risk_data or [],
        "gis_data": gis_data or [],
        "field_reports": field_reports or [],
    }
    return run_pipeline(payload)
