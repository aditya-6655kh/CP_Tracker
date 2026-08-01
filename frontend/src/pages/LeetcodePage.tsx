import React from "react";
import { useProfile } from "../context/ProfileContext";
import { useStats } from "../context/StatsContext";
import LeetcodeSection from "../components/dashboard/LeetcodeSection";

const LeetcodePage: React.FC = () => {
  const { profile, loading: profileLoading } = useProfile();
  const { lcStats: stats, lcLoading: loading, lcError: error } = useStats();

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
        LeetCode
      </h1>
      <LeetcodeSection
        handle={profile?.leetcodeHandle ?? null}
        stats={stats}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default LeetcodePage;