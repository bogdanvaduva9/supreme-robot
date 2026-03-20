"""GET /judete — returns all Romanian județe with basic stats."""
from __future__ import annotations

from typing import Any

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared.judete import JUDETE
from shared.response import ok

logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="Atlas")


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def handler(event: dict[str, Any], context: LambdaContext) -> dict[str, Any]:
    # Phase 1: static list — no per-județ stats yet
    # Phase 2: enrich with locality counts and avg completeness from DDB
    return ok({"judete": JUDETE, "count": len(JUDETE)})
