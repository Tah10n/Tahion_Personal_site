export type PublicStatsItem = {
  path?: string;
  source?: string;
  name?: string;
  label?: string;
  date?: string;
  visitors?: number;
  pageviews?: number;
  count?: number;
};

export type PublicStatsTrafficPoint = {
  label: string;
  visitors: number;
  pageviews: number;
};

export type PublicStats = {
  windowLabel: string;
  visitors: number;
  pageviews: number;
  traffic: PublicStatsTrafficPoint[];
  topPages: { path: string; visitors: number }[];
  referrers: { source: string; visitors: number }[];
  events: { name: string; count: number }[];
  updatedAt: string | null;
};

const itemLimit = 8;

export const demoOpsStats: PublicStats = {
  windowLabel: "demo 7d",
  visitors: 384,
  pageviews: 927,
  traffic: [
    { label: "Jun 11", visitors: 42, pageviews: 97 },
    { label: "Jun 12", visitors: 48, pageviews: 112 },
    { label: "Jun 13", visitors: 51, pageviews: 128 },
    { label: "Jun 14", visitors: 56, pageviews: 139 },
    { label: "Jun 15", visitors: 62, pageviews: 153 },
    { label: "Jun 16", visitors: 58, pageviews: 142 },
    { label: "Jun 17", visitors: 67, pageviews: 156 },
  ],
  topPages: [
    { path: "/", visitors: 214 },
    { path: "/#/xray", visitors: 92 },
    { path: "/#work", visitors: 48 },
    { path: "/#contact", visitors: 30 },
  ],
  referrers: [
    { source: "github.com", visitors: 134 },
    { source: "linkedin.com", visitors: 82 },
    { source: "direct", visitors: 71 },
    { source: "search", visitors: 45 },
  ],
  events: [
    { name: "xray_run", count: 38 },
    { name: "xray_demo_open", count: 16 },
    { name: "contact_click", count: 11 },
    { name: "project_link_click", count: 29 },
  ],
  updatedAt: "2026-06-17T00:00:00.000Z",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

function normalizeLabel(value: unknown, fallback: string) {
  const label = typeof value === "string" ? value.trim() : "";
  return label || fallback;
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function normalizeList<T extends PublicStatsItem, R>(
  value: unknown,
  mapItem: (item: T, index: number) => R,
  limit = Infinity,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .slice(0, limit)
    .map((item, index) => mapItem(item as T, index));
}

export function normalizePublicStats(value: unknown): PublicStats | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.visitors !== "number" ||
    typeof value.pageviews !== "number" ||
    !Array.isArray(value.topPages) ||
    !Array.isArray(value.referrers) ||
    !Array.isArray(value.events)
  ) {
    return null;
  }

  return {
    windowLabel: normalizeLabel(value.windowLabel, "current window"),
    visitors: normalizeCount(value.visitors),
    pageviews: normalizeCount(value.pageviews),
    traffic: normalizeList(value.traffic, (item, index) => ({
      label: normalizeLabel(item.label ?? item.date, `point-${index + 1}`),
      visitors: normalizeCount(item.visitors),
      pageviews: normalizeCount(item.pageviews),
    })),
    topPages: normalizeList(
      value.topPages,
      (item, index) => ({
        path: normalizeLabel(item.path, `page-${index + 1}`),
        visitors: normalizeCount(item.visitors),
      }),
      itemLimit,
    ),
    referrers: normalizeList(
      value.referrers,
      (item, index) => ({
        source: normalizeLabel(item.source, `source-${index + 1}`),
        visitors: normalizeCount(item.visitors),
      }),
      itemLimit,
    ),
    events: normalizeList(value.events, (item, index) => ({
      name: normalizeLabel(item.name, `event-${index + 1}`),
      count: normalizeCount(item.count),
    })),
    updatedAt: normalizeDate(value.updatedAt),
  };
}

export async function fetchPublicStats(
  url: string,
  fetcher: typeof fetch = fetch,
): Promise<PublicStats> {
  const requestUrl = url.trim();

  if (!requestUrl) {
    throw new Error("Public stats URL is empty.");
  }

  const response = await fetcher(requestUrl, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Public stats request failed with status ${response.status}.`);
  }

  const normalized = normalizePublicStats(await response.json());

  if (!normalized) {
    throw new Error("Public stats response does not match the expected shape.");
  }

  return normalized;
}
