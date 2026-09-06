import pandas as pd

file_path = "data/raw/gsi_landslides_east_khasi_hills.csv"

df = pd.read_csv(file_path)

print("===== GSI LANDSLIDE DATA =====")
print("Rows:", len(df))

print("\nColumns:")
print(df.columns.tolist())

print("\n===== FIRST 5 ROWS =====")
print(df.head().to_string())

print("\n===== MISSING VALUES =====")
print(df.isnull().sum())
print("\n===== COORDINATE CHECK =====")
print("Latitude range:", df["latitude"].min(), "to", df["latitude"].max())
print("Longitude range:", df["longitude"].min(), "to", df["longitude"].max())

print("\nDuplicate coordinates:")
print(df.duplicated(subset=["latitude", "longitude"]).sum())
print("\n===== COORDINATE SAMPLES =====")
print(df[["latitude", "longitude"]].head(10).to_string(index=False))

print("\n===== LAST 10 COORDINATES =====")
print(df[["latitude", "longitude"]].tail(10).to_string(index=False))
# Create a clean positive landslide dataset

positive_df = df[
    ["latitude", "longitude", "landslide_label"]
].copy()

output_file = "data/raw/gsi_landslide_points.csv"

positive_df.to_csv(output_file, index=False)

print("\n===== CLEAN LANDSLIDE POINTS CREATED =====")
print("Rows:", len(positive_df))
print("Saved to:", output_file)
print(positive_df.head())

