import {
  ArrowUpRight,
  BrainCircuit,
  Code2,
  Cpu,
  Gauge,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  TerminalSquare,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BackdropTheme, BackdropVariant, ShaderBackdrop } from "./components/ShaderBackdrop";
import { profile } from "./data/profile";
import { ProjectXRayPage } from "./pages/ProjectXRayPage";

const iconMap = [BrainCircuit, Code2, Gauge, Cpu];

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

  return hash.startsWith("#/xray") ? "xray" : "home";
}

function App() {
  const visualMode = activeVisualMode.id;
  const route = useHashRoute();
  const primaryContactHref = profile.contactCta.email
    ? `mailto:${profile.contactCta.email}`
    : (profile.links.find((link) => link.label === "LinkedIn")?.href ?? "#contact");

  useEffect(() => {
    writeStoredChoice(visualModeStorageKey, visualMode);
    writeStoredChoice(legacyVariantStorageKey, visualMode);
    document.documentElement.dataset.siteTheme = activeVisualMode.theme;
  }, [visualMode]);

  if (route === "xray") {
    return (
      <>
        <ShaderBackdrop variant={visualMode} theme={activeVisualMode.theme} />
        <header className="topbar">
          <a className="brand" href="#/" aria-label="Andrei Surkov home">
            <TerminalSquare size={22} aria-hidden="true" />
            <span>{profile.handle}</span>
          </a>
          <div className="topbar-actions">
            <nav aria-label="Primary navigation">
              <a href="#work">Work</a>
              <a href="#/xray">X-Ray</a>
              <a href="#contact">Contact</a>
            </nav>
          </div>
        </header>
        <ProjectXRayPage />
      </>
    );
  }

  return (
    <main>
      <ShaderBackdrop variant={visualMode} theme={activeVisualMode.theme} />
      <header className="topbar">
        <a className="brand" href="#hero-title" aria-label="Andrei Surkov home">
          <TerminalSquare size={22} aria-hidden="true" />
          <span>{profile.handle}</span>
        </a>
        <div className="topbar-actions">
          <nav aria-label="Primary navigation">
            <a href="#work">Work</a>
            <a href="#/xray">X-Ray</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <div className="cockpit-grid">
            <section className="identity-panel" aria-label="Portfolio introduction">
              <span className="eyebrow">
                <Zap size={15} aria-hidden="true" />
                AI-native product builder
              </span>
              <h1 id="hero-title">
                {profile.name.split(" ").map((namePart) => (
                  <span key={namePart}>{namePart}</span>
                ))}
              </h1>
              <p className="headline">{profile.headline}</p>
              <p className="bio">{profile.bio}</p>

              <div className="signal-row">
                <span className="signal-pill">
                  <MapPin size={15} aria-hidden="true" />
                  <span className="signal-text">{profile.location}</span>
                </span>
                <span className="signal-pill">
                  <span className="signal-text">{profile.availability}</span>
                </span>
              </div>

              <div className="hero-actions">
                <a href="#work" className="primary-action">
                  View work
                  <ArrowUpRight size={17} aria-hidden="true" />
                </a>
                <a href="#/xray" className="secondary-action">
                  Project X-Ray
                  <ShieldCheck size={17} aria-hidden="true" />
                </a>
                <a
                  href={primaryContactHref}
                  className="secondary-action"
                  target={primaryContactHref.startsWith("http") ? "_blank" : undefined}
                  rel={primaryContactHref.startsWith("http") ? "noreferrer" : undefined}
                >
                  Contact
                  <Mail size={17} aria-hidden="true" />
                </a>
              </div>
            </section>

            <aside className="telemetry-panel" aria-label="Live build telemetry">
              <div className="telemetry-top">
                <span>System signal</span>
                <strong>Fast static</strong>
              </div>
              <div className="telemetry-meter" aria-hidden="true">
                <span />
              </div>
              <dl>
                <div>
                  <dt>Runtime</dt>
                  <dd>React + Vite</dd>
                </div>
                <div>
                  <dt>Data</dt>
                  <dd>Local-first</dd>
                </div>
                <div>
                  <dt>Network</dt>
                  <dd>Zero AI calls</dd>
                </div>
                <div>
                  <dt>Backdrop</dt>
                  <dd>{activeVisualMode.shortLabel}</dd>
                </div>
                <div>
                  <dt>Visual style</dt>
                  <dd>{activeVisualMode.label}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <section className="content-band" id="work" aria-labelledby="work-title">
        <div className="section-heading">
          <span className="eyebrow">Public proof</span>
          <h2 id="work-title">Shipped systems, not pitch copy</h2>
        </div>

        <div className="project-grid">
          {profile.projects.map((project) => (
            <article className="project-card" key={project.title}>
              <div>
                <span>{project.signal}</span>
                <h3>
                  {project.href ? (
                    <a href={project.href} target="_blank" rel="noreferrer">
                      {project.title}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  ) : (
                    project.title
                  )}
                </h3>
              </div>
              <p>{project.description}</p>
              <ul className="project-highlights">
                {project.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="project-meta">
                <span>{project.type}</span>
                <span>{project.status}</span>
              </div>
              <ul className="stack-list">
                {project.stack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="content-band skills-band" aria-labelledby="skills-title">
        <div className="section-heading">
          <span className="eyebrow">Operating range</span>
          <h2 id="skills-title">What the work says</h2>
        </div>

        <div className="skill-grid">
          {profile.skills.map((skill, index) => {
            const Icon = iconMap[index % iconMap.length];

            return (
              <article className="skill-item" key={skill.label}>
                <Icon size={22} aria-hidden="true" />
                <h3>{skill.label}</h3>
                <p>{skill.description}</p>
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
            <a href={`mailto:${profile.contactCta.email}`}>
              <Send size={17} aria-hidden="true" />
              {profile.contactCta.email}
            </a>
          ) : null}
          {profile.links.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.label === "GitHub" ? <Github size={17} aria-hidden="true" /> : null}
              {link.label === "LinkedIn" ? <Linkedin size={17} aria-hidden="true" /> : null}
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
