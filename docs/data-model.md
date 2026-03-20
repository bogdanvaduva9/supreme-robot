# Atlas — Locality Data Model

## Python Dataclass Reference

The canonical Locality model used throughout the backend. Lives in `backend/src/shared/models.py`. The DynamoDB record stores this as a JSON-serialised document under `PK=LOC#{siruta}`, `SK=#METADATA`.

```python
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Optional


# ---------------------------------------------------------------------------
# Enums
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
# Sub-models
# ---------------------------------------------------------------------------

@dataclass
class Coordinates:
    lat: float
    lng: float


@dataclass
class AdminParent:
    judet_code: str          # e.g. "MM"
    judet_name: str          # e.g. "Maramureș"
    comuna_siruta: str = ""
    comuna_name: str = ""


@dataclass
class Identity:
    name: str                           # official name
    type: LocalityType
    judet_code: str
    judet_name: str
    admin_parent: AdminParent
    coordinates: Coordinates
    alternate_names: list[str] = field(default_factory=list)
    boundary: Optional[dict] = None     # GeoJSON Polygon
    postal_code: str = ""


@dataclass
class PopulationPoint:
    year: int
    count: int


@dataclass
class AgeDistribution:
    under_18: float
    age_18_to_64: float
    over_65: float


@dataclass
class EthnicGroup:
    name: str
    percent: float


@dataclass
class Demographics:
    population: int
    population_year: int
    population_trend: PopulationTrend = PopulationTrend.STABLE
    population_history: list[PopulationPoint] = field(default_factory=list)
    age_distribution: Optional[AgeDistribution] = None
    ethnic_composition: list[EthnicGroup] = field(default_factory=list)


@dataclass
class DistanceToCity:
    city_name: str
    distance_km: float
    drive_minutes: int


@dataclass
class MobileCoverage:
    operator: str   # "Vodafone" | "Orange" | "Telekom" | "Digi"
    quality: str    # "4G" | "3G" | "2G" | "none"


@dataclass
class Utilities:
    gas: bool = False
    water: bool = False
    sewage: bool = False
    notes: str = ""


@dataclass
class Infrastructure:
    road_access: RoadAccess = RoadAccess.UNPAVED
    internet_availability: InternetAvailability = InternetAvailability.UNKNOWN
    public_transport: str = ""
    distance_to_city: Optional[DistanceToCity] = None
    mobile_coverage: list[MobileCoverage] = field(default_factory=list)
    utilities: Utilities = field(default_factory=Utilities)


@dataclass
class NearestFacility:
    name: str
    distance_km: float


@dataclass
class LocalBusiness:
    name: str
    category: str           # OSM category tag
    osm_id: str = ""
    phone: str = ""
    website: str = ""


@dataclass
class Services:
    local_businesses: list[LocalBusiness] = field(default_factory=list)
    nearest_hospital: Optional[NearestFacility] = None
    nearest_school: Optional[NearestFacility] = None
    nearest_atm: Optional[NearestFacility] = None
    nearest_pharmacy: Optional[NearestFacility] = None
    police_station: Optional[NearestFacility] = None


@dataclass
class Landmark:
    name: str
    type: str               # "church" | "monument" | "historical_site" | "other"
    description: str = ""
    coordinates: Optional[Coordinates] = None


@dataclass
class Culture:
    landmarks: list[Landmark] = field(default_factory=list)
    traditions: list[str] = field(default_factory=list)
    notable_people: list[str] = field(default_factory=list)
    dialect_notes: str = ""
    local_cuisine: str = ""


@dataclass
class Nature:
    elevation_m: int = 0
    terrain_type: str = ""  # "mountain" | "hill" | "plain" | "valley"
    nearby_attractions: list[str] = field(default_factory=list)
    rivers: list[str] = field(default_factory=list)
    lakes: list[str] = field(default_factory=list)
    protected_areas: list[str] = field(default_factory=list)


@dataclass
class LocalProducer:
    name: str
    product: str            # "honey" | "dairy" | "craft" | etc.
    contact: str = ""


@dataclass
class Economy:
    primary_industries: list[str] = field(default_factory=list)
    local_producers: list[LocalProducer] = field(default_factory=list)
    tourism_potential: str = ""
    accommodation_count: int = 0
    employment_notes: str = ""


@dataclass
class Living:
    property_price_note: str = ""
    quality_of_life_notes: str = ""
    safety_perception: str = ""
    community_vibe: str = ""


@dataclass
class Photo:
    photo_id: str
    s3_key: str
    thumbnail_key: str
    contributor_id: str
    uploaded_at: datetime
    caption: str = ""
    year: int = 0
    coordinates: Optional[Coordinates] = None


@dataclass
class VideoLink:
    title: str
    url: str


@dataclass
class Media:
    photos: list[Photo] = field(default_factory=list)
    videos: list[VideoLink] = field(default_factory=list)
    satellite_thumbnail_url: str = ""


@dataclass
class Meta:
    created_at: datetime
    last_updated: datetime
    completeness_score: float = 0.0     # 0.0 – 1.0
    contributors: list[str] = field(default_factory=list)   # Cognito user IDs
    data_sources: list[str] = field(default_factory=list)   # "ins"|"osm"|"wikidata"|"community"


# ---------------------------------------------------------------------------
# Root entity
# ---------------------------------------------------------------------------

@dataclass
class Locality:
    """
    Core entity. Every Romanian locality (sat, comună, oraș, municipiu) has
    exactly one Locality record, keyed by its SIRUTA code.

    DynamoDB:
        PK = f"LOC#{siruta}"
        SK = "#METADATA"
    """
    siruta: str
    identity: Identity
    demographics: Demographics
    infrastructure: Infrastructure
    meta: Meta
    services: Services = field(default_factory=Services)
    culture: Culture = field(default_factory=Culture)
    nature: Nature = field(default_factory=Nature)
    economy: Economy = field(default_factory=Economy)
    living: Living = field(default_factory=Living)
    media: Media = field(default_factory=Media)

    # Denormalised for DynamoDB GSI projections
    @property
    def pk(self) -> str:
        return f"LOC#{self.siruta}"

    @property
    def sk(self) -> str:
        return "#METADATA"
```

---

## Serialisation Notes

Use `dataclasses.asdict()` for DynamoDB marshalling, then pass through `boto3.dynamodb.types.TypeSerializer`. For clean round-trips:

```python
# backend/src/shared/ddb.py
import dataclasses
from boto3.dynamodb.types import TypeSerializer, TypeDeserializer

serializer = TypeSerializer()
deserializer = TypeDeserializer()

def to_ddb_item(locality: Locality) -> dict:
    raw = dataclasses.asdict(locality)
    raw["PK"] = locality.pk
    raw["SK"] = locality.sk
    # GSI fields
    raw["JudetCode"] = locality.identity.judet_code
    raw["CompletenessScore"] = f"{locality.meta.completeness_score * 100:06.2f}"  # zero-padded for range sort
    raw["LastUpdated"] = locality.meta.last_updated.isoformat()
    raw["EntityType"] = "LOC"
    return {k: serializer.serialize(v) for k, v in raw.items()}
```

---

## Completeness Score Calculation

The score (0.0–1.0, displayed as 0–100%) is computed from field presence and recency. Weights:

| Section | Weight |
|---|---|
| Identity (name, type, parent, coordinates) | 15% |
| Demographics (population + year) | 15% |
| Infrastructure (road, mobile coverage, internet) | 20% |
| Services (hospital, school, ATM) | 15% |
| Culture (at least 1 landmark) | 10% |
| Media (satellite thumbnail present) | 10% |
| Economy (primary industries non-empty) | 10% |
| Community contribution (at least 1 contributor) | 5% |

Recency penalty: data older than 3 years reduces the section score by 20%.
