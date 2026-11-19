import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import * as api from "../api/goals.api";
import { useStats } from "../context/stats-context";
import type { Goal, GoalInput } from "../types";

function errorMessage(error: unknown) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? "Could not load or save goals. Please try again."
    : "Could not load or save goals. Please try again.";
}

export function useGoals() {
  const { cfStats } = useStats();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const forceNext = useRef(false);
  const requestId = useRef(0);

  const refresh = useCallback((force = false) => {
    requestId.current++;
    forceNext.current = force || forceNext.current;
    setLoading(true);
    setError("");
    setVersion(value => value + 1);
  }, []);

  useEffect(() => {
    const requests = requestId;
    const id = ++requests.current;
    const force = forceNext.current;
    // Preserve a forced refresh if a stats update replaces this read.
    api.getGoals(force)
      .then(data => {
        if (requests.current !== id) return;
        setGoals(data);
        setError("");
      })
      .catch((err: unknown) => { if (requests.current === id) setError(errorMessage(err)); })
      .finally(() => {
        if (requests.current === id) { forceNext.current = false; setLoading(false); }
      });
    return () => { requests.current++; };
  }, [version, cfStats]);

  async function mutate(action: () => Promise<void>) {
    if (busy) return false;
    setBusy(true);
    setError("");
    // A read begun before a mutation must not replace its refreshed results.
    requestId.current++;
    try {
      await action();
      refresh();
      return true;
    } catch (err: unknown) {
      setError(errorMessage(err));
      setLoading(false);
      return false;
    } finally { setBusy(false); }
  }

  return { goals, loading, busy, error, refresh,
    save: (input: GoalInput, id?: string) => mutate(() => id ? api.updateGoal(id, input) : api.createGoal(input)),
    remove: (id: string) => mutate(() => api.deleteGoal(id)),
  };
}
