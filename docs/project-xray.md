# Project X-Ray

Project X-Ray is a portfolio tool for turning a public GitHub repository URL into an evidence-linked engineering report.

The default implementation is browser-static so the site can keep running on GitHub Pages without a backend, secrets, or AI API keys. An optional backend mode can be enabled with a public Vite environment variable.

## Current Browser Mode

Route:

```text
#/xray
```

Input:

```text
https://github.com/owner/repo
owner/repo
```

Browser mode keeps REST API usage deliberately low. It reads public repository structure through the GitHub API, then fetches selected text files through `raw.githubusercontent.com`:

- repository metadata
- default branch tree
- language statistics when the remaining REST budget is healthy
- README
- known manifests such as `package.json`, `pom.xml`, `build.gradle`, `pyproject.toml`, `Cargo.toml`, `go.mod`
- `.github/workflows/*`
- a bounded sample of `docs/*`

The normal scan path uses roughly 2-3 GitHub REST requests before switching to raw file downloads. This keeps the browser-only version usable under GitHub's unauthenticated REST limit.

Browser mode caches completed snapshots in `localStorage` for 6 hours under `tahion.xray.snapshot:*`. Cached reports render through the same `XRayReport` UI contract and include an `Unknowns` note that the data came from browser cache.

The analyzer then builds a deterministic report from visible evidence. It does not call an LLM and it does not execute repository code.

## Optional Backend Mode

Set `VITE_XRAY_BACKEND_URL` to a Repo Analyzer Service base URL to try the backend first:

```text
VITE_XRAY_BACKEND_URL=http://127.0.0.1:3000
```

The frontend resolves that value to:

```text
GET /api/xray?repo=https%3A%2F%2Fgithub.com%2Fowner%2Frepo
```

If the backend request fails, `ProjectXRayPage` automatically falls back to `GithubBrowserProvider` and renders a visible notice above the report. If both backend and browser mode fail, the page shows the combined failure and keeps `Demo report` available.

Backend mode is only configuration. GitHub tokens, AI keys, private repository credentials, and caching policy belong in Repo Analyzer Service, not in this frontend.

## Demo Mode

The page includes a `Demo report` button for local UI verification when GitHub blocks unauthenticated API calls.

Demo mode:

- does not make network requests
- renders the same `XRayReport` contract as a real scan
- is useful for checking layout, Stack map, responsive behavior, and report sections
- is not evidence of the current state of the demo repository

If the page shows `GitHub API rate limit or access policy blocked this request`, use `Demo report` to verify the interface immediately. For a real repository scan, wait for the unauthenticated GitHub API limit to reset or move the scanner behind a backend that uses a server-side GitHub token and caching.

## Report Contract

The UI renders only `XRayReport` from `src/xray/types.ts`.

```ts
type XRayReport = {
  repo: RepoIdentity;
  generatedAt: string;
  mode: "browser-static" | "backend-ai";
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
```

The important design rule: the page does not care whether the report was produced in the browser or by a future backend.

## Pipeline

Browser-static pipeline:

```text
GitHub URL
  -> parseGithubRepoUrl
  -> GithubBrowserProvider.inspect
  -> RepoSnapshot
  -> buildStaticXrayReport
  -> XRayReport
  -> ProjectXRayPage UI
```

Backend-configured pipeline:

```text
GitHub URL
  -> BackendXrayProvider.inspect
  -> XRayReport if successful
  -> GithubBrowserProvider.inspect fallback if backend fails
  -> ProjectXRayPage UI
```

## Backend Upgrade Path

`src/xray/providers/backendXrayProvider.ts` is the adapter point for the service API.
The target local service project is:

```text
C:\Users\tahion\dev\Projects\repo_analyzer_service
```

The service contract is:

```text
GET /api/xray?repo=https%3A%2F%2Fgithub.com%2Fowner%2Frepo
```

The GitHub Pages version should keep browser-static mode and Demo report as working fallbacks.

Recommended backend responsibilities:

- authenticate GitHub requests with a server-side token
- support private repositories if the user authorizes them
- clone or archive repositories when deeper code inspection is needed
- cache reports by `owner/repo@sha`
- use ETag/conditional requests for repeated GitHub reads
- optionally run an LLM over the same `RepoSnapshot` evidence
- return the same `XRayReport` shape

Do not put GitHub tokens or AI API keys in the frontend. If AI analysis is
added, keep it server-side in Repo Analyzer Service.

The service is shared with Git History Explorer, so X-Ray-specific changes
should preserve the `XRayReport` contract while history-specific endpoints evolve
separately.

## Browser Mode Limits

Browser mode is useful for public portfolio demos, but it has clear limits:

- it cannot inspect private repositories
- it is subject to unauthenticated GitHub API rate limits
- raw GitHub file downloads can also fail under network or access-policy pressure
- it does not run tests or builds
- it samples docs/manifests/workflows instead of reading every file
- it infers reliability from public evidence, so `unknowns` are part of the report

Those limits are displayed in the report so the tool does not overclaim.
