# Analytics Provider Setup

The hidden Ops dashboard lives at:

```text
#/ops
```

It is a static GitHub Pages page, not a private admin area. Treat everything
shown there as public-safe. Do not put provider API keys, GitHub tokens, AI
keys, passwords, or private analytics secrets in frontend environment variables.

## How It Works

Analytics support has three independent pieces:

- tracking script injection from public `VITE_` environment variables
- custom event forwarding through `trackEvent(...)`
- optional Ops dashboard data through a public aggregate JSON URL or an embedded
  provider dashboard URL

If no analytics env is configured, the site still works and `#/ops` shows demo
telemetry.

## Environment Variables

Create `.env.local` for local testing, or configure these values in the GitHub
Pages build environment.

```text
VITE_ANALYTICS_PROVIDER=plausible
VITE_ANALYTICS_SCRIPT_URL=https://plausible.io/js/script.js
VITE_ANALYTICS_SITE_ID=example.com
VITE_ANALYTICS_DASHBOARD_URL=https://plausible.io/share/example.com?auth=public-share-token
VITE_ANALYTICS_PUBLIC_STATS_URL=https://example.com/portfolio-stats.json
VITE_ANALYTICS_TRACK_PAGEVIEWS=true
VITE_BUILD_TIME=2026-06-17T00:00:00.000Z
VITE_GIT_SHA=local
```

| Variable                          | Required           | Purpose                                                                                                                                  |
| --------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_ANALYTICS_PROVIDER`         | No                 | `plausible`, `umami`, `custom`, or unset/`none`. Unknown values are treated as `custom`.                                                 |
| `VITE_ANALYTICS_SCRIPT_URL`       | No                 | Public tracker JavaScript URL. The app injects it once with `defer`.                                                                     |
| `VITE_ANALYTICS_SITE_ID`          | Provider-dependent | Domain or website id. Used as `data-domain` for Plausible, `data-website-id` for Umami, and `data-site-id` for custom.                   |
| `VITE_ANALYTICS_DASHBOARD_URL`    | No                 | Public/shared dashboard URL rendered as an iframe in `#/ops`.                                                                            |
| `VITE_ANALYTICS_PUBLIC_STATS_URL` | No                 | Public JSON feed used for native Ops cards/lists.                                                                                        |
| `VITE_ANALYTICS_TRACK_PAGEVIEWS`  | No                 | Defaults to `true`. Sends manual pageviews for hash routes and excludes `#/ops`. Set `false` if the provider handles SPA routing itself. |
| `VITE_BUILD_TIME`                 | No                 | Display-only build metadata in `#/ops`.                                                                                                  |
| `VITE_GIT_SHA`                    | No                 | Display-only build metadata in `#/ops`.                                                                                                  |

The script URL must be only a URL. Do not paste a full `<script>` snippet into
`.env.local`.

## Plausible

Use Plausible when you want a hosted, lightweight analytics provider with a
shareable dashboard.

1. Add the deployed site domain in Plausible.
2. Copy the public script URL from Plausible's installation snippet.
3. Set:

```text
VITE_ANALYTICS_PROVIDER=plausible
VITE_ANALYTICS_SCRIPT_URL=https://plausible.io/js/script.js
VITE_ANALYTICS_SITE_ID=your-domain.example
```

4. In Plausible, create custom event goals for the events this site emits:

```text
contact_click
project_link_click
xray_run
xray_demo_open
```

5. If you want the embedded provider dashboard in `#/ops`, create a Plausible
   shared link with no password and set:

```text
VITE_ANALYTICS_DASHBOARD_URL=https://plausible.io/share/your-domain.example?auth=...
```

6. Keep `VITE_ANALYTICS_TRACK_PAGEVIEWS=true` if you want the app to send manual
   pageviews for hash routes such as `#/xray`. The app excludes `#/ops` from
   those pageviews.

The current frontend injector supports external script tags and provider data
attributes. It does not run arbitrary inline provider initialization code from
env vars. Do not also enable provider-side hash route auto-tracking unless you
set `VITE_ANALYTICS_TRACK_PAGEVIEWS=false`, otherwise hash route pageviews can be
counted twice.

## Umami

Use Umami when you want a hosted or self-hosted analytics provider.

1. Add the website in Umami and copy its website id.
2. Set:

```text
VITE_ANALYTICS_PROVIDER=umami
VITE_ANALYTICS_SCRIPT_URL=https://analytics.example.com/script.js
VITE_ANALYTICS_SITE_ID=94db1cb1-74f4-4a40-ad6c-962362670409
```

3. Keep Umami auto tracking enabled unless you have a reason to disable it.
4. Keep `VITE_ANALYTICS_TRACK_PAGEVIEWS=true` if you want the app to send manual
   pageviews for hash routes and exclude `#/ops`. If you prefer Umami's own SPA
   routing behavior, set `VITE_ANALYTICS_TRACK_PAGEVIEWS=false` and configure
   that behavior in Umami instead.
5. If you expose an Umami share URL or a custom public dashboard URL, set:

```text
VITE_ANALYTICS_DASHBOARD_URL=https://analytics.example.com/share/...
```

## Custom Provider

Use `custom` when the provider exposes a global tracker compatible with:

```ts
window.tahionAnalytics?.track(eventName, props);
```

Set:

```text
VITE_ANALYTICS_PROVIDER=custom
VITE_ANALYTICS_SCRIPT_URL=https://analytics.example.com/client.js
VITE_ANALYTICS_SITE_ID=tahion-personal-site
```

If no `window.tahionAnalytics.track` function exists, the app dispatches a
browser event instead:

```ts
window.addEventListener("tahion:analytics", (event) => {
  console.log(event.detail.name, event.detail.props);
});
```

## Public Stats Feed

`#/ops` can render native cards from a public aggregate JSON feed. This is useful
when the provider API requires a private key that cannot be exposed in the
frontend. Put that private-key call in a backend, scheduled job, GitHub Action,
or static JSON publishing step, then expose only aggregate data.

Set:

```text
VITE_ANALYTICS_PUBLIC_STATS_URL=https://example.com/portfolio-stats.json
```

Expected JSON shape:

```json
{
  "windowLabel": "7d",
  "visitors": 384,
  "pageviews": 927,
  "traffic": [
    { "label": "Jun 16", "visitors": 58, "pageviews": 142 },
    { "label": "Jun 17", "visitors": 67, "pageviews": 156 }
  ],
  "topPages": [{ "path": "/#/xray", "visitors": 92 }],
  "referrers": [{ "source": "github.com", "visitors": 134 }],
  "events": [{ "name": "xray_run", "count": 38 }],
  "updatedAt": "2026-06-17T00:00:00.000Z"
}
```

`traffic` is optional and drives the native visit charts. If omitted, the cards
and lists still render, while the chart panels show an empty time-series state.
Each point can use either `label` or `date`; only aggregate visitor/pageview
counts should be published.

The frontend validates this defensively. If the feed is unavailable or malformed,
`#/ops` falls back to demo telemetry.

## Local Verification

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/Tahion_Personal_site/#/ops
```

Check:

- Ops route renders without appearing in the public nav.
- `Public-safe mode` shows the expected provider.
- `Tracking script` is `Configured` when `VITE_ANALYTICS_SCRIPT_URL` is set.
- `Stats feed` is `Configured` when `VITE_ANALYTICS_PUBLIC_STATS_URL` is set.
- `Dashboard embed` is `Configured` when `VITE_ANALYTICS_DASHBOARD_URL` is set.
- Opening `#/ops` directly does not install the analytics script.
- Manual pageviews are sent for hash routes such as `#/xray`, but not for
  `#/ops`.
- Contact clicks, project link clicks, X-Ray runs, and demo opens appear in the
  provider after the provider's normal processing delay.

Before deploy:

```bash
npm run check
```

## Deployment Notes

For GitHub Pages, add only public `VITE_` variables to the build environment.
The static app cannot keep secrets because all bundled frontend variables are
visible to visitors.

If using GitHub Actions, populate build metadata during the Vite build, for
example:

```bash
VITE_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VITE_GIT_SHA=$GITHUB_SHA
```

After deploy, open the production URL:

```text
https://<user-or-org>.github.io/Tahion_Personal_site/#/ops
```

Then verify that the provider receives pageviews and the Ops dashboard shows
the expected configured/demo state.

## References

- Plausible script installation: https://plausible.io/docs/plausible-script
- Plausible custom events: https://plausible.io/docs/custom-event-goals
- Plausible hash page paths: https://plausible.io/docs/hash-based-routing
- Plausible dashboard embeds: https://plausible.io/docs/embed-dashboard
- Umami tracker configuration: https://docs.umami.is/docs/tracker-configuration
