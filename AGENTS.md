# AGENTS.md

Guidance for coding agents working on this repository.

## Project

This is a static personal portfolio site built with Vite, React, and TypeScript.
It is designed for GitHub Pages project hosting at `/Tahion_Personal_site/`.

Core behavior:

- Interactive WebGL hero backdrop with multiple visual variants and themes.
- Local Prompt Cockpit tool with no backend and no external AI API calls.
- Portfolio content is centralized in `src/data/profile.ts`.

## Commands

Use these project scripts:

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
```

Expected local URLs:

- Dev server: `http://127.0.0.1:5173/Tahion_Personal_site/`
- Production preview: `http://127.0.0.1:4173/Tahion_Personal_site/`

Before handing off code changes, run:

```bash
npm run check
```

This runs ESLint, Prettier check, TypeScript, and a production Vite build.

## Structure

- `src/App.tsx`: main page composition and hero controls.
- `src/components/ShaderBackdrop.tsx`: WebGL/canvas backdrop variants, themes, parallax, and fallback.
- `src/components/PromptCockpit.tsx`: local prompt generation, copy/reset/save, and `localStorage` history.
- `src/data/profile.ts`: editable portfolio content, links, skills, and projects.
- `src/styles.css`: global layout, responsive rules, visual themes, and component styling.

## Implementation Rules

- Keep the site static-only unless the user explicitly asks for a backend.
- Do not add secrets or private values to the repo. Only use public `VITE_` env vars if needed.
- Keep Prompt Cockpit data client-side only. Do not introduce network calls for prompt generation.
- Preserve the GitHub Pages base path in `vite.config.ts` unless the deploy target changes.
- Do not commit `node_modules/` or `dist/`; they are ignored intentionally.
- Prefer small, focused changes that preserve the existing visual direction.
- Keep mobile layouts free of horizontal overflow. Verify with a narrow viewport after visual changes.
- If touching WebGL shader code, keep a working fallback path for browsers without WebGL.

## UI Guidance

- The site should feel like a fast futuristic cockpit, not a marketing landing page.
- Keep controls compact, legible, and useful.
- Avoid decorative elements that do not relate to portfolio, tools, signals, prompts, or AI workflow.
- Respect `prefers-reduced-motion`; do not make critical content depend on animation.

## Deployment Notes

The app is configured for a GitHub Pages project URL:

```ts
base: "/Tahion_Personal_site/";
```

If the repository name, custom domain, or hosting path changes, update `vite.config.ts`
and verify `npm run build` plus `npm run preview`.
