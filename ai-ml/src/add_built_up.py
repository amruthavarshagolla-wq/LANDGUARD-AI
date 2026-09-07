import os
import numpy as np
import pandas as pd
import rasterio
from rasterio.mask import mask
from shapely.geometry import box
from shapely.ops import transform
from pyproj import Transformer


POINTS_FILE = "data/processed/landslide_points_with_features.csv"
ZONE_FILE = "data/processed/zone_training_data.csv"
OUTPUT_FILE = "data/processed/zone_training_data_builtup.csv"

LANDCOVER_FILE = (
    "data/raw/landcover/"
    "ESA_WorldCover_10m_2021_v200_N24E090_Map.tif"
)

ZONE_WIDTH_M = 335
ZONE_HEIGHT_M = 370

# UTM Zone 46N
WGS84_TO_UTM = Transformer.from_crs(
    "EPSG:4326",
    "EPSG:32646",
    always_xy=True
)

print("===== ADDING BUILT-UP PERCENT =====")

# --------------------------------------------------
# Load existing data
# --------------------------------------------------

points = pd.read_csv(POINTS_FILE)
zones = pd.read_csv(ZONE_FILE)

print(f"Points: {len(points)}")
print(f"Zones: {len(zones)}")


# --------------------------------------------------
# Convert point coordinates to metres
# --------------------------------------------------

points["x_m"], points["y_m"] = WGS84_TO_UTM.transform(
    points["longitude"].values,
    points["latitude"].values
)


# --------------------------------------------------
# Recreate the same grid used by create_zones.py
# --------------------------------------------------

origin_x = points["x_m"].min()
origin_y = points["y_m"].min()

points["grid_x"] = np.floor(
    (points["x_m"] - origin_x) / ZONE_WIDTH_M
).astype(int)

points["grid_y"] = np.floor(
    (points["y_m"] - origin_y) / ZONE_HEIGHT_M
).astype(int)

points["zone_id"] = (
    "EKH_"
    + points["grid_x"].astype(str).str.zfill(5)
    + "_"
    + points["grid_y"].astype(str).str.zfill(5)
)


# --------------------------------------------------
# Open WorldCover raster
# --------------------------------------------------

with rasterio.open(LANDCOVER_FILE) as src:

    print(f"Raster CRS: {src.crs}")
    print(f"Raster size: {src.width} x {src.height}")

    # Transform UTM zone polygons into raster CRS
    utm_to_raster = Transformer.from_crs(
        "EPSG:32646",
        src.crs,
        always_xy=True
    )

    builtup_values = []

    for zone_id in zones["zone_id"]:

        parts = zone_id.split("_")

        grid_x = int(parts[1])
        grid_y = int(parts[2])

        min_x = origin_x + grid_x * ZONE_WIDTH_M
        max_x = min_x + ZONE_WIDTH_M

        min_y = origin_y + grid_y * ZONE_HEIGHT_M
        max_y = min_y + ZONE_HEIGHT_M

        # Zone polygon in UTM
        zone_polygon = box(
            min_x,
            min_y,
            max_x,
            max_y
        )

        # Convert polygon to raster CRS
        zone_polygon_raster = transform(
            utm_to_raster.transform,
            zone_polygon
        )

        try:

            data, _ = mask(
                src,
                [zone_polygon_raster],
                crop=True
            )

            values = data[0]

            # Ignore NoData
            if src.nodata is not None:
                valid = values[values != src.nodata]
            else:
                valid = values.flatten()

            if len(valid) == 0:
                built_up_percent = np.nan
            else:
                # WorldCover class 50 = Built-up
                built_up_pixels = np.sum(valid == 50)

                built_up_percent = (
                    built_up_pixels / len(valid)
                ) * 100

        except Exception:
            built_up_percent = np.nan

        builtup_values.append(built_up_percent)


# --------------------------------------------------
# Add new feature
# --------------------------------------------------

zones["built_up_percent"] = builtup_values


# --------------------------------------------------
# Save
# --------------------------------------------------

zones.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("===== COMPLETE =====")
print(f"Zones processed: {len(zones)}")
print(
    f"Built-up min: "
    f"{zones['built_up_percent'].min():.2f}%"
)
print(
    f"Built-up max: "
    f"{zones['built_up_percent'].max():.2f}%"
)
print(
    f"Built-up mean: "
    f"{zones['built_up_percent'].mean():.2f}%"
)

print()
print(f"Saved to: {OUTPUT_FILE}")
