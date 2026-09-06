import pandas as pd
import joblib


# Load the trained model
model = joblib.load("models/landslide_model.joblib")


# Feature names used during training
features = [
    "lat",
    "lon",
    "elevation_m",
    "slope_deg",
    "rainfall_mm",
    "soil_clay_percent",
    "soil_sand_percent",
    "land_cover"
]


# Get feature importance
importance = model.feature_importances_


# Create a table
importance_df = pd.DataFrame({
    "Feature": features,
    "Importance": importance
})


# Sort from most important to least important
importance_df = importance_df.sort_values(
    by="Importance",
    ascending=False
)


print("===== FEATURE IMPORTANCE =====")
print(importance_df.to_string(index=False))