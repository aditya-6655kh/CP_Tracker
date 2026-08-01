import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, User, LogOut, Trophy, Code2, ListChecks, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { label: "Codeforces", to: "/codeforces", icon: Code2 },
  { label: "Leetcode", to: "/leetcode", icon: ListChecks },
  { label: "Profile", to: "/profile", icon: User },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close sidebar on nav click (mobile only)
  const handleNavClick = () => {
    onClose();
  };

  return (
    <>
      {/* Overlay backdrop — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-60 bg-[#0E0E16] border-r border-[#2D2D3F] flex flex-col z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="px-6 py-5 border-b border-[#2D2D3F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-indigo-400" />
            <span className="font-mono text-sm font-semibold text-white tracking-wide">
              CP Tracker
            </span>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ label, to, icon: Icon }) => {
            return (
              <NavLink
                key={to}
                to={to}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-colors ${isActive ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-[#2D2D3F] space-y-1">
          <div className="px-3 py-2">
            <p className="font-mono text-xs text-white truncate">{user?.name}</p>
            <p className="font-mono text-xs text-slate-500 truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-colors"
          >
              <LogOut className="w-4 h-4"/>
              Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;