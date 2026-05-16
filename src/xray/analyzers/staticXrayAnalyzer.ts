import {
  EvidenceLink,
  RepoFile,
  RepoSnapshot,
  SignalStrength,
  StackSignal,
  XRayFinding,
  XRayReport,
  XRaySection,
} from "../types";

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const sourceExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".java",
  ".kt",
  ".py",
  ".go",
  ".rs",
  ".swift",
  ".mjs",
  ".cjs",
]);

function extensionOf(path: string) {
  const match = /\.[^.]+$/.exec(path);
  return match?.[0].toLowerCase() ?? "";
}

function basename(path: string) {
  const parts = path.split("/");
  return parts[parts.length - 1];
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+]\([^)]*\)/g, (match) => match.replace(/^\[|\]\([^)]*\)$/g, ""))
    .replace(/[#*_`>~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getReadmeThesis(snapshot: RepoSnapshot) {
  if (snapshot.repo.description) {
    return snapshot.repo.description;
  }

  const lines = snapshot.readme?.content.split(/\r?\n/) ?? [];
  const paragraph = lines
    .map((line) => line.trim())
    .filter(
      (line) => line && !line.startsWith("#") && !line.startsWith("[!") && !line.startsWith("!["),
    )[0];

  return paragraph
    ? stripMarkdown(paragraph).slice(0, 260)
    : "Public repository with enough metadata for a static X-Ray scan.";
}

function htmlUrlForPath(snapshot: RepoSnapshot, path: string) {
  return `${snapshot.repo.htmlUrl}/blob/${encodeURIComponent(snapshot.repo.defaultBranch)}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function evidence(
  snapshot: RepoSnapshot,
  path: string,
  kind: EvidenceLink["kind"],
  label?: string,
): EvidenceLink {
  const file =
    snapshot.files.find((item) => item.path === path) ??
    (snapshot.readme?.path === path ? snapshot.readme : null);

  return {
    label: label ?? path,
    href: file?.htmlUrl ?? htmlUrlForPath(snapshot, path),
    path,
    kind,
  };
}

function repoEvidence(snapshot: RepoSnapshot): EvidenceLink {
  return {
    label: snapshot.repo.fullName,
    href: snapshot.repo.htmlUrl,
    kind: "repo",
  };
}

function uniqueEvidence(items: EvidenceLink[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.kind}:${item.href}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function parsePackageJson(file: RepoFile | undefined): PackageJson | null {
  if (!file) {
    return null;
  }

  try {
    return JSON.parse(file.content) as PackageJson;
  } catch {
    return null;
  }
}

function dependencyNames(packageJson: PackageJson | null) {
  return new Set([
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
  ]);
}

function filesByBasename(snapshot: RepoSnapshot, name: string) {
  return snapshot.files.filter((file) => basename(file.path) === name);
}

function manifestPriority(path: string) {
  if (path === "package.json") return 0;
  if (path === "app/package.json") return 1;
  if (path === "project/package.json") return 2;
  return 10 + path.split("/").length;
}

function primaryPackageJsonFile(snapshot: RepoSnapshot) {
  return filesByBasename(snapshot, "package.json").sort(
    (a, b) => manifestPriority(a.path) - manifestPriority(b.path) || a.path.localeCompare(b.path),
  )[0];
}

function treePaths(snapshot: RepoSnapshot) {
  return snapshot.tree.map((item) => item.path);
}

function hasPath(paths: string[], predicate: (path: string) => boolean) {
  return paths.some(predicate);
}

function hasContent(snapshot: RepoSnapshot, pattern: RegExp) {
  return [snapshot.readme, ...snapshot.files].some((file) => file && pattern.test(file.content));
}

function toStrength(value: boolean, fallback: SignalStrength = "unknown"): SignalStrength {
  return value ? "strong" : fallback;
}

function languageSignals(snapshot: RepoSnapshot): StackSignal[] {
  const total = Object.values(snapshot.languages).reduce((sum, value) => sum + value, 0);

  return Object.entries(snapshot.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([language, bytes]) => ({
      label: language,
      detail: total
        ? `${Math.round((bytes / total) * 100)}% of detected source bytes`
        : "Detected by GitHub",
      strength: "medium",
      evidence: [repoEvidence(snapshot)],
    }));
}

function stackSignals(snapshot: RepoSnapshot): StackSignal[] {
  const packageJsonFile = primaryPackageJsonFile(snapshot);
  const packageJson = parsePackageJson(packageJsonFile);
  const deps = dependencyNames(packageJson);
  const paths = treePaths(snapshot);
  const signals: StackSignal[] = [...languageSignals(snapshot)];

  const add = (
    label: string,
    detail: string,
    path: string,
    strength: SignalStrength = "strong",
  ) => {
    signals.push({
      label,
      detail,
      strength,
      evidence: [evidence(snapshot, path, "manifest")],
    });
  };

  if (deps.has("react") && packageJsonFile) {
    add("React", `React dependency detected in ${packageJsonFile.path}`, packageJsonFile.path);
  }
  if (deps.has("vite") || hasPath(paths, (path) => basename(path).startsWith("vite.config"))) {
    const viteConfigPath = paths.find((path) => basename(path).startsWith("vite.config"));
    add(
      "Vite",
      "Vite app/build configuration detected",
      packageJsonFile ? packageJsonFile.path : (viteConfigPath ?? "vite.config.ts"),
    );
  }
  if ((deps.has("react-native") || deps.has("expo")) && packageJsonFile) {
    add("React Native / Expo", "Mobile runtime dependency detected", packageJsonFile.path);
  }
  if (hasPath(paths, (path) => basename(path) === "pom.xml"))
    add(
      "Maven",
      "Java Maven manifest detected",
      paths.find((path) => basename(path) === "pom.xml") ?? "pom.xml",
    );
  if (hasPath(paths, (path) => basename(path).startsWith("build.gradle"))) {
    add(
      "Gradle",
      "Gradle build manifest detected",
      paths.find((path) => basename(path).startsWith("build.gradle")) ?? "build.gradle",
    );
  }
  if (hasPath(paths, (path) => basename(path) === "pyproject.toml"))
    add(
      "Python",
      "pyproject.toml detected",
      paths.find((path) => basename(path) === "pyproject.toml") ?? "pyproject.toml",
    );
  if (hasPath(paths, (path) => basename(path) === "go.mod"))
    add("Go", "go.mod detected", paths.find((path) => basename(path) === "go.mod") ?? "go.mod");
  if (hasPath(paths, (path) => basename(path) === "Cargo.toml"))
    add(
      "Rust",
      "Cargo.toml detected",
      paths.find((path) => basename(path) === "Cargo.toml") ?? "Cargo.toml",
    );
  if (hasPath(paths, (path) => basename(path) === "Dockerfile"))
    add(
      "Docker",
      "Dockerfile detected",
      paths.find((path) => basename(path) === "Dockerfile") ?? "Dockerfile",
      "medium",
    );

  return uniqueStackSignals(signals);
}

function uniqueStackSignals(signals: StackSignal[]) {
  const seen = new Set<string>();

  return signals.filter((signal) => {
    const key = signal.label.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function finding(
  title: string,
  detail: string,
  strength: SignalStrength,
  evidenceItems: EvidenceLink[] = [],
): XRayFinding {
  return {
    title,
    detail,
    strength,
    evidence: uniqueEvidence(evidenceItems),
  };
}

function summarizeDirectories(snapshot: RepoSnapshot) {
  const sourceDirs = new Map<string, number>();

  snapshot.tree.forEach((item) => {
    if (item.type !== "blob" || !sourceExtensions.has(extensionOf(item.path))) {
      return;
    }

    const top = item.path.split("/")[0];
    sourceDirs.set(top, (sourceDirs.get(top) ?? 0) + 1);
  });

  return [...sourceDirs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function buildArchitecture(snapshot: RepoSnapshot): XRaySection {
  const paths = treePaths(snapshot);
  const dirs = summarizeDirectories(snapshot);
  const findings: XRayFinding[] = [];

  if (dirs.length) {
    findings.push(
      finding(
        "Source topology",
        `The most active top-level source areas are ${dirs.map(([dir, count]) => `${dir}/ (${count})`).join(", ")}.`,
        "medium",
        [repoEvidence(snapshot)],
      ),
    );
  }

  if (hasPath(paths, (path) => path.startsWith("src/") || path.startsWith("app/"))) {
    findings.push(
      finding(
        "Application source boundary",
        "A conventional app/source directory is present.",
        "strong",
        [repoEvidence(snapshot)],
      ),
    );
  }

  if (hasPath(paths, (path) => path.startsWith("docs/"))) {
    findings.push(
      finding(
        "Documentation surface",
        "The repository exposes docs/ content that can anchor deeper engineering review.",
        "strong",
        [
          evidence(
            snapshot,
            paths.find((path) => path.startsWith("docs/")) ?? "docs",
            "docs",
            "docs/",
          ),
        ],
      ),
    );
  }

  if (hasPath(paths, (path) => path.startsWith(".github/workflows/"))) {
    findings.push(
      finding(
        "Automation boundary",
        "GitHub Actions workflows are part of the repository architecture.",
        "strong",
        [
          evidence(
            snapshot,
            paths.find((path) => path.startsWith(".github/workflows/")) ?? ".github/workflows",
            "workflow",
          ),
        ],
      ),
    );
  }

  if (hasPath(paths, (path) => /(^|\/)(android|ios)\//.test(path))) {
    findings.push(
      finding(
        "Native surface",
        "Native mobile directories are visible, so runtime behavior likely spans web and device layers.",
        "medium",
        [repoEvidence(snapshot)],
      ),
    );
  }

  return {
    title: "Architecture",
    summary: findings.length
      ? "The browser scan maps repository shape, source boundaries, and automation surfaces from the public tree."
      : "The public tree does not expose enough structure for a confident architecture read.",
    findings,
  };
}

function buildReliability(snapshot: RepoSnapshot): XRaySection {
  const paths = treePaths(snapshot);
  const packageJsonFile = primaryPackageJsonFile(snapshot);
  const packageJson = parsePackageJson(packageJsonFile);
  const scripts = packageJson?.scripts ?? {};
  const findings: XRayFinding[] = [];

  const testPaths = paths.filter((path) => /(\btest\b|\btests\b|\.test\.|\.spec\.)/i.test(path));

  if (testPaths.length || scripts.test) {
    findings.push(
      finding(
        "Test signal",
        scripts.test
          ? `package.json exposes a test script: ${scripts.test}`
          : `${testPaths.length} test-like paths were found in the public tree.`,
        "strong",
        packageJsonFile
          ? [evidence(snapshot, packageJsonFile.path, "manifest")]
          : [repoEvidence(snapshot)],
      ),
    );
  } else {
    findings.push(
      finding(
        "Test signal missing",
        "No obvious tests or package test script were found in the public scan.",
        "weak",
      ),
    );
  }

  if (scripts.lint || scripts.check || scripts.typecheck) {
    findings.push(
      finding(
        "Quality gate scripts",
        `Quality commands are visible: ${Object.keys(scripts)
          .filter((script) => ["lint", "check", "typecheck"].includes(script))
          .join(", ")}.`,
        "strong",
        packageJsonFile ? [evidence(snapshot, packageJsonFile.path, "manifest")] : [],
      ),
    );
  }

  if (hasPath(paths, (path) => path.startsWith(".github/workflows/"))) {
    findings.push(
      finding(
        "CI workflow",
        "GitHub Actions workflows provide an external verification surface.",
        "strong",
        [
          evidence(
            snapshot,
            paths.find((path) => path.startsWith(".github/workflows/")) ?? ".github/workflows",
            "workflow",
          ),
        ],
      ),
    );
  }

  const securitySignal =
    hasPath(paths, (path) => /auth|security|permission|encrypt|secret|token/i.test(path)) ||
    hasContent(snapshot, /\b(auth|permission|encrypt|redact|token|secret|rate limit|privacy)\b/i);

  findings.push(
    finding(
      securitySignal ? "Security and privacy vocabulary" : "Security proof needs review",
      securitySignal
        ? "Security, privacy, permission, or token-related terms appear in public files."
        : "The static scan did not find strong security/privacy evidence; this may require manual review.",
      toStrength(securitySignal, "unknown"),
      [repoEvidence(snapshot)],
    ),
  );

  return {
    title: "Reliability",
    summary:
      "Reliability is inferred from tests, quality gates, CI, and security/privacy vocabulary visible in public files.",
    findings,
  };
}

function buildDevex(snapshot: RepoSnapshot): XRaySection {
  const packageJsonFile = primaryPackageJsonFile(snapshot);
  const packageJson = parsePackageJson(packageJsonFile);
  const paths = treePaths(snapshot);
  const scripts = Object.keys(packageJson?.scripts ?? {});
  const findings: XRayFinding[] = [];

  if (scripts.length) {
    findings.push(
      finding(
        "Runnable scripts",
        `Developer entrypoints detected: ${scripts.slice(0, 8).join(", ")}${scripts.length > 8 ? ", ..." : ""}.`,
        "strong",
        packageJsonFile ? [evidence(snapshot, packageJsonFile.path, "manifest")] : [],
      ),
    );
  }

  if (snapshot.readme) {
    findings.push(
      finding(
        "README onboarding",
        "README.md is available as the primary onboarding document.",
        "strong",
        [evidence(snapshot, snapshot.readme.path, "readme")],
      ),
    );
  }

  const configPaths = paths.filter((path) =>
    [
      "tsconfig.json",
      ".eslintrc",
      "eslint.config.js",
      ".prettierrc",
      "vite.config.ts",
      "vite.config.js",
    ].includes(basename(path)),
  );

  if (configPaths.length) {
    findings.push(
      finding(
        "Tooling configuration",
        `Visible tool configs: ${configPaths.slice(0, 6).join(", ")}.`,
        "medium",
        configPaths.slice(0, 3).map((path) => evidence(snapshot, path, "config")),
      ),
    );
  }

  return {
    title: "Developer Experience",
    summary:
      "DevEx is scored by visible commands, onboarding docs, and project tooling configuration.",
    findings,
  };
}

function buildDeployment(snapshot: RepoSnapshot): XRaySection {
  const paths = treePaths(snapshot);
  const packageJsonFile = primaryPackageJsonFile(snapshot);
  const packageJson = parsePackageJson(packageJsonFile);
  const scripts = packageJson?.scripts ?? {};
  const findings: XRayFinding[] = [];

  if (scripts.build) {
    findings.push(
      finding("Build command", `Build script detected: ${scripts.build}`, "strong", [
        ...(packageJsonFile ? [evidence(snapshot, packageJsonFile.path, "manifest")] : []),
      ]),
    );
  }

  if (hasPath(paths, (path) => path.startsWith(".github/workflows/"))) {
    findings.push(
      finding(
        "Release automation",
        "GitHub Actions may own CI, release, or deployment workflows.",
        "medium",
        [
          evidence(
            snapshot,
            paths.find((path) => path.startsWith(".github/workflows/")) ?? ".github/workflows",
            "workflow",
          ),
        ],
      ),
    );
  }

  if (
    hasPath(
      paths,
      (path) => basename(path) === "Dockerfile" || basename(path).startsWith("docker-compose"),
    )
  ) {
    findings.push(
      finding(
        "Container path",
        "Docker-related files suggest a containerized deployment or local runtime path.",
        "medium",
        [
          evidence(
            snapshot,
            paths.find(
              (path) =>
                basename(path) === "Dockerfile" || basename(path).startsWith("docker-compose"),
            ) ?? "Dockerfile",
            "config",
          ),
        ],
      ),
    );
  }

  const easPath = paths.find((path) => basename(path) === "eas.json");
  if (easPath) {
    findings.push(
      finding(
        "Expo/EAS release path",
        "eas.json indicates an Expo Application Services build or submit workflow.",
        "strong",
        [evidence(snapshot, easPath, "config")],
      ),
    );
  }

  if (!findings.length) {
    findings.push(
      finding(
        "Deployment unknown",
        "No obvious deployment manifest was found in the public scan.",
        "unknown",
        [repoEvidence(snapshot)],
      ),
    );
  }

  return {
    title: "Deployment",
    summary:
      "Deployment evidence comes from build scripts, workflows, containers, and platform manifests.",
    findings,
  };
}

function collectEvidence(sections: XRaySection[], stack: StackSignal[], snapshot: RepoSnapshot) {
  return uniqueEvidence([
    repoEvidence(snapshot),
    ...(snapshot.readme ? [evidence(snapshot, snapshot.readme.path, "readme")] : []),
    ...stack.flatMap((signal) => signal.evidence),
    ...sections.flatMap((section) => section.findings.flatMap((item) => item.evidence)),
  ]).slice(0, 18);
}

function buildUnknowns(snapshot: RepoSnapshot) {
  const unknowns = [
    "Browser mode cannot run the project, execute tests, inspect private repos, or verify runtime behavior.",
    "The report is deterministic and evidence-based; it does not use an AI model in v0.",
    "Large repositories are sampled by manifests, docs, workflows, README, and public tree shape.",
  ];

  if (!snapshot.readme) {
    unknowns.push(
      "README.md was not found, so the project thesis is based on repository metadata only.",
    );
  }

  if (!Object.keys(snapshot.languages).length) {
    unknowns.push("GitHub did not return language statistics for this repository.");
  }

  return [...unknowns, ...snapshot.warnings];
}

export function buildStaticXrayReport(snapshot: RepoSnapshot): XRayReport {
  const stack = stackSignals(snapshot);
  const sections = [
    buildArchitecture(snapshot),
    buildReliability(snapshot),
    buildDevex(snapshot),
    buildDeployment(snapshot),
  ];
  const workflows = snapshot.tree.filter(
    (item) => item.path.startsWith(".github/workflows/") && item.type === "blob",
  );
  const manifests = snapshot.files.filter((file) =>
    [
      "package.json",
      "pom.xml",
      "build.gradle",
      "build.gradle.kts",
      "pyproject.toml",
      "Cargo.toml",
      "go.mod",
    ].includes(basename(file.path)),
  );

  return {
    repo: snapshot.repo,
    generatedAt: new Date().toISOString(),
    mode: "browser-static",
    thesis: getReadmeThesis(snapshot),
    telemetry: {
      filesScanned: snapshot.tree.filter((item) => item.type === "blob").length,
      directoriesScanned: snapshot.tree.filter((item) => item.type === "tree").length,
      fetchedFiles: snapshot.files.length + (snapshot.readme ? 1 : 0),
      languages: Object.keys(snapshot.languages).slice(0, 5),
      workflows: workflows.length,
      manifests: manifests.length,
    },
    stack,
    architecture: sections[0],
    reliability: sections[1],
    devex: sections[2],
    deployment: sections[3],
    evidence: collectEvidence(sections, stack, snapshot),
    unknowns: buildUnknowns(snapshot),
  };
}
