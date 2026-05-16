import { RepoInput, XRayProvider, XRayReport } from "../types";

export class BackendXrayProvider implements XRayProvider {
  constructor(private readonly endpoint = "/api/xray") {}

  async inspect(input: RepoInput): Promise<XRayReport> {
    const response = await fetch(`${this.endpoint}?repo=${encodeURIComponent(input.url)}`);

    if (!response.ok) {
      throw new Error(`Backend X-Ray request failed with status ${response.status}.`);
    }

    return (await response.json()) as XRayReport;
  }
}
