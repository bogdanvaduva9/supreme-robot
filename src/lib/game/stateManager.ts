import type { GameState } from '../types/game';

// Pin the Map to globalThis so it survives hot-reloads and is shared
// across all Next.js API route module instances in the same Node process.
declare global {
  // eslint-disable-next-line no-var
  var __lifesim_games: Map<string, GameState> | undefined;
}

function getStore(): Map<string, GameState> {
  if (!globalThis.__lifesim_games) {
    globalThis.__lifesim_games = new Map<string, GameState>();
  }
  return globalThis.__lifesim_games;
}

export function getGame(gameId: string): GameState | undefined {
  return getStore().get(gameId);
}

export function setGame(gameId: string, state: GameState): void {
  getStore().set(gameId, state);
}

export function deleteGame(gameId: string): boolean {
  return getStore().delete(gameId);
}

export function hasGame(gameId: string): boolean {
  return getStore().has(gameId);
}
