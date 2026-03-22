export function formatAge(age: number, lang: 'en' | 'ro' = 'en'): string {
  const years = Math.floor(age);
  const months = Math.round((age % 1) * 12);

  if (lang === 'ro') {
    if (years === 0) return months === 1 ? '1 lună' : `${months} luni`;
    if (months === 0) return years === 1 ? '1 an' : `${years} ani`;
    return `${years} an${years !== 1 ? 'i' : ''}, ${months} lun${months !== 1 ? 'i' : 'ă'}`;
  }

  if (years === 0) {
    return months === 1 ? '1 month old' : `${months} months old`;
  }
  if (months === 0) {
    return years === 1 ? '1 year old' : `${years} years old`;
  }
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''} old`;
}

export function formatYear(year: number): string {
  return String(year);
}

export function formatStat(value: number): string {
  return String(Math.round(value));
}
