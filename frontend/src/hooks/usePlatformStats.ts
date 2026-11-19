import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../utilities/api-error";

/** Session data stays with the provider; each handle/refresh has its own identity. */
export function usePlatformStats<T>(
  handle: string | null | undefined,
  fetchStats: (force?: boolean) => Promise<T>,
  fallbackError: string,
) {
  const [request, setRequest] = useState({ version: 0, handle, force: false });
  const key = useMemo(() => ({ handle, version: request.version }), [handle, request.version]);
  const [result, setResult] = useState<{
    key: typeof key; stats: T | null; error: string;
  } | null>(null);
  const force = request.handle === handle && request.force;

  useEffect(() => {
    if (!handle) return;
    let active = true;
    fetchStats(force)
      .then(stats => { if (active) setResult({ key, stats, error: "" }); })
      .catch((error: unknown) => {
        if (active) setResult(previous => ({ key,
          stats: previous?.key.handle === handle ? previous.stats : null,
          error: getApiErrorMessage(error, fallbackError),
        }));
      });
    return () => { active = false; };
  }, [handle, key, force, fetchStats, fallbackError]);

  const refresh = useCallback(() => {
    setRequest(previous => ({ version: previous.version + 1, handle, force: true }));
  }, [handle]);
  const current = result?.key === key;
  return {
    stats: handle && result?.key.handle === handle ? result.stats : null,
    loading: Boolean(handle && !current),
    error: handle && current ? result.error : "",
    refresh,
  };
}
