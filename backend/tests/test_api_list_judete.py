"""Tests for api_list_judete handler."""
from __future__ import annotations

import json

from api.api_list_judete import handler
from tests.conftest import MockLambdaContext


def test_list_judete_returns_all(mock_context: MockLambdaContext) -> None:
    response = handler({}, mock_context)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["count"] == 42
    assert len(body["judete"]) == 42


def test_list_judete_contains_maramures(mock_context: MockLambdaContext) -> None:
    response = handler({}, mock_context)
    body = json.loads(response["body"])

    codes = [j["code"] for j in body["judete"]]
    assert "MM" in codes


def test_list_judete_has_required_fields(mock_context: MockLambdaContext) -> None:
    response = handler({}, mock_context)
    body = json.loads(response["body"])

    for judet in body["judete"]:
        assert "code" in judet
        assert "name" in judet
