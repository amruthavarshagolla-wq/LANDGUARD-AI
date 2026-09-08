import pandas as pd
import numpy as np
import joblib

from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_FILE = BASE_DIR / "data" / "processed" / "zone_training_data_augmented.csv"

# Works for both:
# LANDGUARD_M1/models/
# and
# LANDGUARD_M1/ai-ml/model/
if (BASE_DIR / "model").exists():
    MODEL_DIR = BASE_DIR / "model"
else:
    MODEL_DIR = BASE_DIR / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_FILE = MODEL_DIR / "landslide_model.joblib"


# ============================================================
# 14 FEATURES
# ============================================================

FEATURES = [
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

TARGET = "landslide_label"


# ============================================================
# LOAD DATA
# ============================================================

print()
print("==============================================")
print("   LANDGUARD 14-FEATURE MODEL TRAINING")
print("==============================================")
print()

print(f"Loading dataset:")
print(DATA_FILE)

df = pd.read_csv(DATA_FILE)

print()
print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")


# ============================================================
# CHECK FEATURES
# ============================================================

missing_features = [f for f in FEATURES if f not in df.columns]

if missing_features:
    print()
    print("ERROR: Missing features:")
    for feature in missing_features:
        print(f"  - {feature}")
    raise ValueError("Required features are missing from dataset.")

if TARGET not in df.columns:
    raise ValueError(f"Target column '{TARGET}' not found.")


# ============================================================
# CLEAN DATA
# ============================================================

df = df[FEATURES + [TARGET]].copy()

df = df.dropna()

print()
print(f"Rows after removing missing values: {len(df)}")

print()
print("Target distribution:")
print(df[TARGET].value_counts())


# ============================================================
# SPLIT FEATURES / TARGET
# ============================================================

X = df[FEATURES]
y = df[TARGET]


# ============================================================
# FEATURE TYPES
# ============================================================

CATEGORICAL_FEATURES = [
    "land_cover"
]

NUMERICAL_FEATURES = [
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


# ============================================================
# PREPROCESSING
# ============================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False
            ),
            CATEGORICAL_FEATURES
        ),
        (
            "numerical",
            "passthrough",
            NUMERICAL_FEATURES
        )
    ]
)


# ============================================================
# MODEL
# ============================================================

model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight="balanced",
    min_samples_leaf=2,
    n_jobs=-1
)


# ============================================================
# PIPELINE
# ============================================================

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("classifier", model)
    ]
)


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print()
print("Training samples:", len(X_train))
print("Testing samples :", len(X_test))


# ============================================================
# TRAIN
# ============================================================

print()
print("Training Random Forest...")
print("Features:", len(FEATURES))
print()

pipeline.fit(X_train, y_train)


# ============================================================
# EVALUATION
# ============================================================

y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, zero_division=0)
recall = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)
roc_auc = roc_auc_score(y_test, y_prob)


print()
print("==============================================")
print("             MODEL RESULTS")
print("==============================================")

print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")
print(f"ROC-AUC   : {roc_auc:.4f}")

print()
print("Classification Report:")
print(classification_report(
    y_test,
    y_pred,
    zero_division=0
))


# ============================================================
# TRAIN FINAL MODEL ON ALL DATA
# ============================================================

print()
print("Training final model using ALL available data...")

pipeline.fit(X, y)


# ============================================================
# SAVE MODEL
# ============================================================

joblib.dump(pipeline, MODEL_FILE)

print()
print("==============================================")
print("             TRAINING COMPLETE")
print("==============================================")

print()
print(f"Features used: {len(FEATURES)}")

for i, feature in enumerate(FEATURES, start=1):
    print(f"{i:2}. {feature}")

print()
print(f"Model saved to:")
print(MODEL_FILE)

print()
print("14-feature model is ready.")
