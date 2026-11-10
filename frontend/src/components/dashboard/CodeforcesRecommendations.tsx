import type { CodeforcesRecommendations as Recommendations } from "../../types";

export default function CodeforcesRecommendations({ recommendations }: {
  recommendations: Recommendations | undefined;
}) {
  return (
    <section className="mt-6 rounded-xl border border-[#2D2D3F] bg-[#12121A] p-6 font-mono">
      <h3 className="text-sm font-semibold text-white">Recommended practice</h3>
      {!recommendations || recommendations.status === "unavailable" ? (
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Recommendations are temporarily unavailable. Your stats are still available; use Refresh to try again.
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {recommendations.mode === "weak-topics"
              ? `Practice for your weakest topics: ${recommendations.weakTags.join(", ")}.`
              : "General practice: no weak topics are currently flagged in your available history."}
            {" "}Problem ratings {recommendations.minRating}–{recommendations.maxRating}, closest to {recommendations.targetRating} first within each topic.
            {recommendations.usedDefaultRating && " No contest rating is available, so the starting target is 1000."}
          </p>
          {recommendations.items.length === 0 ? (
            <p className="mt-4 text-sm text-slate-300">
              No matching problems were found in this rating range after excluding your known solves.
            </p>
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {recommendations.items.map(problem => (
                <li key={problem.id} className="rounded-lg border border-[#2D2D3F] p-4">
                  <a href={problem.url} target="_blank" rel="noopener noreferrer"
                    className="break-words text-sm font-medium text-indigo-300 underline-offset-4 hover:underline focus-visible:underline">
                    {problem.contestId}{problem.index} · {problem.name}
                    <span className="sr-only"> (opens Codeforces in a new tab)</span>
                  </a>
                  <p className="mt-2 text-xs text-slate-300">Rating {problem.rating} · {problem.previouslyAttempted ? "Previously attempted" : "Not attempted in fetched history"}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    {problem.matchedWeakTags.length > 0
                      ? `Targets: ${problem.matchedWeakTags.join(", ")}`
                      : `Topics: ${problem.tags.join(", ") || "Unspecified"}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            Accepted problems in your fetched history are excluded. Refresh after solving to update your suggestions.
          </p>
          {recommendations.historyPossiblyTruncated && (
            <p className="mt-2 text-xs leading-relaxed text-amber-300">
              Your history reached the 10,000-submission limit. A suggested problem may have been solved in older history.
            </p>
          )}
        </>
      )}
    </section>
  );
}
