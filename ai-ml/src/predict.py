import joblib
import pandas as pd


# Load the trained model
model = joblib.load("models/landslide_model.joblib")


# Example location/environment data
input_data = pd.DataFrame([{
    "lat": 25.50,
    "lon": 91.90,
    "elevation_m": 1200,
    "slope_deg": 35,
    "rainfall_mm": 3000,
    "soil_clay_percent": 25,
    "soil_sand_percent": 40,
    "land_cover": 10
}])


# Make prediction
prediction = model.predict(input_data)[0]

# Get probability of landslide
probability = model.predict_proba(input_data)[0][1]

# Convert probability to score from 0-100
risk_score = probability * 100


# Assign risk category
if risk_score < 25:
    risk_category = "Low"
elif risk_score < 50:
    risk_category = "Moderate"
elif risk_score < 75:
    risk_category = "High"
else:
    risk_category = "Very High"


print("===== LANDSLIDE RISK PREDICTION =====")

print(f"Prediction: {prediction}")
print(f"Landslide probability: {probability:.2f}")
print(f"Risk score: {risk_score:.2f}/100")
print(f"Risk category: {risk_category}")