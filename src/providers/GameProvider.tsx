'use client';

import { createContext, useState, useCallback, type ReactNode } from 'react';
import type { Character, Choice, Language, Relationship, GameEvent, TimeSkip, WorldState } from '../lib/types/game';
import type { StartGameResponse, TurnResponse } from '../lib/types/api';
import { apiUrl } from '../lib/utils/api';

export interface NarrativeEntry {
  turnNumber: number;
  age: number;
  year: number;
  narrative: string;
  actions: string[]; // the pendingActions that produced this narrative
}

export interface GameContextValue {
  gameId: string | null;
  narrative: string;
  narrativeHistory: NarrativeEntry[];
  choices: Choice[];
  character: Character | null;
  world: WorldState | null;
  relationships: Relationship[];
  recentEvents: GameEvent[];
  language: Language;
  isAlive: boolean;
  deathCause: string | null;
  isLoading: boolean;
  isRefreshingChoices: boolean;
  error: string | null;
  startGame: (name: string, gender: string, birthYear: number, location: string, language: Language, startingAge?: number) => Promise<void>;
  makeChoice: (pendingActions: string[], timeSkip: TimeSkip) => Promise<void>;
  refreshChoices: (pendingActions: string[]) => Promise<void>;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameId, setGameId] = useState<string | null>(null);
  const [narrative, setNarrative] = useState('');
  const [narrativeHistory, setNarrativeHistory] = useState<NarrativeEntry[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [character, setCharacter] = useState<Character | null>(null);
  const [world, setWorld] = useState<WorldState | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [isAlive, setIsAlive] = useState(true);
  const [deathCause, setDeathCause] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingChoices, setIsRefreshingChoices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGame = useCallback(async (
    name: string,
    gender: string,
    birthYear: number,
    location: string,
    lang: Language,
    startingAge: number = 0,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/game/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterName: name, gender, birthYear, location, language: lang, startingAge }),
      });
      if (!res.ok) throw new Error(`Failed to start game: ${res.statusText}`);
      const data: StartGameResponse = await res.json();
      setGameId(data.gameId);
      setNarrative(data.narrative);
      setNarrativeHistory([{
        turnNumber: 0,
        age: data.character.currentAge,
        year: data.world.currentYear,
        narrative: data.narrative,
        actions: [],
      }]);
      setChoices(data.choices);
      setCharacter(data.character);
      setWorld(data.world);
      setRelationships(data.relationships);
      setLanguage(data.language);
      setRecentEvents([]);
      setIsAlive(true);
      setDeathCause(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const makeChoice = useCallback(async (pendingActions: string[], timeSkip: TimeSkip) => {
    if (!gameId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/game/turn'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, pendingActions, timeSkip }),
      });
      if (!res.ok) throw new Error(`Failed to process turn: ${res.statusText}`);
      const data: TurnResponse = await res.json();
      setNarrative(data.narrative);
      setNarrativeHistory(prev => [...prev, {
        turnNumber: prev.length,
        age: data.character.currentAge,
        year: data.world.currentYear,
        narrative: data.narrative,
        actions: pendingActions,
      }]);
      setChoices(data.choices);
      setCharacter(data.character);
      setWorld(data.world);
      setRelationships(data.relationships);
      setRecentEvents(data.recentEvents);
      setIsAlive(data.isAlive);
      setDeathCause(data.deathCause);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process choice');
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  const refreshChoices = useCallback(async (pendingActions: string[]) => {
    if (!gameId) return;
    setIsRefreshingChoices(true);
    try {
      const res = await fetch(apiUrl('/api/game/preview'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, pendingActions }),
      });
      if (!res.ok) return; // Silently fail — current choices stay
      const data = await res.json();
      if (Array.isArray(data.choices) && data.choices.length > 0) {
        setChoices(data.choices);
      }
    } catch {
      // Silently fail — suggestions are not critical
    } finally {
      setIsRefreshingChoices(false);
    }
  }, [gameId]);

  return (
    <GameContext.Provider
      value={{
        gameId,
        narrative,
        narrativeHistory,
        choices,
        character,
        world,
        relationships,
        recentEvents,
        language,
        isAlive,
        deathCause,
        isLoading,
        isRefreshingChoices,
        error,
        startGame,
        makeChoice,
        refreshChoices,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
