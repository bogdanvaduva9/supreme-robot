import type { GameState, Language } from '../types/game';
import type { TimeSkip } from '../types/game';
import { getBracketForAge } from '../game/ageSystem';
import { getTimeSkipDuration } from '../game/timeSkips';

function buildRoleDefinition(language: Language): string {
  const langInstruction = language === 'ro'
    ? 'IMPORTANT: Respond ENTIRELY in Romanian. All narrative text, choice labels, choice descriptions, world events, trait names, achievement names, and relationship descriptions MUST be in Romanian. Only proper nouns (character name, place names) remain as given.'
    : '';

  return `You are the narrator and world simulator for LifeSim, a life simulation game.
You control the world, NPCs, events, and consequences. The user is living a life from birth to death.
You must be realistic, nuanced, and responsive to the user's choices. You are not the user's character — you are the world.
${langInstruction}
Rules:
- Be immersive and emotionally engaging
- Consequences should feel natural, not punitive
- NPCs should have their own motivations and can act independently
- World events happen regardless of user choices
- Maintain internal consistency across turns
- Never break the fourth wall
- Adapt narrative tone to the character's age (simple for children, complex for adults)`;
}

const RESPONSE_FORMAT = `Always respond with ONLY valid JSON matching this exact schema. No markdown, no code fences, no explanation outside the JSON.

{
  "narrative": "string — 1-3 paragraphs of immersive narrative text covering the full time period",
  "choices": [
    {
      "id": "string — unique, e.g. 'choice_1'",
      "label": "string — short action label, 5-15 words",
      "description": "string — optional flavor text, 1 sentence max",
      "tone": "positive | negative | neutral | risky"
    }
  ],
  "stateUpdates": {
    "health": "number delta (-10 to +10), optional",
    "happiness": "number delta (-10 to +10), optional",
    "intelligence": "number delta (-10 to +10), optional",
    "social": "number delta (-10 to +10), optional",
    "wealth": "number delta (-10 to +10), optional",
    "appearance": "number delta (-5 to +5), optional",
    "newRelationships": [{ "name": "string", "type": "string", "attitude": "number -100 to +100", "description": "string" }],
    "updatedRelationships": [{ "name": "string", "attitudeChange": "number -20 to +20" }],
    "removedRelationships": ["string"],
    "newTraits": ["string"],
    "removedTraits": ["string"],
    "worldEvents": ["string"],
    "newEducation": "string or omit",
    "newOccupation": "string or omit",
    "locationChange": "string or omit",
    "newAchievements": ["string"]
  },
  "isDead": "boolean",
  "deathCause": "string or null"
}`;

export function buildSystemPrompt(language: Language): string {
  return `${buildRoleDefinition(language)}\n\n${RESPONSE_FORMAT}`;
}

export function buildAgeBracketContext(age: number): string {
  const bracket = getBracketForAge(age);
  return `CHARACTER AGE: ${age.toFixed(1)} years old — this is the character's EXACT current age. All narrative, tone, choices, and events MUST match this age precisely.
AGE BRACKET: ${bracket.name} (covers ages ${bracket.minAge}–${bracket.maxAge})
Choice guidelines: ${bracket.choiceGuidelines}
Complexity level: ${bracket.complexityLevel}
Number of choices to offer: ${bracket.minChoices}-${bracket.maxChoices}`;
}

export function buildWorldContext(state: GameState): string {
  const worldEvents = state.world.worldEvents.length > 0
    ? state.world.worldEvents.slice(-5).join('; ')
    : 'None yet';

  return `WORLD STATE:
Current year: ${state.world.currentYear}
Location: ${state.world.location}
Season: ${state.world.season}
Recent world events: ${worldEvents}`;
}

export function buildCharacterContext(state: GameState): string {
  const { character } = state;
  const s = character.stats;
  const traits = character.traits.length > 0 ? character.traits.join(', ') : 'None yet';
  const achievements = character.achievements.length > 0 ? character.achievements.join(', ') : 'None yet';

  return `CHARACTER:
Name: ${character.name}. Age: ${character.currentAge.toFixed(1)}. Gender: ${character.gender}.
Stats: Health ${s.health}/100, Happiness ${s.happiness}/100, Intelligence ${s.intelligence}/100, Social ${s.social}/100, Wealth ${s.wealth}/100, Appearance ${s.appearance}/100.
Traits: ${traits}
Education: ${character.education ?? 'None'}
Occupation: ${character.occupation ?? 'None'}
Achievements: ${achievements}`;
}

export function buildRelationshipsContext(state: GameState): string {
  const active = state.relationships.filter(r => r.isActive);
  if (active.length === 0) return 'RELATIONSHIPS: None yet';

  const lines = active
    .sort((a, b) => Math.abs(b.attitude) - Math.abs(a.attitude))
    .map(r => `- ${r.name} (${r.type}, attitude: ${r.attitude}/100) — ${r.description}`);

  return `RELATIONSHIPS:\n${lines.join('\n')}`;
}

export function buildLifeSummaryContext(state: GameState): string {
  if (!state.lifeSummary) return '';
  return `LIFE SUMMARY (compressed history of earlier events):\n${state.lifeSummary}`;
}

export function buildTurnContext(state: GameState, timeSkip?: TimeSkip): string {
  const sections = [
    buildAgeBracketContext(state.character.currentAge),
    buildWorldContext(state),
    buildCharacterContext(state),
    buildRelationshipsContext(state),
    buildLifeSummaryContext(state),
  ].filter(Boolean);

  let context = sections.join('\n\n');

  if (timeSkip) {
    const durationEn = getTimeSkipDuration(timeSkip, 'en');
    context += `\n\nTIME PERIOD: The player has chosen to advance ${durationEn}. Your narrative must cover what happens during this entire period. For longer periods (3+ months), include 2-3 notable events or developments that occur naturally during this time, not just the immediate consequence of the choice. Scale stat changes proportionally to the time elapsed.`;
  }

  return context;
}
