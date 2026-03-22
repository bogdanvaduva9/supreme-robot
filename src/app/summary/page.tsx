"use client";

import Link from "next/link";
import { useGame } from "../../hooks/useGame";
import { formatAge } from "../../lib/utils/format";
import { t } from "../../lib/i18n";

export default function SummaryPage() {
  const { character, deathCause, recentEvents, language } = useGame();
  const ui = t(language);

  if (!character) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">{ui.noLifeToSummarize}</p>
          <Link href="/" className="text-accent hover:underline">
            {ui.startNewLife}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold mb-2 text-center">
          {ui.theLifeOf} <span className="text-accent">{character.name}</span>
        </h1>
        <p className="text-muted text-center mb-8">
          {character.birthYear} — {character.birthYear + Math.floor(character.currentAge)}
          {" | "}{ui.livedTo} {formatAge(character.currentAge, language)}
        </p>

        {deathCause && (
          <div className="bg-surface border border-border rounded-lg p-4 mb-8 text-center">
            <p className="text-muted text-sm">{ui.causeOfDeath}</p>
            <p className="text-lg">{deathCause}</p>
          </div>
        )}

        {/* Final Stats */}
        <div className="bg-surface border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">{ui.finalStats}</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(character.stats)
              .filter(([key]) => key !== "luck")
              .map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted">
                    {ui.statLabels[key as keyof typeof ui.statLabels] ?? key}
                  </span>
                  <span className="font-mono">{Math.round(value)}/100</span>
                </div>
              ))}
          </div>
        </div>

        {/* Traits */}
        {character.traits.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">{ui.personalityTraits}</h2>
            <div className="flex flex-wrap gap-2">
              {character.traits.map((trait) => (
                <span
                  key={trait}
                  className="px-3 py-1 bg-background border border-border rounded-full text-sm"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {character.achievements.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">{ui.achievements}</h2>
            <ul className="space-y-2">
              {character.achievements.map((a, i) => (
                <li key={i} className="text-muted">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">{ui.keyLifeEvents}</h2>
            <ul className="space-y-3">
              {recentEvents.map((event) => (
                <li key={event.id} className="border-l-2 border-accent pl-4">
                  <p className="text-sm text-muted">
                    Age {Math.floor(event.ageAtEvent)} ({event.year})
                  </p>
                  <p>{event.narrative}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/new-game"
            className="inline-block px-8 py-3 bg-accent text-background font-semibold rounded-lg hover:bg-accent-dim transition-colors"
          >
            {ui.liveAnotherLife}
          </Link>
        </div>
      </div>
    </main>
  );
}
