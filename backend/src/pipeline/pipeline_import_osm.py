"""
Import geographic boundary and POI data from OpenStreetMap via Overpass API.

Step Functions input:  { "siruta": "...", "name": "...", "refreshType": "full" | "partial" }
Step Functions output: { "siruta": "...", "status": "ok" | "skipped" | "error" }

OSM data:
  - Administrative boundary (GeoJSON Polygon) — relation type=boundary, admin_level=10
  - POIs: hospitals, schools, ATMs, pharmacies, businesses (amenity/shop tags)
  - Road access type (highway tags within boundary)

Overpass API endpoint: https://overpass-api.de/api/interpreter
Rate limit: max 1 req/sec, use maxconcurrency=10 in Step Functions Map.
"""
from __future__ import annotations

from typing import Any

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared import ddb

logger = Logger()
tracer = Tracer()

_OVERPASS_URL = "https://overpass-api.de/api/interpreter"


@logger.inject_lambda_context
@tracer.capture_lambda_handler
def handler(event: dict[str, Any], context: LambdaContext) -> dict[str, Any]:
    siruta: str = event["siruta"]
    name: str = event.get("name", "")
    logger.append_keys(siruta=siruta)
    logger.info("Importing OSM data")

    try:
        # TODO: query Overpass for boundary + POIs by locality name
        # osm_data = _fetch_osm_data(name)
        # ddb.update_locality_fields(siruta, {"identity": {"boundary": osm_data["boundary"]}, ...})
        logger.warning("OSM import not yet implemented", extra={"siruta": siruta})
        return {"siruta": siruta, "status": "skipped", "source": "osm"}
    except Exception as exc:
        logger.exception("OSM import failed", extra={"siruta": siruta})
        return {"siruta": siruta, "status": "error", "source": "osm", "error": str(exc)}


def _build_overpass_query(locality_name: str) -> str:
    """Build an Overpass QL query to fetch the administrative boundary and key POIs."""
    return f"""
    [out:json][timeout:30];
    area["name"="{locality_name}"]["boundary"="administrative"]->.searchArea;
    (
      relation["boundary"="administrative"]["name"="{locality_name}"];
      node["amenity"~"hospital|school|atm|pharmacy|police"](area.searchArea);
      node["shop"](area.searchArea);
    );
    out geom;
    """.strip()


def _fetch_osm_data(locality_name: str) -> dict[str, Any]:
    """Fetch boundary GeoJSON and POIs from Overpass API."""
    # TODO: implement
    # import requests
    # query = _build_overpass_query(locality_name)
    # resp = requests.post(_OVERPASS_URL, data={"data": query}, timeout=60)
    # resp.raise_for_status()
    # return _parse_overpass_response(resp.json())
    raise NotImplementedError
