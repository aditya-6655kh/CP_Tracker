import { useState } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "../../context/profile-context";
import { useGoals } from "../../hooks/useGoals";
import type { Goal } from "../../types";
import GoalCard from "./GoalCard";
import GoalEditor from "./GoalEditor";

export default function GoalsSection() {
  const { profile } = useProfile();
  const { goals, loading, busy, error, refresh, save, remove } = useGoals();
  const [editor, setEditor] = useState<Goal | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  return (
    <section className="mt-6 rounded-xl border border-[#2D2D3F] bg-[#12121A] p-6 font-mono" aria-label="Codeforces goals">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Codeforces goals</h2>
        <div className="flex gap-4 text-xs">
          <button disabled={loading || busy} onClick={() => refresh(true)} className="text-slate-300 hover:text-white disabled:opacity-40">{loading ? "Loading…" : "Refresh progress"}</button>
          <button disabled={!profile?.cfHandle || busy} onClick={() => setEditor("new")} className="text-indigo-300 hover:underline disabled:opacity-40">New goal</button>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">Set a target and deadline. Goals keep their original handle even if you change your profile.</p>
      {!profile?.cfHandle && <p className="mt-3 text-xs text-slate-300"><Link to="/profile" className="text-indigo-300 underline">Link a Codeforces handle</Link> to create a goal.</p>}
      {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
      {editor && <GoalEditor key={editor === "new" ? "new" : editor.id} goal={editor === "new" ? null : editor}
        handle={profile?.cfHandle ?? ""} busy={busy} onSave={save} onCancel={() => setEditor(null)} />}
      {!loading && !error && goals.length === 0 && <p className="mt-4 text-sm text-slate-400">No goals yet. Start with a target for the next seven days.</p>}
      <div className="mt-4 space-y-3">
        {goals.map(goal => <div key={goal.id}>
          <GoalCard goal={goal} busy={busy} onEdit={() => setEditor(goal)} onDelete={() => setDeleting(goal.id)} />
          {deleting === goal.id && <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span>Delete this goal?</span>
            <button disabled={busy} onClick={async () => { if (await remove(goal.id)) { setDeleting(null); if (editor !== "new" && editor?.id === goal.id) setEditor(null); } }} className="text-red-300">Delete</button>
            <button disabled={busy} onClick={() => setDeleting(null)}>Keep goal</button>
          </div>}
        </div>)}
      </div>
    </section>
  );
}
