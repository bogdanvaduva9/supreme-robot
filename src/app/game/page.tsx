"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../../hooks/useGame";
import type { TimeSkip } from "../../lib/types/game";
import { t } from "../../lib/i18n";
import { NarrativePanel } from "../../components/game/NarrativePanel";
import { ChoiceCard } from "../../components/game/ChoiceCard";
import { CharacterSheet } from "../../components/game/CharacterSheet";
import { RelationshipList } from "../../components/game/RelationshipList";
import { TimelineBar } from "../../components/game/TimelineBar";
import { WorldStatus } from "../../components/game/WorldStatus";
import { DeathScreen } from "../../components/game/DeathScreen";
import { TimeSkipSelector } from "../../components/game/TimeSkipSelector";
import { formatAge } from "../../lib/utils/format";

export default function GamePage() {
  const router = useRouter();
  const {
    gameId,
    narrative,
    narrativeHistory,
    choices,
    character,
    world,
    relationships,
    language,
    isAlive,
    deathCause,
    isLoading,
    isRefreshingChoices,
    error,
    makeChoice,
    refreshChoices,
  } = useGame();

  const [pendingActions, setPendingActions] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [timeSkip, setTimeSkip] = useState<TimeSkip>("1m");
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameId) router.push("/");
  }, [gameId, router]);

  // Auto-scroll to bottom whenever a new history entry arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [narrativeHistory.length]);

  // Reset queue and input when a new narrative arrives (turn completed)
  useEffect(() => {
    setPendingActions([]);
    setInputText("");
  }, [narrative]);

  function addAction(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const next = [...pendingActions, trimmed];
    setPendingActions(next);
    setInputText("");
    inputRef.current?.focus();
    refreshChoices(next);
  }

  function removeAction(index: number) {
    const next = pendingActions.filter((_, i) => i !== index);
    setPendingActions(next);
    if (next.length > 0) refreshChoices(next);
  }

  async function handleConfirm() {
    if (!pendingActions.length || isLoading) return;
    await makeChoice(pendingActions, timeSkip);
  }

  if (!gameId || !character || !world) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  if (!isAlive) {
    return (
      <DeathScreen
        narrative={narrative}
        deathCause={deathCause}
        character={character}
        language={language}
      />
    );
  }

  const ui = t(language);
  const pastEntries = narrativeHistory.slice(0, -1);
  const currentEntry = narrativeHistory[narrativeHistory.length - 1];

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      <TimelineBar age={character.currentAge} year={world.currentYear} language={language} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-72 border-r border-border overflow-y-auto p-4 hidden lg:block">
          <CharacterSheet character={character} language={language} />
          <div className="mt-6">
            <RelationshipList relationships={relationships} language={language} />
          </div>
        </aside>

        {/* Center — history feed + action panel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Scrollable history feed */}
          <div className="flex-1 overflow-y-auto">

            {/* Past entries — muted, compressed */}
            {pastEntries.map((entry, i) => (
              <div key={i} className="px-6 py-5 border-b border-border/40 opacity-50 hover:opacity-70 transition-opacity">
                {/* Entry header */}
                <div className="flex items-center gap-2 mb-2 text-xs font-mono text-muted">
                  <span>{formatAge(entry.age, language)}</span>
                  <span className="text-border">·</span>
                  <span>{ui.yearLabel} {entry.year}</span>
                  {entry.turnNumber === 0 && (
                    <span className="px-1.5 py-0.5 bg-success/10 text-success border border-success/20 rounded text-[10px]">
                      {entry.age > 0 ? ui.backstoryLabel : ui.birthLabel}
                    </span>
                  )}
                  {entry.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-1">
                      {entry.actions.map((a, ai) => (
                        <span key={ai} className="px-1.5 py-0.5 bg-surface border border-border rounded text-[10px]">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-muted whitespace-pre-wrap">
                  {entry.narrative}
                </p>
              </div>
            ))}

            {/* Current entry — full brightness */}
            {currentEntry && (
              <div className="px-6 pt-6 pb-2">
                {/* Entry header */}
                <div className="flex items-center gap-2 mb-3 text-xs font-mono text-muted">
                  <span className="text-accent font-semibold">{formatAge(currentEntry.age, language)}</span>
                  <span className="text-border">·</span>
                  <span>{ui.yearLabel} {currentEntry.year}</span>
                  {currentEntry.turnNumber === 0 && (
                    <span className="px-1.5 py-0.5 bg-success/10 text-success border border-success/20 rounded text-[10px]">
                      {currentEntry.age > 0 ? ui.backstoryLabel : ui.birthLabel}
                    </span>
                  )}
                  {currentEntry.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-1">
                      {currentEntry.actions.map((a, ai) => (
                        <span key={ai} className="px-1.5 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded text-[10px]">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <WorldStatus world={world} language={language} />
                <NarrativePanel narrative={currentEntry.narrative} />
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-muted animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {error && <p className="px-6 text-danger text-sm">{error}</p>}

            <div ref={bottomRef} className="h-4" />
          </div>

          {/* Bottom action panel */}
          <div className="border-t border-border p-4 space-y-3">

            {/* ── Action queue (chips) ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                  {ui.actionPlanLabel}
                  {pendingActions.length > 0 && (
                    <span className="ml-2 text-accent">{pendingActions.length}</span>
                  )}
                </span>
              </div>

              {pendingActions.length === 0 ? (
                <p className="text-xs text-muted italic">{ui.actionPlanEmpty}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {pendingActions.map((action, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 border border-accent/30 text-accent text-xs rounded-full"
                    >
                      <span className="font-mono text-accent/60">{i + 1}.</span>
                      {action}
                      <button
                        onClick={() => removeAction(i)}
                        disabled={isLoading}
                        className="ml-0.5 hover:text-danger transition-colors disabled:opacity-40"
                        aria-label="Remove action"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Suggested actions ── */}
            <div>
              <p className="text-xs text-muted mb-1.5">
                {isRefreshingChoices
                  ? <span className="animate-pulse">{ui.suggestionsRefreshing}</span>
                  : ui.suggestionsLabel
                }
              </p>
              <div className={`grid gap-2 sm:grid-cols-2 transition-opacity ${isRefreshingChoices ? "opacity-40 pointer-events-none" : ""}`}>
                {choices.map((choice) => (
                  <ChoiceCard
                    key={choice.id}
                    choice={choice}
                    isSelected={false}
                    onClick={() => addAction(choice.label)}
                    disabled={isLoading || isRefreshingChoices}
                  />
                ))}
              </div>
            </div>

            {/* ── Custom action input ── */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputText.trim() && !isLoading) {
                    addAction(inputText);
                  }
                }}
                placeholder={ui.customActionPlaceholder}
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
              />
              <button
                onClick={() => addAction(inputText)}
                disabled={!inputText.trim() || isLoading}
                className="px-4 py-2 text-sm bg-surface border border-border rounded-lg hover:border-accent hover:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {ui.addActionBtn}
              </button>
            </div>

            {/* ── Hint ── */}
            <p className="text-xs text-muted">{ui.actionPlanHint}</p>

            {/* ── Time skip + confirm ── */}
            <TimeSkipSelector
              value={timeSkip}
              onChange={setTimeSkip}
              disabled={isLoading}
              language={language}
            />

            <button
              onClick={handleConfirm}
              disabled={pendingActions.length === 0 || isLoading}
              className="w-full py-2.5 bg-accent text-background font-semibold rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? ui.loading : ui.confirmPlan(pendingActions.length)}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
