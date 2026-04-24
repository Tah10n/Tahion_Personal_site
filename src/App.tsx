import {
  ArrowUpRight,
  BrainCircuit,
  Code2,
  Cpu,
  Gauge,
  Github,
  Layers3,
  Mail,
  MapPin,
  Palette,
  Send,
  TerminalSquare,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PromptCockpit } from "./components/PromptCockpit";
import { BackdropTheme, BackdropVariant, ShaderBackdrop } from "./components/ShaderBackdrop";
import { profile } from "./data/profile";

const iconMap = [BrainCircuit, Code2, Gauge, Cpu];

const backdropVariants: { id: BackdropVariant; label: string }[] = [
  { id: "signal", label: "Signal" },
  { id: "topography", label: "Topo" },
  { id: "radar", label: "Radar" },
];

const backdropThemes: { id: BackdropTheme; label: string }[] = [
  { id: "acid", label: "Acid" },
  { id: "plasma", label: "Plasma" },
  { id: "ice", label: "Ice" },
];

const variantStorageKey = "tahion.backdrop.variant";
const themeStorageKey = "tahion.backdrop.theme";

function readStoredChoice<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const stored = window.localStorage.getItem(key);
  return allowed.includes(stored as T) ? (stored as T) : fallback;
}

function App() {
  const [backdropVariant, setBackdropVariant] = useState<BackdropVariant>(() =>
    readStoredChoice(
      variantStorageKey,
      "signal",
      backdropVariants.map((item) => item.id),
    ),
  );
  const [backdropTheme, setBackdropTheme] = useState<BackdropTheme>(() =>
    readStoredChoice(
      themeStorageKey,
      "acid",
      backdropThemes.map((item) => item.id),
    ),
  );

  useEffect(() => {
    window.localStorage.setItem(variantStorageKey, backdropVariant);
  }, [backdropVariant]);

  useEffect(() => {
    window.localStorage.setItem(themeStorageKey, backdropTheme);
    document.documentElement.dataset.siteTheme = backdropTheme;
  }, [backdropTheme]);

  const activeVariantLabel =
    backdropVariants.find((item) => item.id === backdropVariant)?.label ?? "Signal";
  const activeThemeLabel =
    backdropThemes.find((item) => item.id === backdropTheme)?.label ?? "Acid";

  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <ShaderBackdrop variant={backdropVariant} theme={backdropTheme} />
        <div className="hero-content">
          <header className="topbar">
            <a className="brand" href="#hero-title" aria-label="Tahion home">
              <TerminalSquare size={22} aria-hidden="true" />
              <span>{profile.handle}</span>
            </a>
            <div className="topbar-actions">
              <nav aria-label="Primary navigation">
                <a href="#work">Work</a>
                <a href="#tools">Tools</a>
                <a href="#contact">Contact</a>
              </nav>

              <div className="visual-controls" aria-label="Visual controls">
                <div className="segmented-control" aria-label="Background variant">
                  <span>
                    <Layers3 size={14} aria-hidden="true" />
                  </span>
                  {backdropVariants.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={backdropVariant === item.id ? "is-active" : ""}
                      onClick={() => setBackdropVariant(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="segmented-control theme-control" aria-label="Color theme">
                  <span>
                    <Palette size={14} aria-hidden="true" />
                  </span>
                  {backdropThemes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={backdropTheme === item.id ? "is-active" : ""}
                      onClick={() => setBackdropTheme(item.id)}
                    >
                      <i aria-hidden="true" data-swatch={item.id} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <div className="cockpit-grid">
            <section className="identity-panel" aria-label="Portfolio introduction">
              <span className="eyebrow">
                <Zap size={15} aria-hidden="true" />
                AI-native product builder
              </span>
              <h1 id="hero-title">{profile.name}</h1>
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
                <a href="#tools" className="primary-action">
                  Open cockpit
                  <ArrowUpRight size={17} aria-hidden="true" />
                </a>
                <a href={`mailto:${profile.contactCta.email}`} className="secondary-action">
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
                  <dd>{activeVariantLabel}</dd>
                </div>
                <div>
                  <dt>Theme</dt>
                  <dd>{activeThemeLabel}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <section className="content-band" id="work" aria-labelledby="work-title">
        <div className="section-heading">
          <span className="eyebrow">Portfolio surface</span>
          <h2 id="work-title">Selected work signals</h2>
        </div>

        <div className="project-grid">
          {profile.projects.map((project) => (
            <article className="project-card" key={project.title}>
              <div>
                <span>{project.signal}</span>
                <h3>{project.title}</h3>
              </div>
              <p>{project.description}</p>
              <div className="project-meta">
                <span>{project.type}</span>
                <span>{project.status}</span>
              </div>
              <ul>
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
          <h2 id="skills-title">Where the site points</h2>
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

      <section className="tool-band" id="tools" aria-labelledby="tools-title">
        <div className="section-heading">
          <span className="eyebrow">Useful surface</span>
          <h2 id="tools-title">AI vibe tool, running locally</h2>
        </div>
        <PromptCockpit />
      </section>

      <section className="contact-band" id="contact" aria-labelledby="contact-title">
        <div>
          <span className="eyebrow">{profile.contactCta.eyebrow}</span>
          <h2 id="contact-title">{profile.contactCta.title}</h2>
          <p>{profile.contactCta.body}</p>
        </div>
        <div className="contact-actions">
          <a href={`mailto:${profile.contactCta.email}`}>
            <Send size={17} aria-hidden="true" />
            {profile.contactCta.email}
          </a>
          {profile.links.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.label === "GitHub" ? <Github size={17} aria-hidden="true" /> : null}
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
