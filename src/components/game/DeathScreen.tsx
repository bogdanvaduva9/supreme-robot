"use client";

import Link from "next/link";
import type { Character, Language } from "../../lib/types/game";
import { formatAge } from "../../lib/utils/format";
import { t } from "../../lib/i18n";

interface DeathScreenProps {
  narrative: string;
  deathCause: string | null;
  character: Character;
  language: Language;
}

export function DeathScreen({ narrative, deathCause, character, language }: DeathScreenProps) {
  const ui = t(language);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold mb-6">{ui.restInPeace}</h1>
        <h2 className="text-2xl text-accent mb-2">{character.name}</h2>
        <p className="text-muted mb-8">
          {character.birthYear} — {character.birthYear + Math.floor(character.currentAge)}
          {" | "}{formatAge(character.currentAge, language)}
        </p>

        <div className="bg-surface border border-border rounded-lg p-6 mb-8 text-left">
          <p className="leading-relaxed whitespace-pre-wrap">{narrative}</p>
        </div>

        {deathCause && (
          <p className="text-muted mb-8">
            {ui.causeOfDeath}: <span className="text-foreground">{deathCause}</span>
          </p>
        )}

        <div className="flex gap-4 justify-center">
          <Link
            href="/summary"
            className="px-6 py-3 bg-accent text-background font-semibold rounded-lg hover:bg-accent-dim transition-colors"
          >
            {ui.viewLifeSummary}
          </Link>
          <Link
            href="/new-game"
            className="px-6 py-3 border border-border rounded-lg hover:bg-surface-hover transition-colors"
          >
            {ui.liveAnotherLife}
          </Link>
        </div>
      </div>
    </main>
  );
}
