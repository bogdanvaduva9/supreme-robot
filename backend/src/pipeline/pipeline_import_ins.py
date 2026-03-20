"""
Import population and demographic data from INS (Institutul Național de Statistică).

Step Functions input:  { "siruta": "...", "name": "...", "refreshType": "full" | "partial" }
Step Functions output: { "siruta": "...", "status": "ok" | "skipped" | "error" }

INS data sources:
  - Population by locality: TEMPO table POP107A
  - Age distribution: TEMPO table POP108A
  - Ethnic composition: census data (RPL2022)
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
    logger.info("Importing INS data")

    try:
        # TODO: fetch population + demographics from INS TEMPO API
        # ins_data = _fetch_ins_data(siruta)
        # ddb.update_locality_fields(siruta, {"demographics": ins_data})
        logger.warning("INS import not yet implemented", extra={"siruta": siruta})
        return {"siruta": siruta, "status": "skipped", "source": "ins"}
    except Exception as exc:
        logger.exception("INS import failed", extra={"siruta": siruta})
        return {"siruta": siruta, "status": "error", "source": "ins", "error": str(exc)}


def _fetch_ins_data(siruta: str) -> dict[str, Any]:
    """Fetch and normalise population data from INS TEMPO Online."""
    # TODO: implement
    # Uses the INS JSON API: http://api.insse.ro/tempo-ins/v2/
    raise NotImplementedError
