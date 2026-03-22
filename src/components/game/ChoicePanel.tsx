"use client";

import type { Choice } from "../../lib/types/game";
import { ChoiceCard } from "./ChoiceCard";

interface ChoicePanelProps {
  choices: Choice[];
  selectedChoiceId: string | null;
  onSelect: (choiceId: string) => void;
  disabled: boolean;
}

export function ChoicePanel({ choices, selectedChoiceId, onSelect, disabled }: ChoicePanelProps) {
  if (choices.length === 0) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {choices.map((choice) => (
        <ChoiceCard
          key={choice.id}
          choice={choice}
          isSelected={choice.id === selectedChoiceId}
          onClick={() => onSelect(choice.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
