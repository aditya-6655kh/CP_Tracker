import { createContext, useContext } from "react";
import type { Profile } from "../types";

interface ProfileContextTypes {
  profile: Profile | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextTypes | null>(null);


export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context)
    throw new Error("useProfile must be used within ProfileProvider");
  return context;
};
