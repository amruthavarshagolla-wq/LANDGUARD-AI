import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score


# Load dataset
df = pd.read_csv("data/landslide_training_data.csv")


# Environmental features only
features = [
    "elevation_m",
    "slope_deg",
    "rainfall_mm",
    "soil_clay_percent",
    "soil_sand_percent",
    "land_cover"
]


X = df[features]
y = df["landslide_label"]


# Create Random Forest
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)


# Create 5-fold cross-validation
cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)


# Calculate accuracy for each fold
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