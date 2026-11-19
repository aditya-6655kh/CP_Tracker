import { useEffect, useState } from "react";
import type { Goal } from "../../types";

export default function GoalCard({ goal, busy, onEdit, onDelete }: {
  goal: Goal; busy: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const deadline = new Date(goal.deadline).getTime();
  useEffect(() => {
    if (now >= deadline) return;
    // Long deadlines exceed the browser's maximum timeout; reschedule as needed.
    const timer = setTimeout(() => setNow(Date.now()), Math.min(Math.max(0, deadline - Date.now()), 2147483647));
    return () => clearTimeout(timer);
  }, [deadline, now]);
  const { progress } = goal;
  const labels = { active: "In progress", completed: "Completed", expired: "Deadline passed", unknown: "Progress unverified" };
  return (
    <article className="rounded-lg border border-[#2D2D3F] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Solve {goal.targetCount} unique problems</h3>
        <span className={`text-xs ${progress.status === "completed" ? "text-emerald-300" : "text-slate-400"}`}>{labels[progress.status]}</span>
      </div>
      <p className="mt-2 text-xs text-slate-400">Codeforces · @{goal.cfHandle}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        {new Date(goal.startsAt).toLocaleString()} — {new Date(goal.deadline).toLocaleString()}
      </p>
      <p className="mt-3 text-sm text-slate-200">
        {progress.solvedCount === null ? "Progress unavailable" : `${progress.historyIncomplete ? "At least " : ""}${progress.solvedCount} / ${goal.targetCount} solved`}
      </p>
      {progress.percent !== null && <progress aria-label={`Goal progress for ${goal.cfHandle}`} value={progress.percent} max={100} className="mt-2 h-2 w-full accent-indigo-400" />}
      {progress.message && <p className="mt-2 text-xs leading-relaxed text-amber-300">{progress.message}</p>}
      {progress.checkedAt && <p className="mt-2 text-xs text-slate-500">Stats fetched {new Date(progress.checkedAt).toLocaleString()}</p>}
      <div className="mt-3 flex gap-4 text-xs">
        <button type="button" disabled={busy || deadline <= now} onClick={onEdit}
          className="text-indigo-300 hover:underline disabled:cursor-not-allowed disabled:opacity-40">Edit goal</button>
        <button type="button" disabled={busy} onClick={onDelete} className="text-red-300 hover:underline disabled:opacity-40">Delete goal</button>
      </div>
    </article>
  );
}
