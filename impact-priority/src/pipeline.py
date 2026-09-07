"""
pipeline.py
===========
This is the ORCHESTRATOR — it runs every stage in order for every zone,
and produces the final operational-response output list. This is the single function your
backend teammate (Amruthavarsha) will call.

PIPELINE ORDER (M6 simplified -- see config.py / README for why the
separate priority-ranking stage was removed):
  AI Risk + GIS Exposure + Field Reports
    -> Impact/Exposure Assessment       (exposure.py, unchanged)
    -> Vulnerability Assessment         (vulnerability.py, unchanged)
    -> Infrastructure Criticality       (criticality.py, unchanged)
    -> Operational Response Suggestions (actions.py: generate_operational_suggestions)
    -> Explain Why                      (explain.py: generate_operational_explanation)
    -> structured output

  The old priority.py stage (Priority Score -> Priority Band -> Rank) and
  the old priority-band-driven recommend_action are no longer called here.
  Both files are kept, unused, for reference/backward compatibility -- see
  their module docstrings. exposure_score/vulnerability_score/
  criticality_score are still computed and still included in the output
  (they are legitimate impact-assessment numbers in their own right, not
  "priority ranking"); only priority_score/priority_band/priority_rank/
  recommended_action have been removed, replaced by operational_suggestions
  + explanation.

EDGE CASES HANDLED HERE (unchanged):
  - zone appears in risk data but missing from GIS data (or vice versa)
  - duplicate zone_id entries
  - missing field reports (perfectly fine, treated as empty list)
  - a zone with zero exposure data at all (flagged, still scored conservatively)
"""

from .exposure import compute_exposure_score
from .vulnerability import compute_vulnerability_score
from .criticality import compute_criticality_score
from .actions import generate_operational_suggestions
from .explain import generate_operational_explanation


def _index_by_zone(records: list, key: str = "zone_id") -> dict:
    """De-duplicates by zone_id, keeping the FIRST occurrence and logging a warning."""
    indexed = {}
    for r in records:
        zid = r.get(key)
        if zid in indexed:
            print(f"[WARNING] Duplicate zone_id '{zid}' found — keeping first occurrence only.")
            continue
        indexed[zid] = r
    return indexed


def run_pipeline(data: dict) -> list:
    """
    PUBLIC INTERFACE — this is what the Backend calls.

    Confirmed contract with Backend (Amruthavarsha):
        run_pipeline(data) where `data` is a single dict/JSON object:
        {
            "risk_data": [ ... list of AI/ML risk records ... ],
            "gis_data": [ ... list of GIS exposure records ... ],
            "field_reports": [ ... list of field report records ... ]   # optional
        }

    Any of the three keys may be omitted or empty — missing data is
    handled the same way the underlying pipeline already handles missing
    risk/GIS/field data (see _run_pipeline_core and data_quality_flags).

    This function does no scoring itself — it only unpacks the single
    dict into the three lists the existing, unchanged core pipeline
    expects, so none of the scoring logic below had to change.
    """
    risk_records = data.get("risk_data") or []
    gis_records = data.get("gis_data") or []
    field_reports = data.get("field_reports") or []
    return _run_pipeline_core(risk_records, gis_records, field_reports)


def _run_pipeline_core(risk_records: list, gis_records: list, field_reports: list = None) -> list:
    """
    risk_records: list of dicts matching schemas.RiskInput
    gis_records: list of dicts matching schemas.GISInput
    field_reports: list of dicts matching schemas.FieldReport (optional)

    Returns: list of operational-response output dicts, sorted by zone_id
    for deterministic output (not by priority).
    """
    field_reports = field_reports or []

    risk_by_zone = _index_by_zone(risk_records)
    gis_by_zone = _index_by_zone(gis_records)

    # Union of all zone_ids seen in either source — we don't want to silently
    # drop a zone just because one module hasn't reported on it yet.
    all_zone_ids = set(risk_by_zone.keys()) | set(gis_by_zone.keys())

    reports_by_zone = {}
    for report in field_reports:
        reports_by_zone.setdefault(report.get("zone_id"), []).append(report)

    results = []

    for zone_id in all_zone_ids:
        data_quality_flags = []

        risk_record = risk_by_zone.get(zone_id)
        gis_record = gis_by_zone.get(zone_id)

        if risk_record is None:
            data_quality_flags.append("no_risk_data_for_zone")
            risk_record = {"zone_id": zone_id, "risk_score": None}
        if gis_record is None:
            data_quality_flags.append("no_gis_data_for_zone")
            gis_record = {"zone_id": zone_id}

        zone_reports = reports_by_zone.get(zone_id, [])

        # --- Stage: Exposure ---
        exposure_score, exposure_breakdown = compute_exposure_score(gis_record)
        data_quality_flags += exposure_breakdown.get("flags", [])

        # --- Stage: Vulnerability ---
        vulnerability_score, vulnerability_breakdown = compute_vulnerability_score(gis_record, zone_reports)
        data_quality_flags += vulnerability_breakdown.get("flags", [])

        # --- Stage: Infrastructure Criticality ---
        criticality_score, criticality_breakdown = compute_criticality_score(gis_record)
        data_quality_flags += criticality_breakdown.get("flags", [])

        # --- Verified field-report status (unchanged from before) ---
        # NOTE: severity values from the field-reporting module arrive as uppercase
        # strings (e.g. "HIGH", "CRITICAL") -- normalize with .lower() before comparing.
        has_verified_report = any(r.get("verified") for r in zone_reports)
        best_field_severity = None
        if zone_reports:
            severities = [str(r.get("severity", "")).lower() for r in zone_reports if r.get("verified")]
            if "critical" in severities:
                best_field_severity = "critical"
            elif "high" in severities:
                best_field_severity = "high"

        # --- Stage: Operational Response Suggestions ---
        operational_suggestions, suggestion_reasons = generate_operational_suggestions(
            risk_record, gis_record, has_verified_report, best_field_severity
        )

        # --- Stage: Explain Why ---
        explanation = generate_operational_explanation(zone_id, suggestion_reasons)

        # --- Final structured output for backend/dashboard ---
        output = {
            "zone_id": zone_id,
            "risk_score": risk_record.get("risk_score"),
            "exposure_score": exposure_score,
            "vulnerability_score": vulnerability_score,
            "criticality_score": criticality_score,
            "operational_suggestions": operational_suggestions,
            "explanation": explanation,
            "data_quality_flags": sorted(set(data_quality_flags)),
            "affected_summary": {
                "population_exposed": gis_record.get("population_exposed"),
                "villages": gis_record.get("villages") or [],
                "hospitals": gis_record.get("hospitals") or 0,
                "schools": gis_record.get("schools") or 0,
                "has_verified_field_report": has_verified_report,
            },
        }
        results.append(output)

    # No priority ranking anymore (see module docstring). Sorted by zone_id
    # purely for deterministic, stable output ordering -- this is NOT a
    # priority ordering and callers should not treat it as one.
    results.sort(key=lambda r: str(r["zone_id"]))

    return results
