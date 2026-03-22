import type { AIResponse } from '../types/ai';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function parseAIResponse(raw: string): AIResponse {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  if (typeof parsed.narrative !== 'string' || !parsed.narrative) {
    throw new Error('Missing or invalid narrative field');
  }
  if (!Array.isArray(parsed.choices) || parsed.choices.length === 0) {
    throw new Error('Missing or empty choices array');
  }
  if (typeof parsed.isDead !== 'boolean') {
    throw new Error('Missing isDead field');
  }

  const choices = parsed.choices.map((c: Record<string, unknown>, i: number) => ({
    id: typeof c.id === 'string' ? c.id : `choice_${i + 1}`,
    label: String(c.label ?? `Option ${i + 1}`),
    description: typeof c.description === 'string' ? c.description : undefined,
    tone: ['positive', 'negative', 'neutral', 'risky'].includes(c.tone as string)
      ? c.tone as string
      : 'neutral',
  }));

  const su = parsed.stateUpdates ?? {};
  const stateUpdates = {
    ...(su.health != null && { health: clamp(Number(su.health), -10, 10) }),
    ...(su.happiness != null && { happiness: clamp(Number(su.happiness), -10, 10) }),
    ...(su.intelligence != null && { intelligence: clamp(Number(su.intelligence), -10, 10) }),
    ...(su.social != null && { social: clamp(Number(su.social), -10, 10) }),
    ...(su.wealth != null && { wealth: clamp(Number(su.wealth), -10, 10) }),
    ...(su.appearance != null && { appearance: clamp(Number(su.appearance), -5, 5) }),
    ...(Array.isArray(su.newRelationships) && { newRelationships: su.newRelationships }),
    ...(Array.isArray(su.updatedRelationships) && { updatedRelationships: su.updatedRelationships }),
    ...(Array.isArray(su.removedRelationships) && { removedRelationships: su.removedRelationships }),
    ...(Array.isArray(su.newTraits) && { newTraits: su.newTraits }),
    ...(Array.isArray(su.removedTraits) && { removedTraits: su.removedTraits }),
    ...(Array.isArray(su.worldEvents) && { worldEvents: su.worldEvents }),
    ...(typeof su.newEducation === 'string' && { newEducation: su.newEducation }),
    ...(typeof su.newOccupation === 'string' && { newOccupation: su.newOccupation }),
    ...(typeof su.locationChange === 'string' && { locationChange: su.locationChange }),
    ...(Array.isArray(su.newAchievements) && { newAchievements: su.newAchievements }),
  };

  return {
    narrative: parsed.narrative,
    choices,
    stateUpdates,
    isDead: parsed.isDead,
    deathCause: parsed.isDead ? (parsed.deathCause ?? 'Unknown causes') : null,
  };
}

export function createFallbackResponse(): AIResponse {
  return {
    narrative: 'Time passes quietly. The world continues to turn, and life goes on in its ordinary way.',
    choices: [
      { id: 'choice_1', label: 'Continue with your daily routine', tone: 'neutral' },
      { id: 'choice_2', label: 'Try something different today', tone: 'positive' },
    ],
    stateUpdates: {},
    isDead: false,
    deathCause: null,
  };
}
