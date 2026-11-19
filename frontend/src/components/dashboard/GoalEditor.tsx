import { useState } from "react";
import type { FormEvent } from "react";
import type { Goal, GoalInput } from "../../types";
import { goalDeadlineToISO, toLocalDateTime } from "../../utilities/goals";

export default function GoalEditor({ goal, handle, busy, onSave, onCancel }: {
  goal: Goal | null; handle: string; busy: boolean;
  onSave: (input: GoalInput, id?: string) => Promise<boolean>; onCancel: () => void;
}) {
  const [target, setTarget] = useState(String(goal?.targetCount ?? 10));
  const [deadline, setDeadline] = useState(() => toLocalDateTime(goal?.deadline ?? new Date(Date.now() + 7 * 86400000).toISOString()));
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const count = Number(target);
    const iso = goalDeadlineToISO(deadline);
    if (!Number.isInteger(count) || count < 1 || count > 1000 || !iso || new Date(iso).getTime() <= Date.now()) {
      setError("Choose a whole-number target from 1 to 1000 and a future deadline.");
      return;
    }
    setError("");
    if (await onSave({ targetCount: count, deadline: iso }, goal?.id)) onCancel();
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-lg border border-indigo-500/30 p-4">
      <p className="text-sm text-white">{goal ? "Edit" : "New"} goal · @{goal?.cfHandle ?? handle}</p>
      <label className="block text-xs text-slate-300">Unique problems
        <input required type="number" min={1} max={1000} step={1} value={target} onChange={e => setTarget(e.target.value)} disabled={busy}
          className="mt-2 block w-full rounded border border-[#2D2D3F] bg-[#0A0A0F] p-2 text-white" />
      </label>
      <label className="block text-xs text-slate-300">Deadline (your local time)
        <input required type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} disabled={busy}
          className="mt-2 block w-full rounded border border-[#2D2D3F] bg-[#0A0A0F] p-2 text-white [color-scheme:dark]" />
      </label>
      <p className="text-xs leading-relaxed text-slate-400">{goal ? "The original start time and handle stay attached to this goal." : "Tracking starts when you save. Each distinct problem accepted before the deadline counts once, including previously solved problems you solve again."}</p>
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      <div className="flex gap-4 text-xs">
        <button disabled={busy} type="submit" className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-40">{busy ? "Saving…" : "Save goal"}</button>
        <button disabled={busy} type="button" onClick={onCancel} className="text-slate-300">Cancel</button>
      </div>
    </form>
  );
}
