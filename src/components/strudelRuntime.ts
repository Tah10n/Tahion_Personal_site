type InitializableRuntime = {
  initStrudel: () => Promise<unknown>;
  initAudio: () => Promise<unknown>;
};

function retryable<T>(initialize: () => Promise<T>) {
  let pending: Promise<T> | null = null;
  return () => {
    pending ??= Promise.resolve()
      .then(initialize)
      .catch((error: unknown) => {
        pending = null;
        throw error;
      });
    return pending;
  };
}

export function createStrudelRuntimeLoader<T extends InitializableRuntime>(
  importRuntime: () => Promise<T>,
) {
  let loadedRuntime: T | undefined;
  const load = retryable(async () => {
    loadedRuntime = await importRuntime();
    return loadedRuntime;
  });
  const initialize = retryable(async () => {
    const runtime = await load();
    await runtime.initStrudel();
    return runtime;
  });
  const ready = retryable(async () => {
    const runtime = await initialize();
    await runtime.initAudio();
    return runtime;
  });

  return { ready, loaded: () => loadedRuntime };
}
