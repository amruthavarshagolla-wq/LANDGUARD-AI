import pandas as pd
import numpy as np
from pyproj import Transformer
from sklearn.metrics.pairwise import haversine_distances

ZONE_FILE = "data/processed/zone_training_data_upgraded.csv"
EARTHQUAKE_FILE = "data/raw/earthquakes/usgs_earthquakes.csv"
OUTPUT_FILE = "data/processed/zone_training_data_augmented.csv"

ZONE_WIDTH = 335
ZONE_HEIGHT = 370

# Load data
zones = pd.read_csv(ZONE_FILE)
eq = pd.read_csv(EARTHQUAKE_FILE)

# Remove earthquakes with missing coordinates
eq = eq.dropna(subset=["latitude", "longitude"])

# Reconstruct the same UTM grid used for the zones
points = pd.read_csv("data/processed/landslide_points_with_features.csv")

transformer_to_utm = Transformer.from_crs(
    "EPSG:4326", "EPSG:32646", always_xy=True
)

transformer_to_latlon = Transformer.from_crs(
    "EPSG:32646", "EPSG:4326", always_xy=True
)

x, y = transformer_to_utm.transform(
    points["longitude"].values,
    points["latitude"].values
)

x0 = x.min()
y0 = y.min()

# Get zone centroids
zone_lons = []
zone_lats = []

for zone_id in zones["zone_id"]:
    parts = zone_id.replace("EKH_", "").split("_")

    x_index = int(parts[0])
    y_index = int(parts[1])

    center_x = x0 + (x_index + 0.5) * ZONE_WIDTH
    center_y = y0 + (y_index + 0.5) * ZONE_HEIGHT

    lon, lat = transformer_to_latlon.transform(center_x, center_y)

    zone_lons.append(lon)
    zone_lats.append(lat)

# Convert coordinates to radians
zone_coords = np.radians(
    np.column_stack([zone_lats, zone_lons])
)

eq_coords = np.radians(
    eq[["latitude", "longitude"]].values
)

# Calculate distance to every earthquake
distances = haversine_distances(zone_coords, eq_coords) * 6371.0

# Nearest earthquake distance
nearest_distance = distances.min(axis=1)

zones["earthquake_distance_km"] = nearest_distance.round(3)

# Save
zones.to_csv(OUTPUT_FILE, index=False)

print()
print("===== EARTHQUAKE DISTANCE COMPLETE =====")
print(f"Earthquakes used: {len(eq)}")
print(f"Zones processed: {len(zones)}")
print()
print("Distance statistics:")
print(f"Minimum: {nearest_distance.min():.3f} km")
print(f"Maximum: {nearest_distance.max():.3f} km")
print(f"Mean: {nearest_distance.mean():.3f} km")
print()
print(f"Saved to: {OUTPUT_FILE}")