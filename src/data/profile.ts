export type Project = {
  title: string;
  type: string;
  description: string;
  href?: string;
  highlights: string[];
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
    email?: string;
  };
};

export const profile: Profile = {
  name: "Andrei Surkov",
  handle: "Tahion / @Tah10n",
  headline:
    "Java software engineer building AI-native products, on-device LLM apps, and coding-agent workflows.",
  bio: "Freelance engineer focused on scalable intelligent apps: from local-first mobile AI to operator tools that connect coding agents, Telegram, and real project workflows.",
  location: "Serbia / remote",
  availability: "Open to AI tooling, on-device LLM apps, agent workflows, and product prototypes",
  links: [
    { label: "GitHub", href: "https://github.com/Tah10n" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/andreysurkov/" },
    { label: "Pocket AI", href: "https://github.com/Tah10n/pocket-ai" },
  ],
  skills: [
    {
      label: "On-device AI products",
      description:
        "Mobile model discovery, GGUF downloads, local inference, memory-aware loading, and private chat UX.",
    },
    {
      label: "Agent workflow automation",
      description:
        "Telegram-first control layers, permission prompts, session routing, observability, and restart-safe state.",
    },
    {
      label: "Full-stack delivery",
      description:
        "Java engineering background plus TypeScript, React Native, Node.js, API wiring, and product-grade docs.",
    },
    {
      label: "Local-first interfaces",
      description:
        "Static apps, browser tools, storage-safe UX, compact controls, and fast feedback loops.",
    },
  ],
  projects: [
    {
      title: "Pocket AI",
      type: "Offline-first mobile AI",
      description:
        "A mobile app for discovering, downloading, and chatting with GGUF models directly on device.",
      href: "https://github.com/Tah10n/pocket-ai",
      highlights: [
        "Runs downloaded models locally with no network needed for conversations.",
        "Catalog, gated-model states, RAM-aware loading, and encrypted on-device history.",
        "Expo + React Native product with release docs, tests, and English/Russian localization.",
      ],
      stack: ["Expo", "React Native", "TypeScript", "llama.rn", "MMKV"],
      status: "Public app / v1.3.3",
      signal: "On-device AI",
    },
    {
      title: "opencode Telegram Connector",
      type: "Coding-agent operations",
      description:
        "A Node.js connector that lets Telegram chats drive opencode sessions across projects.",
      href: "https://github.com/Tah10n/opencode-telegram-connector",
      highlights: [
        "Per-thread bindings keep multiple project/session contexts active in parallel.",
        "Inline Telegram buttons handle permission prompts and operator questions.",
        "Fail-closed persisted state, redacted logs, feed modes, and runtime controls.",
      ],
      stack: ["Node.js", "ESM", "Telegram Bot API", "opencode"],
      status: "Public / MIT",
      signal: "Agent ops",
    },
  ],
  contactCta: {
    eyebrow: "Build signal",
    title: "Need an AI tool that has to work outside the demo?",
    body: "Bring the rough version: users, constraints, runtime environment, and what would make it valuable this week. I can turn that into a working product path.",
  },
};
