"use client";

import type { Character, Language } from "../../lib/types/game";
import { formatAge } from "../../lib/utils/format";
import { t } from "../../lib/i18n";

interface CharacterSheetProps {
  character: Character;
  language: Language;
}

function StatBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 70 ? "bg-success" : value >= 40 ? "bg-warning" : "bg-danger";

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted">{label}</span>
        <span className="font-mono">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-background rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function CharacterSheet({ character, language }: CharacterSheetProps) {
  const ui = t(language);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">{character.name}</h2>
      <p className="text-sm text-muted mb-1">{formatAge(character.currentAge, language)}</p>
      <p className="text-sm text-muted mb-4">{character.location}</p>

      {character.education && (
        <p className="text-xs text-muted mb-1">
          <span className="text-foreground">{ui.education}:</span> {character.education}
        </p>
      )}
      {character.occupation && (
        <p className="text-xs text-muted mb-4">
          <span className="text-foreground">{ui.occupation}:</span> {character.occupation}
        </p>
      )}

      <div className="space-y-3">
        {Object.entries(character.stats)
          .filter(([key]) => key !== "luck")
          .map(([key, value]) => (
            <StatBar
              key={key}
              label={ui.statLabels[key as keyof typeof ui.statLabels] ?? key}
              value={value}
            />
          ))}
      </div>

      {character.traits.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-muted mb-2">{ui.traits}</p>
          <div className="flex flex-wrap gap-1">
            {character.traits.map((trait) => (
              <span
                key={trait}
                className="px-2 py-0.5 text-xs bg-background border border-border rounded-full"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
