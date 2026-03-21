"""API Gateway response helpers."""
from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal
from typing import Any

_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


class _DecimalEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def _body(data: Any) -> str:
    return json.dumps(data, cls=_DecimalEncoder)


def ok(data: Any) -> dict[str, Any]:
    return {"statusCode": 200, "headers": _HEADERS, "body": _body(data)}


def not_found(message: str = "Not found") -> dict[str, Any]:
    return {"statusCode": 404, "headers": _HEADERS, "body": _body({"error": message})}


def bad_request(message: str) -> dict[str, Any]:
    return {"statusCode": 400, "headers": _HEADERS, "body": _body({"error": message})}


def server_error(message: str = "Internal server error") -> dict[str, Any]:
    return {"statusCode": 500, "headers": _HEADERS, "body": _body({"error": message})}
