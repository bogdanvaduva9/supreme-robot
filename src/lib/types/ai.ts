import type { Choice, RelationshipType } from './game';

export interface AIResponse {
  narrative: string;
  choices: Choice[];
  stateUpdates: StateUpdates;
  isDead: boolean;
  deathCause: string | null;
}

export interface StateUpdates {
  health?: number;
  happiness?: number;
  intelligence?: number;
  social?: number;
  wealth?: number;
  appearance?: number;
  newRelationships?: NewRelationship[];
  updatedRelationships?: UpdatedRelationship[];
  removedRelationships?: string[];
  newTraits?: string[];
  removedTraits?: string[];
  worldEvents?: string[];
  newEducation?: string;
  newOccupation?: string;
  locationChange?: string;
  newAchievements?: string[];
}

export interface NewRelationship {
  name: string;
  type: RelationshipType;
  attitude: number;
  description: string;
}

export interface UpdatedRelationship {
  name: string;
  attitudeChange: number;
}
