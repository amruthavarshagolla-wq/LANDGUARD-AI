from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv
from datetime import datetime
import os
import joblib
import numpy as np
import pandas as pd
from werkzeug.utils import secure_filename

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# =========================================================
# DATABASE CONFIGURATION
# =========================================================

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# =========================================================
# UPLOAD CONFIGURATION
# =========================================================

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================================================
# AI MODEL CONFIGURATION
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(
    os.path.join(
        BASE_DIR,
        "..",
        "ai-ml",
        "model",
        "landslide_model_augmented.joblib"
    )
)

ai_model = None
ai_model_error = None

try:
    ai_model = joblib.load(MODEL_PATH)
    print(f"AI model loaded successfully from: {MODEL_PATH}")
except Exception as e:
    ai_model_error = str(e)
    print(f"AI model could not be loaded: {e}")


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_risk_level(risk_score):
    if risk_score is None:
        return "UNKNOWN"

    if risk_score >= 75:
        return "Very High"
    elif risk_score >= 50:
        return "High"
    elif risk_score >= 25:
        return "Moderate"
    else:
        return "Low"


def create_critical_report_alert(report_id, latitude, longitude):
    """
    Automatically creates an alert when a CRITICAL field report is submitted.
    """

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        alert_id = f"ALT-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"

        cur.execute(
            """
            INSERT INTO alerts (
                alert_id,
                latitude,
                longitude,
                risk_score,
                risk_level,
                trigger_reason,
                affected_area,
                recommended_action,
                map_link,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                alert_id,
                latitude,
                longitude,
                100,
                "Very High",
                "Critical field report received",
                "Field report location",
                "Deploy inspection team immediately and prepare for emergency response.",
                f"/gis?lat={latitude}&lng={longitude}",
                "ACTIVE"
            )
        )

        created_alert_id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        return created_alert_id

    except Exception:
        return None


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "LANDGUARD AI Backend is running."
    })


# =========================================================
# DATABASE TEST
# =========================================================

@app.route("/api/db-test", methods=["GET"])
def db_test():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT version();")
        version = cur.fetchone()[0]

        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "PostgreSQL connection successful.",
            "database": version
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# RISK ZONES
# =========================================================

@app.route("/api/risk-zones", methods=["GET"])
def get_risk_zones():

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id,
                name,
                risk_level,
                latitude,
                longitude,
                risk_score,
                rainfall,
                soil_moisture
            FROM risk_zones
            ORDER BY id
            """
        )

        rows = cur.fetchall()

        cur.close()
        conn.close()

        zones = []

        for row in rows:
            zones.append({
                "id": row[0],
                "name": row[1],
                "risk_level": row[2],
                "latitude": row[3],
                "longitude": row[4],
                "risk_score": row[5],
                "rainfall": row[6],
                "soil_moisture": row[7]
            })

        if request.args.get("format") == "geojson":

            features = []

            for zone in zones:
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [
                            zone["longitude"],
                            zone["latitude"]
                        ]
                    },
                    "properties": zone
                })

            return jsonify({
                "success": True,
                "data": {
                    "type": "FeatureCollection",
                    "features": features
                }
            })

        return jsonify({
            "success": True,
            "data": zones
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/risk-zones/<int:zone_id>", methods=["GET"])
def get_risk_zone(zone_id):

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id,
                name,
                risk_level,
                latitude,
                longitude,
                risk_score,
                rainfall,
                soil_moisture
            FROM risk_zones
            WHERE id = %s
            """,
            (zone_id,)
        )

        row = cur.fetchone()

        cur.close()
        conn.close()

        if not row:
            return jsonify({
                "success": False,
                "error": "Risk zone not found."
            }), 404

        return jsonify({
            "success": True,
            "data": {
                "id": row[0],
                "name": row[1],
                "risk_level": row[2],
                "latitude": row[3],
                "longitude": row[4],
                "risk_score": row[5],
                "rainfall": row[6],
                "soil_moisture": row[7]
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/risk-zones", methods=["POST"])
def create_risk_zone():

    try:
        data = request.get_json()

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO risk_zones (
                name,
                risk_level,
                latitude,
                longitude,
                risk_score,
                rainfall,
                soil_moisture
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                data.get("name"),
                data.get("risk_level"),
                data.get("latitude"),
                data.get("longitude"),
                data.get("risk_score"),
                data.get("rainfall"),
                data.get("soil_moisture")
            )
        )

        zone_id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Risk zone created successfully.",
            "data": {
                "id": zone_id
            }
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# AI PREDICTION
# =========================================================

def ai_risk_category(score):
    if score < 25:
        return "LOW"
    elif score < 50:
        return "MODERATE"
    elif score < 75:
        return "HIGH"
    else:
        return "VERY_HIGH"


AI_MODEL_FEATURES = [
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


@app.route("/api/prediction", methods=["GET"])
def prediction_info():
    return jsonify({
        "success": True,
        "data": {
            "status": "CONNECTED" if ai_model is not None else "NOT_CONNECTED",
            "model": "Random Forest",
            "model_file": "landslide_model_augmented.joblib",
            "message": (
                "AI landslide risk model is connected and ready."
                if ai_model is not None
                else "AI model could not be loaded."
            ),
            "input_fields": [
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
            ],
            "model_features": AI_MODEL_FEATURES,
            "output_fields": [
                "zone_id",
                "risk_score",
                "risk_category"
            ]
        }
    })


@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "Request body must contain JSON data."
            }), 400

        required_fields = [
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

        missing_fields = [
            field for field in required_fields
            if field not in data
        ]

        if missing_fields:
            return jsonify({
                "success": False,
                "error": "Missing required fields.",
                "missing_fields": missing_fields
            }), 400

        if ai_model is None:
            return jsonify({
                "success": False,
                "error": "AI model is not available.",
                "model_error": ai_model_error
            }), 503

        zone_id = str(data["zone_id"])

        row = pd.DataFrame([{
            "elevation_m": float(data["elevation_m"]),
            "slope_deg": float(data["slope_deg"]),
            "aspect_deg": float(data["aspect_deg"]),
            "rainfall_mm": float(data["rainfall_mm"]),
            "soil_clay_percent": float(data["soil_clay_percent"]),
            "soil_sand_percent": float(data["soil_sand_percent"]),
            "land_cover": int(data["land_cover"]),
            "distance_to_road_m": float(data["distance_to_road_m"]),
            "built_up_percent": float(data["built_up_percent"]),
            "forest_loss_percent": float(data["forest_loss_percent"]),
            "distance_to_stream_m": float(data["distance_to_stream_m"]),
            "drainage_density": float(data["drainage_density"]),
            "earthquake_distance_km": float(data["earthquake_distance_km"])
        }], columns=AI_MODEL_FEATURES)

        prediction = int(ai_model.predict(row)[0])
        probability = float(ai_model.predict_proba(row)[0][1])
        risk_score = probability * 100
        risk_category = ai_risk_category(risk_score)

        return jsonify({
            "success": True,
            "data": {
                "status": "CONNECTED",
                "zone_id": zone_id,
                "prediction": prediction,
                "landslide_probability": round(probability, 4),
                "risk_score": round(risk_score, 2),
                "risk_category": risk_category,
                "latitude": data.get("latitude"),
                "longitude": data.get("longitude")
            }
        })

    except (TypeError, ValueError) as e:
        return jsonify({
            "success": False,
            "error": f"Invalid input value: {str(e)}"
        }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# =========================================================
# FIELD REPORTS
# =========================================================

@app.route("/api/reports", methods=["GET"])
def get_reports():

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id,
                report_type,
                hazard_type,
                description,
                latitude,
                longitude,
                severity,
                weather,
                image_url,
                user_id,
                created_at,
                status,
                verified
            FROM field_reports
            ORDER BY created_at DESC
            """
        )

        rows = cur.fetchall()

        cur.close()
        conn.close()

        reports = []

        for row in rows:
            reports.append({
                "id": row[0],
                "report_type": row[1],
                "hazard_type": row[2],
                "description": row[3],
                "latitude": row[4],
                "longitude": row[5],
                "severity": row[6],
                "weather": row[7],
                "image_url": row[8],
                "user_id": row[9],
                "created_at": row[10].isoformat() if row[10] else None,
                "status": row[11],
                "verified": row[12]
            })

        if request.args.get("format") == "geojson":

            features = []

            for report in reports:

                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [
                            report["longitude"],
                            report["latitude"]
                        ]
                    },
                    "properties": report
                })

            return jsonify({
                "success": True,
                "data": {
                    "type": "FeatureCollection",
                    "features": features
                }
            })

        return jsonify({
            "success": True,
            "data": reports
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/reports", methods=["POST"])
def create_report():

    try:
        data = request.get_json()

        required_fields = [
            "hazard_type",
            "description",
            "severity"
        ]

        missing_fields = [
            field for field in required_fields
            if not data.get(field)
        ]

        if missing_fields:
            return jsonify({
                "success": False,
                "error": "Missing required fields.",
                "missing_fields": missing_fields
            }), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO field_reports (
                report_type,
                hazard_type,
                description,
                latitude,
                longitude,
                severity,
                weather,
                image_url,
                user_id,
                status,
                verified,
                geometry
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s,
                'PENDING_VERIFICATION',
                FALSE,
                CASE
                    WHEN %s IS NOT NULL AND %s IS NOT NULL
                    THEN ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                    ELSE NULL
                END
            )
            RETURNING id, created_at
            """,
            (
                data.get("report_type"),
                data.get("hazard_type"),
                data.get("description"),
                data.get("latitude"),
                data.get("longitude"),
                data.get("severity"),
                data.get("weather"),
                data.get("image_url"),
                data.get("user_id"),
                data.get("longitude"),
                data.get("latitude"),
                data.get("longitude"),
                data.get("latitude")
            )
        )

        result = cur.fetchone()

        report_id = result[0]
        created_at = result[1]

        alert_created = False
        alert_id = None

        if str(data.get("severity", "")).upper() == "CRITICAL":

            alert_id = create_critical_report_alert(
                report_id,
                data.get("latitude"),
                data.get("longitude")
            )

            if alert_id:
                alert_created = True

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Field report created successfully.",
            "data": {
                "report_id": report_id,
                "created_at": created_at.isoformat(),
                "status": "PENDING_VERIFICATION",
                "automatic_alert_created": alert_created,
                "alert_id": alert_id
            }
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# FIELD REPORT ALIAS
# =========================================================

@app.route("/api/field-reports", methods=["GET"])
def get_field_reports():

    return get_reports()


# =========================================================
# IMAGE UPLOAD
# =========================================================

@app.route("/api/reports/upload", methods=["POST"])
def upload_report_image():

    try:

        if "image" not in request.files:
            return jsonify({
                "success": False,
                "error": "No image file provided."
            }), 400

        file = request.files["image"]

        if file.filename == "":
            return jsonify({
                "success": False,
                "error": "No image selected."
            }), 400

        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "error": "Unsupported image format."
            }), 400

        filename = secure_filename(file.filename)

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")

        filename = f"{timestamp}_{filename}"

        filepath = os.path.join(
            app.config["UPLOAD_FOLDER"],
            filename
        )

        file.save(filepath)

        return jsonify({
            "success": True,
            "message": "Image uploaded successfully.",
            "data": {
                "filename": filename,
                "url": f"/api/uploads/{filename}"
            }
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/uploads/<filename>", methods=["GET"])
def serve_uploaded_file(filename):

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename
    )


# =========================================================
# ALERTS
# =========================================================

@app.route("/api/alerts", methods=["GET"])
def get_alerts():

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id,
                alert_id,
                latitude,
                longitude,
                risk_score,
                risk_level,
                trigger_reason,
                affected_area,
                recommended_action,
                map_link,
                created_at,
                status
            FROM alerts
            ORDER BY created_at DESC
            """
        )

        rows = cur.fetchall()

        cur.close()
        conn.close()

        alerts = []

        for row in rows:

            alerts.append({
                "id": row[0],
                "alert_id": row[1],
                "latitude": row[2],
                "longitude": row[3],
                "risk_score": row[4],
                "risk_level": row[5],
                "trigger_reason": row[6],
                "affected_area": row[7],
                "recommended_action": row[8],
                "map_link": row[9],
                "created_at": row[10].isoformat() if row[10] else None,
                "status": row[11]
            })

        return jsonify({
            "success": True,
            "data": alerts
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/alerts", methods=["POST"])
def create_alert():

    try:

        data = request.get_json()

        conn = get_db_connection()
        cur = conn.cursor()

        alert_id = data.get(
            "alert_id",
            f"ALT-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        )

        cur.execute(
            """
            INSERT INTO alerts (
                alert_id,
                latitude,
                longitude,
                risk_score,
                risk_level,
                trigger_reason,
                affected_area,
                recommended_action,
                map_link,
                status
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s
            )
            RETURNING id
            """,
            (
                alert_id,
                data.get("latitude"),
                data.get("longitude"),
                data.get("risk_score"),
                data.get("risk_level"),
                data.get("trigger_reason"),
                data.get("affected_area"),
                data.get("recommended_action"),
                data.get("map_link"),
                data.get("status", "ACTIVE")
            )
        )

        new_id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Alert created successfully.",
            "data": {
                "id": new_id,
                "alert_id": alert_id
            }
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# ROADS
# =========================================================

@app.route("/api/roads", methods=["GET"])
def get_roads():

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id,
                name,
                road_type,
                latitude,
                longitude,
                only_access,
                alternate_route_exists,
                properties,
                ST_AsGeoJSON(geometry)
            FROM roads
            ORDER BY id
            """
        )

        rows = cur.fetchall()

        cur.close()
        conn.close()

        roads = []

        for row in rows:

            roads.append({
                "id": row[0],
                "name": row[1],
                "road_type": row[2],
                "latitude": row[3],
                "longitude": row[4],
                "only_access": row[5],
                "alternate_route_exists": row[6],
                "properties": row[7],
                "geometry": row[8]
            })

        if request.args.get("format") == "geojson":

            features = []

            for road in roads:

                import json

                geometry = json.loads(road["geometry"]) if road["geometry"] else None

                properties = road.copy()
                properties.pop("geometry", None)

                features.append({
                    "type": "Feature",
                    "geometry": geometry,
                    "properties": properties
                })

            return jsonify({
                "success": True,
                "data": {
                    "type": "FeatureCollection",
                    "features": features
                }
            })

        return jsonify({
            "success": True,
            "data": roads
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# VILLAGES
# =========================================================

@app.route("/api/villages", methods=["GET"])
def get_villages():

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id,
                name,
                population,
                latitude,
                longitude,
                properties,
                ST_AsGeoJSON(geometry)
            FROM villages
            ORDER BY id
            """
        )

        rows = cur.fetchall()

        cur.close()
        conn.close()

        villages = []

        for row in rows:

            villages.append({
                "id": row[0],
                "name": row[1],
                "population": row[2],
                "latitude": row[3],
                "longitude": row[4],
                "properties": row[5],
                "geometry": row[6]
            })

        if request.args.get("format") == "geojson":

            import json

            features = []

            for village in villages:

                geometry = json.loads(village["geometry"]) if village["geometry"] else None

                properties = village.copy()
                properties.pop("geometry", None)

                features.append({
                    "type": "Feature",
                    "geometry": geometry,
                    "properties": properties
                })

            return jsonify({
                "success": True,
                "data": {
                    "type": "FeatureCollection",
                    "features": features
                }
            })

        return jsonify({
            "success": True,
            "data": villages
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# INFRASTRUCTURE
# =========================================================

@app.route("/api/infrastructure", methods=["GET"])
def get_infrastructure():

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id,
                asset_type,
                name,
                latitude,
                longitude,
                only_access,
                alternate_route_exists,
                properties,
                ST_AsGeoJSON(geometry)
            FROM gis_assets
            ORDER BY id
            """
        )

        rows = cur.fetchall()

        cur.close()
        conn.close()

        assets = []

        for row in rows:

            assets.append({
                "id": row[0],
                "asset_type": row[1],
                "name": row[2],
                "latitude": row[3],
                "longitude": row[4],
                "only_access": row[5],
                "alternate_route_exists": row[6],
                "properties": row[7],
                "geometry": row[8]
            })

        if request.args.get("format") == "geojson":

            import json

            features = []

            for asset in assets:

                geometry = json.loads(asset["geometry"]) if asset["geometry"] else None

                properties = asset.copy()
                properties.pop("geometry", None)

                features.append({
                    "type": "Feature",
                    "geometry": geometry,
                    "properties": properties
                })

            return jsonify({
                "success": True,
                "data": {
                    "type": "FeatureCollection",
                    "features": features
                }
            })

        return jsonify({
            "success": True,
            "data": assets
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# PRIORITY RESULTS
# =========================================================

@app.route("/api/priorities", methods=["POST"])
def create_priority():

    try:

        data = request.get_json()

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO priority_results (
                zone_id,
                risk_score,
                exposure_score,
                vulnerability_score,
                criticality_score,
                priority_score,
                priority_band,
                priority_rank,
                recommended_action,
                explanation,
                data_quality_flags,
                affected_summary
            )
            VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s
            )
            RETURNING id, created_at
            """,
            (
                data.get("zone_id"),
                data.get("risk_score"),
                data.get("exposure_score"),
                data.get("vulnerability_score"),
                data.get("criticality_score"),
                data.get("priority_score"),
                data.get("priority_band"),
                data.get("priority_rank"),
                data.get("recommended_action"),
                data.get("explanation"),
                Json(data.get("data_quality_flags", {})),
                Json(data.get("affected_summary", {}))
            )
        )

        result = cur.fetchone()

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Priority result stored successfully.",
            "data": {
                "id": result[0],
                "created_at": result[1].isoformat()
            }
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/priorities", methods=["GET"])
def get_priorities():

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id,
                zone_id,
                risk_score,
                exposure_score,
                vulnerability_score,
                criticality_score,
                priority_score,
                priority_band,
                priority_rank,
                recommended_action,
                explanation,
                data_quality_flags,
                affected_summary,
                created_at
            FROM priority_results
            ORDER BY priority_rank ASC NULLS LAST,
                     priority_score DESC
            """
        )

        rows = cur.fetchall()

        cur.close()
        conn.close()

        priorities = []

        for row in rows:

            priorities.append({
                "id": row[0],
                "zone_id": row[1],
                "risk_score": row[2],
                "exposure_score": row[3],
                "vulnerability_score": row[4],
                "criticality_score": row[5],
                "priority_score": row[6],
                "priority_band": row[7],
                "priority_rank": row[8],
                "recommended_action": row[9],
                "explanation": row[10],
                "data_quality_flags": row[11],
                "affected_summary": row[12],
                "created_at": row[13].isoformat() if row[13] else None
            })

        return jsonify({
            "success": True,
            "data": priorities
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# IMPACT
# =========================================================

@app.route("/api/impact", methods=["GET"])
def get_impact():

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        # Population
        cur.execute(
            "SELECT COALESCE(SUM(population), 0) FROM villages"
        )

        population_exposed = cur.fetchone()[0]

        population_score = min(
            (population_exposed / 5000) * 100,
            100
        )

        # Villages
        cur.execute(
            "SELECT COUNT(*) FROM villages"
        )

        villages_affected = cur.fetchone()[0]

        village_score = min(
            (villages_affected / 5) * 100,
            100
        )

        # Infrastructure
        cur.execute(
            """
            SELECT
                COUNT(*) FILTER (WHERE asset_type = 'hospital'),
                COUNT(*) FILTER (WHERE asset_type = 'bridge'),
                COUNT(*) FILTER (WHERE asset_type = 'school')
            FROM gis_assets
            """
        )

        hospital_count, bridge_count, school_count = cur.fetchone()

        cur.execute(
            "SELECT COUNT(*) FROM roads"
        )

        road_count = cur.fetchone()[0]

        infrastructure_total = (
            hospital_count +
            bridge_count +
            school_count +
            road_count
        )

        infrastructure_score = min(
            (infrastructure_total / 10) * 100,
            100
        )

        # Field reports
        cur.execute(
            """
            SELECT
                COUNT(*),
                COUNT(*) FILTER (
                    WHERE UPPER(severity) = 'CRITICAL'
                ),
                COUNT(*) FILTER (
                    WHERE verified = TRUE
                )
            FROM field_reports
            """
        )

        report_total, critical_reports, verified_reports = cur.fetchone()

        # Risk zones
        cur.execute(
            """
            SELECT
                COUNT(*),
                COUNT(*) FILTER (
                    WHERE UPPER(risk_level) IN ('CRITICAL', 'VERY HIGH')
                ),
                MAX(risk_score),
                MAX(risk_level)
            FROM risk_zones
            """
        )

        zone_total, critical_zones, maximum_risk_score, maximum_risk_level = cur.fetchone()

        # Active alerts
        cur.execute(
            """
            SELECT COUNT(*)
            FROM alerts
            WHERE status = 'ACTIVE'
            """
        )

        active_alerts = cur.fetchone()[0]

        # Priority results
        cur.execute(
            "SELECT COUNT(*) FROM priority_results"
        )

        priority_results = cur.fetchone()[0]

        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "data": {
                "population_exposed": population_exposed,
                "population_score": round(population_score, 2),

                "villages_affected": villages_affected,
                "village_score": round(village_score, 2),

                "infrastructure": {
                    "hospitals": hospital_count,
                    "bridges": bridge_count,
                    "schools": school_count,
                    "roads": road_count,
                    "total": infrastructure_total
                },

                "infrastructure_score": round(
                    infrastructure_score,
                    2
                ),

                "field_reports": {
                    "total": report_total,
                    "critical": critical_reports,
                    "verified": verified_reports
                },

                "risk_zones": {
                    "total": zone_total,
                    "critical": critical_zones,
                    "maximum_risk_score": maximum_risk_score,
                    "risk_level": maximum_risk_level
                },

                "active_alerts": active_alerts,
                "priority_results": priority_results
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# DASHBOARD
# =========================================================

@app.route("/api/dashboard", methods=["GET"])
def dashboard():

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        # Risk zones
        cur.execute(
            """
            SELECT
                COUNT(*),
                COUNT(*) FILTER (
                    WHERE UPPER(risk_level) = 'CRITICAL'
                ),
                COUNT(*) FILTER (
                    WHERE UPPER(risk_level) = 'VERY HIGH'
                ),
                MAX(risk_score)
            FROM risk_zones
            """
        )

        zone_total, critical_zones, very_high_zones, maximum_risk_score = cur.fetchone()

        # Field reports
        cur.execute(
            """
            SELECT
                COUNT(*),
                COUNT(*) FILTER (
                    WHERE UPPER(severity) = 'CRITICAL'
                )
            FROM field_reports
            """
        )

        report_total, critical_reports = cur.fetchone()

        # Alerts
        cur.execute(
            """
            SELECT COUNT(*)
            FROM alerts
            WHERE status = 'ACTIVE'
            """
        )

        active_alerts = cur.fetchone()[0]

        # Last update
        cur.execute(
            """
            SELECT MAX(created_at)
            FROM field_reports
            """
        )

        last_updated = cur.fetchone()[0]

        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "data": {
                "risk_zones": {
                    "total": zone_total,
                    "critical": critical_zones,
                    "very_high": very_high_zones,
                    "maximum_risk_score": maximum_risk_score
                },

                "field_reports": {
                    "total": report_total,
                    "critical": critical_reports
                },

                "active_alerts": active_alerts,

                "last_updated": (
                    last_updated.isoformat()
                    if last_updated
                    else None
                )
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# EARLY WARNING
# =========================================================

@app.route("/api/warnings", methods=["GET"])
def warnings():

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id,
                name,
                risk_level,
                latitude,
                longitude,
                risk_score,
                rainfall,
                soil_moisture
            FROM risk_zones
            ORDER BY risk_score DESC NULLS LAST
            LIMIT 1
            """
        )

        row = cur.fetchone()

        if not row:

            cur.close()
            conn.close()

            return jsonify({
                "success": True,
                "data": {
                    "warning": False,
                    "warning_message": "No risk zone data available."
                }
            })

        zone_id = row[0]
        zone_name = row[1]
        risk_level = get_risk_level(row[5])
        latitude = row[3]
        longitude = row[4]
        risk_score = row[5]
        rainfall = row[6]
        soil_moisture = row[7]

        cur.execute(
            """
            SELECT COUNT(*)
            FROM alerts
            WHERE status = 'ACTIVE'
            """
        )

        active_alerts = cur.fetchone()[0]

        cur.close()
        conn.close()

        warning = (
            risk_score is not None and
            risk_score >= 50
        )

        if risk_score is not None and risk_score >= 75:

            warning_message = (
                f"Very high landslide risk detected in "
                f"{zone_name}. Immediate attention is required."
            )

            recommended_action = (
                "Deploy inspection team immediately and "
                "prepare for emergency response."
            )

        elif risk_score is not None and risk_score >= 50:

            warning_message = (
                f"High landslide risk detected in "
                f"{zone_name}. Monitoring is required."
            )

            recommended_action = (
                "Increase monitoring and prepare inspection team."
            )

        else:

            warning_message = "No immediate high-risk condition detected."

            recommended_action = "Continue routine monitoring."

        return jsonify({
            "success": True,
            "data": {
                "warning": warning,
                "warning_message": warning_message,
                "zone_id": zone_id,
                "zone_name": zone_name,
                "risk_score": risk_score,
                "risk_level": risk_level,
                "location": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "conditions": {
                    "rainfall_mm": rainfall,
                    "soil_moisture": soil_moisture
                },
                "active_alerts": active_alerts,
                "recommended_action": recommended_action
            }
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# SYNC STATUS
# =========================================================

@app.route("/api/sync/status", methods=["GET"])
def sync_status():

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                COUNT(*),
                COUNT(*) FILTER (
                    WHERE verified = FALSE
                ),
                COUNT(*) FILTER (
                    WHERE verified = TRUE
                ),
                MAX(created_at)
            FROM field_reports
            """
        )

        total_reports, pending_reports, verified_reports, last_report_received = cur.fetchone()

        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "data": {
                "server_online": True,
                "sync_status": "READY",
                "total_reports": total_reports,
                "pending_reports": pending_reports,
                "verified_reports": verified_reports,
                "last_report_received": (
                    last_report_received.isoformat()
                    if last_report_received
                    else None
                )
            }
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# OFFLINE SYNC
# =========================================================

@app.route("/api/sync", methods=["POST"])
def sync_reports():

    try:

        data = request.get_json()

        reports = data.get("reports", [])

        results = []
        synced = 0
        failed = 0

        conn = get_db_connection()
        cur = conn.cursor()

        for index, report in enumerate(reports):

            try:

                cur.execute(
                    """
                    INSERT INTO field_reports (
                        report_type,
                        hazard_type,
                        description,
                        latitude,
                        longitude,
                        severity,
                        weather,
                        image_url,
                        user_id,
                        status,
                        verified,
                        geometry
                    )
                    VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        'PENDING_VERIFICATION',
                        FALSE,
                        CASE
                            WHEN %s IS NOT NULL AND %s IS NOT NULL
                            THEN ST_SetSRID(
                                ST_MakePoint(%s, %s),
                                4326
                            )
                            ELSE NULL
                        END
                    )
                    RETURNING id, created_at
                    """,
                    (
                        report.get("report_type"),
                        report.get("hazard_type"),
                        report.get("description"),
                        report.get("latitude"),
                        report.get("longitude"),
                        report.get("severity"),
                        report.get("weather"),
                        report.get("image_url"),
                        report.get("user_id"),
                        report.get("longitude"),
                        report.get("latitude"),
                        report.get("longitude"),
                        report.get("latitude")
                    )
                )

                result = cur.fetchone()

                report_id = result[0]
                created_at = result[1]

                alert_created = False

                if str(report.get("severity", "")).upper() == "CRITICAL":

                    alert_id = create_critical_report_alert(
                        report_id,
                        report.get("latitude"),
                        report.get("longitude")
                    )

                    if alert_id:
                        alert_created = True

                results.append({
                    "index": index,
                    "server_report_id": report_id,
                    "created_at": created_at.isoformat(),
                    "status": "SYNCED",
                    "automatic_alert_created": alert_created
                })

                synced += 1

            except Exception as report_error:

                results.append({
                    "index": index,
                    "status": "FAILED",
                    "error": str(report_error)
                })

                failed += 1

        conn.commit()

        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Offline reports synchronization completed.",
            "data": {
                "received": len(reports),
                "synced": synced,
                "failed": failed,
                "results": results
            }
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )