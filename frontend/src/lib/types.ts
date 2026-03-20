import type { Geometry } from 'geojson'

export type { Geometry }

export interface Coordinates {
  lat: number
  lng: number
}

export interface AdminParent {
  judet_code: string
  judet_name: string
  comuna_siruta?: string
  comuna_name?: string
}

export interface Identity {
  name: string
  type: 'sat' | 'comuna' | 'oras' | 'municipiu' | 'cartier'
  judet_code: string
  judet_name: string
  admin_parent: AdminParent
  coordinates: Coordinates
  alternate_names: string[]
  boundary?: Geometry | null
  postal_code?: string
}

export interface PopulationPoint {
  year: number
  count: number
}

export interface AgeDistribution {
  under_18: number
  age_18_to_64: number
  over_65: number
}

export interface EthnicGroup {
  name: string
  percent: number
}

export interface Demographics {
  population: number
  population_year: number
  population_trend: 'growing' | 'declining' | 'stable'
  population_history: PopulationPoint[]
  age_distribution?: AgeDistribution | null
  ethnic_composition: EthnicGroup[]
}

export interface MobileCoverage {
  operator: string
  quality: '4G' | '3G' | '2G' | 'none'
}

export interface Utilities {
  gas: boolean
  water: boolean
  sewage: boolean
  notes?: string
}

export interface DistanceToCity {
  city_name: string
  distance_km: number
  drive_minutes: number
}

export interface Infrastructure {
  road_access: 'paved' | 'unpaved' | 'seasonal'
  internet_availability: 'fiber' | 'dsl' | 'none' | 'unknown'
  public_transport?: string
  distance_to_city?: DistanceToCity | null
  mobile_coverage: MobileCoverage[]
  utilities: Utilities
}

export interface NearestFacility {
  name: string
  distance_km: number
}

export interface LocalBusiness {
  name: string
  category: string
  phone?: string
  website?: string
}

export interface Services {
  local_businesses: LocalBusiness[]
  nearest_hospital?: NearestFacility | null
  nearest_school?: NearestFacility | null
  nearest_atm?: NearestFacility | null
  nearest_pharmacy?: NearestFacility | null
}

export interface Landmark {
  name: string
  type: string
  description?: string
  coordinates?: Coordinates | null
}

export interface Culture {
  landmarks: Landmark[]
  traditions: string[]
  notable_people: string[]
  dialect_notes?: string
  local_cuisine?: string
}

export interface Nature {
  elevation_m: number
  terrain_type: string
  nearby_attractions: string[]
  rivers: string[]
  lakes: string[]
  protected_areas: string[]
}

export interface Economy {
  primary_industries: string[]
  tourism_potential?: string
  accommodation_count: number
  employment_notes?: string
}

export interface LocalityMeta {
  created_at: string
  last_updated: string
  completeness_score: number // 0.0 – 1.0
  contributors: string[]
  data_sources: string[]
}

export interface Locality {
  siruta: string
  identity: Identity
  demographics: Demographics
  infrastructure: Infrastructure
  meta: LocalityMeta
  services?: Services
  culture?: Culture
  nature?: Nature
  economy?: Economy
}

export interface Judet {
  code: string
  name: string
}

export interface ListByJudetResponse {
  judet: string
  judetName: string
  localities: Locality[]
  count: number
  nextToken?: string
}

export interface ListJudeteResponse {
  judete: Judet[]
  count: number
}
