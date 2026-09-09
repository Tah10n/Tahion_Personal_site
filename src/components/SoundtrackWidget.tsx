import { Maximize2, Minimize2, Music2 } from "lucide-react";
import { useState } from "react";
import type { StrudelSoundtrack } from "../data/strudelSoundtrack";
import { StrudelMiniPlayer } from "./StrudelMiniPlayer";

type SoundtrackWidgetProps = {
  soundtrack: StrudelSoundtrack;
};

export function SoundtrackWidget({ soundtrack }: SoundtrackWidgetProps) {
  const [isCompact, setIsCompact] = useState(true);
  const compactLabel = isCompact ? "Expand Strudel player" : "Make Strudel player compact";

  return (
    <aside
      className="soundtrack-widget"
      id="sound"
      data-compact={isCompact ? "true" : "false"}
      aria-label="Strudel music widget"
    >
      <div className="soundtrack-widget-copy" aria-hidden={isCompact}>
        <span className="soundtrack-kicker">
          <Music2 size={15} aria-hidden="true" />
          WebAudio widget
        </span>
        <strong>{soundtrack.title}</strong>
        <span>{soundtrack.tempo}</span>
      </div>

      <StrudelMiniPlayer soundtrack={soundtrack} compact={isCompact} />

      <button
        className="soundtrack-widget-toggle"
        type="button"
        aria-label={compactLabel}
        aria-expanded={!isCompact}
        title={compactLabel}
        onClick={() => setIsCompact((current) => !current)}
      >
        {isCompact ? (
          <Maximize2 size={15} aria-hidden="true" />
        ) : (
          <Minimize2 size={15} aria-hidden="true" />
        )}
      </button>
    </aside>
  );
}
