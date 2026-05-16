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
npm run test
npm run check
npm run build
npm run preview
```

- `npm run dev` starts Vite at `http://127.0.0.1:5173/Tahion_Personal_site/`.
- `npm run test` runs focused Node tests for Project X-Ray helpers.
- `npm run preview` serves the production build at `http://127.0.0.1:4173/Tahion_Personal_site/`.
- `npm run check` runs ESLint, Prettier check, tests, TypeScript, and production build.

## Project X-Ray

Project X-Ray lives at `#/xray`. It accepts a public GitHub repository URL and
generates an evidence-linked engineering report from public repository metadata,
README, manifests, workflows, docs, and tree shape.

By default, Project X-Ray runs in browser-static mode and does not use backend
services or AI API keys. Set `VITE_XRAY_BACKEND_URL` to the shared Repo Analyzer
Service base URL to try backend X-Ray first:

```bash
VITE_XRAY_BACKEND_URL=http://127.0.0.1:3000
```

The hosted site keeps browser-static and demo fallbacks even when the backend is
configured. See [docs/project-xray.md](docs/project-xray.md) for architecture,
browser-mode limits, and the backend path.

## Content

Portfolio copy, links, skills, and project cards live in `src/data/profile.ts`.

## Deployment

Vite is configured for GitHub Pages project hosting with:

```ts
base: "/Tahion_Personal_site/";
```

If the repository or deploy path changes, update `vite.config.ts`.
