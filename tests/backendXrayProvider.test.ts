import assert from "node:assert/strict";
import test from "node:test";
import { resolveXrayEndpoint } from "../src/xray/providers/backendXrayProvider.ts";

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
