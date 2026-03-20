'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { JudetMeta } from '@/lib/judete'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const ROMANIA_VIEW = {
  longitude: 24.97,
  latitude: 45.9,
  zoom: 6.2,
}

interface Props {
  judete: JudetMeta[]
}

export default function RomaniaMap({ judete }: Props) {
  const router = useRouter()
  const [hovered, setHovered] = useState<JudetMeta | null>(null)

  const handleJudetClick = useCallback(
    (judet: JudetMeta) => {
      router.push(`/judete/${judet.code}`)
    },
    [router],
  )

  return (
    <Map
      initialViewState={ROMANIA_VIEW}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE}
      minZoom={5}
      maxZoom={10}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {/* Județ markers — clickable dots at each județ center */}
      {judete.map((judet) => (
        <JudetMarker
          key={judet.code}
          judet={judet}
          isHovered={hovered?.code === judet.code}
          onHover={setHovered}
          onClick={handleJudetClick}
        />
      ))}

      {/* Hover tooltip */}
      {hovered && (
        <Popup
          longitude={hovered.center.lng}
          latitude={hovered.center.lat}
          anchor="bottom"
          offset={16}
          closeButton={false}
          closeOnClick={false}
        >
          <div className="px-3 py-2 text-sm font-medium text-gray-900">
            {hovered.name}
          </div>
        </Popup>
      )}
    </Map>
  )
}

function JudetMarker({
  judet,
  isHovered,
  onHover,
  onClick,
}: {
  judet: JudetMeta
  isHovered: boolean
  onHover: (j: JudetMeta | null) => void
  onClick: (j: JudetMeta) => void
}) {
  return (
    <Marker longitude={judet.center.lng} latitude={judet.center.lat}>
      <button
        className={`
          rounded-full border-2 border-white shadow-md transition-all duration-150 cursor-pointer
          ${isHovered ? 'w-5 h-5 bg-atlas-red' : 'w-3 h-3 bg-atlas-blue'}
        `}
        onMouseEnter={() => onHover(judet)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onClick(judet)}
        aria-label={`Explorează ${judet.name}`}
      />
    </Marker>
  )
}
