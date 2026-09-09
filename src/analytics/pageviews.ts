import { analyticsConfig } from "./config";
import {
  createPageviewTracker,
  isAnalyticsExcludedHash,
  resolveManualPageviewUrl,
  type LocationLike,
} from "./pageviewTracker";

export { createPageviewTracker, isAnalyticsExcludedHash, resolveManualPageviewUrl };

export function trackPageviewForLocation(
  location: LocationLike = window.location,
  target: Window | undefined = typeof window === "undefined" ? undefined : window,
) {
  createPageviewTracker(analyticsConfig, target)(
    resolveManualPageviewUrl(location),
    typeof document === "undefined" ? "" : document.title,
  );
}
