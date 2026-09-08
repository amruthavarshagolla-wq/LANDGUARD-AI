import pandas as pd
import numpy as np
import joblib

MODEL_FILE = "model/landslide_model.joblib"
INPUT_FILE = "data/zone_training_data_augmented.csv"
OUTPUT_FILE = "data/zone_predictions_augmented.csv"


# Load upgraded dataset
df = pd.read_csv(INPUT_FILE)


# Convert aspect to circular features if needed
if "aspect_deg" in df.columns:
    radians = np.deg2rad(df["aspect_deg"])
    df["aspect_sin"] = np.sin(radians)
    df["aspect_cos"] = np.cos(radians)


# 14 MODEL FEATURES
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


# Check that all features exist
missing = [f for f in features if f not in df.columns]

if missing:
    print("ERROR: Missing features:")
    print(missing)
    raise SystemExit


# Load trained 14-feature model
model = joblib.load(MODEL_FILE)

X = df[features]


# Predict probability
probability = model.predict_proba(X)[:, 1]

df["risk_score"] = probability * 100


# Risk categories
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


# Keep only final zone prediction fields
output = df[
    [
        "zone_id",
        "risk_score",
        "risk_category"
    ]
].copy()


# Round score
output["risk_score"] = output["risk_score"].round(2)


# Save predictions
output.to_csv(OUTPUT_FILE, index=False)


print("===== ZONE PREDICTION COMPLETE =====")
print(f"Zones: {len(output)}")
print("Features used: 14")
print()
print(output.head(10).to_string(index=False))
print()
print(f"Saved to: {OUTPUT_FILE}")
