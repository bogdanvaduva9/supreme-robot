import { NextResponse } from 'next/server';
import type { TurnRequest, TurnResponse } from '../../../../lib/types/api';
import { getGame, setGame } from '../../../../lib/game/stateManager';
import { processChoice } from '../../../../lib/game/engine';
import { getClient } from '../../../../lib/ai/client';
import { buildMessages } from '../../../../lib/ai/contextManager';
import { parseAIResponse, createFallbackResponse } from '../../../../lib/ai/responseParser';
import { calculateDeathProbability } from '../../../../lib/game/deathCalculator';
import { getTimeSkipOption } from '../../../../lib/game/timeSkips';

export async function POST(request: Request) {
  try {
    const body: TurnRequest = await request.json();
    const { gameId, pendingActions, timeSkip = '1m' } = body;

    if (!gameId || !pendingActions?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, pendingActions' },
        { status: 400 },
      );
    }

    const state = getGame(gameId);
    if (!state) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (!state.isAlive) {
      return NextResponse.json({ error: 'Game is already over' }, { status: 400 });
    }

    // Combined label used for history/event records
    const choiceLabel = pendingActions.length === 1
      ? pendingActions[0]
      : pendingActions.map((a, i) => `${i + 1}. ${a}`).join(' | ');

    // Get exact time advancement from the user's time skip selection
    const timeSkipOption = getTimeSkipOption(timeSkip);
    const timeAdvanceYears = timeSkipOption.years;

    const { system, messages } = buildMessages(state, pendingActions, timeSkip);

    // Add death probability hint
    const deathProb = calculateDeathProbability(state.character);
    if (deathProb > 0) {
      const lastMsg = messages[messages.length - 1];
      lastMsg.content += `\n\n[System note: Death probability this turn: ${(deathProb * 100).toFixed(1)}%. If >50%, strongly consider triggering a natural death. Always make death narratively meaningful.]`;
    }

    let aiResponse;
    try {
      const client = getClient();
      const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';
      const completion = await client.messages.create({
        model,
        max_tokens: 1500,
        system,
        messages,
      });

      const content = completion.content[0];
      if (content.type !== 'text') throw new Error('Unexpected response type');
      aiResponse = parseAIResponse(content.text);
    } catch (err) {
      console.error('AI call failed, using fallback:', err);
      aiResponse = createFallbackResponse();
    }

    // Process the turn — use a synthetic ID since choices came from the queue
    const newState = processChoice(state, 'multi_action', aiResponse, timeAdvanceYears, choiceLabel);
    setGame(gameId, newState);

    const recentEvents = newState.eventHistory.slice(-5);

    const response: TurnResponse = {
      narrative: aiResponse.narrative,
      choices: aiResponse.choices,
      character: newState.character,
      world: newState.world,
      relationships: newState.relationships.filter((r) => r.isActive),
      recentEvents,
      isAlive: newState.isAlive,
      deathCause: newState.deathCause,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Failed to process turn:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
