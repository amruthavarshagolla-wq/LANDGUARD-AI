import rasterio
import numpy as np
from rasterio.warp import calculate_default_transform, reproject, Resampling

input_dem = "data/raw/dem/east_khasi_hills_dem.tif"
output_slope = "data/raw/dem/east_khasi_hills_slope.tif"

with rasterio.open(input_dem) as src:

    # Convert from latitude/longitude to metres
    transform, width, height = calculate_default_transform(
        src.crs,
        "EPSG:32646",
        src.width,
        src.height,
        *src.bounds
    )

    dem_utm = np.empty((height, width), dtype=np.float32)

    reproject(
        source=rasterio.band(src, 1),
        destination=dem_utm,
        src_transform=src.transform,
        src_crs=src.crs,
        dst_transform=transform,
        dst_crs="EPSG:32646",
        resampling=Resampling.bilinear
    )

    # Calculate elevation change in X and Y directions
    pixel_size_x = transform.a
    pixel_size_y = abs(transform.e)

    dz_dy, dz_dx = np.gradient(
        dem_utm,
        pixel_size_y,
        pixel_size_x
    )

    # Calculate slope in degrees
    slope = np.degrees(
        np.arctan(
            np.sqrt(dz_dx ** 2 + dz_dy ** 2)
        )
    )

    profile = src.profile.copy()
    profile.update(
        crs="EPSG:32646",
        transform=transform,
        width=width,
        height=height,
        dtype="float32",
        count=1
    )

    with rasterio.open(output_slope, "w", **profile) as dst:
        dst.write(slope.astype("float32"), 1)

print("===== SLOPE CALCULATION COMPLETE =====")
print("Saved to:", output_slope)
print("Minimum slope:", round(float(np.nanmin(slope)), 2), "degrees")
print("Maximum slope:", round(float(np.nanmax(slope)), 2), "degrees")
