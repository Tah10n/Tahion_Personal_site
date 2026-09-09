# Tahion Personal Site

Fast static Vite + React + TypeScript portfolio with an interactive WebGL backdrop.

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

Project X-Ray is an independent project in development. Its portfolio entry has
no link until its dedicated website is ready. The former `#/xray` route redirects
to the portfolio's Work section; the analyzer page is no longer imported or shipped
in the site's JavaScript bundle.

The existing analyzer source and helper tests are retained for future extraction.
See [docs/project-xray.md](docs/project-xray.md) for those implementation notes.

## Hidden Ops Dashboard

The static site includes a hidden public-safe Ops route at `#/ops`. It is not
linked from the public navigation and can show analytics setup status, provider
dashboard embeds, public aggregate stats, Project X-Ray usage, and contact/link
interaction signals.

This is not real authentication. Keep all analytics configuration public-only and
never put API keys or private tokens in frontend env vars. See
[docs/analytics-provider.md](docs/analytics-provider.md) for Plausible, Umami,
custom provider, and public stats feed setup.

## Content

Portfolio copy, links, skills, and project cards live in `src/data/profile.ts`.

## Deployment

Vite is configured for GitHub Pages project hosting with:

```ts
base: "/Tahion_Personal_site/";
```

If the repository or deploy path changes, update `vite.config.ts`.

The `Deploy portfolio to GitHub Pages` workflow runs on every push to `main`
and can also be started manually from GitHub Actions. It installs dependencies
with `npm ci`, runs `npm run check`, and publishes only the built `dist/` directory.
In the repository's Settings → Pages, select **GitHub Actions** as the source.

Site: https://Tah10n.github.io/Tahion_Personal_site/

Optional public analytics configuration is read from repository Actions variables
named `VITE_ANALYTICS_*` (see `.env.example`). Local `.env` files are not uploaded.
Without these variables, tracking stays disabled and `#/ops` shows demo statistics.
