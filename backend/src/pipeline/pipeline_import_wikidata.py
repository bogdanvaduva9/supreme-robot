"""
Import locality description, coordinates, and alternate names from Wikidata.

Step Functions input:  { "siruta": "...", "name": "...", "refreshType": "full" | "partial" }
Step Functions output: { "siruta": "...", "status": "ok" | "skipped" | "error" }

Wikidata SPARQL endpoint: https://query.wikidata.org/sparql
Query: find Romanian locality by P856/P131 (located in Maramureș), get coordinates + labels.

Rate limit: 1 req/sec, request with Accept: application/sparql-results+json.
"""
from __future__ import annotations

from typing import Any

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared import ddb

logger = Logger()
tracer = Tracer()

_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"


@logger.inject_lambda_context
@tracer.capture_lambda_handler
def handler(event: dict[str, Any], context: LambdaContext) -> dict[str, Any]:
    siruta: str = event["siruta"]
    name: str = event.get("name", "")
    logger.append_keys(siruta=siruta)
    logger.info("Importing Wikidata")

    try:
        # TODO: query Wikidata SPARQL for locality by name + Romania filter
        # wikidata = _fetch_wikidata(name)
        # ddb.update_locality_fields(siruta, {"identity": {"coordinates": wikidata["coordinates"], ...}})
        logger.warning("Wikidata import not yet implemented", extra={"siruta": siruta})
        return {"siruta": siruta, "status": "skipped", "source": "wikidata"}
    except Exception as exc:
        logger.exception("Wikidata import failed", extra={"siruta": siruta})
        return {"siruta": siruta, "status": "error", "source": "wikidata", "error": str(exc)}


def _build_sparql_query(locality_name: str) -> str:
    return f"""
    SELECT ?item ?itemLabel ?lat ?lng ?description WHERE {{
      ?item wdt:P17 wd:Q218;       # country = Romania
            wdt:P131 ?parent;       # located in administrative entity
            rdfs:label "{locality_name}"@ro.
      OPTIONAL {{ ?item wdt:P625 ?coords.
                  BIND(geof:latitude(?coords) AS ?lat)
                  BIND(geof:longitude(?coords) AS ?lng) }}
      OPTIONAL {{ ?item schema:description ?description. FILTER(LANG(?description) = "ro") }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "ro,en". }}
    }}
    LIMIT 1
    """.strip()


def _fetch_wikidata(locality_name: str) -> dict[str, Any]:
    """Query Wikidata SPARQL for coordinates and description."""
    # TODO: implement
    # import requests
    # query = _build_sparql_query(locality_name)
    # headers = {"Accept": "application/sparql-results+json", "User-Agent": "Atlas/1.0"}
    # resp = requests.get(_SPARQL_ENDPOINT, params={"query": query}, headers=headers, timeout=30)
    # resp.raise_for_status()
    # return _parse_sparql_response(resp.json())
    raise NotImplementedError
