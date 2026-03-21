"""Tests for api_list_by_judet handler."""
from __future__ import annotations

import json

from moto import mock_aws

from api.api_list_by_judet import handler
from tests.conftest import MockLambdaContext, make_locality


@mock_aws
def test_list_by_judet_returns_localities(dynamodb_table, mock_context: MockLambdaContext) -> None:
    for i, name in enumerate(["Budești", "Călinești", "Ocna Șugatag"]):
        make_locality(siruta=str(100000 + i), name=name, judet_code="MM").save()

    response = handler({"queryStringParameters": {"judet": "MM"}}, mock_context)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["judet"] == "MM"
    assert body["judetName"] == "Maramureș"
    assert body["count"] == 3
    assert len(body["localities"]) == 3


@mock_aws
def test_list_by_judet_missing_param(dynamodb_table, mock_context: MockLambdaContext) -> None:
    response = handler({"queryStringParameters": {}}, mock_context)

    assert response["statusCode"] == 400


@mock_aws
def test_list_by_judet_unknown_judet(dynamodb_table, mock_context: MockLambdaContext) -> None:
    response = handler({"queryStringParameters": {"judet": "XX"}}, mock_context)

    assert response["statusCode"] == 400


@mock_aws
def test_list_by_judet_empty_result(dynamodb_table, mock_context: MockLambdaContext) -> None:
    response = handler({"queryStringParameters": {"judet": "AB"}}, mock_context)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["count"] == 0
    assert body["localities"] == []
