import type { Character, Choice, GameEvent, Language, Relationship, TimeSkip, WorldState } from './game';

export interface StartGameRequest {
  characterName: string;
  gender: string;
  birthYear: number;
  location: string;
  language: Language;
  /** Age to start at. 0 = birth (default). >0 = AI generates a backstory. */
  startingAge?: number;
}

export interface StartGameResponse {
  gameId: string;
  narrative: string;
  choices: Choice[];
  character: Character;
  world: WorldState;
  relationships: Relationship[];
  language: Language;
}

export interface TurnRequest {
  gameId: string;
  /** One or more action labels the player has queued for this turn. */
  pendingActions: string[];
  timeSkip: TimeSkip;
}

export interface PreviewRequest {
  gameId: string;
  /** Actions the player has already added to their queue. */
  pendingActions: string[];
}

export interface PreviewResponse {
  choices: Choice[];
}

export interface TurnResponse {
  narrative: string;
  choices: Choice[];
  character: Character;
  world: WorldState;
  relationships: Relationship[];
  recentEvents: GameEvent[];
  isAlive: boolean;
  deathCause: string | null;
}

export interface GameStateResponse {
  character: Character;
  world: WorldState;
  relationships: Relationship[];
  recentEvents: GameEvent[];
  currentChoices: Choice[];
  isAlive: boolean;
  deathCause: string | null;
}
