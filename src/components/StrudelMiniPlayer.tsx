import { ExternalLink, LoaderCircle, Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { trackEvent } from "../analytics/events";
import type { StrudelSoundtrack } from "../data/strudelSoundtrack";
import { createStrudelRuntimeLoader } from "./strudelRuntime";

type StrudelRuntime = typeof import("@strudel/web");

type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

type StrudelMiniPlayerProps = {
  soundtrack: StrudelSoundtrack;
  compact?: boolean;
};

const defaultVolume = 0.5;

const runtimeLoader = createStrudelRuntimeLoader(() => import("@strudel/web"));

function normalizeVolume(value: number) {
  return Math.min(1, Math.max(0, value));
}

function applyRuntimeVolume(runtime: StrudelRuntime, volume: number) {
  const normalizedVolume = normalizeVolume(volume);
  const audioContext = runtime.getAudioContext();
  const destinationGain = runtime.getSuperdoughAudioController().output.destinationGain;

  if (!destinationGain) {
    return;
  }

  destinationGain.gain.cancelScheduledValues(audioContext.currentTime);
  destinationGain.gain.setTargetAtTime(normalizedVolume, audioContext.currentTime, 0.015);
}

async function applyVolumeToLoadedRuntime(volume: number) {
  const runtime = runtimeLoader.loaded();
  if (!runtime) {
    return;
  }

  try {
    applyRuntimeVolume(runtime, volume);
  } catch {
    // If Strudel failed to initialize, the main playback error path will surface it.
  }
}

async function getStrudelRuntime() {
  return runtimeLoader.ready();
}

async function hushStrudelRuntime() {
  const runtime = runtimeLoader.loaded();
  if (!runtime) {
    return;
  }

  try {
    runtime.hush();
  } catch {
    // If the lazy runtime failed to load, there is no active playback to stop.
  }
}

export function StrudelMiniPlayer({ soundtrack, compact = false }: StrudelMiniPlayerProps) {
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [volume, setVolume] = useState(defaultVolume);
  const requestIdRef = useRef(0);
  const playbackActiveRef = useRef(false);
  const volumeRef = useRef(defaultVolume);

  const isLoading = status === "loading";
  const isPlaying = status === "playing";
  const canPause = status === "loading" || status === "playing";
  const isPlaybackActive = isLoading || isPlaying;
  const playbackButtonLabel = isPlaybackActive ? "Pause" : "Play";
  const volumePercent = Math.round(volume * 100);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      playbackActiveRef.current = false;
      void hushStrudelRuntime();
    };
  }, []);

  const updateVolumeFromInput = (inputElement: HTMLInputElement) => {
    const nextVolume = normalizeVolume(Number(inputElement.value) / 100);
    volumeRef.current = nextVolume;
    setVolume(nextVolume);
    void applyVolumeToLoadedRuntime(nextVolume);
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateVolumeFromInput(event.currentTarget);
  };

  const handleVolumeInput = (event: FormEvent<HTMLInputElement>) => {
    updateVolumeFromInput(event.currentTarget);
  };

  const handlePlay = async () => {
    if (isLoading || isPlaying) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setStatus("loading");

    try {
      const runtime = await getStrudelRuntime();

      if (requestIdRef.current !== requestId) {
        return;
      }

      applyRuntimeVolume(runtime, volumeRef.current);

      const pattern = await runtime.evaluate(soundtrack.code, true);
      if (!pattern) {
        throw new Error("Strudel did not return a playable pattern.");
      }

      if (requestIdRef.current !== requestId) {
        return;
      }

      playbackActiveRef.current = true;
      setStatus("playing");
      trackEvent("soundtrack_play", {
        target: "strudel",
        placement: "mini_player",
      });
    } catch (error) {
      console.error("Strudel playback failed", error);

      if (requestIdRef.current === requestId) {
        playbackActiveRef.current = false;
        setStatus("error");
      }

      trackEvent("soundtrack_error", {
        target: "strudel",
        placement: "mini_player",
      });
    }
  };

  const handlePause = async () => {
    if (!canPause) {
      return;
    }

    requestIdRef.current += 1;
    playbackActiveRef.current = false;
    await hushStrudelRuntime();
    setStatus("paused");
    trackEvent("soundtrack_pause", {
      target: "strudel",
      placement: "mini_player",
    });
  };

  const handlePlaybackToggle = () => {
    if (isPlaybackActive) {
      void handlePause();
      return;
    }

    void handlePlay();
  };

  return (
    <div
      className="strudel-mini-player"
      data-status={status}
      data-compact={compact ? "true" : "false"}
    >
      <div className="strudel-player-top">
        <span className="strudel-player-icon" aria-hidden="true">
          <Volume2 size={17} />
        </span>
      </div>

      <div className="strudel-controls" aria-label={`${soundtrack.title} controls`}>
        <button
          className="strudel-control-button strudel-playback-toggle is-primary"
          type="button"
          onClick={handlePlaybackToggle}
          aria-busy={isLoading ? "true" : undefined}
          aria-pressed={isPlaybackActive}
          aria-label={playbackButtonLabel}
          title={playbackButtonLabel}
        >
          {isLoading ? (
            <LoaderCircle size={16} aria-hidden="true" />
          ) : isPlaying ? (
            <Pause size={16} aria-hidden="true" />
          ) : (
            <Play size={16} aria-hidden="true" />
          )}
          <span className="strudel-button-text">{playbackButtonLabel}</span>
        </button>
        <a
          className="strudel-open-link"
          href={soundtrack.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${soundtrack.title} in Strudel`}
          title="Open in Strudel"
          onClick={() =>
            trackEvent("soundtrack_open", {
              target: "strudel",
              placement: compact ? "mini_player_compact" : "mini_player",
            })
          }
        >
          <ExternalLink size={15} aria-hidden="true" />
          <span className="strudel-open-text">Open in Strudel</span>
        </a>
      </div>

      <label className="strudel-volume-control">
        <span className="strudel-volume-label">Vol</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={volumePercent}
          aria-label="Volume"
          onInput={handleVolumeInput}
          onChange={handleVolumeChange}
        />
        <output className="strudel-volume-value" aria-live="polite">
          {volumePercent}%
        </output>
      </label>
    </div>
  );
}
