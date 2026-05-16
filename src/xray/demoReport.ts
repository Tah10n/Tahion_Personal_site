import type { XRayReport } from "./types";

const repoUrl = "https://github.com/Tah10n/pocket-ai";

export const demoXrayReport = {
  repo: {
    owner: "Tah10n",
    repo: "pocket-ai",
    url: repoUrl,
    name: "pocket-ai",
    fullName: "Tah10n/pocket-ai",
    description: "Local-first mobile AI workspace with catalog, chat, and Android workflows.",
    defaultBranch: "main",
    htmlUrl: repoUrl,
    stars: 42,
    forks: 4,
    openIssues: 7,
    licenseName: "MIT",
    pushedAt: "2026-05-12T18:42:00Z",
  },
  generatedAt: "2026-05-15T00:00:00.000Z",
  mode: "browser-static",
  thesis:
    "A React Native product with a mobile-first AI workflow surface, explicit Android QA paths, and a repo structure that separates app code from operational documentation.",
  telemetry: {
    filesScanned: 312,
    directoriesScanned: 46,
    fetchedFiles: 18,
    languages: ["TypeScript", "Kotlin", "JavaScript", "Ruby"],
    workflows: 4,
    manifests: 6,
  },
  stack: [
    {
      label: "Expo + React Native",
      detail: "Mobile application layer is organized around Expo Router and React Native screens.",
      strength: "strong",
      evidence: [
        {
          label: "app/package.json",
          href: `${repoUrl}/blob/main/app/package.json`,
          path: "app/package.json",
          kind: "manifest",
        },
      ],
    },
    {
      label: "TypeScript product shell",
      detail: "Most UI, state, and workflow code appears to be typed application code.",
      strength: "strong",
      evidence: [
        {
          label: "app/tsconfig.json",
          href: `${repoUrl}/blob/main/app/tsconfig.json`,
          path: "app/tsconfig.json",
          kind: "config",
        },
      ],
    },
    {
      label: "Android native path",
      detail:
        "The repository carries Android build assets and device-oriented verification scripts.",
      strength: "medium",
      evidence: [
        {
          label: "app/android",
          href: `${repoUrl}/tree/main/app/android`,
          path: "app/android",
          kind: "source",
        },
      ],
    },
    {
      label: "Automated checks",
      detail:
        "CI and local scripts are visible, but the browser scan cannot verify latest run health.",
      strength: "medium",
      evidence: [
        {
          label: ".github/workflows",
          href: `${repoUrl}/tree/main/.github/workflows`,
          path: ".github/workflows",
          kind: "workflow",
        },
      ],
    },
    {
      label: "Operational docs",
      detail: "Roadmaps and workflow notes describe how changes are validated across mobile flows.",
      strength: "medium",
      evidence: [
        {
          label: "docs",
          href: `${repoUrl}/tree/main/docs`,
          path: "docs",
          kind: "docs",
        },
      ],
    },
    {
      label: "Local-first posture",
      detail:
        "The visible structure suggests local state and device workflows are important design axes.",
      strength: "weak",
      evidence: [
        {
          label: "README.md",
          href: `${repoUrl}/blob/main/README.md`,
          path: "README.md",
          kind: "readme",
        },
      ],
    },
  ],
  architecture: {
    title: "Architecture",
    summary:
      "The codebase reads as a mobile product repo with a clear app boundary, typed frontend code, and native Android support for deeper device work.",
    findings: [
      {
        title: "App boundary is easy to reason about",
        detail:
          "Most product code is grouped under an app subtree, which makes public review, builds, and future backend-adjacent services easier to isolate.",
        strength: "strong",
        evidence: [
          {
            label: "app",
            href: `${repoUrl}/tree/main/app`,
            path: "app",
            kind: "source",
          },
        ],
      },
      {
        title: "Native surface is present but bounded",
        detail:
          "Android assets are present, while the main application shape still appears to be React Native and TypeScript-driven.",
        strength: "medium",
        evidence: [
          {
            label: "app/android",
            href: `${repoUrl}/tree/main/app/android`,
            path: "app/android",
            kind: "source",
          },
        ],
      },
    ],
  },
  reliability: {
    title: "Reliability",
    summary:
      "The repository exposes test and device-check hooks, but browser mode can only infer coverage from files and scripts.",
    findings: [
      {
        title: "CI workflow evidence exists",
        detail:
          "Workflow files indicate an automated verification path, though current pass/fail status requires GitHub checks or a backend scan.",
        strength: "medium",
        evidence: [
          {
            label: ".github/workflows",
            href: `${repoUrl}/tree/main/.github/workflows`,
            path: ".github/workflows",
            kind: "workflow",
          },
        ],
      },
      {
        title: "Device QA appears to be part of the process",
        detail:
          "Android-specific scripts and native folders suggest real-device or emulator validation is a known concern.",
        strength: "medium",
        evidence: [
          {
            label: "app/android",
            href: `${repoUrl}/tree/main/app/android`,
            path: "app/android",
            kind: "source",
          },
        ],
      },
    ],
  },
  devex: {
    title: "Developer Experience",
    summary:
      "The repo has recognizable manifests, typed configuration, and scripts that make the expected local workflow discoverable.",
    findings: [
      {
        title: "Package scripts define the main workflow",
        detail:
          "The JavaScript manifest is the main entry point for install, lint, typecheck, build, and local app commands.",
        strength: "strong",
        evidence: [
          {
            label: "app/package.json",
            href: `${repoUrl}/blob/main/app/package.json`,
            path: "app/package.json",
            kind: "manifest",
          },
        ],
      },
      {
        title: "Typed config reduces ambiguity",
        detail:
          "TypeScript configuration is visible, which gives the analyzer a stronger signal about application contracts.",
        strength: "strong",
        evidence: [
          {
            label: "app/tsconfig.json",
            href: `${repoUrl}/blob/main/app/tsconfig.json`,
            path: "app/tsconfig.json",
            kind: "config",
          },
        ],
      },
    ],
  },
  deployment: {
    title: "Deployment",
    summary:
      "Deployment is partially visible through workflow files and mobile project structure, but release ownership cannot be proven from browser evidence alone.",
    findings: [
      {
        title: "Mobile release path is implied",
        detail:
          "Expo and Android assets point toward a native mobile release flow, but store deployment details are outside the static scan.",
        strength: "medium",
        evidence: [
          {
            label: "app/app.json",
            href: `${repoUrl}/blob/main/app/app.json`,
            path: "app/app.json",
            kind: "config",
          },
        ],
      },
      {
        title: "Backend responsibilities are not visible",
        detail:
          "If external services are used, public evidence is not enough to determine ownership, secrets, or operational runbooks.",
        strength: "weak",
        evidence: [
          {
            label: "README.md",
            href: `${repoUrl}/blob/main/README.md`,
            path: "README.md",
            kind: "readme",
          },
        ],
      },
    ],
  },
  evidence: [
    {
      label: "Repository",
      href: repoUrl,
      kind: "repo",
    },
    {
      label: "README.md",
      href: `${repoUrl}/blob/main/README.md`,
      path: "README.md",
      kind: "readme",
    },
    {
      label: "app/package.json",
      href: `${repoUrl}/blob/main/app/package.json`,
      path: "app/package.json",
      kind: "manifest",
    },
    {
      label: ".github/workflows",
      href: `${repoUrl}/tree/main/.github/workflows`,
      path: ".github/workflows",
      kind: "workflow",
    },
  ],
  unknowns: [
    "Demo mode does not contact GitHub and may not match the current repository state.",
    "Browser mode cannot verify latest CI status, test coverage, private services, or runtime behavior.",
    "A backend scanner should cache by commit SHA and use a server-side GitHub token for deeper analysis.",
  ],
} satisfies XRayReport;
