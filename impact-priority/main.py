"""
main.py
=======
Entry point. Loads sample data, runs the full pipeline, prints a ranked
table, and writes the final JSON output (what would be sent to backend).

RUN: python main.py
"""

import json
from src.pipeline import run_pipeline


def load_json(path):
    with open(path) as f:
        return json.load(f)


def main():
    risk_records = load_json("data/sample_risk_zones.json")
    gis_records = load_json("data/sample_gis_exposure.json")
    field_reports = load_json("data/sample_field_reports.json")

    # This matches the confirmed backend contract: run_pipeline(data) with
    # a single dict containing all three data sources.
    data = {
        "risk_data": risk_records,
        "gis_data": gis_records,
        "field_reports": field_reports,
    }
    results = run_pipeline(data)

    print("\n" + "=" * 90)
    print("LANDGUARD AI — PRIORITY RANKING (highest priority first)")
    print("=" * 90)
    for r in results:
        print(f"\n#{r['priority_rank']}  {r['zone_id']}  |  Priority: {r['priority_band']} "
              f"({r['priority_score']}/100)  |  Risk: {r['risk_score']}")
        print(f"   Action: {r['recommended_action']}")
        print(f"   Why: {r['explanation']}")
        if r["data_quality_flags"]:
            print(f"   [Data quality flags: {', '.join(r['data_quality_flags'])}]")

    with open("data/output_priority_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print("\n" + "=" * 90)
    print("Full structured output written to data/output_priority_results.json")
    print("=" * 90)


if __name__ == "__main__":
    main()
