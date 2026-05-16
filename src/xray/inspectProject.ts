import type { RepoInput, RepoSnapshot, XRayProvider, XRayReport } from "./types";

export type InspectProjectResult = {
  result: RepoSnapshot | XRayReport;
  notice?: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error.";
}

export async function inspectProjectWithFallback(
  input: RepoInput,
  backendProvider: XRayProvider | null,
  browserProvider: XRayProvider,
): Promise<InspectProjectResult> {
  if (!backendProvider) {
    return {
      result: await browserProvider.inspect(input),
    };
  }

  try {
    return {
      result: await backendProvider.inspect(input),
    };
  } catch (backendError) {
    try {
      return {
        result: await browserProvider.inspect(input),
        notice: `Backend X-Ray was unavailable (${errorMessage(
          backendError,
        )}). Rendered the browser-static fallback instead.`,
      };
    } catch (fallbackError) {
      throw new Error(
        `Backend X-Ray failed (${errorMessage(
          backendError,
        )}). Browser fallback also failed (${errorMessage(fallbackError)}).`,
        { cause: fallbackError },
      );
    }
  }
}
