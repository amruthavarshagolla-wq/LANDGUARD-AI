# LANDGUARD AI — Module 6: Impact, Priority & Response Intelligence

**Owner:** Jahnavi
**Status:** Core logic complete and tested. Integration-ready pending real data from AI/GIS/Backend teammates (see "Known integration dependencies" below).

## 1. What this module does

Takes AI risk predictions + GIS exposure data (+ optional field reports) and
answers: **"Among all risky zones, which should authorities act on first,
and what should they do?"**

## 2. Responsibility boundary

This module owns:
```
AI Risk + GIS Exposure -> Exposure -> Vulnerability -> Criticality
-> Priority Score -> Ranking -> Recommended Action -> Explanation -> Output
```

This module does **NOT** implement: the ML prediction model, GIS spatial
processing/zoning, the backend API, PostgreSQL/PostGIS storage,
authentication, the frontend dashboard, or the field-reporting app. Those
belong to other team members.

## 3. Required input structure — `run_pipeline(data)`

```python
from src.pipeline import run_pipeline

data = {
    "risk_data": [ ... ],       # from AI/ML module
    "gis_data": [ ... ],        # from GIS module
    "field_reports": [ ... ],   # optional, from Field Reporting module
}
results = run_pipeline(data)    # -> list of dicts, sorted by priority_rank
```

All three keys may be omitted or empty; missing data is surfaced via
`data_quality_flags` in the output, not a crash.

### 3a. AI input contract (confirmed)

```json
{
  "zone_id": "EKH_001",
  "risk_score": 82.4,
  "risk_category": "Very High",
  "latitude": 25.55,
  "longitude": 91.88,
  "prediction_factors": {"slope_deg": 34.2, "rainfall_mm_day": 9.8}
}
```
Only `zone_id` and `risk_score` are read by this module's scoring logic.
`risk_category`, `latitude`, `longitude`, `prediction_factors` are accepted
and safely ignored — confirmed via direct code inspection, no adapter
needed.

**Known limitation:** the AI/ML team's zone-level prediction-grid stage
(`environmental features -> model -> zone_id + risk_score`) is still under
development. This module is ready to receive that output whenever it
lands; it cannot be tested against real predictions until then.

### 3b. GIS input contract (confirmed real format from Hasini)

```json
{
  "zone_id": "EKH_001",
  "population_exposed": 500,
  "villages": ["Village A"],
  "roads": [488213, 488214],
  "bridges": [990011],
  "schools": ["Govt High School"],
  "hospitals": [],
  "historical_landslide_count": 0
}
```

Confirmed real-world data density (335m x 370m zone grid, 22,615 zones
total): only 204 zones contain a village, 40 contain a school, 19 contain a
hospital, and 13/14 historical events matched into a zone. **Zeros/empty
lists are the normal case for most zones, not an error** — this module
treats them accordingly and does not raise a false data-quality flag for
legitimate sparse data.

This module accepts `roads`/`bridges` as either plain OSM way-ID scalars
(Hasini's confirmed format, shown above) or as dicts with `only_access`/
`alternate_route_exists` flags (this module's richer internal schema, used
in the bundled sample data) — both work without crashing.
Similarly, `schools`/`hospitals` are accepted as name lists (confirmed real
format), plain integers, or `{"names": [...], "count": N}` dict wrappers.

**Known limitation — accessibility/topology:** Hasini's current GIS output
has flat road/bridge line segments, not a road-network topology graph, so
`only_access` and `alternate_route_exists` are **not currently available**.
This module does **not** invent these values. When topology data is absent,
vulnerability scoring uses the safe, conservative-LOW default (never a
falsely inflated priority from guessed data) and raises an explicit
`accessibility_topology_unavailable` flag so the dashboard/backend knows
accessibility was not actually assessed for that zone — building the real
network-topology accessibility check is a known follow-on task, not part of
this MVP.

### 3c. Field report contract (confirmed real format from Field Reporting)

```json
{
  "report_id": 101,
  "zone_id": "ZONE_05",
  "report_type": "LANDSLIDE",
  "description": "Landslide material blocking part of the road",
  "latitude": 20.123456,
  "longitude": 85.456789,
  "severity": "HIGH",
  "verified": false,
  "status": "PENDING_VERIFICATION",
  "created_at": "2026-09-05T10:30:00"
}
```
Only `zone_id`, `severity`, and `verified` are used; every other field is
safely ignored. Severity is case-insensitive and supports all four
confirmed levels: `LOW` / `MEDIUM` / `HIGH` / `CRITICAL`. Only **verified**
reports receive the +10 priority boost and trigger the "URGENT" action
tag; unverified reports still count toward vulnerability scoring but at
half weight. Reports with `zone_id: null` are never assigned a zone by
this module — they are safely ignored until the backend resolves GPS to a
real zone.

**Known integration dependency — zone_id consistency:** the AI sample uses
`"EKH_001"`-style IDs, field reports use `"ZONE_05"`-style IDs. This module
matches purely on exact string equality across all three data sources and
does **not** invent a conversion between naming conventions. If the real
zone_id formats don't match across teams by demo time, reports/zones will
silently fail to link — **this must be resolved by the team, not
papered over in this module.**

## 4. Output — one result per zone

```json
{
  "zone_id": "EKH_001",
  "risk_score": 82.4,
  "exposure_score": 42.5,
  "vulnerability_score": 10.0,
  "criticality_score": 0.0,
  "priority_score": 51.6,
  "priority_band": "Medium",
  "priority_rank": 1,
  "recommended_action": "Increase monitoring frequency at this zone; notify local officials to stay alert.",
  "explanation": "Zone EKH_001 scored 51.6/100 -> Priority: Medium. Main drivers: ...",
  "data_quality_flags": [],
  "affected_summary": {
    "population_exposed": 500,
    "villages": [],
    "hospitals": 0,
    "schools": 0,
    "has_verified_field_report": false
  }
}
```
The full list is sorted by `priority_rank` ascending (1 = highest priority)
and is confirmed JSON-serializable via `json.dumps()`.

## 5. Scoring methodology (all weights are prototype assumptions)

| Stage | Weights |
|---|---|
| Exposure | population 50%, villages 25%, infrastructure 25% (caps: 5000 / 5 / 5) |
| Vulnerability | accessibility loss 50%, historical frequency 30%, field-report severity 20% |
| Criticality | hospital/dam 100, only-access bridge 90, only-access road 80, school 60, power/water 50, telecom 40, other road 30, generic 20 (max weight + bonus per extra distinct type, capped at 100) |
| Priority | risk 35%, exposure 25%, vulnerability 20%, criticality 20%, +10 if verified field report (capped at 100) |

**These weights are documented, reasoned prototype assumptions (AHP-style
relative importance), not scientifically calibrated coefficients.**
Calibrating them against real historical outcome data is a natural next
step beyond this hackathon prototype — say this proactively to judges.

## 6. Priority bands

| Score | Band | Default action |
|---|---|---|
| 80–100 | Critical | Evacuate immediately |
| 60–79 | High | Deploy inspection team within 24 hrs |
| 35–59 | Medium | Increase monitoring |
| 0–34 | Low | Routine monitoring |

## 7. Data-quality flag behavior

Flags are raised **only** for genuine integration/data problems, never for
legitimate sparse zeros:

| Flag | Meaning |
|---|---|
| `no_risk_data_for_zone` | zone appears in GIS/reports but AI never scored it |
| `no_gis_data_for_zone` | zone appears in risk data but has no GIS record |
| `population_missing` | population field was `null`, not `0` |
| `historical_landslide_data_missing` | field was absent entirely, not `0` |
| `accessibility_topology_unavailable` | roads/bridges present but no `only_access` data at all |
| `alternate_route_unknown_assumed_worst_case` | only-access confirmed, but alternate-route status unknown (conservatively assumed absent) |
| `gis_count_field_unrecognized_format` / `gis_asset_field_unrecognized_format` | a GIS field arrived in a shape this module couldn't interpret |
| `risk_score_missing_used_default` | no risk score provided, moderate default (50) used |

## 8. Known integration dependencies / blockers (not M6's to fix)

- **AI zone-level prediction generation** — still in progress on the AI/ML side.
- **Common `zone_id` format** — must be agreed across AI, GIS, and Field Reporting before real linking works.
- **GIS road-network topology** — needed for genuine (non-default) accessibility scoring; not built in this MVP by design.
- **Backend live wiring** — `run_pipeline(data)` is ready to be called; actual PostgreSQL/PostGIS storage and the `GET /api/priorities` endpoint are the backend team's work.

## 9. How to run

```bash
cd landguard_priority_module
python3 main.py
```
Loads bundled sample data, runs the full pipeline, prints a ranked table,
and writes `data/output_priority_results.json` (gitignored — regenerated
each run).

## 10. How to run tests

```bash
python3 -m pytest tests/ -v
```

**Current status: 34 tests, 0 failures**, covering every scoring stage,
every confirmed real data shape (OSM way-ID scalars, name-list counts,
sparse zeros), every field-report severity/verification combination, and
full output-contract/JSON-serialization checks.
