export type Project = {
  title: string;
  type: string;
  description: string;
  stack: string[];
  status: string;
  signal: string;
};

export type Profile = {
  name: string;
  handle: string;
  headline: string;
  bio: string;
  location: string;
  availability: string;
  links: {
    label: string;
    href: string;
  }[];
  skills: {
    label: string;
    description: string;
  }[];
  projects: Project[];
  contactCta: {
    eyebrow: string;
    title: string;
    body: string;
    email: string;
  };
};

export const profile: Profile = {
  name: "Tahion",
  handle: "@tahion",
  headline:
    "Vibecoder building sharp AI-native tools, fast interfaces, and strange useful systems.",
  bio: "I turn fuzzy ideas into working prototypes, then tighten them into interfaces people can actually use. This site is a living cockpit for projects, experiments, and prompt craft.",
  location: "Budapest / remote",
  availability: "Open to AI tooling, product prototypes, and frontend systems",
  links: [
    { label: "GitHub", href: "https://github.com/" },
    { label: "Telegram", href: "https://t.me/" },
    { label: "Email", href: "mailto:hello@example.com" },
  ],
  skills: [
    {
      label: "AI workflow design",
      description:
        "Prompt systems, agent loops, evaluation checklists, and human-in-the-loop tools.",
    },
    {
      label: "Rapid product prototyping",
      description:
        "Vite, React, TypeScript, API wiring, local-first state, and polished MVP surfaces.",
    },
    {
      label: "Interface taste",
      description:
        "Dense but legible UI, interaction details, responsive layouts, and fast feedback loops.",
    },
    {
      label: "Automation glue",
      description:
        "Scripts, bots, data transforms, and practical utilities that remove repetitive work.",
    },
  ],
  projects: [
    {
      title: "Prompt Cockpit",
      type: "Local AI utility",
      description: "A browser-only workspace for shaping prompts into clear, testable requests.",
      stack: ["React", "TypeScript", "localStorage"],
      status: "Live in this site",
      signal: "Useful now",
    },
    {
      title: "Agent Brief Builder",
      type: "Experiment",
      description:
        "A structured way to turn product intent into implementation-ready instructions.",
      stack: ["UX systems", "Prompt design"],
      status: "Prototype",
      signal: "AI-native",
    },
    {
      title: "Fast Tool Shelf",
      type: "Utility collection",
      description: "Small local tools for text, JSON, color, and launch planning workflows.",
      stack: ["Browser APIs", "Vanilla logic"],
      status: "Planned",
      signal: "Expandable",
    },
  ],
  contactCta: {
    eyebrow: "Build signal",
    title: "Have a product idea that needs a working shape?",
    body: "Send the rough version: goal, users, constraints, and what would make it useful this week.",
    email: "hello@example.com",
  },
};
