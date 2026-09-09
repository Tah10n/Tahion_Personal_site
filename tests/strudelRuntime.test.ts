import assert from "node:assert/strict";
import test from "node:test";
import { createStrudelRuntimeLoader } from "../src/components/strudelRuntime.ts";

for (const failedStage of ["import", "strudel", "audio"] as const) {
  test(`player retries a failed ${failedStage} stage and keeps successful initialization`, async () => {
    const calls = { import: 0, strudel: 0, audio: 0 };
    const run = async (stage: typeof failedStage) => {
      calls[stage]++;
      if (stage === failedStage && calls[stage] === 1) {
        throw new Error("Temporary failure");
      }
    };
    const runtime = {
      initStrudel: () => run("strudel"),
      initAudio: () => run("audio"),
    };
    const loader = createStrudelRuntimeLoader(async () => {
      await run("import");
      return runtime;
    });

    assert.equal(loader.loaded(), undefined);
    await assert.rejects(loader.ready(), /Temporary failure/);
    assert.equal(await loader.ready(), runtime);
    assert.equal(await loader.ready(), runtime);
    assert.equal(loader.loaded(), runtime);
    assert.deepEqual(calls, {
      import: failedStage === "import" ? 2 : 1,
      strudel: failedStage === "strudel" ? 2 : 1,
      audio: failedStage === "audio" ? 2 : 1,
    });
  });
}

test("concurrent playback requests share runtime initialization", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const calls = { import: 0, strudel: 0, audio: 0 };
  const runtime = {
    initStrudel: async () => {
      calls.strudel++;
    },
    initAudio: async () => {
      calls.audio++;
    },
  };
  const loader = createStrudelRuntimeLoader(async () => {
    calls.import++;
    await gate;
    return runtime;
  });
  const first = loader.ready();
  const second = loader.ready();
  release();
  assert.deepEqual(await Promise.all([first, second]), [runtime, runtime]);
  assert.deepEqual(calls, { import: 1, strudel: 1, audio: 1 });
});
