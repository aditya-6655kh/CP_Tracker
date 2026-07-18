import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useLeetcodeStats } from "../hooks/useLeetcodeStats";
import { useCodeforcesStats } from "../hooks/useCodeforcesStats";
import { getRankColor } from "../utilities/codeforces";
import { ArrowRight, TrendingUp, ListChecks, Flame, Sparkles, Clock } from "lucide-react";
import CombinedActivityStrip from "../components/dashboard/CombinedActivityStrip";
import { formatRelativeTime } from "../utilities/time";

function getGreetings(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const codeforces = useCodeforcesStats(profile?.cfHandle);
  const leetcode = useLeetcodeStats(profile?.leetcodeHandle);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-mono text-sm text-slate-500 animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  const rankColor = getRankColor(codeforces.stats?.userInfo.rank ?? null);

  const totalSolved =
    (codeforces.stats?.solvedCount ?? 0) + (leetcode.stats?.solved.total ?? 0);

  const cfStreak = codeforces.stats?.streak.current ?? 0;
  const lcStreak = leetcode.stats?.streak.current ?? 0;
  const bestStreak = Math.max(
    cfStreak,
    lcStreak,
  );

  const anyData = codeforces.stats || leetcode.stats;

  const mostRecentLcSubmission = leetcode.stats?.recentSubmissions?.[0];

  const bestPlatform = (codeforces.stats?.solvedCount ?? 0) >= (leetcode.stats?.solved.total ?? 0) ? "Codeforces" : "LeetCode";

  return (
    <div className="p-8 max-w-6xl">
      {/* Hero */}
      <div className="mb-9">
        <h1 className="font-mono text-2xl font-semibold text-white mb-3">
          {getGreetings()}, {user?.name}
          <span className="cursor-blink text-indigo-400">█</span>
        </h1>

        {anyData ? (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="font-mono text-5xl font-bold text-white tracking-tight">
              {totalSolved.toLocaleString()}
            </span>
            <span className="font-mono text-sm text-slate-500">
              problems solved across platforms
            </span>
            {bestStreak > 0 && (
              <span className="font-mono text-sm text-orange-400 flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
                <Flame className="w-3.5 h-3.5" />
                {bestStreak} day streak
              </span>
            )}
          </div>
        ) : (
          <p className="font-mono text-sm text-slate-500">
            Link a platform handle in Profile to see your stats here.
          </p>
        )}
      </div>

      {/* Platform cards + quick facts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <Link
          to="/codeforces"
          className="bg-gradient-to-b from-[#15151F] to-[#0F0F16] border border-[#2D2D3F] hover:border-indigo-500/50 rounded-xl p-6 transition-colors group"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-mono text-sm font-semibold text-slate-300">
              Codeforces
            </h2>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>

          {!profile?.cfHandle ? (
            <p className="font-mono text-sm text-slate-500">
              Not linked — click to add your handle.
            </p>
          ) : codeforces.loading ? (
            <p className="font-mono text-sm text-slate-500 animate-pulse">
              Loading...
            </p>
          ) : codeforces.error ? (
            <p className="font-mono text-sm text-red-400">{codeforces.error}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp
                    className="w-3.5 h-3.5"
                    style={{ color: rankColor }}
                  />
                  <span className="font-mono text-xs text-slate-500">
                    Rating
                  </span>
                </div>
                <p
                  className="font-mono text-3xl font-bold"
                  style={{ color: rankColor }}
                >
                  {codeforces.stats?.userInfo.rating ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <span className="font-mono text-xs text-slate-500 block mb-1">
                    Solved
                  </span>
                  <p className="font-mono text-lg font-semibold text-white">
                    {codeforces.stats?.solvedCount ?? 0}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-xs text-slate-500 block mb-1">
                    Streak
                  </span>
                  {cfStreak > 0 ? (
                    <p className="font-mono text-lg font-semibold text-orange-400">
                      {cfStreak}d
                    </p>
                  ) : (
                    <p className="font-mono text-lg font-semibold text-slate-600">
                      —
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Link>

        <Link
          to="/leetcode"
          className="bg-gradient-to-b from-[#15151F] to-[#0F0F16] border border-[#2D2D3F] hover:border-indigo-500/50 rounded-xl p-6 transition-colors group"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-mono text-sm font-semibold text-slate-300">
              LeetCode
            </h2>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>

          {!profile?.leetcodeHandle ? (
            <p className="font-mono text-sm text-slate-500">
              Not linked — click to add your handle.
            </p>
          ) : leetcode.loading ? (
            <p className="font-mono text-sm text-slate-500 animate-pulse">
              Loading...
            </p>
          ) : leetcode.error ? (
            <p className="font-mono text-sm text-red-400">{leetcode.error}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono text-xs text-slate-500">
                    Solved
                  </span>
                </div>
                <p className="font-mono text-3xl font-bold text-indigo-400">
                  {leetcode.stats?.solved.total ?? 0}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <span className="font-mono text-xs text-slate-500 block mb-1">
                    Rank
                  </span>
                  <p className="font-mono text-lg font-semibold text-white">
                    {leetcode.stats?.ranking.globalRanking
                      ? `#${leetcode.stats.ranking.globalRanking.toLocaleString()}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-xs text-slate-500 block mb-1">
                    Contest
                  </span>
                  <p className="font-mono text-lg font-semibold text-white">
                    {leetcode.stats?.contest?.rating ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Link>

        {/* Quick facts card — replaces empty dead space with small,
            genuinely useful context pulled from data already in memory. */}
        <div className="bg-gradient-to-b from-[#15151F] to-[#0F0F16] border border-[#2D2D3F] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <h2 className="font-mono text-sm font-semibold text-slate-300">
              Quick Facts
            </h2>
          </div>

          {!anyData ? (
            <p className="font-mono text-sm text-slate-500">
              Link a handle to start seeing insights here.
            </p>
          ) : (
            <div className="space-y-4">
              {mostRecentLcSubmission && (
                <div className="flex items-start gap-2.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <p className="font-mono text-xs text-slate-400 leading-relaxed">
                    Last solved{" "}
                    <span className="text-white">
                      {mostRecentLcSubmission.title}
                    </span>{" "}
                    {formatRelativeTime(mostRecentLcSubmission.timestamp)}
                  </p>
                </div>
              )}

              {codeforces.stats && leetcode.stats && (
                <div className="flex items-start gap-2.5">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <p className="font-mono text-xs text-slate-400 leading-relaxed">
                    Ahead on <span className="text-white">{bestPlatform}</span>{" "}
                    right now
                  </p>
                </div>
              )}

              {!mostRecentLcSubmission && !(codeforces.stats && leetcode.stats) && (
                <p className="font-mono text-sm text-slate-500">
                  Keep solving — insights will show up here soon.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Combined activity strip */}
      {anyData && (
        <CombinedActivityStrip
          cfActivity={codeforces.stats?.codeforcesActivity ?? []}
          lcActivity={leetcode.stats?.activity ?? []}
        />
      )}
    </div>
  );

};

export default DashboardPage;
