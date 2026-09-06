import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report


# Load the cleaned dataset
df = pd.read_csv("data/landslide_training_data.csv")


# Features WITHOUT latitude and longitude
features = [
    "elevation_m",
    "slope_deg",
    "rainfall_mm",
    "soil_clay_percent",
    "soil_sand_percent",
    "land_cover"
]


# Create X and y
X = df[features]
y = df["landslide_label"]


# Split the data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# Create and train the model
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

model.fit(X_train, y_train)


# Predict
y_pred = model.predict(X_test)


# Evaluate
accuracy = accuracy_score(y_test, y_pred)

print("===== MODEL WITHOUT COORDINATES =====")
print(f"Training samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")

print("\n===== ACCURACY =====")
print(f"{accuracy:.2f}")

print("\n===== CLASSIFICATION REPORT =====")
print(classification_report(y_test, y_pred))