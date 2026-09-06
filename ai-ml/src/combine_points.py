import pandas as pd

positive = pd.read_csv("data/raw/gsi_landslide_points.csv")
negative = pd.read_csv("data/raw/gsi_negative_points.csv")

combined = pd.concat(
    [positive, negative],
    ignore_index=True
)

combined = combined.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)

combined.to_csv(
    "data/processed/landslide_points_combined.csv",
    index=False
)

print("===== COMBINED DATASET =====")
print("Total rows:", len(combined))
print("\nLabel counts:")
print(combined["landslide_label"].value_counts())
print("\nSaved to:")
print("data/processed/landslide_points_combined.csv")
