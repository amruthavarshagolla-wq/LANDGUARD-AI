import pandas as pd
import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling, transform

DEM_FILE = "data/raw/dem/east_khasi_hills_dem.tif"
INPUT_FILE = "data/processed/landslide_points_with_features.csv"
OUTPUT_FILE = "data/processed/landslide_points_with_features.csv"
ASPECT_FILE = "data/raw/dem/east_khasi_hills_aspect.tif"

print("===== CALCULATING ASPECT =====")

# Open DEM
with rasterio.open(DEM_FILE) as src:

    # Reproject DEM to UTM 46N
    dst_crs = "EPSG:32646"

    dst_transform, width, height = calculate_default_transform(
        src.crs,
        dst_crs,
        src.width,
        src.height,
        *src.bounds
    )

    dem_utm = np.empty(
        (height, width),
        dtype=np.float32
    )

    reproject(
        source=rasterio.band(src, 1),
        destination=dem_utm,
        src_transform=src.transform,
        src_crs=src.crs,
        dst_transform=dst_transform,
        dst_crs=dst_crs,
        resampling=Resampling.bilinear
    )

    pixel_x = dst_transform.a
    pixel_y = abs(dst_transform.e)

    # Calculate elevation gradients
    dz_dy, dz_dx = np.gradient(
        dem_utm,
        pixel_y,
        pixel_x
    )

    # Calculate aspect
    aspect = np.degrees(
        np.arctan2(
            dz_dx,
            -dz_dy
        )
    )

    # Convert to 0–360 degrees
    aspect = (aspect + 360) % 360

    # Save aspect raster
    profile = src.profile.copy()

    profile.update(
        crs=dst_crs,
        transform=dst_transform,
        width=width,
        height=height,
        dtype="float32",
        count=1
    )

    with rasterio.open(
        ASPECT_FILE,
        "w",
        **profile
    ) as dst:

        dst.write(
            aspect.astype("float32"),
            1
        )

print("Aspect raster saved:")
print(ASPECT_FILE)


# Load our 200 points
df = pd.read_csv(INPUT_FILE)

# Convert point coordinates from WGS84 to UTM
x, y = transform(
    "EPSG:4326",
    "EPSG:32646",
    df["longitude"].tolist(),
    df["latitude"].tolist()
)

coordinates = list(zip(x, y))

# Extract aspect values
with rasterio.open(ASPECT_FILE) as aspect_raster:

    aspect_values = []

    for value in aspect_raster.sample(coordinates):
        aspect_values.append(float(value[0]))

# Add aspect to dataset
df["aspect_deg"] = aspect_values

# Save updated dataset
df.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("===== ASPECT EXTRACTION COMPLETE =====")
print("Rows:", len(df))
print(
    "Aspect range:",
    round(df["aspect_deg"].min(), 2),
    "to",
    round(df["aspect_deg"].max(), 2),
    "degrees"
)

print()
print("Saved to:")
print(OUTPUT_FILE)

