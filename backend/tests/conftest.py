"""Shared pytest fixtures."""
from __future__ import annotations

import os
import sys

import pytest
from moto import mock_aws

# Add src/ to path so tests can import shared, api, pipeline modules directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

# Powertools requires these env vars at import time
os.environ.setdefault("POWERTOOLS_SERVICE_NAME", "atlas-test")
os.environ.setdefault("POWERTOOLS_METRICS_NAMESPACE", "Atlas")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-central-1")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_SECURITY_TOKEN", "testing")
os.environ.setdefault("AWS_SESSION_TOKEN", "testing")
os.environ.setdefault("TABLE_NAME", "atlas-test-main")


@pytest.fixture
def dynamodb_table():  # type: ignore[no-untyped-def]
    """Mocked DynamoDB table — created via PynamoDB, schema matches production."""
    with mock_aws():
        from shared.models import LocalityModel

        LocalityModel.create_table(billing_mode="PAY_PER_REQUEST", wait=True)
        yield LocalityModel


def make_locality(
    siruta: str = "123456",
    name: str = "Sat Test",
    judet_code: str = "MM",
    completeness: float = 0.5,
) -> "LocalityModel":  # type: ignore[type-arg]
    """Build and return an unsaved LocalityModel with minimal required fields."""
    from datetime import datetime, timezone

    from shared.models import (
        AdminParentAttribute,
        CoordinatesAttribute,
        DemographicsAttribute,
        IdentityAttribute,
        InfrastructureAttribute,
        LocalityMetaAttribute,
        LocalityModel,
    )

    now = datetime.now(tz=timezone.utc)

    return LocalityModel(
        PK=f"LOC#{siruta}",
        SK="#METADATA",
        siruta=siruta,
        JudetCode=judet_code,
        CompletenessScore=f"{completeness * 100:06.2f}",
        EntityType="LOC",
        LastUpdated=now.isoformat(),
        identity=IdentityAttribute(
            name=name,
            type="sat",
            judet_code=judet_code,
            judet_name="Maramureș",
            admin_parent=AdminParentAttribute(judet_code=judet_code, judet_name="Maramureș"),
            coordinates=CoordinatesAttribute(lat=47.5, lng=24.0),
            alternate_names=[],
        ),
        demographics=DemographicsAttribute(
            population=500,
            population_year=2021,
            population_history=[],
            ethnic_composition=[],
        ),
        infrastructure=InfrastructureAttribute(
            mobile_coverage=[],
        ),
        meta=LocalityMetaAttribute(
            created_at=now,
            last_updated=now,
            completeness_score=completeness,
            contributors=[],
            data_sources=[],
        ),
    )
