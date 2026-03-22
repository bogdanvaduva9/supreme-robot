import { NextResponse } from 'next/server';
import type { PreviewRequest, PreviewResponse } from '../../../../lib/types/api';
import { getGame } from '../../../../lib/game/stateManager';
import { getClient } from '../../../../lib/ai/client';
import { buildPreviewMessages } from '../../../../lib/ai/contextManager';
import type { Choice } from '../../../../lib/types/game';

export async function POST(request: Request) {
  try {
    const body: PreviewRequest = await request.json();
    const { gameId, pendingActions = [] } = body;

    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }

    const state = getGame(gameId);
    if (!state) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const { system, messages } = buildPreviewMessages(state, pendingActions);

    let choices: Choice[] = [];
    try {
      const client = getClient();
      const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';
      const completion = await client.messages.create({
        model,
        max_tokens: 600,
        system,
        messages,
      });

      const content = completion.content[0];
      if (content.type === 'text') {
        // Strip markdown fences just in case
        const raw = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.choices)) {
          choices = parsed.choices;
        }
      }
    } catch (err) {
      console.error('Preview AI call failed:', err);
      // Return current choices as fallback — UI stays functional
      choices = state.currentChoices;
    }

    const response: PreviewResponse = { choices };
    return NextResponse.json(response);
  } catch (err) {
    console.error('Preview route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
