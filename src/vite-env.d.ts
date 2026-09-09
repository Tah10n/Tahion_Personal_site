/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_XRAY_BACKEND_URL?: string;
  readonly VITE_ANALYTICS_PROVIDER?: string;
  readonly VITE_ANALYTICS_SCRIPT_URL?: string;
  readonly VITE_ANALYTICS_SITE_ID?: string;
  readonly VITE_ANALYTICS_DASHBOARD_URL?: string;
  readonly VITE_ANALYTICS_PUBLIC_STATS_URL?: string;
  readonly VITE_ANALYTICS_TRACK_PAGEVIEWS?: string;
  readonly VITE_BUILD_TIME?: string;
  readonly VITE_GIT_SHA?: string;
}
