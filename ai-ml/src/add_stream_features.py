import geopandas as gpd
import pandas as pd
import numpy as np
from shapely.geometry import box
from shapely.ops import transform
import pyproj

# ============================================================
# FILES
# ============================================================

BOUNDARY_FILE = "data/raw/east_khasi_hills_boundary.geojson"

RIVER_FILE = (
    "data/raw/HydroRIVERS/HydroRIVERS_v10_as_shp/"
    "HydroRIVERS_v10_as.shp"
)

INPUT_FILE = "data/processed/zone_training_data_forestloss.csv"

OUTPUT_FILE = "data/processed/zone_training_data_streams.csv"

# Same zone size used in the project
ZONE_WIDTH_M = 335
ZONE_HEIGHT_M = 370


print("===== ADDING STREAM FEATURES =====")

# ============================================================
# LOAD BOUNDARY
# ============================================================

boundary = gpd.read_file(BOUNDARY_FILE)

print(f"Boundary CRS: {boundary.crs}")

# East Khasi Hills bbox
minx, miny, maxx, maxy = boundary.total_bounds

# Add a small buffer around the district
buffer_deg = 0.02

river_bbox = (
    minx - buffer_deg,
    miny - buffer_deg,
    maxx + buffer_deg,
    maxy + buffer_deg
)

print("East Khasi Hills bbox:")
print(river_bbox)

# ============================================================
# LOAD ONLY RIVERS INSIDE BBOX
# ============================================================

print()
print("Reading HydroRIVERS only inside East Khasi Hills...")

rivers = gpd.read_file(
    RIVER_FILE,
    bbox=river_bbox
)

print(f"Rivers loaded: {len(rivers)}")

# ============================================================
# LOAD TRAINING ZONES
# ============================================================

zones = pd.read_csv(INPUT_FILE)

points = pd.read_csv(
    "data/processed/landslide_points_with_features.csv"
)

# ============================================================
# RECREATE ZONE GRID
# ============================================================

points_gdf = gpd.GeoDataFrame(
    points,
    geometry=gpd.points_from_xy(
        points["longitude"],
        points["latitude"]
    ),
    crs="EPSG:4326"
)

# Convert to UTM Zone 46N
points_utm = points_gdf.to_crs("EPSG:32646")

origin_x = points_utm.geometry.x.min()
origin_y = points_utm.geometry.y.min()

zone_geometries = []

for _, row in zones.iterrows():

    zone_id = str(row["zone_id"])

    parts = zone_id.split("_")

    col = int(parts[1])
    row_num = int(parts[2])

    x0 = origin_x + col * ZONE_WIDTH_M
    y0 = origin_y + row_num * ZONE_HEIGHT_M

    polygon = box(
        x0,
        y0,
        x0 + ZONE_WIDTH_M,
        y0 + ZONE_HEIGHT_M
    )

    zone_geometries.append(polygon)

zones_gdf = gpd.GeoDataFrame(
    zones.copy(),
    geometry=zone_geometries,
    crs="EPSG:32646"
)

# ============================================================
# CONVERT RIVERS TO UTM
# ============================================================

print("Converting rivers to UTM...")

rivers_utm = rivers.to_crs("EPSG:32646")

# Remove empty geometries
rivers_utm = rivers_utm[
    rivers_utm.geometry.notna()
].copy()

rivers_utm = rivers_utm[
    ~rivers_utm.geometry.is_empty
].copy()

print(f"Usable rivers: {len(rivers_utm)}")

# ============================================================
# CALCULATE FEATURES
# ============================================================

distance_values = []
density_values = []

print()
print("Calculating stream features...")

for i, zone in zones_gdf.iterrows():

    polygon = zone.geometry
    centroid = polygon.centroid

    # Find rivers whose bounding boxes intersect zone
    possible = rivers_utm.sindex.query(
        polygon,
        predicate="intersects"
    )

    if len(possible) == 0:

        # No mapped river in this zone
        distance_m = np.nan
        drainage_density = 0.0

    else:

        nearby = rivers_utm.iloc[possible]

        # Distance from zone centre to nearest river
        distances = nearby.geometry.distance(centroid)

        distance_m = float(distances.min())

        # River length inside zone
        total_length_m = 0.0

        for geom in nearby.geometry:

            intersection = geom.intersection(polygon)

            if not intersection.is_empty:
                total_length_m += intersection.length

        # Zone area in km²
        area_km2 = polygon.area / 1_000_000

        # Drainage density = km of stream / km²
        drainage_density = (
            (total_length_m / 1000) / area_km2
        )

    distance_values.append(distance_m)
    density_values.append(drainage_density)

    if (i + 1) % 25 == 0:
        print(f"Processed {i + 1}/{len(zones_gdf)} zones")

# ============================================================
# FILL MISSING DISTANCES
# ============================================================

distance_series = pd.Series(distance_values)

# If no river was found, use the maximum observed distance
if distance_series.notna().any():
    fallback_distance = distance_series.max()
else:
    fallback_distance = 5000.0

distance_series = distance_series.fillna(fallback_distance)

# ============================================================
# SAVE
# ============================================================

zones["distance_to_stream_m"] = distance_series.values

zones["drainage_density"] = density_values

zones.to_csv(
    OUTPUT_FILE,
    index=False
)

# ============================================================
# SUMMARY
# ============================================================

print()
print("===== COMPLETE =====")

print(f"Zones processed: {len(zones)}")

print(
    f"Distance to stream min: "
    f"{zones['distance_to_stream_m'].min():.2f} m"
)

print(
    f"Distance to stream max: "
    f"{zones['distance_to_stream_m'].max():.2f} m"
)

print(
    f"Drainage density min: "
    f"{zones['drainage_density'].min():.4f} km/km²"
)

print(
    f"Drainage density max: "
    f"{zones['drainage_density'].max():.4f} km/km²"
)

print()
print(f"Saved to: {OUTPUT_FILE}")
