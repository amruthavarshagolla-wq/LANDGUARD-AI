import pandas as pd
import rasterio

INPUT_FILE = "data/processed/landslide_points_with_features.csv"

LANDCOVER_FILE = (
    "data/raw/landcover/"
    "ESA_WorldCover_10m_2021_v200_N24E090_Map.tif"
)

OUTPUT_FILE = "data/processed/landslide_points_with_features.csv"


print("===== EXTRACTING LAND COVER =====")

# Load our 200 points
df = pd.read_csv(INPUT_FILE)

print("Points:", len(df))

# Open ESA WorldCover raster
with rasterio.open(LANDCOVER_FILE) as landcover:

    print("Raster CRS:", landcover.crs)
    print("Raster resolution:", landcover.res)

    # Our coordinates are longitude, latitude
    coordinates = list(
        zip(
            df["longitude"],
            df["latitude"]
        )
    )

    landcover_values = []

    # Extract WorldCover class at each point
    for value in landcover.sample(coordinates):

        landcover_values.append(int(value[0]))


# Add land-cover class
df["land_cover"] = landcover_values


# Save updated dataset
df.to_csv(
    OUTPUT_FILE,
    index=False
)


print()
print("===== LAND COVER EXTRACTION COMPLETE =====")

print("Rows:", len(df))

print()
print("Land-cover classes found:")

print(
    df["land_cover"]
    .value_counts()
    .sort_index()
)

print()
print("Saved to:")
print(OUTPUT_FILE)
