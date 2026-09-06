-- ============================================================
-- LANDGUARD AI — PostGIS schema
-- Prepared by: GIS module (Hasini)
-- All geometry in EPSG:4326 (WGS84) — matches GeoJSON/Leaflet directly
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ----------------------------------------------------------
-- District boundary (context only, rarely queried directly)
-- ----------------------------------------------------------
CREATE TABLE district_boundary (
    id SERIAL PRIMARY KEY,
    district VARCHAR(100),
    state VARCHAR(100),
    geom GEOMETRY(POLYGON, 4326)
);

-- ----------------------------------------------------------
-- Fixed prediction zones: 335m x 370m grid cells covering the
-- WHOLE district. Every zone exists regardless of current risk —
-- risk_score/category live separately in risk_predictions.
-- Zone geometry never changes; treat this table as static.
-- ----------------------------------------------------------
CREATE TABLE zones (
    zone_id VARCHAR(10) PRIMARY KEY,     -- e.g. 'EKH_00001'
    geom GEOMETRY(POLYGON, 4326) NOT NULL
);
CREATE INDEX zones_geom_idx ON zones USING GIST (geom);

-- ----------------------------------------------------------
-- Environmental features per zone — this is what feeds the AI model.
-- One row per zone. Columns that are NULL below are NOT YET AVAILABLE
-- (rainfall, soil, LULC, lithology) — see README for what's missing.
-- ----------------------------------------------------------
CREATE TABLE zone_features (
    zone_id VARCHAR(10) PRIMARY KEY REFERENCES zones(zone_id),
    slope_deg NUMERIC(5,2),
    aspect_deg NUMERIC(5,1),
    elevation_m NUMERIC(7,1),
    distance_to_road_m NUMERIC(8,1),
    rainfall_mm NUMERIC(6,1),          -- NULL for now — dynamic, likely backend's job to refresh
    soil_clay_pct NUMERIC(5,2),        -- NULL for now — not yet obtained
    soil_sand_pct NUMERIC(5,2),        -- NULL for now — not yet obtained
    lulc_class VARCHAR(50),            -- NULL for now — not yet obtained
    lithology_class VARCHAR(50),       -- NULL for now — not yet obtained
    updated_at TIMESTAMP DEFAULT now()
);

-- ----------------------------------------------------------
-- AI model output. APPEND-ONLY (never UPDATE/overwrite a row) so
-- you keep a history of predictions over time — matches the
-- "updatable prediction feed" design the AI/ML teammate specified.
-- ----------------------------------------------------------
CREATE TABLE risk_predictions (
    id SERIAL PRIMARY KEY,
    zone_id VARCHAR(10) REFERENCES zones(zone_id),
    risk_score NUMERIC(5,2) CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_category VARCHAR(20) CHECK (risk_category IN ('LOW','MODERATE','HIGH','VERY_HIGH')),
    predicted_at TIMESTAMP DEFAULT now()
);
CREATE INDEX risk_predictions_zone_idx ON risk_predictions(zone_id);
CREATE INDEX risk_predictions_time_idx ON risk_predictions(predicted_at);

-- Handy view: the CURRENT (most recent) prediction per zone —
-- this is what the map/API should actually query, not the raw table.
CREATE VIEW current_risk AS
SELECT DISTINCT ON (zone_id) zone_id, risk_score, risk_category, predicted_at
FROM risk_predictions
ORDER BY zone_id, predicted_at DESC;

-- ----------------------------------------------------------
-- Villages / settlements
-- ----------------------------------------------------------
CREATE TABLE villages (
    osm_id BIGINT PRIMARY KEY,
    name VARCHAR(150),
    population INTEGER,
    fclass VARCHAR(30),                -- village / hamlet / town / suburb / city
    geom GEOMETRY(POINT, 4326)
);
CREATE INDEX villages_geom_idx ON villages USING GIST (geom);

-- ----------------------------------------------------------
-- Roads. Bridges are NOT a separate table — they're just roads
-- where bridge = 'T'. Query "WHERE bridge = 'T'" instead of joining
-- another table.
-- ----------------------------------------------------------
CREATE TABLE roads (
    id VARCHAR(30) PRIMARY KEY,        -- OSM way id, e.g. 'way/44768992'
    name VARCHAR(150),
    road_class VARCHAR(30),            -- trunk / primary / secondary / tertiary / residential / etc
    surface VARCHAR(30),
    bridge VARCHAR(1),                 -- 'T' or NULL
    tunnel VARCHAR(1),
    geom GEOMETRY(MULTILINESTRING, 4326)
);
CREATE INDEX roads_geom_idx ON roads USING GIST (geom);

-- ----------------------------------------------------------
-- Infrastructure — IMPORTANT: mixed geometry. Some hospitals/schools
-- are mapped as points, some as building-footprint polygons in OSM.
-- Generic GEOMETRY column (not typed to POINT) is deliberate, not a bug.
-- ----------------------------------------------------------
CREATE TABLE infrastructure (
    id BIGINT PRIMARY KEY,
    name VARCHAR(150),
    type VARCHAR(30),                  -- 'hospital' or 'school'
    geometry_source VARCHAR(30),       -- 'point' or 'building_footprint'
    geom GEOMETRY(GEOMETRY, 4326)
);
CREATE INDEX infrastructure_geom_idx ON infrastructure USING GIST (geom);

-- ----------------------------------------------------------
-- Real historical landslide inventory — ground truth for AI model
-- training/validation. Source: peer-reviewed paper (see citation column).
-- ----------------------------------------------------------
CREATE TABLE landslide_inventory (
    id SERIAL PRIMARY KEY,
    fatalities INTEGER,
    injuries INTEGER,
    size VARCHAR(20),
    verification_status VARCHAR(20),   -- 'Verified' or 'Not Verified'
    triggering_factor VARCHAR(50),
    classification VARCHAR(20),        -- Natural / Man-made / Combined
    source VARCHAR(50),
    citation TEXT,
    geom GEOMETRY(POINT, 4326)
);
CREATE INDEX landslide_geom_idx ON landslide_inventory USING GIST (geom);

-- ----------------------------------------------------------
-- Field reports — populated LIVE by the field-reporting app (Module 5),
-- not by the GIS module. Table defined here so the schema is complete.
-- ----------------------------------------------------------
CREATE TABLE field_reports (
    id SERIAL PRIMARY KEY,
    reporter_type VARCHAR(20),
    description TEXT,
    photo_url TEXT,
    reported_at TIMESTAMP DEFAULT now(),
    geom GEOMETRY(POINT, 4326)
);
CREATE INDEX field_reports_geom_idx ON field_reports USING GIST (geom);


-- ============================================================
-- LIVE SPATIAL QUERIES — use these instead of any precomputed
-- "in_risk_zone" flag, since risk scores update over time and a
-- static flag would go stale. Module 6 (Impact/Priority) should
-- build on exactly these patterns.
-- ============================================================

-- Villages currently inside a HIGH or VERY_HIGH risk zone:
-- SELECT v.* FROM villages v
-- JOIN zones z ON ST_Within(v.geom, z.geom)
-- JOIN current_risk cr ON cr.zone_id = z.zone_id
-- WHERE cr.risk_category IN ('HIGH','VERY_HIGH');

-- Roads currently intersecting a HIGH or VERY_HIGH risk zone:
-- SELECT r.* FROM roads r
-- JOIN zones z ON ST_Intersects(r.geom, z.geom)
-- JOIN current_risk cr ON cr.zone_id = z.zone_id
-- WHERE cr.risk_category IN ('HIGH','VERY_HIGH');

-- Infrastructure within 2km of a current HIGH/VERY_HIGH risk zone:
-- SELECT i.* FROM infrastructure i, zones z
-- JOIN current_risk cr ON cr.zone_id = z.zone_id
-- WHERE cr.risk_category IN ('HIGH','VERY_HIGH')
-- AND ST_DWithin(i.geom::geography, z.geom::geography, 2000);
