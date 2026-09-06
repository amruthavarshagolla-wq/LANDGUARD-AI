import pandas as pd
import rasterio

points_file = "data/processed/landslide_points_combined.csv"
dem_file = "data/raw/dem/east_khasi_hills_dem.tif"

df = pd.read_csv(points_file)

with rasterio.open(dem_file) as dem:
    coordinates = list(zip(df["longitude"], df["latitude"]))

    elevations = []

    for value in dem.sample(coordinates):
        elevations.append(float(value[0]))

df["elevation_m"] = elevations

output_file = "data/processed/landslide_points_with_elevation.csv"
df.to_csv(output_file, index=False)

print("===== ELEVATION EXTRACTION COMPLETE =====")
print("Rows:", len(df))
print("Elevation range:",
      round(df["elevation_m"].min(), 2),
      "to",
      round(df["elevation_m"].max(), 2),
      "meters")
print("Saved to:", output_file)
