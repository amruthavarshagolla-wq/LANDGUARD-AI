import pandas as pd
import numpy as np
import rasterio
from rasterio.mask import mask
from shapely.geometry import box
from pyproj import Transformer

# ============================================================
# PATHS
# ============================================================

POINTS_FILE = "data/processed/landslide_points_with_features.csv"
ZONE_FILE = "data/processed/zone_training_data_builtup.csv"

FOREST_LOSS_RASTER = (
    "data/raw/forest_loss/lossyear_30N_090E.tif"
)

OUTPUT_FILE = (
    "data/processed/zone_training_data_forestloss.csv"
)

# Same zone dimensions used previously
ZONE_WIDTH_M = 335
ZONE_HEIGHT_M = 370

# ============================================================
# LOAD DATA
# ============================================================

print("===== ADDING FOREST LOSS PERCENT =====")

points = pd.read_csv(POINTS_FILE)
zones = pd.read_csv(ZONE_FILE)

print(f"Points: {len(points)}")
print(f"Zones: {len(zones)}")

# ============================================================
# CONVERT POINTS TO UTM
# ============================================================

to_utm = Transformer.from_crs(
    "EPSG:4326",
    "EPSG:32646",
    always_xy=True
)

x, y = to_utm.transform(
    points["longitude"].values,
    points["latitude"].values
)

points["x_utm"] = x
points["y_utm"] = y

# Same origin used by create_zones.py
origin_x = points["x_utm"].min()
origin_y = points["y_utm"].min()

# ============================================================
# OPEN FOREST LOSS RASTER
# ============================================================

with rasterio.open(FOREST_LOSS_RASTER) as src:

    print(f"Raster CRS: {src.crs}")
    print(f"Raster size: {src.width} x {src.height}")

    # Transform UTM zone polygons to raster CRS
    to_raster = Transformer.from_crs(
        "EPSG:32646",
        src.crs,
        always_xy=True
    )

    forest_loss_values = []

    # ========================================================
    # PROCESS EACH ZONE
    # ========================================================

    for i, row in zones.iterrows():

        zone_id = row["zone_id"]

        # Example:
        # EKH_00000_00019
        parts = zone_id.split("_")

        grid_x = int(parts[1])
        grid_y = int(parts[2])

        # Recreate the exact zone boundaries
        min_x = origin_x + grid_x * ZONE_WIDTH_M
        max_x = min_x + ZONE_WIDTH_M

        min_y = origin_y + grid_y * ZONE_HEIGHT_M
        max_y = min_y + ZONE_HEIGHT_M

        # Zone polygon in UTM
        zone_polygon_utm = box(
            min_x,
            min_y,
            max_x,
            max_y
        )

        # Transform polygon to raster CRS
        coords = [
            to_raster.transform(px, py)
            for px, py in zone_polygon_utm.exterior.coords
        ]

        zone_polygon_raster = {
            "type": "Polygon",
            "coordinates": [coords]
        }

        try:
            out_image, _ = mask(
                src,
                [zone_polygon_raster],
                crop=True
            )

            values = out_image[0]

            # Remove NoData pixels
            if src.nodata is not None:
                valid = values[values != src.nodata]
            else:
                valid = values.flatten()

            if len(valid) == 0:
                forest_loss_percent = 0.0
            else:
                # Hansen lossyear:
                # 0 = no forest loss
                # >0 = forest loss occurred
                loss_pixels = np.sum(valid > 0)

                forest_loss_percent = (
                    loss_pixels / len(valid)
                ) * 100

        except Exception:
            forest_loss_percent = 0.0

        forest_loss_values.append(forest_loss_percent)

        if (i + 1) % 25 == 0:
            print(f"Processed {i + 1}/{len(zones)} zones")

# ============================================================
# ADD FEATURE
# ============================================================

zones["forest_loss_percent"] = forest_loss_values

# ============================================================
# SAVE
# ============================================================

zones.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("===== COMPLETE =====")
print(f"Zones processed: {len(zones)}")
print(
    f"Forest loss min: "
    f"{zones['forest_loss_percent'].min():.2f}%"
)
print(
    f"Forest loss max: "
    f"{zones['forest_loss_percent'].max():.2f}%"
)
print(
    f"Forest loss mean: "
    f"{zones['forest_loss_percent'].mean():.2f}%"
)

print()
print(f"Saved to: {OUTPUT_FILE}")
