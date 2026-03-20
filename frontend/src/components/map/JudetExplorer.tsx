'use client'

import { useCallback, useRef, useState } from 'react'
import Map, {
  MapRef,
  Marker,
  NavigationControl,
  Popup,
} from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import useSWR from 'swr'
import { listByJudet } from '@/lib/api'
import type { JudetMeta } from '@/lib/judete'
import type { Locality } from '@/lib/types'
import { formatPopulation, localityTypeLabel } from '@/lib/utils'
import LocalityCard from '@/components/locality/LocalityCard'
import LocalityDetail from '@/components/locality/LocalityDetail'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

interface Props {
  judet: JudetMeta
}

export default function JudetExplorer({ judet }: Props) {
  const mapRef = useRef<MapRef>(null)
  const [selected, setSelected] = useState<Locality | null>(null)
  const [popupLocality, setPopupLocality] = useState<Locality | null>(null)

  const { data, isLoading, error } = useSWR(
    ['localities', judet.code],
    () => listByJudet(judet.code),
    { revalidateOnFocus: false },
  )

  const localities = data?.localities ?? []
  const withCoords = localities.filter((l) => l.identity?.coordinates)

  const flyTo = useCallback(
    (locality: Locality) => {
      const { lat, lng } = locality.identity.coordinates
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 12, duration: 800 })
    },
    [],
  )

  const handleSelect = useCallback(
    (locality: Locality) => {
      setSelected(locality)
      setPopupLocality(null)
      flyTo(locality)
    },
    [flyTo],
  )

  const handleClose = useCallback(() => setSelected(null), [])

  return (
    <div className="flex h-full">
      {/* ── Map ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: judet.center.lng,
            latitude: judet.center.lat,
            zoom: judet.zoom,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE}
        >
          <NavigationControl position="top-right" showCompass={false} />

          {withCoords.map((locality) => (
            <LocalityMarker
              key={locality.siruta}
              locality={locality}
              isSelected={selected?.siruta === locality.siruta}
              isPopupOpen={popupLocality?.siruta === locality.siruta}
              onHover={setPopupLocality}
              onClick={handleSelect}
            />
          ))}

          {/* Hover popup */}
          {popupLocality && !selected && (
            <Popup
              longitude={popupLocality.identity.coordinates.lng}
              latitude={popupLocality.identity.coordinates.lat}
              anchor="bottom"
              offset={18}
              closeButton={false}
              closeOnClick={false}
            >
              <LocalityPopupContent locality={popupLocality} />
            </Popup>
          )}
        </Map>

        {/* Empty state overlay */}
        {!isLoading && withCoords.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 text-center shadow-lg">
              <p className="text-sm text-gray-500">Datele pentru {judet.name} vor fi disponibile</p>
              <p className="text-xs text-gray-400 mt-1">după primul import din pipeline</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Side panel ──────────────────────────────────────────────────────── */}
      <div className="w-80 xl:w-96 flex flex-col border-l border-gray-100 bg-white overflow-hidden">
        {selected ? (
          <LocalityDetail locality={selected} onClose={handleClose} />
        ) : (
          <LocalityList
            judet={judet}
            localities={localities}
            isLoading={isLoading}
            error={error}
            onSelect={handleSelect}
          />
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function LocalityMarker({
  locality,
  isSelected,
  isPopupOpen,
  onHover,
  onClick,
}: {
  locality: Locality
  isSelected: boolean
  isPopupOpen: boolean
  onHover: (l: Locality | null) => void
  onClick: (l: Locality) => void
}) {
  const { lat, lng } = locality.identity.coordinates

  return (
    <Marker longitude={lng} latitude={lat}>
      <button
        className={`
          rounded-full border-2 border-white shadow-md transition-all duration-150
          ${isSelected
            ? 'w-5 h-5 bg-atlas-red ring-2 ring-atlas-red ring-offset-1'
            : isPopupOpen
            ? 'w-4 h-4 bg-atlas-red'
            : 'w-2.5 h-2.5 bg-atlas-blue hover:w-4 hover:h-4 hover:bg-atlas-red'
          }
        `}
        onMouseEnter={() => onHover(locality)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onClick(locality)}
        aria-label={locality.identity.name}
      />
    </Marker>
  )
}

function LocalityPopupContent({ locality }: { locality: Locality }) {
  return (
    <div className="px-3 py-2.5 min-w-[160px]">
      <p className="font-semibold text-sm text-gray-900">{locality.identity.name}</p>
      <p className="text-xs text-gray-500 mt-0.5">
        {localityTypeLabel(locality.identity.type)}
        {locality.demographics?.population
          ? ` · ${formatPopulation(locality.demographics.population)} loc.`
          : ''}
      </p>
    </div>
  )
}

function LocalityList({
  judet,
  localities,
  isLoading,
  error,
  onSelect,
}: {
  judet: JudetMeta
  localities: Locality[]
  isLoading: boolean
  error: Error | undefined
  onSelect: (l: Locality) => void
}) {
  return (
    <>
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{judet.name}</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {isLoading ? 'Se încarcă...' : `${localities.length} localități`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-500">
            Eroare la încărcarea localităților.
          </div>
        )}

        {!isLoading && !error && localities.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-400">
            Nicio localitate importată încă.
          </div>
        )}

        {!isLoading && localities.map((locality) => (
          <LocalityCard
            key={locality.siruta}
            locality={locality}
            onClick={() => onSelect(locality)}
          />
        ))}
      </div>
    </>
  )
}
