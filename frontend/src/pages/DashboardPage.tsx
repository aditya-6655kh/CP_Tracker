// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Award, CheckCircle2, Code2, XCircle } from "lucide-react";
import { getCodeforcesStats } from "../api/stats.api";
import { getProfile } from "../api/profile.api";
import type { CodeforcesStats, Profile } from "../types";
import { useAuth } from "../context/AuthContext";

// Matches Codeforces official rank colours
function getRankColor(rank: string | null): string {
  if (!rank) return "#64748B";
  const r = rank.toLowerCase();
  if (r.includes("legendary grandmaster")) return "#FF0000";
  if (r.includes("international grandmaster")) return "#FF0000";
  if (r.includes("grandmaster")) return "#FF0000";
  if (r.includes("international master")) return "#FF8C00";
  if (r.includes("master")) return "#FF8C00";
  if (r.includes("candidate master")) return "#AA00AA";
  if (r.includes("expert")) return "#6B90E8";
  if (r.includes("specialist")) return "#03A89E";
  if (r.includes("pupil")) return "#008000";
  return "#808080"; // newbie
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cfStats, setCfStats] = useState<CodeforcesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const profileData = await getProfile();
        setProfile(profileData);

        if (profileData?.cfHandle) {
          const stats = await getCodeforcesStats();
          setCfStats(stats);
        }
      } catch {
        setError("Failed to load stats. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-mono text-sm text-slate-500 animate-pulse">
          Loading stats...
        </p>
      </div>
    );
  }

  // No handle linked yet — prompt the user
  if (!profile?.cfHandle) {
    return (
      <div className="p-8">
        <h1 className="font-mono text-2xl font-semibold text-white mb-1">
          Hey, {user?.name} 👋
        </h1>
        <p className="font-mono text-sm text-slate-500 mb-8">
          Let's get your stats set up.
        </p>

        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-8 max-w-md">
          <Code2 className="w-7 h-7 text-indigo-400 mb-4" />
          <h2 className="font-mono text-white font-semibold mb-2">
            Link your Codeforces handle
          </h2>
          <p className="font-mono text-sm text-slate-500 mb-5">
            Add your handle to start tracking ratings, solved problems, and
            submission history.
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Go to Profile →
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 max-w-md">
          <p className="font-mono text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const userInfo        = cfStats?.userInfo;
  const solvedCount     = cfStats?.solvedCount ?? 0;
  const submissionStats = cfStats?.submissionStats;

  const total          = submissionStats?.totalSubmission ?? 0;
  const accepted       = submissionStats?.accepted ?? 0;
  const wrongAnswer    = submissionStats?.wrongAnswer ?? 0;
  const tle            = submissionStats?.timeLimitExceeded ?? 0;
  const runtimeError   = submissionStats?.runtimeError ?? 0;
  const mle            = submissionStats?.memoryLimitExceeded ?? 0;
  const compileError   = submissionStats?.compilationError ?? 0;
  const other          = submissionStats?.other ?? 0;

  const rankColor    = getRankColor(userInfo?.rank ?? null);
  const maxRankColor = getRankColor(userInfo?.maxRank ?? null);
  const acceptanceRate = total > 0
    ? ((accepted / total) * 100).toFixed(1)
    : '0.0';

  const breakdown = [
    { label: 'Accepted',              value: accepted,     color: 'bg-green-500' },
    { label: 'Wrong Answer',          value: wrongAnswer,  color: 'bg-red-500' },
    { label: 'Time Limit Exceeded',   value: tle,          color: 'bg-yellow-500' },
    { label: 'Runtime Error',         value: runtimeError, color: 'bg-orange-500' },
    { label: 'Memory Limit Exceeded', value: mle,          color: 'bg-purple-500' },
    { label: 'Compilation Error',     value: compileError, color: 'bg-blue-500' },
    { label: 'Other',                 value: other,        color: 'bg-slate-500' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-mono text-2xl font-semibold text-white mb-1">
          Hey, {user?.name} 👋
        </h1>
        <p className="font-mono text-sm text-slate-500">
          Codeforces:{' '}
          
            <a href={`https://codeforces.com/profile/${userInfo?.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {userInfo?.handle}
          </a>
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
          <p className="font-mono text-3xl font-bold text-white">{solvedCount}</p>
          <p className="font-mono text-xs mt-1 text-slate-500">unique problems</p>
        </div>

        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-slate-500" />
            <span className="font-mono text-xs text-slate-500">Total Submissions</span>
          </div>
          <p className="font-mono text-3xl font-bold text-white">
            {total.toLocaleString()}
          </p>
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
        <h2 className="font-mono text-sm font-semibold text-white mb-5">
          Submission Breakdown
        </h2>
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
                  <div
                    className={`h-full ${color} rounded-full`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

