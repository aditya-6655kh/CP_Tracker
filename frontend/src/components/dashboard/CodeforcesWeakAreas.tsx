import type { CodeforcesTopicAnalytics } from "../../types";

export default function CodeforcesWeakAreas({ analytics }: {
  analytics: CodeforcesTopicAnalytics | undefined;
}) {
  // Support an older response while frontend/backend deployments overlap.
  if (!analytics) {
    return <section className="mt-6 rounded-xl border border-[#2D2D3F] bg-[#12121A] p-6">
      <h3 className="font-mono text-sm font-semibold text-white">Topic weak areas</h3>
      <p className="mt-3 font-mono text-xs text-slate-400">Topic analytics are unavailable. Try refreshing your stats.</p>
    </section>;
  }

  const { topics, minimumAttemptedProblems, weakSolveRateThreshold } = analytics;
  const weakCount = topics.filter(topic => topic.status === "weak").length;
  const hasEnoughData = topics.some(topic => topic.status !== "insufficient-data");
  const statusLabels = {
    weak: "Needs practice",
    "insufficient-data": "Insufficient data",
    "not-flagged": "Not flagged",
  };

  return (
    <section className="mt-6 rounded-xl border border-[#2D2D3F] bg-[#12121A] p-6 font-mono">
      <h3 className="text-sm font-semibold text-white">Topic weak areas</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        Topics with at least {minimumAttemptedProblems} attempted problems and a problem solve rate below {weakSolveRateThreshold * 100}% are flagged for practice.
        This is a practice signal; problem difficulty and recency are not taken into account.
      </p>
      <p className="mt-3 text-sm text-slate-300">
        {topics.length === 0
          ? "No eligible tagged problems yet. Solve or attempt tagged Codeforces problems to see topic insights."
          : !hasEnoughData
            ? `Not enough data yet: attempt at least ${minimumAttemptedProblems} distinct problems in a topic.`
            : weakCount === 0
              ? "No topics are flagged in the available history."
              : `${weakCount} ${weakCount === 1 ? "topic needs" : "topics need"} practice in the available history.`}
      </p>
      {topics.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Codeforces topic problem solve rates</caption>
            <thead className="border-b border-[#2D2D3F] text-slate-400">
              <tr>{["Topic", "Attempted", "Solved", "Solve rate", "Signal"].map(label =>
                <th key={label} scope="col" className="px-3 py-3 font-medium first:pl-0">{label}</th>)}</tr>
            </thead>
            <tbody>
              {topics.map(topic => (
                <tr key={topic.tag} className="border-b border-[#2D2D3F]/60 last:border-0">
                  <th scope="row" className="py-3 pr-3 font-medium text-white">{topic.tag}</th>
                  <td className="px-3 py-3 tabular-nums text-slate-300">{topic.attemptedProblems}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-300">{topic.solvedProblems}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-300">{(topic.solveRate * 100).toFixed(1)}%</td>
                  <td className={`whitespace-nowrap px-3 py-3 ${topic.status === "weak" ? "text-amber-300" : "text-slate-400"}`}>
                    {statusLabels[topic.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        Based on {analytics.submissionsFetched.toLocaleString()} fetched submissions; {analytics.excludedSubmissions.toLocaleString()} excluded because of verdict, missing problem identity, or missing tags.
        Retries count once per problem; any accepted attempt marks it solved. Multi-tag problems count in each topic, so topic totals overlap.
      </p>
      {analytics.possiblyTruncated && (
        <p className="mt-3 text-xs leading-relaxed text-amber-300">
          The 10,000-submission limit was reached. Older attempts or accepted solutions may be missing; these results may not cover your full history.
        </p>
      )}
    </section>
  );
}
