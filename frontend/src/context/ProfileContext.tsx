import { ProfileContext } from "./profile-context";
import React, {
  useEffect,
  useState,
  useCallback,
} from "react";
import { getProfile } from "../api/profile.api";
import type { Profile } from "../types";


export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProfile();
      setProfile(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <ProfileContext.Provider
      value={{ profile, loading, refetch: fetchProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
