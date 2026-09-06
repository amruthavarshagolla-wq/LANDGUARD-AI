# LANDGUARD AI — GIS → Frontend Handoff (Leaflet)

Every endpoint below returns a GeoJSON `FeatureCollection` — same format across all layers, so one generic `L.geoJSON()` call pattern works for everything, with a per-layer `style`/`pointToLayer` function.

---

## 1. Risk zones (the main layer — colors the map)

**Endpoint:** `GET /api/risk-current`
Returns zone geometry **already joined** with its latest AI prediction (backend does this join server-side via the `current_risk` view — frontend never has to merge two separate calls).

```json
{
  "type": "Feature",
  "geometry": { "type": "Polygon", "coordinates": [[[91.87,25.37],[91.874,25.37],[91.874,25.374],[91.87,25.374],[91.87,25.37]]] },
  "properties": {
    "zone_id": "EKH_08421",
    "risk_score": 82.4,
    "risk_category": "VERY_HIGH",
    "predicted_at": "2026-09-06T06:00:00Z"
  }
}
```

**Color mapping (confirmed thresholds from the AI/ML teammate) — use these exact colors and cutoffs everywhere in the app for consistency:**

| Category | Score range | Color |
|---|---|---|
| LOW | 0–24.99 | `#2ecc71` (green) |
| MODERATE | 25–49.99 | `#f1c40f` (yellow) |
| HIGH | 50–74.99 | `#e67e22` (orange) |
| VERY_HIGH | 75–100 | `#e74c3c` (red) |

```js
const RISK_COLORS = {
  LOW: '#2ecc71',
  MODERATE: '#f1c40f',
  HIGH: '#e67e22',
  VERY_HIGH: '#e74c3c'
};

L.geoJSON(riskZoneData, {
  style: feature => ({
    fillColor: RISK_COLORS[feature.properties.risk_category],
    fillOpacity: 0.6,
    color: '#333',
    weight: 0.5
  }),
  onEachFeature: (feature, layer) => {
    layer.bindPopup(`Zone ${feature.properties.zone_id}<br>Risk: ${feature.properties.risk_category} (${feature.properties.risk_score})`);
  }
}).addTo(map);
```

**Performance warning — read before wiring this up:** there are **22,615 zones** covering the full district. Rendering all of them at once in Leaflet will be slow and visually noisy (most are LOW/MODERATE and not the point of the demo). Recommended approach:

- For the main demo view, request only the zones that matter: `GET /api/risk-current?category=HIGH,VERY_HIGH` (ask backend to support this filter — it's a simple `WHERE risk_category IN (...)` on the existing view).
- Only load the full 22,615-zone set if the user explicitly zooms in or toggles a "show all zones" option.

---

## 2. Villages

**Endpoint:** `GET /api/villages`

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [91.893, 25.578] },
  "properties": {
    "osm_id": 245702605,
    "name": "Sohra (Cherrapunji)",
    "population": 5000,
    "fclass": "village"
  }
}
```

```js
L.geoJSON(villageData, {
  pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 4, color: '#3498db', fillOpacity: 0.8 }),
  onEachFeature: (feature, layer) => {
    layer.bindPopup(`${feature.properties.name}<br>Population: ${feature.properties.population}`);
  }
}).addTo(map);
```

Note: `population` can be `0` or missing for some smaller hamlets — that's real OSM data, not a loading error. Handle `null`/`0` gracefully in any popup text (e.g. "Population: not recorded" instead of "Population: 0" if the value is genuinely absent).

---

## 3. Roads

**Endpoint:** `GET /api/roads?bbox=91.354,25.124,92.138,25.674` (always pass a bbox — 13,685 segments is too much to load unfiltered on every pan/zoom)

```json
{
  "type": "Feature",
  "geometry": { "type": "MultiLineString", "coordinates": [[[91.86,25.58],[91.861,25.581]]] },
  "properties": {
    "id": "way/44768992",
    "name": null,
    "road_class": "secondary",
    "surface": "asphalt",
    "bridge": null,
    "tunnel": null
  }
}
```

**Important: geometry type is `MultiLineString`, not `LineString`, even for simple roads.** Leaflet's `L.geoJSON()` handles this automatically, but if you write any custom coordinate-parsing code, don't assume single-part lines.

`name` is `null` for most residential roads (real OSM data — most small roads just aren't named). Don't show "null" as text in any UI; fall back to the `road_class` instead, e.g. "Unnamed residential road."

```js
const ROAD_STYLES = {
  trunk: { color: '#c0392b', weight: 4 },
  primary: { color: '#e67e22', weight: 3 },
  secondary: { color: '#f39c12', weight: 2.5 },
  tertiary: { color: '#95a5a6', weight: 2 },
  residential: { color: '#bdc3c7', weight: 1 },
  unclassified: { color: '#bdc3c7', weight: 1 }
};

L.geoJSON(roadData, {
  style: feature => ROAD_STYLES[feature.properties.road_class] || { color: '#999', weight: 1 }
}).addTo(map);
```

**Bridges are not a separate endpoint.** Filter client-side or ask backend for `?bridge=T` — a bridge is just a road where `properties.bridge === 'T'`.

---

## 4. Infrastructure (hospitals & schools)

**Endpoint:** `GET /api/infrastructure?type=hospital` or `?type=school`

**Important: mixed geometry — some features are `Point`, some are `Polygon`** (building footprints for bigger campuses). Your rendering code must handle both:

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [91.883, 25.578] },
  "properties": { "id": 123456, "name": "Civil Hospital Shillong", "type": "hospital", "geometry_source": "point" }
}
```
```json
{
  "type": "Feature",
  "geometry": { "type": "Polygon", "coordinates": [[[91.88,25.57],[91.881,25.57],[91.881,25.571],[91.88,25.571],[91.88,25.57]]] },
  "properties": { "id": 789012, "name": null, "type": "school", "geometry_source": "building_footprint" }
}
```

```js
const ICONS = {
  hospital: L.icon({ iconUrl: '/icons/hospital.png', iconSize: [24,24] }),
  school:   L.icon({ iconUrl: '/icons/school.png', iconSize: [24,24] })
};

L.geoJSON(infraData, {
  pointToLayer: (feature, latlng) => L.marker(latlng, { icon: ICONS[feature.properties.type] }),
  style: feature => ({ color: feature.properties.type === 'hospital' ? '#e74c3c' : '#3498db', fillOpacity: 0.4 }), // used only for Polygon features
  onEachFeature: (feature, layer) => {
    const name = feature.properties.name || `Unnamed ${feature.properties.type}`;
    layer.bindPopup(name);
  }
}).addTo(map);
```

`name` is `null` for many features (roughly half) — always fall back to the `type` field in any popup/label, same pattern as roads.

---

## 5. Real historical landslide inventory (context/legend layer)

**Endpoint:** `GET /api/landslide-inventory`

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [91.866, 25.577] },
  "properties": {
    "id": 7,
    "fatalities": 8,
    "injuries": 1,
    "size": "Small",
    "verification_status": "Verified",
    "triggering_factor": "Continuous rain",
    "classification": "Natural",
    "source": "Field visit"
  }
}
```

Suggested rendering: a distinct marker style (e.g. a black "X" icon, not blended with any risk color) since this is historical ground-truth, not a live prediction. Good for a legend entry like "Past landslide event (verified)."

---

## 6. Field reports (populated live by Module 5's app — expect this to be empty/sparse during early demos)

**Endpoint:** `GET /api/field-reports`

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [91.90, 25.40] },
  "properties": {
    "id": 12,
    "reporter_type": "citizen",
    "description": "Crack observed on retaining wall",
    "photo_url": "https://.../photo12.jpg",
    "reported_at": "2026-09-06T05:40:00Z"
  }
}
```

---

## Summary table for quick reference

| Layer | Endpoint | Geometry type(s) | Key property for styling |
|---|---|---|---|
| Risk zones | `/api/risk-current` | Polygon | `risk_category` |
| Villages | `/api/villages` | Point | `population` |
| Roads | `/api/roads?bbox=...` | **MultiLineString** | `road_class`, `bridge` |
| Infrastructure | `/api/infrastructure?type=...` | **Point or Polygon** | `type` |
| Landslide inventory | `/api/landslide-inventory` | Point | `verification_status` |
| Field reports | `/api/field-reports` | Point | `reported_at` |

**Three things every layer shares:** always EPSG:4326 (plain lat/lon, no reprojection needed), always a `FeatureCollection`, and `name` fields are frequently `null` — build every popup/label with a fallback, not an assumption that `name` exists.
