"use client";

interface NarrativePanelProps {
  narrative: string;
}

export function NarrativePanel({ narrative }: NarrativePanelProps) {
  return (
    <div className="mb-6">
      {/* key forces remount on each new narrative, triggering the CSS animation */}
      <div key={narrative} className="narrative-animate prose prose-invert max-w-none">
        <p className="text-lg leading-relaxed whitespace-pre-wrap">{narrative}</p>
      </div>
    </div>
  );
}
