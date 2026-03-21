"""DynamoDB query helpers — thin wrappers over the PynamoDB LocalityModel."""
from __future__ import annotations

from typing import Any

from pynamodb.attributes import MapAttribute
from pynamodb.exceptions import DoesNotExist

from shared.models import LocalityModel


# ---------------------------------------------------------------------------
# Read helpers
# ---------------------------------------------------------------------------


def get_locality(siruta: str) -> LocalityModel | None:
    try:
        return LocalityModel.get(LocalityModel.build_pk(siruta), "#METADATA")
    except DoesNotExist:
        return None


def list_localities_by_judet(
    judet_code: str,
    limit: int = 100,
    last_key: dict[str, Any] | None = None,
) -> tuple[list[LocalityModel], dict[str, Any] | None]:
    # Scan with filter — the GSI projects only keys (no full item data), so we
    # scan the base table instead. For POC scale (~1000 items) this is instant.
    results = LocalityModel.scan(
        LocalityModel.JudetCode == judet_code,
        limit=limit,
        last_evaluated_key=last_key,
    )
    items = list(results)
    return items, results.last_evaluated_key


# ---------------------------------------------------------------------------
# Write helpers
# ---------------------------------------------------------------------------


def save_locality(locality: LocalityModel) -> None:
    locality.save()


def update_locality_fields(siruta: str, fields: dict[str, Any]) -> None:
    """Partial update using PynamoDB attribute actions."""
    model = get_locality(siruta)
    if model is None:
        raise DoesNotExist(f"Locality {siruta!r} not found")

    for key, value in fields.items():
        if hasattr(model, key):
            setattr(model, key, value)

    model.save()


# ---------------------------------------------------------------------------
# Serialization
# ---------------------------------------------------------------------------


def _attr_to_python(value: Any) -> Any:
    """Recursively convert PynamoDB attribute values to plain Python types."""
    if isinstance(value, MapAttribute):
        return {k: _attr_to_python(v) for k, v in value.attribute_values.items()}
    if isinstance(value, list):
        return [_attr_to_python(item) for item in value]
    return value


_INTERNAL_KEYS = {"PK", "SK", "JudetCode", "CompletenessScore", "EntityType", "LastUpdated"}


def to_dict(model: LocalityModel) -> dict[str, Any]:
    """Convert a LocalityModel to a plain dict suitable for JSON API responses."""
    return {
        key: _attr_to_python(value)
        for key, value in model.attribute_values.items()
        if key not in _INTERNAL_KEYS
    }
