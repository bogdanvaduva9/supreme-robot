"""GET /localities?judet=MM — lists localities in a județ, ordered by completeness."""
from __future__ import annotations

import json
from typing import Any

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared import ddb
from shared.judete import JUDETE_BY_CODE
from shared.response import bad_request, ok

logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="Atlas")

_DEFAULT_LIMIT = 50
_MAX_LIMIT = 200


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def handler(event: dict[str, Any], context: LambdaContext) -> dict[str, Any]:
    params = event.get("queryStringParameters") or {}

    judet = params.get("judet", "").strip().upper()
    if not judet:
        return bad_request("Missing required query parameter: judet")
    if judet not in JUDETE_BY_CODE:
        return bad_request(f"Unknown județ code: {judet!r}")

    try:
        limit = min(int(params.get("limit", _DEFAULT_LIMIT)), _MAX_LIMIT)
    except ValueError:
        return bad_request("limit must be an integer")

    last_key_raw = params.get("nextToken")
    last_key = json.loads(last_key_raw) if last_key_raw else None

    logger.append_keys(judet=judet, limit=limit)

    items, next_key = ddb.list_localities_by_judet(judet, limit=limit, last_key=last_key)

    response: dict[str, Any] = {
        "judet": judet,
        "judetName": JUDETE_BY_CODE[judet],
        "localities": [ddb.to_dict(item) for item in items],
        "count": len(items),
    }
    if next_key:
        response["nextToken"] = json.dumps(next_key)

    return ok(response)
