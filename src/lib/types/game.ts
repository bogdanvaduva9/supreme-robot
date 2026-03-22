export type Language = 'en' | 'ro';

export type TimeSkip = '1w' | '2w' | '1m' | '3m' | '6m' | '1y';

export interface GameState {
  id: string;
  character: Character;
  world: WorldState;
  relationships: Relationship[];
  eventHistory: GameEvent[];
  lifeSummary: string;
  conversationHistory: ConversationTurn[];
  currentChoices: Choice[];
  language: Language;
  turnCount: number;
  isAlive: boolean;
  deathCause: string | null;
  createdAt: string;
}

export interface Character {
  name: string;
  birthYear: number;
  currentAge: number;
  gender: string;
  location: string;
  stats: CharacterStats;
  traits: string[];
  education: string | null;
  occupation: string | null;
  achievements: string[];
}

export interface CharacterStats {
  health: number;
  happiness: number;
  intelligence: number;
  social: number;
  wealth: number;
  appearance: number;
  luck: number;
}

export interface Relationship {
  id: string;
  name: string;
  type: RelationshipType;
  attitude: number;
  metAtAge: number;
  isActive: boolean;
  description: string;
}

export type RelationshipType =
  | 'parent'
  | 'sibling'
  | 'extended_family'
  | 'friend'
  | 'best_friend'
  | 'acquaintance'
  | 'romantic_partner'
  | 'spouse'
  | 'teacher'
  | 'mentor'
  | 'boss'
  | 'coworker'
  | 'rival'
  | 'enemy';

export interface GameEvent {
  id: string;
  turnNumber: number;
  ageAtEvent: number;
  year: number;
  narrative: string;
  choiceMade: string;
  significanceLevel: 'minor' | 'moderate' | 'major' | 'life_changing';
}

export interface Choice {
  id: string;
  label: string;
  description?: string;
  tone: 'positive' | 'negative' | 'neutral' | 'risky';
}

export interface WorldState {
  currentYear: number;
  location: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  worldEvents: string[];
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgeBracket {
  name: string;
  minAge: number;
  maxAge: number;
  choiceGuidelines: string;
  complexityLevel: string;
  minChoices: number;
  maxChoices: number;
  typicalTimeJump: { minMonths: number; maxMonths: number };
}
