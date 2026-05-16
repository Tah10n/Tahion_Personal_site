# AGENTS.md

Guidance for coding agents working on this repository.

## Project

This is a static personal portfolio site built with Vite, React, and TypeScript.
It is designed for GitHub Pages project hosting at `/Tahion_Personal_site/`.

Core behavior:

- Interactive canvas hero backdrop with a static fallback.
- Project X-Ray tool for public GitHub repository analysis.
- Portfolio content is centralized in `src/data/profile.ts`.

## Commands

Use these project scripts:

```bash
npm install
npm run dev
npm run test
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

This runs ESLint, Prettier check, Project X-Ray helper tests, TypeScript, and a production Vite build.

## Structure

- `src/App.tsx`: route shell, homepage composition, and top navigation.
- `src/components/ShaderBackdrop.tsx`: WebGL/canvas backdrop variants, themes, parallax, and fallback.
- `src/pages/ProjectXRayPage.tsx`: Project X-Ray input, report rendering, and fallback states.
- `src/xray/`: GitHub URL parsing, browser provider, backend adapter, static analyzer, demo report, and report types.
- `src/data/profile.ts`: editable portfolio content, links, skills, and projects.
- `src/styles.css`: global layout, responsive rules, visual themes, and component styling.

## Implementation Rules

- Keep the hosted site usable as a static GitHub Pages app. Optional backend integrations must be public `VITE_` configuration and must preserve browser/demo fallbacks.
- Do not add secrets or private values to the repo. Only use public `VITE_` env vars if needed.
- Do not put GitHub tokens, AI keys, or private repository credentials in the frontend.
- Use `VITE_XRAY_BACKEND_URL` only for the public Repo Analyzer Service base URL; browser-static and demo fallbacks must keep working.
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
