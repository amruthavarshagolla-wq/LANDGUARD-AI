
from pathlib import Path

import joblib
import pandas as pd


# Resolve paths relative to this script, regardless of terminal location.
AI_ML_DIR = Path(__file__).resolve().parent.parent

MODEL_FILE = AI_ML_DIR / "model" / "landslide_model.joblib"
INPUT_FILE = AI_ML_DIR / "data" / "east_khasi_hills_all_14_features.csv"
OUTPUT_FILE = AI_ML_DIR / "data" / "east_khasi_hills_zone_predictions.csv"

FEATURES = [
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
    "earthquake_distance_km",
]


def category(score):
    if score < 25:
        return "LOW"
    elif score < 50:
        return "MODERATE"
    elif score < 75:
        return "HIGH"
    else:
        return "VERY_HIGH"


def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Input dataset not found: {INPUT_FILE}")

    if not MODEL_FILE.exists():
        raise FileNotFoundError(f"Trained model not found: {MODEL_FILE}")

    df = pd.read_csv(INPUT_FILE)

    # Check that the GIS zone IDs and all model features are present.
    required = ["zone_id"] + FEATURES
    missing = [col for col in required if col not in df.columns]

    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    if df["zone_id"].isna().any():
        raise ValueError("Some zone_id values are missing.")

    if df["zone_id"].duplicated().any():
        raise ValueError("Duplicate zone_id values found.")

    if df[FEATURES].isna().any().any():
        missing_counts = df[FEATURES].isna().sum()
        missing_counts = missing_counts[missing_counts > 0]
        raise ValueError(
            "Missing feature values:\n" + missing_counts.to_string()
        )

    # Keep GIS-provided IDs and their original row order.
    zone_ids = df["zone_id"].copy()
    X = df[FEATURES]

    print(f"Loaded zones: {len(df)}")
    print("Loading trained model...")

    model = joblib.load(MODEL_FILE)

    # Use the model's positive-class probability.
    probabilities = model.predict_proba(X)[:, 1]
    risk_scores = probabilities * 100

    output = pd.DataFrame({
        "zone_id": zone_ids,
        "risk_score": risk_scores.round(2),
    })

    output["risk_category"] = output["risk_score"].apply(category)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    output.to_csv(OUTPUT_FILE, index=False)

    print("\n===== ZONE PREDICTION COMPLETE =====")
    print(f"Zones predicted: {len(output)}")
    print(f"Features used: {len(FEATURES)}")
    print("\nRisk category counts:")
    print(output["risk_category"].value_counts().to_string())
    print("\nFirst 10 predictions:")
    print(output.head(10).to_string(index=False))
    print(f"\nSaved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()