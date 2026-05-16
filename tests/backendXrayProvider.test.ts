import assert from "node:assert/strict";
import test from "node:test";
import { demoXrayReport } from "../src/xray/demoReport.ts";
import { inspectProjectWithFallback } from "../src/xray/inspectProject.ts";
import { resolveXrayEndpoint } from "../src/xray/providers/backendXrayProvider.ts";
import { BackendXrayProvider } from "../src/xray/providers/backendXrayProvider.ts";
import type { RepoInput, XRayProvider, XRayReport } from "../src/xray/types.ts";

const repoInput: RepoInput = {
  owner: "Tah10n",
  repo: "pocket-ai",
  url: "https://github.com/Tah10n/pocket-ai",
};

const backendReport: XRayReport = {
  ...demoXrayReport,
  mode: "backend-ai",
};

function defineBrowserWindow(origin = "https://tahion.example") {
  Object.defineProperty(globalThis, "window", {
    value: {
      location: { origin },
    },
    configurable: true,
  });
}

function providerReturning(result: XRayReport): XRayProvider {
  return {
    async inspect() {
      return result;
    },
  };
}

function providerFailing(message: string): XRayProvider {
  return {
    async inspect() {
      throw new Error(message);
    },
  };
}

test("resolves backend base urls to the X-Ray API endpoint", () => {
  assert.equal(resolveXrayEndpoint("https://service.example"), "https://service.example/api/xray");
  assert.equal(resolveXrayEndpoint("https://service.example/"), "https://service.example/api/xray");
  assert.equal(
    resolveXrayEndpoint("https://service.example/api/xray"),
    "https://service.example/api/xray",
  );
});

test("falls back to the relative X-Ray endpoint when unset", () => {
  assert.equal(resolveXrayEndpoint(""), "/api/xray");
  assert.equal(resolveXrayEndpoint("   "), "/api/xray");
  assert.equal(resolveXrayEndpoint(), "/api/xray");
});

test("backend provider fetches the configured X-Ray endpoint", async () => {
  defineBrowserWindow();
  const requests: string[] = [];
  const originalFetch = globalThis.fetch;

  Object.defineProperty(globalThis, "fetch", {
    value: async (url: RequestInfo | URL) => {
      requests.push(String(url));
      return new Response(JSON.stringify(backendReport), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
    configurable: true,
  });

  try {
    const result = await new BackendXrayProvider("https://service.example").inspect(repoInput);

    assert.deepEqual(result, backendReport);
    assert.deepEqual(requests, [
      "https://service.example/api/xray?repo=https%3A%2F%2Fgithub.com%2FTah10n%2Fpocket-ai",
    ]);
  } finally {
    Object.defineProperty(globalThis, "fetch", {
      value: originalFetch,
      configurable: true,
    });
  }
});

test("uses backend report without fallback notice when backend succeeds", async () => {
  const result = await inspectProjectWithFallback(
    repoInput,
    providerReturning(backendReport),
    providerReturning(demoXrayReport),
  );

  assert.equal(result.result, backendReport);
  assert.equal(result.notice, undefined);
});

test("falls back to browser-static report when backend fails", async () => {
  const result = await inspectProjectWithFallback(
    repoInput,
    providerFailing("service unavailable"),
    providerReturning(demoXrayReport),
  );

  assert.equal(result.result, demoXrayReport);
  assert.match(result.notice ?? "", /Backend X-Ray was unavailable \(service unavailable\)/);
});

test("reports both backend and browser-static failures", async () => {
  await assert.rejects(
    inspectProjectWithFallback(
      repoInput,
      providerFailing("service unavailable"),
      providerFailing("rate limited"),
    ),
    /Backend X-Ray failed \(service unavailable\). Browser fallback also failed \(rate limited\)./,
  );
});
