"""
ml_service.py
=============
AI/ML Landslide Risk Prediction Service for LANDGUARD AI.
Integrates existing landslide_model.joblib.

Risk categories strictly match requirements:
  LOW:       0 – 24.99
  MODERATE: 25 – 49.99
  HIGH:     50 – 74.99
  VERY_HIGH: 75 – 100
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional
import joblib
import numpy as np
import pandas as pd

# Path to the trained AI model
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR.parent / "ai-ml" / "model" / "landslide_model.joblib"

_model = None
_model_load_error = None


def load_model():
    """Loads the pre-trained landslide joblib model."""
    global _model, _model_load_error
    if _model is not None:
        return _model

    if not MODEL_PATH.exists():
        _model_load_error = f"Model file not found at {MODEL_PATH}"
        return None

    try:
        _model = joblib.load(MODEL_PATH)
        return _model
    except Exception as e:
        _model_load_error = str(e)
        return None


def get_model_status() -> Dict[str, Any]:
    """Returns the current loading and health status of the AI model."""
    model = load_model()
    return {
        "status": "LOADED" if model is not None else "ERROR",
        "model_file": str(MODEL_PATH),
        "error": _model_load_error,
        "features": [
            "elevation_m",
            "slope_deg",
            "rainfall_mm",
            "soil_clay_percent",
            "soil_sand_percent",
            "distance_to_road_m",
            "aspect_sin",
            "aspect_cos",
            "land_cover",
        ],
    }


def classify_risk_category(score: float) -> str:
    """
    Assigns risk category according to exact project specifications:
      LOW:       0 – 24.99
      MODERATE: 25 – 49.99
      HIGH:     50 – 74.99
      VERY_HIGH: 75 – 100
    """
    if score < 25.0:
        return "LOW"
    elif score < 50.0:
        return "MODERATE"
    elif score < 75.0:
        return "HIGH"
    else:
        return "VERY_HIGH"


def predict_risk(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Runs model inference on single or batch feature input.
    Input dict expected to have:
      - elevation_m (float)
      - slope_deg (float)
      - aspect_deg (float)
      - rainfall_mm (float)
      - soil_clay_percent (float)
      - soil_sand_percent (float)
      - land_cover (int or str)
      - distance_to_road_m (float)
    """
    model = load_model()
    if model is None:
        raise RuntimeError(f"AI Model is unavailable: {_model_load_error}")

    # Extract & convert values with sensible defaults if missing
    elevation_m = float(features.get("elevation_m", 1200.0))
    slope_deg = float(features.get("slope_deg", 25.0))
    aspect_deg = float(features.get("aspect_deg", 180.0))
    rainfall_mm = float(features.get("rainfall_mm", 150.0))
    soil_clay_percent = float(features.get("soil_clay_percent", 25.0))
    soil_sand_percent = float(features.get("soil_sand_percent", 40.0))
    distance_to_road_m = float(features.get("distance_to_road_m", 150.0))

    raw_land_cover = features.get("land_cover", 10)
    try:
        land_cover = int(raw_land_cover)
    except (ValueError, TypeError):
        land_cover = 10  # default land cover code

    aspect_rad = np.deg2rad(aspect_deg)
    aspect_sin = float(np.sin(aspect_rad))
    aspect_cos = float(np.cos(aspect_rad))

    df = pd.DataFrame(
        [
            {
                "elevation_m": elevation_m,
                "slope_deg": slope_deg,
                "aspect_sin": aspect_sin,
                "aspect_cos": aspect_cos,
                "rainfall_mm": rainfall_mm,
                "soil_clay_percent": soil_clay_percent,
                "soil_sand_percent": soil_sand_percent,
                "land_cover": land_cover,
                "distance_to_road_m": distance_to_road_m,
            }
        ]
    )

    try:
        prediction = int(model.predict(df)[0])
        probability = float(model.predict_proba(df)[0][1])
    except Exception as e:
        # Some models expect specific column ordering
        # Ensure column ordering matches training format
        cols = [
            "elevation_m",
            "slope_deg",
            "aspect_sin",
            "aspect_cos",
            "rainfall_mm",
            "soil_clay_percent",
            "soil_sand_percent",
            "land_cover",
            "distance_to_road_m",
        ]
        df = df[cols]
        prediction = int(model.predict(df)[0])
        probability = float(model.predict_proba(df)[0][1])

    risk_score = round(probability * 100.0, 2)
    risk_cat = classify_risk_category(risk_score)

    return {
        "prediction": prediction,
        "landslide_probability": round(probability, 4),
        "risk_score": risk_score,
        "risk_category": risk_cat,
        "features_used": {
            "elevation_m": elevation_m,
            "slope_deg": slope_deg,
            "aspect_deg": aspect_deg,
            "rainfall_mm": rainfall_mm,
            "soil_clay_percent": soil_clay_percent,
            "soil_sand_percent": soil_sand_percent,
            "land_cover": land_cover,
            "distance_to_road_m": distance_to_road_m,
        },
    }
