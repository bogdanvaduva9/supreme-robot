"""
Fetch the list of SIRUTA codes for Maramureș from Wikidata.

Queries Wikidata for all localities in Maramureș county (direct + one level
deep) that have a P843 (SIRUTA code). Returns enriched locality data including
coordinates and population so downstream importers only need to write to DDB.

Step Functions input:  { "refreshType": "full" | "partial" }
Step Functions output: { "localities": [{ "siruta": "...", "name": "...", ... }] }

Wikidata properties used:
  P843  — SIRUTA code (Romanian locality identifier)
  P625  — coordinates
  P1082 — population
  P31   — instance of (locality type)
"""
from __future__ import annotations

from typing import Any

import requests
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger()
tracer = Tracer()

_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
_JUDET_CODE = "MM"
_MARAMURES_QID = "Q183476"

# Map Wikidata type Q-IDs → LocalityType enum values (stored as plain strings)
_TYPE_MAP: dict[str, str] = {
    "Q640364": "comuna",    # comună în România
    "Q1775818": "municipiu", # municipiu în România
    "Q1780490": "oras",     # oraș în România
    "Q11341482": "sat",     # sat în România
    "Q640026": "sat",       # sat în România (alternate)
    "Q515": "municipiu",    # city
    "Q1549591": "municipiu", # big city
    "Q3957": "oras",        # town
    "Q486972": "sat",       # human settlement (fallback)
}

_SPARQL_QUERY = f"""
SELECT DISTINCT ?item ?itemLabel ?siruta ?lat ?lng ?type ?population WHERE {{
  {{
    ?item wdt:P131 wd:{_MARAMURES_QID}.
  }} UNION {{
    ?item wdt:P131 ?parent.
    ?parent wdt:P131 wd:{_MARAMURES_QID}.
  }}
  ?item wdt:P843 ?siruta.
  ?item wdt:P31 ?type.
  FILTER(?type IN (
    wd:Q640364, wd:Q1775818, wd:Q1780490,
    wd:Q11341482, wd:Q640026, wd:Q515,
    wd:Q1549591, wd:Q3957, wd:Q486972
  ))
  OPTIONAL {{
    ?item wdt:P625 ?coords.
    BIND(geof:latitude(?coords) AS ?lat)
    BIND(geof:longitude(?coords) AS ?lng)
  }}
  OPTIONAL {{ ?item wdt:P1082 ?population. }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "ro,en". }}
}}
ORDER BY ?siruta
"""


@logger.inject_lambda_context
@tracer.capture_lambda_handler
def handler(event: dict[str, Any], context: LambdaContext) -> dict[str, Any]:
    refresh_type = event.get("refreshType", "full")
    logger.info(
        "Fetching SIRUTA list from Wikidata",
        extra={"refreshType": refresh_type, "judet": _JUDET_CODE},
    )

    localities = _fetch_from_wikidata()
    logger.info("SIRUTA list fetched", extra={"count": len(localities)})
    return {"localities": localities}


def _fetch_from_wikidata() -> list[dict[str, Any]]:
    """
    Bulk-query Wikidata SPARQL for all Maramureș localities that have a SIRUTA code.
    Returns deduplicated list sorted by SIRUTA.
    """
    headers = {
        "Accept": "application/sparql-results+json",
        "User-Agent": "Atlas/1.0 (romania-atlas.com)",
    }
    resp = requests.get(
        _SPARQL_ENDPOINT,
        params={"query": _SPARQL_QUERY},
        headers=headers,
        timeout=60,
    )
    resp.raise_for_status()
    bindings = resp.json()["results"]["bindings"]

    seen: set[str] = set()
    localities: list[dict[str, Any]] = []

    for row in bindings:
        siruta = row["siruta"]["value"]
        if siruta in seen:
            continue
        seen.add(siruta)

        type_qid = row["type"]["value"].rsplit("/", 1)[-1]
        locality_type = _TYPE_MAP.get(type_qid, "sat")

        lat: float | None = float(row["lat"]["value"]) if "lat" in row else None
        lng: float | None = float(row["lng"]["value"]) if "lng" in row else None
        population: int = int(float(row["population"]["value"])) if "population" in row else 0

        localities.append({
            "siruta": siruta,
            "name": row["itemLabel"]["value"],
            "type": locality_type,
            "lat": lat,
            "lng": lng,
            "population": population,
            "wikidata_id": row["item"]["value"].rsplit("/", 1)[-1],
        })

    return localities
