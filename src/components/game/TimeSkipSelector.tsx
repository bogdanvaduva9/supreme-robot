"use client";

import type { Language, TimeSkip } from "../../lib/types/game";
import { TIME_SKIP_OPTIONS } from "../../lib/game/timeSkips";

interface TimeSkipSelectorProps {
  value: TimeSkip;
  onChange: (value: TimeSkip) => void;
  disabled: boolean;
  language: Language;
}

const LABEL: Record<Language, string> = {
  en: "Advance time by",
  ro: "Avansează timpul cu",
};

export function TimeSkipSelector({ value, onChange, disabled, language }: TimeSkipSelectorProps) {
  return (
    <div className="mt-4">
      <p className="text-xs text-muted mb-2">{LABEL[language]}</p>
      <div className="flex gap-1.5 flex-wrap">
        {TIME_SKIP_OPTIONS.map((opt) => {
          const label = language === "ro" ? opt.labelRo : opt.labelEn;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              disabled={disabled}
              className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                value === opt.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted hover:border-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
