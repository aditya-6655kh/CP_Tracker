import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useLeetcodeStats } from "../hooks/useLeetcodeStats";
import { useCodeforcesStats } from "../hooks/useCodeforcesStats";
import { getRankColor } from "../utilities/codeforces";
import { ArrowRight, TrendingUp } from "lucide-react";

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-mono text-2xl font-semibold text-white mb-1">
          Hey, {user?.name}
        </h1>
        <p className="font-mono text-sm text-slate-500">
          Here's your competitive programming overview.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* codeforces summary */}
        <Link
          to="/codeforces"
          className="bg-[#12121A] border border-[#2D2D3F] hover:border-indigo-500/50 rounded-xl p-6 transitions-colors group"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-mono text-sm font-semibold text-slate-300">
              Codeforces
            </h2>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>

          {!profile?.cfHandle ? (
            <p className="font-mono text-sm text-slate-500">
              Not linked- click to add your handle.
            </p>
          ) : codeforces.loading ? (
            <p className="font-mono text-sm text-slate-500 animate-pulse">
              Loading...
            </p>
          ) : codeforces.error ? (
            <p className="font-mono text-sm text-red-400">{codeforces.error}</p>
          ) : (
            <div className="flex items-end gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono text-xs text-slate-500">
                    Rating
                  </span>
                </div>
                <p
                  className="font-mono text-2xl font-bold"
                  style={{ color: rankColor }}
                >
                  {codeforces.stats?.userInfo.rating ?? "-"}
                </p>
              </div>

              <div>
                <span className="font-mono text-xs text-slate-500 block mb-1.5">
                  Solved
                </span>
                <p className="font-mono text-2xl font-bold text-white">
                  {codeforces.stats?.solvedCount ?? 0}
                </p>
              </div>

              <div>
                <span className="font-mono text-xs text-slate-500 block mb-1.5">
                  Streak
                </span>
                <p className="font-mono text-2xl font-bold text-white">
                  {codeforces.stats?.streak.current ?? 0}d
                </p>
              </div>
            </div>
          )}
        </Link>

        {/* leetcode summary */}
        <Link
          to="/leetcode"
          className="bg-[#12121A] border border-[#2D2D3F] hover:border-indigo-500/50 rounded-xl p-6 transitions-colors group"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-mono text-sm font-semibold text-slate-300">
              LeetCode
            </h2>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>

          {!profile?.leetcodeHandle ? (
            <p className="font-mono text-sm text-slate-500">
              Not linked- click to add your handle.
            </p>
          ) : leetcode.loading ? (
            <p className="font-mono text-sm text-slate-500 animate-pulse">
              Loading...
            </p>
          ) : leetcode.error ? (
            <p className="font-mono text-sm text-red-400">{leetcode.error}</p>
          ) : (
            <div className="flex items-end gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono text-xs text-slate-500">
                    Solved
                  </span>
                </div>
                <p
                  className="font-mono text-2xl font-bold"
                  style={{ color: rankColor }}
                >
                  {leetcode.stats?.solved.total ?? "-"}
                </p>
              </div>

              <div>
                <span className="font-mono text-xs text-slate-500 block mb-1.5">
                  Rank
                </span>
                <p className="font-mono text-2xl font-bold text-white">
                  {leetcode.stats?.ranking.globalRanking
                    ? `#${leetcode.stats.ranking.globalRanking.toLocaleString()}`
                    : "—"}
                </p>
              </div>

              <div>
                <span className="font-mono text-xs text-slate-500 block mb-1.5">
                  Contest
                </span>
                <p className="font-mono text-2xl font-bold text-white">
                  {leetcode.stats?.contest.rating ?? "-"}
                </p>
              </div>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
