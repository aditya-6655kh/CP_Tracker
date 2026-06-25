import React, {
  useContext,
  useEffect,
  useState,
  createContext,
  useCallback,
} from "react";
import { getProfile } from "../api/profile.api";
import type { Profile } from "../types";

interface ProfileContextTypes {
  profile: Profile | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextTypes | null>(null);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState(null);
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

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context)
    throw new Error("useProfile must be used within ProfileProvider");
  return context;
};
