import pandas as pd
import rasterio

points_file = "data/processed/landslide_points_with_elevation.csv"
slope_file = "data/raw/dem/east_khasi_hills_slope.tif"

df = pd.read_csv(points_file)

with rasterio.open(slope_file) as slope:
    # Transform latitude/longitude to the slope raster's coordinate system
    from rasterio.warp import transform

    x, y = transform(
        "EPSG:4326",
        slope.crs,
        df["longitude"].tolist(),
        df["latitude"].tolist()
    )

    coordinates = list(zip(x, y))

    slopes = []

    for value in slope.sample(coordinates):
        slopes.append(float(value[0]))

df["slope_deg"] = slopes

output_file = "data/processed/landslide_points_with_features.csv"
df.to_csv(output_file, index=False)

print("===== SLOPE EXTRACTION COMPLETE =====")
print("Rows:", len(df))
print(
    "Slope range:",
    round(df["slope_deg"].min(), 2),
    "to",
    round(df["slope_deg"].max(), 2),
    "degrees"
)
print("Saved to:", output_file)
