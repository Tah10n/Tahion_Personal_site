# Tahion Personal Site

Fast static Vite + React + TypeScript portfolio with an interactive WebGL backdrop and local Prompt Cockpit.

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

## Content

Portfolio copy, links, skills, and project cards live in `src/data/profile.ts`.

## Deployment

Vite is configured for GitHub Pages project hosting with:

```ts
base: "/Tahion_Personal_site/";
```

If the repository or deploy path changes, update `vite.config.ts`.
