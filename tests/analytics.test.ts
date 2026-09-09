import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAnalyticsProvider, readAnalyticsConfig } from "../src/analytics/config.ts";
import { createAnalyticsTracker } from "../src/analytics/eventTracker.ts";
import {
  createPageviewTracker,
  isAnalyticsExcludedHash,
  resolveManualPageviewUrl,
} from "../src/analytics/pageviewTracker.ts";
import { normalizePublicStats } from "../src/analytics/stats.ts";

test("normalizes analytics provider configuration", () => {
  assert.equal(normalizeAnalyticsProvider(undefined), "none");
  assert.equal(normalizeAnalyticsProvider(" disabled "), "none");
  assert.equal(normalizeAnalyticsProvider("PLAUSIBLE"), "plausible");
  assert.equal(normalizeAnalyticsProvider("umami"), "umami");
  assert.equal(normalizeAnalyticsProvider("unknown-vendor"), "custom");
});

test("parses public analytics env without requiring secrets", () => {
  const config = readAnalyticsConfig({
    VITE_ANALYTICS_PROVIDER: "plausible",
    VITE_ANALYTICS_SCRIPT_URL: " https://plausible.example/script.js ",
    VITE_ANALYTICS_SITE_ID: " tahion.dev ",
    VITE_ANALYTICS_DASHBOARD_URL: " https://plausible.example/share/tahion.dev ",
    VITE_ANALYTICS_PUBLIC_STATS_URL: " https://example.com/stats.json ",
    VITE_BUILD_TIME: "2026-06-17T00:00:00.000Z",
    VITE_GIT_SHA: "abc123",
  });

  assert.equal(config.provider, "plausible");
  assert.equal(config.canLoadScript, true);
  assert.equal(config.hasDashboard, true);
  assert.equal(config.hasPublicStats, true);
  assert.equal(config.scriptUrl, "https://plausible.example/script.js");
  assert.equal(config.siteId, "tahion.dev");
  assert.deepEqual(config.warnings, []);
});

test("treats script-only analytics env as a custom provider", () => {
  const config = readAnalyticsConfig({
    VITE_ANALYTICS_SCRIPT_URL: "https://analytics.example/client.js",
  });

  assert.equal(config.provider, "custom");
  assert.equal(config.canLoadScript, true);
});

test("explicit disable overrides a configured tracking script", () => {
  for (const provider of ["none", "off", "disabled", " OFF "]) {
    const config = readAnalyticsConfig({
      VITE_ANALYTICS_PROVIDER: provider,
      VITE_ANALYTICS_SCRIPT_URL: "https://analytics.example/client.js",
    });
    assert.equal(config.provider, "none");
    assert.equal(config.canLoadScript, false);
    const calls: unknown[] = [];
    const target = { plausible: (...args: unknown[]) => calls.push(args) };
    createAnalyticsTracker(config, target)("contact_click");
    createPageviewTracker(config, target)("https://example.com/#work", "Work");
    assert.deepEqual(calls, []);
  }
});

test("does not warn for the explicit custom analytics provider", () => {
  const config = readAnalyticsConfig({
    VITE_ANALYTICS_PROVIDER: "custom",
    VITE_ANALYTICS_SCRIPT_URL: "https://analytics.example/client.js",
  });

  assert.equal(config.provider, "custom");
  assert.deepEqual(config.warnings, []);
});

test("warns when an unknown analytics provider falls back to custom", () => {
  const config = readAnalyticsConfig({
    VITE_ANALYTICS_PROVIDER: "unknown-vendor",
    VITE_ANALYTICS_SCRIPT_URL: "https://analytics.example/client.js",
  });

  assert.equal(config.provider, "custom");
  assert.deepEqual(config.warnings, ["Unknown provider is treated as custom."]);
});

test("analytics tracker is a no-op when unconfigured", () => {
  const calls: unknown[] = [];
  const track = createAnalyticsTracker(
    { provider: "none" },
    {
      plausible: (...args) => calls.push(args),
    },
  );

  assert.doesNotThrow(() => track("contact_click", { placement: "footer" }));
  assert.deepEqual(calls, []);
});

test("analytics tracker delegates Plausible events with sanitized props", () => {
  const calls: unknown[] = [];
  const track = createAnalyticsTracker(
    { provider: "plausible" },
    {
      plausible: (...args) => calls.push(args),
    },
  );

  track(" contact_click ", {
    placement: "footer",
    count: 2,
    empty: undefined,
    blocked: null,
  });

  assert.deepEqual(calls, [
    [
      "contact_click",
      {
        props: {
          placement: "footer",
          count: 2,
        },
      },
    ],
  ]);
});

test("analytics tracker queues Plausible events before the script bootstraps", () => {
  const target = {} as {
    plausible?: ((...args: unknown[]) => void) & { q?: unknown[] };
  };
  const track = createAnalyticsTracker({ provider: "plausible" }, target);

  track("xray_run", {
    ok: true,
    dropped: null,
  });

  assert.equal(typeof target.plausible, "function");
  assert.equal(target.plausible?.q?.length, 1);
  assert.deepEqual(Array.from(target.plausible?.q?.[0] as ArrayLike<unknown>), [
    "xray_run",
    {
      props: {
        ok: true,
      },
    },
  ]);
});

test("resolves manual pageview urls for hash routes and excludes Ops", () => {
  const baseLocation = {
    origin: "https://example.com",
    pathname: "/Tahion_Personal_site/",
    search: "",
  };

  assert.equal(resolveManualPageviewUrl({ ...baseLocation, hash: "" }), null);
  assert.equal(resolveManualPageviewUrl({ ...baseLocation, hash: "#/ops" }), null);
  assert.equal(resolveManualPageviewUrl({ ...baseLocation, hash: "#/ops/events" }), null);
  assert.equal(isAnalyticsExcludedHash("#/ops"), true);
  assert.equal(isAnalyticsExcludedHash("#/xray"), false);
  assert.equal(
    resolveManualPageviewUrl({ ...baseLocation, hash: "#/xray" }),
    "https://example.com/Tahion_Personal_site/#/xray",
  );
  assert.equal(
    resolveManualPageviewUrl({ ...baseLocation, hash: "#/" }),
    "https://example.com/Tahion_Personal_site/",
  );
});

test("manual pageview tracker sends Plausible pageviews and respects the disable flag", () => {
  const calls: unknown[] = [];
  const target = {
    plausible: (...args: unknown[]) => calls.push(args),
  };

  createPageviewTracker({ provider: "plausible", trackPageviews: true }, target)(
    "https://example.com/Tahion_Personal_site/#/xray",
    "Project X-Ray",
  );
  createPageviewTracker({ provider: "plausible", trackPageviews: false }, target)(
    "https://example.com/Tahion_Personal_site/#contact",
    "Contact",
  );

  assert.deepEqual(calls, [
    [
      "pageview",
      {
        u: "https://example.com/Tahion_Personal_site/#/xray",
      },
    ],
  ]);
});

test("manual pageview tracker queues Plausible pageviews before the script bootstraps", () => {
  const target = {} as {
    plausible?: ((...args: unknown[]) => void) & { q?: unknown[] };
  };

  createPageviewTracker({ provider: "plausible", trackPageviews: true }, target)(
    "https://example.com/Tahion_Personal_site/#/xray",
    "Project X-Ray",
  );
  createPageviewTracker({ provider: "plausible", trackPageviews: false }, target)(
    "https://example.com/Tahion_Personal_site/#contact",
    "Contact",
  );

  assert.equal(typeof target.plausible, "function");
  assert.equal(target.plausible?.q?.length, 1);
  assert.deepEqual(Array.from(target.plausible?.q?.[0] as ArrayLike<unknown>), [
    "pageview",
    {
      u: "https://example.com/Tahion_Personal_site/#/xray",
    },
  ]);
});

test("normalizes public stats and clamps unsafe aggregate values", () => {
  const stats = normalizePublicStats({
    windowLabel: " 7d ",
    visitors: 10.4,
    pageviews: -5,
    traffic: [
      { label: " Jun 16 ", visitors: 2.3, pageviews: 4.6 },
      { date: "2026-06-17", visitors: -1, pageviews: 9 },
      { label: "", visitors: 3, pageviews: Number.POSITIVE_INFINITY },
    ],
    topPages: [
      { path: "/#/xray", visitors: 7 },
      { path: "", visitors: -2 },
    ],
    referrers: [{ source: "github.com", visitors: 4 }],
    events: [{ name: "xray_run", count: 3.6 }],
    updatedAt: "2026-06-17T00:00:00.000Z",
  });

  assert.deepEqual(stats, {
    windowLabel: "7d",
    visitors: 10,
    pageviews: 0,
    traffic: [
      { label: "Jun 16", visitors: 2, pageviews: 5 },
      { label: "2026-06-17", visitors: 0, pageviews: 9 },
      { label: "point-3", visitors: 3, pageviews: 0 },
    ],
    topPages: [
      { path: "/#/xray", visitors: 7 },
      { path: "page-2", visitors: 0 },
    ],
    referrers: [{ source: "github.com", visitors: 4 }],
    events: [{ name: "xray_run", count: 4 }],
    updatedAt: "2026-06-17T00:00:00.000Z",
  });
});

test("accepts public stats without optional traffic series", () => {
  const stats = normalizePublicStats({
    visitors: 10,
    pageviews: 12,
    topPages: [],
    referrers: [],
    events: [],
    updatedAt: "2026-06-17T00:00:00.000Z",
  });

  assert.deepEqual(stats?.traffic, []);
});

test("preserves the full traffic window and event totals while limiting rankings", () => {
  const traffic = Array.from({ length: 30 }, (_, index) => ({
    label: `day-${index + 1}`,
    visitors: index + 1,
    pageviews: (index + 1) * 2,
  }));
  const events = Array.from({ length: 10 }, (_, index) => ({
    name: index === 9 ? "contact_click" : `event-${index + 1}`,
    count: 10,
  }));
  const stats = normalizePublicStats({
    windowLabel: "30d",
    visitors: 465,
    pageviews: 930,
    traffic,
    events,
    topPages: Array.from({ length: 12 }, (_, index) => ({ path: `/page-${index}`, visitors: 10 })),
    referrers: Array.from({ length: 12 }, (_, index) => ({
      source: `source-${index}`,
      visitors: 10,
    })),
  });
  assert.ok(stats);
  assert.deepEqual(stats.traffic, traffic);
  assert.equal(stats.traffic.at(-1)?.label, "day-30");
  assert.deepEqual(stats.events, events);
  assert.equal(
    stats.events.reduce((total, event) => total + event.count, 0),
    100,
  );
  assert.equal(stats.events.find((event) => event.name === "contact_click")?.count, 10);
  assert.equal(stats.topPages.length, 8);
  assert.equal(stats.referrers.length, 8);
});

test("rejects malformed public stats shapes", () => {
  assert.equal(normalizePublicStats(null), null);
  assert.equal(normalizePublicStats({}), null);
  assert.equal(
    normalizePublicStats({
      visitors: 10,
      pageviews: 12,
      topPages: [],
      referrers: [],
    }),
    null,
  );
});
