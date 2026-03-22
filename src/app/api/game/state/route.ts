import { NextResponse } from 'next/server';
import type { GameStateResponse } from '../../../../lib/types/api';
import { getGame } from '../../../../lib/game/stateManager';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');

  if (!gameId) {
    return NextResponse.json(
      { error: 'Missing gameId query parameter' },
      { status: 400 },
    );
  }

  const state = getGame(gameId);
  if (!state) {
    return NextResponse.json(
      { error: 'Game not found' },
      { status: 404 },
    );
  }

  const response: GameStateResponse = {
    character: state.character,
    world: state.world,
    relationships: state.relationships.filter((r) => r.isActive),
    recentEvents: state.eventHistory.slice(-10),
    currentChoices: state.currentChoices,
    isAlive: state.isAlive,
    deathCause: state.deathCause,
  };

  return NextResponse.json(response);
}
