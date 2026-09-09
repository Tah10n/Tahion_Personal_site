export type AnalyticsProvider = "none" | "plausible" | "umami" | "custom";

export type AnalyticsEnv = Partial<{
  VITE_ANALYTICS_PROVIDER: string;
  VITE_ANALYTICS_SCRIPT_URL: string;
  VITE_ANALYTICS_SITE_ID: string;
  VITE_ANALYTICS_DASHBOARD_URL: string;
  VITE_ANALYTICS_PUBLIC_STATS_URL: string;
  VITE_ANALYTICS_TRACK_PAGEVIEWS: string;
  VITE_BUILD_TIME: string;
  VITE_GIT_SHA: string;
}>;

export type AnalyticsConfig = {
  provider: AnalyticsProvider;
  scriptUrl: string;
  siteId: string;
  dashboardUrl: string;
  publicStatsUrl: string;
  buildTime: string;
  gitSha: string;
  trackPageviews: boolean;
  canLoadScript: boolean;
  hasDashboard: boolean;
  hasPublicStats: boolean;
  warnings: string[];
};

const knownProviders = new Set<AnalyticsProvider>(["plausible", "umami", "custom"]);

function envString(value: string | undefined) {
  return value?.trim() ?? "";
}

function envBoolean(value: string | undefined, fallback: boolean) {
  const normalized = envString(value).toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (["0", "false", "no", "off", "disabled"].includes(normalized)) {
    return false;
  }

  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) {
    return true;
  }

  return fallback;
}

export function normalizeAnalyticsProvider(value: string | undefined): AnalyticsProvider {
  const normalized = envString(value).toLowerCase();

  if (!normalized || normalized === "off" || normalized === "disabled" || normalized === "none") {
    return "none";
  }

  return knownProviders.has(normalized as AnalyticsProvider)
    ? (normalized as AnalyticsProvider)
    : "custom";
}

export function readAnalyticsConfig(env: AnalyticsEnv = {}): AnalyticsConfig {
  const rawProvider = envString(env.VITE_ANALYTICS_PROVIDER);
  const normalizedRawProvider = rawProvider.toLowerCase();
  const scriptUrl = envString(env.VITE_ANALYTICS_SCRIPT_URL);
  const siteId = envString(env.VITE_ANALYTICS_SITE_ID);
  const dashboardUrl = envString(env.VITE_ANALYTICS_DASHBOARD_URL);
  const publicStatsUrl = envString(env.VITE_ANALYTICS_PUBLIC_STATS_URL);
  const buildTime = envString(env.VITE_BUILD_TIME);
  const gitSha = envString(env.VITE_GIT_SHA);
  const explicitProvider = normalizeAnalyticsProvider(rawProvider);
  const provider = !rawProvider && scriptUrl ? "custom" : explicitProvider;
  const isKnownProvider =
    !rawProvider ||
    ["off", "disabled", "none"].includes(normalizedRawProvider) ||
    knownProviders.has(normalizedRawProvider as AnalyticsProvider);
  const warnings: string[] = [];

  if (!isKnownProvider && provider === "custom") {
    warnings.push("Unknown provider is treated as custom.");
  }

  if (provider !== "none" && !scriptUrl && !dashboardUrl && !publicStatsUrl) {
    warnings.push("Analytics provider is set, but no public analytics URLs are configured.");
  }

  if ((provider === "plausible" || provider === "umami") && scriptUrl && !siteId) {
    warnings.push("Tracking script is configured without a site id.");
  }

  return {
    provider,
    scriptUrl,
    siteId,
    dashboardUrl,
    publicStatsUrl,
    buildTime,
    gitSha,
    trackPageviews: envBoolean(env.VITE_ANALYTICS_TRACK_PAGEVIEWS, true),
    canLoadScript: provider !== "none" && Boolean(scriptUrl),
    hasDashboard: Boolean(dashboardUrl),
    hasPublicStats: Boolean(publicStatsUrl),
    warnings,
  };
}

export const analyticsConfig = readAnalyticsConfig(import.meta.env ?? {});
