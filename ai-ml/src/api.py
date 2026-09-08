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
    "distance_to_road_m",
    "built_up_percent",
    "forest_loss_percent",
    "distance_to_stream_m",
    "drainage_density",
    "earthquake_distance_km"
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

    if not data:
        return jsonify({"error": "JSON body required"}), 400

    missing = [field for field in REQUIRED_FIELDS if field not in data]

    if missing:
        return jsonify({
            "error": "Missing required fields",
            "missing": missing
        }), 400

    try:
        aspect_rad = np.radians(float(data["aspect_deg"]))

        features = pd.DataFrame([{
            "elevation_m": float(data["elevation_m"]),
            "slope_deg": float(data["slope_deg"]),
            "rainfall_mm": float(data["rainfall_mm"]),
            "soil_clay_percent": float(data["soil_clay_percent"]),
            "soil_sand_percent": float(data["soil_sand_percent"]),
            "land_cover": data["land_cover"],
            "distance_to_road_m": float(data["distance_to_road_m"]),
            "aspect_sin": np.sin(aspect_rad),
            "aspect_cos": np.cos(aspect_rad),
            "built_up_percent": float(data["built_up_percent"]),
            "forest_loss_percent": float(data["forest_loss_percent"]),
            "distance_to_stream_m": float(data["distance_to_stream_m"]),
            "drainage_density": float(data["drainage_density"]),
            "earthquake_distance_km": float(data["earthquake_distance_km"])
        }])

        probability = model.predict_proba(features)[0][1]

        score = round(float(probability * 100), 2)

        return jsonify({
            "zone_id": data["zone_id"],
            "risk_score": score,
            "risk_category": risk_category(score)
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)