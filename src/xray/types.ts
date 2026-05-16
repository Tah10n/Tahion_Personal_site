export type XRayMode = "browser-static" | "backend-ai";

export type RepoInput = {
  owner: string;
  repo: string;
  url: string;
};

export type RepoIdentity = RepoInput & {
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  htmlUrl: string;
  stars: number;
  forks: number;
  openIssues: number;
  licenseName: string | null;
  pushedAt: string | null;
};

export type RepoTreeItem = {
  path: string;
  type: "blob" | "tree";
  size?: number;
  url?: string;
};

export type RepoFile = {
  path: string;
  content: string;
  htmlUrl: string;
};

export type RepoSnapshot = {
  repo: RepoIdentity;
  languages: Record<string, number>;
  readme: RepoFile | null;
  files: RepoFile[];
  tree: RepoTreeItem[];
  fetchedAt: string;
  provider: "github-browser";
  warnings: string[];
};

export type SignalStrength = "strong" | "medium" | "weak" | "unknown";

export type EvidenceLink = {
  label: string;
  href: string;
  path?: string;
  kind: "repo" | "readme" | "manifest" | "workflow" | "source" | "docs" | "config";
};

export type StackSignal = {
  label: string;
  detail: string;
  strength: SignalStrength;
  evidence: EvidenceLink[];
};

export type XRayFinding = {
  title: string;
  detail: string;
  strength: SignalStrength;
  evidence: EvidenceLink[];
};

export type XRaySection = {
  title: string;
  summary: string;
  findings: XRayFinding[];
};

export type XRayReport = {
  repo: RepoIdentity;
  generatedAt: string;
  mode: XRayMode;
  thesis: string;
  telemetry: {
    filesScanned: number;
    directoriesScanned: number;
    fetchedFiles: number;
    languages: string[];
    workflows: number;
    manifests: number;
  };
  stack: StackSignal[];
  architecture: XRaySection;
  reliability: XRaySection;
  devex: XRaySection;
  deployment: XRaySection;
  evidence: EvidenceLink[];
  unknowns: string[];
};

export type XRayProvider = {
  inspect(input: RepoInput): Promise<RepoSnapshot | XRayReport>;
};
