import os
import numpy as np
import pandas as pd
from pyproj import Transformer


INPUT_FILE = "data/processed/landslide_points_with_features.csv"
OUTPUT_FILE = "data/processed/zone_training_data.csv"

# Your existing GIS zone size
ZONE_WIDTH_M = 335
ZONE_HEIGHT_M = 370


print("===== CREATING GIS ZONES =====")

# Load processed point data
df = pd.read_csv(INPUT_FILE)

print(f"Input points: {len(df)}")


# Convert latitude/longitude to metres
# East Khasi Hills is in UTM Zone 46N
transformer = Transformer.from_crs(
    "EPSG:4326",
    "EPSG:32646",
    always_xy=True
)

df["x_m"], df["y_m"] = transformer.transform(
    df["longitude"].values,
    df["latitude"].values
)


# Grid origin
origin_x = df["x_m"].min()
origin_y = df["y_m"].min()


# Assign every point to a 335m x 370m grid cell
df["grid_x"] = np.floor(
    (df["x_m"] - origin_x) / ZONE_WIDTH_M
).astype(int)

df["grid_y"] = np.floor(
    (df["y_m"] - origin_y) / ZONE_HEIGHT_M
).astype(int)


# Create zone ID
df["zone_id"] = (
    "EKH_"
    + df["grid_x"].astype(str).str.zfill(5)
    + "_"
    + df["grid_y"].astype(str).str.zfill(5)
)


# Circular mean for aspect
def circular_mean_deg(values):
    values = np.asarray(values)

    radians = np.deg2rad(values)

    sin_mean = np.mean(np.sin(radians))
    cos_mean = np.mean(np.cos(radians))

    angle = np.rad2deg(
        np.arctan2(sin_mean, cos_mean)
    )

    return angle % 360


# Aggregate continuous and categorical features
zone_df = df.groupby("zone_id").agg({

    "elevation_m": "mean",
    "slope_deg": "mean",
    "rainfall_mm": "mean",
    "soil_clay_percent": "mean",
    "soil_sand_percent": "mean",
    "distance_to_road_m": "mean",

    # Most common land-cover class
    "land_cover": lambda x: x.mode().iloc[0],

    # A zone is positive if it contains at least
    # one historical landslide sample
    "landslide_label": "max",

}).reset_index()


# Calculate circular mean aspect
aspect_df = (
    df.groupby("zone_id")["aspect_deg"]
    .apply(circular_mean_deg)
    .reset_index()
)

zone_df = zone_df.merge(
    aspect_df,
    on="zone_id",
    how="left"
)


# Convert aspect to sine/cosine
zone_df["aspect_sin"] = np.sin(
    np.deg2rad(zone_df["aspect_deg"])
)

zone_df["aspect_cos"] = np.cos(
    np.deg2rad(zone_df["aspect_deg"])
)


# Final column order
zone_df = zone_df[
    [
        "zone_id",
        "elevation_m",
        "slope_deg",
        "aspect_deg",
        "aspect_sin",
        "aspect_cos",
        "rainfall_mm",
        "soil_clay_percent",
        "soil_sand_percent",
        "land_cover",
        "distance_to_road_m",
        "landslide_label"
    ]
]


# Make sure output folder exists
os.makedirs(
    "data/processed",
    exist_ok=True
)


# Save
zone_df.to_csv(
    OUTPUT_FILE,
    index=False
)


print()
print("===== ZONE CREATION COMPLETE =====")
print(f"Original points : {len(df)}")
print(f"Unique zones    : {len(zone_df)}")
print(
    f"Zone size       : "
    f"{ZONE_WIDTH_M}m x {ZONE_HEIGHT_M}m"
)
print(
    f"Positive zones  : "
    f"{(zone_df['landslide_label'] == 1).sum()}"
)
print(
    f"Negative zones  : "
    f"{(zone_df['landslide_label'] == 0).sum()}"
)
print(f"Saved           : {OUTPUT_FILE}")

