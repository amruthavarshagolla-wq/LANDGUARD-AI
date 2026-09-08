"""
test_api.py
===========
Comprehensive automated test suite for LANDGUARD AI Backend.
Validates:
  1. GET /api/health
  2. GET /api/risk-current
  3. GET /api/villages
  4. GET /api/roads (with bbox and bridge parameters)
  5. GET /api/infrastructure (with type parameter)
  6. GET /api/landslide-inventory
  7. GET /api/field-reports
  8. POST /api/field-reports (multipart, PostGIS zone_id, verified=false, response format)
  9. GET /api/alerts
 10. GET /api/dashboard/summary
 11. GET /api/zones/{zone_id}/analysis
 12. POST /api/analyze
 13. AI/ML prediction thresholds and categories (LOW, MODERATE, HIGH, VERY_HIGH)
 14. M6 operational response pipeline integration
"""

import sys
import io
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend package is importable
BACKEND_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BACKEND_DIR.parent
if str(WORKSPACE_DIR) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from backend.main import app
from backend.ml_service import classify_risk_category, predict_risk
from backend.m6_service import execute_m6_pipeline

client = TestClient(app)


# ---------------------------------------------------------------------------
# 1. Health Check
# ---------------------------------------------------------------------------
def test_get_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "ai_model" in data
    assert "m6_pipeline" in data


# ---------------------------------------------------------------------------
# 2. Risk Current (GeoJSON FeatureCollection)
# ---------------------------------------------------------------------------
def test_get_risk_current():
    res = client.get("/api/risk-current")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert isinstance(data["features"], list)
    if len(data["features"]) > 0:
        first = data["features"][0]
        assert "geometry" in first
        assert "properties" in first
        props = first["properties"]
        assert "zone_id" in props
        assert "risk_score" in props
        assert "risk_category" in props
        assert props["risk_category"] in ["LOW", "MODERATE", "HIGH", "VERY_HIGH"]


def test_get_risk_current_with_filter():
    res = client.get("/api/risk-current?category=HIGH,VERY_HIGH")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    for f in data["features"]:
        assert f["properties"]["risk_category"] in ["HIGH", "VERY_HIGH"]


# ---------------------------------------------------------------------------
# 3. Villages (GeoJSON)
# ---------------------------------------------------------------------------
def test_get_villages():
    res = client.get("/api/villages")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0
    first = data["features"][0]
    assert first["geometry"]["type"] == "Point"
    assert "name" in first["properties"]
    assert "population" in first["properties"]


# ---------------------------------------------------------------------------
# 4. Roads (GeoJSON MultiLineString)
# ---------------------------------------------------------------------------
def test_get_roads_with_bbox():
    res = client.get("/api/roads?bbox=91.354,25.124,92.138,25.674")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    if len(data["features"]) > 0:
        first = data["features"][0]
        assert "road_class" in first["properties"]


def test_get_roads_bridge():
    res = client.get("/api/roads?bridge=T")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"


# ---------------------------------------------------------------------------
# 5. Infrastructure (Hospitals & Schools)
# ---------------------------------------------------------------------------
def test_get_infrastructure_hospital():
    res = client.get("/api/infrastructure?type=hospital")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    for f in data["features"]:
        assert f["properties"]["type"].lower() == "hospital"


def test_get_infrastructure_school():
    res = client.get("/api/infrastructure?type=school")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    for f in data["features"]:
        assert f["properties"]["type"].lower() == "school"


# ---------------------------------------------------------------------------
# 6. Landslide Inventory (Historical ground truth)
# ---------------------------------------------------------------------------
def test_get_landslide_inventory():
    res = client.get("/api/landslide-inventory")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0
    first = data["features"][0]
    assert "verification_status" in first["properties"]


# ---------------------------------------------------------------------------
# 7 & 8. Field Reports (GET & POST multipart)
# ---------------------------------------------------------------------------
def test_get_field_reports():
    res = client.get("/api/field-reports")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "data" in data


def test_post_field_report_multipart():
    """
    Validates:
      - Multipart form data
      - Zone resolution from coordinates
      - verified defaults to FALSE and is NOT inferred from severity
      - Response format: {success: true, message: '...', report: {...}}
    """
    fake_image = io.BytesIO(b"dummy image data for landslide crack")
    files = {"photo": ("test_crack.jpg", fake_image, "image/jpeg")}
    payload = {
        "report_type": "CRACK",
        "description": "Observed 5cm wide tension crack along roadside slope.",
        "latitude": "25.5012",
        "longitude": "91.8923",
        "severity": "CRITICAL",
    }

    res = client.post("/api/field-reports", data=payload, files=files)
    assert res.status_code == 200
    body = res.json()

    assert body["success"] is True
    assert "message" in body
    assert "report" in body
    rep = body["report"]

    assert rep["report_type"] == "CRACK"
    assert rep["severity"] == "CRITICAL"
    assert rep["verified"] is False  # Must default to False, never True
    assert rep["zone_id"] is not None
    assert rep["photo_url"] is not None
    assert "uploads/" in rep["photo_url"]


# ---------------------------------------------------------------------------
# 9. Alerts
# ---------------------------------------------------------------------------
def test_get_alerts():
    res = client.get("/api/alerts")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) > 0


# ---------------------------------------------------------------------------
# 10. Dashboard Summary
# ---------------------------------------------------------------------------
def test_get_dashboard_summary():
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    summary = data["data"]
    assert summary["monitored_areas"] > 0
    assert summary["active_alerts"] >= 0
    assert summary["critical_zones"] >= 0
    assert summary["population_exposed"] >= 0


# ---------------------------------------------------------------------------
# 11. Zone Analysis (Features + AI + M6)
# ---------------------------------------------------------------------------
def test_get_zone_analysis():
    res = client.get("/api/zones/EKH_08421/analysis")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["zone_id"] == "EKH_08421"
    assert "ai_prediction" in data
    assert "gis_exposure" in data
    assert "operational_response" in data
    op = data["operational_response"]
    assert "priority_score" in op
    assert "priority_band" in op
    assert "recommended_action" in op


# ---------------------------------------------------------------------------
# 12. POST /api/analyze
# ---------------------------------------------------------------------------
def test_post_analyze():
    payload = {
        "zone_id": "EKH_08421",
        "rainfall_mm": 250.0,
        "slope_deg": 35.0,
        "elevation_m": 1300.0,
    }
    res = client.post("/api/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "prediction" in data
    assert "operational_impact" in data


# ---------------------------------------------------------------------------
# 13. AI Model Thresholds and Category Verification
# ---------------------------------------------------------------------------
def test_risk_category_thresholds():
    assert classify_risk_category(0.0) == "LOW"
    assert classify_risk_category(24.99) == "LOW"
    assert classify_risk_category(25.0) == "MODERATE"
    assert classify_risk_category(49.99) == "MODERATE"
    assert classify_risk_category(50.0) == "HIGH"
    assert classify_risk_category(74.99) == "HIGH"
    assert classify_risk_category(75.0) == "VERY_HIGH"
    assert classify_risk_category(100.0) == "VERY_HIGH"


def test_ai_model_inference():
    features = {
        "elevation_m": 1200.0,
        "slope_deg": 35.0,
        "aspect_deg": 180.0,
        "rainfall_mm": 300.0,
        "soil_clay_percent": 25.0,
        "soil_sand_percent": 40.0,
        "land_cover": 10,
        "distance_to_road_m": 50.0,
    }
    result = predict_risk(features)
    assert 0.0 <= result["risk_score"] <= 100.0
    assert result["risk_category"] in ["LOW", "MODERATE", "HIGH", "VERY_HIGH"]
    assert result["prediction"] in [0, 1]


# ---------------------------------------------------------------------------
# 14. M6 Pipeline Integration Verification
# ---------------------------------------------------------------------------
def test_m6_pipeline_integration():
    risk = [{"zone_id": "EKH_08421", "risk_score": 85.0}]
    gis = [{
        "zone_id": "EKH_08421",
        "population_exposed": 1200,
        "villages": ["Sohra Village"],
        "roads": [{"name": "Main Highway", "only_access": True, "alternate_route_exists": False}],
        "bridges": [],
        "schools": 1,
        "hospitals": 1,
    }]
    reports = [{
        "zone_id": "EKH_08421",
        "severity": "CRITICAL",
        "verified": True,
        "description": "Severe road displacement",
    }]

    out = execute_m6_pipeline(risk, gis, reports)
    assert len(out) == 1
    item = out[0]
    assert item["zone_id"] == "EKH_08421"
    assert 0 <= item["priority_score"] <= 100
    assert item["priority_band"] in ["Low", "Medium", "High", "Critical"]
    assert "recommended_action" in item
    assert "explanation" in item
