import { MapPin, Users } from 'lucide-react'
import type { Locality } from '@/lib/types'
import { cn, formatCompleteness, formatPopulation, localityTypeLabel } from '@/lib/utils'

interface Props {
  locality: Locality
  onClick: () => void
  isSelected?: boolean
}

export default function LocalityCard({ locality, onClick, isSelected }: Props) {
  const { identity, demographics, meta } = locality
  const score = meta?.completeness_score ?? 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-gray-50 transition-colors hover:bg-gray-50',
        isSelected && 'bg-blue-50 border-l-2 border-l-atlas-blue',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{identity.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">{localityTypeLabel(identity.type)}</span>
            {demographics?.population ? (
              <>
                <span className="text-gray-200">·</span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="w-3 h-3" />
                  {formatPopulation(demographics.population)}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Completeness ring */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <CompletenessRing score={score} />
        </div>
      </div>

      {identity.coordinates && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-300">
          <MapPin className="w-3 h-3" />
          <span>
            {identity.coordinates.lat.toFixed(4)}, {identity.coordinates.lng.toFixed(4)}
          </span>
        </div>
      )}
    </button>
  )
}

function CompletenessRing({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const radius = 10
  const circumference = 2 * Math.PI * radius
  const dash = (pct / 100) * circumference

  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#9ca3af'

  return (
    <div className="relative flex items-center justify-center" title={`Completitudine: ${pct}%`}>
      <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
        <circle cx="14" cy="14" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
        <circle
          cx="14"
          cy="14"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[9px] font-semibold" style={{ color }}>
        {pct}
      </span>
    </div>
  )
}
