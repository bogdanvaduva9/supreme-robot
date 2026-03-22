"use client";

import { formatAge } from "../../lib/utils/format";
import { t } from "../../lib/i18n";
import type { Language } from "../../lib/types/game";

interface TimelineBarProps {
  age: number;
  year: number;
  language: Language;
}

export function TimelineBar({ age, year, language }: TimelineBarProps) {
  const ui = t(language);
  const progress = Math.min(100, (age / 100) * 100);

  return (
    <div className="border-b border-border px-4 py-2">
      <div className="flex justify-between items-center text-sm mb-1">
        <span className="text-muted">{formatAge(age, language)}</span>
        <span className="text-muted">{ui.yearLabel} {year}</span>
      </div>
      <div className="h-1 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
