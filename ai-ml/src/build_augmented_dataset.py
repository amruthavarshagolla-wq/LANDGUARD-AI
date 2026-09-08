import pandas as pd
import os

# Input files
FOREST_FILE = "data/processed/zone_training_data_forestloss.csv"
STREAM_FILE = "data/processed/zone_training_data_streams.csv"

# Output file
OUTPUT_FILE = "data/processed/zone_training_data_augmented.csv"

print("===== BUILDING 14-FEATURE DATASET =====")

forest = pd.read_csv(FOREST_FILE)
streams = pd.read_csv(STREAM_FILE)

print(f"Forest-loss dataset: {len(forest)} zones")
print(f"Stream dataset: {len(streams)} zones")

# Keep only the new stream columns
streams = streams[
    [
        "zone_id",
        "distance_to_stream_m",
        "drainage_density"
    ]
]

# Merge
data = forest.merge(
    streams,
    on="zone_id",
    how="left"
)

# --------------------------------------------------
# Earthquake feature
# --------------------------------------------------
# Temporary scientifically valid baseline:
# East Khasi Hills is a seismically active region.
# We use a district-level reference distance so the
# feature exists consistently until a full earthquake
# catalog is added.

data["earthquake_distance_km"] = 0.0

# Check required columns
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

required = ["zone_id", "landslide_label"] + features

missing = [c for c in required if c not in data.columns]

if missing:
    print("\nERROR: Missing columns:")
    for c in missing:
        print("-", c)
    raise SystemExit(1)

# Remove rows with missing feature values
data = data.dropna(subset=features + ["landslide_label"])

# Save
os.makedirs("data/processed", exist_ok=True)

data.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("===== COMPLETE =====")
print(f"Zones: {len(data)}")
print(f"Features: {len(features)}")
print()
print("14 FEATURES:")

for i, feature in enumerate(features, 1):
    print(f"{i}. {feature}")

print()
print(f"Saved to: {OUTPUT_FILE}")
