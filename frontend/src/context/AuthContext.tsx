import { AuthContext } from "./auth-context";
import React, { useEffect, useState } from "react";
import type { User } from "../types";
import { getMe } from "../api/auth.api";


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem("token");
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getMe();
        setUser(userData);
      } catch {
        localStorage.removeItem("token");
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = (newToken: string, user: User) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
