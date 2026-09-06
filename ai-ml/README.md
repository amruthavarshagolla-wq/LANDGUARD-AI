# LANDGUARD AI/ML

AI/ML module for landslide risk prediction in East Khasi Hills, Meghalaya.

## Model Features

- elevation_m
- slope_deg
- rainfall_mm
- soil_clay_percent
- soil_sand_percent
- land_cover
- distance_to_road_m
- aspect_sin
- aspect_cos

## Model

Random Forest classifier saved as:

model/landslide_model.joblib

## API

Endpoint:

POST /predict

The API accepts zone environmental features and returns:

- zone_id
- risk_score
- risk_category

Risk categories:

- LOW: 0–24.99
- MODERATE: 25–49.99
- HIGH: 50–74.99
- VERY_HIGH: 75–100

## Run

Install dependencies:

pip install -r requirements.txt

Start API:

python src/api.py
