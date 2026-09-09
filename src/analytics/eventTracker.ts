import type { AnalyticsConfig } from "./config";

export type AnalyticsEventProps = Record<string, string | number | boolean | null | undefined>;

type PlausibleFunction = ((
  eventName: string,
  options?: { props?: Record<string, string | number | boolean> },
) => void) & {
  q?: unknown[];
};

type UmamiObject = {
  track?: (eventName: string, props?: Record<string, string | number | boolean>) => void;
};

type AnalyticsTarget = {
  plausible?: PlausibleFunction;
  umami?:
    | UmamiObject
    | ((eventName: string, props?: Record<string, string | number | boolean>) => void);
  tahionAnalytics?: {
    track?: (eventName: string, props?: Record<string, string | number | boolean>) => void;
  };
  dispatchEvent?: (event: Event) => boolean;
};

export function cleanAnalyticsProps(props: AnalyticsEventProps = {}) {
  return Object.fromEntries(
    Object.entries(props).filter((entry): entry is [string, string | number | boolean] => {
      const [, value] = entry;
      return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
    }),
  );
}

function ensurePlausibleQueue(target: AnalyticsTarget) {
  if (typeof target.plausible === "function") {
    return target.plausible;
  }

  const queued = function (...args: unknown[]) {
    queued.q = queued.q ?? [];
    queued.q.push(args);
  } as PlausibleFunction;

  queued.q = [];
  target.plausible = queued;
  return queued;
}

export function createAnalyticsTracker(
  config: Pick<AnalyticsConfig, "provider">,
  target?: AnalyticsTarget,
) {
  return (eventName: string, props: AnalyticsEventProps = {}) => {
    const name = eventName.trim();

    if (!name || config.provider === "none" || !target) {
      return;
    }

    const cleanProps = cleanAnalyticsProps(props);

    if (config.provider === "plausible") {
      ensurePlausibleQueue(target)(name, { props: cleanProps });
      return;
    }

    if (config.provider === "umami") {
      if (typeof target.umami === "function") {
        target.umami(name, cleanProps);
        return;
      }

      if (
        target.umami &&
        typeof target.umami === "object" &&
        typeof target.umami.track === "function"
      ) {
        target.umami.track(name, cleanProps);
        return;
      }
    }

    if (config.provider === "custom") {
      if (typeof target.tahionAnalytics?.track === "function") {
        target.tahionAnalytics.track(name, cleanProps);
        return;
      }

      if (typeof CustomEvent !== "undefined" && typeof target.dispatchEvent === "function") {
        target.dispatchEvent(
          new CustomEvent("tahion:analytics", {
            detail: { name, props: cleanProps },
          }),
        );
      }
    }
  };
}
