"use client";

import type { Language, WorldState } from "../../lib/types/game";
import { t } from "../../lib/i18n";

interface WorldStatusProps {
  world: WorldState;
  language: Language;
}

export function WorldStatus({ world, language }: WorldStatusProps) {
  const ui = t(language);

  return (
    <div className="flex items-center gap-4 text-sm text-muted mb-4">
      <span>{world.location}</span>
      <span>{ui.seasons[world.season]}</span>
      {world.worldEvents.length > 0 && (
        <span className="text-xs italic">
          {world.worldEvents[world.worldEvents.length - 1]}
        </span>
      )}
    </div>
  );
}
