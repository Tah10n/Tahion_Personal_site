import {
  Activity,
  BarChart3,
  ExternalLink,
  Gauge,
  GitBranch,
  RadioTower,
  Route,
  ServerCog,
  ShieldCheck,
  Signal,
  TerminalSquare,
  TrendingUp,
  Users,
} from "lucide-react";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { analyticsConfig } from "../analytics/config";
import {
  demoOpsStats,
  fetchPublicStats,
  PublicStats,
  PublicStatsTrafficPoint,
} from "../analytics/stats";

type StatsState =
  | { state: "demo"; stats: PublicStats; message: string }
  | { state: "loading"; stats: PublicStats; message: string }
  | { state: "ready"; stats: PublicStats; message: string };

const xrayBackendUrl = import.meta.env.VITE_XRAY_BACKEND_URL?.trim() ?? "";
const basePath = import.meta.env.BASE_URL;

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function providerLabel() {
  if (analyticsConfig.provider === "none") {
    return "Unconfigured";
  }

  return analyticsConfig.provider[0].toUpperCase() + analyticsConfig.provider.slice(1);
}

function eventCount(stats: PublicStats, name: string) {
  return stats.events.find((event) => event.name === name)?.count ?? 0;
}

function barStyle(value: number, maxValue: number): CSSProperties {
  const width = maxValue > 0 ? Math.max(8, Math.min(100, Math.round((value / maxValue) * 100))) : 8;
  return { width: `${width}%` };
}

function deltaLabel(value: number) {
  if (value === 0) {
    return "0 vs prev";
  }

  return `${value > 0 ? "+" : ""}${formatNumber(value)} vs prev`;
}

function chartPoints(
  traffic: PublicStatsTrafficPoint[],
  key: "visitors" | "pageviews",
  maxValue: number,
) {
  const width = 320;
  const height = 142;
  const padX = 12;
  const padY = 14;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padY * 2;

  return traffic.map((point, index) => {
    const x =
      traffic.length === 1
        ? width / 2
        : padX + (index / Math.max(traffic.length - 1, 1)) * innerWidth;
    const y = padY + innerHeight - (point[key] / Math.max(maxValue, 1)) * innerHeight;

    return {
      x,
      y,
      label: point.label,
      value: point[key],
    };
  });
}

function smoothPath(points: { x: number; y: number }[]) {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  }

  return points.slice(1).reduce(
    (path, point, index) => {
      const previous = points[index];
      const controlX = (previous.x + point.x) / 2;

      return `${path} C ${controlX.toFixed(1)} ${previous.y.toFixed(1)}, ${controlX.toFixed(
        1,
      )} ${point.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    },
    `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`,
  );
}

function areaPath(points: { x: number; y: number }[]) {
  if (!points.length) {
    return "";
  }

  const bottom = 128;
  return [
    `M ${points[0].x.toFixed(1)} ${bottom}`,
    `L ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`,
    smoothPath(points).replace(/^M [\d.-]+ [\d.-]+/, ""),
    `L ${points[points.length - 1].x.toFixed(1)} ${bottom}`,
    "Z",
  ].join(" ");
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="ops-metric-card">
      <span className="ops-metric-icon">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function TrafficTrendChart({ traffic }: { traffic: PublicStatsTrafficPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...traffic.flatMap((point) => [point.visitors, point.pageviews]), 1);
  const visitors = chartPoints(traffic, "visitors", maxValue);
  const pageviews = chartPoints(traffic, "pageviews", maxValue);
  const latest = traffic.at(-1);
  const previous = traffic.at(-2);
  const visitorDelta = latest && previous ? latest.visitors - previous.visitors : 0;
  const pageviewDelta = latest && previous ? latest.pageviews - previous.pageviews : 0;
  const visitorPath = smoothPath(visitors);
  const pageviewPath = smoothPath(pageviews);
  const activeIndex = Math.min(hoveredIndex ?? Math.max(traffic.length - 1, 0), traffic.length - 1);
  const activeTraffic = traffic[activeIndex];
  const activeVisitors = visitors[activeIndex];
  const activePageviews = pageviews[activeIndex];
  const activePercent = activePageviews ? `${(activePageviews.x / 320) * 100}%` : "100%";
  const tooltipShift =
    activePageviews && activePageviews.x > 230
      ? "-100%"
      : activePageviews && activePageviews.x < 90
        ? "0"
        : "-50%";
  const yTicks = [maxValue, Math.round(maxValue / 2), 0];

  return (
    <section className="ops-panel ops-trend-panel">
      <div className="ops-section-heading">
        <span>
          <TrendingUp size={18} aria-hidden="true" />
          Traffic trend
        </span>
        <small>{traffic.length ? `${traffic.length} points` : "no series"}</small>
      </div>

      {traffic.length ? (
        <>
          <div className="ops-chart-kpi-row" aria-label="Traffic trend latest values">
            <div>
              <span>Latest visitors</span>
              <strong>{formatNumber(latest?.visitors ?? 0)}</strong>
              <small className={visitorDelta >= 0 ? "ops-delta-positive" : "ops-delta-negative"}>
                {deltaLabel(visitorDelta)}
              </small>
            </div>
            <div>
              <span>Latest pageviews</span>
              <strong>{formatNumber(latest?.pageviews ?? 0)}</strong>
              <small className={pageviewDelta >= 0 ? "ops-delta-positive" : "ops-delta-negative"}>
                {deltaLabel(pageviewDelta)}
              </small>
            </div>
            <div>
              <span>View depth</span>
              <strong>
                {latest?.visitors
                  ? `${(latest.pageviews / Math.max(latest.visitors, 1)).toFixed(1)}x`
                  : "0x"}
              </strong>
              <small>views per visitor</small>
            </div>
          </div>
          <div className="ops-chart-legend" aria-label="Traffic chart legend">
            <span className="ops-legend-visitors">Visitors</span>
            <span className="ops-legend-pageviews">Pageviews</span>
            {latest ? <strong>{latest.label}</strong> : null}
          </div>
          <div
            className="ops-line-chart"
            role="img"
            aria-label="Traffic trend for visitors and pageviews"
            style={
              {
                "--active-x": activePercent,
                "--tooltip-shift": tooltipShift,
              } as CSSProperties
            }
          >
            <div className="ops-chart-y-axis" aria-hidden="true">
              <span className="ops-chart-y-label">Count</span>
              {yTicks.map((tick, index) => (
                <span key={`tick-${index}-${tick}`}>{formatNumber(tick)}</span>
              ))}
            </div>
            <div className="ops-chart-plot" onMouseLeave={() => setHoveredIndex(null)}>
              <svg viewBox="0 0 320 142" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="ops-chart-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--acid)" stopOpacity="0.34" />
                    <stop offset="58%" stopColor="var(--cyan)" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
                  </linearGradient>
                  <filter id="ops-chart-glow" x="-10%" y="-25%" width="120%" height="150%">
                    <feGaussianBlur stdDeviation="2.6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path className="ops-chart-grid" d="M 12 28 H 308 M 12 72 H 308 M 12 116 H 308" />
                <path
                  className="ops-chart-grid-vertical"
                  d="M 62 14 V 128 M 160 14 V 128 M 258 14 V 128"
                />
                <path
                  className="ops-chart-area"
                  d={areaPath(pageviews)}
                  fill="url(#ops-chart-fill)"
                />
                <path
                  className="ops-chart-line ops-chart-pageviews"
                  d={pageviewPath}
                  filter="url(#ops-chart-glow)"
                />
                <path
                  className="ops-chart-line ops-chart-visitors"
                  d={visitorPath}
                  filter="url(#ops-chart-glow)"
                />
                {activePageviews && activeVisitors ? (
                  <g className="ops-chart-active-marker">
                    <line x1={activePageviews.x} x2={activePageviews.x} y1="14" y2="128" />
                    <line
                      className="ops-chart-active-pageviews"
                      x1={activePageviews.x - 5}
                      x2={activePageviews.x + 5}
                      y1={activePageviews.y}
                      y2={activePageviews.y}
                    />
                    <line
                      className="ops-chart-active-visitors"
                      x1={activeVisitors.x - 5}
                      x2={activeVisitors.x + 5}
                      y1={activeVisitors.y}
                      y2={activeVisitors.y}
                    />
                  </g>
                ) : null}
              </svg>
              <div className="ops-chart-hit-layer" aria-label="Traffic data points">
                {traffic.map((point, index) => (
                  <button
                    aria-label={`${point.label}: ${formatNumber(point.visitors)} visitors, ${formatNumber(
                      point.pageviews,
                    )} pageviews`}
                    key={`hit-${point.label}`}
                    onFocus={() => setHoveredIndex(index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    type="button"
                  />
                ))}
              </div>
              {activeTraffic ? (
                <div className="ops-chart-tooltip">
                  <span>{activeTraffic.label}</span>
                  <div>
                    <strong>{formatNumber(activeTraffic.pageviews)}</strong>
                    <small>pageviews</small>
                  </div>
                  <div>
                    <strong>{formatNumber(activeTraffic.visitors)}</strong>
                    <small>visitors</small>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="ops-chart-axis" aria-hidden="true">
            <span>{traffic[0]?.label}</span>
            <span>{formatNumber(maxValue)} max</span>
            <span>{latest?.label}</span>
          </div>
        </>
      ) : (
        <p className="ops-empty-line">No public traffic series yet.</p>
      )}
    </section>
  );
}

function TrafficBars({ traffic }: { traffic: PublicStatsTrafficPoint[] }) {
  const maxPageviews = Math.max(...traffic.map((point) => point.pageviews), 1);

  return (
    <section className="ops-panel ops-bars-panel">
      <div className="ops-section-heading">
        <span>
          <BarChart3 size={18} aria-hidden="true" />
          Daily load
        </span>
      </div>

      {traffic.length ? (
        <div className="ops-traffic-bars-list" role="list">
          {traffic.map((point) => (
            <article className="ops-traffic-bar-row" role="listitem" key={point.label}>
              <div>
                <strong>{point.label}</strong>
                <span>{Math.round((point.pageviews / maxPageviews) * 100)}% of peak</span>
              </div>
              <div className="ops-traffic-bar-track" aria-hidden="true">
                <span
                  className="ops-traffic-bar-pageviews"
                  style={barStyle(point.pageviews, maxPageviews)}
                />
                <span
                  className="ops-traffic-bar-visitors"
                  style={barStyle(point.visitors, maxPageviews)}
                />
              </div>
              <small>
                {formatNumber(point.visitors)} visitors / {formatNumber(point.pageviews)} views
              </small>
            </article>
          ))}
        </div>
      ) : (
        <p className="ops-empty-line">Publish `traffic` rows to draw daily bars.</p>
      )}
    </section>
  );
}

function RankedList({
  title,
  items,
  kind,
}: {
  title: string;
  items: { label: string; value: number }[];
  kind: "route" | "source";
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="ops-panel">
      <div className="ops-section-heading">
        <span>
          {kind === "route" ? (
            <Route size={18} aria-hidden="true" />
          ) : (
            <RadioTower size={18} aria-hidden="true" />
          )}
          {title}
        </span>
      </div>
      <div className="ops-rank-list" role="list">
        {items.length ? (
          items.map((item) => (
            <article key={`${kind}-${item.label}`} className="ops-rank-row" role="listitem">
              <div>
                <strong>{item.label}</strong>
                <span>{formatNumber(item.value)} visitors</span>
              </div>
              <div className="ops-rank-track" aria-hidden="true">
                <span style={barStyle(item.value, maxValue)} />
              </div>
            </article>
          ))
        ) : (
          <p className="ops-empty-line">No public aggregate rows yet.</p>
        )}
      </div>
    </section>
  );
}

function StatusRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className={`ops-status-row ops-status-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function OpsDashboardPage() {
  const [statsState, setStatsState] = useState<StatsState>(() =>
    analyticsConfig.hasPublicStats
      ? {
          state: "loading",
          stats: demoOpsStats,
          message: "Loading public telemetry feed.",
        }
      : {
          state: "demo",
          stats: demoOpsStats,
          message: "Analytics feed missing. Showing demo telemetry.",
        },
  );

  useEffect(() => {
    if (!analyticsConfig.publicStatsUrl) {
      return;
    }

    let cancelled = false;

    fetchPublicStats(analyticsConfig.publicStatsUrl)
      .then((stats) => {
        if (!cancelled) {
          setStatsState({ state: "ready", stats, message: "Public telemetry feed online." });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatsState({
            state: "demo",
            stats: demoOpsStats,
            message:
              error instanceof Error
                ? `Stats feed unavailable: ${error.message}`
                : "Stats feed unavailable.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = statsState.stats;
  const interactionStats = useMemo(
    () => [
      { label: "X-Ray runs", value: eventCount(stats, "xray_run"), icon: Gauge },
      { label: "Demo opens", value: eventCount(stats, "xray_demo_open"), icon: Activity },
      { label: "Contact clicks", value: eventCount(stats, "contact_click"), icon: Signal },
      {
        label: "Project links",
        value: eventCount(stats, "project_link_click"),
        icon: ExternalLink,
      },
    ],
    [stats],
  );

  return (
    <main className="ops-page">
      <section className="ops-hero" aria-labelledby="ops-title">
        <div className="ops-command-panel">
          <span className="eyebrow">
            <TerminalSquare size={15} aria-hidden="true" />
            Hidden ops
          </span>
          <h1 id="ops-title">Ops monitor</h1>
          <p>{statsState.message}</p>
          <div className="ops-command-strip" aria-label="Ops status">
            <span>{stats.windowLabel}</span>
            <span>{statsState.state}</span>
            <span>{analyticsConfig.hasDashboard ? "dashboard link" : "no embed"}</span>
          </div>
        </div>

        <aside className="ops-system-card" aria-label="Analytics configuration">
          <div className="ops-system-top">
            <span>
              <ShieldCheck size={17} aria-hidden="true" />
              Public-safe mode
            </span>
            <strong>{providerLabel()}</strong>
          </div>
          <StatusRow
            label="Tracking script"
            value={analyticsConfig.canLoadScript ? "Configured" : "Missing"}
            tone={analyticsConfig.canLoadScript ? "good" : "warn"}
          />
          <StatusRow
            label="Stats feed"
            value={analyticsConfig.hasPublicStats ? "Configured" : "Demo"}
            tone={analyticsConfig.hasPublicStats ? "good" : "warn"}
          />
          <StatusRow
            label="Dashboard embed"
            value={analyticsConfig.hasDashboard ? "Configured" : "Missing"}
            tone={analyticsConfig.hasDashboard ? "good" : "neutral"}
          />
        </aside>
      </section>

      <section className="ops-metric-grid" aria-label="Traffic pulse">
        <MetricCard
          icon={Users}
          label="Visitors"
          value={formatNumber(stats.visitors)}
          detail={stats.windowLabel}
        />
        <MetricCard
          icon={BarChart3}
          label="Pageviews"
          value={formatNumber(stats.pageviews)}
          detail={`${formatNumber(Math.max(stats.pageviews - stats.visitors, 0))} extra views`}
        />
        <MetricCard
          icon={Activity}
          label="Interaction signal"
          value={formatNumber(stats.events.reduce((sum, event) => sum + event.count, 0))}
          detail="tracked actions"
        />
        <MetricCard
          icon={Signal}
          label="Last update"
          value={formatDate(stats.updatedAt)}
          detail={statsState.state === "ready" ? "feed timestamp" : "demo timestamp"}
        />
      </section>

      <section className="ops-traffic-grid" aria-label="Traffic charts">
        <TrafficTrendChart traffic={stats.traffic} />
        <TrafficBars traffic={stats.traffic} />
      </section>

      <section className="ops-dashboard-grid" aria-label="Ops breakdown">
        <RankedList
          title="Route map"
          kind="route"
          items={stats.topPages.map((page) => ({ label: page.path, value: page.visitors }))}
        />
        <RankedList
          title="Acquisition"
          kind="source"
          items={stats.referrers.map((referrer) => ({
            label: referrer.source,
            value: referrer.visitors,
          }))}
        />
      </section>

      <section className="ops-interaction-grid" aria-label="Interaction signals">
        {interactionStats.map(({ label, value, icon: Icon }) => (
          <article className="ops-action-card" key={label}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
            <strong>{formatNumber(value)}</strong>
          </article>
        ))}
      </section>

      <section className="ops-bottom-grid" aria-label="System status">
        <section className="ops-panel">
          <div className="ops-section-heading">
            <span>
              <ServerCog size={18} aria-hidden="true" />
              System status
            </span>
          </div>
          <div className="ops-status-list">
            <StatusRow label="GitHub Pages base" value={basePath || "/"} tone="good" />
            <StatusRow
              label="X-Ray backend"
              value={xrayBackendUrl ? "Configured" : "Browser fallback"}
              tone={xrayBackendUrl ? "good" : "neutral"}
            />
            <StatusRow
              label="Build time"
              value={analyticsConfig.buildTime || "Unset"}
              tone={analyticsConfig.buildTime ? "good" : "neutral"}
            />
            <StatusRow
              label="Git SHA"
              value={analyticsConfig.gitSha || "Unset"}
              tone={analyticsConfig.gitSha ? "good" : "neutral"}
            />
            {analyticsConfig.warnings.map((warning) => (
              <StatusRow key={warning} label="Config warning" value={warning} tone="warn" />
            ))}
          </div>
        </section>

        <section className="ops-panel">
          <div className="ops-section-heading">
            <span>
              <GitBranch size={18} aria-hidden="true" />
              Event feed
            </span>
          </div>
          <div className="ops-event-list" role="list">
            {stats.events.length ? (
              stats.events.map((event) => (
                <article key={event.name} className="ops-event-row" role="listitem">
                  <span>{event.name}</span>
                  <strong>{formatNumber(event.count)}</strong>
                </article>
              ))
            ) : (
              <p className="ops-empty-line">No public event aggregates yet.</p>
            )}
          </div>
        </section>
      </section>

      {analyticsConfig.dashboardUrl ? (
        <section className="ops-embed-panel" aria-label="Analytics dashboard embed">
          <div className="ops-section-heading">
            <span>
              <ExternalLink size={18} aria-hidden="true" />
              Provider dashboard
            </span>
            <a href={analyticsConfig.dashboardUrl} target="_blank" rel="noreferrer">
              Open
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
          <iframe
            title="Analytics dashboard"
            src={analyticsConfig.dashboardUrl}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </section>
      ) : null}
    </main>
  );
}
