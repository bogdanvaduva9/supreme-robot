import Link from 'next/link'
import { Map } from 'lucide-react'
import { JUDETE } from '@/lib/judete'
import RomaniaMapClient from '@/components/map/RomaniaMapClient'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-atlas-blue" />
          <span className="font-bold text-lg tracking-tight">Atlas</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900 transition-colors">Hartă</Link>
          <Link href="/judete/MM" className="hover:text-gray-900 transition-colors">Maramureș</Link>
        </nav>
      </header>

      {/* Hero + Map */}
      <section className="flex-1 grid lg:grid-cols-2 min-h-[600px]">
        {/* Left — hero */}
        <div className="flex flex-col justify-center px-8 lg:px-16 py-12 bg-white">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-1 w-6 bg-atlas-blue rounded-full" />
            <span className="h-1 w-3 bg-atlas-yellow rounded-full" />
            <span className="h-1 w-3 bg-atlas-red rounded-full" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Enciclopedia<br />
            <span className="text-atlas-blue">localităților</span><br />
            din România
          </h1>
          <p className="mt-4 text-gray-500 max-w-md leading-relaxed">
            13.000+ sate, comune, orașe și municipii — date demografice,
            infrastructură, servicii, cultură și natură, actualizate automat
            din surse oficiale.
          </p>
          <div className="flex gap-3 mt-8">
            <Link
              href="/judete/MM"
              className="inline-flex items-center gap-2 bg-atlas-blue text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
            >
              <Map className="w-4 h-4" />
              Explorează Maramureș
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-300">
            Faza 1 · Lansare județ pilot: Maramureș
          </p>
        </div>

        {/* Right — interactive Romania map */}
        <div className="relative min-h-[400px] lg:min-h-0 bg-gray-50">
          <RomaniaMapClient judete={JUDETE} />
        </div>
      </section>

      {/* Județe grid */}
      <section className="px-6 lg:px-16 py-12 bg-gray-50 border-t border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Toate județele</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2">
          {JUDETE.map((judet) => (
            <Link
              key={judet.code}
              href={`/judete/${judet.code}`}
              className="flex flex-col items-center py-3 px-2 rounded-xl bg-white border border-gray-100 hover:border-atlas-blue hover:shadow-sm transition-all group"
            >
              <span className="text-sm font-bold text-gray-700 group-hover:text-atlas-blue transition-colors">
                {judet.code}
              </span>
              <span className="text-[10px] text-gray-400 text-center mt-0.5 leading-tight">
                {judet.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-gray-100 text-xs text-gray-300 flex justify-between">
        <span>Atlas · romania-atlas.com</span>
        <span>Date: INS · OSM · Wikidata · ANCOM</span>
      </footer>
    </div>
  )
}

