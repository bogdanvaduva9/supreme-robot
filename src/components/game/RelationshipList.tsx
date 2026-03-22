"use client";

import type { Language, Relationship } from "../../lib/types/game";
import { t } from "../../lib/i18n";

interface RelationshipListProps {
  relationships: Relationship[];
  language: Language;
}

function attitudeColor(attitude: number): string {
  if (attitude >= 50) return "text-success";
  if (attitude >= 0) return "text-muted";
  return "text-danger";
}

export function RelationshipList({ relationships, language }: RelationshipListProps) {
  const ui = t(language);
  const active = relationships.filter((r) => r.isActive);

  if (active.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-muted mb-2">{ui.relationships}</h3>
        <p className="text-xs text-muted">{ui.noRelationships}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted mb-2">
        {ui.relationships} ({active.length})
      </h3>
      <ul className="space-y-2">
        {active
          .sort((a, b) => Math.abs(b.attitude) - Math.abs(a.attitude))
          .map((rel) => (
            <li key={rel.id} className="text-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium">{rel.name}</span>
                <span className={`text-xs font-mono ${attitudeColor(rel.attitude)}`}>
                  {rel.attitude > 0 ? "+" : ""}{rel.attitude}
                </span>
              </div>
              <p className="text-xs text-muted">{rel.type}</p>
            </li>
          ))}
      </ul>
    </div>
  );
}
