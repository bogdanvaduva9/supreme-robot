import type { Language, TimeSkip } from '../types/game';

export interface TimeSkipOption {
  value: TimeSkip;
  labelEn: string;
  labelRo: string;
  /** Time in years (fractional) */
  years: number;
  /** Human-readable duration for AI prompt */
  durationEn: string;
  durationRo: string;
}

export const TIME_SKIP_OPTIONS: TimeSkipOption[] = [
  { value: '1w',  labelEn: '1 week',   labelRo: '1 săptămână', years: 1 / 52,  durationEn: '1 week',   durationRo: '1 săptămână' },
  { value: '2w',  labelEn: '2 weeks',  labelRo: '2 săptămâni', years: 2 / 52,  durationEn: '2 weeks',  durationRo: '2 săptămâni' },
  { value: '1m',  labelEn: '1 month',  labelRo: '1 lună',      years: 1 / 12,  durationEn: '1 month',  durationRo: '1 lună' },
  { value: '3m',  labelEn: '3 months', labelRo: '3 luni',      years: 3 / 12,  durationEn: '3 months', durationRo: '3 luni' },
  { value: '6m',  labelEn: '6 months', labelRo: '6 luni',      years: 6 / 12,  durationEn: '6 months', durationRo: '6 luni' },
  { value: '1y',  labelEn: '1 year',   labelRo: '1 an',        years: 1,       durationEn: '1 year',   durationRo: '1 an' },
];

export function getTimeSkipOption(value: TimeSkip): TimeSkipOption {
  return TIME_SKIP_OPTIONS.find((o) => o.value === value) ?? TIME_SKIP_OPTIONS[2];
}

export function getTimeSkipLabel(value: TimeSkip, language: Language): string {
  const opt = getTimeSkipOption(value);
  return language === 'ro' ? opt.labelRo : opt.labelEn;
}

export function getTimeSkipDuration(value: TimeSkip, language: Language): string {
  const opt = getTimeSkipOption(value);
  return language === 'ro' ? opt.durationRo : opt.durationEn;
}
