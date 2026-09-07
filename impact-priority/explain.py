"""Explainable operational-response reasoning for the M6 module.

The M6 module no longer computes a separate priority score or rank.  This
file turns the rule reasons produced by ``actions.generate_operational_suggestions``
into a short, dashboard-safe explanation.
"""


def _join_with_and(items: list) -> str:
    """Join one or more human-readable fragments naturally."""
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return ", ".join(items[:-1]) + f", and {items[-1]}"


def generate_operational_explanation(zone_id, reasons: list) -> str:
    """Explain why the operational suggestions were generated.

    ``reasons`` comes directly from the same rule evaluation that generated
    the suggestions, keeping the explanation consistent with the output.
    """
    if not reasons:
        return (
            f"Zone {zone_id}: no significant risk, exposure, infrastructure, "
            "or field-report signals were found; routine monitoring is sufficient."
        )

    verb = "leads to" if len(reasons) == 1 else "combine to produce"
    return (
        f"Zone {zone_id}: {_join_with_and(reasons)} "
        f"{verb} these operational suggestions."
    )
