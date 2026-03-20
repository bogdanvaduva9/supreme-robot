"""GET /localities/{siruta} — returns the full locality record."""
from __future__ import annotations

from typing import Any

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared import ddb
from shared.response import bad_request, not_found, ok

logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="Atlas")


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def handler(event: dict[str, Any], context: LambdaContext) -> dict[str, Any]:
    path_params = event.get("pathParameters") or {}
    siruta = path_params.get("siruta", "").strip()

    if not siruta:
        return bad_request("Missing path parameter: siruta")

    logger.append_keys(siruta=siruta)

    locality = ddb.get_locality(siruta)
    if locality is None:
        return not_found(f"Locality {siruta!r} not found")

    return ok(ddb.to_dict(locality))
