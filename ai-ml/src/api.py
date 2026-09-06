from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)

model = joblib.load("models/landslide_model.joblib")

REQUIRED_FIELDS = [
    "zone_id",
    "elevation_m",
    "slope_deg",
    "aspect_deg",
    "rainfall_mm",
    "soil_clay_percent",
    "soil_sand_percent",
    "land_cover",
    "distance_to_road_m"
]

def risk_category(score):
    if score < 25:
        return "LOW"
    elif score < 50:
        return "MODERATE"
    elif score < 75:
        return "HIGH"
    else:
        return "VERY_HIGH"

@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    missing = [field for field in REQUIRED_FIELDS if field not in data]

    if missing:
        return jsonify({
            "error": "Missing fields",
            "fields": missing
        }), 400

    aspect_rad = np.deg2rad(float(data["aspect_deg"]))

    row = pd.DataFrame([{
        "elevation_m": float(data["elevation_m"]),
        "slope_deg": float(data["slope_deg"]),
        "aspect_sin": np.sin(aspect_rad),
        "aspect_cos": np.cos(aspect_rad),
        "rainfall_mm": float(data["rainfall_mm"]),
        "soil_clay_percent": float(data["soil_clay_percent"]),
        "soil_sand_percent": float(data["soil_sand_percent"]),
        "land_cover": int(data["land_cover"]),
        "distance_to_road_m": float(data["distance_to_road_m"])
    }])

    probability = model.predict_proba(row)[0][1]

    risk_score = probability * 100

    return jsonify({
        "zone_id": data["zone_id"],
        "risk_score": round(risk_score, 2),
        "risk_category": risk_category(risk_score)
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
    