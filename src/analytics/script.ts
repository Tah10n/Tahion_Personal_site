import { analyticsConfig, AnalyticsConfig } from "./config";

type PlausibleQueueTarget = Window & {
  plausible?: PlausibleQueueFunction;
};

type PlausibleQueueFunction = ((...args: unknown[]) => void) & { q?: unknown[] };

function scriptAttributes(config: AnalyticsConfig) {
  const attributes: Record<string, string> = {
    "data-tahion-analytics": config.provider,
  };

  if (config.siteId) {
    if (config.provider === "plausible") {
      attributes["data-domain"] = config.siteId;
    } else if (config.provider === "umami") {
      attributes["data-website-id"] = config.siteId;
    } else {
      attributes["data-site-id"] = config.siteId;
    }
  }

  return attributes;
}

function installPlausibleQueue(doc: Document) {
  const target = (doc.defaultView ?? (typeof window === "undefined" ? undefined : window)) as
    | PlausibleQueueTarget
    | undefined;

  if (!target || typeof target.plausible === "function") {
    return;
  }

  const queued = function (...args: unknown[]) {
    queued.q = queued.q ?? [];
    queued.q.push(args);
  } as PlausibleQueueFunction;

  queued.q = [];
  target.plausible = queued;
}

export function installAnalyticsScript(
  config: AnalyticsConfig = analyticsConfig,
  doc: Document | undefined = typeof document === "undefined" ? undefined : document,
) {
  if (!doc || !config.canLoadScript) {
    return false;
  }

  const existingScript = doc.querySelector<HTMLScriptElement>(
    `script[data-tahion-analytics="${config.provider}"]`,
  );

  if (existingScript) {
    return false;
  }

  const script = doc.createElement("script");
  script.defer = true;
  script.src = config.scriptUrl;

  if (config.provider === "plausible") {
    installPlausibleQueue(doc);
  }

  Object.entries(scriptAttributes(config)).forEach(([name, value]) => {
    script.setAttribute(name, value);
  });

  doc.head.appendChild(script);
  return true;
}
