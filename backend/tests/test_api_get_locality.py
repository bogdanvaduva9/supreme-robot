"""Tests for api_get_locality handler."""
from __future__ import annotations

import json

from moto import mock_aws

from api.api_get_locality import handler
from tests.conftest import make_locality


@mock_aws
def test_get_locality_found(dynamodb_table):  # type: ignore[no-untyped-def]
    make_locality(siruta="123456", name="Budești").save()

    response = handler({"pathParameters": {"siruta": "123456"}}, {})  # type: ignore[arg-type]

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["siruta"] == "123456"
    assert body["identity"]["name"] == "Budești"


@mock_aws
def test_get_locality_not_found(dynamodb_table):  # type: ignore[no-untyped-def]
    response = handler({"pathParameters": {"siruta": "999999"}}, {})  # type: ignore[arg-type]

    assert response["statusCode"] == 404
    assert "error" in json.loads(response["body"])


@mock_aws
def test_get_locality_missing_siruta(dynamodb_table):  # type: ignore[no-untyped-def]
    response = handler({"pathParameters": {}}, {})  # type: ignore[arg-type]

    assert response["statusCode"] == 400


@mock_aws
def test_get_locality_no_path_params(dynamodb_table):  # type: ignore[no-untyped-def]
    response = handler({}, {})  # type: ignore[arg-type]

    assert response["statusCode"] == 400
