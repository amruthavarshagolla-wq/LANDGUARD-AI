import pandas as pd
import joblib
import numpy as np

MODEL_FILE = "models/landslide_model.joblib"
INPUT_FILE = "data/processed/zone_training_data.csv"
OUTPUT_FILE = "data/processed/zone_predictions.csv"

df = pd.read_csv(INPUT_FILE)

# Convert aspect to circular features
if "aspect_deg" in df.columns:
    radians = np.deg2rad(df["aspect_deg"])
    df["aspect_sin"] = np.sin(radians)
    df["aspect_cos"] = np.cos(radians)

features = [
    "elevation_m",
    "slope_deg",
    "rainfall_mm",
    "soil_clay_percent",
    "soil_sand_percent",
    "land_cover",
    "distance_to_road_m",
    "aspect_sin",
    "aspect_cos"
]

model = joblib.load(MODEL_FILE)

X = df[features]

probability = model.predict_proba(X)[:, 1]
df["risk_score"] = probability * 100

def category(score):
    if score < 25:
        return "LOW"
    elif score < 50:
        return "MODERATE"
    elif score < 75:
        return "HIGH"
    else:
        return "VERY_HIGH"

df["risk_category"] = df["risk_score"].apply(category)

output = df[["zone_id", "risk_score", "risk_category"]]

output.to_csv(OUTPUT_FILE, index=False)

print("===== ZONE PREDICTION COMPLETE =====")
print(f"Zones predicted: {len(output)}")
print(f"Saved: {OUTPUT_FILE}")
print()
print(output.head(10).to_string(index=False))
