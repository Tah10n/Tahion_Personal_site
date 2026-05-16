import {
  RepoFile,
  RepoIdentity,
  RepoInput,
  RepoSnapshot,
  RepoTreeItem,
  XRayProvider,
} from "../types";

type GithubRepoResponse = {
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: { name: string } | null;
  pushed_at: string | null;
};

type GithubTreeResponse = {
  tree: {
    path: string;
    type: "blob" | "tree" | string;
    size?: number;
    url?: string;
  }[];
};

type GithubJsonResult<T> = {
  data: T;
  remaining: number | null;
  resetAt: string | null;
};

type CachedSnapshot = {
  version: 1;
  expiresAt: string;
  snapshot: RepoSnapshot;
};

const githubApiBase = "https://api.github.com";
const githubRawBase = "https://raw.githubusercontent.com";
const cachePrefix = "tahion.xray.snapshot";
const cacheTtlMs = 6 * 60 * 60 * 1000;
const minRestBudgetForLanguages = 3;

const manifestNames = new Set([
  "package.json",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts",
  "pyproject.toml",
  "requirements.txt",
  "Cargo.toml",
  "go.mod",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "app.json",
  "app.config.js",
  "app.config.ts",
  "eas.json",
  "vite.config.ts",
  "vite.config.js",
  "tsconfig.json",
]);

const textDocExtensions = new Set([".md", ".mdx", ".txt", ".adoc", ".rst"]);
const readmeNames = ["readme.md", "readme.mdx", "readme.adoc", "readme.rst", "readme.txt"];

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function parseRateHeader(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function resetHeaderToIso(value: string | null) {
  const parsed = parseRateHeader(value);
  return parsed ? new Date(parsed * 1000).toISOString() : null;
}

function formatResetTime(value: string | null) {
  if (!value) {
    return "Try again later.";
  }

  return `Try again after ${new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value))}.`;
}

async function fetchGithubJson<T>(url: string): Promise<GithubJsonResult<T>> {
  const response = await fetch(url, { headers: githubHeaders() });
  const remaining = parseRateHeader(response.headers.get("x-ratelimit-remaining"));
  const resetAt = resetHeaderToIso(response.headers.get("x-ratelimit-reset"));

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "GitHub repository or file was not found. Only public repositories are supported in browser mode.",
      );
    }

    if (response.status === 403 || response.status === 429) {
      throw new Error(
        `GitHub API rate limit or access policy blocked this request. ${formatResetTime(resetAt)} You can still open Demo report.`,
      );
    }

    throw new Error(`GitHub API request failed with status ${response.status}.`);
  }

  return {
    data: (await response.json()) as T,
    remaining,
    resetAt,
  };
}

function toRepoIdentity(input: RepoInput, response: GithubRepoResponse): RepoIdentity {
  return {
    ...input,
    name: response.name,
    fullName: response.full_name,
    description: response.description,
    defaultBranch: response.default_branch,
    htmlUrl: response.html_url,
    stars: response.stargazers_count,
    forks: response.forks_count,
    openIssues: response.open_issues_count,
    licenseName: response.license?.name ?? null,
    pushedAt: response.pushed_at,
  };
}

function extensionOf(path: string) {
  const match = /\.[^.]+$/.exec(path);
  return match?.[0].toLowerCase() ?? "";
}

function basename(path: string) {
  const parts = path.split("/");
  return parts[parts.length - 1];
}

function pathDepth(path: string) {
  return path.split("/").length;
}

function encodePath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}

function htmlUrlForPath(input: RepoInput, branch: string, path: string) {
  return `${input.url}/blob/${encodePath(branch)}/${encodePath(path)}`;
}

function rawUrlForPath(input: RepoInput, branch: string, path: string) {
  return `${githubRawBase}/${encodeURIComponent(input.owner)}/${encodeURIComponent(
    input.repo,
  )}/refs/heads/${encodePath(branch)}/${encodePath(path)}`;
}

function cacheKey(input: RepoInput) {
  return `${cachePrefix}:${input.owner.toLowerCase()}/${input.repo.toLowerCase()}`;
}

function readCachedSnapshot(input: RepoInput): RepoSnapshot | null {
  try {
    const cached = window.localStorage.getItem(cacheKey(input));
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached) as CachedSnapshot;
    if (parsed.version !== 1 || !parsed.snapshot || Date.parse(parsed.expiresAt) <= Date.now()) {
      window.localStorage.removeItem(cacheKey(input));
      return null;
    }

    return {
      ...parsed.snapshot,
      warnings: [
        ...parsed.snapshot.warnings,
        `Loaded from browser cache. Cached scans are reused for up to ${Math.round(
          cacheTtlMs / 60 / 60 / 1000,
        )} hours to stay under GitHub limits.`,
      ],
    };
  } catch {
    return null;
  }
}

function writeCachedSnapshot(input: RepoInput, snapshot: RepoSnapshot) {
  try {
    const value: CachedSnapshot = {
      version: 1,
      expiresAt: new Date(Date.now() + cacheTtlMs).toISOString(),
      snapshot,
    };
    window.localStorage.setItem(cacheKey(input), JSON.stringify(value));
  } catch {
    // Browser storage can be disabled; the scanner still works without cache.
  }
}

function isReadmePath(path: string) {
  return pathDepth(path) === 1 && readmeNames.includes(path.toLowerCase());
}

function manifestScore(path: string) {
  const name = basename(path);

  if (path === "package.json") return 0;
  if (path === "app/package.json") return 1;
  if (path === "project/package.json") return 2;
  if (name === "package.json") return 3 + pathDepth(path);
  if (path === "pom.xml" || path === "build.gradle" || path === "build.gradle.kts") return 20;
  if (path === "pyproject.toml" || path === "Cargo.toml" || path === "go.mod") return 30;
  if (name === "eas.json" || name.startsWith("vite.config") || name === "tsconfig.json") return 40;
  if (name === "Dockerfile" || name.startsWith("docker-compose")) return 50;

  return 70 + pathDepth(path);
}

function selectFilePaths(tree: RepoTreeItem[]) {
  const blobPaths = tree.filter((item) => item.type === "blob").map((item) => item.path);
  const readmePath = blobPaths.find(isReadmePath);
  const manifests = blobPaths
    .filter((path) => manifestNames.has(basename(path)))
    .sort((a, b) => manifestScore(a) - manifestScore(b) || a.localeCompare(b))
    .slice(0, 12);
  const workflows = blobPaths
    .filter((path) => path.startsWith(".github/workflows/"))
    .sort()
    .slice(0, 4);
  const docs = blobPaths
    .filter((path) => path.startsWith("docs/") && textDocExtensions.has(extensionOf(path)))
    .sort((a, b) => pathDepth(a) - pathDepth(b) || a.localeCompare(b))
    .slice(0, 4);

  return {
    readmePath,
    paths: [...new Set([...manifests, ...workflows, ...docs])].filter(
      (path) => path !== readmePath,
    ),
  };
}

async function fetchRawFile(
  input: RepoInput,
  branch: string,
  path: string,
): Promise<RepoFile | null> {
  const response = await fetch(rawUrlForPath(input, branch, path), {
    headers: { Accept: "text/plain" },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Raw GitHub file request failed for ${path} with status ${response.status}.`);
  }

  return {
    path,
    content: await response.text(),
    htmlUrl: htmlUrlForPath(input, branch, path),
  };
}

async function fetchSelectedFiles(input: RepoInput, branch: string, paths: string[]) {
  const files: RepoFile[] = [];
  const warnings: string[] = [];

  for (const path of paths) {
    try {
      const file = await fetchRawFile(input, branch, path);
      if (file) {
        files.push(file);
      }
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `Could not fetch ${path}.`);
    }
  }

  return { files, warnings };
}

export class GithubBrowserProvider implements XRayProvider {
  async inspect(input: RepoInput): Promise<RepoSnapshot> {
    const cached = readCachedSnapshot(input);
    if (cached) {
      return cached;
    }

    const repoResult = await fetchGithubJson<GithubRepoResponse>(
      `${githubApiBase}/repos/${input.owner}/${input.repo}`,
    );
    const repo = toRepoIdentity(input, repoResult.data);
    const warnings: string[] = [];

    const shouldFetchLanguages =
      repoResult.remaining === null || repoResult.remaining > minRestBudgetForLanguages;
    const treeRequest = fetchGithubJson<GithubTreeResponse>(
      `${githubApiBase}/repos/${input.owner}/${input.repo}/git/trees/${encodeURIComponent(
        repo.defaultBranch,
      )}?recursive=1`,
    );
    const languageRequest = shouldFetchLanguages
      ? fetchGithubJson<Record<string, number>>(
          `${githubApiBase}/repos/${input.owner}/${input.repo}/languages`,
        )
      : Promise.resolve<GithubJsonResult<Record<string, number>>>({
          data: {},
          remaining: repoResult.remaining,
          resetAt: repoResult.resetAt,
        });

    if (!shouldFetchLanguages) {
      warnings.push("Skipped GitHub language statistics because the REST API budget is low.");
    }

    const [treeResult, languageResult] = await Promise.all([treeRequest, languageRequest]);
    const tree: RepoTreeItem[] = treeResult.data.tree
      .filter((item): item is RepoTreeItem => item.type === "blob" || item.type === "tree")
      .map((item) => ({
        path: item.path,
        type: item.type,
        size: item.size,
        url: item.url,
      }));
    const { readmePath, paths } = selectFilePaths(tree);
    const [readme, selectedFiles] = await Promise.all([
      readmePath ? fetchRawFile(input, repo.defaultBranch, readmePath) : Promise.resolve(null),
      fetchSelectedFiles(input, repo.defaultBranch, paths),
    ]);

    warnings.push(...selectedFiles.warnings);

    const snapshot: RepoSnapshot = {
      repo,
      languages: languageResult.data,
      readme,
      files: selectedFiles.files,
      tree,
      fetchedAt: new Date().toISOString(),
      provider: "github-browser",
      warnings,
    };

    writeCachedSnapshot(input, snapshot);
    return snapshot;
  }
}
