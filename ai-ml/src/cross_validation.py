import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, cross_val_score


# Load augmented zone dataset
df = pd.read_csv("data/zone_training_data_augmented.csv")


# Final 14 ML features
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

X = df[features]
y = df["landslide_label"]


# Categorical and numerical features
categorical_features = ["land_cover"]

numerical_features = [
    "elevation_m",
    "slope_deg",
    "rainfall_mm",
    "soil_clay_percent",
    "soil_sand_percent",
    "distance_to_road_m",
    "aspect_sin",
    "aspect_cos",
    "built_up_percent",
    "forest_loss_percent",
    "distance_to_stream_m",
    "drainage_density",
    "earthquake_distance_km"
]


# Preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features
        ),
        (
            "numerical",
            "passthrough",
            numerical_features
        )
    ]
)


# Random Forest
model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        (
            "classifier",
            RandomForestClassifier(
                n_estimators=300,
                random_state=42,
                class_weight="balanced"
            )
        )
    ]
)


# 5-fold cross-validation
cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)


# Calculate accuracy
scores = cross_val_score(
    model,
    X,
    y,
    cv=cv,
    scoring="accuracy"
)


print("===== 5-FOLD CROSS-VALIDATION =====")

for i, score in enumerate(scores, start=1):
    print(f"Fold {i}: {score:.2f}")


print("\n===== RESULTS =====")
print(f"Average accuracy: {scores.mean():.2f}")
print(f"Standard deviation: {scores.std():.2f}")
