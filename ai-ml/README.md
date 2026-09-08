# LANDGUARD AI/ML

AI/ML module for landslide risk prediction in East Khasi Hills, Meghalaya.

## Model Features

The final model uses 14 environmental and terrain features:

- elevation_m
- slope_deg
- rainfall_mm
- soil_clay_percent
- soil_sand_percent
- land_cover
- distance_to_road_m
- aspect_sin
- aspect_cos
- built_up_percent
- forest_loss_percent
- distance_to_stream_m
- drainage_density
- earthquake_distance_km

## Model

Random Forest classifier saved as:

model/landslide_model.joblib

The model predicts a risk score from 0 to 100.

Risk categories:

- LOW: 0–24.99
- MODERATE: 25–49.99
- HIGH: 50–74.99
- VERY_HIGH: 75–100

## Prediction Unit

Predictions are made for GIS zones of approximately:

335 m × 370 m

Each prediction is identified using the existing `zone_id`.

## API

Endpoint:

POST /predict

The API accepts zone environmental features and returns:

- zone_id
- risk_score
- risk_category

Example input:

```json
{
  "zone_id": "EKH_00019",
  "elevation_m": 1450,
  "slope_deg": 32.5,
  "aspect_deg": 180,
  "rainfall_mm": 9.5,
  "soil_clay_percent": 28,
  "soil_sand_percent": 42,
  "land_cover": 10,
  "distance_to_road_m": 120,
  "built_up_percent": 2.5,
  "forest_loss_percent": 4.2,
  "distance_to_stream_m": 85,
  "drainage_density": 1.8,
  "earthquake_distance_km": 11.6
}
