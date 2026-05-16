# Tahion Personal Site

Fast static Vite + React + TypeScript portfolio with an interactive WebGL backdrop and Project X-Ray.

## Requirements

- Node.js `>=22.12.0`
- npm `>=10.0.0`

The local machine currently uses Node `24.15.0`; `.nvmrc` and `.node-version` are pinned to that version for reproducible setup.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
```

- `npm run dev` starts Vite at `http://127.0.0.1:5173/Tahion_Personal_site/`.
- `npm run preview` serves the production build at `http://127.0.0.1:4173/Tahion_Personal_site/`.
- `npm run check` runs ESLint, Prettier check, TypeScript, and production build.

## Project X-Ray

Project X-Ray lives at `#/xray`. It accepts a public GitHub repository URL and
generates an evidence-linked engineering report from public repository metadata,
README, manifests, workflows, docs, and tree shape.

The first version is static-only and does not use backend services or AI API
keys. The planned backend target is the shared Repo Analyzer Service at
`C:\Users\tahion\dev\Projects\repo_analyzer_service`, but the hosted site should
keep browser-static and demo fallbacks until that service is wired. See
[docs/project-xray.md](docs/project-xray.md) for architecture, browser-mode
limits, and the backend upgrade path.

## Content

Portfolio copy, links, skills, and project cards live in `src/data/profile.ts`.

## Deployment

Vite is configured for GitHub Pages project hosting with:

```ts
base: "/Tahion_Personal_site/";
```

If the repository or deploy path changes, update `vite.config.ts`.
