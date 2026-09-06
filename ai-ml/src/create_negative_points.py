import pandas as pd
import random
from shapely.geometry import Point, shape
import json

# Load boundary
with open("data/raw/east_khasi_hills_boundary.geojson", "r", encoding="utf-8") as f:
    boundary_data = json.load(f)

geometry = shape(boundary_data["features"][0]["geometry"])

# Load known landslide points
positive = pd.read_csv("data/raw/gsi_landslide_points.csv")

# Store their coordinates
existing_points = set(
    zip(positive["latitude"], positive["longitude"])
)

random.seed(42)

negative_points = []

while len(negative_points) < len(positive):

    latitude = random.uniform(25.05, 25.80)
    longitude = random.uniform(91.20, 92.10)

    point = Point(longitude, latitude)

    if not geometry.contains(point):
        continue

    # Keep distance from known landslide coordinates
    too_close = False

    for lat, lon in existing_points:
        distance = ((latitude - lat) ** 2 + (longitude - lon) ** 2) ** 0.5

        if distance < 0.005:
            too_close = True
            break

    if too_close:
        continue

    negative_points.append({
        "latitude": latitude,
        "longitude": longitude,
        "landslide_label": 0
    })

negative = pd.DataFrame(negative_points)

negative.to_csv(
    "data/raw/gsi_negative_points.csv",
    index=False
)

print("===== NEGATIVE POINTS CREATED =====")
print("Rows:", len(negative))
print("Saved to: data/raw/gsi_negative_points.csv")
print(negative.head())
