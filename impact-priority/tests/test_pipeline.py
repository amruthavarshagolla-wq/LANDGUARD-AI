"""
test_pipeline.py
=================
RUN: pytest tests/ -v   (from the project root)

WHY THESE TESTS MATTER FOR YOUR DEMO:
Judges may ask "what happens if data is missing/wrong?" — having tests
that PROVE your system doesn't crash on bad input is a strong, concrete
answer instead of a verbal promise.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.exposure import compute_exposure_score
from src.vulnerability import compute_vulnerability_score
from src.criticality import compute_criticality_score
from src.priority import compute_priority_score, classify_band
from src.pipeline import run_pipeline


# ---------------------------------------------------------------------------
# Unit tests: individual scoring stages
# ---------------------------------------------------------------------------

def test_exposure_score_basic():
    gis = {"population_exposed": 5000, "villages": ["A", "B"], "roads": [{}], "schools": 1, "hospitals": 1}
    score, breakdown = compute_exposure_score(gis)
    assert 0 <= score <= 100
    assert breakdown["population_score"] == 100  # at reference cap


def test_exposure_score_missing_population():
    gis = {"villages": ["A"], "roads": [], "schools": 0, "hospitals": 0}
    score, breakdown = compute_exposure_score(gis)
    assert "population_missing" in breakdown["flags"]
    assert score >= 0  # must not crash or go negative


def test_vulnerability_only_access_no_alternate_is_worst_case():
    gis = {"roads": [{"only_access": True, "alternate_route_exists": False}], "bridges": []}
    score, breakdown = compute_vulnerability_score(gis, [])
    assert breakdown["accessibility_score"] == 100


def test_vulnerability_with_verified_high_severity_report_increases_score():
    gis = {"roads": [], "bridges": []}
    score_no_report, _ = compute_vulnerability_score(gis, [])
    score_with_report, _ = compute_vulnerability_score(
        gis, [{"zone_id": "X", "severity": "high", "verified": True}]
    )
    assert score_with_report > score_no_report


def test_criticality_hospital_outweighs_many_minor_roads():
    gis_hospital = {"hospitals": 1, "roads": []}
    gis_many_roads = {"hospitals": 0, "roads": [{"only_access": False} for _ in range(5)]}
    score_hospital, _ = compute_criticality_score(gis_hospital)
    score_roads, _ = compute_criticality_score(gis_many_roads)
    assert score_hospital > score_roads


def test_priority_band_thresholds():
    assert classify_band(85) == "Critical"
    assert classify_band(65) == "High"
    assert classify_band(40) == "Medium"
    assert classify_band(10) == "Low"


def test_priority_score_missing_risk_uses_default_and_flags():
    score, flags = compute_priority_score(None, 50, 50, 50, has_verified_field_report=False)
    assert "risk_score_missing_used_default" in flags
    assert 0 <= score <= 100


# ---------------------------------------------------------------------------
# Integration / edge-case tests: full pipeline
# ---------------------------------------------------------------------------

def test_pipeline_runs_on_sample_data_and_ranks_correctly():
    risk = [{"zone_id": "Z1", "risk_score": 90}, {"zone_id": "Z2", "risk_score": 10}]
    gis = [{"zone_id": "Z1", "population_exposed": 1000}, {"zone_id": "Z2", "population_exposed": 10}]
    results = run_pipeline({"risk_data": risk, "gis_data": gis, "field_reports": []})
    assert results[0]["zone_id"] == "Z1"  # higher risk+exposure should rank first
    assert results[0]["priority_rank"] == 1
    assert results[1]["priority_rank"] == 2


def test_pipeline_handles_zone_missing_from_gis():
    risk = [{"zone_id": "Z1", "risk_score": 80}]
    gis = []  # no GIS data at all for Z1
    results = run_pipeline({"risk_data": risk, "gis_data": gis, "field_reports": []})
    assert len(results) == 1
    assert "no_gis_data_for_zone" in results[0]["data_quality_flags"]
    assert results[0]["priority_score"] >= 0  # must not crash


def test_pipeline_handles_zone_missing_from_risk():
    risk = []
    gis = [{"zone_id": "Z9", "population_exposed": 200}]
    results = run_pipeline({"risk_data": risk, "gis_data": gis, "field_reports": []})
    assert len(results) == 1
    assert "no_risk_data_for_zone" in results[0]["data_quality_flags"]
    assert "risk_score_missing_used_default" in results[0]["data_quality_flags"]


def test_pipeline_handles_duplicate_zone_ids(capsys):
    risk = [{"zone_id": "Z1", "risk_score": 50}, {"zone_id": "Z1", "risk_score": 99}]
    gis = [{"zone_id": "Z1", "population_exposed": 100}]
    results = run_pipeline({"risk_data": risk, "gis_data": gis, "field_reports": []})
    assert len(results) == 1  # de-duplicated, not two entries
    captured = capsys.readouterr()
    assert "Duplicate zone_id" in captured.out


def test_pipeline_handles_zone_with_zero_exposure_data():
    risk = [{"zone_id": "Z_empty", "risk_score": 60}]
    gis = [{"zone_id": "Z_empty"}]  # present but completely empty
    results = run_pipeline({"risk_data": risk, "gis_data": gis, "field_reports": []})
    assert results[0]["exposure_score"] == 0
    assert results[0]["priority_score"] >= 0


def test_confirmed_field_report_format_uppercase_high_triggers_urgent_action():
    """Matches the CONFIRMED real Field Reporting output format exactly."""
    risk = [{"zone_id": "ZONE_05", "risk_score": 70}]
    gis = [{"zone_id": "ZONE_05", "population_exposed": 500,
            "roads": [{"only_access": True, "alternate_route_exists": False}]}]
    real_report = {
        "report_id": 101, "zone_id": "ZONE_05", "report_type": "LANDSLIDE",
        "description": "Landslide material blocking part of the road",
        "latitude": 20.123456, "longitude": 85.456789,
        "severity": "HIGH", "verified": True,
        "status": "VERIFIED", "created_at": "2026-09-05T10:30:00",
    }
    results = run_pipeline({"risk_data": risk, "gis_data": gis, "field_reports": [real_report]})
    assert "URGENT (ground-confirmed):" in results[0]["recommended_action"]


def test_confirmed_field_report_critical_severity_is_scored_not_dropped():
    risk = [{"zone_id": "ZONE_06", "risk_score": 60}]
    gis = [{"zone_id": "ZONE_06", "population_exposed": 500}]
    report = {"zone_id": "ZONE_06", "severity": "CRITICAL", "verified": True}
    score, breakdown = compute_vulnerability_score(gis[0], [report])
    assert breakdown["field_report_score"] == 100  # must NOT be 0


def test_confirmed_field_report_newly_submitted_defaults_verified_false():
    """New submissions arrive with verified: false -- must be discounted, not boosted."""
    risk = [{"zone_id": "ZONE_07", "risk_score": 50}]
    gis = [{"zone_id": "ZONE_07", "population_exposed": 500}]
    report = {"zone_id": "ZONE_07", "severity": "HIGH", "verified": False}
    results = run_pipeline({"risk_data": risk, "gis_data": gis, "field_reports": [report]})
    assert results[0]["affected_summary"]["has_verified_field_report"] is False
    assert "URGENT" not in results[0]["recommended_action"]


def test_confirmed_field_report_null_zone_id_does_not_crash_or_match():
    """zone_id may be null before backend resolves GPS -> zone."""
    risk = [{"zone_id": "ZONE_08", "risk_score": 50}]
    gis = [{"zone_id": "ZONE_08", "population_exposed": 500}]
    unresolved_report = {"zone_id": None, "severity": "CRITICAL", "verified": True}
    results = run_pipeline({"risk_data": risk, "gis_data": gis, "field_reports": [unresolved_report]})
    assert len(results) == 1
    assert results[0]["affected_summary"]["has_verified_field_report"] is False  # correctly not matched


def test_pipeline_field_report_for_unknown_zone_does_not_crash():
    risk = [{"zone_id": "Z1", "risk_score": 50}]
    gis = [{"zone_id": "Z1"}]
    field_reports = [{"zone_id": "Z_NOT_IN_ANY_LIST", "severity": "high", "verified": True}]
    results = run_pipeline({"risk_data": risk, "gis_data": gis, "field_reports": field_reports})
    assert len(results) == 1  # orphan report is simply ignored, no crash


# ---------------------------------------------------------------------------
# CONTRACT INTEGRATION TESTS
# Based ONLY on the confirmed Backend and Field Reporting specifications.
# These validate the exact public interface: run_pipeline(data: dict) -> list
# ---------------------------------------------------------------------------

def _base_risk(zone_id="ZONE_05", risk_score=70):
    return [{"zone_id": zone_id, "risk_score": risk_score}]


def _base_gis(zone_id="ZONE_05"):
    return [{
        "zone_id": zone_id,
        "population_exposed": 800,
        "villages": ["Sample Village"],
        "roads": [{"name": "Access Road", "only_access": True, "alternate_route_exists": False}],
        "bridges": [],
        "schools": 1,
        "hospitals": 0,
        "other_infrastructure": [],
        "historical_landslide_count": 1,
    }]


def test_case_1_zone_with_no_field_report():
    data = {"risk_data": _base_risk(), "gis_data": _base_gis(), "field_reports": []}
    results = run_pipeline(data)
    assert len(results) == 1
    assert results[0]["affected_summary"]["has_verified_field_report"] is False
    assert "URGENT" not in results[0]["recommended_action"]


def test_case_2_zone_with_unverified_field_report():
    # Exact shape confirmed by Field Reporting teammate, verified defaults to false
    report = {
        "report_id": 101, "zone_id": "ZONE_05", "report_type": "LANDSLIDE",
        "description": "Landslide material blocking part of the road",
        "latitude": 20.123456, "longitude": 85.456789,
        "severity": "HIGH", "verified": False,
        "status": "PENDING_VERIFICATION", "created_at": "2026-09-05T10:30:00",
    }
    data = {"risk_data": _base_risk(), "gis_data": _base_gis(), "field_reports": [report]}
    results = run_pipeline(data)
    assert results[0]["affected_summary"]["has_verified_field_report"] is False
    assert "URGENT" not in results[0]["recommended_action"]  # must NOT get verified boost/tag


def test_case_3_zone_with_verified_high_field_report():
    report = {
        "report_id": 102, "zone_id": "ZONE_05", "report_type": "LANDSLIDE",
        "description": "Confirmed crack widening", "latitude": 20.1, "longitude": 85.4,
        "severity": "HIGH", "verified": True,
        "status": "VERIFIED", "created_at": "2026-09-05T11:00:00",
    }
    data = {"risk_data": _base_risk(), "gis_data": _base_gis(), "field_reports": [report]}
    results = run_pipeline(data)
    assert results[0]["affected_summary"]["has_verified_field_report"] is True
    assert "URGENT (ground-confirmed):" in results[0]["recommended_action"]


def test_case_4_zone_with_verified_critical_field_report():
    report = {
        "report_id": 103, "zone_id": "ZONE_05", "report_type": "LANDSLIDE",
        "description": "Major slope failure in progress", "latitude": 20.1, "longitude": 85.4,
        "severity": "CRITICAL", "verified": True,
        "status": "VERIFIED", "created_at": "2026-09-05T11:15:00",
    }
    data = {"risk_data": _base_risk(), "gis_data": _base_gis(), "field_reports": [report]}
    results = run_pipeline(data)
    assert results[0]["affected_summary"]["has_verified_field_report"] is True
    assert "URGENT (ground-confirmed):" in results[0]["recommended_action"]
    # priority score should reflect the +10 verified boost, must not exceed 100
    assert results[0]["priority_score"] <= 100


def test_case_5_field_report_with_null_zone_id():
    report = {
        "report_id": 104, "zone_id": None, "report_type": "LANDSLIDE",
        "description": "Unresolved GPS report", "latitude": 20.2, "longitude": 85.5,
        "severity": "CRITICAL", "verified": True,
        "status": "PENDING_VERIFICATION", "created_at": "2026-09-05T11:20:00",
    }
    data = {"risk_data": _base_risk(), "gis_data": _base_gis(), "field_reports": [report]}
    results = run_pipeline(data)
    # M6 must NOT invent/assign a zone for this report -- it stays unmatched
    assert len(results) == 1
    assert results[0]["affected_summary"]["has_verified_field_report"] is False


def test_case_6_multiple_zones_requiring_priority_ranking():
    risk_data = [
        {"zone_id": "ZONE_01", "risk_score": 30},
        {"zone_id": "ZONE_02", "risk_score": 95},
        {"zone_id": "ZONE_03", "risk_score": 60},
    ]
    gis_data = [
        {"zone_id": "ZONE_01", "population_exposed": 100},
        {"zone_id": "ZONE_02", "population_exposed": 2000, "hospitals": 1},
        {"zone_id": "ZONE_03", "population_exposed": 500},
    ]
    data = {"risk_data": risk_data, "gis_data": gis_data, "field_reports": []}
    results = run_pipeline(data)
    assert len(results) == 3
    # ZONE_02 has highest risk + hospital + highest population -> must rank #1
    assert results[0]["zone_id"] == "ZONE_02"
    assert results[0]["priority_rank"] == 1
    ranks = [r["priority_rank"] for r in results]
    assert ranks == sorted(ranks)  # ranks strictly increasing 1,2,3
    scores = [r["priority_score"] for r in results]
    assert scores == sorted(scores, reverse=True)  # scores strictly descending


def test_case_7_normal_complete_input_matches_output_contract():
    """Full realistic input -> verifies EVERY required output field is present."""
    data = {
        "risk_data": _base_risk(),
        "gis_data": _base_gis(),
        "field_reports": [{
            "report_id": 105, "zone_id": "ZONE_05", "report_type": "LANDSLIDE",
            "description": "test", "latitude": 20.1, "longitude": 85.4,
            "severity": "MEDIUM", "verified": True,
            "status": "VERIFIED", "created_at": "2026-09-05T12:00:00",
        }],
    }
    results = run_pipeline(data)
    required_keys = {
        "zone_id", "risk_score", "exposure_score", "vulnerability_score",
        "criticality_score", "priority_score", "priority_band", "priority_rank",
        "recommended_action", "explanation", "data_quality_flags", "affected_summary",
    }
    assert required_keys.issubset(set(results[0].keys()))
    # JSON-compatibility check: must serialize without error
    import json
    json.dumps(results)


def test_case_8_target_ai_json_structure_is_accepted():
    """
    Validates SCHEMA COMPATIBILITY ONLY against the exact example structure the
    AI/ML teammate provided (their example, marked NOT real prediction data --
    zone-level AI/GIS output is still under development). This test proves the
    module will accept that structure once real data arrives; it does NOT claim
    the AI team's zone-level prediction pipeline exists yet.
    """
    target_ai_record = {
        "zone_id": "EKH_001",
        "risk_score": 82.4,
        "risk_category": "Very High",
        "latitude": 25.55,
        "longitude": 91.88,
        "prediction_factors": {
            "slope_deg": 34.2, "elevation_m": 1420.5, "rainfall_mm_day": 9.8,
            "soil_clay_percent": 28.4, "soil_sand_percent": 41.7, "land_cover": 10,
        },
    }
    data = {
        "risk_data": [target_ai_record],
        "gis_data": [{"zone_id": "EKH_001", "population_exposed": 500}],
        "field_reports": [],
    }
    results = run_pipeline(data)
    assert len(results) == 1
    assert results[0]["zone_id"] == "EKH_001"
    assert results[0]["risk_score"] == 82.4  # extra fields (category/lat/lon/factors) safely ignored
    assert "no_risk_data_for_zone" not in results[0]["data_quality_flags"]


def test_case_9_normal_zone_with_ai_and_gis_data_end_to_end():
    """Item 1 from the required test list: a straightforward, fully-populated zone."""
    risk = [{"zone_id": "ZONE_10", "risk_score": 55, "risk_category": "Moderate"}]
    gis = [{
        "zone_id": "ZONE_10", "population_exposed": 1200, "villages": ["Zone10 Village"],
        "roads": [{"name": "Main Rd", "only_access": False, "alternate_route_exists": True}],
        "bridges": [], "schools": 1, "hospitals": 1, "other_infrastructure": [],
        "historical_landslide_count": 0,
    }]
    data = {"risk_data": risk, "gis_data": gis, "field_reports": []}
    results = run_pipeline(data)
    assert len(results) == 1
    r = results[0]
    assert r["zone_id"] == "ZONE_10"
    assert 0 <= r["priority_score"] <= 100
    assert r["priority_band"] in ("Critical", "High", "Medium", "Low")
    assert r["priority_rank"] == 1


# ---------------------------------------------------------------------------
# FINAL GIT-READINESS PASS: tests for confirmed real GIS reality (sparse data,
# missing topology, and Hasini's actual field shapes: OSM way-ID lists,
# name-list counts) -- items 4 through 8 and 15-20 from the final test list.
# ---------------------------------------------------------------------------

def test_sparse_gis_zone_all_zeros_produces_no_false_flags():
    """Item 5: a legitimately empty zone (the ~99% case: 22,615 total zones,
    only 204 have a village, 19 a hospital, 40 a school) must NOT be flagged
    as a data quality problem, and must not crash."""
    data = {
        "risk_data": [{"zone_id": "SPARSE_1", "risk_score": 20}],
        "gis_data": [{
            "zone_id": "SPARSE_1", "population_exposed": 0, "villages": [],
            "roads": [], "bridges": [], "schools": 0, "hospitals": 0,
            "other_infrastructure": [], "historical_landslide_count": 0,
        }],
        "field_reports": [],
    }
    results = run_pipeline(data)
    assert results[0]["data_quality_flags"] == []
    assert results[0]["priority_band"] == "Low"


def test_roads_bridges_as_plain_osm_way_ids_does_not_crash():
    """Item 6: Hasini's CONFIRMED real format -- roads/bridges as plain OSM
    way-ID scalars, with no only_access/alternate_route_exists topology data
    available. Must not crash, must flag accessibility as unassessed, and
    must NOT silently produce a falsely high vulnerability score."""
    data = {
        "risk_data": [{"zone_id": "OSM_1", "risk_score": 60}],
        "gis_data": [{
            "zone_id": "OSM_1", "population_exposed": 400,
            "roads": [488213, 488214, 488215],   # plain way-IDs, no dicts
            "bridges": [990011],
            "historical_landslide_count": 0,
        }],
        "field_reports": [],
    }
    results = run_pipeline(data)
    assert "accessibility_topology_unavailable" in results[0]["data_quality_flags"]
    # must default to the SAFE/LOW accessibility score, not an invented high one
    assert results[0]["vulnerability_score"] <= 30


def test_schools_hospitals_as_name_lists_does_not_crash():
    """Item 7: Hasini's CONFIRMED format -- schools/hospitals as name lists,
    not plain integers. Must be correctly counted, not crash."""
    data = {
        "risk_data": [{"zone_id": "NAMES_1", "risk_score": 50}],
        "gis_data": [{
            "zone_id": "NAMES_1", "population_exposed": 500,
            "schools": ["Govt High School"], "hospitals": ["Community Health Center"],
        }],
        "field_reports": [],
    }
    results = run_pipeline(data)
    r = results[0]
    assert r["criticality_score"] == 100  # hospital present -> max criticality weight
    assert "gis_count_field_unrecognized_format" not in r["data_quality_flags"]


def test_historical_landslide_count_present_and_absent():
    """Item 8: explicit 0 (legitimate, e.g. 13/14 matched) vs missing entirely
    (a genuine integration gap) must be distinguished, not conflated."""
    data_present = {
        "risk_data": [{"zone_id": "HIST_1", "risk_score": 40}],
        "gis_data": [{"zone_id": "HIST_1", "population_exposed": 100, "historical_landslide_count": 0}],
        "field_reports": [],
    }
    data_missing = {
        "risk_data": [{"zone_id": "HIST_2", "risk_score": 40}],
        "gis_data": [{"zone_id": "HIST_2", "population_exposed": 100}],  # key absent entirely
        "field_reports": [],
    }
    r_present = run_pipeline(data_present)[0]
    r_missing = run_pipeline(data_missing)[0]
    assert "historical_landslide_data_missing" not in r_present["data_quality_flags"]
    assert "historical_landslide_data_missing" in r_missing["data_quality_flags"]


def test_alternate_route_key_missing_is_flagged_not_assumed_silently():
    """only_access=True present, but alternate_route_exists key entirely
    absent -- must be flagged as an assumption, not presented as a fact."""
    data = {
        "risk_data": [{"zone_id": "ALT_1", "risk_score": 60}],
        "gis_data": [{
            "zone_id": "ALT_1", "population_exposed": 300,
            "roads": [{"name": "Rd", "only_access": True}],  # no alternate_route_exists key at all
        }],
        "field_reports": [],
    }
    results = run_pipeline(data)
    assert "alternate_route_unknown_assumed_worst_case" in results[0]["data_quality_flags"]


def test_zone_id_format_mismatch_between_ai_and_field_report_is_not_silently_matched():
    """Item 18: AI uses 'EKH_001'-style IDs, field reports use 'ZONE_05'-style
    IDs. M6 must NOT invent a conversion -- a report for a zone_id that
    doesn't exist in risk/GIS data must simply not match, safely."""
    data = {
        "risk_data": [{"zone_id": "EKH_001", "risk_score": 70}],
        "gis_data": [{"zone_id": "EKH_001", "population_exposed": 500}],
        "field_reports": [{"zone_id": "ZONE_05", "severity": "CRITICAL", "verified": True}],
    }
    results = run_pipeline(data)
    assert len(results) == 1  # the mismatched report does not create a phantom second zone
    assert results[0]["affected_summary"]["has_verified_field_report"] is False


def test_multiple_reports_for_same_zone_uses_highest_severity():
    """Item 13: multiple field reports for one zone -- most severe (verified) wins."""
    data = {
        "risk_data": [{"zone_id": "MULTI_1", "risk_score": 50}],
        "gis_data": [{"zone_id": "MULTI_1", "population_exposed": 300}],
        "field_reports": [
            {"zone_id": "MULTI_1", "severity": "LOW", "verified": True},
            {"zone_id": "MULTI_1", "severity": "CRITICAL", "verified": True},
            {"zone_id": "MULTI_1", "severity": "MEDIUM", "verified": False},
        ],
    }
    results = run_pipeline(data)
    assert "URGENT (ground-confirmed):" in results[0]["recommended_action"]


def test_final_output_is_fully_json_serializable_with_all_required_fields():
    """Items 19-20: exact required output contract, real JSON round-trip."""
    import json
    data = {
        "risk_data": [{"zone_id": "FINAL_1", "risk_score": 75, "risk_category": "High",
                        "latitude": 25.5, "longitude": 91.8, "prediction_factors": {"slope_deg": 30}}],
        "gis_data": [{"zone_id": "FINAL_1", "population_exposed": 900, "roads": [123],
                       "schools": ["School A"], "hospitals": [], "historical_landslide_count": 1}],
        "field_reports": [{"report_id": 1, "zone_id": "FINAL_1", "report_type": "LANDSLIDE",
                            "description": "x", "latitude": 25.5, "longitude": 91.8,
                            "severity": "HIGH", "verified": True, "status": "VERIFIED",
                            "created_at": "2026-09-05T10:30:00"}],
    }
    results = run_pipeline(data)
    serialized = json.dumps(results)   # must not raise
    reloaded = json.loads(serialized)
    required_keys = {
        "zone_id", "risk_score", "exposure_score", "vulnerability_score",
        "criticality_score", "priority_score", "priority_band", "priority_rank",
        "recommended_action", "explanation", "data_quality_flags", "affected_summary",
    }
    assert required_keys.issubset(set(reloaded[0].keys()))
