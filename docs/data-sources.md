# Atlas — Seed Data Sources

Reference for the Phase 1 import pipeline. Each section covers access method, license, expected format, refresh cadence, and the Lambda that consumes it.

---

## 1. INS — Institutul Național de Statistică

**What it provides:** Population by locality, demographic breakdowns, economic indicators.

**Access:**
- TEMPO Online: `statistici.insse.ro/shop/index.jsp` — interactive query builder, exports as XLS or CSV
- Direct CSV download URLs follow the pattern `statistici.insse.ro/shop/...` (change per query)
- No API key required; public data

**Key datasets:**
| Dataset code | Content |
|---|---|
| `POP107A` | Population by locality and year (census + estimates) |
| `POP107B` | Population by age group and locality |
| `POP109A` | Ethnic composition by locality (2011 census) |

**Format:** CSV or XLS, Romanian headers, diacritics present

**License:** Open data, attribution required ("Sursa: INS")

**Lambda:** `pipeline-import-ins`

**Refresh:** Annually (census) or when new estimates published (~Q2 each year)

**Notes:**
- SIRUTA codes are included in the export — use these as the join key
- Population data lags by 1-2 years for estimates; census data (last: 2021) is the most accurate
- Diacritics in locality names may be inconsistent (ș vs ş) — normalise to cedilla form (ș, ț)

---

## 2. OpenStreetMap (OSM)

**What it provides:** Geographic boundaries (GeoJSON polygons), roads, POIs (churches, schools, shops, hospitals, ATMs).

**Access:**
- **Overpass API:** `overpass-api.de/api/interpreter` — query-based, no key required
- **Geofabrik extracts:** `download.geofabrik.de/europe/romania.html` — full Romania PBF/OSM dump, updated daily
- **Nominatim:** `nominatim.openstreetmap.org` — geocoding and reverse geocoding

**Key Overpass queries:**

Fetch all admin boundaries for Maramureș:
```
[out:json][timeout:60];
relation["boundary"="administrative"]["admin_level"="8"]["addr:county"="MM"];
out geom;
```

Fetch POIs within a locality boundary (replace `{relation_id}`):
```
[out:json][timeout:30];
(
  node(area:{relation_id})["amenity"];
  node(area:{relation_id})["shop"];
  node(area:{relation_id})["tourism"];
);
out body;
```

**Admin level mapping:**
| OSM `admin_level` | Romanian equivalent |
|---|---|
| 4 | Județ |
| 6 | Municipiu / Oraș |
| 8 | Comună |
| 10 | Sat (not always present) |

**Format:** GeoJSON (via Overpass) or PBF (Geofabrik bulk)

**License:** ODbL — attribution required, derivative datasets must also be ODbL

**Lambda:** `pipeline-import-osm`

**Refresh:** Monthly (boundaries change rarely; POIs more frequently)

**Notes:**
- OSM `ref:siruta` tag exists on many Romanian boundaries — use it to join with INS data
- Not all villages have OSM boundaries at `admin_level=10`; fall back to centroid point
- Rate limit: 1 request/second on public Overpass; use Geofabrik bulk dump for full import

---

## 3. Wikidata / Wikipedia

**What it provides:** Descriptions, coordinates, alternate names, notable people, images (via Wikimedia Commons).

**Access:**
- **SPARQL endpoint:** `query.wikidata.org/sparql`
- **Wikipedia API:** `ro.wikipedia.org/api/rest_v1/page/summary/{title}`

**SPARQL query — Romanian localities with SIRUTA:**
```sparql
SELECT ?item ?itemLabel ?siruta ?coord ?populationLabel WHERE {
  ?item wdt:P31/wdt:P279* wd:Q640364.   # instance of Romanian locality
  ?item wdt:P843 ?siruta.                # SIRUTA code
  OPTIONAL { ?item wdt:P625 ?coord. }
  OPTIONAL { ?item wdt:P1082 ?population. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ro,en". }
}
```

**Format:** JSON (SPARQL results), plain text (Wikipedia API)

**License:** CC0 (Wikidata), CC BY-SA (Wikipedia text)

**Lambda:** `pipeline-import-wikidata`

**Refresh:** Quarterly

**Notes:**
- Wikidata `P843` is the SIRUTA property — reliable join key
- Not all localities have Wikidata entries; handle gracefully (empty description is fine)
- Wikipedia summaries may be in Romanian or absent — fetch `ro.wikipedia.org` first, fall back to `en.wikipedia.org`

---

## 4. ANCOM — Mobile Coverage

**What it provides:** Mobile coverage maps per operator (Vodafone, Orange, Telekom, Digi) at municipality/commune level.

**Access:**
- Public portal: `ancom.ro/acoperire-retele-mobile_5541`
- Coverage data downloadable as shapefiles or viewable via WMS
- No API — scrape or download shapefiles directly

**Format:** Shapefile (.shp) or GeoTIFF

**License:** Public, attribution required

**Lambda:** `pipeline-import-ancom`

**Refresh:** Annually (ANCOM updates yearly)

**Notes:**
- Coverage is polygon-based; intersect with locality boundary to determine coverage quality
- Quality levels: 4G, 3G, 2G, no coverage
- All 4 operators should be checked independently

---

## 5. Sentinel-2 Satellite Imagery (EU Copernicus)

**What it provides:** Current aerial/satellite thumbnail for each locality.

**Access:**
- **Copernicus Data Space:** `dataspace.copernicus.eu` — free registration, REST API
- **Sentinel Hub:** `sentinelhub.com` — freemium, cleaner API, process API for on-the-fly thumbnails
- **AWS S3 (requester-pays):** `s3://sentinel-s2-l2a/` — raw tiles, organised by UTM grid

**Recommended approach:** Sentinel Hub Process API for thumbnail generation:
```
POST https://services.sentinel-hub.com/api/v1/process
{
  "input": {
    "bounds": { "bbox": [lng_min, lat_min, lng_max, lat_max], "properties": { "crs": "http://www.opengis.net/def/crs/EPSG/0/4326" } },
    "data": [{ "type": "sentinel-2-l2a", "dataFilter": { "maxCloudCoverage": 20 } }]
  },
  "output": { "width": 512, "height": 512, "responses": [{ "identifier": "default", "format": { "type": "image/jpeg" } }] },
  "evalscript": "..."
}
```

**Format:** JPEG thumbnail, stored to `atlas-{env}-satellite/{siruta}.jpg`

**License:** CC BY 4.0 (Copernicus data)

**Lambda:** `pipeline-import-sentinel` (triggered once per locality during initial import)

**Refresh:** Annually or on-demand (cloud cover may force re-fetch)

**Notes:**
- Use NDVI evalscript for a natural-colour view of rural localities
- Store bounding box used for the thumbnail in the Locality record for reproducibility
- Sentinel Hub free tier: 30,000 processing units/month — sufficient for ~300 localities per run

---

## 6. Geonames

**What it provides:** Postal codes, elevation, alternate names (including historical and minority language names).

**Access:**
- Free download: `download.geonames.org/export/dump/RO.zip`
- No API key required

**Format:** TSV (tab-separated), UTF-8

**License:** CC BY 4.0

**Lambda:** `pipeline-import-geonames`

**Refresh:** Monthly dump available

**Notes:**
- Join on `alternatenames` table for historical locality names
- Elevation is point-based (centroid) — adequate for the data model
- Postal codes are included; cross-reference with SIRUTA if available

---

## 7. ANCPI / geoportal.gov.ro

**What it provides:** Some cadastral and topographic data; administrative boundary shapefiles.

**Access:**
- `geoportal.gov.ro` — WMS/WFS services, some data freely downloadable
- Quality and completeness vary significantly

**Format:** WMS tiles, WFS GeoJSON

**License:** Mixed — check per dataset

**Lambda:** None currently planned (use OSM boundaries which are more complete)

**Notes:**
- Lower priority than OSM for boundary data
- May be useful for precise cadastral boundaries in Phase 3 (property data)

---

## Join Key Reference

All sources must be joined using **SIRUTA code** as the common identifier:

| Source | SIRUTA field |
|---|---|
| INS CSV | Included as a column |
| OSM | `ref:siruta` tag on relation |
| Wikidata | Property `P843` |
| Geonames | `alternatenames` table (feature code `ADM3`) |
| ANCOM | Must spatial-join (polygon intersection) |
| Sentinel-2 | No SIRUTA — use locality bounding box |

Maintain a **canonical SIRUTA → locality name mapping** in `atlas-{env}-imports/siruta-master.json` generated from the INS source of truth. All other sources validate against this list.
