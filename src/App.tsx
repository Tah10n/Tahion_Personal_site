import { ArrowUpRight, Github, Linkedin, Mail, Send, TerminalSquare, Zap } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isAnalyticsExcludedHash, trackPageviewForLocation } from "./analytics/pageviews";
import { installAnalyticsScript } from "./analytics/script";
import { trackEvent } from "./analytics/events";
import {
  BackdropTheme,
  BackdropVariant,
  BackdropShape,
  ShaderBackdrop,
} from "./components/ShaderBackdrop";
import { ShapeMenu } from "./components/ShapeMenu";
import { SoundtrackWidget } from "./components/SoundtrackWidget";
import { profile } from "./data/profile";
import { strudelSoundtrack } from "./data/strudelSoundtrack";
import { OpsDashboardPage } from "./pages/OpsDashboardPage";

const activeVisualMode: {
  id: BackdropVariant;
  theme: BackdropTheme;
  label: string;
  shortLabel: string;
} = {
  id: "signal",
  theme: "acid",
  label: "ASCII Torus",
  shortLabel: "Torus",
};

const visualModeStorageKey = "tahion.visual.mode";
const legacyVariantStorageKey = "tahion.backdrop.variant";
const shapeStorageKey = "tahion.backdrop.shape";

function readStoredShape(): BackdropShape {
  try {
    const value = window.localStorage.getItem(shapeStorageKey);
    if (value === "cube" || value === "pyramid" || value === "duck") return value;
    if (value === "mobius") return "duck";
  } catch {
    // The default remains usable when storage is blocked.
  }
  return "torus";
}

function writeStoredChoice(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Intentionally ignore storage writes when storage is unavailable.
  }
}

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (hash.startsWith("#/ops")) {
    return { route: "ops", hash } as const;
  }

  return { route: "home", hash } as const;
}

function App() {
  const visualMode = activeVisualMode.id;
  const [shape, setShape] = useState<BackdropShape>(readStoredShape);
  const { route, hash } = useHashRoute();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    writeStoredChoice(shapeStorageKey, shape);
  }, [shape]);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateOffset = () => {
      document.documentElement.style.setProperty(
        "--header-offset",
        `${header.getBoundingClientRect().bottom + 24}px`,
      );
    };
    const observer = new ResizeObserver(updateOffset);
    observer.observe(header);
    updateOffset();
    return () => observer.disconnect();
  }, [route]);

  useEffect(() => {
    writeStoredChoice(visualModeStorageKey, visualMode);
    writeStoredChoice(legacyVariantStorageKey, visualMode);
    document.documentElement.dataset.siteTheme = activeVisualMode.theme;
  }, [visualMode]);

  useEffect(() => {
    if (!isAnalyticsExcludedHash(hash)) {
      installAnalyticsScript();
    }
  }, [hash]);

  useEffect(() => {
    trackPageviewForLocation();
  }, [hash]);

  useEffect(() => {
    if (hash.startsWith("#/xray")) {
      window.location.replace("#work");
      return;
    }
    if (route !== "home" || !hash || hash.startsWith("#/")) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    const targetId = hash.slice(1);
    if (!targetId) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const targetElement = document.getElementById(targetId);
      if (!targetElement) {
        return;
      }

      if (targetId === "sound") {
        return;
      }

      targetElement.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [hash, route]);

  if (route === "ops") {
    return (
      <>
        <ShaderBackdrop variant={visualMode} theme={activeVisualMode.theme} shape={shape} />
        <header className="topbar" ref={headerRef}>
          <a className="brand" href="#/" aria-label="Andrei Surkov home">
            <TerminalSquare size={22} aria-hidden="true" />
            <span>{profile.handle}</span>
          </a>
          <div className="topbar-actions">
            <nav className="ops-nav" aria-label="Ops navigation">
              <a href="#/">Home</a>
              <a href="#work">Work</a>
            </nav>
            <ShapeMenu value={shape} onChange={setShape} />
          </div>
        </header>
        <OpsDashboardPage />
      </>
    );
  }

  return (
    <main>
      <ShaderBackdrop variant={visualMode} theme={activeVisualMode.theme} shape={shape} />
      <header className="topbar" ref={headerRef}>
        <a className="brand" href="#hero-title" aria-label="Andrei Surkov home">
          <TerminalSquare size={22} aria-hidden="true" />
          <span>{profile.handle}</span>
        </a>
        <div className="topbar-actions">
          <nav aria-label="Primary navigation">
            <a href="#work">Work</a>
            <a href="#contact">Contact</a>
          </nav>
          <ShapeMenu value={shape} onChange={setShape} />
          <SoundtrackWidget soundtrack={strudelSoundtrack} />
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <div className="hero-grid">
            <section className="identity-panel" aria-label="Portfolio introduction">
              <span className="eyebrow">
                <Zap size={15} aria-hidden="true" />
                AI application developer
              </span>
              <h1 id="hero-title">
                {profile.name.split(" ").map((namePart) => (
                  <span key={namePart}>{namePart}</span>
                ))}
              </h1>
              {profile.headline ? <p className="headline">{profile.headline}</p> : null}
              {profile.bio ? <p className="bio">{profile.bio}</p> : null}

              <div className="hero-actions">
                <a href="#work" className="primary-action">
                  View projects
                  <ArrowUpRight size={17} aria-hidden="true" />
                </a>
                <a
                  href="#contact"
                  className="secondary-action"
                  onClick={() =>
                    trackEvent("contact_click", {
                      target: "contact_section",
                      placement: "hero",
                    })
                  }
                >
                  Contact
                  <Mail size={17} aria-hidden="true" />
                </a>
              </div>
            </section>
          </div>
        </div>
      </section>

      <div className="portfolio-content">
        <section className="content-band" id="work" aria-labelledby="work-title">
          <div className="section-heading">
            <span className="eyebrow" id="work-title">
              Projects
            </span>
          </div>

          <div className="project-grid">
            {profile.projects.map((project) => {
              const projectHref = project.href;

              return (
                <article className="project-card" key={project.title}>
                  <div>
                    <span>{project.signal}</span>
                    <h3>
                      {projectHref ? (
                        <a
                          href={projectHref}
                          target={projectHref.startsWith("http") ? "_blank" : undefined}
                          rel={projectHref.startsWith("http") ? "noreferrer" : undefined}
                          onClick={() =>
                            trackEvent("project_link_click", {
                              project: project.title,
                              destination: projectHref.startsWith("#") ? "internal" : "external",
                            })
                          }
                        >
                          {project.title}
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </a>
                      ) : (
                        project.title
                      )}
                    </h3>
                  </div>
                  <p>{project.description}</p>
                  <p className="project-impact">{project.impact}</p>
                  <details className="project-details">
                    <summary>Technical details</summary>
                    <ul className="project-highlights">
                      {project.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </details>
                  <div className="project-meta">
                    <span>{project.type}</span>
                  </div>
                  <ul className="stack-list">
                    {project.stack.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className="contact-band" id="contact" aria-labelledby="contact-title">
          <div>
            <span className="eyebrow">{profile.contactCta.eyebrow}</span>
            <h2 id="contact-title">{profile.contactCta.title}</h2>
            <p>{profile.contactCta.body}</p>
          </div>
          <div className="contact-actions">
            {profile.contactCta.email ? (
              <a
                href={`mailto:${profile.contactCta.email}`}
                onClick={() =>
                  trackEvent("contact_click", {
                    target: "email",
                    placement: "footer",
                  })
                }
              >
                <Send size={17} aria-hidden="true" />
                {profile.contactCta.email}
              </a>
            ) : null}
            {profile.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackEvent("contact_click", {
                    target: link.label.toLowerCase(),
                    placement: "footer",
                  })
                }
              >
                {link.label === "GitHub" ? <Github size={17} aria-hidden="true" /> : null}
                {link.label === "LinkedIn" ? <Linkedin size={17} aria-hidden="true" /> : null}
                {link.label === "Telegram" ? <Send size={17} aria-hidden="true" /> : null}
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
