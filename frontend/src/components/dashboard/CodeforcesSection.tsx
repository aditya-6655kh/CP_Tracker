import React from "react";
import { TrendingUp, Award, CheckCircle2, Code2, XCircle } from "lucide-react";
import type { CodeforcesStats } from "../../types";
import { getRankColor } from "../../utilities/codeforces";
import LinkHandlePrompt from "./LinkHandlePrompt";
import RatingChart from "./RatingChart";
import ActivityHeatmap from "./ActivityHeatmap";
import StreakCard from "./StreakCard";

interface Props {
  handle: string | null;
  stats: CodeforcesStats | null;
  loading: boolean;
  error: string;
}

const CodeforcesSection: React.FC<Props> = ({
  handle,
  stats,
  loading,
  error,
}) => {
  if (!handle) {
    return (
      <LinkHandlePrompt
        icon={Code2}
        platformName="Codeforces"
        description="Add your handle to start tracking ratings, solved problems, and submission history."
      />
    );
  }

  if (loading) {
    return (
      <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-8">
        <p className="font-mono text-sm text-slate-500 animate-pulse">
          Loading Codeforces stats...
        </p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 max-w-md">
        <p className="font-mono text-sm text-red-400">
          {error || "Failed to load Codeforces stats."}
        </p>
      </div>
    );
  }

  const { userInfo, solvedCount, submissionStats, ratingHistory, streak, codeforcesActivity } = stats;
  const rankColor = getRankColor(userInfo?.rank ?? null);
  const maxRankColor = getRankColor(userInfo?.maxRank ?? null);
  const total = submissionStats?.totalSubmissions ?? 0;
  const accepted = submissionStats?.accepted ?? 0;
  const wrongAnswer = submissionStats?.wrongAnswer ?? 0;
  const acceptanceRate =
    total > 0 ? ((accepted / total) * 100).toFixed(1) : "0.0";

  const breakdown = [
    { label: "Accepted", value: accepted, color: 'bg-green-500' },
    { label: "Wrong Answer", value: wrongAnswer, color: 'bg-red-500' },
    {
      label: "Time Limit Exceeded",
      value: submissionStats?.timeLimitExceeded ?? 0,
      color: 'bg-yellow-500'
    },
    {
      label: "Memory Limit Exceeded",
      value: submissionStats?.memoryLimitExceeded ?? 0,
      color: 'bg-orange-500'
    },
    { label: "Runtime Error", value: submissionStats?.runtimeError ?? 0, color: 'bg-purple-500' },
    {label: 'Compilation Error', value: submissionStats?.compilationError ?? 0, color: 'bg-blue-500'},
    { label: "Others", value: submissionStats?.other ?? 0, color: 'bg-slate-500' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-sm font-semibold text-slate-300">Codeforces</h2>
        <a
          href={`https://codeforces.com/profile/${userInfo?.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          @{userInfo?.handle}
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <span className="font-mono text-xs text-slate-500">Current Rating</span>
          </div>
          <p className="font-mono text-3xl font-bold" style={{ color: rankColor }}>
            {userInfo?.rating ?? '—'}
          </p>
          <p className="font-mono text-xs mt-1 capitalize" style={{ color: rankColor }}>
            {userInfo?.rank ?? ''}
          </p>
        </div>

        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-slate-500" />
            <span className="font-mono text-xs text-slate-500">Max Rating</span>
          </div>
          <p className="font-mono text-3xl font-bold" style={{ color: maxRankColor }}>
            {userInfo?.maxRating ?? '—'}
          </p>
          <p className="font-mono text-xs mt-1 capitalize" style={{ color: maxRankColor }}>
            {userInfo?.maxRank ?? ''}
          </p>
        </div>

        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
            <span className="font-mono text-xs text-slate-500">Problems Solved</span>
          </div>
          <p className="font-mono text-3xl font-bold text-white">{solvedCount ?? 0}</p>
          <p className="font-mono text-xs mt-1 text-slate-500">unique problems</p>
        </div>

        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-slate-500" />
            <span className="font-mono text-xs text-slate-500">Total Submissions</span>
          </div>
          <p className="font-mono text-3xl font-bold text-white">{total.toLocaleString()}</p>
        </div>

        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="font-mono text-xs text-slate-500">Accepted</span>
          </div>
          <p className="font-mono text-3xl font-bold text-green-400">
            {accepted.toLocaleString()}
          </p>
          <p className="font-mono text-xs mt-1 text-slate-500">{acceptanceRate}% rate</p>
        </div>

        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="font-mono text-xs text-slate-500">Wrong Answer</span>
          </div>
          <p className="font-mono text-3xl font-bold text-red-400">
            {wrongAnswer.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-6">
        <h3 className="font-mono text-sm font-semibold text-white mb-5">
          Submission Breakdown
        </h3>
        <div className="space-y-3.5">
          {breakdown.map(({ label, value, color }) => {
            const pct = total > 0 ? (value / total) * 100 : 0;
            return (
              <div key={label}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-mono text-xs text-slate-500">{label}</span>
                  <span className="font-mono text-xs text-white">
                    {value.toLocaleString()}{' '}
                    <span className="text-slate-500">({pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-[#2D2D3F] rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4"><StreakCard streak={streak}/></div>
        <div className="mt-4"><RatingChart ratingHistory={ratingHistory}/></div>
        <div className="mt-4"><ActivityHeatmap activity={codeforcesActivity}/></div>
      </div>
    </div>
  );
};

export default CodeforcesSection;