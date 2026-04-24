import { Copy, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type PromptForm = {
  goal: string;
  audience: string;
  constraints: string;
  tone: string;
  format: string;
};

type HistoryItem = {
  id: string;
  createdAt: string;
  title: string;
  prompt: string;
};

const storageKey = "tahion.promptCockpit.history";

const initialForm: PromptForm = {
  goal: "Design a fast local-first tool for turning messy ideas into buildable specs.",
  audience: "A solo founder and an AI coding agent",
  constraints: "No backend. Keep it testable, responsive, and deployable on static hosting.",
  tone: "Direct and pragmatic",
  format: "Implementation brief",
};

const tones = ["Direct and pragmatic", "Experimental", "Senior engineer", "Product strategist"];
const formats = ["Implementation brief", "Agent task", "UX exploration", "Launch checklist"];

function createId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clean(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

async function writeClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function buildPrompts(form: PromptForm) {
  const goal = clean(form.goal, "Clarify the project goal");
  const audience = clean(form.audience, "A technical collaborator");
  const constraints = clean(form.constraints, "Keep the solution simple, fast, and easy to verify");
  const tone = clean(form.tone, "Direct and pragmatic");
  const format = clean(form.format, "Implementation brief");

  return [
    {
      title: "Builder Brief",
      prompt: `Act as a senior product engineer. Create a ${format} for this goal: ${goal}

Audience: ${audience}
Tone: ${tone}
Constraints: ${constraints}

Include:
- the core user problem
- the smallest useful feature set
- implementation steps
- edge cases
- acceptance checks`,
    },
    {
      title: "Vibe-to-Spec",
      prompt: `Turn this rough vibe into a precise build spec.

Goal:
${goal}

Who it is for:
${audience}

Style:
${tone}

Non-negotiables:
${constraints}

Return the result as a ${format}. Keep it concrete enough that an AI coding agent can implement it without asking follow-up questions.`,
    },
    {
      title: "Critic Pass",
      prompt: `Review this idea before implementation:
${goal}

Audience: ${audience}
Constraints: ${constraints}

Use a ${tone} voice. Output a ${format} with:
- weak assumptions
- missing requirements
- likely failure modes
- what to build first
- how to know it works`,
    },
  ];
}

function readHistory(): HistoryItem[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function PromptCockpit() {
  const [form, setForm] = useState<PromptForm>(initialForm);
  const [history, setHistory] = useState<HistoryItem[]>(() => readHistory());
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [copied, setCopied] = useState(false);

  const variants = useMemo(() => buildPrompts(form), [form]);
  const activePrompt = variants[selectedVariant]?.prompt ?? variants[0].prompt;

  const checks = useMemo(
    () => [
      { label: "Goal is specific", done: form.goal.trim().length > 24 },
      { label: "Audience is named", done: form.audience.trim().length > 4 },
      { label: "Constraints exist", done: form.constraints.trim().length > 12 },
      { label: "Output format selected", done: form.format.trim().length > 0 },
      { label: "Tone is intentional", done: form.tone.trim().length > 0 },
    ],
    [form],
  );

  const updateField = (field: keyof PromptForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const savePrompt = () => {
    const item: HistoryItem = {
      id: createId(),
      createdAt: new Date().toISOString(),
      title: variants[selectedVariant].title,
      prompt: activePrompt,
    };

    const nextHistory = [item, ...history].slice(0, 6);
    setHistory(nextHistory);
    window.localStorage.setItem(storageKey, JSON.stringify(nextHistory));
  };

  const handleGenerate = (event: FormEvent) => {
    event.preventDefault();
    savePrompt();
  };

  const copyPrompt = async () => {
    try {
      await writeClipboard(activePrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setSelectedVariant(0);
  };

  const clearHistory = () => {
    setHistory([]);
    window.localStorage.removeItem(storageKey);
  };

  return (
    <section className="prompt-cockpit" aria-labelledby="prompt-cockpit-title">
      <div className="panel-heading">
        <span className="eyebrow">
          <Sparkles size={14} aria-hidden="true" />
          Local tool
        </span>
        <h2 id="prompt-cockpit-title">Prompt Cockpit</h2>
      </div>

      <form className="prompt-layout" onSubmit={handleGenerate}>
        <div className="prompt-controls">
          <label>
            <span>Goal</span>
            <textarea
              value={form.goal}
              onChange={(event) => updateField("goal", event.target.value)}
              rows={4}
            />
          </label>

          <label>
            <span>Audience</span>
            <input
              value={form.audience}
              onChange={(event) => updateField("audience", event.target.value)}
            />
          </label>

          <label>
            <span>Constraints</span>
            <textarea
              value={form.constraints}
              onChange={(event) => updateField("constraints", event.target.value)}
              rows={3}
            />
          </label>

          <div className="prompt-row">
            <label>
              <span>Tone</span>
              <select
                value={form.tone}
                onChange={(event) => updateField("tone", event.target.value)}
              >
                {tones.map((tone) => (
                  <option key={tone}>{tone}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Format</span>
              <select
                value={form.format}
                onChange={(event) => updateField("format", event.target.value)}
              >
                {formats.map((format) => (
                  <option key={format}>{format}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="prompt-output">
          <div className="variant-tabs" role="tablist" aria-label="Prompt variants">
            {variants.map((variant, index) => (
              <button
                key={variant.title}
                type="button"
                className={selectedVariant === index ? "is-active" : ""}
                onClick={() => setSelectedVariant(index)}
              >
                {variant.title}
              </button>
            ))}
          </div>

          <pre aria-live="polite">{activePrompt}</pre>

          <div className="quality-grid" aria-label="Prompt quality checklist">
            {checks.map((check) => (
              <span key={check.label} className={check.done ? "is-done" : ""}>
                {check.label}
              </span>
            ))}
          </div>

          <div className="tool-actions">
            <button type="submit">
              <Save size={16} aria-hidden="true" />
              Save variant
            </button>
            <button type="button" onClick={copyPrompt}>
              <Copy size={16} aria-hidden="true" />
              {copied ? "Copied" : "Copy"}
            </button>
            <button type="button" onClick={resetForm}>
              <RotateCcw size={16} aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>
      </form>

      <div className="history-strip">
        <div className="history-heading">
          <span>Local history</span>
          <button type="button" onClick={clearHistory} disabled={history.length === 0}>
            <Trash2 size={14} aria-hidden="true" />
            Clear
          </button>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <p>No saved prompts yet.</p>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => writeClipboard(item.prompt)}
                title="Copy saved prompt"
              >
                <span>{item.title}</span>
                <time dateTime={item.createdAt}>
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(item.createdAt))}
                </time>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
