// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from "react";
import { getCodeforcesStats, getLeetcodeStats } from "../api/stats.api";
import { getProfile } from "../api/profile.api";
import type { CodeforcesStats, Profile, LeetcodeStats } from "../types";
import { useAuth } from "../context/AuthContext";
import LeetcodeSection from "../components/dashboard/LeetcodeSection";
import CodeforcesSection from "../components/dashboard/CodeforcesSection";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [cfStats, setCfStats] = useState<CodeforcesStats | null>(null);
  const [cfLoading, setCfLoading] = useState(false);
  const [cfError, setCfError] = useState("");

  const [lcStats, setLcStats] = useState<LeetcodeStats | null>(null);
  const [lcLoading, setLcLoading] = useState(false);
  const [lcError, setLcError] = useState("");

  useEffect(() => {
    const loadProfileAndStats = async () => {
      let profileData: Profile | null = null;
      try {
        profileData = await getProfile();
        setProfile(profileData);
      } finally {
        setProfileLoading(false);
      }

      if (profileData?.cfHandle) {
        setCfLoading(true);
        getCodeforcesStats()
          .then(setCfStats)
          .catch((err) =>
            setCfError(
              err.response?.data?.message ?? "Failed to load Codeforces stats.",
            ),
          )
          .finally(() => setCfLoading(false));
      }

      if (profileData?.leetcodeHandle) {
        setLcLoading(true);
        getLeetcodeStats()
          .then(setLcStats)
          .catch((err) =>
            setLcError(
              err.response?.data?.message ?? "Failed to load Leetcode stats.",
            ),
          )
          .finally(() => setLcLoading(false));
      }
    };
    loadProfileAndStats();
  }, []);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-mono text-sm text-slate-500 animate-pulse">
          Loading dashboard....
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10">
      <div>
        <h1 className="font-mono text-2xl font-semibold text-white mb-1">
          Hey, {user?.name}
        </h1>
        <p className="font-mono text-sm text-slate-500">
          Here is your competetive programming overview.
        </p>
      </div>

      <CodeforcesSection
        handle={profile?.cfHandle ?? null}
        stats={cfStats}
        loading={cfLoading}
        error={cfError}
      />

      <LeetcodeSection
        handle={profile?.leetcodeHandle ?? null}
        stats={lcStats}
        loading={lcLoading}
        error={lcError}
      />
    </div>
  );
};

export default DashboardPage;
