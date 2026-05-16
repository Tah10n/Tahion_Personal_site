import type { RepoInput, XRayProvider, XRayReport } from "../types";

const xrayApiPath = "/api/xray";

export function resolveXrayEndpoint(value = xrayApiPath) {
  const trimmed = value.trim();

  if (!trimmed) {
    return xrayApiPath;
  }

  const normalized = trimmed.replace(/\/+$/, "");
  return normalized.endsWith(xrayApiPath) ? normalized : `${normalized}${xrayApiPath}`;
}

export class BackendXrayProvider implements XRayProvider {
  private readonly endpoint: string;

  constructor(endpointOrBaseUrl = xrayApiPath) {
    this.endpoint = resolveXrayEndpoint(endpointOrBaseUrl);
  }

  async inspect(input: RepoInput): Promise<XRayReport> {
    const requestUrl = new URL(this.endpoint, window.location.origin);
    requestUrl.searchParams.set("repo", input.url);

    const response = await fetch(requestUrl.toString());

    if (!response.ok) {
      throw new Error(`Backend X-Ray request failed with status ${response.status}.`);
    }

    return (await response.json()) as XRayReport;
  }
}
