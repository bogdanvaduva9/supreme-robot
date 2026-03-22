import { NextResponse } from 'next/server';
import type { StartGameRequest, StartGameResponse } from '../../../../lib/types/api';
import { createInitialState } from '../../../../lib/game/initialState';
import { setGame } from '../../../../lib/game/stateManager';
import { getClient } from '../../../../lib/ai/client';
import { buildStartMessages } from '../../../../lib/ai/contextManager';
import { parseAIResponse, createFallbackResponse } from '../../../../lib/ai/responseParser';

export async function POST(request: Request) {
  try {
    const body: StartGameRequest = await request.json();
    const { characterName, gender, birthYear, location, language = 'en', startingAge = 0 } = body;

    if (!characterName || !gender || !birthYear || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: characterName, gender, birthYear, location' },
        { status: 400 },
      );
    }

    const state = createInitialState(characterName, gender, birthYear, location, language, startingAge);

    const { system, messages } = buildStartMessages(state, startingAge);

    let aiResponse;
    try {
      const client = getClient();
      const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';
      const completion = await client.messages.create({
        model,
        max_tokens: startingAge > 0 ? 2500 : 1500,
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

    state.currentChoices = aiResponse.choices;
    state.conversationHistory.push(
      { role: 'user', content: startingAge > 0 ? `Game started — backstory at age ${startingAge} requested` : 'Game started — birth narrative requested' },
      { role: 'assistant', content: JSON.stringify(aiResponse) },
    );

    // Apply all state updates from the AI response (critical for backstory starts)
    const su = aiResponse.stateUpdates;
    const clamp = (v: number) => Math.max(0, Math.min(100, v));

    if (su.health != null) state.character.stats.health = clamp(state.character.stats.health + su.health);
    if (su.happiness != null) state.character.stats.happiness = clamp(state.character.stats.happiness + su.happiness);
    if (su.intelligence != null) state.character.stats.intelligence = clamp(state.character.stats.intelligence + su.intelligence);
    if (su.social != null) state.character.stats.social = clamp(state.character.stats.social + su.social);
    if (su.wealth != null) state.character.stats.wealth = clamp(state.character.stats.wealth + su.wealth);
    if (su.appearance != null) state.character.stats.appearance = clamp(state.character.stats.appearance + su.appearance);

    if (su.newTraits?.length) state.character.traits = su.newTraits;
    if (su.newEducation) state.character.education = su.newEducation;
    if (su.newOccupation) state.character.occupation = su.newOccupation;
    if (su.newAchievements?.length) state.character.achievements = su.newAchievements;
    if (su.locationChange) {
      state.character.location = su.locationChange;
      state.world.location = su.locationChange;
    }
    if (su.worldEvents?.length) state.world.worldEvents = su.worldEvents;

    if (su.newRelationships?.length) {
      for (const nr of su.newRelationships) {
        state.relationships.push({
          id: crypto.randomUUID(),
          name: nr.name,
          type: nr.type,
          attitude: nr.attitude,
          metAtAge: startingAge,
          isActive: true,
          description: nr.description,
        });
      }
    }

    setGame(state.id, state);

    const response: StartGameResponse = {
      gameId: state.id,
      narrative: aiResponse.narrative,
      choices: aiResponse.choices,
      character: state.character,
      world: state.world,
      relationships: state.relationships,
      language: state.language,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Failed to start game:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
