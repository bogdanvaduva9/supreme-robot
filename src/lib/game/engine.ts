import type { GameState, Choice } from '../types/game';
import type { AIResponse } from '../types/ai';
import { generateId } from '../utils/id';

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getSeason(age: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  const monthFraction = (age % 1) * 12;
  const month = Math.floor(monthFraction) + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export function processChoice(
  state: GameState,
  choiceId: string,
  aiResponse: AIResponse,
  timeAdvanceYears: number,
  choiceLabelOverride?: string,
): GameState {
  const choiceMade = state.currentChoices.find((c) => c.id === choiceId);
  const choiceLabel = choiceLabelOverride ?? choiceMade?.label ?? 'Unknown choice';

  // Apply stat updates
  const su = aiResponse.stateUpdates;
  const stats = { ...state.character.stats };
  if (su.health != null) stats.health = clampStat(stats.health + su.health);
  if (su.happiness != null) stats.happiness = clampStat(stats.happiness + su.happiness);
  if (su.intelligence != null) stats.intelligence = clampStat(stats.intelligence + su.intelligence);
  if (su.social != null) stats.social = clampStat(stats.social + su.social);
  if (su.wealth != null) stats.wealth = clampStat(stats.wealth + su.wealth);
  if (su.appearance != null) stats.appearance = clampStat(stats.appearance + su.appearance);

  // Advance age using the user-requested time (not AI-guessed)
  const newAge = state.character.currentAge + timeAdvanceYears;
  const newYear = state.character.birthYear + Math.floor(newAge);

  // Apply trait changes
  let traits = [...state.character.traits];
  if (su.newTraits) {
    for (const t of su.newTraits) {
      if (!traits.includes(t)) traits.push(t);
    }
  }
  if (su.removedTraits) {
    traits = traits.filter((t) => !su.removedTraits!.includes(t));
  }
  if (traits.length > 8) traits = traits.slice(-8);

  // Apply relationship changes
  let relationships = [...state.relationships];
  if (su.newRelationships) {
    for (const nr of su.newRelationships) {
      relationships.push({
        id: generateId(),
        name: nr.name,
        type: nr.type,
        attitude: nr.attitude,
        metAtAge: newAge,
        isActive: true,
        description: nr.description,
      });
    }
  }
  if (su.updatedRelationships) {
    for (const ur of su.updatedRelationships) {
      const rel = relationships.find((r) => r.name === ur.name && r.isActive);
      if (rel) {
        rel.attitude = Math.max(-100, Math.min(100, rel.attitude + ur.attitudeChange));
      }
    }
  }
  if (su.removedRelationships) {
    for (const name of su.removedRelationships) {
      const rel = relationships.find((r) => r.name === name && r.isActive);
      if (rel) rel.isActive = false;
    }
  }

  // Apply world events
  const worldEvents = [...state.world.worldEvents];
  if (su.worldEvents) {
    worldEvents.push(...su.worldEvents);
  }

  // Determine significance
  const hasLifeChange = su.newEducation || su.newOccupation || su.locationChange || aiResponse.isDead;
  const hasMajorRelChange = (su.newRelationships?.length ?? 0) > 0 || (su.removedRelationships?.length ?? 0) > 0;
  const significanceLevel = hasLifeChange
    ? 'life_changing' as const
    : hasMajorRelChange
      ? 'major' as const
      : Math.abs(su.health ?? 0) + Math.abs(su.happiness ?? 0) > 10
        ? 'moderate' as const
        : 'minor' as const;

  const event = {
    id: generateId(),
    turnNumber: state.turnCount + 1,
    ageAtEvent: newAge,
    year: newYear,
    narrative: aiResponse.narrative.slice(0, 200),
    choiceMade: choiceLabel,
    significanceLevel,
  };

  return {
    ...state,
    character: {
      ...state.character,
      currentAge: newAge,
      stats,
      traits,
      education: su.newEducation ?? state.character.education,
      occupation: su.newOccupation ?? state.character.occupation,
      location: su.locationChange ?? state.character.location,
      achievements: [
        ...state.character.achievements,
        ...(su.newAchievements ?? []),
      ],
    },
    world: {
      ...state.world,
      currentYear: newYear,
      location: su.locationChange ?? state.world.location,
      season: getSeason(newAge),
      worldEvents,
    },
    relationships,
    eventHistory: [...state.eventHistory, event],
    currentChoices: aiResponse.choices,
    conversationHistory: [
      ...state.conversationHistory,
      { role: 'user' as const, content: `The player chose: "${choiceLabel}"` },
      { role: 'assistant' as const, content: JSON.stringify(aiResponse) },
    ],
    turnCount: state.turnCount + 1,
    isAlive: !aiResponse.isDead,
    deathCause: aiResponse.deathCause,
  };
}

export function getDisplayChoices(state: GameState): Choice[] {
  return state.currentChoices;
}
