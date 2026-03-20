import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Map } from 'lucide-react'
import { JUDETE, JUDETE_BY_CODE } from '@/lib/judete'
import JudetExplorerClient from '@/components/map/JudetExplorerClient'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateStaticParams() {
  return JUDETE.map((j) => ({ code: j.code }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const judet = JUDETE_BY_CODE[code.toUpperCase()]
  if (!judet) return {}
  return {
    title: judet.name,
    description: `Explorează localitățile din județul ${judet.name}`,
  }
}

export default async function JudetPage({ params }: Props) {
  const { code } = await params
  const judet = JUDETE_BY_CODE[code.toUpperCase()]

  if (!judet) notFound()

  return (
    <div className="flex flex-col h-screen">
      {/* Nav strip */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white z-10 flex-shrink-0">
        <Link
          href="/"
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Înapoi la hartă"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-atlas-blue" />
          <span className="font-bold text-sm tracking-tight text-gray-900">Atlas</span>
        </div>
        <span className="text-gray-200">/</span>
        <span className="text-sm text-gray-600">{judet.name}</span>
      </header>

      {/* Full-height split view */}
      <div className="flex-1 flex overflow-hidden">
        <JudetExplorerClient judet={judet} />
      </div>
    </div>
  )
}
