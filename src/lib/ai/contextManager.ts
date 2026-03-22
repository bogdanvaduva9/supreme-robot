import type { GameState, ConversationTurn, TimeSkip } from '../types/game';
import type { Choice } from '../types/game';
import { buildSystemPrompt, buildTurnContext, buildAgeBracketContext, buildCharacterContext } from './prompts';
import { getTimeSkipDuration } from '../game/timeSkips';

const ROLLING_WINDOW_SIZE = 10;

export interface AIMessages {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export function buildMessages(state: GameState, pendingActions: string[], timeSkip: TimeSkip): AIMessages {
  const system = buildSystemPrompt(state.language);
  const turnContext = buildTurnContext(state, timeSkip);

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  messages.push({ role: 'user', content: turnContext });
  messages.push({
    role: 'assistant',
    content: 'I understand the current game state. I will respond to the player\'s next choice with narrative and new choices in the required JSON format.',
  });

  // Add rolling window of recent conversation
  const windowStart = Math.max(0, state.conversationHistory.length - ROLLING_WINDOW_SIZE * 2);
  const recentHistory = state.conversationHistory.slice(windowStart);
  for (const turn of recentHistory) {
    messages.push({ role: turn.role, content: turn.content });
  }

  // Build the action description for the AI
  const age = state.character.currentAge;
  const duration = getTimeSkipDuration(timeSkip, 'en');

  const actionsText = pendingActions.length === 1
    ? `The player chose: "${pendingActions[0]}"`
    : `The player has planned the following actions for this period:\n${pendingActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;

  messages.push({
    role: 'user',
    content: `CRITICAL: The character is currently ${age.toFixed(1)} years old. Your narrative, choices, and all events MUST reflect this exact age — do not reference earlier life stages.\n\n${actionsText}\n\nSimulate what happens during the next ${duration}, weaving all the planned actions into the narrative and including any random events that naturally occur in this period.`,
  });

  return { system, messages };
}

const PREVIEW_SYSTEM = `You are the world simulator for LifeSim. Given the character's current state and their already-planned actions, suggest 3-4 additional actions they could also take during the same time period.
Respond ONLY with valid JSON — no markdown, no code fences:
{"choices":[{"id":"c1","label":"short label 5-15 words","description":"one sentence of flavour text","tone":"positive|negative|neutral|risky"}]}`;

export function buildPreviewMessages(
  state: GameState,
  pendingActions: string[],
): AIMessages {
  const bracketCtx = buildAgeBracketContext(state.character.currentAge);
  const charCtx = buildCharacterContext(state);

  const alreadyPlanned = pendingActions.length
    ? `Actions already planned:\n${pendingActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n`
    : '';

  const userMsg = `${bracketCtx}\n\n${charCtx}\n\n${alreadyPlanned}Suggest 3-4 additional or follow-up actions the character could realistically take during this same time period.`;

  return {
    system: PREVIEW_SYSTEM,
    messages: [{ role: 'user', content: userMsg }],
  };
}

// Minimal type for the preview-only AI response
export interface PreviewAIPayload {
  choices: Choice[];
}

export function buildStartMessages(state: GameState, startingAge: number = 0): AIMessages {
  const system = buildSystemPrompt(state.language);
  const turnContext = buildTurnContext(state);

  if (startingAge > 0) {
    return {
      system,
      messages: [{
        role: 'user',
        content: `${turnContext}

This character is already ${startingAge} years old. Do NOT write a birth scene.

Your response must do three things:

1. BACKSTORY NARRATIVE (2-3 rich paragraphs): Cover the arc of this character's life from birth to age ${startingAge}. Make it specific to ${state.world.location} and birth year ${state.character.birthYear}. Weave in formative moments, key relationships, pivotal decisions, and what shaped them into who they are today. Write it as immersive prose, not a list of events.

2. VIA stateUpdates, fully establish their current life:
   - Stats (use deltas from the 50 baseline to reflect the life they've lived — health, wealth, intelligence etc should feel earned)
   - 3–5 key relationships: family still alive, closest friends, romantic partner or ex if age-appropriate, a rival or difficult person
   - Education level and current occupation (if of working age)
   - 3–5 personality traits they've developed through experience
   - Any notable achievements

3. Close the narrative by grounding the reader in the character's PRESENT MOMENT at age ${startingAge}, then present 3–4 choices that feel immediately relevant to where they are in life right now.`,
      }],
    };
  }

  return {
    system,
    messages: [{
      role: 'user',
      content: `${turnContext}\n\nThis is the beginning of a new life. Generate the birth narrative for this character. Describe the moment of birth, the family, and the immediate world they are born into. Then present the first choices appropriate for an infant.`,
    }],
  };
}

export function shouldCompressSummary(state: GameState): boolean {
  return state.turnCount > 0 && state.turnCount % 10 === 0;
}

export function getHistoryForCompression(state: GameState): ConversationTurn[] {
  const windowStart = Math.max(0, state.conversationHistory.length - ROLLING_WINDOW_SIZE * 2);
  return state.conversationHistory.slice(0, windowStart);
}
