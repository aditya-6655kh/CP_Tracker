import { createContext, useContext } from "react";
import type { User } from "../types";

interface AuthContext {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContext | null>(null);


export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context) throw new Error('use auth must be used within authprovider.');
    return context;
}
