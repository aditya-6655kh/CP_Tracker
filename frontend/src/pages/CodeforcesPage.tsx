import React from "react";
import { useProfile } from "../context/ProfileContext";
import { useStats } from "../context/StatsContext";
import CodeforcesSection from "../components/dashboard/CodeforcesSection";

const CodeforcesPage: React.FC = () => {
  const { profile, loading: profileLoading } = useProfile();
  const { cfStats: stats, cfLoading: loading, cfError: error } = useStats();

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
      <h1 className="font-mono text-2xl font-semibold text-white mb-6">
        Codeforces
      </h1>
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