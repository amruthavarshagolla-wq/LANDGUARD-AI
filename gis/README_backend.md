# LANDGUARD AI — GIS → Backend Handoff

Everything here has been verified real (not synthetic) and validated against known geography — see individual notes below.

## 1. Set up the database

```bash
psql -U your_user -d your_db -f schema.sql
```

## 2. Load each file into its matching table

Requires `ogr2ogr` (comes with GDAL — most backend/Postgres setups have this; if not, `apt install gdal-bin` or `conda install gdal`).

```bash
# District boundary
ogr2ogr -f PostgreSQL PG:"dbname=your_db user=your_user" east_khasi_hills_boundary.geojson -nln district_boundary -append

# Zones (22,615 features — this is the big static geometry table)
ogr2ogr -f PostgreSQL PG:"dbname=your_db user=your_user" east_khasi_hills_zones_geometry.geojson -nln zones -append

# Villages
ogr2ogr -f PostgreSQL PG:"dbname=your_db user=your_user" east_khasi_hills_villages.geojson -nln villages -append

# Roads (includes bridges — no separate load needed, see note below)
ogr2ogr -f PostgreSQL PG:"dbname=your_db user=your_user" east_khasi_hills_roads.geojson -nln roads -append

# Infrastructure (mixed point/polygon geometry — this is intentional)
ogr2ogr -f PostgreSQL PG:"dbname=your_db user=your_user" east_khasi_hills_infrastructure.geojson -nln infrastructure -append

# Real historical landslide inventory (ground truth)
ogr2ogr -f PostgreSQL PG:"dbname=your_db user=your_user" east_khasi_hills_landslide_inventory.geojson -nln landslide_inventory -append
```

**`zone_features.csv` needs a different approach** since it's a flat table, not geometry:
```bash
psql -U your_user -d your_db -c "\copy zone_features(zone_id,slope_deg,aspect_deg,elevation_m,distance_to_road_m,rainfall_mm,soil_clay_pct,soil_sand_pct,lulc_class,lithology_class) FROM 'east_khasi_hills_zone_features.csv' WITH CSV HEADER"
```

**`east_khasi_hills_bridges.geojson` is included for reference/visual-check only — do NOT load it as a separate table.** A bridge is just a road segment where `bridge = 'T'`; loading it again would create duplicate rows. Query it live instead: `SELECT * FROM roads WHERE bridge = 'T'`.

## 3. What's real vs. what's still missing

| Data | Status |
|---|---|
| District boundary, villages, roads, infrastructure | ✅ Real (OpenStreetMap + QGIS export), verified |
| Zones + slope/aspect/elevation/distance-to-road | ✅ Real (SRTM DEM, computed via Horn's method + real road network) |
| Landslide inventory | ✅ Real (peer-reviewed paper, Badavath et al. 2025, *Sådhanå*) |
| `risk_score` / `risk_category` | ❌ Not in this handoff — comes from the AI/ML teammate's model, written into `risk_predictions` |
| `rainfall_mm`, `soil_clay_pct`, `soil_sand_pct`, `lulc_class`, `lithology_class` in `zone_features` | ❌ NULL for every zone right now — not yet obtained. Rainfall is likely your (backend's) job to refresh periodically from IMD/Open-Meteo; soil/LULC/lithology are outstanding GIS tasks. |

## 4. How the "updatable prediction feed" is supposed to work

The AI/ML teammate's model doesn't overwrite scores — it inserts new rows into `risk_predictions` each time it runs. Always query through the `current_risk` view (defined in `schema.sql`), which gives you only the latest prediction per zone:

```sql
SELECT * FROM current_risk WHERE risk_category IN ('HIGH','VERY_HIGH');
```

## 5. API endpoints this implies (for the frontend)

```
GET /api/zones                     -- static geometry, rarely changes
GET /api/risk-current              -- current_risk view, joined to zone geometry
GET /api/villages
GET /api/roads?bbox=...
GET /api/infrastructure?type=hospital
GET /api/landslide-inventory        -- real historical points, for context/legend
```

Every endpoint should return a GeoJSON `FeatureCollection` — that's the one format used consistently across every file here.

## 6. Known caveats worth knowing before you build on this

- **Roads geometry type is `MULTILINESTRING`, not `LINESTRING`** — some OSM ways are split into multiple disconnected parts. Don't assume single-part lines.
- **Infrastructure geometry is generic (`GEOMETRY`, not `POINT`)** — 39 features are points, 35 are polygons (building footprints). Handle both in any query/rendering code.
- **`zones` and `zone_features` are separate tables on purpose** — geometry is static, features (especially rainfall) will be refreshed independently over time. Don't merge them into one table.
