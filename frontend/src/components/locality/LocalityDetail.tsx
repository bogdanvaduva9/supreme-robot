import {
  ArrowLeft,
  Building2,
  Globe,
  Landmark,
  Leaf,
  MapPin,
  Phone,
  Radio,
  TrendingDown,
  TrendingUp,
  Users,
  Wifi,
  X,
} from 'lucide-react'
import type { Locality } from '@/lib/types'
import {
  cn,
  formatCompleteness,
  formatPopulation,
  localityTypeLabel,
} from '@/lib/utils'

interface Props {
  locality: Locality
  onClose: () => void
}

export default function LocalityDetail({ locality, onClose }: Props) {
  const { identity, demographics, infrastructure, services, culture, nature, economy, meta } =
    locality

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-start gap-3">
        <button
          onClick={onClose}
          className="mt-0.5 p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Înapoi la listă"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">{identity.name}</h2>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <TypeBadge type={identity.type} />
            <span className="text-xs text-gray-400">{identity.judet_name}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">
              {formatCompleteness(meta?.completeness_score ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {/* Demographics */}
        {demographics && (
          <Section icon={<Users className="w-4 h-4" />} title="Populație">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatPopulation(demographics.population)}
              </span>
              <span className="text-xs text-gray-400">loc. ({demographics.population_year})</span>
              <TrendIcon trend={demographics.population_trend} />
            </div>
            {demographics.age_distribution && (
              <AgeBar dist={demographics.age_distribution} />
            )}
          </Section>
        )}

        {/* Infrastructure */}
        {infrastructure && (
          <Section icon={<Building2 className="w-4 h-4" />} title="Infrastructură">
            <InfoRow label="Drum" value={roadLabel(infrastructure.road_access)} />
            <InfoRow label="Internet" value={internetLabel(infrastructure.internet_availability)} />
            {infrastructure.distance_to_city && (
              <InfoRow
                label={`Până la ${infrastructure.distance_to_city.city_name}`}
                value={`${infrastructure.distance_to_city.distance_km} km · ${infrastructure.distance_to_city.drive_minutes} min`}
              />
            )}
            {infrastructure.mobile_coverage.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                  <Radio className="w-3 h-3" /> Acoperire mobilă
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {infrastructure.mobile_coverage.map((c, i) => (
                    <CoverageBadge key={i} operator={c.operator} quality={c.quality} />
                  ))}
                </div>
              </div>
            )}
            {infrastructure.utilities && (
              <div className="flex gap-3 mt-2">
                <UtilityDot label="Gaz" active={infrastructure.utilities.gas} />
                <UtilityDot label="Apă" active={infrastructure.utilities.water} />
                <UtilityDot label="Canalizare" active={infrastructure.utilities.sewage} />
              </div>
            )}
          </Section>
        )}

        {/* Services */}
        {services && (
          <Section icon={<Phone className="w-4 h-4" />} title="Servicii">
            {services.nearest_hospital && (
              <InfoRow label="Spital" value={`${services.nearest_hospital.name} (${services.nearest_hospital.distance_km} km)`} />
            )}
            {services.nearest_school && (
              <InfoRow label="Școală" value={`${services.nearest_school.name} (${services.nearest_school.distance_km} km)`} />
            )}
            {services.nearest_pharmacy && (
              <InfoRow label="Farmacie" value={`${services.nearest_pharmacy.name} (${services.nearest_pharmacy.distance_km} km)`} />
            )}
            {services.nearest_atm && (
              <InfoRow label="ATM" value={`${services.nearest_atm.name} (${services.nearest_atm.distance_km} km)`} />
            )}
          </Section>
        )}

        {/* Culture */}
        {culture && (culture.landmarks.length > 0 || culture.traditions.length > 0) && (
          <Section icon={<Landmark className="w-4 h-4" />} title="Cultură">
            {culture.landmarks.map((l, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium text-gray-700">{l.name}</span>
                {l.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{l.description}</p>
                )}
              </div>
            ))}
            {culture.traditions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {culture.traditions.map((t, i) => (
                  <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Nature */}
        {nature && (nature.elevation_m > 0 || nature.rivers.length > 0) && (
          <Section icon={<Leaf className="w-4 h-4" />} title="Natură">
            {nature.elevation_m > 0 && (
              <InfoRow label="Altitudine" value={`${nature.elevation_m} m`} />
            )}
            {nature.terrain_type && (
              <InfoRow label="Teren" value={nature.terrain_type} />
            )}
            {nature.rivers.length > 0 && (
              <InfoRow label="Râuri" value={nature.rivers.join(', ')} />
            )}
          </Section>
        )}

        {/* Data sources */}
        {meta?.data_sources && meta.data_sources.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-[10px] text-gray-300 uppercase tracking-wide mb-1.5">Surse date</p>
            <div className="flex flex-wrap gap-1">
              {meta.data_sources.map((s) => (
                <span key={s} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
        {icon}
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <span className="text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-gray-700 text-right">{value}</span>
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    municipiu: 'bg-blue-100 text-blue-700',
    oras: 'bg-indigo-100 text-indigo-700',
    comuna: 'bg-green-100 text-green-700',
    sat: 'bg-gray-100 text-gray-600',
    cartier: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', colors[type] ?? colors.sat)}>
      {localityTypeLabel(type)}
    </span>
  )
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'growing') return <TrendingUp className="w-4 h-4 text-green-500" />
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-400" />
  return null
}

function AgeBar({ dist }: { dist: { under_18: number; age_18_to_64: number; over_65: number } }) {
  return (
    <div className="mt-2">
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        <div className="bg-blue-300" style={{ width: `${dist.under_18}%` }} />
        <div className="bg-blue-500" style={{ width: `${dist.age_18_to_64}%` }} />
        <div className="bg-blue-200" style={{ width: `${dist.over_65}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>0-18: {dist.under_18}%</span>
        <span>18-64: {dist.age_18_to_64}%</span>
        <span>65+: {dist.over_65}%</span>
      </div>
    </div>
  )
}

function CoverageBadge({ operator, quality }: { operator: string; quality: string }) {
  const color = quality === '4G' ? 'bg-green-100 text-green-700' : quality === '3G' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', color)}>
      {operator} {quality}
    </span>
  )
}

function UtilityDot({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-green-500' : 'bg-gray-200')} />
      <span className={active ? 'text-gray-600' : 'text-gray-300'}>{label}</span>
    </div>
  )
}

function roadLabel(r: string) {
  const m: Record<string, string> = { paved: 'Asfaltat', unpaved: 'Neasfaltat', seasonal: 'Sezonier' }
  return m[r] ?? r
}

function internetLabel(i: string) {
  const m: Record<string, string> = { fiber: 'Fibră optică', dsl: 'DSL', none: 'Indisponibil', unknown: 'Necunoscut' }
  return m[i] ?? i
}
