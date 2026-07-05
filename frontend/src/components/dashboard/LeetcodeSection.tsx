import React from "react";
import { ExternalLink, Trophy, Target, ListChecks } from "lucide-react";
import type { LeetcodeStats } from "../../types";
import { formatRelativeTime } from "../../utilities/time";
import LinkHandlePrompt from "./LinkHandlePrompt";
import ActivityHeatmap from "./ActivityHeatmap";
import StreakCard from "./StreakCard";

interface Props {
  handle: string | null;
  stats: LeetcodeStats | null;
  loading: boolean;
  error: string;
}

const DIFFICULTY_COLORS = {
  easy: { bar: "bg-green-500", text: "text-green-400" },
  medium: { bar: "bg-yellow-500", text: "text-yellow-400" },
  hard: { bar: "bg-red-500", text: "text-red-400" },
};

const LeetcodeSection: React.FC<Props> = ({
  handle,
  stats,
  loading,
  error,
}) => {
  if (!handle) {
    return (
      <LinkHandlePrompt
        icon={ListChecks}
        platformName="Leetcode"
        description="Add your leetcode handle"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="font-mono text-sm text-slate-500 animate-pulse">
          Loading Leetcode stats...
        </p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 max-w-md">
        <p className="font-mono text-sm text-red-400">
          {error || "Failed to load leetcode stats."}
        </p>
      </div>
    );
  }

  const {
    solved,
    ranking,
    contest,
    recentSubmissions,
    username,
    activity,
    streak,
  } = stats;
  const difficulties = [
    { key: "easy" as const, label: "Easy", value: solved?.easy ?? 0 },
    { key: "medium" as const, label: "Medium", value: solved?.medium ?? 0 },
    { key: "hard" as const, label: "Hard", value: solved?.hard ?? 0 },
  ];
  const total = solved?.total ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-sm font-semibold text-slate-300">
          LeetCode
        </h2>
        <a
          href={`https://leetcode.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          @{username} <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Total solved */}
        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-4 h-4 text-slate-400" />
            <span className="font-mono text-xs font-medium text-slate-500">
              Total Solved
            </span>
          </div>
          <p className="font-mono text-3xl font-bold text-white">{total}</p>
        </div>
        {/* Gloabal ranking */}
        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-slate-500" />
            <span className="font-mono text-xs font-medium text-slate-500">
              Global Ranking
            </span>
          </div>
          <p className="font-mono text-3xl font-bold text-white">
            {ranking?.globalRanking
              ? `#${ranking.globalRanking.toLocaleString()}`
              : "—"}
          </p>
        </div>
        {/* Contest Rating - if available */}
        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-slate-500" />
            <span className="font-mono text-xs font-medium text-slate-500">
              Contest Rating
            </span>
          </div>
          <p className="font-mono text-3xl font-bold text-white">
            {contest?.rating ?? "-"}
          </p>
          {contest && (
            <p className="font-mono text-xs mt-1 text-slate-500">
              {contest.attendedContest} contests · top{" "}
              {contest.topPercentage?.toFixed(1)}%
            </p>
          )}
        </div>
        {/* Difficulty breakdown */}
        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
          <h3 className="font-mono text-sm font-semibold text-white mb-5">
            Difficulty Breakdown
          </h3>
          <div className="space-y-3.5">
            {difficulties.map(({ key, label, value }) => {
              const pct = total > 0 ? (value / total) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1.5">
                    <span
                      className={`font-mono text-xs ${DIFFICULTY_COLORS[key].text}`}
                    >
                      {label}
                    </span>
                    <span className="font-mono text-xs text-white">
                      {value}{" "}
                      <span className="text-slate-500">{pct.toFixed(1)}%</span>
                    </span>
                  </div>

                  <div className="h-1.5 bg-[#2D2D3F] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${DIFFICULTY_COLORS[key].bar} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      {recentSubmissions && recentSubmissions.length > 0 && (
        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
          <h3 className="font-mono text-sm font-semibold text-white mb-4">
            Recent Submissions
          </h3>
          <div className="space-y-2.5">
            {recentSubmissions.slice(0, 5).map((sub) => (
              <a
                key={sub.titleSlug + sub.timestamp}
                href={`https://leetcode.com/problems/${sub.titleSlug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-1.5 group"
              >
                <span className="font-mono text-sm text-slate-300 group-hover:text-indigo-400 transition-colors truncate">
                  {sub.title}
                </span>
                <span className="font-mono text-xs text-slate-500 flex-shrink-0 ml-3">
                  {formatRelativeTime(sub.timestamp)}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <StreakCard streak={{ current: streak.current, max: streak.current }} />
      </div>
      <div className="mt-4">
        <ActivityHeatmap activity={activity} />
      </div>
    </div>
  );
};

export default LeetcodeSection;