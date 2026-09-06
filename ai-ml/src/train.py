import os
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

import joblib


INPUT_FILE = "data/processed/zone_training_data.csv"
MODEL_FILE = "models/landslide_model.joblib"


print("===== LOADING ZONE DATA =====")

df = pd.read_csv(INPUT_FILE)

print(f"Zones: {len(df)}")
print(f"Positive zones: {(df['landslide_label'] == 1).sum()}")
print(f"Negative zones: {(df['landslide_label'] == 0).sum()}")


# --------------------------------------------------
# Aspect transformation
# --------------------------------------------------

df["aspect_sin"] = np.sin(
    np.deg2rad(df["aspect_deg"])
)

df["aspect_cos"] = np.cos(
    np.deg2rad(df["aspect_deg"])
)


# --------------------------------------------------
# Features
# --------------------------------------------------

numeric_features = [
    "elevation_m",
    "slope_deg",
    "rainfall_mm",
    "soil_clay_percent",
    "soil_sand_percent",
    "distance_to_road_m",
    "aspect_sin",
    "aspect_cos"
]

categorical_features = [
    "land_cover"
]

features = numeric_features + categorical_features

X = df[features]
y = df["landslide_label"]


# --------------------------------------------------
# Spatial groups
# --------------------------------------------------

# Extract grid coordinates from zone ID:
# EKH_00001_00003

parts = df["zone_id"].str.split("_", expand=True)

grid_x = parts[1].astype(int)
grid_y = parts[2].astype(int)

# Group nearby zones into larger spatial blocks
spatial_groups = (
    (grid_x // 5).astype(str)
    + "_"
    + (grid_y // 5).astype(str)
)


# --------------------------------------------------
# Preprocessing
# --------------------------------------------------

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            categorical_features
        ),
        (
            "numeric",
            "passthrough",
            numeric_features
        )
    ]
)


# --------------------------------------------------
# Final Random Forest model
# --------------------------------------------------

model = Pipeline([
    (
        "preprocessor",
        preprocessor
    ),
    (
        "classifier",
        RandomForestClassifier(
            n_estimators=300,
            max_depth=12,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42
        )
    )
])


# --------------------------------------------------
# Spatial cross-validation
# --------------------------------------------------

print()
print("===== SPATIAL CROSS-VALIDATION =====")

cv = StratifiedGroupKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

accuracy_scores = []
precision_scores = []
recall_scores = []
f1_scores = []
roc_auc_scores = []


for fold, (train_idx, test_idx) in enumerate(
    cv.split(X, y, groups=spatial_groups),
    start=1
):

    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]

    y_train = y.iloc[train_idx]
    y_test = y.iloc[test_idx]

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    probabilities = model.predict_proba(X_test)[:, 1]

    accuracy_scores.append(
        accuracy_score(y_test, predictions)
    )

    precision_scores.append(
        precision_score(
            y_test,
            predictions,
            zero_division=0
        )
    )

    recall_scores.append(
        recall_score(
            y_test,
            predictions,
            zero_division=0
        )
    )

    f1_scores.append(
        f1_score(
            y_test,
            predictions,
            zero_division=0
        )
    )

    roc_auc_scores.append(
        roc_auc_score(
            y_test,
            probabilities
        )
    )

    print(
        f"Fold {fold}: "
        f"Accuracy={accuracy_scores[-1]:.3f}, "
        f"F1={f1_scores[-1]:.3f}, "
        f"ROC-AUC={roc_auc_scores[-1]:.3f}"
    )


# --------------------------------------------------
# CV summary
# --------------------------------------------------

print()
print("===== SPATIAL CV SUMMARY =====")

print(
    f"Accuracy : "
    f"{np.mean(accuracy_scores):.3f} "
    f"+/- {np.std(accuracy_scores):.3f}"
)

print(
    f"Precision: "
    f"{np.mean(precision_scores):.3f} "
    f"+/- {np.std(precision_scores):.3f}"
)

print(
    f"Recall   : "
    f"{np.mean(recall_scores):.3f} "
    f"+/- {np.std(recall_scores):.3f}"
)

print(
    f"F1       : "
    f"{np.mean(f1_scores):.3f} "
    f"+/- {np.std(f1_scores):.3f}"
)

print(
    f"ROC-AUC  : "
    f"{np.mean(roc_auc_scores):.3f} "
    f"+/- {np.std(roc_auc_scores):.3f}"
)


# --------------------------------------------------
# Train final model on ALL zones
# --------------------------------------------------

print()
print("===== TRAINING FINAL MODEL =====")

model.fit(X, y)


# Save model
os.makedirs("models", exist_ok=True)

joblib.dump(
    model,
    MODEL_FILE
)


print()
print("===== FINAL MODEL COMPLETE =====")
print(f"Training zones: {len(df)}")
print(f"Features: {len(features)}")
print(f"Model saved: {MODEL_FILE}")
