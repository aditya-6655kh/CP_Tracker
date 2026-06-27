import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import DashboardLayout from "./components/layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import CodeforcesPage from "./pages/CodeforcesPage";
import LeetcodePage from "./pages/LeetcodePage";
import LandingPage from "./pages/LandingPage";

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      }
    />

    <Route
      element={
        <PrivateRoute>
          <ProfileProvider>
            <DashboardLayout />
          </ProfileProvider>
        </PrivateRoute>
      }
    >
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/codeforces" element={<CodeforcesPage />} />
      <Route path="/leetcode" element={<LeetcodePage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Route>

    <Route
      path="/"
      element={
        <PublicRoute>
          <LandingPage />
        </PublicRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
