import joblib
import pandas as pd

MODEL_FILE = "models/landslide_model.joblib"

# Load trained model
model = joblib.load(MODEL_FILE)

# New 14 model features
features = [
    "elevation_m",
    "slope_deg",
    "rainfall_mm",
    "soil_clay_percent",
    "soil_sand_percent",
    "land_cover",
    "distance_to_road_m",
    "aspect_sin",
    "aspect_cos",
    "built_up_percent",
    "forest_loss_percent",
    "distance_to_stream_m",
    "drainage_density",
    "earthquake_distance_km"
]

# Get the Random Forest from the pipeline
if hasattr(model, "named_steps"):
    classifier = model.named_steps.get("classifier")

    if classifier is None:
        classifier = model.named_steps.get("randomforestclassifier")
else:
    classifier = model

# Get feature importance
if classifier is None or not hasattr(classifier, "feature_importances_"):
    raise ValueError("Could not find Random Forest feature importances.")

importance = classifier.feature_importances_

# Try to get transformed feature names
try:
    preprocessor = model.named_steps.get("preprocessor")

    if preprocessor is not None:
        transformed_features = preprocessor.get_feature_names_out()
    else:
        transformed_features = features
except Exception:
    transformed_features = features

# Create table
importance_df = pd.DataFrame({
    "Feature": transformed_features,
    "Importance": importance
})

# Sort highest to lowest
importance_df = importance_df.sort_values(
    by="Importance",
    ascending=False
)

print("===== FEATURE IMPORTANCE =====")
print(importance_df.to_string(index=False))
