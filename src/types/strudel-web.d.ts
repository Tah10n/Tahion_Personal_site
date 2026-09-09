declare module "@strudel/web" {
  export function initStrudel(options?: { miniAllStrings?: boolean }): Promise<unknown>;
  export function initAudio(options?: { disableWorklets?: boolean }): Promise<unknown>;
  export function evaluate(code: string, autoplay?: boolean): Promise<unknown>;
  export function hush(): void;
  export function getAudioContext(): AudioContext;
  export function getSuperdoughAudioController(): {
    output: {
      destinationGain: GainNode | null;
    };
  };
}
