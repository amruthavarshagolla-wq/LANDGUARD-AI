"""
utils.py
========
Small, shared defensive helpers used by exposure.py, vulnerability.py, and
criticality.py.

WHY THIS FILE EXISTS:
Hasini (GIS) confirmed her real output describes roads/bridges as "OSM
way-ID lists + counts" and schools/hospitals as "name lists + counts" --
this is looser than this module's original internal assumption (roads as
a list of {"only_access": ..., "alternate_route_exists": ...} dicts;
schools/hospitals as plain integers). The exact final JSON shape from her
side is not yet pinned down to the field level.

Rather than guess her exact shape and risk crashing on the real data feed
during the demo, these helpers make the three scoring modules tolerant of
several plausible shapes for the SAME field, while never inventing a
topology fact (like only_access) that isn't actually present. When a
genuinely unrecognized shape is encountered, that is surfaced as an
explicit data_quality_flag rather than silently guessed at or crashed on.

These helpers do NOT change any scoring weight, formula, or threshold.
They only make field *access* safe.
"""


def normalize_count(value):
    """
    Normalizes a GIS count-like field (schools/hospitals) which may arrive as:
      - a plain integer count (this module's original internal assumption)
      - a list of names, e.g. ["Govt School A"]  (Hasini's likely real format)
      - a dict wrapper like {"names": [...], "count": N}
      - None / missing (legitimate -- most zones have zero)

    Returns (count: int, flag: str | None).
    """
    if value is None:
        return 0, None
    if isinstance(value, bool):
        # guard against bool being a subclass of int and silently doing the wrong thing
        return 0, "gis_count_field_unrecognized_format"
    if isinstance(value, int):
        return value, None
    if isinstance(value, list):
        return len(value), None
    if isinstance(value, dict):
        if isinstance(value.get("count"), int):
            return value["count"], None
        names = value.get("names")
        if isinstance(names, list):
            return len(names), None
        return 0, "gis_count_field_unrecognized_format"
    return 0, "gis_count_field_unrecognized_format"


def normalize_asset_list(value):
    """
    Normalizes a GIS asset-collection field (roads/bridges) which may arrive as:
      - a list of dicts, e.g. [{"only_access": True, ...}]  (this module's
        original internal assumption -- still supported)
      - a list of plain OSM way-ID scalars, e.g. [488213, 488214]
        (Hasini's confirmed real format -- no topology flags available)
      - a dict wrapper like {"way_ids": [...], "count": N}
      - None / missing (legitimate -- most zones have no roads/bridges mapped)

    Returns (items: list, flag: str | None). Items may be dicts OR scalars;
    callers must use safe_get()/item_has_key() below rather than assuming dicts.
    """
    if value is None:
        return [], None
    if isinstance(value, list):
        return value, None
    if isinstance(value, dict):
        way_ids = value.get("way_ids")
        if isinstance(way_ids, list):
            return way_ids, None
        return [], "gis_asset_field_unrecognized_format"
    return [], "gis_asset_field_unrecognized_format"


def safe_get(item, key, default=None):
    """
    Defensive accessor for a single road/bridge entry, which may be a dict
    (has topology fields) or a plain scalar way-ID (does not). Never crashes;
    a scalar simply has no such field, treated as "unknown", not as False.
    """
    if isinstance(item, dict):
        return item.get(key, default)
    return default


def item_has_key(item, key):
    """True only if item is a dict AND explicitly contains key (not just truthy)."""
    return isinstance(item, dict) and key in item
