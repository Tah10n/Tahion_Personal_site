import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Braces,
  CheckCircle2,
  Eye,
  ExternalLink,
  FileCode2,
  GitBranch,
  Github,
  Loader2,
  Radar,
  Search,
  ServerCog,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import { trackEvent } from "../analytics/events";
import { buildStaticXrayReport } from "../xray/analyzers/staticXrayAnalyzer";
import { demoXrayReport } from "../xray/demoReport";
import { parseGithubRepoUrl } from "../xray/githubUrl";
import { inspectProjectWithFallback } from "../xray/inspectProject";
import { BackendXrayProvider } from "../xray/providers/backendXrayProvider";
import { GithubBrowserProvider } from "../xray/providers/githubBrowserProvider";
import { RepoSnapshot, XRayReport } from "../xray/types";

type XRayStatus =
  | { state: "idle" }
  | { state: "loading"; message: string }
  | { state: "ready"; report: XRayReport; notice?: string }
  | { state: "error"; message: string };

const browserProvider = new GithubBrowserProvider();
const configuredBackendUrl = import.meta.env.VITE_XRAY_BACKEND_URL?.trim() ?? "";
const backendProvider = configuredBackendUrl ? new BackendXrayProvider(configuredBackendUrl) : null;

const exampleRepos = [
  "https://github.com/Tah10n/pocket-ai",
  "https://github.com/Tah10n/opencode-telegram-connector",
];

const sectionIcons = {
  architecture: Boxes,
  reliability: ShieldCheck,
  devex: Braces,
  deployment: ServerCog,
};

function isSnapshot(value: RepoSnapshot | XRayReport): value is RepoSnapshot {
  return "provider" in value;
}

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
    year: "numeric",
  }).format(new Date(value));
}

function strengthLabel(strength: string) {
  if (strength === "strong") return "Strong";
  if (strength === "medium") return "Medium";
  if (strength === "weak") return "Weak";
  return "Unknown";
}

function modeLabel(mode: XRayReport["mode"]) {
  return mode === "backend-ai" ? "Backend AI scan" : "Browser static scan";
}

function ProjectStackMap({ report }: { report: XRayReport }) {
  const stackSignals = report.stack.slice(0, 8);
  const primaryLanguages = report.telemetry.languages.slice(0, 4);

  return (
    <div className="xray-stack-map">
      <div className="xray-stack-core">
        <span className="xray-stack-core-label">Repository core</span>
        <strong>{report.repo.name}</strong>
        <p>{report.thesis}</p>
        <div className="xray-stack-core-meta">
          <span>{report.telemetry.filesScanned} files</span>
          <span>{report.telemetry.manifests} manifests</span>
          <span>{report.telemetry.workflows} workflows</span>
        </div>
        {primaryLanguages.length ? (
          <div className="xray-language-strip" aria-label="Primary languages">
            {primaryLanguages.map((language) => (
              <span key={language}>{language}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="xray-stack-flow" role="list" aria-label="Detected stack signals">
        {stackSignals.length ? (
          stackSignals.map((signal, index) => (
            <article
              key={`${signal.label}-${signal.detail}`}
              className={`xray-stack-node xray-stack-node-${signal.strength}`}
              role="listitem"
            >
              <div className="xray-stack-marker" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="xray-stack-node-body">
                <div className="xray-stack-node-top">
                  <h3>{signal.label}</h3>
                  <span className={`xray-strength xray-strength-${signal.strength}`}>
                    {strengthLabel(signal.strength)}
                  </span>
                </div>
                <p>{signal.detail}</p>
                {signal.evidence[0] ? (
                  <a href={signal.evidence[0].href} target="_blank" rel="noreferrer">
                    <FileCode2 size={14} aria-hidden="true" />
                    {signal.evidence[0].label}
                  </a>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className="xray-stack-empty">
            <p>No stack signals were strong enough to show.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectXRayReport({ report, notice }: { report: XRayReport; notice?: string }) {
  const sections = [
    { id: "architecture", section: report.architecture },
    { id: "reliability", section: report.reliability },
    { id: "devex", section: report.devex },
    { id: "deployment", section: report.deployment },
  ] as const;

  return (
    <section className="xray-report" aria-label="Project X-Ray report">
      <div className="xray-report-hero">
        <div>
          <span className="eyebrow">
            <Radar size={15} aria-hidden="true" />
            {modeLabel(report.mode)}
          </span>
          <h2>{report.repo.name}</h2>
          <p>{report.thesis}</p>
        </div>
        <a href={report.repo.htmlUrl} target="_blank" rel="noreferrer" className="xray-repo-link">
          <Github size={17} aria-hidden="true" />
          {report.repo.fullName}
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </div>

      {notice ? (
        <div className="xray-notice" role="status">
          <AlertTriangle size={18} aria-hidden="true" />
          <p>{notice}</p>
        </div>
      ) : null}

      <div className="xray-telemetry-grid" aria-label="Repository scan telemetry">
        <div>
          <span>Files scanned</span>
          <strong>{formatNumber(report.telemetry.filesScanned)}</strong>
        </div>
        <div>
          <span>Fetched evidence</span>
          <strong>{report.telemetry.fetchedFiles}</strong>
        </div>
        <div>
          <span>Workflows</span>
          <strong>{report.telemetry.workflows}</strong>
        </div>
        <div>
          <span>Last push</span>
          <strong>{formatDate(report.repo.pushedAt)}</strong>
        </div>
      </div>

      <div className="xray-stack-band">
        <div className="xray-section-heading">
          <span>Stack map</span>
          <small>{report.mode}</small>
        </div>
        <ProjectStackMap report={report} />
      </div>

      <div className="xray-section-grid">
        {sections.map(({ id, section }) => {
          const Icon = sectionIcons[id];

          return (
            <section className="xray-section-card" key={section.title}>
              <div className="xray-section-heading">
                <span>
                  <Icon size={18} aria-hidden="true" />
                  {section.title}
                </span>
              </div>
              <p>{section.summary}</p>
              <div className="xray-finding-list">
                {section.findings.map((finding) => (
                  <article key={`${section.title}-${finding.title}`}>
                    <span className={`xray-strength xray-strength-${finding.strength}`}>
                      {strengthLabel(finding.strength)}
                    </span>
                    <h3>{finding.title}</h3>
                    <p>{finding.detail}</p>
                    {finding.evidence.length ? (
                      <div className="xray-evidence-row">
                        {finding.evidence.slice(0, 3).map((item) => (
                          <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
                            <FileCode2 size={14} aria-hidden="true" />
                            {item.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="xray-bottom-grid">
        <section className="xray-evidence-panel">
          <div className="xray-section-heading">
            <span>
              <GitBranch size={18} aria-hidden="true" />
              Evidence links
            </span>
          </div>
          <ul>
            {report.evidence.map((item) => (
              <li key={item.href}>
                <a href={item.href} target="_blank" rel="noreferrer">
                  <span>{item.label}</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="xray-unknowns-panel">
          <div className="xray-section-heading">
            <span>
              <AlertTriangle size={18} aria-hidden="true" />
              Unknowns
            </span>
          </div>
          <ul>
            {report.unknowns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

export function ProjectXRayPage() {
  const [input, setInput] = useState(exampleRepos[0]);
  const [status, setStatus] = useState<XRayStatus>({ state: "idle" });
  const requestIdRef = useRef(0);
  const canSubmit = useMemo(
    () => input.trim().length > 0 && status.state !== "loading",
    [input, status.state],
  );

  const runAnalysis = async (nextInput = input) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setStatus({
      state: "loading",
      message: backendProvider
        ? "Requesting backend X-Ray from Repo Analyzer Service. Browser fallback remains available."
        : "Reading GitHub metadata and tree, then fetching selected evidence through raw files...",
    });

    try {
      const repoInput = parseGithubRepoUrl(nextInput);
      trackEvent("xray_run", {
        mode: backendProvider ? "backend-ai" : "browser-static",
      });
      const { result, notice } = await inspectProjectWithFallback(
        repoInput,
        backendProvider,
        browserProvider,
      );

      if (requestIdRef.current !== requestId) {
        return;
      }

      const report = isSnapshot(result) ? buildStaticXrayReport(result) : result;
      setStatus({ state: "ready", report, notice });
    } catch (error) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Project X-Ray failed.",
      });
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void runAnalysis();
  };

  const applyExample = (repoUrl: string) => {
    setInput(repoUrl);
    void runAnalysis(repoUrl);
  };

  const loadDemoReport = () => {
    requestIdRef.current += 1;
    trackEvent("xray_demo_open", {
      mode: backendProvider ? "backend-ai" : "browser-static",
    });
    setStatus({ state: "ready", report: demoXrayReport });
  };

  return (
    <main className="xray-page">
      <section className="xray-hero" aria-labelledby="xray-title">
        <div className="xray-hero-copy">
          <span className="eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            Project X-Ray
          </span>
          <h1 id="xray-title">Paste a GitHub repo. Get an engineering read.</h1>
          <p>
            {backendProvider
              ? "Backend mode asks Repo Analyzer Service for the report, then falls back to the public browser scan if the service is unreachable. It is built as a product-builder proof: useful output first, safe fallbacks always."
              : "Static browser mode scans public GitHub metadata, tree shape, README, manifests, workflows, and docs to assemble an evidence-linked project breakdown without exposing private tokens or AI keys."}
          </p>
        </div>

        <form className="xray-console" onSubmit={handleSubmit}>
          <label htmlFor="xray-repo-url">GitHub repository URL</label>
          <div className="xray-input-row">
            <input
              id="xray-repo-url"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="https://github.com/owner/repo"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className={status.state === "loading" ? "is-loading" : undefined}
            >
              {status.state === "loading" ? (
                <Loader2 size={17} aria-hidden="true" />
              ) : (
                <Search size={17} aria-hidden="true" />
              )}
              Run X-Ray
            </button>
          </div>
          <div className="xray-example-row" aria-label="Example repositories">
            {exampleRepos.map((repoUrl) => (
              <button key={repoUrl} type="button" onClick={() => applyExample(repoUrl)}>
                {repoUrl.replace("https://github.com/", "")}
              </button>
            ))}
            <button type="button" className="xray-demo-button" onClick={loadDemoReport}>
              <Eye size={14} aria-hidden="true" />
              Demo report
            </button>
          </div>
        </form>
      </section>

      {status.state === "idle" ? (
        <section className="xray-empty-state">
          <CheckCircle2 size={22} aria-hidden="true" />
          <div>
            <h2>
              {backendProvider
                ? "Backend configured, browser fallback preserved."
                : "Browser-only first, backend-ready later."}
            </h2>
            <p>
              {backendProvider
                ? "The configured backend can use server-side tokens and AI keys without exposing them to the frontend."
                : "No tokens, no AI key, no private data. The first version reads public repository evidence and keeps the same output shape that a stronger backend can return later."}
            </p>
          </div>
        </section>
      ) : null}

      {status.state === "loading" ? (
        <section className="xray-empty-state xray-loading-state">
          <Loader2 size={24} aria-hidden="true" />
          <div>
            <h2>Scanning repository</h2>
            <p>{status.message}</p>
          </div>
        </section>
      ) : null}

      {status.state === "error" ? (
        <section className="xray-empty-state xray-error-state" role="alert">
          <AlertTriangle size={24} aria-hidden="true" />
          <div>
            <h2>Scan failed</h2>
            <p>{status.message}</p>
            <div className="xray-error-actions">
              <button type="button" onClick={loadDemoReport}>
                <Eye size={15} aria-hidden="true" />
                View demo report
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {status.state === "ready" ? (
        <ProjectXRayReport report={status.report} notice={status.notice} />
      ) : null}
    </main>
  );
}
