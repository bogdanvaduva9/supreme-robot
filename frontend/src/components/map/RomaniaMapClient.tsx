'use client'

import dynamic from 'next/dynamic'
import { Map } from 'lucide-react'
import type { JudetMeta } from '@/lib/judete'

const RomaniaMap = dynamic(() => import('./RomaniaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <Map className="w-8 h-8 text-gray-300" />
    </div>
  ),
})

export default function RomaniaMapClient({ judete }: { judete: JudetMeta[] }) {
  return <RomaniaMap judete={judete} />
}
