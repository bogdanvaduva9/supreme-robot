"""
PynamoDB model for the Atlas single-table DynamoDB design.

Table: atlas-prod-main
PK: LOC#{siruta}   SK: #METADATA
"""
from __future__ import annotations

import os
from enum import StrEnum

from pynamodb.attributes import (
    BooleanAttribute,
    ListAttribute,
    MapAttribute,
    NumberAttribute,
    UnicodeAttribute,
    UTCDateTimeAttribute,
)
from pynamodb.indexes import GlobalSecondaryIndex, KeysOnlyProjection
from pynamodb.models import Model


# ---------------------------------------------------------------------------
# Enums  (used for validation in application code; stored as plain strings)
# ---------------------------------------------------------------------------


class LocalityType(StrEnum):
    SAT = "sat"
    COMUNA = "comuna"
    ORAS = "oras"
    MUNICIPIU = "municipiu"
    CARTIER = "cartier"


class PopulationTrend(StrEnum):
    GROWING = "growing"
    DECLINING = "declining"
    STABLE = "stable"


class RoadAccess(StrEnum):
    PAVED = "paved"
    UNPAVED = "unpaved"
    SEASONAL = "seasonal"


class InternetAvailability(StrEnum):
    FIBER = "fiber"
    DSL = "dsl"
    NONE = "none"
    UNKNOWN = "unknown"


# ---------------------------------------------------------------------------
# Nested MapAttributes
# ---------------------------------------------------------------------------


class CoordinatesAttribute(MapAttribute):
    lat = NumberAttribute()
    lng = NumberAttribute()


class AdminParentAttribute(MapAttribute):
    judet_code = UnicodeAttribute()
    judet_name = UnicodeAttribute()
    comuna_siruta = UnicodeAttribute(default="")
    comuna_name = UnicodeAttribute(default="")


class IdentityAttribute(MapAttribute):
    name = UnicodeAttribute()
    type = UnicodeAttribute()           # LocalityType value
    judet_code = UnicodeAttribute()
    judet_name = UnicodeAttribute()
    admin_parent = AdminParentAttribute()
    coordinates = CoordinatesAttribute()
    alternate_names = ListAttribute(of=UnicodeAttribute)
    boundary = MapAttribute(null=True)  # GeoJSON Polygon — arbitrary structure
    postal_code = UnicodeAttribute(default="")


class PopulationPointAttribute(MapAttribute):
    year = NumberAttribute()
    count = NumberAttribute()


class AgeDistributionAttribute(MapAttribute):
    under_18 = NumberAttribute()
    age_18_to_64 = NumberAttribute()
    over_65 = NumberAttribute()


class EthnicGroupAttribute(MapAttribute):
    name = UnicodeAttribute()
    percent = NumberAttribute()


class DemographicsAttribute(MapAttribute):
    population = NumberAttribute()
    population_year = NumberAttribute()
    population_trend = UnicodeAttribute(default=PopulationTrend.STABLE)
    population_history = ListAttribute(of=PopulationPointAttribute)
    age_distribution = AgeDistributionAttribute(null=True)
    ethnic_composition = ListAttribute(of=EthnicGroupAttribute)


class DistanceToCityAttribute(MapAttribute):
    city_name = UnicodeAttribute()
    distance_km = NumberAttribute()
    drive_minutes = NumberAttribute()


class MobileCoverageAttribute(MapAttribute):
    operator = UnicodeAttribute()  # "Vodafone" | "Orange" | "Telekom" | "Digi"
    quality = UnicodeAttribute()   # "4G" | "3G" | "2G" | "none"


class UtilitiesAttribute(MapAttribute):
    gas = BooleanAttribute(default=False)
    water = BooleanAttribute(default=False)
    sewage = BooleanAttribute(default=False)
    notes = UnicodeAttribute(default="")


class InfrastructureAttribute(MapAttribute):
    road_access = UnicodeAttribute(default=RoadAccess.UNPAVED)
    internet_availability = UnicodeAttribute(default=InternetAvailability.UNKNOWN)
    public_transport = UnicodeAttribute(default="")
    distance_to_city = DistanceToCityAttribute(null=True)
    mobile_coverage = ListAttribute(of=MobileCoverageAttribute)
    utilities = UtilitiesAttribute(null=True)


class NearestFacilityAttribute(MapAttribute):
    name = UnicodeAttribute()
    distance_km = NumberAttribute()


class LocalBusinessAttribute(MapAttribute):
    name = UnicodeAttribute()
    category = UnicodeAttribute()
    osm_id = UnicodeAttribute(default="")
    phone = UnicodeAttribute(default="")
    website = UnicodeAttribute(default="")


class ServicesAttribute(MapAttribute):
    local_businesses = ListAttribute(of=LocalBusinessAttribute)
    nearest_hospital = NearestFacilityAttribute(null=True)
    nearest_school = NearestFacilityAttribute(null=True)
    nearest_atm = NearestFacilityAttribute(null=True)
    nearest_pharmacy = NearestFacilityAttribute(null=True)
    police_station = NearestFacilityAttribute(null=True)


class LandmarkAttribute(MapAttribute):
    name = UnicodeAttribute()
    type = UnicodeAttribute()
    description = UnicodeAttribute(default="")
    coordinates = CoordinatesAttribute(null=True)


class CultureAttribute(MapAttribute):
    landmarks = ListAttribute(of=LandmarkAttribute)
    traditions = ListAttribute(of=UnicodeAttribute)
    notable_people = ListAttribute(of=UnicodeAttribute)
    dialect_notes = UnicodeAttribute(default="")
    local_cuisine = UnicodeAttribute(default="")


class NatureAttribute(MapAttribute):
    elevation_m = NumberAttribute(default=0)
    terrain_type = UnicodeAttribute(default="")
    nearby_attractions = ListAttribute(of=UnicodeAttribute)
    rivers = ListAttribute(of=UnicodeAttribute)
    lakes = ListAttribute(of=UnicodeAttribute)
    protected_areas = ListAttribute(of=UnicodeAttribute)


class LocalProducerAttribute(MapAttribute):
    name = UnicodeAttribute()
    product = UnicodeAttribute()
    contact = UnicodeAttribute(default="")


class EconomyAttribute(MapAttribute):
    primary_industries = ListAttribute(of=UnicodeAttribute)
    local_producers = ListAttribute(of=LocalProducerAttribute)
    tourism_potential = UnicodeAttribute(default="")
    accommodation_count = NumberAttribute(default=0)
    employment_notes = UnicodeAttribute(default="")


class LivingAttribute(MapAttribute):
    property_price_note = UnicodeAttribute(default="")
    quality_of_life_notes = UnicodeAttribute(default="")
    safety_perception = UnicodeAttribute(default="")
    community_vibe = UnicodeAttribute(default="")


class PhotoAttribute(MapAttribute):
    photo_id = UnicodeAttribute()
    s3_key = UnicodeAttribute()
    thumbnail_key = UnicodeAttribute()
    contributor_id = UnicodeAttribute()
    uploaded_at = UTCDateTimeAttribute()
    caption = UnicodeAttribute(default="")
    year = NumberAttribute(default=0)
    coordinates = CoordinatesAttribute(null=True)


class VideoLinkAttribute(MapAttribute):
    title = UnicodeAttribute()
    url = UnicodeAttribute()


class MediaAttribute(MapAttribute):
    photos = ListAttribute(of=PhotoAttribute)
    videos = ListAttribute(of=VideoLinkAttribute)
    satellite_thumbnail_url = UnicodeAttribute(default="")


class LocalityMetaAttribute(MapAttribute):
    """Metadata about a locality record (named LocalityMeta to avoid clash with PynamoDB Meta)."""
    created_at = UTCDateTimeAttribute()
    last_updated = UTCDateTimeAttribute()
    completeness_score = NumberAttribute(default=0.0)  # 0.0 – 1.0
    contributors = ListAttribute(of=UnicodeAttribute)
    data_sources = ListAttribute(of=UnicodeAttribute)  # "ins"|"osm"|"wikidata"|"community"


# ---------------------------------------------------------------------------
# GSI definitions
# ---------------------------------------------------------------------------


class JudetCompletenessIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = "judet-completeness-index"
        projection = KeysOnlyProjection()

    JudetCode = UnicodeAttribute(hash_key=True)
    CompletenessScore = UnicodeAttribute(range_key=True)


class UpdatedIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = "updated-index"
        projection = KeysOnlyProjection()

    EntityType = UnicodeAttribute(hash_key=True)
    LastUpdated = UnicodeAttribute(range_key=True)


# ---------------------------------------------------------------------------
# Root model
# ---------------------------------------------------------------------------


class LocalityModel(Model):
    """
    Single-table DynamoDB model for a Romanian locality.

    PK = LOC#{siruta}
    SK = #METADATA
    """

    class Meta:
        table_name = os.environ.get("TABLE_NAME", "atlas-prod-main")
        region = os.environ.get("AWS_DEFAULT_REGION", "eu-central-1")

    # Primary key
    PK = UnicodeAttribute(hash_key=True)
    SK = UnicodeAttribute(range_key=True, default="#METADATA")

    # Denormalised GSI fields
    JudetCode = UnicodeAttribute()
    CompletenessScore = UnicodeAttribute()  # zero-padded, e.g. "050.00"
    EntityType = UnicodeAttribute(default="LOC")
    LastUpdated = UnicodeAttribute()

    # Business data
    siruta = UnicodeAttribute()
    identity = IdentityAttribute()
    demographics = DemographicsAttribute()
    infrastructure = InfrastructureAttribute()
    meta = LocalityMetaAttribute()
    services = ServicesAttribute(null=True)
    culture = CultureAttribute(null=True)
    nature = NatureAttribute(null=True)
    economy = EconomyAttribute(null=True)
    living = LivingAttribute(null=True)
    media = MediaAttribute(null=True)

    # GSI definitions
    judet_completeness_index = JudetCompletenessIndex()
    updated_index = UpdatedIndex()

    @classmethod
    def build_pk(cls, siruta: str) -> str:
        return f"LOC#{siruta}"

    def completeness_score_float(self) -> float:
        return float(self.meta.completeness_score)
