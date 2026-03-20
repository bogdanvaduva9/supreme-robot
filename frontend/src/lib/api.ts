import type { ListByJudetResponse, ListJudeteResponse, Locality } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export function getLocality(siruta: string): Promise<Locality> {
  return fetchJson<Locality>(`/localities/${siruta}`)
}

export function listByJudet(
  judetCode: string,
  nextToken?: string,
): Promise<ListByJudetResponse> {
  const params = new URLSearchParams({ judet: judetCode })
  if (nextToken) params.set('nextToken', nextToken)
  return fetchJson<ListByJudetResponse>(`/localities?${params}`)
}

export function listJudete(): Promise<ListJudeteResponse> {
  return fetchJson<ListJudeteResponse>('/judete')
}
