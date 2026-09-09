import { analyticsConfig } from "./config";
import { createAnalyticsTracker, type AnalyticsEventProps } from "./eventTracker";
import { isAnalyticsExcludedHash } from "./pageviews";

export function trackEvent(eventName: string, props: AnalyticsEventProps = {}) {
  if (typeof window === "undefined") {
    return;
  }

  if (isAnalyticsExcludedHash(window.location.hash)) {
    return;
  }

  createAnalyticsTracker(analyticsConfig, window)(eventName, props);
}
