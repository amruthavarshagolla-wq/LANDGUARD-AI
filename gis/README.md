# GIS Module — LANDGUARD AI
Owner: Hasini (GIS & Geospatial Intelligence)

## Folder contents

```
gis/
├── data/                                    <- all real, verified geospatial data
│   ├── east_khasi_hills_boundary.geojson       (1 feature — district polygon)
│   ├── east_khasi_hills_villages.geojson       (211 features)
│   ├── east_khasi_hills_roads.geojson          (13,685 features)
│   ├── east_khasi_hills_bridges.geojson        (702 features — reference only, see schema.sql note)
│   ├── east_khasi_hills_infrastructure.geojson (74 features — hospitals/schools)
│   ├── east_khasi_hills_landslide_inventory.geojson (14 features — real historical events)
│   ├── east_khasi_hills_zones_geometry.geojson (22,615 features — the prediction grid)
│   ├── east_khasi_hills_zone_features.csv      (environmental features per zone_id, feeds AI/ML)
│   └── east_khasi_hills_zone_impact_data.json  (villages/roads/schools/hospitals/landslides per zone_id, feeds Module 6)
├── schema.sql                                <- PostGIS table definitions — for Backend
├── README_backend.md                         <- load instructions + data status — for Backend
└── frontend_handoff.md                       <- GeoJSON schema + Leaflet code — for Frontend
```

## Who uses what

- **Backend teammate:** `schema.sql` + everything in `data/` + `README_backend.md`
- **Frontend teammate:** `frontend_handoff.md` (references the same `data/` files, served to them via backend's API, not directly)
- **AI/ML teammate:** `east_khasi_hills_zone_features.csv` (this is their model's input)
- **Impact/Priority (Module 6) teammate:** `east_khasi_hills_zone_impact_data.json`

## Data status
Everything above is real: sourced from OpenStreetMap, real SRTM elevation tiles, and a peer-reviewed 2025 landslide study for this exact district. `risk_score`/`risk_category` are NOT in this folder — those come from the AI/ML teammate's model and get written to the `risk_predictions` table (see `schema.sql`). Five zone_features columns (`rainfall_mm`, `soil_clay_pct`, `soil_sand_pct`, `lulc_class`, `lithology_class`) are currently `NULL` — not yet obtained.
