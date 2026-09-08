import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score
)


# ============================================================
# FILES
# ============================================================

INPUT_FILE = "ai-ml/data/zone_training_data_augmented.csv"
MODEL_FILE = "ai-ml/model/landslide_model_augmented.joblib"


# ============================================================
# LOAD DATA
# ============================================================

print("===== AUGMENTED MODEL TRAINING =====")

df = pd.read_csv(INPUT_FILE)

print(f"Dataset shape: {df.shape}")


# ============================================================
# FEATURES
# ============================================================

features = [
    "elevation_m",
    "slope_deg",
    "aspect_deg",
    "rainfall_mm",
    "soil_clay_percent",
    "soil_sand_percent",
    "land_cover",
    "distance_to_road_m",
    "built_up_percent",
    "forest_loss_percent",
    "distance_to_stream_m",
    "drainage_density",
    "earthquake_distance_km"
]

target = "landslide_label"


# ============================================================
# CHECK DATA
# ============================================================

missing_features = [
    column for column in features
    if column not in df.columns
]

if missing_features:
    raise ValueError(
        f"Missing required features: {missing_features}"
    )

if target not in df.columns:
    raise ValueError(
        f"Missing target column: {target}"
    )

if df[features + [target]].isna().any().any():
    raise ValueError(
        "Dataset contains missing values."
    )


# ============================================================
# CREATE X AND Y
# ============================================================

X = df[features]
y = df[target].astype(int)

print()
print("Features:")
for feature in features:
    print(f" - {feature}")

print()
print("Class distribution:")
print(y.value_counts().sort_index())


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
print(f"Training samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")


# ============================================================
# CREATE MODEL
# ============================================================

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42
)


# ============================================================
# TRAIN
# ============================================================

print()
print("Training model...")

model.fit(X_train, y_train)

print("Training complete.")


# ============================================================
# EVALUATE
# ============================================================

y_pred = model.predict(X_test)
y_probability = model.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_probability)

print()
print("===== MODEL EVALUATION =====")
print(f"Accuracy: {accuracy:.4f}")
print(f"ROC-AUC:  {roc_auc:.4f}")

print()
print("===== CLASSIFICATION REPORT =====")
print(classification_report(y_test, y_pred))


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

importance = pd.Series(
    model.feature_importances_,
    index=features
).sort_values(ascending=False)

print()
print("===== FEATURE IMPORTANCE =====")

for feature, value in importance.items():
    print(f"{feature}: {value:.4f}")


# ============================================================
# SAVE MODEL
# ============================================================

os.makedirs(
    os.path.dirname(MODEL_FILE),
    exist_ok=True
)

joblib.dump(model, MODEL_FILE)

print()
print("===== MODEL SAVED =====")
print(f"Saved to: {MODEL_FILE}")