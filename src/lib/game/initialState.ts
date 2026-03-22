import type { GameState, CharacterStats, Language } from '../types/game';
import { generateId } from '../utils/id';

function getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function randomLuck(): number {
  return Math.floor(Math.random() * 41) + 30; // 30-70
}

export function createInitialState(
  characterName: string,
  gender: string,
  birthYear: number,
  location: string,
  language: Language,
  startingAge: number = 0,
): GameState {
  const stats: CharacterStats = {
    health: 50,
    happiness: 50,
    intelligence: 50,
    social: 50,
    wealth: 50,
    appearance: 50,
    luck: randomLuck(),
  };

  const now = new Date();
  const currentAge = Math.max(0, startingAge);
  const currentYear = birthYear + Math.floor(currentAge);

  return {
    id: generateId(),
    character: {
      name: characterName,
      birthYear,
      currentAge,
      gender,
      location,
      stats,
      traits: [],
      education: null,
      occupation: null,
      achievements: [],
    },
    world: {
      currentYear,
      location,
      season: getSeason(now.getMonth() + 1),
      worldEvents: [],
    },
    relationships: [],
    eventHistory: [],
    lifeSummary: '',
    conversationHistory: [],
    currentChoices: [],
    language,
    turnCount: 0,
    isAlive: true,
    deathCause: null,
    createdAt: now.toISOString(),
  };
}
