# LANDGUARD AI — Module 6: Impact & Operational Response Intelligence

**Owner:** Jahnavi
**Status:** Core logic complete and tested. Integration-ready pending real data from AI/GIS/Backend teammates (see "Known integration dependencies" below).

## 1. What this module does

Takes AI risk predictions + GIS exposure data (+ optional field reports) and
answers: **"Given what the AI, GIS, and field reports say about this zone,
what should authorities consider doing, and why?"**

**M6 update:** this module previously also computed a separate composite
`operational_suggestions`/`risk_category`/`risk_rank` to rank zones against each
other. That stage has been removed -- the AI model already provides a risk
assessment (`risk_score`/`risk_category`), and a second, independently
weighted "priority" score on top of it was duplicating that judgment rather
than adding new information. M6 now focuses purely on **explainable,
rule-based operational response suggestions**: concrete, auditable
recommendations for a human authority to act on, each with a plain-language
explanation of why it was suggested. Suggestions are always decision-support
language ("prepare evacuation readiness", "inspect road accessibility"),
never autonomous orders ("evacuate everyone", "close the road").

## 2. Responsibility boundary

This module owns:
```
AI Risk + GIS Exposure + Field Reports
  -> Exposure Assessment -> Vulnerability Assessment -> Infrastructure Criticality
  -> Operational Response Suggestions -> Explanation -> Output
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
results = run_pipeline(data)    # -> list of dicts, sorted by risk_rank
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
  "zone_id": "ZONE_05",
  "risk_score": 85,
  "exposure_score": 62.5,
  "vulnerability_score": 58.0,
  "criticality_score": 100,
  "operational_suggestions": [
    "Conduct immediate field verification",
    "Inspect road and bridge accessibility in the zone",
    "Check accessibility to the nearby hospital",
    "Prepare evacuation readiness assessment for the exposed population",
    "Conduct immediate ground assessment",
    "Escalate for immediate authority review"
  ],
  "explanation": "Zone ZONE_05: high predicted landslide risk (score 85), nearby critical infrastructure (road/bridge network, a hospital), an exposed population of 1500, and a verified high-severity field report combine to produce these operational suggestions.",
  "data_quality_flags": [],
  "affected_summary": {
    "population_exposed": 1500,
    "villages": [],
    "hospitals": 1,
    "schools": 0,
    "has_verified_field_report": true
  }
}
```
This is confirmed JSON-serializable via `json.dumps()`. The list is sorted
by `zone_id` purely for deterministic, stable output ordering — this is
**not** a priority ranking (M6 no longer ranks zones against each other;
each zone's suggestions/explanation are self-contained).

**Contract change note for Backend/Frontend:** `operational_suggestions`,
`risk_category`, `risk_rank`, and `operational_suggestions` have been
**removed** (not renamed) and replaced by `operational_suggestions` (a
list of strings) and a rewritten `explanation`. `exposure_score`,
`vulnerability_score`, `criticality_score`, `data_quality_flags`, and
`affected_summary` are unchanged. If any consumer currently reads the
removed fields, it will need updating — this module doesn't have
visibility into Backend/Frontend code to confirm who reads what, so please
flag if this breaks anything downstream.

## 5. Component scoring (all weights are prototype assumptions)

Exposure, vulnerability, and criticality are still computed exactly as
before and included in the output as useful context for the dashboard —
only the composite `operational_suggestions` built on top of them was removed.

| Stage | Weights |
|---|---|
| Exposure | population 50%, villages 25%, infrastructure 25% (caps: 5000 / 5 / 5) |
| Vulnerability | accessibility loss 50%, historical frequency 30%, field-report severity 20% |
| Criticality | hospital/dam 100, only-access bridge 90, only-access road 80, school 60, power/water 50, telecom 40, other road 30, generic 20 (max weight + bonus per extra distinct type, capped at 100) |

**These weights are documented, reasoned prototype assumptions (AHP-style
relative importance), not scientifically calibrated coefficients.**
Calibrating them against real historical outcome data is a natural next
step beyond this hackathon prototype — say this proactively to judges.

## 6. Operational suggestion rules

Suggestions are generated by `actions.generate_operational_suggestions`,
a simple, fully auditable rule-based function (see its docstring for the
exact logic). Each rule reads directly from the raw AI/GIS/field-report
fields (not a combined score) and, when triggered, adds one or more
decision-support suggestions — never an autonomous order.

| Condition | Suggestions |
|---|---|
| High/Very High risk (`risk_category` text, or `risk_score >= RISK_HIGH_THRESHOLD`) | Conduct immediate field verification; increase monitoring frequency |
| Moderate/Medium risk (`risk_score >= RISK_MEDIUM_THRESHOLD`) | Increase monitoring frequency |
| Roads and/or bridges present | Inspect road and bridge accessibility |
| Hospital present | Check accessibility to the nearby hospital |
| `historical_landslide_count >= HISTORICAL_LANDSLIDE_SIGNIFICANT_COUNT` | Increase monitoring; schedule a field assessment |
| `population_exposed >= SIGNIFICANT_POPULATION_EXPOSED` | Prepare evacuation readiness assessment |
| Verified field report, severity high/critical | Conduct immediate ground assessment; escalate for authority review |
| Nothing above triggers | Continue routine monitoring; no immediate action indicated |

All thresholds live in `config.py`, are **operational/demo assumptions,
not scientifically validated universal cutoffs**, and are easily re-tuned.
Where a suitable cutoff already existed elsewhere in the project it was
reused rather than a new number invented (see the comments in `config.py`
next to `RISK_HIGH_THRESHOLD`/`RISK_MEDIUM_THRESHOLD` and
`HISTORICAL_LANDSLIDE_SIGNIFICANT_COUNT`).

Suggestions from different rules are deduplicated by exact text, so
multiple triggered conditions never produce repeated lines.

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

## 8. Known integration dependencies / blockers (not M6's to fix)

- **AI zone-level prediction generation** — still in progress on the AI/ML side.
- **Common `zone_id` format** — must be agreed across AI, GIS, and Field Reporting before real linking works.
- **GIS road-network topology** — needed for genuine (non-default) accessibility scoring; not built in this MVP by design.
- **Backend live wiring** — `run_pipeline(data)` is ready to be called; actual PostgreSQL/PostGIS storage and the dashboard endpoint are the backend team's work. **Backend/Frontend should confirm whether they currently read the now-removed `operational_suggestions`/`risk_category`/`risk_rank`/`operational_suggestions` fields** (see section 4).

## 9. How to run

```bash
cd landguard_priority_module
python3 main.py
```
Loads bundled sample data, runs the full pipeline, prints each zone's
operational suggestions and explanation, and writes
`data/output_operational_response.json` (gitignored — regenerated each run).

## 10. How to run tests

```bash
python3 -m pytest tests/ -v
```
(If `pytest` isn't installed in your environment, every test is a plain
function starting with `test_` and can be run with any pytest-compatible
runner, or by importing `tests/test_pipeline.py` and calling them directly.)

**Current status: 41 tests, 0 failures** — 34 original tests updated for
the new `operational_suggestions`/`explanation` contract (no coverage was
removed), plus 7 new tests specifically covering the operational-suggestion
rules (high/medium/low risk, infrastructure presence, population exposure,
verified field-report escalation, no-autonomous-order wording, and
duplicate-free combination of multiple triggered conditions).
