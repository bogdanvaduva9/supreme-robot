"""Tests for pipeline_import_wikidata Lambda."""
from __future__ import annotations

import pytest
from moto import mock_aws

from tests.conftest import MockLambdaContext, make_locality


@mock_aws
def test_import_creates_locality(dynamodb_table, mock_context: MockLambdaContext) -> None:
    """Handler should create a LocalityModel with correct fields."""
    from pipeline.pipeline_import_wikidata import handler
    from shared import ddb

    event = {
        "siruta": "109210",
        "name": "Baia Mare",
        "type": "municipiu",
        "lat": 47.657,
        "lng": 23.568,
        "population": 122224,
        "wikidata_id": "Q193714",
        "refreshType": "full",
    }

    result = handler(event, mock_context)

    assert result["status"] == "ok"
    assert result["siruta"] == "109210"

    locality = ddb.get_locality("109210")
    assert locality is not None
    assert locality.identity.name == "Baia Mare"
    assert locality.identity.type == "municipiu"
    assert locality.identity.judet_code == "MM"
    assert float(locality.identity.coordinates.lat) == pytest.approx(47.657)
    assert float(locality.identity.coordinates.lng) == pytest.approx(23.568)
    assert int(locality.demographics.population) == 122224
    assert "wikidata" in locality.meta.data_sources


@mock_aws
def test_import_without_coordinates_uses_fallback(dynamodb_table, mock_context: MockLambdaContext) -> None:
    """Handler should use county-centre fallback when no coordinates provided."""
    from pipeline.pipeline_import_wikidata import handler
    from shared import ddb

    event = {
        "siruta": "999001",
        "name": "Sat Fără Coordonate",
        "type": "sat",
        "lat": None,
        "lng": None,
        "population": 0,
        "wikidata_id": "Q999",
        "refreshType": "full",
    }

    result = handler(event, mock_context)

    assert result["status"] == "ok"

    locality = ddb.get_locality("999001")
    assert locality is not None
    # Should have fallen back to Baia Mare coords
    assert float(locality.identity.coordinates.lat) == pytest.approx(47.657)


@mock_aws
def test_import_partial_refresh_skips_existing(dynamodb_table, mock_context: MockLambdaContext) -> None:
    """Handler should skip existing localities on partial refresh."""
    from pipeline.pipeline_import_wikidata import handler
    from shared import ddb

    # Pre-seed a locality
    loc = make_locality(siruta="109210", name="Baia Mare", judet_code="MM")
    loc.save()

    event = {
        "siruta": "109210",
        "name": "Baia Mare Updated",
        "type": "municipiu",
        "lat": 47.657,
        "lng": 23.568,
        "population": 999,
        "wikidata_id": "Q193714",
        "refreshType": "partial",
    }

    result = handler(event, mock_context)

    # Should return ok (skipped is handled internally)
    assert result["status"] == "ok"

    # Name should NOT have been updated
    locality = ddb.get_locality("109210")
    assert locality is not None
    assert locality.identity.name == "Baia Mare"


@mock_aws
def test_import_full_refresh_overwrites_existing(dynamodb_table, mock_context: MockLambdaContext) -> None:
    """Handler should overwrite existing localities on full refresh."""
    from pipeline.pipeline_import_wikidata import handler
    from shared import ddb

    loc = make_locality(siruta="109210", name="Old Name", judet_code="MM")
    loc.save()

    event = {
        "siruta": "109210",
        "name": "Baia Mare",
        "type": "municipiu",
        "lat": 47.657,
        "lng": 23.568,
        "population": 122224,
        "wikidata_id": "Q193714",
        "refreshType": "full",
    }

    result = handler(event, mock_context)
    assert result["status"] == "ok"

    locality = ddb.get_locality("109210")
    assert locality is not None
    assert locality.identity.name == "Baia Mare"


@mock_aws
def test_completeness_score_reflects_data_quality(dynamodb_table, mock_context: MockLambdaContext) -> None:
    """Completeness score should be higher when coordinates + population are present."""
    from pipeline.pipeline_import_wikidata import handler
    from shared import ddb

    # Full data
    handler({
        "siruta": "111111",
        "name": "Loc Complet",
        "type": "sat",
        "lat": 47.5,
        "lng": 24.0,
        "population": 500,
        "wikidata_id": "Q1",
        "refreshType": "full",
    }, mock_context)

    # No coords, no population
    handler({
        "siruta": "222222",
        "name": "Loc Gol",
        "type": "sat",
        "lat": None,
        "lng": None,
        "population": 0,
        "wikidata_id": "Q2",
        "refreshType": "full",
    }, mock_context)

    full = ddb.get_locality("111111")
    empty = ddb.get_locality("222222")

    assert full is not None and empty is not None
    assert float(full.meta.completeness_score) > float(empty.meta.completeness_score)
