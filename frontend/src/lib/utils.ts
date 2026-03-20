import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPopulation(n: number): string {
  return new Intl.NumberFormat('ro-RO').format(n)
}

export function formatCompleteness(score: number): string {
  return `${Math.round(score * 100)}%`
}

export function localityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sat: 'Sat',
    comuna: 'Comună',
    oras: 'Oraș',
    municipiu: 'Municipiu',
    cartier: 'Cartier',
  }
  return labels[type] ?? type
}
