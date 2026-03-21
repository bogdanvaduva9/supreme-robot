"""
Create/upsert locality records in DynamoDB from Wikidata-enriched data.

Receives one locality at a time from the Step Functions Map iterator.
The upstream `fetch_siruta_list` step already queried Wikidata in bulk,
so this Lambda only needs to write to DynamoDB — no external calls.

Step Functions input (one item from localities list):
  {
    "siruta": "109210",
    "name": "Baia Mare",
    "type": "municipiu",
    "lat": 47.657,
    "lng": 23.568,
    "population": 122224,
    "wikidata_id": "Q193714",
    "refreshType": "full"
  }

Step Functions output:
  { "siruta": "...", "status": "ok" | "skipped" | "error" }
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared import ddb
from shared.models import (
    AdminParentAttribute,
    CoordinatesAttribute,
    DemographicsAttribute,
    IdentityAttribute,
    InfrastructureAttribute,
    LocalityMetaAttribute,
    LocalityModel,
)

logger = Logger()
tracer = Tracer()

_JUDET_CODE = "MM"
_JUDET_NAME = "Maramureș"


@logger.inject_lambda_context
@tracer.capture_lambda_handler
def handler(event: dict[str, Any], context: LambdaContext) -> dict[str, Any]:
    siruta: str = str(event["siruta"])
    logger.append_keys(siruta=siruta)
    logger.info("Importing Wikidata locality", extra={"locality_name": event.get("name")})

    try:
        _upsert_locality(event)
        return {"siruta": siruta, "status": "ok", "source": "wikidata"}
    except Exception:
        logger.exception("Wikidata import failed")
        return {"siruta": siruta, "status": "error", "source": "wikidata"}


def _upsert_locality(data: dict[str, Any]) -> None:
    siruta = str(data["siruta"])
    name: str = data["name"]
    locality_type: str = data.get("type", "sat")
    lat: float | None = data.get("lat")
    lng: float | None = data.get("lng")
    population: int = int(data.get("population") or 0)

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # Check if record already exists — if partial refresh, skip existing
    existing = ddb.get_locality(siruta)
    if existing is not None and data.get("refreshType") == "partial":
        logger.info("Skipping existing locality (partial refresh)")
        return

    # Build coordinates (use county centre as fallback for Maramureș)
    if lat is not None and lng is not None:
        coords = CoordinatesAttribute(lat=lat, lng=lng)
    else:
        # Fallback: Baia Mare approximate centre
        coords = CoordinatesAttribute(lat=47.657, lng=23.568)
        logger.warning("No coordinates in Wikidata — using county centre fallback")

    completeness = _calc_completeness(lat=lat, lng=lng, population=population)

    locality = LocalityModel(
        PK=LocalityModel.build_pk(siruta),
        SK="#METADATA",
        JudetCode=_JUDET_CODE,
        # Zero-pad for lexicographic range-key sorting (e.g. "025.00")
        CompletenessScore=f"{completeness * 100:06.2f}",
        EntityType="LOC",
        LastUpdated=now_iso,
        siruta=siruta,
        identity=IdentityAttribute(
            name=name,
            type=locality_type,
            judet_code=_JUDET_CODE,
            judet_name=_JUDET_NAME,
            admin_parent=AdminParentAttribute(
                judet_code=_JUDET_CODE,
                judet_name=_JUDET_NAME,
                comuna_siruta="",
                comuna_name="",
            ),
            coordinates=coords,
            alternate_names=[],
            postal_code="",
        ),
        demographics=DemographicsAttribute(
            population=population,
            population_year=2021,  # latest census year
            population_trend="stable",
            population_history=[],
            ethnic_composition=[],
        ),
        infrastructure=InfrastructureAttribute(
            road_access="unpaved",
            internet_availability="unknown",
            public_transport="",
            mobile_coverage=[],
        ),
        meta=LocalityMetaAttribute(
            created_at=now,
            last_updated=now,
            completeness_score=completeness,
            contributors=[],
            data_sources=["wikidata"],
        ),
    )

    locality.save()
    logger.info(
        "Locality saved",
        extra={"locality_name": name, "locality_type": locality_type, "completeness": completeness},
    )


def _calc_completeness(lat: float | None, lng: float | None, population: int) -> float:
    """Simple completeness score for a Wikidata-seeded locality (0.0–1.0)."""
    score = 0.10  # always have name + type
    if lat is not None and lng is not None:
        score += 0.15  # coordinates
    if population > 0:
        score += 0.10  # population
    return round(score, 2)
