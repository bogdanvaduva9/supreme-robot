import type { Character } from '../types/game';

const TRAIT_MODIFIERS: Record<string, number> = {
  Athletic: -0.2,
  Healthy: -0.15,
  Disciplined: -0.1,
  Reckless: 0.2,
  Anxious: 0.1,
  Lazy: 0.1,
};

export function calculateDeathProbability(character: Character): number {
  const { currentAge, stats, traits } = character;

  if (currentAge < 60) return 0;

  // Base probability: starts at 0.001 at 60, doubles every 5 years
  const baseProbability = 0.001 * Math.pow(2, (currentAge - 60) / 5);

  // Health modifier: low health increases risk
  const healthModifier = 1 + (50 - stats.health) * 0.02;

  // Lifestyle modifier from traits
  let lifestyleModifier = 0;
  for (const trait of traits) {
    lifestyleModifier += TRAIT_MODIFIERS[trait] ?? 0;
  }

  // Wealth modifier: access to healthcare
  const wealthModifier = stats.wealth > 70 ? 0.9 : stats.wealth < 30 ? 1.2 : 1.0;

  const finalProbability = baseProbability * healthModifier * (1 + lifestyleModifier) * wealthModifier;

  return Math.min(1.0, Math.max(0, finalProbability));
}
