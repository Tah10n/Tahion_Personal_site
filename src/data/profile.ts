export type Project = {
  title: string;
  type: string;
  description: string;
  href?: string;
  impact: string;
  highlights: string[];
  stack: string[];
  signal: string;
};

export type Profile = {
  name: string;
  handle: string;
  headline?: string;
  bio?: string;
  links: {
    label: string;
    href: string;
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
  links: [
    { label: "GitHub", href: "https://github.com/Tah10n" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/andreysurkov/" },
    { label: "Telegram", href: "https://t.me/moryak37" },
  ],
  projects: [
    {
      title: "Pocket AI",
      type: "Mobile app",
      description: "Download GGUF models and chat with them on your phone.",
      href: "https://github.com/Tah10n/pocket-ai",
      impact: "Models run locally. Chats work offline and stay on the device.",
      highlights: [
        "Model catalog with downloads and access checks.",
        "Memory-aware model loading and encrypted chat history.",
        "Expo and React Native, with tests and English/Russian UI.",
      ],
      stack: ["Expo", "React Native", "TypeScript", "llama.rn", "MMKV"],
      signal: "On-device AI",
    },
    {
      title: "AI Telegram Bot",
      type: "Telegram bot",
      href: "https://t.me/AI_LLM_chatGPT_bot",
      description: "AI chat, image generation, and file handling in Telegram.",
      impact: "Model selection, paid credits, and admin tools.",
      highlights: [
        "Multiple AI providers, image editing, and multilingual UI.",
        "Telegram Stars payments, monthly credits, referrals, and per-model pricing.",
        "Quarkus backend with MongoDB, Redis, monitoring, and tests.",
      ],
      stack: ["Java", "Quarkus", "Telegram Bot API", "MongoDB", "Redis"],
      signal: "Telegram AI",
    },
    {
      title: "Vibe Racing",
      type: "Web app and local connector",
      description: "A weekly leaderboard for self-reported coding-agent token usage.",
      href: "https://github.com/Tah10n/viberacing",
      impact:
        "Track usage across agents, accounts, and computers without uploading prompts or code.",
      highlights: [
        "Local collectors for Codex, Claude Code, OpenCode, and other coding agents.",
        "Usage sync sends dates and aggregate token counts, with manual and event-triggered updates.",
        "Next.js app, PostgreSQL database, and a local Node.js connector.",
      ],
      stack: ["Next.js", "React", "TypeScript", "PostgreSQL", "Node.js"],
      signal: "Agent token usage",
    },
    {
      title: "Git Analyzer",
      type: "Repository visualization",
      description: "Explore GitHub repository history through interactive 2D and 3D commit graphs.",
      href: "https://github.com/Tah10n/git_analyser",
      impact: "Follow branches and merges, inspect file trees, and play back commit history.",
      highlights: [
        "Commit timeline with file changes, path search, and branch navigation.",
        "Adjustable playback speed and WebM commit-summary export.",
        "Browser-based demo, cached history, and an optional local Git analyzer.",
      ],
      stack: ["React", "TypeScript", "Vite", "Canvas 2D", "IndexedDB"],
      signal: "Git history",
    },
    {
      title: "OpenCode tooling",
      type: "Developer tools",
      description: "Setup and repository tools for OpenCode coding agents.",
      href: "https://github.com/Tah10n/opencode-harness",
      impact: "Repository search, task coordination, and code review checks.",
      highlights: [
        "Prompts, subagent setup, review records, and runtime checks.",
        "Tools for mapping, searching, and reading large repositories.",
        "Limits and checks for agent memory and skill updates.",
      ],
      stack: ["OpenCode", "Node.js", "TypeScript", "MCP", "Agent workflows"],
      signal: "OpenCode tools",
    },
  ],
  contactCta: {
    eyebrow: "Contact",
    title: "Have a role or project in mind?",
    body: "Message me on Telegram or LinkedIn about AI development roles or projects.",
  },
};
