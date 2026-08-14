import React from "react";
import { RefreshCw } from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import { useStats } from "../context/StatsContext";
import CodeforcesSection from "../components/dashboard/CodeforcesSection";

const CodeforcesPage: React.FC = () => {
  const { profile, loading: profileLoading } = useProfile();
  const { cfStats: stats, cfLoading: loading, cfError: error, refreshCf } = useStats();

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-mono text-sm text-slate-500 animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-2xl font-semibold text-white">
          Codeforces
        </h1>
        <button
          onClick={refreshCf}
          disabled={loading}
          className="flex items-center gap-2 font-mono text-xs text-slate-400 hover:text-white bg-[#15151F] hover:bg-[#1E1E2E] border border-[#2D2D3F] hover:border-indigo-500/50 rounded-lg px-3 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <CodeforcesSection
        handle={profile?.cfHandle ?? null}
        stats={stats}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default CodeforcesPage;