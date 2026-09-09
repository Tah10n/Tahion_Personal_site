import type { AnalyticsConfig } from "./config";

export type LocationLike = Pick<Location, "hash" | "origin" | "pathname" | "search">;

type PageviewTarget = {
  plausible?: PlausibleFunction;
  umami?:
    | {
        track?: (
          payload?:
            | string
            | Record<string, string | number | boolean>
            | ((
                props: Record<string, string | number | boolean>,
              ) => Record<string, string | number | boolean>),
          props?: Record<string, string | number | boolean>,
        ) => void;
      }
    | ((
        payload?:
          | string
          | Record<string, string | number | boolean>
          | ((
              props: Record<string, string | number | boolean>,
            ) => Record<string, string | number | boolean>),
        props?: Record<string, string | number | boolean>,
      ) => void);
  tahionAnalytics?: {
    pageview?: (url: string, props?: Record<string, string | number | boolean>) => void;
  };
  dispatchEvent?: (event: Event) => boolean;
};

type PlausibleFunction = ((
  eventName: "pageview",
  options?: { u?: string; props?: Record<string, string | number | boolean> },
) => void) & {
  q?: unknown[];
};

const excludedHashPrefixes = ["#/ops"];

function normalizedHash(hash: string) {
  return hash.trim().toLowerCase();
}

export function isAnalyticsExcludedHash(hash: string) {
  const normalized = normalizedHash(hash);
  return excludedHashPrefixes.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function resolveManualPageviewUrl(location: LocationLike): string | null {
  const hash = location.hash.trim();

  if (!hash || isAnalyticsExcludedHash(hash)) {
    return null;
  }

  if (hash === "#/" || hash === "#") {
    return `${location.origin}${location.pathname}${location.search}`;
  }

  return `${location.origin}${location.pathname}${location.search}${hash}`;
}

function ensurePlausibleQueue(target: PageviewTarget) {
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

export function createPageviewTracker(
  config: Pick<AnalyticsConfig, "provider" | "trackPageviews">,
  target?: PageviewTarget,
) {
  return (url: string | null, title = "") => {
    if (!url || !config.trackPageviews || config.provider === "none" || !target) {
      return;
    }

    const props = {
      title,
      url,
    };

    if (config.provider === "plausible") {
      ensurePlausibleQueue(target)("pageview", { u: url });
      return;
    }

    if (config.provider === "umami") {
      if (typeof target.umami === "function") {
        target.umami(props);
        return;
      }

      if (
        target.umami &&
        typeof target.umami === "object" &&
        typeof target.umami.track === "function"
      ) {
        target.umami.track((currentProps) => ({
          ...currentProps,
          ...props,
        }));
        return;
      }
    }

    if (config.provider === "custom") {
      if (typeof target.tahionAnalytics?.pageview === "function") {
        target.tahionAnalytics.pageview(url, props);
        return;
      }

      if (typeof CustomEvent !== "undefined" && typeof target.dispatchEvent === "function") {
        target.dispatchEvent(
          new CustomEvent("tahion:pageview", {
            detail: props,
          }),
        );
      }
    }
  };
}
