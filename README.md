# Tahion Personal Site

Andrei Surkov's personal portfolio: selected projects, contact links, a rotating
ASCII backdrop, and a playable Strudel soundtrack. Built with React, TypeScript,
and Vite; deployed as a static site on GitHub Pages.

**[Visit the portfolio](https://tah10n.github.io/Tahion_Personal_site/)** ·
[Deployment runs](https://github.com/Tah10n/Tahion_Personal_site/actions/workflows/deploy.yml)

## What is inside

- **Project portfolio** with descriptions, technology stacks, and links to the work.
- **ASCII shapes** rendered with Canvas 2D: torus, cube, pyramid, and rubber duck.
  The backdrop stays visible while scrolling, and the selected shape is saved locally.
- **Compact controls** for shape selection, music, Work, and Contact, with responsive layouts.
- **On-demand audio** powered by Strudel. Playback starts through the player controls.
- **Motion preferences and fallback rendering** for reduced-motion settings and
  browsers where a Canvas 2D context is unavailable.
- **Optional analytics** for pageviews, project links, contact clicks, and player actions.

The portfolio does not require a backend or an analytics account to run.
Project X-Ray is listed as a separate project in development; its analysis page
is not part of the active site. Old `#/xray` links redirect to Work.

## Run locally

Use the Node.js version pinned in [.nvmrc](.nvmrc) and [.node-version](.node-version):
`24.15.0`. The package requires Node.js `>=22.12.0` and npm `>=10.0.0`.

```bash
git clone https://github.com/Tah10n/Tahion_Personal_site.git
cd Tahion_Personal_site
npm ci
npm run dev
```

Open [the local site](http://127.0.0.1:5173/Tahion_Personal_site/).
No environment file is needed for the portfolio itself.

To inspect a production build locally:

```bash
npm run build
npm run preview
```

Open [the production preview](http://127.0.0.1:4173/Tahion_Personal_site/).
Keep the `/Tahion_Personal_site/` prefix in both URLs.

## Edit the site

| What to change                                            | File                                                                   |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| Profile, project cards, social links, and contact details | [src/data/profile.ts](src/data/profile.ts)                             |
| Soundtrack pattern and metadata                           | [src/data/strudelSoundtrack.ts](src/data/strudelSoundtrack.ts)         |
| Page composition, navigation, and hash routes             | [src/App.tsx](src/App.tsx)                                             |
| Colors, typography, layout, and responsive rules          | [src/styles.css](src/styles.css)                                       |
| Canvas animation and ASCII rendering                      | [src/components/ShaderBackdrop.tsx](src/components/ShaderBackdrop.tsx) |
| Cube and pyramid geometry                                 | [src/components/asciiPolyhedra.ts](src/components/asciiPolyhedra.ts)   |
| Duck geometry                                             | [src/components/asciiDuck.ts](src/components/asciiDuck.ts)             |
| Browser title and HTML metadata                           | [index.html](index.html)                                               |
| Hosting base path                                         | [vite.config.ts](vite.config.ts)                                       |

Project cards and contact links come from the profile data, so most content edits
do not require changes to the page components.

## Checks

Run the full check before publishing:

```bash
npm run check
```

It runs ESLint, Prettier checks, the Node test suite, TypeScript checking, and a
production Vite build. Tests cover analytics configuration and tracking, ASCII
geometry, audio runtime recovery, and retained X-Ray provider helpers.

| Command                | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Start the local development server          |
| `npm run test`         | Run the Node test suite                     |
| `npm run lint`         | Check code with ESLint                      |
| `npm run typecheck`    | Check TypeScript without building           |
| `npm run format:check` | Check repository formatting                 |
| `npm run format`       | Apply Prettier formatting                   |
| `npm run build`        | Check TypeScript and build into `dist/`     |
| `npm run preview`      | Serve the existing production build locally |
| `npm run check`        | Run all required checks and build           |

For visual changes, also check a narrow viewport, shape switching, scrolling,
player controls, and reduced-motion behavior in a browser.

## Deploy to GitHub Pages

The [deployment workflow](.github/workflows/deploy.yml) runs on pushes to `main`
and supports manual runs from GitHub Actions. It installs locked dependencies
with `npm ci`, runs `npm run check`, and deploys the generated `dist/` artifact.

For a new repository or fork:

1. Set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.
2. Check `base` in `vite.config.ts`. This repository uses `/Tahion_Personal_site/`;
   a different repository name or custom domain may need a different base path.
3. Run `npm run check` locally, then push to `main`.
4. Wait for both the `build` and `deploy` jobs to succeed in Actions.
5. Open the published URL and verify navigation, backdrop, and audio controls.

Do not commit `dist/` or `node_modules/`; both are ignored. After changing the
hosting base path, rebuild and verify the production preview as well.

## Analytics

The published portfolio uses Umami Cloud. Real statistics are viewed in the
owner's [Umami account](https://cloud.umami.is/) after signing in.
The public `#/ops` route is **not connected to live statistics** and currently
shows demo data. It has no authentication; an unlisted route is still public.

Tracking is optional. A fresh checkout runs without it. For your own Umami site,
use these public values in `.env.local` during local development:

```dotenv
VITE_ANALYTICS_PROVIDER=umami
VITE_ANALYTICS_SCRIPT_URL=https://cloud.umami.is/script.js
VITE_ANALYTICS_SITE_ID=your-umami-website-id
VITE_ANALYTICS_TRACK_PAGEVIEWS=false
```

For GitHub Pages, add the same values under **Settings → Secrets and variables →
Actions → Variables**. The workflow reads repository variables at build time;
run a new deployment after changing them. Restart Vite after local env changes.

The `false` setting disables the app's additional pageviews while Umami handles
automatic tracking, avoiding duplicate counts. Custom interaction events remain enabled.
Adding the tracking configuration does not make the provider dashboard public.

Leave `VITE_ANALYTICS_DASHBOARD_URL` and `VITE_ANALYTICS_PUBLIC_STATS_URL` unset
to keep live analytics out of `#/ops`. Every `VITE_` value used by the frontend is
public in the built site: never use these variables for API keys, passwords, or
private tokens. Ignoring `.env.local` in Git does not make bundled values secret.

See [.env.example](.env.example) and the
[analytics integration guide](docs/analytics-provider.md) for the available
provider adapters and optional public dashboard integrations.
