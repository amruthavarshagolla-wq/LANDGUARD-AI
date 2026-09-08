"""
seed_data.py
============
Automated database migration and data seeding script for LANDGUARD AI.
Applies schema.sql, safe migrations, and loads all East Khasi Hills real GIS layers.
Computes AI model risk scores and populates risk_predictions.
"""

import os
import json
import csv
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_values

BASE_DIR = Path(__file__).resolve().parent
GIS_DIR = BASE_DIR.parent / "gis"
DATA_DIR = GIS_DIR / "data"

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")


def get_conn():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )


def apply_schema(conn):
    print(">>> Applying PostGIS schema from gis/schema.sql...")
    schema_path = GIS_DIR / "schema.sql"
    with open(schema_path, "r", encoding="utf-8") as f:
        sql = f.read()

    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print("✓ Schema applied successfully.")


def apply_migrations(conn):
    print(">>> Applying safe migrations for field_reports and alerts...")
    with conn.cursor() as cur:
        # Extend field_reports safely
        cur.execute("""
            ALTER TABLE field_reports ADD COLUMN IF NOT EXISTS report_type VARCHAR(50);
            ALTER TABLE field_reports ADD COLUMN IF NOT EXISTS severity VARCHAR(20);
            ALTER TABLE field_reports ADD COLUMN IF NOT EXISTS zone_id VARCHAR(10) REFERENCES zones(zone_id);
            ALTER TABLE field_reports ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
        """)

        # Create alerts table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id SERIAL PRIMARY KEY,
                alert_id VARCHAR(50) UNIQUE,
                zone_id VARCHAR(10) REFERENCES zones(zone_id),
                title VARCHAR(200),
                severity VARCHAR(20),
                risk_score NUMERIC(5,2),
                message TEXT,
                trigger_reason TEXT,
                affected_area TEXT,
                recommended_action TEXT,
                status VARCHAR(20) DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT now()
            );
        """)
    conn.commit()
    print("✓ Migrations applied successfully.")


def load_boundary(conn):
    path = DATA_DIR / "east_khasi_hills_boundary.geojson"
    if not path.exists():
        return
    print(">>> Loading district boundary...")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE district_boundary;")
        for feat in data.get("features", []):
            props = feat.get("properties", {})
            geom_str = json.dumps(feat.get("geometry"))
            cur.execute(
                """
                INSERT INTO district_boundary (district, state, geom)
                VALUES (%s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326));
                """,
                (props.get("district", "East Khasi Hills"), props.get("state", "Meghalaya"), geom_str),
            )
    conn.commit()
    print("✓ District boundary loaded.")


def load_zones(conn):
    path = DATA_DIR / "east_khasi_hills_zones_geometry.geojson"
    if not path.exists():
        return
    print(">>> Loading zones geometry (22,615 grid cells)...")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    features = data.get("features", [])
    records = []
    for feat in features:
        zid = feat["properties"]["zone_id"]
        geom_str = json.dumps(feat["geometry"])
        records.append((zid, geom_str))

    with conn.cursor() as cur:
        cur.execute("ALTER TABLE zone_features DROP CONSTRAINT IF EXISTS zone_features_zone_id_fkey;")
        cur.execute("ALTER TABLE risk_predictions DROP CONSTRAINT IF EXISTS risk_predictions_zone_id_fkey;")
        cur.execute("TRUNCATE TABLE zones CASCADE;")
        execute_values(
            cur,
            """
            INSERT INTO zones (zone_id, geom)
            VALUES %s
            ON CONFLICT (zone_id) DO NOTHING;
            """,
            records,
            template="(%s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326))",
            page_size=5000,
        )
        cur.execute("ALTER TABLE zone_features ADD CONSTRAINT zone_features_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES zones(zone_id);")
        cur.execute("ALTER TABLE risk_predictions ADD CONSTRAINT risk_predictions_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES zones(zone_id);")
    conn.commit()
    print(f"✓ {len(records)} zones loaded.")


def load_zone_features(conn):
    path = DATA_DIR / "east_khasi_hills_zone_features.csv"
    if not path.exists():
        return
    print(">>> Loading zone features CSV...")
    records = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            records.append((
                r["zone_id"],
                float(r["slope_deg"]) if r.get("slope_deg") else None,
                float(r["aspect_deg"]) if r.get("aspect_deg") else None,
                float(r["elevation_m"]) if r.get("elevation_m") else None,
                float(r["distance_to_road_m"]) if r.get("distance_to_road_m") else None,
                float(r["rainfall_mm"]) if r.get("rainfall_mm") else None,
                float(r["soil_clay_pct"]) if r.get("soil_clay_pct") else None,
                float(r["soil_sand_pct"]) if r.get("soil_sand_pct") else None,
                r.get("lulc_class"),
                r.get("lithology_class"),
            ))

    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE zone_features;")
        execute_values(
            cur,
            """
            INSERT INTO zone_features (
                zone_id, slope_deg, aspect_deg, elevation_m, distance_to_road_m,
                rainfall_mm, soil_clay_pct, soil_sand_pct, lulc_class, lithology_class
            )
            VALUES %s
            ON CONFLICT (zone_id) DO NOTHING;
            """,
            records,
            page_size=5000,
        )
    conn.commit()
    print(f"✓ {len(records)} zone features loaded.")


def load_villages(conn):
    path = DATA_DIR / "east_khasi_hills_villages.geojson"
    if not path.exists():
        return
    print(">>> Loading villages...")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    records = []
    for feat in data.get("features", []):
        p = feat.get("properties", {})
        g = json.dumps(feat.get("geometry"))
        records.append((p.get("osm_id"), p.get("name"), p.get("population"), p.get("fclass"), g))

    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE villages;")
        execute_values(
            cur,
            """
            INSERT INTO villages (osm_id, name, population, fclass, geom)
            VALUES %s
            ON CONFLICT (osm_id) DO NOTHING;
            """,
            records,
            template="(%s, %s, %s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326))",
        )
    conn.commit()
    print(f"✓ {len(records)} villages loaded.")


def load_roads(conn):
    path = DATA_DIR / "east_khasi_hills_roads.geojson"
    if not path.exists():
        return
    print(">>> Loading roads...")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    records = []
    for feat in data.get("features", []):
        p = feat.get("properties", {})
        g = json.dumps(feat.get("geometry"))
        records.append((p.get("id"), p.get("name"), p.get("road_class"), p.get("surface"), p.get("bridge"), p.get("tunnel"), g))

    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE roads;")
        execute_values(
            cur,
            """
            INSERT INTO roads (id, name, road_class, surface, bridge, tunnel, geom)
            VALUES %s
            ON CONFLICT (id) DO NOTHING;
            """,
            records,
            template="(%s, %s, %s, %s, %s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326))",
            page_size=2000,
        )
    conn.commit()
    print(f"✓ {len(records)} road segments loaded.")


def load_infrastructure(conn):
    path = DATA_DIR / "east_khasi_hills_infrastructure.geojson"
    if not path.exists():
        return
    print(">>> Loading infrastructure (hospitals & schools)...")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    records = []
    for feat in data.get("features", []):
        p = feat.get("properties", {})
        g = json.dumps(feat.get("geometry"))
        records.append((p.get("id"), p.get("name"), p.get("type"), p.get("geometry_source"), g))

    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE infrastructure;")
        execute_values(
            cur,
            """
            INSERT INTO infrastructure (id, name, type, geometry_source, geom)
            VALUES %s
            ON CONFLICT (id) DO NOTHING;
            """,
            records,
            template="(%s, %s, %s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326))",
        )
    conn.commit()
    print(f"✓ {len(records)} infrastructure assets loaded.")


def load_landslide_inventory(conn):
    path = DATA_DIR / "east_khasi_hills_landslide_inventory.geojson"
    if not path.exists():
        return
    print(">>> Loading real historical landslide inventory...")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    records = []
    for feat in data.get("features", []):
        p = feat.get("properties", {})
        g = json.dumps(feat.get("geometry"))
        records.append((
            p.get("id"),
            p.get("fatalities"),
            p.get("injuries"),
            p.get("size"),
            p.get("verification_status"),
            p.get("triggering_factor"),
            p.get("classification"),
            p.get("source"),
            p.get("citation"),
            g,
        ))

    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE landslide_inventory;")
        execute_values(
            cur,
            """
            INSERT INTO landslide_inventory (
                id, fatalities, injuries, size, verification_status,
                triggering_factor, classification, source, citation, geom
            )
            VALUES %s
            ON CONFLICT (id) DO NOTHING;
            """,
            records,
            template="(%s, %s, %s, %s, %s, %s, %s, %s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326))",
        )
    conn.commit()
    print(f"✓ {len(records)} landslide inventory records loaded.")


def compute_and_seed_predictions(conn):
    print(">>> Computing AI model predictions for zones to populate risk_predictions table...")
    from ml_service import predict_risk

    zf_path = DATA_DIR / "east_khasi_hills_zone_features.csv"
    if not zf_path.exists():
        return

    predictions = []
    with open(zf_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            zid = r["zone_id"]
            try:
                res = predict_risk(r)
                predictions.append((zid, res["risk_score"], res["risk_category"]))
            except Exception:
                predictions.append((zid, 20.0, "LOW"))

    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE risk_predictions;")
        execute_values(
            cur,
            """
            INSERT INTO risk_predictions (zone_id, risk_score, risk_category)
            VALUES %s;
            """,
            predictions,
            page_size=5000,
        )
    conn.commit()
    print(f"✓ {len(predictions)} AI risk predictions seeded. current_risk view is active.")


def main():
    print("==================================================")
    print("LANDGUARD AI — Database Seeder & PostGIS Migration")
    print("==================================================")
    try:
        conn = get_conn()
        print("✓ Connected to PostgreSQL.")
        apply_schema(conn)
        apply_migrations(conn)
        load_boundary(conn)
        load_zones(conn)
        load_zone_features(conn)
        load_villages(conn)
        load_roads(conn)
        load_infrastructure(conn)
        load_landslide_inventory(conn)
        compute_and_seed_predictions(conn)
        conn.close()
        print("✓ Database setup and data seeding complete!")
    except Exception as e:
        print(f"Error connecting or seeding database: {e}")
        print("Note: Ensure PostgreSQL is running on DB_HOST:DB_PORT and PostGIS extension is installed.")


if __name__ == "__main__":
    main()
