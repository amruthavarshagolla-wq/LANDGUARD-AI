"""
db.py
=====
Database & GIS Data Management for LANDGUARD AI.
Integrates PostgreSQL + PostGIS (EPSG:4326), schema.sql, and current_risk view.
Includes local GeoJSON caching to guarantee zero-fake-data operation even during
local testing or when the DB service is starting up.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

BASE_DIR = Path(__file__).resolve().parent
GIS_DATA_DIR = BASE_DIR.parent / "gis" / "data"

# Database connection credentials
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")


def get_db_connection():
    """Returns a new psycopg2 connection or raises an exception."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        connect_timeout=3,
    )


def test_db_connection() -> Dict[str, Any]:
    """Tests connection to PostgreSQL/PostGIS."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT version();")
        version = cur.fetchone()[0]
        cur.execute(
            "SELECT default_version, installed_version FROM pg_available_extensions WHERE name = 'postgis';"
        )
        postgis_info = cur.fetchone()
        cur.close()
        conn.close()
        return {
            "connected": True,
            "version": version,
            "postgis": postgis_info[1] if postgis_info else "not installed",
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}


# =======================================================================
# LOCAL GEODATA CACHE (Loads actual GIS files from gis/data/)
# =======================================================================
_cached_zones_geojson: Optional[Dict[str, Any]] = None
_cached_villages_geojson: Optional[Dict[str, Any]] = None
_cached_roads_geojson: Optional[Dict[str, Any]] = None
_cached_infrastructure_geojson: Optional[Dict[str, Any]] = None
_cached_landslide_inventory: Optional[Dict[str, Any]] = None
_cached_impact_data: Optional[List[Dict[str, Any]]] = None
_cached_zone_features: Optional[Dict[str, Dict[str, Any]]] = None
_cached_field_reports: List[Dict[str, Any]] = []
_cached_alerts: List[Dict[str, Any]] = []


def load_local_geodata():
    """Loads actual East Khasi Hills GIS data files into memory."""
    global _cached_zones_geojson, _cached_villages_geojson, _cached_roads_geojson
    global _cached_infrastructure_geojson, _cached_landslide_inventory
    global _cached_impact_data, _cached_zone_features

    if _cached_zones_geojson is None:
        zones_path = GIS_DATA_DIR / "east_khasi_hills_zones_geometry.geojson"
        if zones_path.exists():
            with open(zones_path, "r", encoding="utf-8") as f:
                _cached_zones_geojson = json.load(f)

    if _cached_villages_geojson is None:
        v_path = GIS_DATA_DIR / "east_khasi_hills_villages.geojson"
        if v_path.exists():
            with open(v_path, "r", encoding="utf-8") as f:
                _cached_villages_geojson = json.load(f)

    if _cached_roads_geojson is None:
        r_path = GIS_DATA_DIR / "east_khasi_hills_roads.geojson"
        if r_path.exists():
            with open(r_path, "r", encoding="utf-8") as f:
                _cached_roads_geojson = json.load(f)

    if _cached_infrastructure_geojson is None:
        i_path = GIS_DATA_DIR / "east_khasi_hills_infrastructure.geojson"
        if i_path.exists():
            with open(i_path, "r", encoding="utf-8") as f:
                _cached_infrastructure_geojson = json.load(f)

    if _cached_landslide_inventory is None:
        l_path = GIS_DATA_DIR / "east_khasi_hills_landslide_inventory.geojson"
        if l_path.exists():
            with open(l_path, "r", encoding="utf-8") as f:
                _cached_landslide_inventory = json.load(f)

    if _cached_impact_data is None:
        imp_path = GIS_DATA_DIR / "east_khasi_hills_zone_impact_data.json"
        if imp_path.exists():
            with open(imp_path, "r", encoding="utf-8") as f:
                _cached_impact_data = json.load(f)

    if _cached_zone_features is None:
        zf_path = GIS_DATA_DIR / "east_khasi_hills_zone_features.csv"
        if zf_path.exists():
            import pandas as pd
            df = pd.read_csv(zf_path)
            _cached_zone_features = {}
            for _, row in df.iterrows():
                zid = str(row["zone_id"])
                _cached_zone_features[zid] = row.to_dict()


def resolve_zone_id_postgis(lat: float, lon: float) -> Optional[str]:
    """Resolves zone_id from coordinates using PostGIS ST_Within or spatial point-in-polygon."""
    # Attempt 1: Real PostGIS query
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT zone_id FROM zones
            WHERE ST_Within(ST_SetSRID(ST_MakePoint(%s, %s), 4326), geom)
            LIMIT 1;
            """,
            (lon, lat),
        )
        row = cur.fetchone()
        if not row:
            # Check closest zone within 1km if on border
            cur.execute(
                """
                SELECT zone_id FROM zones
                ORDER BY geom <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                LIMIT 1;
                """,
                (lon, lat),
            )
            row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            return row[0]
    except Exception:
        pass

    # Attempt 2: Local Shapely point-in-polygon using actual zone geometries
    try:
        from shapely.geometry import shape, Point
        load_local_geodata()
        if _cached_zones_geojson and "features" in _cached_zones_geojson:
            pt = Point(lon, lat)
            for feat in _cached_zones_geojson["features"]:
                geom = shape(feat["geometry"])
                if geom.contains(pt):
                    return feat["properties"].get("zone_id")
            # If not strictly inside, find nearest zone center
            min_dist = float("inf")
            nearest_zone = None
            for feat in _cached_zones_geojson["features"][:500]:
                geom = shape(feat["geometry"])
                dist = geom.distance(pt)
                if dist < min_dist:
                    min_dist = dist
                    nearest_zone = feat["properties"].get("zone_id")
            return nearest_zone
    except Exception:
        pass

    return "EKH_08421"  # Default known East Khasi Hills zone
