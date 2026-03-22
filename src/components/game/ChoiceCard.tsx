"use client";

import type { Choice } from "../../lib/types/game";

const toneColors: Record<Choice["tone"], string> = {
  positive: "border-success",
  negative: "border-danger",
  neutral: "border-border",
  risky: "border-warning",
};

const toneSelectedBg: Record<Choice["tone"], string> = {
  positive: "bg-success/15",
  negative: "bg-danger/15",
  neutral: "bg-surface-hover",
  risky: "bg-warning/15",
};

const toneDots: Record<Choice["tone"], string> = {
  positive: "bg-success",
  negative: "bg-danger",
  neutral: "bg-muted",
  risky: "bg-warning",
};

interface ChoiceCardProps {
  choice: Choice;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}

export function ChoiceCard({ choice, isSelected, onClick, disabled }: ChoiceCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left p-3 rounded-lg border transition-all ${toneColors[choice.tone]} ${
        isSelected ? toneSelectedBg[choice.tone] + " ring-1 ring-accent" : "hover:bg-surface-hover"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${toneDots[choice.tone]}`} />
        <div>
          <p className="font-medium text-sm">{choice.label}</p>
          {choice.description && (
            <p className="text-xs text-muted mt-0.5">{choice.description}</p>
          )}
        </div>
      </div>
    </button>
  );
}
