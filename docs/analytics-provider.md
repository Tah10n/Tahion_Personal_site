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

| Variable                          | Required           | Purpose                                                                                                                                                                                     |
| --------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_ANALYTICS_PROVIDER`         | No                 | `plausible`, `umami`, `custom`, or `none`. Unset with a script URL selects `custom`; unset without one disables tracking. Unknown values select `custom`.                                   |
| `VITE_ANALYTICS_SCRIPT_URL`       | No                 | Public tracker JavaScript URL. The app injects it once with `defer`.                                                                                                                        |
| `VITE_ANALYTICS_SITE_ID`          | Provider-dependent | Domain or website id. Used as `data-domain` for Plausible, `data-website-id` for Umami, and `data-site-id` for custom.                                                                      |
| `VITE_ANALYTICS_DASHBOARD_URL`    | No                 | Public/shared dashboard URL rendered as an iframe in `#/ops`.                                                                                                                               |
| `VITE_ANALYTICS_PUBLIC_STATS_URL` | No                 | Public JSON feed used for native Ops cards/lists.                                                                                                                                           |
| `VITE_ANALYTICS_TRACK_PAGEVIEWS`  | No                 | Defaults to `true`. Sends app-managed pageviews for nonempty hashes, excluding `#/ops`. Set `false` when the provider tracks navigation. This flag does not control provider auto-tracking. |
| `VITE_BUILD_TIME`                 | No                 | Display-only build metadata in `#/ops`.                                                                                                                                                     |
| `VITE_GIT_SHA`                    | No                 | Display-only build metadata in `#/ops`.                                                                                                                                                     |

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
```

5. If you want the embedded provider dashboard in `#/ops`, create a Plausible
   shared link with no password and set:

```text
VITE_ANALYTICS_DASHBOARD_URL=https://plausible.io/share/your-domain.example?auth=...
```

6. Keep `VITE_ANALYTICS_TRACK_PAGEVIEWS=true` if you want the app to send manual
   pageviews for section links such as `#work` and `#contact`. The app excludes `#/ops` from
   those pageviews.

The current frontend injector supports external script tags and provider data
attributes. It does not run arbitrary inline provider initialization code from
env vars. Do not also enable provider-side hash route auto-tracking unless you
set `VITE_ANALYTICS_TRACK_PAGEVIEWS=false`, otherwise hash route pageviews can be
counted twice.

The `script.js` example uses the legacy `data-domain` integration. A provider
snippet that requires `plausible.init(...)` also requires a code integration;
copying only its script URL into the current injector is insufficient.

## Umami

Use Umami when you want a hosted or self-hosted analytics provider.

1. Add the website in Umami and copy its website id.
2. Set:

```text
VITE_ANALYTICS_PROVIDER=umami
VITE_ANALYTICS_SCRIPT_URL=https://analytics.example.com/script.js
VITE_ANALYTICS_SITE_ID=94db1cb1-74f4-4a40-ad6c-962362670409
VITE_ANALYTICS_TRACK_PAGEVIEWS=false
```

3. Keep Umami auto tracking enabled and use the `false` value above to disable
   the app's additional pageviews. Verify that each navigation is counted once.
4. Opening `#/ops` directly does not load the tracker. When navigating there
   after the tracker has loaded, Umami's automatic tracking can still record the
   visit. The app's exclusion applies only to its own manual pageviews.
5. If you expose an Umami share URL or a custom public dashboard URL, set:

```text
VITE_ANALYTICS_DASHBOARD_URL=https://analytics.example.com/share/...
```

The current injector does not set Umami's `data-auto-track`, `data-auto-pageview`,
or `data-before-send` attributes. Using manual pageviews or filtering Ops visits
at the provider requires a code integration; changing the app's pageview flag
alone does not configure those provider features.

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

For app-managed pageviews, implement `window.tahionAnalytics.pageview(url, props)`
or listen for `tahion:pageview`, whose `detail` contains `url` and `title`.
The app sends these only for nonempty hashes outside `#/ops`; tracking a visit
without a hash is the provider's responsibility.

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
  "topPages": [{ "path": "/Tahion_Personal_site/#work", "visitors": 92 }],
  "referrers": [{ "source": "github.com", "visitors": 134 }],
  "events": [{ "name": "project_link_click", "count": 38 }],
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
- `Tracking script` is `Configured` when a script URL is set and the provider is enabled.
- `Stats feed` is `Configured` when `VITE_ANALYTICS_PUBLIC_STATS_URL` is set.
- `Dashboard embed` is `Configured` when `VITE_ANALYTICS_DASHBOARD_URL` is set.
- Opening `#/ops` directly does not install the analytics script.
- With manual tracking enabled, pageviews are sent for `#work` and `#contact`,
  but not for `#/ops`. With provider auto-tracking, verify its routing and filters
  separately and check that pageviews are not duplicated.
- Contact clicks and project link clicks appear in the provider after its normal
  processing delay. Check on the deployed site if the provider excludes localhost.

Before deploy:

```bash
npm run check
```

## Deployment Notes

For GitHub Pages, add only public `VITE_` variables to the build environment.
The static app cannot keep secrets because all bundled frontend variables are
visible to visitors.

The existing workflow reads repository Actions variables named `VITE_ANALYTICS_*`
and sets `VITE_GIT_SHA` from the commit being built. It does not currently set
`VITE_BUILD_TIME`, so that field displays `Unset` in Ops.

To add the build timestamp, insert this step before `Check and build` in
`.github/workflows/deploy.yml`. Writing to `GITHUB_ENV` makes the value available
to subsequent steps:

```yaml
- name: Set build timestamp
  run: echo "VITE_BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> "$GITHUB_ENV"
```

For a local Bash build, export the variables before invoking npm:

```bash
export VITE_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export VITE_GIT_SHA=$(git rev-parse HEAD)
npm run build
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
