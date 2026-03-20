"""
Import mobile network coverage data from ANCOM.

Step Functions input:  { "siruta": "...", "name": "...", "refreshType": "full" | "partial" }
Step Functions output: { "siruta": "...", "status": "ok" | "skipped" | "error" }

ANCOM data source:
  - Coverage maps: https://www.ancom.ro/acoperire-retele-mobile_5992
  - Format: WMS/WFS geo service or downloadable shapefile
  - Operators: Vodafone, Orange, Telekom (Deutsche Telekom), Digi (RCS&RDS)
  - Generations: 2G, 3G, 4G, (5G where available)
"""
from __future__ import annotations

from typing import Any

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared import ddb

logger = Logger()
tracer = Tracer()


@logger.inject_lambda_context
@tracer.capture_lambda_handler
def handler(event: dict[str, Any], context: LambdaContext) -> dict[str, Any]:
    siruta: str = event["siruta"]
    logger.append_keys(siruta=siruta)
    logger.info("Importing ANCOM coverage data")

    try:
        # TODO: query ANCOM WFS/WMS for coverage at locality coordinates
        # coverage = _fetch_ancom_coverage(coordinates)
        # ddb.update_locality_fields(siruta, {"infrastructure": {"mobile_coverage": coverage}})
        logger.warning("ANCOM import not yet implemented", extra={"siruta": siruta})
        return {"siruta": siruta, "status": "skipped", "source": "ancom"}
    except Exception as exc:
        logger.exception("ANCOM import failed", extra={"siruta": siruta})
        return {"siruta": siruta, "status": "error", "source": "ancom", "error": str(exc)}


def _fetch_ancom_coverage(lat: float, lng: float) -> list[dict[str, str]]:
    """
    Query ANCOM geo service for mobile coverage at the given coordinates.

    Returns a list of MobileCoverage-compatible dicts:
        [{"operator": "Vodafone", "quality": "4G"}, ...]
    """
    # TODO: implement — ANCOM exposes a WMS/WFS endpoint; exact URL TBD after
    # inspecting https://www.ancom.ro/acoperire-retele-mobile_5992
    raise NotImplementedError
