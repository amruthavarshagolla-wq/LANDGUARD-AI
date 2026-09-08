import pandas as pd
import numpy as np
import joblib

MODEL_FILE = "models/landslide_model.joblib"

# Load trained model
model = joblib.load(MODEL_FILE)

# Example input for one location/zone
input_data = pd.DataFrame([{
    "lat": 25.50,
    "lon": 91.90,
    "elevation_m": 1200,
    "slope_deg": 35,
    "aspect_deg": 180,
    "rainfall_mm": 3000,
    "soil_clay_percent": 25,
    "soil_sand_percent": 40,
    "land_cover": 10,
    "distance_to_road_m": 120,
    "built_up_percent": 2.5,
    "forest_loss_percent": 4.2,
    "distance_to_stream_m": 85,
    "drainage_density": 1.8,
    "earthquake_distance_km": 11.6
}])

# Convert aspect into circular features
radians = np.deg2rad(input_data["aspect_deg"])

input_data["aspect_sin"] = np.sin(radians)
input_data["aspect_cos"] = np.cos(radians)

# 14 model features
features = [
    "elevation_m",
    "slope_deg",
    "rainfall_mm",
    "soil_clay_percent",
    "soil_sand_percent",
    "land_cover",
    "distance_to_road_m",
    "aspect_sin",
    "aspect_cos",
    "built_up_percent",
    "forest_loss_percent",
    "distance_to_stream_m",
    "drainage_density",
    "earthquake_distance_km"
]

# Check features
missing = [f for f in features if f not in input_data.columns]

if missing:
    print("ERROR: Missing features:")
    print(missing)
    raise SystemExit

# Prepare model input
X = input_data[features]

# Prediction
prediction = model.predict(X)[0]

# Landslide probability
probability = model.predict_proba(X)[0][1]

# Risk score 0-100
risk_score = probability * 100


# Risk category
if risk_score < 25:
    risk_category = "LOW"
elif risk_score < 50:
    risk_category = "MODERATE"
elif risk_score < 75:
    risk_category = "HIGH"
else:
    risk_category = "VERY_HIGH"


print("===== LANDSLIDE RISK PREDICTION =====")
print(f"Prediction: {prediction}")
print(f"Landslide probability: {probability:.2f}")
print(f"Risk score: {risk_score:.2f}/100")
print(f"Risk category: {risk_category}")
print("Features used: 14")
