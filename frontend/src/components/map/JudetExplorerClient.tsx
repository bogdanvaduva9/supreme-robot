'use client'

import dynamic from 'next/dynamic'
import { Map } from 'lucide-react'
import type { JudetMeta } from '@/lib/judete'

const JudetExplorer = dynamic(() => import('./JudetExplorer'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-gray-100 animate-pulse flex items-center justify-center">
      <Map className="w-8 h-8 text-gray-300" />
    </div>
  ),
})

export default function JudetExplorerClient({ judet }: { judet: JudetMeta }) {
  return <JudetExplorer judet={judet} />
}
