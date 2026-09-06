import json
import os
import pandas as pd
import geopandas as gpd
from shapely.geometry import LineString

print("===== CALCULATING DISTANCE TO ROADS =====")

ROAD_FILE = "data/raw/roads/east_khasi_hills_roads.json"
POINT_FILE = "data/processed/landslide_points_with_features.csv"

# Load Overpass JSON
with open(ROAD_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

# Convert road ways to LineStrings
roads = []

for element in data["elements"]:
    if element["type"] == "way" and "geometry" in element:
        coords = [
            (point["lon"], point["lat"])
            for point in element["geometry"]
        ]

        if len(coords) >= 2:
            roads.append(LineString(coords))

print("Roads found:", len(roads))

# Road GeoDataFrame
roads_gdf = gpd.GeoDataFrame(
    geometry=roads,
    crs="EPSG:4326"
)

# Load landslide points
df = pd.read_csv(POINT_FILE)

points_gdf = gpd.GeoDataFrame(
    df,
    geometry=gpd.points_from_xy(df["longitude"], df["latitude"]),
    crs="EPSG:4326"
)

# Project to UTM Zone 46N for metres
roads_gdf = roads_gdf.to_crs("EPSG:32646")
points_gdf = points_gdf.to_crs("EPSG:32646")

# Combine roads
road_geometry = roads_gdf.geometry.union_all()

# Calculate nearest road distance
points_gdf["distance_to_road_m"] = (
    points_gdf.geometry.distance(road_geometry)
)

# Remove geometry before saving
points_gdf = points_gdf.drop(columns="geometry")

points_gdf.to_csv(POINT_FILE, index=False)

print("===== COMPLETE =====")
print("Distance column added:")
print("distance_to_road_m")
print("Saved:", POINT_FILE)
print(
    "Distance range:",
    round(points_gdf["distance_to_road_m"].min(), 2),
    "to",
    round(points_gdf["distance_to_road_m"].max(), 2),
    "metres"
)

