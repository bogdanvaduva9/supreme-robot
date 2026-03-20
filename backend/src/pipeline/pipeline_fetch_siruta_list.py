"""
Fetch the list of SIRUTA codes for Maramureș from INS.

Step Functions input:  { "refreshType": "full" | "partial" }
Step Functions output: { "localities": [{ "siruta": "...", "name": "..." }, ...] }

INS reference:
  - SIRUTA nomenclature: https://statistici.insse.ro/shop/index.jsp?page=tempo2&lang=ro&query=siruta
  - Download: CSV from INS TEMPO Online (table POP107A or similar)
"""
from __future__ import annotations

from typing import Any

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger()
tracer = Tracer()

# Maramureș județ code used to filter the full SIRUTA list
_JUDET_CODE = "MM"


@logger.inject_lambda_context
@tracer.capture_lambda_handler
def handler(event: dict[str, Any], context: LambdaContext) -> dict[str, Any]:
    refresh_type = event.get("refreshType", "full")
    logger.info("Fetching SIRUTA list", extra={"refreshType": refresh_type, "judet": _JUDET_CODE})

    # TODO: fetch and parse the INS SIRUTA CSV/Excel file
    # localities = _fetch_from_ins(_JUDET_CODE)

    # Stub: empty list — replace with real fetch
    localities: list[dict[str, str]] = []

    logger.info("SIRUTA list fetched", extra={"count": len(localities)})
    return {"localities": localities}


def _fetch_from_ins(judet_code: str) -> list[dict[str, str]]:
    """
    Download and parse the INS SIRUTA nomenclature for the given județ.

    Returns a list of dicts with at minimum: siruta, name, type.
    """
    # TODO: implement
    # import requests
    # resp = requests.get(INS_SIRUTA_URL, timeout=30)
    # resp.raise_for_status()
    # return _parse_siruta_csv(resp.content, judet_code)
    raise NotImplementedError
